import uuid
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pymongo.database import Database

from app.database import get_db
from app.dependencies.auth_deps import get_current_user, require_roles, record_audit_event
from app.schemas.guideline import (
    GuidelineCreateRequest, GuidelineUpdateRequest, GuidelineResponse,
    ApprovedFactCreateRequest, ApprovedFactUpdateRequest, ApprovedFactResponse
)
from app.services.source_alert_service import SourceAlertService

router = APIRouter(prefix="/guidelines", tags=["Brand Guidelines & Facts"])


# --- Guideline Rules ---

@router.post("", response_model=GuidelineResponse, status_code=status.HTTP_201_CREATED)
def create_guideline(
    req: GuidelineCreateRequest,
    current_user: Dict[str, Any] = Depends(require_roles(["admin", "owner"])),
    db: Database = Depends(get_db)
):
    workspace_id = current_user["workspace_id"]
    rule_id = req.rule_id or f"RULE-TERM-{uuid.uuid4().hex[:6].upper()}"
    guideline_id = f"GL-{uuid.uuid4().hex[:8].upper()}"

    doc = {
        "guideline_id": guideline_id,
        "rule_id": rule_id,
        "workspace_id": workspace_id,
        "category": req.category,
        "term_or_pattern": req.term_or_pattern.strip(),
        "replacement": req.replacement.strip() if req.replacement else "",
        "reason": req.reason.strip(),
        "severity": req.severity or "high",
        "version_id": "v1.0",
        "is_active": True,
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc)
    }

    db.guidelines.insert_one(doc)

    record_audit_event(
        db=db,
        workspace_id=workspace_id,
        actor_id=current_user["user_id"],
        actor_name=current_user["full_name"],
        action="guideline_created",
        target_type="guideline",
        target_id=rule_id,
        details=f"Created brand rule {rule_id} for term '{req.term_or_pattern}' ({req.category})."
    )

    return GuidelineResponse(**doc)


@router.get("", response_model=List[GuidelineResponse])
def list_guidelines(
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: Database = Depends(get_db)
):
    workspace_id = current_user["workspace_id"]
    rules = list(db.guidelines.find({"workspace_id": workspace_id}).sort("created_at", -1))
    return [GuidelineResponse(**r) for r in rules]


@router.put("/{guideline_id}", response_model=GuidelineResponse)
def update_guideline(
    guideline_id: str,
    req: GuidelineUpdateRequest,
    current_user: Dict[str, Any] = Depends(require_roles(["admin", "owner"])),
    db: Database = Depends(get_db)
):
    workspace_id = current_user["workspace_id"]
    rule = db.guidelines.find_one({"workspace_id": workspace_id, "guideline_id": guideline_id})
    if not rule:
        raise HTTPException(status_code=404, detail="Guideline not found in workspace.")

    # Calculate version bump
    current_ver = rule.get("version_id", "v1.0")
    try:
        ver_num = float(current_ver.lstrip("v"))
        new_ver = f"v{round(ver_num + 0.1, 1)}"
    except ValueError:
        new_ver = "v1.1"

    update_fields = {"updated_at": datetime.now(timezone.utc), "version_id": new_ver}
    if req.category is not None:
        update_fields["category"] = req.category
    if req.term_or_pattern is not None:
        update_fields["term_or_pattern"] = req.term_or_pattern
    if req.replacement is not None:
        update_fields["replacement"] = req.replacement
    if req.reason is not None:
        update_fields["reason"] = req.reason
    if req.severity is not None:
        update_fields["severity"] = req.severity
    if req.is_active is not None:
        update_fields["is_active"] = req.is_active

    db.guidelines.update_one({"_id": rule["_id"]}, {"$set": update_fields})
    updated_doc = db.guidelines.find_one({"_id": rule["_id"]})

    # Trigger source-change alert for historical drafts citing this rule
    SourceAlertService.trigger_source_change_alerts(
        db=db,
        workspace_id=workspace_id,
        source_id=rule.get("rule_id", "RULE-GEN"),
        old_version=current_ver,
        new_version=new_ver,
        source_statement=f"Rule: {updated_doc.get('reason')}"
    )

    record_audit_event(
        db=db,
        workspace_id=workspace_id,
        actor_id=current_user["user_id"],
        actor_name=current_user["full_name"],
        action="guideline_updated",
        target_type="guideline",
        target_id=rule.get("rule_id", guideline_id),
        details=f"Updated rule {rule.get('rule_id')} to {new_ver}."
    )

    return GuidelineResponse(**updated_doc)


