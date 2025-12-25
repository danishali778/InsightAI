"""
Data Analyzer Agent - Analyzes query results to identify data patterns.

This agent examines the structure and content of query results to provide
insights that help the Chart Selector Agent choose the best visualization.
"""

import os
from crewai import Agent, Task, LLM


def get_data_analyzer_agent() -> Agent:
    """Create and return the Data Analyzer Agent."""
    
    llm = LLM(
        model=f"groq/{os.getenv('GROQ_MODEL', 'llama-3.3-70b-versatile')}",
        api_key=os.getenv("GROQ_API_KEY"),
        temperature=0.1,
    )
    
    return Agent(
        role="Data Pattern Analyst",
        goal="Analyze data structure and identify patterns for optimal visualization",
        backstory="""You are an expert data analyst who specializes in 
        understanding data patterns and structures. You can quickly identify:
        - Whether data represents time series, categorical comparisons, or correlations
        - The types of columns (numeric, categorical, temporal)
        - The cardinality and distribution of values
        - Relationships between columns that suggest specific visualization types""",
        llm=llm,
        verbose=True,
        allow_delegation=False,
    )


def analyze_data_task(agent: Agent, question: str, results: str) -> Task:
    """Create a task to analyze data patterns."""
    
    description = f"""
    Analyze the following query results to understand the data pattern.
    
    ORIGINAL QUESTION: {question}
    
    QUERY RESULTS (as tuples - each position is a column):
    {results}
    
    IMPORTANT: The results are tuples. Each position in the tuple is a different column.
    For example: ('Books', 'Product Name Here', 123.45, 25.5) has 4 columns.
    
    Provide a structured analysis with:
    
    1. COLUMNS: List EVERY column with:
       - A meaningful field name based on the question (e.g., "product_name", "category", "revenue")
       - Column type: numeric/categorical/temporal
       - Column position (0, 1, 2, 3...)
    
    2. ROW_COUNT: Number of data rows
    
    3. DATA_PATTERN: One of these patterns:
       - "time_series" - data shows values over time periods
       - "categorical_single_metric" - categories with one numeric value each
       - "categorical_multi_metric" - categories with multiple numeric values each (2+ numeric columns)
       - "correlation" - two numeric columns that might be related
       - "composition" - data showing parts of a whole (good for pie)
       - "detailed_records" - 4+ columns with mix of text and numeric (best as table)
    
    4. TEXT_COLUMNS: List any text/string columns that should be displayed (like product names, descriptions)
    
    5. SPECIAL_NOTES: Any observations about the data
    
    Return a JSON object with this EXACT structure:
    {{
        "columns": [
            {{"name": "suggested_field_name", "type": "numeric|categorical|temporal", "position": 0}},
            {{"name": "product_name", "type": "categorical", "position": 1}},
            ...
        ],
        "row_count": <number>,
        "data_pattern": "time_series|categorical_single_metric|categorical_multi_metric|correlation|composition|detailed_records",
        "category_column": "column_name_for_labels",
        "metric_columns": ["numeric_column1", "numeric_column2"],
        "text_columns": ["product_name", "description"],
        "special_notes": "any observations"
    }}
    
    Return ONLY the JSON object, no markdown, no explanations.
    """
    
    return Task(
        description=description,
        expected_output="JSON object with complete data analysis including ALL columns",
        agent=agent,
    )

