"""
Chart type recommender: given a data shape analysis,
recommends the best chart type and axis mapping.
"""


def recommend_chart(analysis: dict, columns: list[str], rows: list[dict]) -> dict | None:
    """
    Recommend a chart configuration based on data analysis.

    Returns:
        {
            "type": "bar" | "line" | "pie" | "scatter" | "area",
            "x_column": str,
            "y_columns": [str, ...],
            "title": str,
            "x_label": str,
            "y_label": str,
        }
        or None if no chart is appropriate.
    """
    shape = analysis.get("data_shape", "empty")
    date_cols = analysis.get("date_columns", [])
    numeric_cols = analysis.get("numeric_columns", [])
    categorical_cols = analysis.get("categorical_columns", [])
    total_rows = analysis.get("total_rows", 0)

    if shape == "empty" or total_rows == 0:
        return None

    if shape == "single_value":
        return None  # Single values don't need charts

    # ── Time Series: line chart ──
    if shape == "time_series":
        x = date_cols[0]
        y = numeric_cols[:3]  # max 3 lines

        # Skip if all date values are the same (no time variation)
        unique_dates = len(set(str(row.get(x, "")) for row in rows))
        if unique_dates <= 1:
            return None

        # Skip if only numeric column is 'id' (not meaningful to plot)
        meaningful_y = [c for c in y if c.lower() not in ("id", "pk", "index")]
        if not meaningful_y:
            return None

        return {
            "type": "line",
            "x_column": x,
            "y_columns": meaningful_y,
            "title": _auto_title(meaningful_y, "Over Time"),
            "x_label": _prettify(x),
            "y_label": _prettify(meaningful_y[0]) if len(meaningful_y) == 1 else "Value",
        }

    # ── Skip charts for raw entity listings ──
    # If categorical columns significantly outnumber numeric, it's raw data
    id_like = {"id", "pk", "index", "key"}
    real_numeric = [c for c in numeric_cols if c.lower() not in id_like]
    if not real_numeric and len(categorical_cols) >= 3:
        return None

    # ── Categorical: bar or pie ──
    if shape == "categorical" and categorical_cols and numeric_cols:
        x = categorical_cols[0]
        y = numeric_cols[:3]
        unique_values = len(set(str(row.get(x, "")) for row in rows))

        # Pie chart for small unique counts with single metric
        if unique_values <= 8 and len(y) == 1 and total_rows <= 10:
            return {
                "type": "pie",
                "x_column": x,
                "y_columns": y,
                "title": _auto_title(y, f"by {_prettify(x)}"),
                "x_label": _prettify(x),
                "y_label": _prettify(y[0]),
            }

        # Bar chart
        return {
            "type": "bar",
            "x_column": x,
            "y_columns": y,
            "title": _auto_title(y, f"by {_prettify(x)}"),
            "x_label": _prettify(x),
            "y_label": _prettify(y[0]) if len(y) == 1 else "Value",
        }

    # ── Multi numeric: scatter ──
    if shape == "multi_numeric" and len(numeric_cols) >= 2:
        return {
            "type": "scatter",
            "x_column": numeric_cols[0],
            "y_columns": [numeric_cols[1]],
            "title": f"{_prettify(numeric_cols[0])} vs {_prettify(numeric_cols[1])}",
            "x_label": _prettify(numeric_cols[0]),
            "y_label": _prettify(numeric_cols[1]),
        }

    # ── Fallback: bar chart if we have at least 2 columns with numeric data ──
    if len(columns) >= 2 and total_rows > 1:
        x = columns[0]
        y = [c for c in columns[1:] if c in numeric_cols]
        if not y:
            return None  # No numeric columns to chart — skip
        return {
            "type": "bar",
            "x_column": x,
            "y_columns": y[:3],
            "title": _auto_title(y[:3], f"by {_prettify(x)}"),
            "x_label": _prettify(x),
            "y_label": _prettify(y[0]) if len(y) == 1 else "Value",
        }

    return None


def _prettify(name: str) -> str:
    """Convert column_name to Column Name."""
    return name.replace("_", " ").replace("-", " ").title()


def _auto_title(y_columns: list[str], suffix: str) -> str:
    """Generate a chart title from y columns and a suffix."""
    if len(y_columns) == 1:
        return f"{_prettify(y_columns[0])} {suffix}"
    names = ", ".join(_prettify(c) for c in y_columns[:2])
    return f"{names} {suffix}"
