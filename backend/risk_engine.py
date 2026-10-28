from typing import Dict, Any, Tuple, List, Optional
import hashlib
import json
import re

class RiskEngine:
    """
    Evaluates actions against security and oversight policies.
    Classifies into LOW, MEDIUM, or HIGH risk.
    Enforces Human-in-the-Loop gates and pre-execution approval for Hard-level tasks.
    """

    HIGH_RISK_KEYWORDS = [
        "bulk email", "send email", "payment", "refund", "delete", 
        "drop", "permission", "credential", "transfer money", "ban", "external dispatch"
    ]

    MEDIUM_RISK_KEYWORDS = [
        "insert lead", "update record", "modify database", "create lead", "sync crm", "write"
    ]

    HARD_TASK_KEYWORDS = [
        "bulk", "mass", "broadcast", "blast", "500", "1000", "all employees", "all leads", "all users",
        "payment", "invoice", "refund", "wire", "transfer", "bank", "payout", "salary", "payroll", "$",
        "delete", "drop", "wipe", "truncate", "overwrite", "credentials", "revoke", "purge",
        "critical", "urgent", "sensitive", "confidential", "security", "hard", "high risk", "hard level"
    ]

    @classmethod
    def evaluate_task_difficulty(cls, request_text: str, planned_subtasks: List[Dict[str, Any]], 
                                 user_override: Optional[str] = None) -> Dict[str, Any]:
        """
        Determines whether a business request is 'Easy', 'Medium', or 'Hard' level.
        Hard level tasks represent high-impact, bulk, financial, or sensitive operations
        that require human approval before execution begins.
        """
        if user_override and user_override.capitalize() in ("Easy", "Medium", "Hard"):
            diff = user_override.capitalize()
            return {
                "difficulty": diff,
                "reason": f"Explicitly designated as {diff} level by operator.",
                "requires_pre_approval": (diff == "Hard")
            }

        text_lower = request_text.lower()

        # Check for numbers indicating bulk operations (e.g., >50 recipients or items)
        numbers = [int(n) for n in re.findall(r'\b\d+\b', text_lower)]
        has_bulk_number = any(n >= 50 for n in numbers)

        has_hard_keyword = any(kw in text_lower for kw in cls.HARD_TASK_KEYWORDS)
        has_high_risk_subtask = any(st.get("risk_level") == "High" for st in planned_subtasks)

        if has_bulk_number or has_hard_keyword or has_high_risk_subtask:
            reasons = []
            if has_bulk_number:
                reasons.append("high-volume bulk operation (>50 items/recipients)")
            if has_high_risk_subtask:
                reasons.append("high-risk automated action (external outreach/finance)")
            if has_hard_keyword:
                reasons.append("sensitive business domain (finances, outreach, or records)")

            return {
                "difficulty": "Hard",
                "reason": f"Classified as Hard Level due to {', '.join(reasons) or 'high complexity'}.",
                "requires_pre_approval": True
            }

        # Medium check
        has_crm_write = any("insert" in st.get("action_type", "") or "create" in st.get("action_type", "") for st in planned_subtasks)
        if has_crm_write or len(planned_subtasks) >= 3:
            return {
                "difficulty": "Medium",
                "reason": "Moderate multi-agent workflow with local database persistence and drafting.",
                "requires_pre_approval": False
            }

        # Easy check
        return {
            "difficulty": "Easy",
            "reason": "Lightweight, read-only, or verification workflow.",
            "requires_pre_approval": False
        }

    @classmethod
    def evaluate_action_risk(cls, action_type: str, target: str, payload: Dict[str, Any]) -> Tuple[str, str, bool]:
        """
        Returns (risk_level, reason, requires_human_approval)
        """
        action_lower = action_type.lower()
        target_lower = target.lower()

        # Explicit High-Risk check
        if any(kw in action_lower or kw in target_lower for kw in cls.HIGH_RISK_KEYWORDS):
            return (
                "High",
                f"Action involves external impact, bulk messaging, or critical financial/record modifications ({action_type} on {target}).",
                True
            )

        # Medium-Risk check
        if any(kw in action_lower or kw in target_lower for kw in cls.MEDIUM_RISK_KEYWORDS):
            return (
                "Medium",
                f"Action modifies business records or database state ({action_type}).",
                False # Medium can run automatically or per setting
            )

        # Low Risk
        return (
            "Low",
            f"Read-only operation, local parsing, verification, or plan compilation ({action_type}).",
            False
        )

    @classmethod
    def compute_payload_hash(cls, payload: Dict[str, Any]) -> str:
        """
        Computes deterministic SHA256 hash to ensure approval is cryptographically
        bound to the exact payload (SRS Section 9.2).
        """
        serialized = json.dumps(payload, sort_keys=True, default=str)
        return hashlib.sha256(serialized.encode("utf-8")).hexdigest()
