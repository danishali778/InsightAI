from dataclasses import dataclass
from typing import Any


@dataclass
class AgentDefinition:
    name: str
    handler: Any
    description: str = ""


__all__ = ["AgentDefinition"]
