import json
import re
from decimal import Decimal
from datetime import date, datetime, time
from .sql_generator import get_llm
from langchain_core.messages import SystemMessage, HumanMessage


def _json_serializable(obj):
    if isinstance(obj, Decimal):
        return float(obj)
    if isinstance(obj, (datetime, date, time)):
        return obj.isoformat()
    raise TypeError(f"Object of type {type(obj)} is not JSON serializable")


def generate_visualization_blueprint(user_message: str, sql: str, preview_rows: list[dict], column_metadata: dict) -> dict | None:
    """
    Call the LLM to analyze the query context and results, and return an explicit chart blueprint.
    """
    if not preview_rows:
        return None

    system_prompt = """You are a Data Visualization Expert embedded in a SQL query tool.

You receive:
- The user's plain English question
- The generated SQL query
- Column metadata (name + type)
- A preview of the query result rows

Your job is to output a single JSON object that tells the frontend
exactly how to render the best chart.

═══════════════════════════════════════
STEP 1 — CLASSIFY EVERY COLUMN
═══════════════════════════════════════
Go through each column in the metadata and assign it one of:
  NUMERIC   → any number: integer, float, sum, avg, count, revenue
  CATEGORY  → text with low cardinality: name, label, country, status, type
  TEMPORAL  → date, datetime, month, year, week
  ID        → primary keys, foreign keys — ignore for visualization

═══════════════════════════════════════
STEP 2 — DETECT DATA SHAPE
═══════════════════════════════════════
After classifying columns, detect which shape the data is:

SHAPE A — Simple (1 CATEGORY + 1 NUMERIC)
  Example: supplier_name, avg_rating
  → Use bar, pie, or donut

SHAPE B — Time Series (1 TEMPORAL + 1 NUMERIC)
  Example: month, total_revenue
  → Use line or area

SHAPE C — GROUPED (1 CATEGORY + 1 CATEGORY + 1 NUMERIC)
  Example: category_name, country_name, total_revenue
  → MUST use grouped bar chart
  → First CATEGORY  = x_column
  → Second CATEGORY = color_column
  → NUMERIC         = y_columns
  → Extra columns   = tooltip_columns ONLY

  ⚠ CRITICAL: Never plot GROUPED data row-by-row.
  Always group by x_column and split series by color_column.
  Signal words: "broken down by", "by country", "per region",
  "split by", "grouped by", "compare across"

SHAPE D — Multi Metric (1 CATEGORY + 2 or more NUMERICs)
  Example: product_name, total_revenue, total_units_sold
  → Use grouped bar or dual-axis line

SHAPE E — No grouping dimension (Multiple Rows)
  → Use table

SHAPE F — Single Metric (Exactly 1 Row + 1 or more NUMERIC columns)
  Example: count(*), sum(revenue), avg_rating
  → Use KPI card
  → x_column = null
  → y_columns = ["total_revenue"]

═══════════════════════════════════════
STEP 3 — PICK THE DEFAULT CHART TYPE
═══════════════════════════════════════
  IF row count == 1 and numeric columns exist
    → ALWAYS "kpi"
    → NEVER bar, pie, line, or area for a single data point

  IF SHAPE B (temporal exists)
    IF user intent mentions "volume", "growth", "cumulative" → "area"
    ELSE → "line"

  IF SHAPE C (two categories + one numeric)
    → ALWAYS "bar" with color_column set
    → NEVER pie, line, or area for this shape

  IF SHAPE A and user intent mentions
  "share", "proportion", "breakdown", "composition"
  AND row count <= 7
    → "pie"

  IF SHAPE A and user intent mentions
  "compare", "top", "highest", "lowest", "ranked"
    → "bar"

  IF SHAPE D (multiple numerics)
    → "bar" grouped or "line" if temporal

  DEFAULT → "bar"

═══════════════════════════════════════
OUTPUT FORMAT
═══════════════════════════════════════
Return ONLY this JSON — no explanation, no text outside the block:
```json
{
  "type": "bar | line | pie | area | kpi",
  "title": "<short human readable chart title>",

  "x_column": "<column name for X axis or slice labels>",
  "y_columns": ["<primary numeric column>"],
  "color_column": "<second category column for grouping, or null>",
  "tooltip_columns": ["<extra columns shown only in tooltip>"],

  "x_label": "<human readable X axis label>",
  "y_label": "<human readable Y axis label>",

  "is_grouped": true or false,
  "is_dual_axis": true or false,

  "chart_notes": "<one sentence explaining why this chart was chosen>"
}
```

═══════════════════════════════════════
HARD RULES — NEVER BREAK THESE
═══════════════════════════════════════
1. NEVER plot grouped data row-by-row — always set color_column
2. NEVER use pie if row count > 7
3. NEVER use line or area if x_column is a non-temporal category
4. ALWAYS put extra columns in tooltip_columns — never on an axis
5. ALWAYS set is_grouped: true when color_column is not null
6. DUAL AXIS: Set `is_dual_axis: true` if numeric columns have vastly different scales (e.g. comparing Salaries in 100k vs. Counts in 10s, or currency vs. percentages).
7. Return ONLY the JSON — nothing outside the code block
"""

    human_message = f"""Here is the query context.

User's Question: {user_message}

Generated SQL:
{sql}

Column Metadata:
{json.dumps(column_metadata, indent=2, default=_json_serializable)}

Data Preview (first 5 rows):
{json.dumps(preview_rows, indent=2, default=_json_serializable)}

Based on this, generate the optimal chart visualization JSON blueprint.
"""

    llm = get_llm()
    messages = [
        SystemMessage(content=system_prompt),
        HumanMessage(content=human_message)
    ]
    
    response = llm.invoke(messages)
    content = response.content

    print(f"[visualization_agent] Raw LLM response:\n{content}")

    # Extract JSON
    match = re.search(r'```json\s*(.*?)\s*```', content, re.DOTALL | re.IGNORECASE)
    if match:
        json_str = match.group(1).strip()
    else:
        # Fallback to finding the first {
        match = re.search(r'({.*})', content, re.DOTALL)
        if match:
            json_str = match.group(1).strip()
        else:
            return None

    try:
        blueprint = json.loads(json_str)
        chart_type = blueprint.get("type")
        if chart_type == "table":
            # Table needs no axis columns — return as-is
            return blueprint
            
        if chart_type == "kpi":
            # KPI only needs y_columns — x_column can be null
            if blueprint.get("y_columns"):
                return blueprint
                
        if chart_type and blueprint.get("x_column") and blueprint.get("y_columns"):
            return blueprint
        print(f"[visualization_agent] Blueprint missing required fields: {list(blueprint.keys())}")
    except json.JSONDecodeError:
        print(f"[visualization_agent] Failed to parse JSON: {json_str}")

    return None
