import re

# Dangerous SQL keywords that modify data
BLOCKED_KEYWORDS = [
    r'\bDROP\b',
    r'\bDELETE\b',
    r'\bUPDATE\b',
    r'\bINSERT\b',
    r'\bALTER\b',
    r'\bTRUNCATE\b',
    r'\bCREATE\b',
    r'\bGRANT\b',
    r'\bREVOKE\b',
    r'\bEXEC\b',
    r'\bEXECUTE\b',
]

# Compile into a single pattern for performance
_BLOCKED_PATTERN = re.compile('|'.join(BLOCKED_KEYWORDS), re.IGNORECASE)


def validate_query(sql: str) -> tuple[bool, str]:
    """
    Validate that a SQL query is read-only.
    Returns (is_safe, error_message).
    """
    # Strip comments
    cleaned = re.sub(r'--.*$', '', sql, flags=re.MULTILINE)  # single-line comments
    cleaned = re.sub(r'/\*.*?\*/', '', cleaned, flags=re.DOTALL)  # block comments
    cleaned = cleaned.strip()

    if not cleaned:
        return False, "Empty query"

    # Check for blocked keywords
    match = _BLOCKED_PATTERN.search(cleaned)
    if match:
        keyword = match.group().upper()
        return False, f"Blocked: {keyword} statements are not allowed. Only SELECT queries are permitted."

    # Must start with SELECT, WITH, or EXPLAIN
    first_word = cleaned.split()[0].upper()
    if first_word not in ('SELECT', 'WITH', 'EXPLAIN', 'SHOW', 'DESCRIBE'):
        return False, f"Only SELECT queries are allowed. Got: {first_word}"

    return True, ""


def sanitize_row_limit(sql: str, max_rows: int) -> str:
    """
    Ensure the query has a LIMIT clause to prevent huge result sets.
    If no LIMIT exists, append one.
    """
    # Check if LIMIT already exists
    if re.search(r'\bLIMIT\b', sql, re.IGNORECASE):
        return sql

    # Remove trailing semicolon, add LIMIT, re-add semicolon
    sql = sql.rstrip(';').strip()
    return f"{sql} LIMIT {max_rows}"
