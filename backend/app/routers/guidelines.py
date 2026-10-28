import logging
import re
import uuid
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pymongo.database import Database

from app.database import get_db
from app.dependencies.auth_deps import get_current_user, require_roles, record_audit_event
from app.schemas.guideline import (
    GuidelineCreateRequest, GuidelineUpdateRequest, GuidelineResponse,
    ApprovedFactCreateRequest, ApprovedFactUpdateRequest, ApprovedFactResponse,
    GuidelineBulkCreateRequest, ApprovedFactBulkCreateRequest,
    GuidelineStatsResponse, GuidelineToggleResponse
)
from app.services.source_alert_service import SourceAlertService

logger = logging.getLogger("veribrand.guidelines")

router = APIRouter(prefix="/guidelines", tags=["Brand Guidelines & Facts"])

# Standard categories and severities for brand guidelines
VALID_RULE_CATEGORIES = {"prohibited_term", "preferred_term", "tone_principle", "prohibited_claim"}
VALID_SEVERITIES = {"critical", "high", "medium", "low"}
VALID_COMPARATORS = {"up_to", "exact", "min", "max", "less_than", "greater_than"}


# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def bump_version(current_ver: Optional[str]) -> str:
    """
    Deterministically bumps semantic/minor version.
    Handles None, 'v1.0' -> 'v1.1', 'v1.9' -> 'v1.10', 'v1.10' -> 'v1.11', etc.
    Avoids floating-point rounding bugs and regression from v1.10 to v1.2.
    """
    if not current_ver:
        return "v1.1"

    clean = str(current_ver).strip()
    prefix = "v" if clean.lower().startswith("v") else ""
    raw_num = clean.lstrip("vV")

    parts = raw_num.split(".")
    try:
        if len(parts) >= 2 and parts[0].isdigit() and parts[1].isdigit():
            major = int(parts[0])
            minor = int(parts[1]) + 1
            return f"v{major}.{minor}"
        elif len(parts) == 1 and parts[0].isdigit():
            return f"v{parts[0]}.1"
        else:
            ver_num = float(raw_num)
            return f"v{round(ver_num + 0.1, 1)}"
    except Exception:
        return f"{prefix}{clean}.1" if clean else "v1.1"


def safe_regex(val: str) -> Dict[str, str]:
    """Escapes regex control characters to prevent MongoDB regex injection or syntax errors."""
    return {"$regex": re.escape(val.strip()), "$options": "i"}


def build_fact_query(workspace_id: str, fact_id: str) -> Dict[str, Any]:
    """Builds a query matching fact_id, source_id, or MongoDB ObjectId, scoped to workspace."""
    or_clauses: List[Dict[str, Any]] = [
        {"fact_id": fact_id},
        {"source_id": fact_id}
    ]
    if ObjectId.is_valid(fact_id):
        or_clauses.append({"_id": ObjectId(fact_id)})

    return {
        "workspace_id": workspace_id,
        "$or": or_clauses
    }


def build_guideline_query(workspace_id: str, guideline_id: str) -> Dict[str, Any]:
    """Builds a query matching guideline_id, rule_id, or MongoDB ObjectId, scoped to workspace."""
    or_clauses: List[Dict[str, Any]] = [
        {"guideline_id": guideline_id},
        {"rule_id": guideline_id}
    ]
    if ObjectId.is_valid(guideline_id):
        or_clauses.append({"_id": ObjectId(guideline_id)})

    return {
        "workspace_id": workspace_id,
        "$or": or_clauses
    }


def clean_mongo_doc(doc: Dict[str, Any]) -> Dict[str, Any]:
    """Creates a copy of a Mongo document with _id removed for clean serialization."""
    d = dict(doc)
    d.pop("_id", None)
    return d


# ============================================================================
# APPROVED FACTS (Defined before /{guideline_id} to prevent path shadowing)
# ============================================================================

