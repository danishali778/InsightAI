"""Unit tests for backend/app/query_engine/safety.py

Tests validate_query() and sanitize_row_limit() with a wide range of
normal, edge-case, and adversarial inputs.
"""
import pytest
from app.query_engine.safety import (
    validate_query,
    sanitize_row_limit,
    get_readonly_wrapped_query,
)


# ---------------------------------------------------------------------------
# validate_query — allowed queries
# ---------------------------------------------------------------------------

class TestValidQueryAllowed:
    def test_simple_select(self):
        ok, msg = validate_query("SELECT * FROM users")
        assert ok, msg

    def test_select_with_where(self):
        ok, msg = validate_query("SELECT id, name FROM orders WHERE status = 'active'")
        assert ok, msg

    def test_select_with_join(self):
        ok, msg = validate_query(
            "SELECT u.id, o.total FROM users u JOIN orders o ON u.id = o.user_id"
        )
        assert ok, msg

    def test_with_cte(self):
        ok, msg = validate_query(
            "WITH summary AS (SELECT user_id, COUNT(*) cnt FROM orders GROUP BY user_id) "
            "SELECT * FROM summary"
        )
        assert ok, msg

    def test_explain_query(self):
        ok, msg = validate_query("EXPLAIN SELECT * FROM users")
        assert ok, msg

    def test_show_tables(self):
        ok, msg = validate_query("SHOW TABLES")
        assert ok, msg

    def test_describe_table(self):
        ok, msg = validate_query("DESCRIBE users")
        assert ok, msg

    def test_select_with_subquery(self):
        ok, msg = validate_query(
            "SELECT * FROM users WHERE id IN (SELECT user_id FROM orders)"
        )
        assert ok, msg


# ---------------------------------------------------------------------------
# validate_query — blocked simple keywords
# ---------------------------------------------------------------------------

class TestValidQueryBlocked:
    @pytest.mark.parametrize("sql", [
        "DROP TABLE users",
        "DELETE FROM users WHERE id = 1",
        "UPDATE users SET name = 'x' WHERE id = 1",
        "INSERT INTO users (name) VALUES ('x')",
        "ALTER TABLE users ADD COLUMN age INT",
        "TRUNCATE TABLE users",
        "CREATE TABLE new_table (id INT)",
        "GRANT SELECT ON users TO public",
        "REVOKE SELECT ON users FROM public",
        "EXEC sp_something",
        "EXECUTE sp_something",
    ])
    def test_blocked_keywords(self, sql):
        ok, msg = validate_query(sql)
        assert not ok
        assert "not allowed" in msg.lower() or "blocked" in msg.lower()

    @pytest.mark.parametrize("sql", [
        "SELECT lo_import('/etc/passwd')",
        "SELECT lo_export(1234, '/tmp/out')",
        "SELECT dblink('host=evil', 'DROP TABLE users')",
        "SELECT dblink_exec('host=evil', 'DROP TABLE users')",
        "SELECT pg_read_file('/etc/passwd')",
        "COPY users TO '/tmp/dump.csv'",
    ])
    def test_blocked_postgres_specific(self, sql):
        ok, msg = validate_query(sql)
        assert not ok

    def test_keyword_hidden_in_comment_blocked(self):
        """Keywords hidden in comments are still caught after comment stripping."""
        ok, msg = validate_query("-- DROP TABLE users\nSELECT 1")
        # After stripping comment, only SELECT 1 remains — should be allowed
        assert ok, msg

    def test_keyword_hidden_in_string_literal_allowed(self):
        """Keywords inside string literals must NOT be blocked.

        e.g. WHERE name = 'DROP TABLE users' is a safe SELECT query.
        The _strip_literals() step should handle this correctly.
        """
        ok, msg = validate_query("SELECT * FROM users WHERE name = 'DROP TABLE users'")
        assert ok, msg

    def test_mixed_case_blocked(self):
        ok, msg = validate_query("dRoP tAbLe users")
        assert not ok

    def test_empty_query_blocked(self):
        ok, msg = validate_query("  ")
        assert not ok
        assert "empty" in msg.lower()

    def test_non_select_first_word_blocked(self):
        ok, msg = validate_query("MERGE INTO users USING src ON users.id = src.id")
        assert not ok
        assert "MERGE" in msg


# ---------------------------------------------------------------------------
# sanitize_row_limit
# ---------------------------------------------------------------------------

class TestSanitizeRowLimit:
    def test_adds_limit_when_missing(self):
        sql = "SELECT * FROM users"
        result = sanitize_row_limit(sql, 100)
        assert result.endswith("LIMIT 100")

    def test_preserves_existing_limit(self):
        sql = "SELECT * FROM users LIMIT 50"
        result = sanitize_row_limit(sql, 100)
        assert "LIMIT 50" in result
        assert "LIMIT 100" not in result

    def test_strips_trailing_semicolon_before_adding_limit(self):
        sql = "SELECT * FROM users;"
        result = sanitize_row_limit(sql, 100)
        assert result.endswith("LIMIT 100")
        assert ";;" not in result

    def test_case_insensitive_limit_detection(self):
        sql = "SELECT * FROM users limit 20"
        result = sanitize_row_limit(sql, 100)
        assert "LIMIT 100" not in result  # should keep existing limit


# ---------------------------------------------------------------------------
# get_readonly_wrapped_query
# ---------------------------------------------------------------------------

class TestGetReadonlyWrappedQuery:
    def test_wraps_with_transaction_prefix(self):
        result = get_readonly_wrapped_query("SELECT * FROM users")
        assert result.startswith("SET TRANSACTION READ ONLY;")

    def test_strips_trailing_semicolon_before_wrapping(self):
        result = get_readonly_wrapped_query("SELECT * FROM users;")
        # Should not have double semicolons
        assert ";;" not in result
        assert "SELECT * FROM users" in result
