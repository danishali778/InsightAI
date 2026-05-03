from typing import Optional

from pydantic import BaseModel, Field


class ConnectionRequest(BaseModel):
    """Canonical connection configuration used across persistence and query execution."""

    owner_id: Optional[str] = None
    name: Optional[str] = None
    db_type: str
    host: Optional[str] = "localhost"
    port: Optional[int] = None
    database: str
    username: Optional[str] = None
    password: Optional[str] = None
    ssl_mode: str = "disable"
    readonly: bool = True
    use_ssh: bool = False
    ssh_host: Optional[str] = None
    ssh_port: Optional[int] = 22
    ssh_username: Optional[str] = None
    ssh_password: Optional[str] = None
    ssh_private_key: Optional[str] = None


class ActiveConnection(BaseModel):
    """Saved connection summary returned by the persistence layer."""

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


class ColumnInfo(BaseModel):
    """Canonical schema column representation."""

    name: str
    type: str
    nullable: bool
    primary_key: bool
    sample_values: list[str] = Field(default_factory=list)


class ForeignKeyInfo(BaseModel):
    """Canonical foreign-key representation."""

    column: str
    referred_table: str
    referred_column: str


class TableInfo(BaseModel):
    """Canonical database table schema representation."""

    name: str
    columns: list[ColumnInfo]
    foreign_keys: list[ForeignKeyInfo] = Field(default_factory=list)
    row_count: Optional[int] = None


__all__ = [
    "ConnectionRequest",
    "ActiveConnection",
    "ColumnInfo",
    "ForeignKeyInfo",
    "TableInfo",
]
