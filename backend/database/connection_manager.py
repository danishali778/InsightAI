import os
import time
import logging
import uuid
from typing import Optional
from sqlalchemy import create_engine, text, inspect
from sqlalchemy.engine import Engine, URL, make_url
from .models import ConnectionRequest, TableInfo, ActiveConnection
from . import schema_inspector
from .supabase_client import async_supabase
from .retry import async_supabase_retry, supabase_retry
from sshtunnel import SSHTunnelForwarder
from common.encryption import encrypt, decrypt
import io

logger = logging.getLogger(__name__)

# --- Caches & LRU ---
_engines: dict[tuple[str, str], Engine] = {}
_tunnels: dict[tuple[str, str], SSHTunnelForwarder] = {}
_engine_access_times: dict[tuple[str, str], float] = {}
MAX_CACHED_ENGINES = 50

# --- Schema Caching ---
_schema_cache: dict[tuple[str, str], tuple[list[TableInfo], float]] = {}
SCHEMA_CACHE_TTL_SECONDS = 600  # 10 minutes

def _evict_lru_engine():
    """Removes the least recently used engine if the cache is full."""
    if len(_engines) < MAX_CACHED_ENGINES:
        return
        
    oldest_key = min(_engine_access_times, key=_engine_access_times.get)
    logger.info("Evicting LRU engine for user_id=%s, connection_id=%s", oldest_key[0], oldest_key[1])
    
    engine = _engines.pop(oldest_key, None)
    if engine:
        engine.dispose()
        
    tunnel = _tunnels.pop(oldest_key, None)
    if tunnel:
        tunnel.stop()
        
    _engine_access_times.pop(oldest_key, None)


def _build_connection_url(config: ConnectionRequest, override_host: str = None, override_port: int = None) -> URL:
    """Constructs a SQLAlchemy connection URL based on db_type."""
    host = override_host or config.host
    port = override_port or config.port
    
    drivers = {
        "postgresql": "postgresql+psycopg2",
        "mysql": "mysql+pymysql",
        "sqlite": "sqlite",
        "sqlserver": "mssql+pyodbc",
        "mariadb": "mysql+pymysql",
    }
    
    driver = drivers.get(config.db_type, config.db_type)
    
    if config.db_type == "sqlite":
        return make_url(f"sqlite:///{config.database}")
        
    return URL.create(
        drivername=driver,
        username=config.username,
        password=config.password,
        host=host,
        port=port,
        database=config.database
    )


def _start_ssh_tunnel(config: ConnectionRequest) -> tuple[Optional[SSHTunnelForwarder], str, int]:
    """Starts an SSH tunnel if configured. Returns (tunnel_obj, local_host, local_port)."""
    if not config.use_ssh:
        return None, config.host, config.port

    logger.info("Starting SSH tunnel to %s via %s", config.host, config.ssh_host)
    
    ssh_pkey = None
    if config.ssh_private_key:
        ssh_pkey = io.StringIO(config.ssh_private_key)

    tunnel = SSHTunnelForwarder(
        (config.ssh_host, config.ssh_port or 22),
        ssh_username=config.ssh_username,
        ssh_password=config.ssh_password,
        ssh_pkey=ssh_pkey,
        remote_bind_address=(config.host, config.port or 5432),
    )
    
    tunnel.start()
    return tunnel, "127.0.0.1", tunnel.local_bind_port


def _build_engine(url: URL, db_type: str, ssl_mode: str = "disable") -> Engine:
    """Creates a SQLAlchemy engine with appropriate connect_args."""
    connect_args = {}
    
    if db_type in ["postgresql", "mariadb", "mysql"]:
        if ssl_mode != "disable":
            connect_args["sslmode"] = ssl_mode

    return create_engine(
        url,
        connect_args=connect_args,
        pool_pre_ping=True,
        pool_recycle=3600,
        pool_size=5,
        max_overflow=10
    )


