import re
import os
import json
from langchain_groq import ChatGroq
from dotenv import load_dotenv

load_dotenv()

# Initialize LLM
_llm = None


def get_llm() -> ChatGroq:
    """Get or create the Groq LLM instance."""
    global _llm
    if _llm is None:
        _llm = ChatGroq(
            api_key=os.getenv("GROQ_API_KEY"),
            model=os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile"),
            temperature=0,
            max_tokens=4096,
        )
    return _llm


def generate_sql(messages: list[dict]) -> tuple[str, dict, str]:
    """
    Send conversation to LLM and get SQL back.
    Returns (explanation, metadata_dict, sql_query).
    """
    llm = get_llm()

    # Convert to LangChain message format
    from langchain_core.messages import HumanMessage, SystemMessage, AIMessage

    lc_messages = []
    for msg in messages:
        if msg["role"] == "system":
            lc_messages.append(SystemMessage(content=msg["content"]))
        elif msg["role"] == "user":
            lc_messages.append(HumanMessage(content=msg["content"]))
        elif msg["role"] == "assistant":
            lc_messages.append(AIMessage(content=msg["content"]))

    response = llm.invoke(lc_messages)
    response_text = response.content

    # Extract SQL, explanation, and metadata
    sql = extract_sql(response_text)
    explanation = extract_explanation(response_text)
    metadata = extract_metadata(response_text)

    return explanation, metadata, sql


def extract_sql(text: str) -> str:
    """Extract SQL query from LLM response (looks for ```sql ... ``` blocks)."""
    # Try to find SQL in code blocks
    patterns = [
        r'```sql\s*\n?(.*?)\n?\s*```',   # ```sql ... ```
        r'```\s*\n?(.*?)\n?\s*```',       # ``` ... ```
    ]

    for pattern in patterns:
        match = re.search(pattern, text, re.DOTALL | re.IGNORECASE)
        if match:
            sql = match.group(1).strip()
            if sql:
                return sql

    # Fallback: look for lines starting with SELECT/WITH
    lines = text.split('\n')
    sql_lines = []
    in_sql = False
    for line in lines:
        stripped = line.strip().upper()
        if stripped.startswith(('SELECT', 'WITH')):
            in_sql = True
        if in_sql:
            sql_lines.append(line)
            if stripped.endswith(';'):
                break

    if sql_lines:
        return '\n'.join(sql_lines).strip()

    return ""


def extract_explanation(text: str) -> str:
    """Extract the explanation part from the LLM response."""
    # Look for EXPLANATION: prefix
    match = re.search(r'EXPLANATION:\s*(.+?)(?=```|$)', text, re.DOTALL | re.IGNORECASE)
    if match:
        return match.group(1).strip()

    # Fallback: take text before the first code block
    parts = text.split('```')
    if parts:
        explanation = parts[0].strip()
        # Remove "EXPLANATION:" prefix if present
        explanation = re.sub(r'^EXPLANATION:\s*', '', explanation, flags=re.IGNORECASE)
        return explanation if explanation else "Here's the SQL query for your question."

    return "Here's the SQL query for your question."


def extract_metadata(text: str) -> dict:
    """Extract the metadata JSON part from the LLM response."""
    match = re.search(r'METADATA:\s*```json\s*(.*?)\s*```', text, re.DOTALL | re.IGNORECASE)
    if match:
        try:
            return json.loads(match.group(1).strip())
        except json.JSONDecodeError:
            pass
    
    # Fallback to look for just a JSON block preceded by METADATA
    match = re.search(r'METADATA:.*?({.*?})', text, re.DOTALL | re.IGNORECASE)
    if match:
        try:
            return json.loads(match.group(1).strip())
        except json.JSONDecodeError:
            pass
            
    return {}


def generate_error_correction(messages: list[dict], sql: str, error: str) -> tuple[str, dict, str]:
    """
    Feed the error back to the LLM for self-correction.
    Returns (explanation, metadata, corrected_sql).
    """
    error_message = {
        "role": "user",
        "content": f"""The SQL query you generated had an error when executed:

Query:
```sql
{sql}
```

Error: {error}

Please fix the SQL query and try again. Return the corrected query in the same format."""
    }

    corrected_messages = messages + [error_message]
    return generate_sql(corrected_messages)
