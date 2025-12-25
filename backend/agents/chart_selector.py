"""
Chart Selector Agent - Selects the optimal chart type based on data analysis.

This agent takes the data analysis from the Data Analyzer Agent and determines
which visualization type would best represent the data.
"""

import os
from crewai import Agent, Task, LLM


def get_chart_selector_agent() -> Agent:
    """Create and return the Chart Selector Agent."""
    
    llm = LLM(
        model=f"groq/{os.getenv('GROQ_MODEL', 'llama-3.3-70b-versatile')}",
        api_key=os.getenv("GROQ_API_KEY"),
        temperature=0.1,
    )
    
    return Agent(
        role="Visualization Expert",
        goal="Select the most effective chart type to communicate data insights",
        backstory="""You are a data visualization expert who understands how 
        different chart types communicate different kinds of information.
        
        Your expertise includes:
        - Bar charts for categorical comparisons
        - Line charts for trends over time
        - Pie charts for showing composition/percentages
        - Area charts for cumulative or volume data
        - Scatter plots for correlations
        - Radar charts for multi-dimensional comparisons
        - Composed charts for showing multiple metrics together
        
        You make decisions based on what will most clearly communicate 
        the data's story to the viewer.""",
        llm=llm,
        verbose=True,
        allow_delegation=False,
    )


def select_chart_task(agent: Agent, question: str, data_analysis: str) -> Task:
    """Create a task to select the best chart type."""
    
    description = f"""
    Based on the data analysis, select the best chart type for visualization.
    
    ORIGINAL QUESTION: {question}
    
    DATA ANALYSIS:
    {data_analysis}
    
    MANDATORY CHART SELECTION RULES (FOLLOW STRICTLY):
    
    | Keyword/Pattern in Question | MUST USE Chart Type |
    |-----------------------------|---------------------|
    | "percentage", "distribution", "proportion", "share" | pie |
    | "trend", "over time", "monthly", "daily", "yearly" | line |
    | "cumulative", "running total", "stacked over time" | area |
    | "compare multiple metrics", "vs", "and", 3+ numeric columns | radar |
    | "correlation", "vs", "relationship between" (2 numeric columns) | scatter |
    | "revenue AND count", "sales AND orders", 2 metrics + time | composed |
    | "by category", "per category", "top N" (single metric) | bar |
    | "list", "details", "all records", "show me all" | table |
    
    CRITICAL INSTRUCTIONS:
    1. If the question mentions comparing 3+ attributes/metrics → USE "radar"
    2. If the question asks for "average price, rating, stock" or similar multi-metric → USE "radar"  
    3. If the question combines count + amount (e.g., "sales and orders") → USE "composed"
    4. If the question is about percentages/distribution → USE "pie"
    5. If showing trends over time → USE "line"
    6. DO NOT default to "bar" unless it's clearly a categorical single-metric comparison
    7. BE BOLD - use the full variety of chart types!
    
    Return a JSON object with this EXACT structure:
    {{
        "chart_type": "bar|line|pie|area|scatter|radar|composed|table",
        "reasoning": "Brief explanation of why this chart type was selected",
        "primary_metric": "the main numeric column to visualize",
        "secondary_metrics": ["additional numeric columns if applicable"],
        "category_axis": "the column to use for x-axis/categories"
    }}
    
    Return ONLY the JSON object, no markdown, no explanations.
    """
    
    return Task(
        description=description,
        expected_output="JSON object with chart selection",
        agent=agent,
    )
