from functools import lru_cache
from pathlib import Path


@lru_cache(maxsize=None)
def load_prompt(path: str) -> str:
    return Path(path).read_text(encoding="utf-8").strip()
