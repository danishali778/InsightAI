import uuid
from sqlalchemy import create_engine, text
from sqlalchemy.engine import Engine
from sqlalchemy.engine import URL
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
        return str(URL.create(
            drivername="postgresql+psycopg2",
            username=config.username,
            password=config.password,
            host=config.host,
            port=port,
            database=config.database,
        ))

    if db_type == "mysql":
        port = config.port or 3306
        return str(URL.create(
            drivername="mysql+pymysql",
            username=config.username,
            password=config.password,
            host=config.host,
            port=port,
            database=config.database,
        ))

    raise ValueError(f"Unsupported database type: {db_type}")


def _build_engine(url: str, db_type: str, ssl_mode: str = "disable") -> Engine:
    """Create an engine with conservative connection timeout and optional SSL."""
    db_type = db_type.lower()
    connect_args: dict = {}

    if db_type == "postgresql":
        connect_args["connect_timeout"] = 5
        if ssl_mode in ("require", "verify-full"):
            connect_args["sslmode"] = ssl_mode
    elif db_type == "mysql":
        connect_args["connect_timeout"] = 5
        if ssl_mode in ("require", "verify-full"):
            connect_args["ssl"] = {"ssl_verify_cert": ssl_mode == "verify-full"}

    return create_engine(url, pool_pre_ping=True, connect_args=connect_args)


def test_connection(config: ConnectionRequest) -> tuple[bool, str, int]:
    """
    Test a database connection without saving it.
    Returns (success, message, table_count).
    """
    try:
        url = _build_connection_url(config)
        engine = _build_engine(url, config.db_type, getattr(config, "ssl_mode", "disable"))

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
    engine = _build_engine(url, config.db_type, config.ssl_mode)

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
        "password": config.password,  # kept for engine rebuild on settings change
        "ssl_mode": config.ssl_mode,
        "readonly": config.readonly,
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


def get_readonly(connection_id: str) -> bool:
    """Return True if this connection enforces read-only mode."""
    conn = _connections.get(connection_id)
    return conn["readonly"] if conn else True  # safe default


def update_settings(connection_id: str, ssl_mode: str | None, readonly: bool | None) -> bool:
    """Update SSL mode and/or readonly flag. Rebuilds engine if ssl_mode changes."""
    conn = _connections.get(connection_id)
    if not conn:
        return False

    if readonly is not None:
        conn["readonly"] = readonly

    if ssl_mode is not None and ssl_mode != conn["ssl_mode"]:
        conn["ssl_mode"] = ssl_mode
        # Rebuild engine with new SSL settings
        try:
            old_engine = conn["engine"]
            config = ConnectionRequest(
                db_type=conn["db_type"],
                host=conn["host"],
                port=conn["port"],
                database=conn["database"],
                username=conn["username"],
                password=conn["password"],
                ssl_mode=ssl_mode,
            )
            url = _build_connection_url(config)
            new_engine = _build_engine(url, conn["db_type"], ssl_mode)
            with new_engine.connect() as c:
                c.execute(text("SELECT 1"))
            old_engine.dispose()
            conn["engine"] = new_engine
        except Exception:
            conn["ssl_mode"] = _connections[connection_id]["ssl_mode"]  # revert on failure
            return False

    _connections[connection_id] = conn
    return True


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
            values_tag = f" [values: {', '.join(col.sample_values)}]" if col.sample_values else ""
            lines.append(f"  - {col.name}: {col.type}{pk_tag}{null_tag}{values_tag}")
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
            "ssl_mode": info.get("ssl_mode", "disable"),
            "readonly": info.get("readonly", True),
        })
    return result
