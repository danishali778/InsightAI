from groq import Groq
from langchain_groq import ChatGroq

from app.core.config import settings

_groq_client: Groq | None = None
_chat_groq: ChatGroq | None = None


def get_groq_client() -> Groq:
    global _groq_client
    if _groq_client is None:
        _groq_client = Groq(api_key=settings.require("groq_api_key"))
    return _groq_client


def get_chat_groq() -> ChatGroq:
    global _chat_groq
    if _chat_groq is None:
        _chat_groq = ChatGroq(
            api_key=settings.require("groq_api_key"),
            model=settings.groq_model,
            temperature=0,
            max_tokens=4096,
        )
    return _chat_groq


__all__ = ["get_groq_client", "get_chat_groq"]
