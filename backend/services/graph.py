"""
LangGraph Workflow - InsightAI
State machine for Text-to-SQL with self-healing capabilities.
"""
from typing import TypedDict, Literal, Annotated
from langgraph.graph import StateGraph, END
from crewai import Crew
import json

from business_logic import get_schema, execute_query
from agents import (
    get_sql_architect_agent,
    generate_sql_task,
    get_data_viz_agent,
    visualize_data_task,
)
from agents.data_viz import parse_viz_config
from agents.data_analyzer import get_data_analyzer_agent, analyze_data_task
from agents.chart_selector import get_chart_selector_agent, select_chart_task


class GraphState(TypedDict):
    """State schema for the LangGraph workflow."""
    question: str
    sql_query: str
    results: str
    error: str
    visualization_config: dict
    retry_count: int
    steps: list  # For SSE logging


def add_step(state: GraphState, message: str) -> list:
    """Add a step message to the state."""
    steps = state.get("steps", [])
    steps.append(message)
    return steps


# ============== Node Functions ==============

def generate_sql(state: GraphState) -> GraphState:
    """
    Node 1: Generate SQL using SQL_Architect_Agent.
    Invokes CrewAI agent to write PostgreSQL query.
    """
    steps = add_step(state, "🔍 Groq is analyzing your question...")
    
    # Get database schema
    schema = get_schema()
    steps = add_step(state, "📊 Retrieved database schema")
    
    # Create agent and task
    agent = get_sql_architect_agent()
    error = state.get("error") if state.get("retry_count", 0) > 0 else None
    task = generate_sql_task(agent, state["question"], schema, error)
    
    steps = add_step(state, "🤖 SQL Architect is writing query...")
    
    # Execute with CrewAI
    crew = Crew(
        agents=[agent],
        tasks=[task],
        verbose=True,
    )
    result = crew.kickoff()
    
    # Extract SQL from result
    sql_query = str(result).strip()
    
    # Clean up any markdown formatting
    if sql_query.startswith("```"):
        lines = sql_query.split("\n")
        sql_query = "\n".join(lines[1:-1] if lines[-1] == "```" else lines[1:])
    
    steps = add_step(state, f"✅ SQL query generated")
    
    return {
        **state,
        "sql_query": sql_query,
        "error": "",
        "steps": steps,
    }


def execute_sql(state: GraphState) -> GraphState:
    """
    Node 2: Execute SQL on PostgreSQL database.
    """
    steps = add_step(state, "⚡ Executing query on PostgreSQL...")
    
    try:
        results = execute_query(state["sql_query"])
        steps = add_step(state, "✅ Query executed successfully")
        
        return {
            **state,
            "results": str(results),
            "error": "",
            "steps": steps,
        }
    except Exception as e:
        error_msg = str(e)
        retry_count = state.get("retry_count", 0)
        steps = add_step(state, f"❌ Error: {error_msg[:100]}...")
        
        return {
            **state,
            "results": "",
            "error": error_msg,
            "retry_count": retry_count + 1,
            "steps": steps,
        }


def fix_sql(state: GraphState) -> GraphState:
    """
    Node 3: Self-healing - Fix broken SQL query.
    Re-invokes SQL_Architect_Agent with error context.
    """
    steps = add_step(state, "🔧 Self-healing: Attempting to fix SQL...")
    
    # Get schema again
    schema = get_schema()
    
    # Create agent and task with error context
    agent = get_sql_architect_agent()
    task = generate_sql_task(
        agent, 
        state["question"], 
        schema, 
        error=state["error"]
    )
    
    steps = add_step(state, f"🤖 SQL Architect is correcting query (Attempt {state['retry_count']}/3)...")
    
    # Execute with CrewAI
    crew = Crew(
        agents=[agent],
        tasks=[task],
        verbose=True,
    )
    result = crew.kickoff()
    
    # Extract SQL from result
    sql_query = str(result).strip()
    
    # Clean up any markdown formatting
    if sql_query.startswith("```"):
        lines = sql_query.split("\n")
        sql_query = "\n".join(lines[1:-1] if lines[-1] == "```" else lines[1:])
    
    steps = add_step(state, "✅ Corrected SQL query generated")
    
    return {
        **state,
        "sql_query": sql_query,
        "steps": steps,
    }


