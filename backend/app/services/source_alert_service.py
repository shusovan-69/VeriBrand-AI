import uuid
from datetime import datetime, timezone
from typing import List, Dict, Any
from pymongo.database import Database


class SourceAlertService:
    @staticmethod
    def trigger_source_change_alerts(
        db: Database,
        workspace_id: str,
        source_id: str,
        old_version: str,
        new_version: str,
        source_statement: str
    ) -> int:
        """
        Finds all drafts that cited this source_id in historical findings or approval snapshots.
        Generates alerts requesting re-review while preserving historical decision.
        """
        # Find findings citing this source
        affected_findings = list(db.findings.find({
            "workspace_id": workspace_id,
            "source_id": source_id
        }))

        affected_draft_ids = set()
        for f in affected_findings:
            if "draft_id" in f:
                affected_draft_ids.add(f["draft_id"])

        # Also check approval decisions snapshot
        decisions = list(db.approval_decisions.find({"workspace_id": workspace_id}))
        for dec in decisions:
            snapshots = dec.get("source_snapshot", [])
            for s in snapshots:
                if s.get("source_id") == source_id:
                    affected_draft_ids.add(dec["draft_id"])

        created_alerts = 0
        for draft_id in affected_draft_ids:
            # Check if alert already exists for this draft and version
            existing = db.source_alerts.find_one({
                "workspace_id": workspace_id,
                "draft_id": draft_id,
                "source_id": source_id,
                "new_version": new_version
            })
            if not existing:
                alert_doc = {
                    "alert_id": f"ALT-{uuid.uuid4().hex[:8].upper()}",
                    "workspace_id": workspace_id,
                    "draft_id": draft_id,
                    "source_id": source_id,
                    "old_version": old_version,
                    "new_version": new_version,
                    "source_statement": source_statement,
                    "message": (
                        f"Approved source '{source_id}' was updated from {old_version} to {new_version}. "
                        "Historical approval record is preserved; re-review of this draft is recommended."
                    ),
                    "status": "pending_re_review",
                    "created_at": datetime.now(timezone.utc)
                }
                db.source_alerts.insert_one(alert_doc)
                created_alerts += 1

        return created_alerts

    @staticmethod
    def get_workspace_alerts(db: Database, workspace_id: str) -> List[Dict[str, Any]]:
        return list(db.source_alerts.find({"workspace_id": workspace_id}).sort("created_at", -1))