async def test_connection(config: ConnectionRequest) -> tuple[bool, str]:
    """Verifies that a connection can be established."""
    tunnel = None
    try:
        tunnel, t_host, t_port = _start_ssh_tunnel(config)
        url = _build_connection_url(config, override_host=t_host, override_port=t_port)
        engine = _build_engine(url, config.db_type, config.ssl_mode)
        
        import anyio
        # test_connection is used during setup, so we run the sync part in a thread
        def _sync_test():
            with engine.connect() as conn:
                conn.execute(text("SELECT 1"))
        
        await anyio.to_thread.run_sync(_sync_test)
        return True, "Connection successful"
    except Exception as e:
        logger.error("Connection test failed: %s", e)
        return False, str(e)
    finally:
        if tunnel:
            tunnel.stop()


@async_supabase_retry
async def connect(user_id: str, config) -> tuple[str, Engine]:
    """Create a persistent connection in Supabase."""
    tunnel, t_host, t_port = _start_ssh_tunnel(config)
    url = _build_connection_url(config, override_host=t_host, override_port=t_port)
    engine = _build_engine(url, config.db_type, getattr(config, "ssl_mode", "disable"))

    with engine.connect() as conn:
        conn.execute(text("SELECT 1"))

    name = config.name or f"{config.db_type}-{config.database}"

    conn_data = {
        "owner_id": user_id,
        "name": name,
        "db_type": config.db_type,
        "host": config.host,
        "port": config.port,
        "database": config.database,
        "username": config.username,
        "password": encrypt(config.password) if config.password else None,
        "ssl_mode": getattr(config, "ssl_mode", "disable"),
        "readonly": getattr(config, "readonly", True),
        "use_ssh": getattr(config, "use_ssh", False),
        "ssh_host": getattr(config, "ssh_host", None),
        "ssh_port": getattr(config, "ssh_port", 22),
        "ssh_username": getattr(config, "ssh_username", None),
        "ssh_password": encrypt(config.ssh_password) if getattr(config, "ssh_password", None) else None,
        "ssh_private_key": encrypt(config.ssh_private_key) if getattr(config, "ssh_private_key", None) else None
    }
    
    response = await async_supabase.table("database_connections").insert(conn_data).execute()
    if not response.data:
        raise Exception("Failed to save connection to database")
        
    connection_id = response.data[0]["id"]
    
    _evict_lru_engine()
    key = (user_id, connection_id)
    _engines[key] = engine
    if tunnel:
        _tunnels[key] = tunnel
    _engine_access_times[key] = time.monotonic()

    return connection_id, engine


@async_supabase_retry
async def get_all_connections(user_id: str) -> list[ActiveConnection]:
    """List all active database connections for a user."""
    response = await async_supabase.table("database_connections").select("*").eq("owner_id", user_id).execute()
    
    connections = []
    for row in response.data:
        connections.append(ActiveConnection(
            id=row["id"],
            owner_id=row["owner_id"],
            name=row["name"],
            db_type=row["db_type"],
            database=row["database"],
            host=row.get("host"),
            port=row.get("port"),
            username=row.get("username"),
            status="saved",
            ssl_mode=row.get("ssl_mode", "disable"),
            readonly=row.get("readonly", True)
        ))
    return connections


@async_supabase_retry
async def get_engine(user_id: str, connection_id: str) -> Engine | None:
    """Get the SQLAlchemy engine for a connection."""
    key = (user_id, connection_id)

    engine = _engines.get(key)
    if engine:
        _engine_access_times[key] = time.monotonic()
        return engine
        
    response = await async_supabase.table("database_connections") \
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
        password=decrypt(row.get("password")) if row.get("password") else None,
        ssl_mode=row.get("ssl_mode", "disable"),
        readonly=row.get("readonly", True),
        use_ssh=row.get("use_ssh", False),
        ssh_host=row.get("ssh_host"),
        ssh_port=row.get("ssh_port", 22),
        ssh_username=row.get("ssh_username"),
        ssh_password=decrypt(row.get("ssh_password")) if row.get("ssh_password") else None,
        ssh_private_key=decrypt(row.get("ssh_private_key")) if row.get("ssh_private_key") else None
    )
    
    tunnel, t_host, t_port = _start_ssh_tunnel(config)
    url = _build_connection_url(config, override_host=t_host, override_port=t_port)
    new_engine = _build_engine(url, config.db_type, config.ssl_mode)

    _evict_lru_engine()
    _engines[key] = new_engine
    if tunnel:
        _tunnels[key] = tunnel
    _engine_access_times[key] = time.monotonic()
    return new_engine