def visualize_data(state: GraphState) -> GraphState:
    """
    Node 4: Generate visualization config using Multi-Agent System.
    
    Uses 3 specialized agents:
    1. Data Analyzer - Identifies data patterns and column types
    2. Chart Selector - Picks the best visualization type
    3. Config Generator - Creates the final visualization config
    """
    import ast
    
    steps = add_step(state, "📊 Multi-Agent Visualization System starting...")
    
    # Parse results
    full_results = state["results"]
    results_list = None
    sample_results = full_results
    
    try:
        if full_results.strip().startswith("["):
            results_list = ast.literal_eval(full_results)
            if isinstance(results_list, list) and len(results_list) > 20:
                sample_results = f"{results_list[:20]}\n... (showing 20 of {len(results_list)} total rows)"
    except:
        pass
    
    # ============== AGENT 1: Data Analyzer ==============
    steps = add_step(state, "🔍 Agent 1: Data Analyzer examining data structure...")
    
    analyzer_agent = get_data_analyzer_agent()
    analyzer_task = analyze_data_task(analyzer_agent, state["question"], sample_results)
    
    analyzer_crew = Crew(
        agents=[analyzer_agent],
        tasks=[analyzer_task],
        verbose=True,
    )
    analysis_result = analyzer_crew.kickoff()
    analysis_str = str(analysis_result)
    
    steps = add_step(state, "✅ Data analysis complete")
    
    # ============== AGENT 2: Chart Selector ==============
    steps = add_step(state, "📈 Agent 2: Chart Selector choosing visualization...")
    
    selector_agent = get_chart_selector_agent()
    selector_task = select_chart_task(selector_agent, state["question"], analysis_str)
    
    selector_crew = Crew(
        agents=[selector_agent],
        tasks=[selector_task],
        verbose=True,
    )
    selection_result = selector_crew.kickoff()
    selection_str = str(selection_result)
    
    steps = add_step(state, "✅ Chart type selected")
    
    # ============== AGENT 3: Config Generator ==============
    steps = add_step(state, "⚙️ Agent 3: Generating visualization config...")
    
    config_agent = get_data_viz_agent()
    config_task = visualize_data_task(config_agent, state["question"], sample_results, selection_str)
    
    config_crew = Crew(
        agents=[config_agent],
        tasks=[config_task],
        verbose=True,
    )
    config_result = config_crew.kickoff()
    
    # Parse final visualization config
    viz_config = parse_viz_config(str(config_result))
    
    # ============== FALLBACK LOGIC: Override chart type based on question/data ==============
    question_lower = state["question"].lower()
    
    # Detect chart type from question keywords
    override_chart_type = None
    
    # PIE chart keywords
    if any(kw in question_lower for kw in ["percentage", "distribution", "proportion", "share", "breakdown"]):
        override_chart_type = "pie"
    
    # LINE chart keywords (time-based)
    elif any(kw in question_lower for kw in ["trend", "over time", "monthly", "daily", "yearly", "weekly", "timeline"]):
        override_chart_type = "line"
    
    # AREA chart keywords
    elif any(kw in question_lower for kw in ["cumulative", "running total", "stacked"]):
        override_chart_type = "area"
    
    # SCATTER chart keywords
    elif any(kw in question_lower for kw in ["correlation", "relationship between", "price vs", "vs rating"]):
        override_chart_type = "scatter"
    
    # RADAR chart keywords (multi-metric comparison)
    elif any(kw in question_lower for kw in ["compare", "multiple metrics", "price, rating", "rating, stock", "price and rating and"]):
        override_chart_type = "radar"
    
    # COMPOSED chart keywords (two metrics together)
    elif any(kw in question_lower for kw in ["sales and orders", "revenue and count", "amount and number"]):
        override_chart_type = "composed"
    
    # Detect multi-metric data structure -> use radar or composed
    if viz_config.get("data") and isinstance(viz_config["data"], list) and len(viz_config["data"]) > 0:
        sample_item = viz_config["data"][0] if viz_config["data"] else {}
        if isinstance(sample_item, dict):
            # Count numeric columns
            numeric_keys = [k for k, v in sample_item.items() if isinstance(v, (int, float))]
            if len(numeric_keys) >= 3 and viz_config.get("type") in ["bar", "line"]:
                # Multi-metric data but defaulted to bar/line -> override to radar
                if not override_chart_type:
                    override_chart_type = "radar"
                    # Set yKey to all numeric columns
                    viz_config["yKey"] = numeric_keys
            elif len(numeric_keys) == 2 and viz_config.get("type") == "bar":
                # Two metrics -> could be composed
                if not override_chart_type and "and" in question_lower:
                    override_chart_type = "composed"
                    viz_config["yKey"] = numeric_keys
    
    # Apply override if detected
    if override_chart_type and viz_config.get("type") in ["bar", "line"]:
        viz_config["type"] = override_chart_type
        steps = add_step(state, f"🔄 Smart fallback: Switching to {override_chart_type} chart for better visualization")
    
    # ============== CALCULATE RECOMMENDED CHARTS ==============
    recommended_charts = [viz_config.get("type", "bar")]  # Always include selected type
    
    # Add recommendations based on data structure
    if viz_config.get("data") and isinstance(viz_config["data"], list) and len(viz_config["data"]) > 0:
        sample_item = viz_config["data"][0] if viz_config["data"] else {}
        if isinstance(sample_item, dict):
            keys = list(sample_item.keys())
            numeric_keys = [k for k, v in sample_item.items() if isinstance(v, (int, float))]
            num_rows = len(viz_config["data"])
            
            # Bar chart - good for most categorical data
            if len(numeric_keys) >= 1 and "bar" not in recommended_charts:
                recommended_charts.append("bar")
            
            # Table - always applicable, especially for 4+ columns
            if len(keys) >= 4 and "table" not in recommended_charts:
                recommended_charts.append("table")
            
            # Radar - good for multi-metric comparison (3+ numeric)
            if len(numeric_keys) >= 3 and "radar" not in recommended_charts:
                recommended_charts.append("radar")
            
            # Composed - good for 2 numeric metrics
            if len(numeric_keys) == 2 and "composed" not in recommended_charts:
                recommended_charts.append("composed")
            
            # Line - good for time series or trends
            if any(kw in question_lower for kw in ["trend", "time", "monthly", "daily", "yearly"]):
                if "line" not in recommended_charts:
                    recommended_charts.append("line")
            
            # Pie - good for single metric showing distribution
            if len(numeric_keys) == 1 and num_rows <= 10:
                if "pie" not in recommended_charts:
                    recommended_charts.append("pie")
            
            # Area - good for cumulative/stacked data
            if any(kw in question_lower for kw in ["cumulative", "total", "stacked"]):
                if "area" not in recommended_charts:
                    recommended_charts.append("area")
            
            # Scatter - good for correlation between 2 numeric
            if len(numeric_keys) >= 2:
                if "scatter" not in recommended_charts:
                    recommended_charts.append("scatter")
            
            # Stacked/Clustered charts - good for 2+ numeric metrics
            if len(numeric_keys) >= 2:
                # Stacked column - for comparing totals with breakdown
                if "stacked_column" not in recommended_charts:
                    recommended_charts.append("stacked_column")
                # Clustered column - for side-by-side comparison
                if "clustered_column" not in recommended_charts:
                    recommended_charts.append("clustered_column")
            
            # 100% Stacked - good for showing proportions across categories
            if len(numeric_keys) >= 2 and num_rows <= 15:
                if "stacked_100" not in recommended_charts:
                    recommended_charts.append("stacked_100")
    
    # Add recommended charts to config
    viz_config["recommended_charts"] = recommended_charts
    
    # If we sampled, ensure full data is used for rendering
    if results_list and len(results_list) > 20:
        if viz_config.get("data") and isinstance(viz_config["data"], list) and len(viz_config["data"]) > 0:
            sample_item = viz_config["data"][0] if viz_config["data"] else {}
            keys = list(sample_item.keys()) if isinstance(sample_item, dict) else []
            
            if keys and len(keys) >= 2:
                full_data = []
                for row in results_list:
                    if isinstance(row, (list, tuple)):
                        item = {}
                        for i, key in enumerate(keys):
                            if i < len(row):
                                val = row[i]
                                if hasattr(val, '__float__'):
                                    val = float(val)
                                item[key] = val
                        full_data.append(item)
                    else:
                        full_data.append(row)
                viz_config["data"] = full_data
    
    steps = add_step(state, f"✅ Visualization ready: {viz_config.get('type', 'table')} chart (Recommended: {', '.join(recommended_charts)})")
    
    return {
        **state,
        "visualization_config": viz_config,
        "steps": steps,
    }



