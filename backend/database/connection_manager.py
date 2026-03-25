import uuid
from sqlalchemy import create_engine, text
from sqlalchemy.engine import Engine
from .models import ConnectionRequest, TableInfo
from . import schema_inspector


# In-memory storage of active connections
_connections: dict[str, dict] = {}


def _build_connection_url(config: ConnectionRequest) -> str:
    """Build SQLAlchemy connection URL from config."""
    db_type = config.db_type.lower()

    if db_type == "sqlite":
        return f"sqlite:///{config.database}"

    if db_type == "postgresql":
        port = config.port or 5432
        return f"postgresql://{config.username}:{config.password}@{config.host}:{port}/{config.database}"

    if db_type == "mysql":
        port = config.port or 3306
        return f"mysql+pymysql://{config.username}:{config.password}@{config.host}:{port}/{config.database}"

    raise ValueError(f"Unsupported database type: {db_type}")


def test_connection(config: ConnectionRequest) -> tuple[bool, str, int]:
    """
    Test a database connection without saving it.
    Returns (success, message, table_count).
    """
    try:
        url = _build_connection_url(config)
        engine = create_engine(url, pool_pre_ping=True)

        # Try to connect and run a simple query
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))

        # Count tables
        from .schema_inspector import get_table_names
        tables = get_table_names(engine)
        table_count = len(tables)

        engine.dispose()
        return True, f"Connection successful! Found {table_count} tables.", table_count

    except Exception as e:
        return False, f"Connection failed: {str(e)}", 0


def connect(config: ConnectionRequest) -> tuple[str, Engine]:
    """
    Create a persistent connection, auto-inspect schema, and store everything.
    Returns (connection_id, engine).
    """
    url = _build_connection_url(config)
    engine = create_engine(url, pool_pre_ping=True)

    # Verify it works
    with engine.connect() as conn:
        conn.execute(text("SELECT 1"))

    # Auto-inspect & cache schema on connect
    cached_schema = schema_inspector.get_schema(engine)

    # Generate a human-friendly name if not provided
    name = config.name or f"{config.db_type}-{config.database}"

    # Store with a unique ID
    connection_id = str(uuid.uuid4())[:8]
    _connections[connection_id] = {
        "engine": engine,
        "name": name,
        "db_type": config.db_type,
        "database": config.database,
        "host": config.host,
        "port": config.port,
        "username": config.username,
        "schema": cached_schema,  # cached for instant AI access
    }

    return connection_id, engine


def disconnect(connection_id: str) -> bool:
    """Remove a stored connection."""
    if connection_id not in _connections:
        return False

    _connections[connection_id]["engine"].dispose()
    del _connections[connection_id]
    return True


def get_engine(connection_id: str) -> Engine | None:
    """Get the SQLAlchemy engine for a connection."""
    conn = _connections.get(connection_id)
    return conn["engine"] if conn else None


def get_cached_schema(connection_id: str) -> list[TableInfo] | None:
    """Get the cached schema for a connection (instant, no DB call)."""
    conn = _connections.get(connection_id)
    return conn["schema"] if conn else None


def refresh_schema(connection_id: str) -> list[TableInfo] | None:
    """Re-inspect and update the cached schema."""
    conn = _connections.get(connection_id)
    if not conn:
        return None
    fresh_schema = schema_inspector.get_schema(conn["engine"])
    conn["schema"] = fresh_schema
    return fresh_schema


def get_schema_for_ai(connection_id: str) -> str | None:
    """
    Get schema as a formatted string ready to inject into an AI prompt.
    Example output:
        Table: users (1500 rows)
          - id: INTEGER (PK)
          - name: VARCHAR
          - email: VARCHAR
          FK: user_id -> orders.id
    """
    schema = get_cached_schema(connection_id)
    if not schema:
        return None

    lines = []
    for table in schema:
        row_info = f" ({table.row_count} rows)" if table.row_count is not None else ""
        lines.append(f"Table: {table.name}{row_info}")
        for col in table.columns:
            pk_tag = " (PK)" if col.primary_key else ""
            null_tag = " NULL" if col.nullable else " NOT NULL"
            lines.append(f"  - {col.name}: {col.type}{pk_tag}{null_tag}")
        for fk in table.foreign_keys:
            lines.append(f"  FK: {fk.column} -> {fk.referred_table}.{fk.referred_column}")
        lines.append("")

    return "\n".join(lines)


def get_all_connections() -> list[dict]:
    """List all active connections with enriched metadata."""
    result = []
    for conn_id, info in _connections.items():
        table_count = len(info.get("schema", []))
        result.append({
            "id": conn_id,
            "name": info.get("name", info["database"]),
            "db_type": info["db_type"],
            "database": info["database"],
            "host": info.get("host", "N/A"),
            "port": info.get("port"),
            "username": info.get("username"),
            "status": "connected",
            "tables_count": table_count,
        })
    return result
