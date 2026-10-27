from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime


class FindingSchema(BaseModel):
    finding_id: str
    issue_id: str
    draft_id: str
    revision_id: str
    workspace_id: str
    category: str  # contradiction, guideline_violation, unsupported_claim, tone_issue, accessibility_prompt
    severity: str  # critical, high, medium, low, info
    original_text: str
    draft_span: Optional[Dict[str, int]] = None
    explanation: str
    source_id: Optional[str] = None
    source_version: Optional[str] = None
    source_excerpt: Optional[str] = None
    suggested_revision: Optional[str] = None
    evidence_status: str  # contradicted, supported, insufficient_evidence, guideline_violation, needs_judgment
    uncertainty: Optional[str] = None
    is_resolved: bool = False
    created_at: datetime


class VerificationResultResponse(BaseModel):
    analysis_id: str
    draft_id: str
    revision_id: str
    workspace_id: str
    overall_status: str  # clean, flagged, requires_override
    total_findings: int
    findings_by_severity: Dict[str, int]
    findings_by_category: Dict[str, int]
    findings: List[FindingSchema]
    ai_assisted: bool
    ai_status_message: str
    sources_searched_count: int
    created_at: datetime


class ResolveFindingRequest(BaseModel):
    resolved: bool = True
    resolution_note: Optional[str] = None
