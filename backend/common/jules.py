import os
import requests
import json
import logging
from typing import Optional, Dict, Any

logger = logging.getLogger("jules")

class JulesClient:
    """
    Client for interacting with Google's Jules AI service for code auditing and 
    automated issue creation.
    """
    
    def __init__(self, api_key: Optional[str] = None, base_url: str = "https://jules.googleapis.com/v1alpha"):
        self.api_key = api_key or os.getenv("JULES_API_KEY")
        self.base_url = base_url
        self.session = requests.Session()
        if self.api_key:
            self.session.headers.update({"X-Goog-Api-Key": self.api_key})
        self.session.headers.update({"Content-Type": "application/json"})

    def create_session(self, context: Optional[str] = None) -> Dict[str, Any]:
        """Creates a new Jules AI session."""
        url = f"{self.base_url}/sessions"
        payload = {}
        if context:
            payload["context"] = context
            
        try:
            response = self.session.post(url, json=payload)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(f"Failed to create Jules session: {str(e)}")
            raise

    def send_message(self, session_id: str, message: str) -> Dict[str, Any]:
        """Sends a message to an active Jules session."""
        url = f"{self.base_url}/sessions/{session_id}/messages"
        payload = {
            "contents": [
                {
                    "parts": [{"text": message}]
                }
            ]
        }
        
        try:
            response = self.session.post(url, json=payload)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(f"Failed to send message to Jules: {str(e)}")
            raise

    def analyze_anomaly(self, data_summary: str, query_context: str) -> str:
        """
        High-level helper to analyze a data anomaly and return a recommended 
        title and body for a GitHub issue.
        """
        prompt = (
            f"Analyze the following data anomaly detected in our analytics dashboard:\n\n"
            f"DATA SUMMARY:\n{data_summary}\n\n"
            f"QUERY CONTEXT:\n{query_context}\n\n"
            f"Please provide a structured response in JSON format (only the JSON) with two fields:\n"
            f"- 'title': A concise, professional title for a GitHub issue.\n"
            f"- 'body': A detailed description of the problem, potential causes, and suggested audit steps."
        )
        
        try:
            session = self.create_session()
            session_id = session.get("name", "").split("/")[-1]
            if not session_id:
                # Fallback if name format is unexpected
                session_id = session.get("id")
                
            response = self.send_message(session_id, prompt)
            
            # Extract text from Jules response
            parts = response.get("contents", [{}])[0].get("parts", [{}])
            text = parts[0].get("text", "") if parts else ""
            
            return text
        except Exception as e:
            logger.error(f"Jules anomaly analysis failed: {str(e)}")
            return json.dumps({
                "title": "Data Anomany Detected",
                "body": f"Jules AI failed to generate details. Raw summary: {data_summary}"
            })
