from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime


class DraftCreateRequest(BaseModel):
    title: str = Field(..., min_length=2)
    target_product: Optional[str] = None
    target_audience: Optional[str] = "General Consumer"
    content_text: str = Field(..., min_length=5)
    submission_type: Optional[str] = "text"  # text or pdf
    original_filename: Optional[str] = None


class RevisionCreateRequest(BaseModel):
    content_text: str = Field(..., min_length=5)
    submission_type: Optional[str] = "text"
    original_filename: Optional[str] = None


class DraftResponse(BaseModel):
    draft_id: str
    workspace_id: str
    creator_id: str
    creator_name: Optional[str] = "Creator"
    title: str
    target_product: Optional[str] = None
    target_audience: Optional[str] = None
    current_revision_id: str
    status: str  # draft, submitted, under_review, changes_requested, approved
    ready_to_publish: bool
    latest_content_text: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class RevisionResponse(BaseModel):
    revision_id: str
    draft_id: str
    workspace_id: str
    revision_number: int
    creator_id: str
    content_text: str
    content_hash: str
    submission_type: str
    original_filename: Optional[str] = None
    created_at: datetime


class DraftHistoryResponse(BaseModel):
    draft: DraftResponse
    revisions: List[RevisionResponse]
    decisions: List[Dict[str, Any]]
    audit_events: List[Dict[str, Any]]