# ============== Edge Functions ==============

def should_retry(state: GraphState) -> Literal["fix_sql", "visualize_data", "error"]:
    """
    Decision edge after execute_sql.
    Determines whether to retry, visualize, or error out.
    """
    if not state.get("error"):
        return "visualize_data"
    
    if state.get("retry_count", 0) < 3:
        return "fix_sql"
    
    return "error"


def handle_error(state: GraphState) -> GraphState:
    """
    Terminal node for unrecoverable errors.
    """
    steps = add_step(state, "❌ Self-healing failed after 3 attempts")
    
    return {
        **state,
        "visualization_config": {
            "type": "error",
            "title": "Query Failed",
            "message": state.get("error", "Unknown error"),
            "data": None,
        },
        "steps": steps,
    }


# ============== Build Graph ==============

def build_graph() -> StateGraph:
    """
    Build the LangGraph StateGraph workflow.
    
    Flow:
    generate_sql -> execute_sql -> [decision]
                                   -> visualize_data (success)
                                   -> fix_sql -> execute_sql (error, retry < 3)
                                   -> error (retry >= 3)
    """
    # Create graph with state schema
    workflow = StateGraph(GraphState)
    
    # Add nodes
    workflow.add_node("generate_sql", generate_sql)
    workflow.add_node("execute_sql", execute_sql)
    workflow.add_node("fix_sql", fix_sql)
    workflow.add_node("visualize_data", visualize_data)
    workflow.add_node("error", handle_error)
    
    # Set entry point
    workflow.set_entry_point("generate_sql")
    
    # Add edges
    workflow.add_edge("generate_sql", "execute_sql")
    workflow.add_conditional_edges(
        "execute_sql",
        should_retry,
        {
            "fix_sql": "fix_sql",
            "visualize_data": "visualize_data",
            "error": "error",
        }
    )
    workflow.add_edge("fix_sql", "execute_sql")
    workflow.add_edge("visualize_data", END)
    workflow.add_edge("error", END)
    
    return workflow


def run_workflow(question: str) -> GraphState:
    """
    Execute the full workflow for a given question.
    
    Args:
        question: Natural language question from user
        
    Returns:
        Final state with visualization config
    """
    # Build and compile graph
    graph = build_graph()
    app = graph.compile()
    
    # Initial state
    initial_state: GraphState = {
        "question": question,
        "sql_query": "",
        "results": "",
        "error": "",
        "visualization_config": {},
        "retry_count": 0,
        "steps": [],
    }
    
    # Run workflow
    final_state = app.invoke(initial_state)
    
    return final_state
