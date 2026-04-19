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
    # Postgres-specific dangerous functions that can bypass regex filters
    r'\blo_import\b',
    r'\blo_export\b',
    r'\bdblink\b',
    r'\bdblink_exec\b',
    r'\bpg_read_file\b',
    r'\bpg_write_file\b',
    r'\bpg_execute_server_program\b',
    r'\bCOPY\b',
]

# Compile into a single pattern for performance
_BLOCKED_PATTERN = re.compile('|'.join(BLOCKED_KEYWORDS), re.IGNORECASE)

# Pattern to strip string literals before keyword scanning
# Prevents hiding blocked keywords inside quoted strings
_STRING_LITERAL_PATTERN = re.compile(r"'[^']*'|\"[^\"]*\"", re.DOTALL)


def _strip_literals(sql: str) -> str:
    """Replace string literal values with empty strings to prevent keyword hiding."""
    return _STRING_LITERAL_PATTERN.sub("''", sql)


def validate_query(sql: str) -> tuple[bool, str]:
    """
    Validate that a SQL query is read-only.
    Returns (is_safe, error_message).

    Defence-in-depth strategy:
      1. Strip SQL comments
      2. Strip string literals (prevents keyword hiding inside values)
      3. Check against blocked keyword list (includes Postgres-specific functions)
      4. Enforce allowlist of permitted first keywords (SELECT, WITH, EXPLAIN, SHOW, DESCRIBE)
    """
    # Step 1: Strip comments
    cleaned = re.sub(r'--.*$', '', sql, flags=re.MULTILINE)   # single-line comments
    cleaned = re.sub(r'/\*.*?\*/', '', cleaned, flags=re.DOTALL)  # block comments
    cleaned = cleaned.strip()

    if not cleaned:
        return False, "Empty query"

    # Step 2: Strip string literals before scanning keywords
    # This prevents: SELECT * FROM t WHERE name = 'DROP TABLE users'
    # from bypassing the keyword check
    cleaned_for_scan = _strip_literals(cleaned)

    # Step 3: Check for blocked keywords
    match = _BLOCKED_PATTERN.search(cleaned_for_scan)
    if match:
        keyword = match.group().upper()
        return False, f"Blocked: {keyword} statements are not allowed. Only SELECT queries are permitted."

    # Step 4: Must start with SELECT, WITH, or EXPLAIN
    first_word = cleaned_for_scan.split()[0].upper()
    if first_word not in ('SELECT', 'WITH', 'EXPLAIN', 'SHOW', 'DESCRIBE'):
        return False, f"Only SELECT queries are allowed. Got: {first_word}"

    return True, ""


def get_readonly_wrapped_query(sql: str) -> str:
    """
    Wrap a validated query in a read-only transaction block.
    This provides a database-level enforcement layer in addition to
    the keyword-based validation, defending against any regex bypass.

    Usage: execute this wrapped SQL string instead of the raw SQL.
    """
    # Strip trailing semicolons before wrapping
    sql = sql.rstrip(';').strip()
    return f"SET TRANSACTION READ ONLY; {sql};"


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
