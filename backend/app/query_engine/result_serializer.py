import datetime
import decimal
from typing import Any


def serialize_data(obj: Any) -> Any:
    """Recursively convert DB-native values into JSON-serializable data."""
    if isinstance(obj, list):
        return [serialize_data(item) for item in obj]
    if isinstance(obj, dict):
        return {key: serialize_data(value) for key, value in obj.items()}
    if isinstance(obj, decimal.Decimal):
        return int(obj) if obj % 1 == 0 else float(obj)
    if isinstance(obj, (datetime.datetime, datetime.date, datetime.time)):
        return obj.isoformat()
    return obj


__all__ = ["serialize_data"]
