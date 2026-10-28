from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

class TaskSubmitRequest(BaseModel):
    request_text: str = Field(..., min_length=3, max_length=2000, description="Natural language request from business user")
    requester_id: Optional[str] = "u_owner"
    auto_execute: Optional[bool] = True
    template_id: Optional[str] = None
    difficulty: Optional[str] = None # 'Easy', 'Medium', 'Hard', or None (Auto-detect)

class PlanReviewRequest(BaseModel):
    task_id: str
    approved: bool
    comments: Optional[str] = None

class ApprovalDecisionRequest(BaseModel):
    approval_id: str
    decision: str = Field(..., description="'Approved', 'Rejected', or 'Edited'")
    reviewer_id: Optional[str] = "u_reviewer"
    reviewer_name: Optional[str] = "Compliance Officer"
    comments: Optional[str] = ""
    edited_payload: Optional[Dict[str, Any]] = None

class SettingsUpdateRequest(BaseModel):
    settings: Dict[str, str]

class LeadCreateRequest(BaseModel):
    name: str
    contact: str
    company: Optional[str] = ""
    source: str = "Web Form"
    score: Optional[int] = 50
    notes: Optional[str] = ""

class SimulateFailureRequest(BaseModel):
    mode: str = Field(..., description="'off', 'crm_transient', 'crm_permanent', 'validation_rejection'")
