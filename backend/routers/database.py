from fastapi import APIRouter, HTTPException, Depends

from common.auth import get_current_user, User
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
async def test_database_connection(config: TestConnectionRequest, current_user: User = Depends(get_current_user)):
    """Test a database connection without saving it."""
    request = ConnectionRequest(**config.model_dump())
    success, message = await connection_manager.test_connection(request)
    return TestConnectionResponse(
        success=success,
        message=message,
        tables_found=None, # test_connection no longer returns count
    )


@router.post("/connect", response_model=ConnectionResponse)
async def connect_database(config: ConnectionRequest, current_user: User = Depends(get_current_user)):
    """Connect to a database and save the connection."""
    try:
        connection_id, engine = await connection_manager.connect(current_user.id, config)
        
        # Get table count
        schema = await connection_manager.get_cached_schema(current_user.id, connection_id)
        tables_count = len(schema) if schema else 0
        name = config.name or f"{config.db_type}-{config.database}"
        
        # Trigger background AI template generation
        schema_text = await connection_manager.get_schema_for_ai(current_user.id, connection_id)
        if schema_text:
            # We can run this in background
            import asyncio
            asyncio.create_task(schema_recommender.generate_in_background(connection_id, schema_text, config.db_type))

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
async def list_connections(current_user: User = Depends(get_current_user)):
    return await connection_manager.get_all_connections(current_user.id)


@router.patch("/connections/{connection_id}", response_model=ActiveConnection)
async def update_connection_settings(
    connection_id: str, 
    req: UpdateConnectionSettingsRequest, 
    current_user: User = Depends(get_current_user)
):
    ok = await connection_manager.update_settings(current_user.id, connection_id, req.ssl_mode, req.readonly)
    if not ok:
        raise HTTPException(status_code=500, detail="Failed to apply settings.")
        
    conn_list = await connection_manager.get_all_connections(current_user.id)
    updated = next((c for c in conn_list if c.id == connection_id), None)
    if not updated:
        raise HTTPException(status_code=404, detail="Connection lost after update")
    return updated


@router.delete("/connections/{connection_id}", response_model=StatusMessageResponse)
async def disconnect_database(connection_id: str, current_user: User = Depends(get_current_user)):
    success = await connection_manager.disconnect(current_user.id, connection_id)
    if not success:
        raise HTTPException(status_code=404, detail="Connection not found")
    schema_recommender.clear_connection(connection_id)
    return {"message": f"Disconnected {connection_id}", "status": "disconnected"}


@router.get("/connections/{connection_id}/schema", response_model=SchemaResponse)
async def get_database_schema(connection_id: str, current_user: User = Depends(get_current_user)):
    try:
        tables = await connection_manager.refresh_schema(current_user.id, connection_id)
        if tables is None:
            raise HTTPException(status_code=404, detail="Connection not found")
            
        return SchemaResponse(
            connection_id=connection_id,
            database="unknown",
            tables=tables,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Schema inspection failed: {str(e)}")


@router.get("/connections/{connection_id}/erd/mermaid")
async def get_erd_mermaid(connection_id: str, current_user: User = Depends(get_current_user)):
    schema = await connection_manager.get_cached_schema(current_user.id, connection_id)
    if schema is None:
        raise HTTPException(status_code=404, detail="Connection not found")

    mermaid_text = schema_inspector.generate_erd_mermaid(schema)
    return {"connection_id": connection_id, "format": "mermaid", "erd": mermaid_text}


@router.get("/connections/{connection_id}/erd/json")
async def get_erd_json(connection_id: str, current_user: User = Depends(get_current_user)):
    schema = await connection_manager.get_cached_schema(current_user.id, connection_id)
    if schema is None:
        raise HTTPException(status_code=404, detail="Connection not found")

    erd_data = schema_inspector.generate_erd_json(schema)
    return {"connection_id": connection_id, "format": "json", **erd_data}