@router.post("/facts", response_model=ApprovedFactResponse, status_code=status.HTTP_201_CREATED)
def create_approved_fact(
    req: ApprovedFactCreateRequest,
    current_user: Dict[str, Any] = Depends(require_roles(["admin", "owner"])),
    db: Database = Depends(get_db)
):
    """Create a new approved ground-truth product specification."""
    workspace_id = current_user["workspace_id"]

    product_name = req.product_name.strip()
    if not product_name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Product name cannot be empty."
        )

    statement = req.statement.strip()
    if not statement:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Verified statement cannot be empty."
        )

    attribute = req.attribute.strip().lower() if req.attribute else "general_specification"

    # Handle source_id and duplicate check
    if req.source_id and req.source_id.strip():
        source_id = req.source_id.strip()
        existing = db.approved_facts.find_one({
            "workspace_id": workspace_id,
            "source_id": source_id
        })
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"An approved fact with source ID '{source_id}' already exists in this workspace."
            )
    else:
        # Generate a unique source_id
        while True:
            source_id = f"SRC-FACT-{uuid.uuid4().hex[:6].upper()}"
            if not db.approved_facts.find_one({"workspace_id": workspace_id, "source_id": source_id}):
                break

    fact_id = f"FACT-{uuid.uuid4().hex[:8].upper()}"
    comparator = (req.numerical_comparator or "up_to").strip().lower()
    if comparator not in VALID_COMPARATORS:
        comparator = "up_to"

    doc = {
        "fact_id": fact_id,
        "source_id": source_id,
        "workspace_id": workspace_id,
        "product_name": product_name,
        "attribute": attribute,
        "statement": statement,
        "numerical_value": req.numerical_value,
        "numerical_unit": req.numerical_unit.strip().lower() if req.numerical_unit else None,
        "numerical_comparator": comparator,
        "version_id": "v1.0",
        "effective_date": req.effective_date.strip() if req.effective_date else datetime.now(timezone.utc).strftime("%Y-%m-%d"),
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc)
    }

    db.approved_facts.insert_one(doc)

    actor_name = current_user.get("full_name") or current_user.get("email", "Admin")
    record_audit_event(
        db=db,
        workspace_id=workspace_id,
        actor_id=current_user["user_id"],
        actor_name=actor_name,
        action="approved_fact_created",
        target_type="approved_fact",
        target_id=source_id,
        details=f"Added verified fact for '{product_name}' ({attribute}): '{statement}'."
    )

    return ApprovedFactResponse(**clean_mongo_doc(doc))


@router.post("/facts/bulk", response_model=List[ApprovedFactResponse], status_code=status.HTTP_201_CREATED)
def bulk_create_approved_facts(
    req: ApprovedFactBulkCreateRequest,
    current_user: Dict[str, Any] = Depends(require_roles(["admin", "owner"])),
    db: Database = Depends(get_db)
):
    """Bulk import approved ground-truth product specifications."""
    workspace_id = current_user["workspace_id"]
    now = datetime.now(timezone.utc)
    results = []

    for item in req.facts:
        product_name = item.product_name.strip()
        statement = item.statement.strip()
        if not product_name or not statement:
            continue

        attribute = item.attribute.strip().lower() if item.attribute else "general_specification"

        if item.source_id and item.source_id.strip():
            source_id = item.source_id.strip()
            existing = db.approved_facts.find_one({"workspace_id": workspace_id, "source_id": source_id})
            if existing:
                continue
        else:
            source_id = f"SRC-FACT-{uuid.uuid4().hex[:6].upper()}"

        fact_id = f"FACT-{uuid.uuid4().hex[:8].upper()}"
        comparator = (item.numerical_comparator or "up_to").strip().lower()

        doc = {
            "fact_id": fact_id,
            "source_id": source_id,
            "workspace_id": workspace_id,
            "product_name": product_name,
            "attribute": attribute,
            "statement": statement,
            "numerical_value": item.numerical_value,
            "numerical_unit": item.numerical_unit.strip().lower() if item.numerical_unit else None,
            "numerical_comparator": comparator if comparator in VALID_COMPARATORS else "up_to",
            "version_id": "v1.0",
            "effective_date": item.effective_date.strip() if item.effective_date else now.strftime("%Y-%m-%d"),
            "created_at": now,
            "updated_at": now
        }
        db.approved_facts.insert_one(doc)
        results.append(ApprovedFactResponse(**clean_mongo_doc(doc)))

    actor_name = current_user.get("full_name") or current_user.get("email", "Admin")
    record_audit_event(
        db=db,
        workspace_id=workspace_id,
        actor_id=current_user["user_id"],
        actor_name=actor_name,
        action="approved_facts_bulk_imported",
        target_type="approved_fact",
        target_id=f"BULK-{len(results)}",
        details=f"Bulk imported {len(results)} verified product specifications."
    )

    return results


