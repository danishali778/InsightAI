from langchain_groq import ChatGroq

from app.integrations.groq_client import get_chat_groq


def get_llm() -> ChatGroq:
    return get_chat_groq()
