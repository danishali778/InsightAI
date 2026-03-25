"""
Data shape analyzer: inspects query result columns and rows
to determine the best visualization approach.
"""

from datetime import datetime
import re


def analyze_data_shape(columns: list[str], rows: list[dict]) -> dict:
    """
    Analyze the shape of query results and classify columns.

    Returns:
        {
            "total_rows": int,
            "total_columns": int,
            "column_types": { "col_name": "date" | "numeric" | "categorical" },
            "has_date_column": bool,
            "has_numeric_columns": bool,
            "date_columns": [...],
            "numeric_columns": [...],
            "categorical_columns": [...],
            "data_shape": "time_series" | "categorical" | "single_value" | "multi_numeric" | "empty"
        }
    """
    if not columns or not rows:
        return {
            "total_rows": 0,
            "total_columns": 0,
            "column_types": {},
            "has_date_column": False,
            "has_numeric_columns": False,
            "date_columns": [],
            "numeric_columns": [],
            "categorical_columns": [],
            "data_shape": "empty",
        }

    column_types = {}
    date_columns = []
    numeric_columns = []
    categorical_columns = []

    for col in columns:
        col_type = _detect_column_type(col, rows)
        column_types[col] = col_type
        if col_type == "date":
            date_columns.append(col)
        elif col_type == "numeric":
            numeric_columns.append(col)
        else:
            categorical_columns.append(col)

    # Determine overall data shape
    data_shape = _classify_shape(
        rows=rows,
        date_columns=date_columns,
        numeric_columns=numeric_columns,
        categorical_columns=categorical_columns,
    )

    return {
        "total_rows": len(rows),
        "total_columns": len(columns),
        "column_types": column_types,
        "has_date_column": len(date_columns) > 0,
        "has_numeric_columns": len(numeric_columns) > 0,
        "date_columns": date_columns,
        "numeric_columns": numeric_columns,
        "categorical_columns": categorical_columns,
        "data_shape": data_shape,
    }


def _detect_column_type(col_name: str, rows: list[dict]) -> str:
    """Detect if a column is date, numeric, or categorical."""
    # Check column name hints for numeric patterns
    numeric_hints = ["count", "total", "sum", "avg", "amount", "price", "quantity", "revenue", "cost", "profit", "sales", "rate", "percent", "num_", "number"]
    col_lower = col_name.lower()
    if any(hint in col_lower for hint in numeric_hints):
        return "numeric"

    # Check column name hints for date patterns
    date_hints = ["date", "time", "created", "updated", "timestamp", "month", "year", "day", "week", "quarter"]
    if any(hint in col_lower for hint in date_hints):
        return "date"

    # Sample values (check first 20 rows)
    sample = [row.get(col_name) for row in rows[:20] if row.get(col_name) is not None]
    if not sample:
        return "categorical"

    # Check if numeric
    numeric_count = 0
    date_count = 0
    for val in sample:
        if isinstance(val, (int, float)):
            numeric_count += 1
        elif isinstance(val, str):
            # Try parsing as number
            try:
                float(val.replace(",", "").replace("$", "").replace("%", ""))
                numeric_count += 1
                continue
            except (ValueError, AttributeError):
                pass
            # Try parsing as date
            if _is_date_string(val):
                date_count += 1
        else:
            # Handle Decimal, numpy types, and other numeric-like objects
            try:
                float(val)
                numeric_count += 1
            except (ValueError, TypeError):
                pass

    threshold = len(sample) * 0.7
    if numeric_count >= threshold:
        return "numeric"
    if date_count >= threshold:
        return "date"
    return "categorical"


def _is_date_string(val: str) -> bool:
    """Check if a string looks like a date."""
    date_patterns = [
        r"\d{4}-\d{2}-\d{2}",       # 2024-01-15
        r"\d{2}/\d{2}/\d{4}",       # 01/15/2024
        r"\d{4}/\d{2}/\d{2}",       # 2024/01/15
        r"\w+ \d{1,2},? \d{4}",     # Jan 15, 2024
    ]
    for pattern in date_patterns:
        if re.match(pattern, str(val).strip()):
            return True
    try:
        datetime.fromisoformat(str(val).replace("Z", "+00:00"))
        return True
    except (ValueError, TypeError):
        pass
    return False


def _classify_shape(
    rows: list[dict],
    date_columns: list[str],
    numeric_columns: list[str],
    categorical_columns: list[str],
) -> str:
    """Classify the overall data shape for visualization."""
    if len(rows) == 1 and len(numeric_columns) <= 2:
        return "single_value"

    if date_columns and numeric_columns:
        return "time_series"

    if categorical_columns and numeric_columns:
        return "categorical"

    if len(numeric_columns) >= 2 and not categorical_columns:
        return "multi_numeric"

    if categorical_columns and not numeric_columns:
        return "categorical"

    return "categorical"  # default