@router.get("/facts", response_model=List[ApprovedFactResponse])
def list_approved_facts(
    product: Optional[str] = Query(None, description="Filter by product name regex"),
    attribute: Optional[str] = Query(None, description="Filter by attribute"),
    search: Optional[str] = Query(None, description="Search across product, statement, or source_id"),
    limit: int = Query(200, ge=1, le=500, description="Max facts to return"),
    skip: int = Query(0, ge=0, description="Offset for pagination"),
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: Database = Depends(get_db)
):
    """List all approved facts in current workspace."""
    workspace_id = current_user["workspace_id"]
    query: Dict[str, Any] = {"workspace_id": workspace_id}

    if product and product.strip():
        query["product_name"] = safe_regex(product)

    if attribute and attribute.strip():
        query["attribute"] = attribute.strip().lower()

    if search and search.strip():
        regex_matcher = safe_regex(search)
        query["$or"] = [
            {"product_name": regex_matcher},
            {"statement": regex_matcher},
            {"source_id": regex_matcher},
            {"attribute": regex_matcher}
        ]

    facts = list(db.approved_facts.find(query).sort("created_at", -1).skip(skip).limit(limit))
    return [ApprovedFactResponse(**clean_mongo_doc(f)) for f in facts]


@router.get("/facts/{fact_id}", response_model=ApprovedFactResponse)
def get_approved_fact(
    fact_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: Database = Depends(get_db)
):
    """Retrieve a single approved fact by fact_id, source_id, or Mongo ObjectId."""
    workspace_id = current_user["workspace_id"]
    fact = db.approved_facts.find_one(build_fact_query(workspace_id, fact_id))
    if not fact:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Approved fact not found in workspace.")
    return ApprovedFactResponse(**clean_mongo_doc(fact))


@router.put("/facts/{fact_id}", response_model=ApprovedFactResponse)
def update_approved_fact(
    fact_id: str,
    req: ApprovedFactUpdateRequest,
    current_user: Dict[str, Any] = Depends(require_roles(["admin", "owner"])),
    db: Database = Depends(get_db)
):
    """Update an approved fact. Automatically bumps version and triggers re-review alerts."""
    workspace_id = current_user["workspace_id"]
    fact = db.approved_facts.find_one(build_fact_query(workspace_id, fact_id))
    if not fact:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Approved fact not found in workspace.")

    current_ver = fact.get("version_id") or "v1.0"
    new_ver = bump_version(current_ver)

    update_fields: Dict[str, Any] = {
        "updated_at": datetime.now(timezone.utc),
        "version_id": new_ver
    }

    # Use model_dump to support setting nullable fields to None explicitly
    provided = req.model_dump(exclude_unset=True)

    if "product_name" in provided:
        val = provided["product_name"]
        if val is not None and not str(val).strip():
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Product name cannot be empty.")
        update_fields["product_name"] = str(val).strip() if val is not None else fact.get("product_name")

    if "attribute" in provided:
        val = provided["attribute"]
        update_fields["attribute"] = str(val).strip().lower() if val is not None else fact.get("attribute")

    if "statement" in provided:
        val = provided["statement"]
        if val is not None and not str(val).strip():
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Statement cannot be empty.")
        update_fields["statement"] = str(val).strip() if val is not None else fact.get("statement")

    if "numerical_value" in provided:
        update_fields["numerical_value"] = provided["numerical_value"]

    if "numerical_unit" in provided:
        val = provided["numerical_unit"]
        update_fields["numerical_unit"] = str(val).strip().lower() if val is not None else None

    if "numerical_comparator" in provided:
        val = provided["numerical_comparator"]
        if val is not None:
            comp = str(val).strip().lower()
            update_fields["numerical_comparator"] = comp if comp in VALID_COMPARATORS else "up_to"
        else:
            update_fields["numerical_comparator"] = None

    if "effective_date" in provided:
        val = provided["effective_date"]
        update_fields["effective_date"] = str(val).strip() if val is not None else None

    db.approved_facts.update_one({"_id": fact["_id"]}, {"$set": update_fields})
    updated_doc = db.approved_facts.find_one({"_id": fact["_id"]})

    # Trigger source-change alert for historical drafts citing this fact
    source_id = fact.get("source_id", "SRC-FACT")
    try:
        SourceAlertService.trigger_source_change_alerts(
            db=db,
            workspace_id=workspace_id,
            source_id=source_id,
            old_version=current_ver,
            new_version=new_ver,
            source_statement=updated_doc.get("statement", "")
        )
    except Exception as e:
        logger.warning(f"Error triggering source alerts for fact {source_id}: {e}")

    actor_name = current_user.get("full_name") or current_user.get("email", "Admin")
    record_audit_event(
        db=db,
        workspace_id=workspace_id,
        actor_id=current_user["user_id"],
        actor_name=actor_name,
        action="approved_fact_updated",
        target_type="approved_fact",
        target_id=source_id,
        details=f"Updated fact '{source_id}' to {new_ver}."
    )

    return ApprovedFactResponse(**clean_mongo_doc(updated_doc))


