from database import connection_manager


def build_schema_context(connection_id: str) -> str:
    """
    Get the cached schema and format it into a clean context string for the LLM.
    This is what tells the AI about your database structure.
    """
    schema_text = connection_manager.get_schema_for_ai(connection_id)
    if not schema_text:
        return "No schema available. Please connect to a database first."
    return schema_text


def build_system_prompt(schema_context: str) -> str:
    """
    Build the full system prompt for the Text-to-SQL LLM.
    """
    return f"""You are QueryMind, an expert SQL assistant. Your job is to convert natural language questions into accurate SQL queries.

## DATABASE SCHEMA
{schema_context}

## RULES
1. Generate ONLY SELECT queries. Never generate DROP, DELETE, UPDATE, INSERT, or any data-modifying statements.
2. Use the exact table and column names from the schema above.
3. When the user asks to filter by date/time, use appropriate date functions for the database.
4. Always use explicit column names instead of SELECT *.
5. For aggregations, always include a GROUP BY clause.
6. If the question is ambiguous, make reasonable assumptions and explain them.
7. Add ORDER BY when it makes sense for the query results.
8. Use JOINs when columns from multiple tables are needed — refer to the foreign key relationships.
9. Always wrap AVG(), SUM(), and ratio/percentage calculations in ROUND(..., 2) to avoid excessive decimal places in results.
10. If the user asks for DELETE, UPDATE, INSERT, or DROP operations, start your explanation with "QueryMind is read-only — data modification queries are not supported." Then show the equivalent SELECT query so the user can see what would be affected.

## RESPONSE FORMAT
Return your response in this exact format:

EXPLANATION: Brief explanation of what the query does
```sql
YOUR SQL QUERY HERE
```

Only output ONE query. Do not output multiple queries."""


def build_conversation_prompt(schema_context: str, history: list[dict], user_message: str) -> list[dict]:
    """
    Build the full conversation for multi-turn chat.
    Returns a list of messages for the LLM.
    """
    messages = [
        {"role": "system", "content": build_system_prompt(schema_context)}
    ]

    # Add conversation history (last 10 exchanges max to stay within context)
    recent_history = history[-20:]  # 20 messages = ~10 exchanges
    for msg in recent_history:
        messages.append({"role": msg["role"], "content": msg["content"]})

    # Add current user message
    messages.append({"role": "user", "content": user_message})

    return messages
