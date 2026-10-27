from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime


class DecisionRequest(BaseModel):
    decision: str = Field(..., description="approved or changes_requested")
    comment: Optional[str] = ""
    override_reason: Optional[str] = None


class DecisionResponse(BaseModel):
    decision_id: str
    draft_id: str
    revision_id: str
    workspace_id: str
    reviewer_id: str
    reviewer_name: str
    decision: str
    comment: Optional[str] = ""
    override_reason: Optional[str] = None
    source_snapshot: List[Dict[str, Any]]
    created_at: datetime


class PendingReviewItem(BaseModel):
    draft_id: str
    title: str
    creator_id: str
    creator_name: str
    current_revision_id: str
    revision_number: int
    target_product: Optional[str] = None
    status: str
    critical_findings_count: int
    high_findings_count: int
    total_findings: int
    submitted_at: datetime
