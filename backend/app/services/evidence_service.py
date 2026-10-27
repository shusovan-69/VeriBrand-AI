from typing import List, Dict, Any, Optional
from pymongo.database import Database


class EvidenceService:
    @staticmethod
    def get_workspace_guidelines(db: Database, workspace_id: str) -> List[Dict[str, Any]]:
        return list(db.guidelines.find({"workspace_id": workspace_id, "is_active": True}))

    @staticmethod
    def get_workspace_facts(db: Database, workspace_id: str, product_filter: Optional[str] = None) -> List[Dict[str, Any]]:
        query = {"workspace_id": workspace_id}
        if product_filter:
            # Case-insensitive partial regex
            query["product_name"] = {"$regex": product_filter, "$options": "i"}
        return list(db.approved_facts.find(query))

    @staticmethod
    def retrieve_relevant_facts(db: Database, workspace_id: str, draft_text: str, target_product: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Retrieves approved facts relevant to the draft based on product name and keywords.
        """
        all_facts = list(db.approved_facts.find({"workspace_id": workspace_id}))
        if not all_facts:
            return []

        text_lower = draft_text.lower()
        relevant = []

        for fact in all_facts:
            prod_name = fact.get("product_name", "").lower()
            attribute = fact.get("attribute", "").lower()
            statement = fact.get("statement", "").lower()

            is_relevant = False
            # Check target product match
            if target_product and target_product.lower() in prod_name:
                is_relevant = True
            elif prod_name and prod_name in text_lower:
                is_relevant = True

            # Check attribute match (e.g. battery, audio, warranty)
            if attribute and attribute in text_lower:
                is_relevant = True
            elif any(word in text_lower for word in attribute.split("_")):
                is_relevant = True

            # Check if key tokens in statement appear in text
            statement_tokens = [w for w in statement.replace(":", " ").replace(".", " ").split() if len(w) > 3]
            token_matches = sum(1 for token in statement_tokens if token in text_lower)
            if token_matches >= 2:
                is_relevant = True

            if is_relevant and fact not in relevant:
                relevant.append(fact)

        # If no specific filter matched, include all workspace facts if small set (< 50)
        if not relevant and len(all_facts) <= 50:
            relevant = all_facts

        return relevant

    @staticmethod
    def validate_citation(db: Database, workspace_id: str, source_id: str, version_id: Optional[str] = None) -> Optional[Dict[str, Any]]:
        """
        Checks if a cited source exists and is valid in this workspace.
        Prevents AI hallucinations or stale references.
        """
        # Check facts
        fact = db.approved_facts.find_one({"workspace_id": workspace_id, "source_id": source_id})
        if fact:
            if version_id and fact.get("version_id") != version_id:
                return None
            return fact

        # Check guidelines
        guide = db.guidelines.find_one({"workspace_id": workspace_id, "rule_id": source_id})
        if guide:
            if version_id and guide.get("version_id") != version_id:
                return None
            return guide

        return None
