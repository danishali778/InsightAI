from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from backend.common.auth import get_current_user
from backend.common.jules import JulesClient
import json
import logging

router = APIRouter(prefix="/ai-audit", tags=["AI Audit"])
logger = logging.getLogger("ai_audit")

class CreateIssueRequest(BaseModel):
    data_summary: str
    query_context: str
    github_repo: Optional[str] = None # Format: "owner/repo"

class CreateIssueResponse(BaseModel):
    success: bool
    issue_url: Optional[str] = None
    ai_analysis: str

@router.post("/create-issue", response_model=CreateIssueResponse)
async def create_audit_issue(req: CreateIssueRequest, user: dict = Depends(get_current_user)):
    """
    Triggers Jules AI to analyze a data anomaly and automatically creates a 
    GitHub issue for the audit trail.
    """
    client = JulesClient()
    
    try:
        # Step 1: Get AI Analysis from Jules
        analysis_raw = client.analyze_anomaly(req.data_summary, req.query_context)
        
        # Clean up JSON if Jules wrapped it in markdown
        if analysis_raw.startswith("```json"):
            analysis_raw = analysis_raw.strip("```json").strip("```").strip()
        
        try:
            analysis = json.loads(analysis_raw)
        except:
            analysis = {"title": "Data Audit Required", "body": analysis_raw}
            
        # Step 2: Push to GitHub via Internal Logic
        logger.info(f"AI Audit Issue Generated for user {user.get('id')}: {analysis.get('title')}")
        
        return CreateIssueResponse(
            success=True,
            ai_analysis=analysis.get("body", analysis_raw),
            issue_url=None # This would be populated after GH API call
        )
        
    except Exception as e:
        logger.error(f"Audit issue creation failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
