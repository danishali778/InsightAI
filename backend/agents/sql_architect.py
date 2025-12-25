"""
SQL Architect Agent - InsightAI
CrewAI Agent specialized in writing PostgreSQL queries.
"""
import os
from crewai import Agent, Task, LLM
from dotenv import load_dotenv

load_dotenv()

# Configure Groq LLM for CrewAI (uses LiteLLM format)
def get_groq_llm():
    """Get Groq LLM configured for CrewAI."""
    return LLM(
        model=f"groq/{os.getenv('GROQ_MODEL', 'llama3-70b-8192')}",
        api_key=os.getenv("GROQ_API_KEY"),
        temperature=0,
    )


def get_sql_architect_agent() -> Agent:
    """
    Create the SQL Architect Agent.
    
    Role: Senior Database Engineer
    Goal: Write precise, optimized PostgreSQL queries
    """
    return Agent(
        role="Senior Database Engineer",
        goal="Write precise, optimized PostgreSQL queries based on natural language questions. "
             "Always analyze the schema before writing queries. Return ONLY the SQL query, no explanations.",
        backstory="""You are an expert in SQL dialects, particularly PostgreSQL. 
        You have 15 years of experience optimizing database queries for enterprise applications.
        You always check the schema before writing any code.
        You write clean, efficient queries that follow best practices.
        You never use SELECT * - always specify columns explicitly.
        You handle NULL values appropriately and use proper JOINs.""",
        llm=get_groq_llm(),
        verbose=True,
        allow_delegation=False,
    )


def generate_sql_task(agent: Agent, question: str, schema: str, error: str = None) -> Task:
    """
    Create a task for the SQL Architect Agent.
    
    Args:
        agent: The SQL Architect Agent instance
        question: User's natural language question
        schema: Database schema information
        error: Optional error message for self-healing
        
    Returns:
        CrewAI Task for SQL generation
    """
    if error:
        # Self-healing mode: fix the broken query
        description = f"""
        The previous SQL query failed with an error. Please fix it.
        
        DATABASE SCHEMA:
        {schema}
        
        USER QUESTION: {question}
        
        ERROR MESSAGE: {error}
        
        Write a CORRECTED PostgreSQL query that:
        1. Addresses the error message
        2. Properly answers the user's question
        3. Uses only tables and columns that exist in the schema
        
        Return ONLY the corrected SQL query, nothing else.
        """
    else:
        # Normal mode: generate new query
        description = f"""
        Generate a PostgreSQL query to answer the user's question.
        
        DATABASE SCHEMA:
        {schema}
        
        USER QUESTION: {question}
        
        Write a PostgreSQL query that:
        1. Accurately answers the question
        2. Uses only tables and columns from the schema
        3. Is optimized for performance
        4. Handles potential NULL values
        
        Return ONLY the SQL query, nothing else. No markdown, no explanations.
        """
    
    return Task(
        description=description,
        expected_output="A valid PostgreSQL query string",
        agent=agent,
    )
