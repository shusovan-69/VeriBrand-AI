import difflib
from typing import Dict, Any, List
from pymongo.database import Database


class RevisionInsightsService:
    @staticmethod
    def compare_revisions(
        db: Database,
        workspace_id: str,
        draft_id: str,
        base_revision_id: str,
        new_revision_id: str
    ) -> Dict[str, Any]:
        base_rev = db.revisions.find_one({"workspace_id": workspace_id, "revision_id": base_revision_id})
        new_rev = db.revisions.find_one({"workspace_id": workspace_id, "revision_id": new_revision_id})

        if not base_rev or not new_rev:
            return {"error": "One or both revisions not found in workspace."}

        text_base = base_rev.get("content_text", "")
        text_new = new_rev.get("content_text", "")

        # Compute line diff
        diff_lines = list(difflib.unified_diff(
            text_base.splitlines(keepends=True),
            text_new.splitlines(keepends=True),
            fromfile=f"Revision #{base_rev.get('revision_number', 1)}",
            tofile=f"Revision #{new_rev.get('revision_number', 2)}",
            lineterm=""
        ))

        # Retrieve findings for both revisions
        base_findings = list(db.findings.find({"workspace_id": workspace_id, "revision_id": base_revision_id}))
        new_findings = list(db.findings.find({"workspace_id": workspace_id, "revision_id": new_revision_id}))

        base_issue_keys = {f.get("issue_id") or f.get("original_text"): f for f in base_findings}
        new_issue_keys = {f.get("issue_id") or f.get("original_text"): f for f in new_findings}

        resolved_issues = []
        for key, f in base_issue_keys.items():
            if key not in new_issue_keys:
                resolved_issues.append({
                    "original_text": f.get("original_text"),
                    "category": f.get("category"),
                    "explanation": f.get("explanation"),
                    "source_id": f.get("source_id")
                })

        new_issues = []
        for key, f in new_issue_keys.items():
            if key not in base_issue_keys:
                new_issues.append({
                    "original_text": f.get("original_text"),
                    "category": f.get("category"),
                    "explanation": f.get("explanation"),
                    "source_id": f.get("source_id")
                })

        persistent_issues = []
        for key, f in new_issue_keys.items():
            if key in base_issue_keys:
                persistent_issues.append({
                    "original_text": f.get("original_text"),
                    "category": f.get("category"),
                    "explanation": f.get("explanation"),
                    "source_id": f.get("source_id")
                })

        return {
            "draft_id": draft_id,
            "base_revision": {
                "revision_id": base_revision_id,
                "revision_number": base_rev.get("revision_number"),
                "total_findings": len(base_findings),
                "created_at": base_rev.get("created_at")
            },
            "new_revision": {
                "revision_id": new_revision_id,
                "revision_number": new_rev.get("revision_number"),
                "total_findings": len(new_findings),
                "created_at": new_rev.get("created_at")
            },
            "text_diff": diff_lines,
            "resolved_count": len(resolved_issues),
            "new_issues_count": len(new_issues),
            "persistent_count": len(persistent_issues),
            "resolved_issues": resolved_issues,
            "new_issues": new_issues,
            "persistent_issues": persistent_issues
        }

    @staticmethod
    def get_workspace_recurring_trends(db: Database, workspace_id: str) -> Dict[str, Any]:
        """
        Summarizes recurring violations across all revisions in the workspace.
        """
        all_findings = list(db.findings.find({"workspace_id": workspace_id}))

        category_counts: Dict[str, int] = {}
        rule_counts: Dict[str, int] = {}
        phrase_counts: Dict[str, int] = {}

        for f in all_findings:
            cat = f.get("category", "other")
            category_counts[cat] = category_counts.get(cat, 0) + 1

            src = f.get("source_id")
            if src:
                rule_counts[src] = rule_counts.get(src, 0) + 1

            txt = f.get("original_text", "").lower().strip()
            if txt:
                phrase_counts[txt] = phrase_counts.get(txt, 0) + 1

        top_rules = sorted(rule_counts.items(), key=lambda x: x[1], reverse=True)[:5]
        top_phrases = sorted(phrase_counts.items(), key=lambda x: x[1], reverse=True)[:5]

        return {
            "total_violations_recorded": len(all_findings),
            "violations_by_category": category_counts,
            "top_violated_rules": [{"rule_id": r, "count": c} for r, c in top_rules],
            "top_flagged_phrases": [{"phrase": p, "count": c} for p, c in top_phrases]
        }