@router.delete("/facts/{fact_id}", status_code=status.HTTP_200_OK)
def delete_approved_fact(
    fact_id: str,
    current_user: Dict[str, Any] = Depends(require_roles(["admin", "owner"])),
    db: Database = Depends(get_db)
):
    """Delete an approved fact."""
    workspace_id = current_user["workspace_id"]
    fact = db.approved_facts.find_one(build_fact_query(workspace_id, fact_id))
    if not fact:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Approved fact not found in workspace.")

    db.approved_facts.delete_one({"_id": fact["_id"]})

    source_id = fact.get("source_id", fact_id)
    actor_name = current_user.get("full_name") or current_user.get("email", "Admin")
    record_audit_event(
        db=db,
        workspace_id=workspace_id,
        actor_id=current_user["user_id"],
        actor_name=actor_name,
        action="approved_fact_deleted",
        target_type="approved_fact",
        target_id=source_id,
        details=f"Deleted approved fact '{source_id}'."
    )

    return {
        "message": "Approved fact deleted successfully",
        "fact_id": fact.get("fact_id"),
        "source_id": source_id
    }


# ============================================================================
# STATS & BULK (Defined before /{guideline_id} to prevent path shadowing)
# ============================================================================

@router.get("/stats", response_model=GuidelineStatsResponse)
def get_guidelines_and_facts_stats(
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: Database = Depends(get_db)
):
    """Retrieve aggregate statistics on brand guidelines rules and approved facts."""
    workspace_id = current_user["workspace_id"]

    total_rules = db.guidelines.count_documents({"workspace_id": workspace_id})
    active_rules = db.guidelines.count_documents({"workspace_id": workspace_id, "is_active": True})
    inactive_rules = total_rules - active_rules

    rules = list(db.guidelines.find({"workspace_id": workspace_id}, {"category": 1, "severity": 1}))
    by_category: Dict[str, int] = {}
    by_severity: Dict[str, int] = {}

    for r in rules:
        cat = r.get("category", "unspecified")
        sev = r.get("severity", "unspecified")
        by_category[cat] = by_category.get(cat, 0) + 1
        by_severity[sev] = by_severity.get(sev, 0) + 1

    total_facts = db.approved_facts.count_documents({"workspace_id": workspace_id})
    facts = list(db.approved_facts.find({"workspace_id": workspace_id}, {"product_name": 1, "attribute": 1}))

    products_set = set()
    by_attribute: Dict[str, int] = {}

    for f in facts:
        if f.get("product_name"):
            products_set.add(f["product_name"])
        attr = f.get("attribute", "general_specification")
        by_attribute[attr] = by_attribute.get(attr, 0) + 1

    return GuidelineStatsResponse(
        total_guidelines=total_rules,
        active_guidelines=active_rules,
        inactive_guidelines=inactive_rules,
        guidelines_by_category=by_category,
        guidelines_by_severity=by_severity,
        total_facts=total_facts,
        products_count=len(products_set),
        facts_by_attribute=by_attribute
    )