# --- Approved Facts ---

@router.post("/facts", response_model=ApprovedFactResponse, status_code=status.HTTP_201_CREATED)
def create_approved_fact(
    req: ApprovedFactCreateRequest,
    current_user: Dict[str, Any] = Depends(require_roles(["admin", "owner"])),
    db: Database = Depends(get_db)
):
    workspace_id = current_user["workspace_id"]
    source_id = req.source_id or f"SRC-FACT-{uuid.uuid4().hex[:6].upper()}"
    fact_id = f"FACT-{uuid.uuid4().hex[:8].upper()}"

    doc = {
        "fact_id": fact_id,
        "source_id": source_id,
        "workspace_id": workspace_id,
        "product_name": req.product_name.strip(),
        "attribute": req.attribute.strip().lower(),
        "statement": req.statement.strip(),
        "numerical_value": req.numerical_value,
        "numerical_unit": req.numerical_unit.strip().lower() if req.numerical_unit else None,
        "numerical_comparator": req.numerical_comparator or "up_to",
        "version_id": "v1.0",
        "effective_date": req.effective_date or datetime.now(timezone.utc).strftime("%Y-%m-%d"),
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc)
    }

    db.approved_facts.insert_one(doc)

    record_audit_event(
        db=db,
        workspace_id=workspace_id,
        actor_id=current_user["user_id"],
        actor_name=current_user["full_name"],
        action="approved_fact_created",
        target_type="approved_fact",
        target_id=source_id,
        details=f"Added verified fact for '{req.product_name}' ({req.attribute}): '{req.statement}'."
    )

    return ApprovedFactResponse(**doc)


@router.get("/facts", response_model=List[ApprovedFactResponse])
def list_approved_facts(
    product: Optional[str] = None,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: Database = Depends(get_db)
):
    workspace_id = current_user["workspace_id"]
    query = {"workspace_id": workspace_id}
    if product:
        query["product_name"] = {"$regex": product, "$options": "i"}

    facts = list(db.approved_facts.find(query).sort("created_at", -1))
    return [ApprovedFactResponse(**f) for f in facts]


@router.put("/facts/{fact_id}", response_model=ApprovedFactResponse)
def update_approved_fact(
    fact_id: str,
    req: ApprovedFactUpdateRequest,
    current_user: Dict[str, Any] = Depends(require_roles(["admin", "owner"])),
    db: Database = Depends(get_db)
):
    workspace_id = current_user["workspace_id"]
    fact = db.approved_facts.find_one({"workspace_id": workspace_id, "fact_id": fact_id})
    if not fact:
        raise HTTPException(status_code=404, detail="Approved fact not found in workspace.")

    current_ver = fact.get("version_id", "v1.0")
    try:
        ver_num = float(current_ver.lstrip("v"))
        new_ver = f"v{round(ver_num + 0.1, 1)}"
    except ValueError:
        new_ver = "v1.1"

    update_fields = {"updated_at": datetime.now(timezone.utc), "version_id": new_ver}
    if req.product_name is not None:
        update_fields["product_name"] = req.product_name
    if req.attribute is not None:
        update_fields["attribute"] = req.attribute.lower()
    if req.statement is not None:
        update_fields["statement"] = req.statement
    if req.numerical_value is not None:
        update_fields["numerical_value"] = req.numerical_value
    if req.numerical_unit is not None:
        update_fields["numerical_unit"] = req.numerical_unit.lower()
    if req.numerical_comparator is not None:
        update_fields["numerical_comparator"] = req.numerical_comparator
    if req.effective_date is not None:
        update_fields["effective_date"] = req.effective_date

    db.approved_facts.update_one({"_id": fact["_id"]}, {"$set": update_fields})
    updated_doc = db.approved_facts.find_one({"_id": fact["_id"]})

    # Trigger source-change alert for historical drafts citing this fact
    SourceAlertService.trigger_source_change_alerts(
        db=db,
        workspace_id=workspace_id,
        source_id=fact.get("source_id", "SRC-FACT"),
        old_version=current_ver,
        new_version=new_ver,
        source_statement=updated_doc.get("statement", "")
    )

    record_audit_event(
        db=db,
        workspace_id=workspace_id,
        actor_id=current_user["user_id"],
        actor_name=current_user["full_name"],
        action="approved_fact_updated",
        target_type="approved_fact",
        target_id=fact.get("source_id", fact_id),
        details=f"Updated fact '{fact.get('source_id')}' to {new_ver}."
    )

    return ApprovedFactResponse(**updated_doc)
