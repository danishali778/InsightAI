import json
from pathlib import Path
from typing import Any, Dict, List

from app.agents._prompt_loader import load_prompt
from app.core.config import settings
from app.integrations.groq_client import get_groq_client

_PROMPT_PATH = Path(__file__).with_name("prompts") / "widget_insight_prompt.md"


def generate_widget_insight(
    title: str,
    viz_type: str,
    data: List[Dict[str, Any]],
    filters: Dict[str, Any],
) -> str:
    if not data:
        return "Not enough data to generate insights yet."

    prompt = (
        load_prompt(str(_PROMPT_PATH))
        .replace("__TITLE__", title)
        .replace("__VIZ_TYPE__", viz_type)
        .replace("__FILTERS__", json.dumps(filters))
        .replace("__DATA__", json.dumps(data[:10], indent=2))
    )

    try:
        completion = get_groq_client().chat.completions.create(
            messages=[
                {"role": "system", "content": "You provide short, professional data insights."},
                {"role": "user", "content": prompt},
            ],
            model=settings.groq_model,
            temperature=0.3,
            max_tokens=150,
        )
        return completion.choices[0].message.content.strip()
    except Exception:
        return "Analysis momentarily unavailable. Please try again shortly."