@router.post("/bulk", response_model=List[GuidelineResponse], status_code=status.HTTP_201_CREATED)
def bulk_create_guidelines(
    req: GuidelineBulkCreateRequest,
    current_user: Dict[str, Any] = Depends(require_roles(["admin", "owner"])),
    db: Database = Depends(get_db)
):
    """Bulk import brand guidelines rules."""
    workspace_id = current_user["workspace_id"]
    now = datetime.now(timezone.utc)
    results = []

    for item in req.guidelines:
        term = item.term_or_pattern.strip()
        reason = item.reason.strip()
        if not term or not reason:
            continue

        cat = item.category.strip().lower()
        if cat not in VALID_RULE_CATEGORIES:
            cat = "prohibited_term"

        sev = (item.severity or "high").strip().lower()
        if sev not in VALID_SEVERITIES:
            sev = "high"

        if item.rule_id and item.rule_id.strip():
            rule_id = item.rule_id.strip()
            existing = db.guidelines.find_one({"workspace_id": workspace_id, "rule_id": rule_id})
            if existing:
                continue
        else:
            rule_id = f"RULE-TERM-{uuid.uuid4().hex[:6].upper()}"

        guideline_id = f"GL-{uuid.uuid4().hex[:8].upper()}"

        doc = {
            "guideline_id": guideline_id,
            "rule_id": rule_id,
            "workspace_id": workspace_id,
            "category": cat,
            "term_or_pattern": term,
            "replacement": item.replacement.strip() if item.replacement else "",
            "reason": reason,
            "severity": sev,
            "version_id": "v1.0",
            "is_active": True,
            "created_at": now,
            "updated_at": now
        }
        db.guidelines.insert_one(doc)
        results.append(GuidelineResponse(**clean_mongo_doc(doc)))

    actor_name = current_user.get("full_name") or current_user.get("email", "Admin")
    record_audit_event(
        db=db,
        workspace_id=workspace_id,
        actor_id=current_user["user_id"],
        actor_name=actor_name,
        action="guidelines_bulk_imported",
        target_type="guideline",
        target_id=f"BULK-{len(results)}",
        details=f"Bulk imported {len(results)} brand guideline rules."
    )

    return results


# ============================================================================
# BRAND GUIDELINES (RULES)
# ============================================================================

@router.post("", response_model=GuidelineResponse, status_code=status.HTTP_201_CREATED)
def create_guideline(
    req: GuidelineCreateRequest,
    current_user: Dict[str, Any] = Depends(require_roles(["admin", "owner"])),
    db: Database = Depends(get_db)
):
    """Create a new brand terminology, tone, or compliance rule."""
    workspace_id = current_user["workspace_id"]

    term = req.term_or_pattern.strip()
    if not term:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Target term or pattern cannot be blank."
        )

    reason = req.reason.strip()
    if not reason:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Reason / standard cannot be blank."
        )

    cat = req.category.strip().lower()
    if cat not in VALID_RULE_CATEGORIES:
        cat = "prohibited_term"

    sev = (req.severity or "high").strip().lower()
    if sev not in VALID_SEVERITIES:
        sev = "high"

    # Check rule_id and duplicate check
    if req.rule_id and req.rule_id.strip():
        rule_id = req.rule_id.strip()
        existing = db.guidelines.find_one({
            "workspace_id": workspace_id,
            "rule_id": rule_id
        })
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"A brand guideline rule with rule ID '{rule_id}' already exists in this workspace."
            )
    else:
        # Generate a unique rule_id
        while True:
            rule_id = f"RULE-TERM-{uuid.uuid4().hex[:6].upper()}"
            if not db.guidelines.find_one({"workspace_id": workspace_id, "rule_id": rule_id}):
                break

    guideline_id = f"GL-{uuid.uuid4().hex[:8].upper()}"

    doc = {
        "guideline_id": guideline_id,
        "rule_id": rule_id,
        "workspace_id": workspace_id,
        "category": cat,
        "term_or_pattern": term,
        "replacement": req.replacement.strip() if req.replacement else "",
        "reason": reason,
        "severity": sev,
        "version_id": "v1.0",
        "is_active": True,
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc)
    }

    db.guidelines.insert_one(doc)

    actor_name = current_user.get("full_name") or current_user.get("email", "Admin")
    record_audit_event(
        db=db,
        workspace_id=workspace_id,
        actor_id=current_user["user_id"],
        actor_name=actor_name,
        action="guideline_created",
        target_type="guideline",
        target_id=rule_id,
        details=f"Created brand rule {rule_id} for term '{term}' ({cat})."
    )

    return GuidelineResponse(**clean_mongo_doc(doc))


