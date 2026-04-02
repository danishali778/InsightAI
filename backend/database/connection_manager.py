import uuid
from typing import Optional
from sqlalchemy import create_engine, text
from sqlalchemy.engine import Engine, URL, make_url
from .models import ConnectionRequest, TableInfo, ActiveConnection
from . import schema_inspector
from .supabase_client import supabase


# In-memory session cache for SQLAlchemy engines only
# Keyed by (user_id, connection_id)
_engines: dict[tuple[str, str], Engine] = {}


def _build_connection_url(config: ConnectionRequest) -> str:
    """Build SQLAlchemy connection URL from config."""
    db_type = config.db_type.lower()

    if db_type == "sqlite":
        # SQLite storage needs careful path handling in persistent envs
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


def connect(user_id: str, config: ConnectionRequest) -> tuple[str, Engine]:
    """
    Create a persistent connection in Supabase, auto-inspect schema.
    Returns (connection_id, engine).
    """
    url = _build_connection_url(config)
    engine = _build_engine(url, config.db_type, config.ssl_mode)

    # Verify it works
    with engine.connect() as conn:
        conn.execute(text("SELECT 1"))

    # Generate a human-friendly name if not provided
    name = config.name or f"{config.db_type}-{config.database}"

    # Persistent storage in Supabase
    conn_data = {
        "owner_id": user_id,
        "name": name,
        "db_type": config.db_type,
        "host": config.host,
        "port": config.port,
        "database": config.database,
        "username": config.username,
        "password": config.password, # Note: Encrypt in production
        "ssl_mode": config.ssl_mode,
        "readonly": config.readonly
    }
    
    response = supabase.table("database_connections").insert(conn_data).execute()
    if not response.data:
        raise Exception("Failed to save connection to database")
        
    connection_id = response.data[0]["id"]
    
    # Store engine in cache
    _engines[(user_id, connection_id)] = engine

    return connection_id, engine


def get_all_connections(user_id: str) -> list[ActiveConnection]:
    """List all active database connections for a user from Supabase."""
    response = supabase.table("database_connections").select("*").eq("owner_id", user_id).execute()
    
    connections = []
    for row in response.data:
        # We don't verify connection health for EVERY list call for performance
        # but we could add status mapping here.
        connections.append(ActiveConnection(
            id=row["id"],
            owner_id=row["owner_id"],
            name=row["name"],
            db_type=row["db_type"],
            database=row["database"],
            host=row.get("host"),
            port=row.get("port"),
            username=row.get("username"),
            status="saved", # Simple status for listed connections
            ssl_mode=row.get("ssl_mode", "disable"),
            readonly=row.get("readonly", True)
        ))
    return connections


def get_engine(user_id: str, connection_id: str) -> Engine | None:
    """Get the SQLAlchemy engine for a connection, rebuilding it from Supabase if not in cache."""
    # Check cache first
    engine = _engines.get((user_id, connection_id))
    if engine:
        return engine
        
    # Not in cache, fetch from Supabase and rebuild
    response = supabase.table("database_connections") \
        .select("*") \
        .eq("id", connection_id) \
        .eq("owner_id", user_id) \
        .execute()
        
    if not response.data:
        return None
        
    row = response.data[0]
    config = ConnectionRequest(
        db_type=row["db_type"],
        host=row["host"],
        port=row["port"],
        database=row["database"],
        username=row["username"],
        password=row["password"],
        ssl_mode=row.get("ssl_mode", "disable"),
        readonly=row.get("readonly", True)
    )
    
    url = _build_connection_url(config)
    new_engine = _build_engine(url, config.db_type, config.ssl_mode)
    _engines[(user_id, connection_id)] = new_engine
    return new_engine


def disconnect(user_id: str, connection_id: str) -> bool:
    """Remove a connection from Supabase and dispose the engine."""
    # Dispose engine if in cache
    engine = _engines.pop((user_id, connection_id), None)
    if engine:
        engine.dispose()
        
    # Remove from Supabase
    response = supabase.table("database_connections") \
        .delete() \
        .eq("id", connection_id) \
        .eq("owner_id", user_id) \
        .execute()
        
    return len(response.data) > 0


def update_settings(user_id: str, connection_id: str, ssl_mode: str | None, readonly: bool | None) -> bool:
    """Update settings in Supabase and rebuild engine if needed."""
    updates = {}
    if ssl_mode is not None:
        updates["ssl_mode"] = ssl_mode
    if readonly is not None:
        updates["readonly"] = readonly
        
    if not updates:
        return True
        
    response = supabase.table("database_connections") \
        .update(updates) \
        .eq("id", connection_id) \
        .eq("owner_id", user_id) \
        .execute()
        
    if not response.data:
        return False
        
    # Rebuild engine to apply new settings
    _engines.pop((user_id, connection_id), None)
    get_engine(user_id, connection_id) # Rebuilds into cache
    return True


def get_cached_schema(user_id: str, connection_id: str) -> list[TableInfo] | None:
    """Get the schema for a connection."""
    engine = get_engine(user_id, connection_id)
    if not engine:
        return None
    # We could persist schema in Supabase too, but for now we re-inspect if not in engine cache
    # In a full prod app, we'd store the JSON schema in Supabase dashboard_widgets or similar
    return schema_inspector.get_schema(engine)


def refresh_schema(user_id: str, connection_id: str) -> list[TableInfo] | None:
    """Re-inspect and return schema."""
    engine = get_engine(user_id, connection_id)
    if not engine:
        return None
    return schema_inspector.get_schema(engine)

def get_readonly(user_id: str, connection_id: str) -> bool:
    """Get the read-only status for a connection from Supabase."""
    try:
        response = supabase.table("database_connections") \
            .select("readonly") \
            .eq("id", connection_id) \
            .eq("owner_id", user_id) \
            .execute()
            
        if not response.data:
            return True # Default to safe
            
        return response.data[0].get("readonly", True)
    except Exception as e:
        print(f"Error fetching readonly status for {connection_id}: {e}")
        return True # Default to safe



def get_schema_for_ai(user_id: str, connection_id: str) -> str | None:
    """Get schema as formatted AI prompt text."""
    schema = get_cached_schema(user_id, connection_id)
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


def seed_dev_connection() -> str | None:
    """
    DEV ONLY: Ensures the Dev connection exists in Supabase for the mock user.
    """
    import os
    from common.auth import MOCK_USER
    url = os.getenv("DATABASE_URL")
    dev_mode = os.getenv("VITE_DEV_MODE", "true").lower() == "true"
    
    if not url or not dev_mode:
        return None

    try:
        parsed = make_url(url)
        db_type = parsed.drivername.split("+")[0]
        
        # Check if already exists in Supabase
        existing = supabase.table("database_connections") \
            .select("id") \
            .eq("owner_id", MOCK_USER.id) \
            .eq("name", f"Dev — {parsed.database}") \
            .execute()
            
        if existing.data:
            print(f"[dev] ✅ Found existing dev connection '{existing.data[0]['id']}'")
            return existing.data[0]["id"]

        # If not, create it
        config = ConnectionRequest(
            db_type=db_type,
            host=str(parsed.host or "localhost"),
            port=parsed.port,
            database=str(parsed.database or ""),
            username=str(parsed.username or ""),
            password=str(parsed.password or ""),
            name=f"Dev — {parsed.database}",
            readonly=False,
        )

        connection_id, _ = connect(MOCK_USER.id, config)
        print(f"[dev] ✅ Seeded dev connection → connection_id = '{connection_id}'")
        return connection_id

    except Exception as e:
        print(f"[dev] ❌ Auto-connect failed: {e}")
        return None
