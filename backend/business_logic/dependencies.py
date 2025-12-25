"""
InsightAI - Centralized Dependencies Loader
All dependencies are loaded and initialized here at application startup.
"""
import os
from functools import lru_cache
from dotenv import load_dotenv
from langchain_groq import ChatGroq
from langchain_community.utilities import SQLDatabase

# Load environment variables
load_dotenv()


class Settings:
    """Application settings loaded from environment variables."""
    
    # Database URL (single connection string)
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql://postgres:password@localhost:5432/postgres")
    
    # Groq Configuration
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
    GROQ_MODEL: str = os.getenv("GROQ_MODEL", "llama3-70b-8192")


@lru_cache()
def get_settings() -> Settings:
    """Get cached application settings."""
    return Settings()


@lru_cache()
def get_llm() -> ChatGroq:
    """
    Initialize and cache the Groq LLM instance.
    Uses llama3-70b-8192 for high-speed inference.
    """
    settings = get_settings()
    return ChatGroq(
        api_key=settings.GROQ_API_KEY,
        model=settings.GROQ_MODEL,
        temperature=0,
        max_tokens=4096,
    )


@lru_cache()
def get_database() -> SQLDatabase:
    """
    Initialize and cache the SQLDatabase connection.
    Provides schema inspection and query execution capabilities.
    """
    settings = get_settings()
    return SQLDatabase.from_uri(settings.DATABASE_URL)


def get_schema() -> str:
    """
    Get the database schema information for the agents.
    Returns table names and column information.
    """
    db = get_database()
    return db.get_table_info()


def execute_query(sql: str) -> list:
    """
    Execute a SQL query on the database.
    
    Args:
        sql: The SQL query string to execute.
        
    Returns:
        List of results from the query.
        
    Raises:
        Exception: If query execution fails.
    """
    db = get_database()
    return db.run(sql)


# Initialize all dependencies at module load
def init_dependencies():
    """
    Initialize all dependencies at application startup.
    This ensures all connections are validated early.
    """
    print("🚀 Initializing InsightAI Dependencies...")
    
    settings = get_settings()
    print(f"  ✓ Settings loaded (Database: {settings.DATABASE_URL.split('/')[-1]})")
    
    try:
        llm = get_llm()
        print(f"  ✓ Groq LLM initialized (Model: {settings.GROQ_MODEL})")
    except Exception as e:
        print(f"  ✗ Failed to initialize Groq LLM: {e}")
        raise
    
    try:
        db = get_database()
        tables = db.get_usable_table_names()
        print(f"  ✓ Database connected (Tables: {', '.join(tables)})")
    except Exception as e:
        print(f"  ✗ Failed to connect to database: {e}")
        raise
    
    print("✅ All dependencies initialized successfully!")
    return True
