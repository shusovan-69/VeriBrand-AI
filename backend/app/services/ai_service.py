import json
import logging
import uuid
from typing import List, Dict, Any, Tuple
from datetime import datetime, timezone
import httpx
from pymongo.database import Database

from app.config import settings
from app.services.evidence_service import EvidenceService

logger = logging.getLogger("veribrand.ai_service")


class AIService:
    @staticmethod
    async def analyze_draft_with_ai(
        db: Database,
        workspace_id: str,
        draft_id: str,
        revision_id: str,
        draft_text: str,
        guidelines: List[Dict[str, Any]],
        approved_facts: List[Dict[str, Any]]
    ) -> Tuple[List[Dict[str, Any]], bool, str]:
        """
        Runs AI-assisted verification if LLM_API_KEY is set.
        Returns: (findings_list, is_ai_assisted, status_message)
        """
        api_key = settings.LLM_API_KEY.strip() if settings.LLM_API_KEY else ""
        if not api_key:
            return [], False, "AI tone check skipped: LLM_API_KEY not configured. Deterministic verification fully operational."

        # Prepare context of allowed sources
        source_context = {
            "approved_facts": [
                {
                    "source_id": f.get("source_id"),
                    "version_id": f.get("version_id"),
                    "product_name": f.get("product_name"),
                    "statement": f.get("statement")
                }
                for f in approved_facts
            ],
            "approved_guidelines": [
                {
                    "rule_id": g.get("rule_id"),
                    "version_id": g.get("version_id"),
                    "category": g.get("category"),
                    "term_or_pattern": g.get("term_or_pattern"),
                    "replacement": g.get("replacement"),
                    "reason": g.get("reason")
                }
                for g in guidelines
            ]
        }

        system_prompt = (
            "You are the VeriBrand AI brand governance engine. "
            "Your task is to analyze marketing copy for tone consistency, subtle brand guideline violations, and unsupported claims. "
            "RULES:\n"
            "1. ONLY reference source_id values that exist in the provided approved context. Do NOT invent source IDs.\n"
            "2. If a claim lacks supporting evidence, categorize it as 'unsupported_claim' with evidence_status 'insufficient_evidence'. Do not mark it false.\n"
            "3. Output strictly valid JSON with key 'findings' containing a list of items with keys: "
            "category (tone_issue, unsupported_claim, accessibility_prompt), severity (high, medium, low, info), "
            "original_text, explanation, source_id (optional), suggested_revision, evidence_status (insufficient_evidence, needs_judgment, guideline_violation).\n"
            "4. Return an empty array under 'findings' if copy is compliant."
        )

        user_content = f"APPROVED SOURCES:\n{json.dumps(source_context, indent=2)}\n\nDRAFT TO VERIFY:\n{draft_text}"

        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }

        url = f"{settings.LLM_BASE_URL.rstrip('/')}/chat/completions"
        payload = {
            "model": settings.LLM_MODEL,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_content}
            ],
            "temperature": 0.1,
            "response_format": {"type": "json_object"}
        }

        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                res = await client.post(url, headers=headers, json=payload)
                if res.status_code != 200:
                    logger.warning(f"LLM API returned status {res.status_code}: {res.text}")
                    return [], False, f"AI verification unavailable: LLM returned HTTP {res.status_code}. Deterministic results preserved."

                data = res.json()
                content = data["choices"][0]["message"]["content"]
                parsed = json.loads(content)
                raw_findings = parsed.get("findings", [])

                validated_findings = []
                for item in raw_findings:
                    # Server-side validation of source citations
                    src_id = item.get("source_id")
                    source_excerpt = None
                    source_version = None

                    if src_id:
                        valid_src = EvidenceService.validate_citation(db, workspace_id, src_id)
                        if valid_src:
                            source_version = valid_src.get("version_id", "v1.0")
                            source_excerpt = valid_src.get("statement") or valid_src.get("reason")
                        else:
                            # Strip hallucinated source_id
                            src_id = None

                    finding = {
                        "finding_id": f"FIND-AI-{uuid.uuid4().hex[:8].upper()}",
                        "issue_id": f"ISSUE-AI-{uuid.uuid4().hex[:6].upper()}",
                        "draft_id": draft_id,
                        "revision_id": revision_id,
                        "workspace_id": workspace_id,
                        "category": item.get("category", "tone_issue"),
                        "severity": item.get("severity", "medium"),
                        "original_text": item.get("original_text", ""),
                        "draft_span": None,
                        "explanation": item.get("explanation", "Identified by AI tone and brand analysis."),
                        "source_id": src_id,
                        "source_version": source_version,
                        "source_excerpt": source_excerpt,
                        "suggested_revision": item.get("suggested_revision", ""),
                        "evidence_status": item.get("evidence_status", "needs_judgment"),
                        "uncertainty": "AI-assisted qualitative tone assessment; requires human confirmation.",
                        "is_resolved": False,
                        "created_at": datetime.now(timezone.utc)
                    }
                    validated_findings.append(finding)

                return validated_findings, True, f"AI verification completed successfully with {settings.LLM_MODEL}."

        except Exception as e:
            logger.error(f"Error calling LLM API: {e}")
            return [], False, f"AI verification skipped due to network/API error ({str(e)}). Deterministic results preserved."
