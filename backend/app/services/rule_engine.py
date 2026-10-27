import re
import uuid
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone


class DeterministicRuleEngine:
    @staticmethod
    def run_checks(
        draft_text: str,
        guidelines: List[Dict[str, Any]],
        approved_facts: List[Dict[str, Any]],
        draft_id: str = "draft_preview",
        revision_id: str = "rev_preview",
        workspace_id: str = "ws_default"
    ) -> List[Dict[str, Any]]:
        findings = []

        # 1. Prohibited & Preferred Terminology Checks
        for rule in guidelines:
            if not rule.get("is_active", True):
                continue

            term = rule.get("term_or_pattern", "")
            if not term:
                continue

            category = rule.get("category", "prohibited_term")
            rule_id = rule.get("rule_id", "RULE-GEN")
            version_id = rule.get("version_id", "v1.0")
            reason = rule.get("reason", "Violates brand governance standards.")
            replacement = rule.get("replacement", "")
            severity = rule.get("severity", "high")

            # Word boundary regex search
            pattern = re.compile(rf"\b{re.escape(term)}\b", re.IGNORECASE)
            for match in pattern.finditer(draft_text):
                original_snippet = match.group(0)
                span = {"start": match.start(), "end": match.end()}

                if category == "prohibited_term" or category == "prohibited_claim":
                    suggested = replacement if replacement else f"Omit or replace '{original_snippet}'"
                    findings.append({
                        "finding_id": f"FIND-{uuid.uuid4().hex[:8].upper()}",
                        "issue_id": f"ISSUE-TERM-{rule_id}",
                        "draft_id": draft_id,
                        "revision_id": revision_id,
                        "workspace_id": workspace_id,
                        "category": "guideline_violation",
                        "severity": severity,
                        "original_text": original_snippet,
                        "draft_span": span,
                        "explanation": f"The term '{original_snippet}' is prohibited by brand rule {rule_id}. Reason: {reason}",
                        "source_id": rule_id,
                        "source_version": version_id,
                        "source_excerpt": f"Prohibited: '{term}' -> Rule: {reason}",
                        "suggested_revision": suggested,
                        "evidence_status": "guideline_violation",
                        "is_resolved": False,
                        "created_at": datetime.now(timezone.utc)
                    })

                elif category == "preferred_term":
                    findings.append({
                        "finding_id": f"FIND-{uuid.uuid4().hex[:8].upper()}",
                        "issue_id": f"ISSUE-PREF-{rule_id}",
                        "draft_id": draft_id,
                        "revision_id": revision_id,
                        "workspace_id": workspace_id,
                        "category": "tone_issue",
                        "severity": "medium",
                        "original_text": original_snippet,
                        "draft_span": span,
                        "explanation": f"Brand guidelines prefer '{replacement}' over '{original_snippet}'. {reason}",
                        "source_id": rule_id,
                        "source_version": version_id,
                        "source_excerpt": f"Preferred terminology: Use '{replacement}' instead of '{term}'.",
                        "suggested_revision": replacement,
                        "evidence_status": "guideline_violation",
                        "is_resolved": False,
                        "created_at": datetime.now(timezone.utc)
                    })

        # 2. Promotional Guarantee / Absolute Claim Checks
        # Unsubstantiated "guaranteed" claims require explicit evidence
        # Keep track of spans already flagged by specific guideline rules
        flagged_spans = [(f["draft_span"]["start"], f["draft_span"]["end"]) for f in findings if f.get("draft_span")]

        guarantee_pattern = re.compile(r"\b(guaranteed|guarantee|100%\s*foolproof|risk[- ]free|miracle)\b", re.IGNORECASE)
        for match in guarantee_pattern.finditer(draft_text):
            word = match.group(0)
            span = {"start": match.start(), "end": match.end()}

            # If already flagged by a specific guideline rule, avoid double-flagging the same span
            if any(s[0] <= match.start() and match.end() <= s[1] for s in flagged_spans):
                continue

            # Check if an approved fact exists providing explicit guarantee backing
            has_guarantee_backing = any(
                "guarantee" in f.get("statement", "").lower()
                for f in approved_facts
            )

            if not has_guarantee_backing:
                # Context snippet around word
                start_ctx = max(0, match.start() - 20)
                end_ctx = min(len(draft_text), match.end() + 25)
                context_snippet = draft_text[start_ctx:end_ctx].strip()

                findings.append({
                    "finding_id": f"FIND-{uuid.uuid4().hex[:8].upper()}",
                    "issue_id": "ISSUE-UNSUPPORTED-GUARANTEE",
                    "draft_id": draft_id,
                    "revision_id": revision_id,
                    "workspace_id": workspace_id,
                    "category": "unsupported_claim",
                    "severity": "high",
                    "original_text": word,
                    "draft_span": span,
                    "explanation": (
                        f"Potential unsupported guarantee: The claim '{word}' lacks supporting evidence or legal warranty documentation in approved sources. "
                        "Under FTC advertising substantiation guidelines, objective guarantees must be substantiated."
                    ),
                    "source_id": None,
                    "source_version": None,
                    "source_excerpt": None,
                    "suggested_revision": "Remove absolute guarantee or replace with descriptive performance wording (e.g., 'reliable', 'designed for').",
                    "evidence_status": "insufficient_evidence",
                    "is_resolved": False,
                    "created_at": datetime.now(timezone.utc)
                })

        # 3. Factual & Numerical Contradiction Engine
        # Scans for numerical claims (e.g. 24-hour, 24 hours, 50 meters, etc.) and compares to approved facts
        num_claim_pattern = re.compile(
            r"(\b\d+(?:\.\d+)?)\s*(?:-|–|\s*)?(hours?|hrs?|hour|h|meters?|m|gb|mb|tb|percent|%|days?)\b(?:\s+(?:of\s+)?(battery\s*life|runtime|range|storage|playtime))?",
            re.IGNORECASE
        )

        for match in num_claim_pattern.finditer(draft_text):
            val_str = match.group(1)
            raw_unit = match.group(2).lower()
            topic = match.group(3).lower() if match.group(3) else ""
            span = {"start": match.start(), "end": match.end()}

            try:
                claim_val = float(val_str)
            except ValueError:
                continue

            # Standardize unit
            normalized_unit = "hours" if raw_unit in ["hour", "hours", "hrs", "hr", "h"] else raw_unit

            # Look for matching approved facts
            for fact in approved_facts:
                fact_val = fact.get("numerical_value")
                fact_unit = fact.get("numerical_unit", "").lower()
                comparator = fact.get("numerical_comparator", "up_to")
                source_id = fact.get("source_id", "SRC-FACT")
                version_id = fact.get("version_id", "v1.0")
                statement = fact.get("statement", "")

                # Attribute or unit relevance check
                is_unit_match = (fact_unit == normalized_unit) or (fact_unit in ["hour", "hours"] and normalized_unit == "hours")
                attribute = fact.get("attribute", "").lower()
                is_topic_match = (not topic) or any(t in attribute for t in topic.split()) or (topic in statement.lower())

                if is_unit_match and is_topic_match and fact_val is not None:
                    # Check for contradiction:
                    # If fact is "up_to" or "max" and claim > fact_val -> CONTRADICTION!
                    if comparator in ["up_to", "max"] and claim_val > fact_val:
                        # Extract full surrounding phrase for clear context
                        phrase_start = max(0, draft_text.rfind(" ", 0, match.start() - 1))
                        phrase_end = draft_text.find(" ", match.end() + 1)
                        if phrase_end == -1:
                            phrase_end = len(draft_text)
                        full_phrase = draft_text[phrase_start:phrase_end].strip()
                        if not full_phrase:
                            full_phrase = match.group(0)

                        suggested_claim = f"up to {int(fact_val) if fact_val.is_integer() else fact_val} {normalized_unit}"
                        if "battery" in statement.lower():
                            suggested_text = f"Enjoy {suggested_claim} of battery life"
                        else:
                            suggested_text = f"{suggested_claim}"

                        findings.append({
                            "finding_id": f"FIND-{uuid.uuid4().hex[:8].upper()}",
                            "issue_id": f"ISSUE-FACT-{source_id}",
                            "draft_id": draft_id,
                            "revision_id": revision_id,
                            "workspace_id": workspace_id,
                            "category": "contradiction",
                            "severity": "critical",
                            "original_text": match.group(0),
                            "draft_span": span,
                            "explanation": (
                                f"Factual contradiction: Draft claims {val_str} {normalized_unit}, "
                                f"whereas approved specification '{source_id}' states {statement}."
                            ),
                            "source_id": source_id,
                            "source_version": version_id,
                            "source_excerpt": statement,
                            "suggested_revision": suggested_text,
                            "evidence_status": "contradicted",
                            "is_resolved": False,
                            "created_at": datetime.now(timezone.utc)
                        })

                    elif comparator == "exact" and claim_val != fact_val:
                        findings.append({
                            "finding_id": f"FIND-{uuid.uuid4().hex[:8].upper()}",
                            "issue_id": f"ISSUE-FACT-{source_id}",
                            "draft_id": draft_id,
                            "revision_id": revision_id,
                            "workspace_id": workspace_id,
                            "category": "contradiction",
                            "severity": "critical",
                            "original_text": match.group(0),
                            "draft_span": span,
                            "explanation": f"Factual discrepancy: Draft claims {val_str} {normalized_unit}, but approved specification '{source_id}' specifies exact {fact_val} {fact_unit}.",
                            "source_id": source_id,
                            "source_version": version_id,
                            "source_excerpt": statement,
                            "suggested_revision": f"{fact_val} {fact_unit}",
                            "evidence_status": "contradicted",
                            "is_resolved": False,
                            "created_at": datetime.now(timezone.utc)
                        })

        # 4. Superlative & Comparative Unsubstantiated Claims Check
        superlative_pattern = re.compile(
            r"\b(world's\s*best|#1\s*rated|fastest\s*on\s*the\s*market|unbeatable|revolutionary\s*breakthrough)\b",
            re.IGNORECASE
        )
        for match in superlative_pattern.finditer(draft_text):
            sup_phrase = match.group(0)
            # Check if explicitly supported in approved facts
            supported = any(sup_phrase.lower() in f.get("statement", "").lower() for f in approved_facts)
            if not supported:
                findings.append({
                    "finding_id": f"FIND-{uuid.uuid4().hex[:8].upper()}",
                    "issue_id": "ISSUE-UNSUBSTANTIATED-SUPERLATIVE",
                    "draft_id": draft_id,
                    "revision_id": revision_id,
                    "workspace_id": workspace_id,
                    "category": "unsupported_claim",
                    "severity": "medium",
                    "original_text": sup_phrase,
                    "draft_span": {"start": match.start(), "end": match.end()},
                    "explanation": f"Objective superiority claim '{sup_phrase}' requires third-party substantiation or verified benchmark. None found in approved sources.",
                    "source_id": None,
                    "source_version": None,
                    "source_excerpt": None,
                    "suggested_revision": "Rephrase using experiential language (e.g., 'premium quality', 'high performance') or provide approved citation.",
                    "evidence_status": "insufficient_evidence",
                    "is_resolved": False,
                    "created_at": datetime.now(timezone.utc)
                })

        return findings
