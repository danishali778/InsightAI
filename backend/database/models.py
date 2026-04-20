from pydantic import BaseModel, Field
from typing import Optional


class ConnectionRequest(BaseModel):
    """Request to connect to a database."""
    owner_id: Optional[str] = None  # UUID from auth.users
    name: Optional[str] = None  # User-friendly label, e.g. "prod-postgres"
    db_type: str  # "postgresql", "mysql", "sqlite"
    host: Optional[str] = "localhost"
    port: Optional[int] = None
    database: str
    username: Optional[str] = None
    password: Optional[str] = None
    ssl_mode: str = "disable"   # disable | require | verify-full
    readonly: bool = True
    
    # SSH Tunneling parameters (Optional)
    use_ssh: bool = False
    ssh_host: Optional[str] = None
    ssh_port: Optional[int] = 22
    ssh_username: Optional[str] = None
    ssh_password: Optional[str] = None
    ssh_private_key: Optional[str] = None


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
    sample_values: list[str] = Field(default_factory=list)


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
    ssl_mode: str = "disable"
    
    # SSH Tunneling parameters for testing
    use_ssh: bool = False
    ssh_host: Optional[str] = None
    ssh_port: Optional[int] = 22
    ssh_username: Optional[str] = None
    ssh_password: Optional[str] = None
    ssh_private_key: Optional[str] = None


class TestConnectionResponse(BaseModel):
    """Response from testing a connection."""
    success: bool
    message: str
    tables_found: Optional[int] = None


class ActiveConnection(BaseModel):
    """Summary of an active database connection."""
    id: str
    owner_id: str
    name: str
    db_type: str
    database: str
    host: Optional[str] = None
    port: Optional[int] = None
    username: Optional[str] = None
    status: str
    tables_count: int = 0
    ssl_mode: str = "disable"
    readonly: bool = True
    use_ssh: bool = False
    ssh_host: Optional[str] = None


class UpdateConnectionSettingsRequest(BaseModel):
    """Patchable security settings for an existing connection."""
    ssl_mode: Optional[str] = None   # disable | require | verify-full
    readonly: Optional[bool] = None
