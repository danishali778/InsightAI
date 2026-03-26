from pydantic import BaseModel, Field
from typing import Optional


class ConnectionRequest(BaseModel):
    """Request to connect to a database."""
    name: Optional[str] = None  # User-friendly label, e.g. "prod-postgres"
    db_type: str  # "postgresql", "mysql", "sqlite"
    host: Optional[str] = "localhost"
    port: Optional[int] = None
    database: str
    username: Optional[str] = None
    password: Optional[str] = None


class ConnectionResponse(BaseModel):
    """Response after connecting."""
    id: str
    name: str
    db_type: str
    database: str
    host: Optional[str] = None
    port: Optional[int] = None
    status: str  # "connected", "failed"
    message: str
    tables_count: Optional[int] = None


class ColumnInfo(BaseModel):
    """Info about a single column."""
    name: str
    type: str
    nullable: bool
    primary_key: bool


class ForeignKeyInfo(BaseModel):
    """Info about a foreign key relationship."""
    column: str
    referred_table: str
    referred_column: str


class TableInfo(BaseModel):
    """Info about a single table."""
    name: str
    columns: list[ColumnInfo]
    foreign_keys: list[ForeignKeyInfo] = Field(default_factory=list)
    row_count: Optional[int] = None


class SchemaResponse(BaseModel):
    """Full schema of a connected database."""
    connection_id: str
    database: str
    tables: list[TableInfo]


class TestConnectionRequest(BaseModel):
    """Request to test a connection without saving."""
    db_type: str
    host: Optional[str] = "localhost"
    port: Optional[int] = None
    database: str
    username: Optional[str] = None
    password: Optional[str] = None


class TestConnectionResponse(BaseModel):
    """Response from testing a connection."""
    success: bool
    message: str
    tables_found: Optional[int] = None


class ActiveConnection(BaseModel):
    """Summary of an active database connection."""
    id: str
    name: str
    db_type: str
    database: str
    host: Optional[str] = None
    port: Optional[int] = None
    username: Optional[str] = None
    status: str
    tables_count: int = 0
