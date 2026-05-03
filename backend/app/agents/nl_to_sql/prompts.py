from pathlib import Path

from app.agents._prompt_loader import load_prompt

_PROMPTS_DIR = Path(__file__).with_name("prompts")


def build_system_prompt(schema_context: str) -> str:
    template = load_prompt(str(_PROMPTS_DIR / "system_prompt.md"))
    return template.replace("__SCHEMA_CONTEXT__", schema_context)


def build_template_recommender_prompt(schema_text: str, db_type: str) -> str:
    template = load_prompt(str(_PROMPTS_DIR / "template_recommender.md"))
    return (
        template.replace("__DB_TYPE__", db_type)
        .replace("__SCHEMA_TEXT__", schema_text)
    )


def build_conversation_prompt(
    schema_context: str,
    history: list[dict],
    user_message: str,
) -> list[dict]:
    messages = [{"role": "system", "content": build_system_prompt(schema_context)}]

    for msg in history[-20:]:
        messages.append({"role": msg["role"], "content": msg["content"]})

    messages.append({"role": "user", "content": user_message})
    return messages
