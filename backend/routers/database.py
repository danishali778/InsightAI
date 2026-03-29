from fastapi import APIRouter, HTTPException

from common.models import StatusMessageResponse
from database.models import (
    ActiveConnection,
    ConnectionRequest,
    ConnectionResponse,
    TestConnectionRequest,
    TestConnectionResponse,
    SchemaResponse,
    UpdateConnectionSettingsRequest,
)
from database import connection_manager, schema_inspector
from query_library import schema_recommender


router = APIRouter(prefix="/api/database", tags=["Database"])


@router.post("/test", response_model=TestConnectionResponse)
def test_database_connection(config: TestConnectionRequest):
    """Test a database connection without saving it."""
    request = ConnectionRequest(**config.model_dump())
    success, message, table_count = connection_manager.test_connection(request)
    return TestConnectionResponse(
        success=success,
        message=message,
        tables_found=table_count if success else None,
    )


@router.post("/connect", response_model=ConnectionResponse)
def connect_database(config: ConnectionRequest):
    """Connect to a database and save the connection."""
    try:
        connection_id, engine = connection_manager.connect(config)
        # Get table count for the response
        schema = connection_manager.get_cached_schema(connection_id)
        tables_count = len(schema) if schema else 0
        name = config.name or f"{config.db_type}-{config.database}"
        # Trigger background AI template generation for Public Library
        schema_text = connection_manager.get_schema_for_ai(connection_id)
        if schema_text:
            schema_recommender.generate_in_background(connection_id, schema_text, config.db_type)

        return ConnectionResponse(
            id=connection_id,
            name=name,
            db_type=config.db_type,
            database=config.database,
            host=config.host,
            port=config.port,
            status="connected",
            message=f"Successfully connected to {config.database}",
            tables_count=tables_count,
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Connection failed: {str(e)}")


@router.get("/connections", response_model=list[ActiveConnection])
def list_connections():
    """List all active database connections."""
    return connection_manager.get_all_connections()


@router.patch("/connections/{connection_id}", response_model=ActiveConnection)
def update_connection_settings(connection_id: str, req: UpdateConnectionSettingsRequest):
    """Update SSL mode and/or read-only flag for an existing connection."""
    conn_list = connection_manager.get_all_connections()
    conn_info = next((c for c in conn_list if c["id"] == connection_id), None)
    if not conn_info:
        raise HTTPException(status_code=404, detail="Connection not found")
    ok = connection_manager.update_settings(connection_id, req.ssl_mode, req.readonly)
    if not ok:
        raise HTTPException(status_code=500, detail="Failed to apply SSL settings — check the SSL mode is supported by your DB.")
    updated = next(c for c in connection_manager.get_all_connections() if c["id"] == connection_id)
    return updated


@router.delete("/connections/{connection_id}", response_model=StatusMessageResponse)
def disconnect_database(connection_id: str):
    """Disconnect from a database."""
    success = connection_manager.disconnect(connection_id)
    if not success:
        raise HTTPException(status_code=404, detail="Connection not found")
    schema_recommender.clear_connection(connection_id)
    return {"message": f"Disconnected {connection_id}", "status": "disconnected"}


@router.get("/connections/{connection_id}/schema", response_model=SchemaResponse)
def get_database_schema(connection_id: str):
    """Get the full schema (tables, columns, FKs) of a connected database."""
    engine = connection_manager.get_engine(connection_id)
    if not engine:
        raise HTTPException(status_code=404, detail="Connection not found")

    try:
        tables = schema_inspector.get_schema(engine)
        conn_info = connection_manager.get_all_connections()
        db_name = next((c["database"] for c in conn_info if c["id"] == connection_id), "unknown")
        return SchemaResponse(
            connection_id=connection_id,
            database=db_name,
            tables=tables,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Schema inspection failed: {str(e)}")


@router.get("/connections/{connection_id}/erd/mermaid")
def get_erd_mermaid(connection_id: str):
    """Get the ERD as a Mermaid diagram string (for frontend rendering)."""
    schema = connection_manager.get_cached_schema(connection_id)
    if schema is None:
        raise HTTPException(status_code=404, detail="Connection not found")

    mermaid_text = schema_inspector.generate_erd_mermaid(schema)
    return {"connection_id": connection_id, "format": "mermaid", "erd": mermaid_text}


@router.get("/connections/{connection_id}/erd/json")
def get_erd_json(connection_id: str):
    """Get the ERD as structured JSON (tables + relationships)."""
    schema = connection_manager.get_cached_schema(connection_id)
    if schema is None:
        raise HTTPException(status_code=404, detail="Connection not found")

    erd_data = schema_inspector.generate_erd_json(schema)
    return {"connection_id": connection_id, "format": "json", **erd_data}
