"""
Data Visualization Agent - InsightAI
CrewAI Agent specialized in analyzing data and recommending visualizations.
"""
import os
import json
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


def get_data_viz_agent() -> Agent:
    """
    Create the Data Visualization Agent.
    
    Role: BI Dashboard Specialist
    Goal: Analyze datasets and determine optimal visualization
    """
    return Agent(
        role="BI Dashboard Specialist",
        goal="Analyze query results and determine the best visualization type. "
             "Return a JSON configuration for the frontend chart.",
        backstory="""You are a Business Intelligence expert with deep knowledge of 
        data visualization best practices. You understand when to use bar charts vs 
        line charts vs pie charts vs tables. You always consider:
        - Data cardinality (number of unique values)
        - Data type (categorical vs numerical vs temporal)
        - User intent (comparison, trend, composition, distribution)
        You format your output as clean JSON for frontend consumption.""",
        llm=get_groq_llm(),
        verbose=True,
        allow_delegation=False,
    )


def visualize_data_task(agent: Agent, question: str, results: str, chart_selection: str = None) -> Task:
    """
    Create a task for the Data Visualization Agent.
    
    Args:
        agent: The Data Viz Agent instance
        question: Original user question for context
        results: Query results as string
        chart_selection: Optional chart selection from Chart Selector Agent
        
    Returns:
        CrewAI Task for visualization config generation
    """
    
    # If chart selection is provided, use it to guide config generation
    if chart_selection:
        description = f"""
    Generate a visualization configuration based on the Chart Selector's recommendation.
    
    ORIGINAL QUESTION: {question}
    
    CHART SELECTOR'S DECISION:
    {chart_selection}
    
    QUERY RESULTS (as tuples - each tuple is a row):
    {results}
    
    CRITICAL INSTRUCTIONS:
    1. PRESERVE ALL COLUMNS from the query results - do NOT drop any columns
    2. Convert each tuple to a JSON object with meaningful field names
    3. If there are 4 columns like (category, product_name, revenue, percentage), create:
       {{"category": "...", "product_name": "...", "revenue": 123.45, "percentage": 12.34}}
    4. Use descriptive field names based on the question context
    5. Use the chart_type specified by the Chart Selector
    6. Map the category_axis to xKey
    7. For multi-metric charts (radar, composed), use yKey as an ARRAY of all numeric column names
    
    Return a JSON object with this EXACT structure:
    {{
        "type": "the chart type from selection",
        "title": "Descriptive chart title based on the question",
        "xKey": "the category column from selection",
        "yKey": "primary_metric" OR ["metric1", "metric2", "metric3"] for multi-metric,
        "data": [MUST include ALL columns from query - do not drop any data]
    }}
    
    Return ONLY the JSON object, no markdown, no explanations.
    """
    else:
        # Fallback to original behavior if no selection provided
        description = f"""
    Analyze the following query results and determine the best visualization.
    
    ORIGINAL QUESTION: {question}
    
    QUERY RESULTS (as tuples - each tuple is a row):
    {results}
    
    CRITICAL INSTRUCTIONS:
    1. PRESERVE ALL COLUMNS from the query results - do NOT drop any columns
    2. Convert each tuple to a JSON object with meaningful field names based on the question
    3. Example: If question asks for "product name, revenue, percentage" and tuple is ('Books', 'Product A', 123.45, 12.34),
       create: {{"category": "Books", "product_name": "Product A", "revenue": 123.45, "percentage": 12.34}}
    4. Use descriptive field names that match what was asked for
    
    Based on the data, determine:
    1. The best chart type from the available options
    2. Which field should be used for the X-axis (categories/labels)
    3. Which field(s) should be used for the Y-axis (values)
    4. A descriptive title for the visualization
    
    Available chart types:
    - "bar" - Comparing categories side by side
    - "line" - Showing trends over time
    - "pie" - Showing composition/percentages
    - "area" - Showing cumulative values over time
    - "scatter" - Showing correlation between two numeric values
    - "radar" - Comparing multiple metrics across categories (use yKey as array)
    - "composed" - Combining bar and line chart (use yKey as array)
    - "table" - Detailed data with many columns (BEST for 4+ columns)
    
    Return a JSON object with this EXACT structure:
    {{
        "type": "bar|line|pie|area|scatter|radar|composed|table",
        "title": "Descriptive chart title",
        "xKey": "field_name_for_x_axis",
        "yKey": "field_name" OR ["field1", "field2"] for multi-metric,
        "data": [MUST include ALL columns from query results - do not drop any data]
    }}
    
    Return ONLY the JSON object, no markdown, no explanations.
    """
    
    return Task(
        description=description,
        expected_output="A JSON object with visualization configuration including ALL columns from query",
        agent=agent,
    )


def parse_viz_config(result: str) -> dict:
    """
    Parse the visualization config from agent output.
    
    Args:
        result: Raw agent output string
        
    Returns:
        Parsed visualization config dictionary
    """
    try:
        # Clean up any markdown formatting
        cleaned = result.strip()
        if cleaned.startswith("```"):
            # Remove markdown code blocks
            lines = cleaned.split("\n")
            # Find the end of the code block
            end_idx = -1 if lines[-1].strip() in ["```", "```json"] else len(lines)
            start_idx = 1 if lines[0].startswith("```") else 0
            cleaned = "\n".join(lines[start_idx:end_idx])
            cleaned = cleaned.strip()
        
        config = json.loads(cleaned)
        
        # Validate and fix data structure
        if "data" in config and isinstance(config["data"], list) and len(config["data"]) > 0:
            first_item = config["data"][0]
            
            # Check if xKey exists in data
            if config.get("xKey") and isinstance(first_item, dict):
                if config["xKey"] not in first_item:
                    # Try to find a suitable key
                    keys = list(first_item.keys())
                    # Prefer 'name', 'customer', 'label' for xKey
                    for preferred in ["name", "customer", "label", "category"]:
                        if preferred in keys:
                            config["xKey"] = preferred
                            break
                    else:
                        # Use first non-numeric key
                        for k in keys:
                            if not isinstance(first_item[k], (int, float)):
                                config["xKey"] = k
                                break
                
                # Handle yKey being an array (LLM sometimes returns multiple y fields)
                if isinstance(config.get("yKey"), list):
                    # For radar and composed charts, keep the array for multi-metric display
                    if config.get("type") not in ["radar", "composed"]:
                        # For other charts, use first yKey from the array
                        config["yKey"] = config["yKey"][0] if config["yKey"] else "value"
                
                # Check if yKey exists in data (only for string yKey)
                yKey = config.get("yKey")
                if yKey and isinstance(yKey, str) and yKey not in first_item:
                    keys = list(first_item.keys())
                    # Prefer numeric keys for yKey
                    for k in keys:
                        if isinstance(first_item.get(k), (int, float)):
                            config["yKey"] = k
                            break
        
        return config
    except json.JSONDecodeError:
        # Fallback to table view if parsing fails
        return {
            "type": "table",
            "title": "Query Results",
            "data": result,
            "xKey": None,
            "yKey": None,
        }
