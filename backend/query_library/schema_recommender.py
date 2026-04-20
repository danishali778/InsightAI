"""
Generates query template recommendations from a database schema using the LLM.
Templates are generated asynchronously and cached per connection_id.
"""
import json
import re
import uuid
import asyncio
import traceback
from dataclasses import dataclass
from typing import Optional

from langchain_core.messages import HumanMessage, SystemMessage

CATEGORY_COLORS: dict[str, str] = {
    "Sales": "#22d3a5",
    "Marketing": "#00e5ff",
    "Finance": "#f59e0b",
    "Operations": "#f87171",
    "Analytics": "#c084fc",
    "Users": "#60a5fa",
}

CATEGORY_ICON_BG: dict[str, str] = {
    "Sales": "#1a3a2a",
    "Marketing": "#1a1a3a",
    "Finance": "#2a1a1a",
    "Operations": "#2a2a1a",
    "Analytics": "#1a2a3a",
    "Users": "#1a1a2a",
}

VALID_CATEGORIES = set(CATEGORY_COLORS.keys())
VALID_DIFFICULTIES = {"beginner", "intermediate", "advanced"}


@dataclass
class DynamicTemplate:
    id: str
    connection_id: str
    title: str
    description: str
    sql: str
    category: str
    category_color: str
    tags: list
    icon: str
    icon_bg: str
    difficulty: str


# Per-connection cache
_cache: dict[str, list[DynamicTemplate]] = {}
_by_id: dict[str, DynamicTemplate] = {}
_status: dict[str, str] = {}  # 'generating' | 'ready' | 'error'
_lock = asyncio.Lock()


def get_status(connection_id: str) -> str:
    return _status.get(connection_id, "not_started")


def get_templates(connection_id: str) -> list[DynamicTemplate]:
    return _cache.get(connection_id, [])


def get_template_by_id(template_id: str) -> Optional[DynamicTemplate]:
    return _by_id.get(template_id)


async def clear_connection(connection_id: str) -> None:
    """Called when a DB connection is disconnected — clears its cached templates."""
    async with _lock:
        old = _cache.pop(connection_id, [])
        for t in old:
            _by_id.pop(t.id, None)
        _status.pop(connection_id, None)


async def generate_in_background(connection_id: str, schema_text: str, db_type: str) -> None:
    """Fire and forget template generation."""
    async with _lock:
        _status[connection_id] = "generating"
    
    # Run in background without awaiting the full process
    asyncio.create_task(_run_generation_task(connection_id, schema_text, db_type))


async def _run_generation_task(connection_id: str, schema_text: str, db_type: str) -> None:
    try:
        from ai_core.sql_generator import get_llm
        llm = get_llm()

        prompt = f"""You are a senior data analyst. Analyze the database schema below and generate exactly 6 useful SQL SELECT queries that provide real business insights.

Database type: {db_type}

Schema:
{schema_text}

Return ONLY a valid JSON array with exactly 6 objects. No markdown, no explanation, no code blocks — just the raw JSON array.

Each object must have these exact fields:
- "title": concise query name, max 50 characters
- "description": one sentence explaining the business value of this query
- "sql": a complete, valid SELECT query using ONLY tables and columns from the schema above
- "category": one of exactly ["Sales", "Marketing", "Finance", "Operations", "Analytics", "Users"] — pick the most relevant
- "tags": array of 2-3 lowercase keyword strings
- "icon": a single relevant emoji character
- "difficulty": one of ["beginner", "intermediate", "advanced"]

Rules for the SQL:
- Use ONLY table names and column names that appear in the schema
- SELECT only — no INSERT, UPDATE, DELETE, DROP, or DDL
- Use proper JOINs based on foreign keys shown in schema
- Add GROUP BY with aggregate functions where appropriate
- Add ORDER BY and LIMIT 100 to all queries
- Use column aliases for readability"""

        response = await llm.ainvoke([
            SystemMessage(content="You are a SQL expert. Output only raw JSON arrays with no surrounding text or markdown."),
            HumanMessage(content=prompt),
        ])

        raw = response.content.strip()
        
        try:
            templates = _parse_response(connection_id, raw)
        except Exception as parse_err:
            print(f"[AI] JSON Parsing Error: {str(parse_err)}")
            raise parse_err

        async with _lock:
            old = _cache.get(connection_id, [])
            for t in old:
                _by_id.pop(t.id, None)
            _cache[connection_id] = templates
            for t in templates:
                _by_id[t.id] = t
            _status[connection_id] = "ready"

    except Exception as e:
        print(f"[AI] ERROR: Generation failed for connection {connection_id}")
        traceback.print_exc()
        async with _lock:
            _status[connection_id] = "error"


def _parse_response(connection_id: str, raw: str) -> list[DynamicTemplate]:
    # 1. Strip markdown fences if LLM added them anyway
    raw = re.sub(r'```json\s*', '', raw)
    raw = re.sub(r'```\s*', '', raw)
    
    # 2. Extract only the JSON array [ ... ]
    start = raw.find('[')
    end = raw.rfind(']')
    
    if start != -1:
        if end == -1 or end < start:
            # TRUNCATION DETECTED
            last_brace = raw.rfind('}')
            if last_brace != -1:
                raw = raw[start:last_brace+1] + "]"
        else:
            raw = raw[start:end+1]
    
    raw = raw.strip()
    if not raw:
        return []

    data = json.loads(raw)
    templates: list[DynamicTemplate] = []

    for item in data:
        sql = str(item.get("sql", "")).strip()
        if not sql:
            continue

        category = item.get("category", "Analytics")
        if category not in VALID_CATEGORIES:
            category = "Analytics"

        difficulty = item.get("difficulty", "beginner")
        if difficulty not in VALID_DIFFICULTIES:
            difficulty = "beginner"

        tpl = DynamicTemplate(
            id=f"{connection_id}_{str(uuid.uuid4())[:6]}",
            connection_id=connection_id,
            title=str(item.get("title", "Query"))[:60],
            description=str(item.get("description", ""))[:200],
            sql=sql,
            category=category,
            category_color=CATEGORY_COLORS[category],
            tags=[str(t).lower() for t in item.get("tags", [])[:4]],
            icon=str(item.get("icon", "📊")),
            icon_bg=CATEGORY_ICON_BG.get(category, "#1a2a3a"),
            difficulty=difficulty,
        )
        templates.append(tpl)

    return templates
