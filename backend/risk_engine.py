from typing import Dict, Any, Tuple
import hashlib
import json

class RiskEngine:
    """
    Evaluates actions against security and oversight policies.
    Classifies into LOW, MEDIUM, or HIGH risk.
    Enforces Human-in-the-Loop gates.
    """

    HIGH_RISK_KEYWORDS = [
        "bulk email", "send email", "payment", "refund", "delete", 
        "drop", "permission", "credential", "transfer money", "ban", "external dispatch"
    ]

    MEDIUM_RISK_KEYWORDS = [
        "insert lead", "update record", "modify database", "create lead", "sync crm", "write"
    ]

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