@router.get("", response_model=List[GuidelineResponse])
def list_guidelines(
    category: Optional[str] = Query(None, description="Filter by rule category"),
    severity: Optional[str] = Query(None, description="Filter by severity (critical, high, medium, low)"),
    search: Optional[str] = Query(None, description="Search term, replacement, or reason"),
    is_active: Optional[bool] = Query(None, description="Filter active/inactive rules"),
    limit: int = Query(200, ge=1, le=500, description="Max rules to return"),
    skip: int = Query(0, ge=0, description="Offset for pagination"),
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: Database = Depends(get_db)
):
    """List all brand guidelines and rules in current workspace."""
    workspace_id = current_user["workspace_id"]
    query: Dict[str, Any] = {"workspace_id": workspace_id}

    if category and category.strip():
        query["category"] = category.strip().lower()

    if severity and severity.strip():
        query["severity"] = severity.strip().lower()

    if is_active is not None:
        query["is_active"] = is_active

    if search and search.strip():
        regex_matcher = safe_regex(search)
        query["$or"] = [
            {"term_or_pattern": regex_matcher},
            {"replacement": regex_matcher},
            {"reason": regex_matcher},
            {"rule_id": regex_matcher}
        ]

    rules = list(db.guidelines.find(query).sort("created_at", -1).skip(skip).limit(limit))
    return [GuidelineResponse(**clean_mongo_doc(r)) for r in rules]


@router.get("/{guideline_id}", response_model=GuidelineResponse)
def get_guideline(
    guideline_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: Database = Depends(get_db)
):
    """Retrieve a single guideline by guideline_id, rule_id, or Mongo ObjectId."""
    workspace_id = current_user["workspace_id"]
    rule = db.guidelines.find_one(build_guideline_query(workspace_id, guideline_id))
    if not rule:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Guideline not found in workspace.")
    return GuidelineResponse(**clean_mongo_doc(rule))


@router.put("/{guideline_id}", response_model=GuidelineResponse)
def update_guideline(
    guideline_id: str,
    req: GuidelineUpdateRequest,
    current_user: Dict[str, Any] = Depends(require_roles(["admin", "owner"])),
    db: Database = Depends(get_db)
):
    """Update a brand guideline rule. Automatically bumps version and triggers re-review alerts."""
    workspace_id = current_user["workspace_id"]
    rule = db.guidelines.find_one(build_guideline_query(workspace_id, guideline_id))
    if not rule:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Guideline not found in workspace.")

    current_ver = rule.get("version_id") or "v1.0"
    new_ver = bump_version(current_ver)

    update_fields: Dict[str, Any] = {
        "updated_at": datetime.now(timezone.utc),
        "version_id": new_ver
    }

    provided = req.model_dump(exclude_unset=True)

    if "category" in provided:
        val = provided["category"]
        if val is not None:
            cat = str(val).strip().lower()
            update_fields["category"] = cat if cat in VALID_RULE_CATEGORIES else "prohibited_term"

    if "term_or_pattern" in provided:
        val = provided["term_or_pattern"]
        if val is not None and not str(val).strip():
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Target term or pattern cannot be empty.")
        update_fields["term_or_pattern"] = str(val).strip() if val is not None else rule.get("term_or_pattern")

    if "replacement" in provided:
        val = provided["replacement"]
        update_fields["replacement"] = str(val).strip() if val is not None else ""

    if "reason" in provided:
        val = provided["reason"]
        if val is not None and not str(val).strip():
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Reason cannot be empty.")
        update_fields["reason"] = str(val).strip() if val is not None else rule.get("reason")

    if "severity" in provided:
        val = provided["severity"]
        if val is not None:
            sev = str(val).strip().lower()
            update_fields["severity"] = sev if sev in VALID_SEVERITIES else "high"

    if "is_active" in provided:
        update_fields["is_active"] = bool(provided["is_active"])

    db.guidelines.update_one({"_id": rule["_id"]}, {"$set": update_fields})
    updated_doc = db.guidelines.find_one({"_id": rule["_id"]})

    # Trigger source-change alert for historical drafts citing this rule
    rule_source_id = rule.get("rule_id", "RULE-GEN")
    try:
        SourceAlertService.trigger_source_change_alerts(
            db=db,
            workspace_id=workspace_id,
            source_id=rule_source_id,
            old_version=current_ver,
            new_version=new_ver,
            source_statement=f"Rule: {updated_doc.get('reason')}"
        )
    except Exception as e:
        logger.warning(f"Error triggering source alerts for guideline {rule_source_id}: {e}")

    actor_name = current_user.get("full_name") or current_user.get("email", "Admin")
    record_audit_event(
        db=db,
        workspace_id=workspace_id,
        actor_id=current_user["user_id"],
        actor_name=actor_name,
        action="guideline_updated",
        target_type="guideline",
        target_id=rule_source_id,
        details=f"Updated rule {rule_source_id} to {new_ver}."
    )

    return GuidelineResponse(**clean_mongo_doc(updated_doc))


