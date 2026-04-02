from typing import TypedDict, Optional
from langgraph.graph import StateGraph, END

from database import connection_manager
from query_executor.executor import execute_query
from query_executor.safety import validate_query
from .visualization_agent import generate_visualization_blueprint
from .schema_builder import build_schema_context, build_conversation_prompt
from .sql_generator import generate_sql, generate_error_correction
from .session_manager import get_history_for_llm


# ─── State Definition ──────────────────────────────────────
class ChatState(TypedDict):
    """State that flows through the LangGraph workflow."""
    user_id: str
    connection_id: str
    session_id: str
    user_message: str
    schema_context: str
    llm_messages: list[dict]
    explanation: str
    sql: str
    column_metadata: dict
    columns: list[str]
    rows: list[dict]
    row_count: int
    execution_time_ms: float
    error: str
    retry_count: int
    max_retries: int
    chart_recommendation: Optional[dict]


# ─── Node Functions ────────────────────────────────────────

def build_context(state: ChatState) -> dict:
    """Node 1: Build schema context and conversation prompt."""
    schema_context = build_schema_context(state["user_id"], state["connection_id"])
    history = get_history_for_llm(state["user_id"], state["session_id"])
    llm_messages = build_conversation_prompt(
        schema_context=schema_context,
        history=history,
        user_message=state["user_message"],
    )
    return {
        "schema_context": schema_context,
        "llm_messages": llm_messages,
    }


_DESTRUCTIVE_KEYWORDS = {'delete', 'update', 'insert', 'drop', 'truncate', 'alter'}


def generate_sql_node(state: ChatState) -> dict:
    """Node 2: Call LLM to generate SQL."""
    explanation, metadata, sql = generate_sql(state["llm_messages"])

    # Prepend read-only notice if user asked for a destructive operation
    user_msg = state["user_message"].lower()
    if any(kw in user_msg for kw in _DESTRUCTIVE_KEYWORDS):
        explanation = (
            "QueryMind is read-only — data modification queries are not supported.\n\n"
            + explanation
        )

    return {
        "explanation": explanation,
        "column_metadata": metadata,
        "sql": sql,
        "error": "" if sql else "LLM did not generate any SQL query.",
    }


def validate_sql_node(state: ChatState) -> dict:
    """Node 3: Validate the generated SQL for safety."""
    sql = state["sql"]
    if not sql:
        return {"error": "No SQL query was generated."}

    is_safe, error_msg = validate_query(sql)
    if not is_safe:
        return {"error": error_msg}

    return {"error": ""}


def execute_sql_node(state: ChatState) -> dict:
    """Node 4: Execute the SQL against the database."""
    engine = connection_manager.get_engine(state["user_id"], state["connection_id"])
    if not engine:
        return {"error": "Database connection not found."}

    sql = state["sql"]
    print(f"[execute_sql] Running: {sql[:100]}...")

    # execute_query handles validation + row limiting internally
    result = execute_query(state["user_id"], engine, sql, row_limit=500, connection_id=state["connection_id"],
                           readonly=connection_manager.get_readonly(state["user_id"], state["connection_id"]))

    if result.success:
        print(f"[execute_sql] ✅ Success — {result.row_count} rows, {len(result.columns)} cols")
        return {
            "columns": result.columns,
            "rows": result.rows,
            "row_count": result.row_count,
            "execution_time_ms": result.execution_time_ms,
            "error": "",
        }
    else:
        print(f"[execute_sql] ❌ Error — {result.error}")
        return {"error": result.error or "Query execution failed."}


def analyze_results_node(state: ChatState) -> dict:
    """Node 5: Analyze query results and recommend a chart."""
    columns = state.get("columns", [])
    rows = state.get("rows", [])

    if not columns or not rows:
        return {"chart_recommendation": None}

    preview = rows[:5]
    blueprint = generate_visualization_blueprint(
        user_message=state.get("user_message", ""),
        sql=state.get("sql", ""),
        preview_rows=preview,
        column_metadata=state.get("column_metadata", {})
    )

    if blueprint:
        print(f"[analyze] 📊 AI Recommended: {blueprint.get('type')} chart — {blueprint.get('title')}")
    else:
        print(f"[analyze] 📊 AI No chart recommended for this query")

    return {"chart_recommendation": blueprint}


def handle_error_node(state: ChatState) -> dict:
    """Node 5: Feed error back to LLM for self-correction."""
    retry_count = state["retry_count"] + 1
    explanation, metadata, corrected_sql = generate_error_correction(
        messages=state["llm_messages"],
        sql=state["sql"],
        error=state["error"],
    )
    return {
        "explanation": explanation,
        "column_metadata": metadata,
        "sql": corrected_sql,
        "retry_count": retry_count,
        "error": "" if corrected_sql else "LLM could not generate a corrected query.",
    }


# ─── Routing Functions ─────────────────────────────────────

def should_execute_or_retry(state: ChatState) -> str:
    """After validation: execute if valid, retry if error and retries left."""
    if not state.get("error"):
        return "execute"
    if state["retry_count"] < state["max_retries"]:
        return "retry"
    return "give_up"


def should_finish_or_retry(state: ChatState) -> str:
    """After execution: finish if success, retry if error and retries left."""
    if not state.get("error"):
        return "finish"
    if state["retry_count"] < state["max_retries"]:
        return "retry"
    return "give_up"


# ─── Build the Graph ───────────────────────────────────────

def build_chat_graph() -> StateGraph:
    """Build the LangGraph workflow for Text-to-SQL chat."""
    graph = StateGraph(ChatState)

    # Add nodes
    graph.add_node("build_context", build_context)
    graph.add_node("generate_sql", generate_sql_node)
    graph.add_node("validate_sql", validate_sql_node)
    graph.add_node("execute_sql", execute_sql_node)
    graph.add_node("analyze_results", analyze_results_node)
    graph.add_node("handle_error", handle_error_node)

    # Set entry point
    graph.set_entry_point("build_context")

    # Edges
    graph.add_edge("build_context", "generate_sql")
    graph.add_edge("generate_sql", "validate_sql")

    # After validation: execute, retry, or give up
    graph.add_conditional_edges(
        "validate_sql",
        should_execute_or_retry,
        {
            "execute": "execute_sql",
            "retry": "handle_error",
            "give_up": END,
        }
    )

    # After execution: analyze results or retry
    graph.add_conditional_edges(
        "execute_sql",
        should_finish_or_retry,
        {
            "finish": "analyze_results",
            "retry": "handle_error",
            "give_up": END,
        }
    )

    # After analysis: done
    graph.add_edge("analyze_results", END)

    # After error handling: go back to validate
    graph.add_edge("handle_error", "validate_sql")

    return graph.compile()


# Compiled graph singleton
chat_graph = build_chat_graph()


def run_chat(user_id: str, connection_id: str, session_id: str, user_message: str) -> ChatState:
    """
    Run the full Text-to-SQL pipeline.
    Returns the final state with SQL, results, or error.
    """
    initial_state: ChatState = {
        "user_id": user_id,
        "connection_id": connection_id,
        "session_id": session_id,
        "user_message": user_message,
        "schema_context": "",
        "llm_messages": [],
        "explanation": "",
        "sql": "",
        "column_metadata": {},
        "columns": [],
        "rows": [],
        "row_count": 0,
        "execution_time_ms": 0.0,
        "error": "",
        "retry_count": 0,
        "max_retries": 3,
        "chart_recommendation": None,
    }

    final_state = chat_graph.invoke(initial_state)
    return final_state
