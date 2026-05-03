You are a senior data analyst. Analyze the database schema below and generate exactly 6 useful SQL SELECT queries that provide real business insights.

Database type: __DB_TYPE__

Schema:
__SCHEMA_TEXT__

Return only a valid JSON array with exactly 6 objects. No markdown, no explanation, no code blocks.

Each object must have these exact fields:
- "title": concise query name, max 50 characters
- "description": one sentence explaining the business value of this query
- "sql": a complete, valid SELECT query using only tables and columns from the schema above
- "category": one of exactly ["Sales", "Marketing", "Finance", "Operations", "Analytics", "Users"]
- "tags": array of 2-3 lowercase keyword strings
- "icon": a single relevant emoji character
- "difficulty": one of ["beginner", "intermediate", "advanced"]

Rules for the SQL:
- Use only table names and column names that appear in the schema
- SELECT only, no INSERT, UPDATE, DELETE, DROP, or DDL
- Use proper JOINs based on foreign keys shown in schema
- Add GROUP BY with aggregate functions where appropriate
- Add ORDER BY and LIMIT 100 to all queries
- Use column aliases for readability