@async_supabase_retry
async def disconnect(user_id: str, connection_id: str) -> bool:
    """Remove a connection and clear cache."""
    key = (user_id, connection_id)

    engine = _engines.pop(key, None)
    tunnel = _tunnels.pop(key, None)
    _engine_access_times.pop(key, None)
    if engine:
        engine.dispose()
    if tunnel:
        tunnel.stop()

    _schema_cache.pop(key, None)
        
    response = await async_supabase.table("database_connections") \
        .delete() \
        .eq("id", connection_id) \
        .eq("owner_id", user_id) \
        .execute()
        
    return len(response.data) > 0


@async_supabase_retry
async def update_settings(user_id: str, connection_id: str, ssl_mode: str | None, readonly: bool | None) -> bool:
    """Update settings and rebuild engine."""
    updates = {}
    if ssl_mode is not None: updates["ssl_mode"] = ssl_mode
    if readonly is not None: updates["readonly"] = readonly
        
    if not updates: return True
        
    response = await async_supabase.table("database_connections").update(updates).eq("id", connection_id).eq("owner_id", user_id).execute()
    if not response.data: return False
        
    _engines.pop((user_id, connection_id), None)
    await get_engine(user_id, connection_id)
    return True


async def get_cached_schema(user_id: str, connection_id: str, force_refresh: bool = False) -> list[TableInfo] | None:
    """Get the schema for a connection with caching."""
    key = (user_id, connection_id)
    now = time.monotonic()

    if not force_refresh:
        cached = _schema_cache.get(key)
        if cached:
            schema, ts = cached
            if now - ts < SCHEMA_CACHE_TTL_SECONDS:
                return schema

    engine = await get_engine(user_id, connection_id)
    if not engine: return None

    import anyio
    schema = await anyio.to_thread.run_sync(schema_inspector.get_schema, engine)
    _schema_cache[key] = (schema, now)
    return schema


async def refresh_schema(user_id: str, connection_id: str) -> list[TableInfo] | None:
    return await get_cached_schema(user_id, connection_id, force_refresh=True)


@async_supabase_retry
async def get_readonly(user_id: str, connection_id: str) -> bool:
    """Get the read-only status."""
    try:
        response = await async_supabase.table("database_connections").select("readonly").eq("id", connection_id).eq("owner_id", user_id).execute()
        if not response.data: return True
        return response.data[0].get("readonly", True)
    except Exception as e:
        logger.error("Error fetching readonly status: %s", e)
        return True


async def get_schema_for_ai(user_id: str, connection_id: str) -> str | None:
    """Get schema as formatted AI prompt text."""
    schema = await get_cached_schema(user_id, connection_id)
    if not schema: return None

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


async def seed_dev_connection() -> str | None:
    """DEV ONLY: Seed the developer connection."""
    import os
    from common.auth import MOCK_USER
    url = os.getenv("DATABASE_URL")
    dev_mode = os.getenv("BACKEND_DEV_MODE", "false").lower() == "true"
    if not url or not dev_mode: return None

    try:
        parsed = make_url(url)
        response = await async_supabase.table("database_connections").select("id").eq("owner_id", MOCK_USER.id).eq("name", f"Dev — {parsed.database}").execute()
        if response.data: return response.data[0]["id"]

        config = ConnectionRequest(
            db_type=parsed.drivername.split("+")[0],
            host=str(parsed.host or "localhost"),
            port=parsed.port,
            database=str(parsed.database or ""),
            username=str(parsed.username or ""),
            password=str(parsed.password or ""),
            name=f"Dev — {parsed.database}",
            readonly=False,
        )
        connection_id, _ = await connect(MOCK_USER.id, config)
        return connection_id
    except Exception as e:
        logger.error("[dev] Auto-connect failed: %s", e)
        return None
