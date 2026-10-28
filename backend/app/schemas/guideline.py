from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class GuidelineCreateRequest(BaseModel):
    category: str = Field(..., description="prohibited_term, preferred_term, tone_principle, prohibited_claim")
    term_or_pattern: str = Field(..., min_length=1)
    replacement: Optional[str] = ""
    reason: str = Field(..., min_length=3)
    severity: Optional[str] = "high"  # critical, high, medium, low
    rule_id: Optional[str] = None


class GuidelineUpdateRequest(BaseModel):
    category: Optional[str] = None
    term_or_pattern: Optional[str] = None
    replacement: Optional[str] = None
    reason: Optional[str] = None
    severity: Optional[str] = None
    is_active: Optional[bool] = None


class GuidelineResponse(BaseModel):
    guideline_id: str
    rule_id: str
    workspace_id: str
    category: str
    term_or_pattern: str
    replacement: Optional[str] = ""
    reason: str
    severity: str
    version_id: str
    is_active: bool
    created_at: datetime
    updated_at: datetime


class ApprovedFactCreateRequest(BaseModel):
    product_name: str
    attribute: str
    statement: str
    numerical_value: Optional[float] = None
    numerical_unit: Optional[str] = None
    numerical_comparator: Optional[str] = "up_to"  # up_to, exact, min, max
    source_id: Optional[str] = None
    effective_date: Optional[str] = None


class ApprovedFactUpdateRequest(BaseModel):
    product_name: Optional[str] = None
    attribute: Optional[str] = None
    statement: Optional[str] = None
    numerical_value: Optional[float] = None
    numerical_unit: Optional[str] = None
    numerical_comparator: Optional[str] = None
    effective_date: Optional[str] = None


class ApprovedFactResponse(BaseModel):
    fact_id: str
    source_id: str
    workspace_id: str
    product_name: str
    attribute: str
    statement: str
    numerical_value: Optional[float] = None
    numerical_unit: Optional[str] = None
    numerical_comparator: Optional[str] = None
    version_id: str
    effective_date: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class GuidelineBulkCreateRequest(BaseModel):
    guidelines: List[GuidelineCreateRequest]


class ApprovedFactBulkCreateRequest(BaseModel):
    facts: List[ApprovedFactCreateRequest]


class GuidelineStatsResponse(BaseModel):
    total_guidelines: int
    active_guidelines: int
    inactive_guidelines: int
    guidelines_by_category: dict[str, int]
    guidelines_by_severity: dict[str, int]
    total_facts: int
    products_count: int
    facts_by_attribute: dict[str, int]


class GuidelineToggleResponse(BaseModel):
    guideline_id: str
    rule_id: str
    is_active: bool
    message: str

