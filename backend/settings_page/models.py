from pydantic import BaseModel, Field
from typing import Optional

class UserSettingsBase(BaseModel):
    # Profile
    full_name: Optional[str] = None
    job_title: Optional[str] = None
    timezone: str = 'UTC'
    
    # Appearance
    theme: str = 'light'
    accent_color: str = 'cyan'
    density: str = 'comfortable'
    show_run_counts: bool = True
    animate_charts: bool = True
    syntax_highlighting: bool = True
    
    # AI & Queries
    ai_model: str = 'claude-sonnet-4-6'
    stream_responses: bool = True
    default_row_limit: int = 500
    auto_save_queries: bool = False
    system_prompt: str = ''
    
    # Notifications
    email_scheduled: bool = True
    email_failed: bool = True
    email_alerts: bool = False
    delivery_format: str = 'CSV + Chart PNG'
    slack_enabled: bool = False
    slack_webhook: Optional[str] = None
    slack_channel: Optional[str] = None

class UserSettingsResponse(UserSettingsBase):
    owner_id: str
    
class UserSettingsUpdate(BaseModel):
    full_name: Optional[str] = None
    job_title: Optional[str] = None
    timezone: Optional[str] = None
    
    theme: Optional[str] = None
    accent_color: Optional[str] = None
    density: Optional[str] = None
    show_run_counts: Optional[bool] = None
    animate_charts: Optional[bool] = None
    syntax_highlighting: Optional[bool] = None
    
    ai_model: Optional[str] = None
    stream_responses: Optional[bool] = None
    default_row_limit: Optional[int] = None
    auto_save_queries: Optional[bool] = None
    system_prompt: Optional[str] = None
    
    email_scheduled: Optional[bool] = None
    email_failed: Optional[bool] = None
    email_alerts: Optional[bool] = None
    delivery_format: Optional[str] = None
    slack_enabled: Optional[bool] = None
    slack_webhook: Optional[str] = None
    slack_channel: Optional[str] = None

class UserSubscription(BaseModel):
    owner_id: str
    plan_type: str
    queries_used: int
    queries_limit: int
    ai_used: int
    ai_limit: int
    next_reset_date: str
