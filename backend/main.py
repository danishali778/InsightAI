"""
InsightAI - FastAPI Backend
Text-to-SQL Business Intelligence Dashboard with Groq Speed Edition.
"""
import asyncio
import json
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sse_starlette.sse import EventSourceResponse

from business_logic import init_dependencies, get_schema, execute_query
from services.graph import run_workflow, build_graph, GraphState


# ============== Lifespan ==============

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize dependencies at startup."""
    init_dependencies()
    yield


# ============== FastAPI App ==============

app = FastAPI(
    title="InsightAI",
    description="Text-to-SQL Business Intelligence Dashboard powered by Groq",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS middleware for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============== Request/Response Models ==============

class AnalyzeRequest(BaseModel):
    """Request model for analyze endpoint."""
    question: str


class AnalyzeResponse(BaseModel):
    """Response model for analyze endpoint."""
    question: str
    sql_query: str
    results: str
    visualization_config: dict
    steps: list


class SchemaResponse(BaseModel):
    """Response model for schema endpoint."""
    schema_info: str


# ============== Endpoints ==============

@app.get("/")
async def root():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": "InsightAI",
        "version": "1.0.0",
    }


@app.get("/schema", response_model=SchemaResponse)
async def get_database_schema():
    """
    Get the current database schema.
    Useful for debugging and understanding available tables.
    """
    try:
        schema_info = get_schema()
        return SchemaResponse(schema_info=schema_info)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/analyze", response_model=AnalyzeResponse)
async def analyze_question(request: AnalyzeRequest):
    """
    Analyze a natural language question and generate visualization.
    
    This endpoint:
    1. Uses SQL Architect Agent to generate PostgreSQL query
    2. Executes query on the database
    3. Self-heals if query fails (up to 3 retries)
    4. Uses Data Viz Agent to determine best visualization
    
    Returns the complete result with visualization config.
    """
    if not request.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty")
    
    try:
        # Run the LangGraph workflow
        result = run_workflow(request.question)
        
        # Ensure visualization_config is JSON serializable
        viz_config = result.get("visualization_config", {})
        if viz_config:
            import json
            # Convert to JSON and back to ensure all values are serializable
            try:
                viz_config = json.loads(json.dumps(viz_config, default=str))
            except Exception as json_err:
                print(f"JSON serialization error: {json_err}")
                viz_config = {"type": "table", "title": "Results", "data": [], "message": str(json_err)}
        
        return AnalyzeResponse(
            question=result["question"],
            sql_query=result.get("sql_query", ""),
            results=result.get("results", ""),
            visualization_config=viz_config,
            steps=result.get("steps", []),
        )
    except Exception as e:
        import traceback
        import sys
        # Use sys.stderr to avoid Rich library conflicts
        sys.stderr.write(f"Error in analyze endpoint: {e}\n")
        traceback.print_exc(file=sys.stderr)
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/analyze/stream")
async def analyze_question_stream(request: AnalyzeRequest):
    """
    Stream the analysis process via Server-Sent Events.
    
    Sends real-time updates as each step progresses:
    - "Groq is writing SQL..."
    - "Executing on Postgres..."
    - "Error found! Self-healing..."
    - "Rendering Chart."
    """
    if not request.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty")
    
    async def event_generator() -> AsyncGenerator[str, None]:
        """Generate SSE events for each workflow step."""
        try:
            # Build and compile graph
            graph = build_graph()
            app_graph = graph.compile()
            
            # Initial state
            initial_state: GraphState = {
                "question": request.question,
                "sql_query": "",
                "results": "",
                "error": "",
                "visualization_config": {},
                "retry_count": 0,
                "steps": [],
            }
            
            # Track steps we've already sent
            sent_steps = 0
            
            # Stream through workflow
            for output in app_graph.stream(initial_state):
                # Get the node name and state
                for node_name, state in output.items():
                    # Send any new steps
                    current_steps = state.get("steps", [])
                    for step in current_steps[sent_steps:]:
                        yield json.dumps({
                            "type": "step",
                            "data": step,
                            "node": node_name,
                        })
                        await asyncio.sleep(0.1)  # Small delay for UX
                    sent_steps = len(current_steps)
                    
                    # If we have visualization config, send final result
                    if state.get("visualization_config"):
                        yield json.dumps({
                            "type": "result",
                            "data": {
                                "question": state["question"],
                                "sql_query": state.get("sql_query", ""),
                                "results": state.get("results", ""),
                                "visualization_config": state["visualization_config"],
                                "steps": state.get("steps", []),
                            }
                        })
        except Exception as e:
            yield json.dumps({
                "type": "error",
                "data": str(e),
            })
    
    return EventSourceResponse(event_generator())


@app.post("/query")
async def execute_raw_query(sql: str):
    """
    Execute a raw SQL query on the database.
    For debugging purposes only.
    """
    try:
        results = execute_query(sql)
        return {"results": results}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# ============== Main ==============

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="127.0.0.1",
        port=8000,
        reload=True,
    )
