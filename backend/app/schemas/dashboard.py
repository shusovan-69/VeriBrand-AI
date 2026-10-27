from pydantic import BaseModel
from typing import List, Dict, Any
from datetime import datetime


class DashboardStats(BaseModel):
    total_drafts: int
    pending_reviews: int
    approved_content: int
    flagged_issues: int
    clean_drafts: int
    active_guidelines: int
    approved_facts: int
    source_change_alerts: int
    compliance_rate_percent: float


class RecentActivityItem(BaseModel):
    event_id: str
    action: str
    actor_name: str
    target_type: str
    target_id: str
    details: str
    created_at: datetime
