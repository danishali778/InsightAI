"""Connection workflows backed by the DB connection manager."""

from app.db.models.connection import ActiveConnection, ConnectionRequest, TableInfo
from app.db.connection_manager import (
    connect,
    disconnect,
    generate_erd_json,
    generate_erd_mermaid,
    get_all_connections,
    get_cached_schema,
    get_engine,
    get_readonly,
    get_schema_for_ai,
    refresh_schema,
    seed_dev_connection,
    test_connection,
    update_settings,
)


__all__ = [
    "connect",
    "disconnect",
    "generate_erd_json",
    "generate_erd_mermaid",
    "get_all_connections",
    "get_cached_schema",
    "get_engine",
    "get_readonly",
    "get_schema_for_ai",
    "refresh_schema",
    "seed_dev_connection",
    "test_connection",
    "update_settings",
]