@router.patch("/{guideline_id}/toggle", response_model=GuidelineToggleResponse)
def toggle_guideline_active(
    guideline_id: str,
    current_user: Dict[str, Any] = Depends(require_roles(["admin", "owner"])),
    db: Database = Depends(get_db)
):
    """Toggle a guideline rule between active and inactive without changing version."""
    workspace_id = current_user["workspace_id"]
    rule = db.guidelines.find_one(build_guideline_query(workspace_id, guideline_id))
    if not rule:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Guideline not found in workspace.")

    new_active_state = not rule.get("is_active", True)
    now = datetime.now(timezone.utc)

    db.guidelines.update_one(
        {"_id": rule["_id"]},
        {"$set": {"is_active": new_active_state, "updated_at": now}}
    )

    state_word = "activated" if new_active_state else "deactivated"
    actor_name = current_user.get("full_name") or current_user.get("email", "Admin")
    record_audit_event(
        db=db,
        workspace_id=workspace_id,
        actor_id=current_user["user_id"],
        actor_name=actor_name,
        action=f"guideline_{state_word}",
        target_type="guideline",
        target_id=rule.get("rule_id", guideline_id),
        details=f"Rule {rule.get('rule_id')} was {state_word}."
    )

    return GuidelineToggleResponse(
        guideline_id=rule.get("guideline_id", guideline_id),
        rule_id=rule.get("rule_id", guideline_id),
        is_active=new_active_state,
        message=f"Guideline rule {state_word} successfully."
    )


@router.delete("/{guideline_id}", status_code=status.HTTP_200_OK)
def delete_guideline(
    guideline_id: str,
    current_user: Dict[str, Any] = Depends(require_roles(["admin", "owner"])),
    db: Database = Depends(get_db)
):
    """Delete a brand guideline rule."""
    workspace_id = current_user["workspace_id"]
    rule = db.guidelines.find_one(build_guideline_query(workspace_id, guideline_id))
    if not rule:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Guideline not found in workspace.")

    db.guidelines.delete_one({"_id": rule["_id"]})

    rule_id = rule.get("rule_id", guideline_id)
    actor_name = current_user.get("full_name") or current_user.get("email", "Admin")
    record_audit_event(
        db=db,
        workspace_id=workspace_id,
        actor_id=current_user["user_id"],
        actor_name=actor_name,
        action="guideline_deleted",
        target_type="guideline",
        target_id=rule_id,
        details=f"Deleted brand guideline rule {rule_id}."
    )

    return {
        "message": "Guideline deleted successfully",
        "guideline_id": rule.get("guideline_id"),
        "rule_id": rule_id
    }
