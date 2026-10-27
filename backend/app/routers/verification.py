import uuid
from datetime import datetime, timezone
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from pymongo.database import Database

from app.database import get_db
from app.dependencies.auth_deps import get_current_user, record_audit_event
from app.schemas.verification import FindingSchema, VerificationResultResponse, ResolveFindingRequest
from app.services.evidence_service import EvidenceService
from app.services.rule_engine import DeterministicRuleEngine
from app.services.ai_service import AIService

router = APIRouter(prefix="", tags=["Brand Verification Engine"])


@router.post("/drafts/{draft_id}/review", response_model=VerificationResultResponse)
async def verify_draft(
    draft_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: Database = Depends(get_db)
):
    workspace_id = current_user["workspace_id"]
    draft = db.drafts.find_one({"workspace_id": workspace_id, "draft_id": draft_id})
    if not draft:
        raise HTTPException(status_code=404, detail="Draft not found in workspace.")

    current_rev_id = draft.get("current_revision_id")
    revision = db.revisions.find_one({"workspace_id": workspace_id, "revision_id": current_rev_id})
    if not revision:
        raise HTTPException(status_code=404, detail="Current revision content not found.")

    draft_text = revision.get("content_text", "")
    target_prod = draft.get("target_product")

    # 1. Retrieve approved workspace sources
    guidelines = EvidenceService.get_workspace_guidelines(db, workspace_id)
    relevant_facts = EvidenceService.retrieve_relevant_facts(db, workspace_id, draft_text, target_prod)

    # 2. Run Deterministic Verification Engine
    deterministic_findings = DeterministicRuleEngine.run_checks(
        draft_text=draft_text,
        guidelines=guidelines,
        approved_facts=relevant_facts,
        draft_id=draft_id,
        revision_id=current_rev_id,
        workspace_id=workspace_id
    )

    # 3. Run Optional AI-Assisted Tone / Claim Verification
    ai_findings, ai_assisted, ai_status = await AIService.analyze_draft_with_ai(
        db=db,
        workspace_id=workspace_id,
        draft_id=draft_id,
        revision_id=current_rev_id,
        draft_text=draft_text,
        guidelines=guidelines,
        approved_facts=relevant_facts
    )

    # 4. Merge Findings (Avoid duplicate original text spans)
    combined_findings = list(deterministic_findings)
    seen_texts = {f["original_text"].lower().strip() for f in deterministic_findings if f.get("original_text")}

    for af in ai_findings:
        text_key = af.get("original_text", "").lower().strip()
        if not text_key or text_key not in seen_texts:
            combined_findings.append(af)
            if text_key:
                seen_texts.add(text_key)

    # 5. Persist Findings to Database
    # Remove older findings for this exact revision to keep results fresh
    db.findings.delete_many({"workspace_id": workspace_id, "revision_id": current_rev_id})
    if combined_findings:
        db.findings.insert_many(combined_findings)

    # 6. Compute Aggregates & Severities
    severity_counts = {"critical": 0, "high": 0, "medium": 0, "low": 0, "info": 0}
    category_counts = {
        "contradiction": 0,
        "guideline_violation": 0,
        "unsupported_claim": 0,
        "tone_issue": 0,
        "accessibility_prompt": 0
    }

    for f in combined_findings:
        sev = f.get("severity", "medium").lower()
        cat = f.get("category", "unsupported_claim").lower()
        severity_counts[sev] = severity_counts.get(sev, 0) + 1
        category_counts[cat] = category_counts.get(cat, 0) + 1

    overall_status = "clean"
    if severity_counts["critical"] > 0 or severity_counts["high"] > 0:
        overall_status = "requires_override"
    elif len(combined_findings) > 0:
        overall_status = "flagged"

    # Update draft status
    db.drafts.update_one(
        {"_id": draft["_id"]},
        {"$set": {
            "status": "under_review",
            "updated_at": datetime.now(timezone.utc)
        }}
    )

    analysis_id = f"ANL-{uuid.uuid4().hex[:8].upper()}"

    record_audit_event(
        db=db,
        workspace_id=workspace_id,
        actor_id=current_user["user_id"],
        actor_name=current_user["full_name"],
        action="verification_completed",
        target_type="revision",
        target_id=current_rev_id,
        details=f"Verification executed for '{draft['title']}'. Found {len(combined_findings)} issues ({severity_counts['critical']} critical, {severity_counts['high']} high).",
        metadata={
            "analysis_id": analysis_id,
            "overall_status": overall_status,
            "ai_assisted": ai_assisted
        }
    )

    return VerificationResultResponse(
        analysis_id=analysis_id,
        draft_id=draft_id,
        revision_id=current_rev_id,
        workspace_id=workspace_id,
        overall_status=overall_status,
        total_findings=len(combined_findings),
        findings_by_severity=severity_counts,
        findings_by_category=category_counts,
        findings=[FindingSchema(**f) for f in combined_findings],
        ai_assisted=ai_assisted,
        ai_status_message=ai_status,
        sources_searched_count=len(relevant_facts) + len(guidelines),
        created_at=datetime.now(timezone.utc)
    )


@router.get("/drafts/{draft_id}/findings", response_model=List[FindingSchema])
def get_draft_findings(
    draft_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: Database = Depends(get_db)
):
    workspace_id = current_user["workspace_id"]
    draft = db.drafts.find_one({"workspace_id": workspace_id, "draft_id": draft_id})
    if not draft:
        raise HTTPException(status_code=404, detail="Draft not found.")

    rev_id = draft.get("current_revision_id")
    findings = list(db.findings.find({"workspace_id": workspace_id, "revision_id": rev_id}).sort("severity", 1))
    return [FindingSchema(**f) for f in findings]


@router.post("/findings/{finding_id}/resolve", response_model=Dict[str, Any])
def resolve_finding(
    finding_id: str,
    req: ResolveFindingRequest,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: Database = Depends(get_db)
):
    workspace_id = current_user["workspace_id"]
    finding = db.findings.find_one({"workspace_id": workspace_id, "finding_id": finding_id})
    if not finding:
        raise HTTPException(status_code=404, detail="Finding not found in workspace.")

    db.findings.update_one(
        {"_id": finding["_id"]},
        {"$set": {
            "is_resolved": req.resolved,
            "resolved_by": current_user["user_id"],
            "resolution_note": req.resolution_note or "Marked resolved by reviewer/creator.",
            "resolved_at": datetime.now(timezone.utc)
        }}
    )

    return {"status": "success", "finding_id": finding_id, "is_resolved": req.resolved}
