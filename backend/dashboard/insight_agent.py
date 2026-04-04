import os
from typing import List, Dict, Any
import json
from groq import Groq

client = Groq(api_key=os.environ.get("GROQ_API_KEY"))

def generate_widget_insight(title: str, viz_type: str, data: List[Dict[str, Any]], filters: Dict[str, Any]) -> str:
    """Generate a quick AI insight for a specific widget."""
    if not data:
        return "Not enough data to generate insights yet."
    
    # Sample data to keep tokens low
    sample_data = data[:10]
    
    prompt = f"""
    You are an expert data analyst. Generate a concise (max 2 sentences) insight for this dashboard widget.
    
    Widget Title: {title}
    Visualization: {viz_type}
    Current Global Filters: {json.dumps(filters)}
    
    Data Snapshot:
    {json.dumps(sample_data, indent=2)}
    
    Rules:
    - Be specific (mention numbers or trends).
    - Be professional but punchy.
    - Focus on what shifted or what stands out.
    - If there's a clear trend, highlight it.
    - Return ONLY the insight text. No preamble.
    """
    
    try:
        chat_completion = client.chat.completions.create(
            messages=[
                {"role": "system", "content": "You provide short, professional data insights."},
                {"role": "user", "content": prompt},
            ],
            model="llama-3.3-70b-versatile",
            temperature=0.3,
            max_tokens=150,
        )
        return chat_completion.choices[0].message.content.strip()
    except Exception as e:
        print(f"Error generating insight: {e}")
        return "Analysis momentarily unavailable. Please try again shortly."
