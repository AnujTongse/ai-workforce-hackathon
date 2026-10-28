import os
import json
from datetime import datetime
from typing import Optional, List, Dict, Any

from fastapi import FastAPI, HTTPException, Query, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from database import init_db, get_connection, log_action
from models import (
    TaskSubmitRequest, PlanReviewRequest, ApprovalDecisionRequest,
    SettingsUpdateRequest, LeadCreateRequest, SimulateFailureRequest
)
from orchestrator import Orchestrator
from seed import seed_demo_data
from risk_engine import RiskEngine

# Initialize database
init_db()

app = FastAPI(
    title="AI Workforce for Businesses API",
    description="Autonomous Multi-Agent Orchestration with Risk-Based Approvals and Auditable Workflows",
    version="1.0.0"
)

# CORS middleware for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize seed data if database has no tasks
conn = get_connection()
cursor = conn.cursor()
cursor.execute("SELECT COUNT(*) FROM tasks")
if cursor.fetchone()[0] == 0:
    seed_demo_data()
conn.close()

# ----------------- Endpoints -----------------

@app.get("/api/health")
def get_health():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM tasks")
    total_tasks = cursor.fetchone()[0]
    cursor.execute("SELECT COUNT(*) FROM approvals WHERE decision = 'Pending'")
    pending_approvals = cursor.fetchone()[0]
    cursor.execute("SELECT COUNT(*) FROM leads")
    total_leads = cursor.fetchone()[0]
    cursor.execute("SELECT COUNT(*) FROM action_logs")
    total_logs = cursor.fetchone()[0]
    cursor.execute("SELECT key, value FROM settings")
    settings = dict(cursor.fetchall())
    conn.close()

    return {
        "status": "operational",
        "service": "AI Workforce Orchestrator Gateway",
        "total_tasks": total_tasks,
        "pending_approvals": pending_approvals,
        "total_leads": total_leads,
        "total_logs": total_logs,
        "failure_simulation_mode": settings.get("failure_simulation_mode", "off"),
        "timestamp": datetime.utcnow().isoformat() + "Z"
    }

@app.post("/api/tasks")
def submit_task(req: TaskSubmitRequest):
    try:
        result = Orchestrator.submit_business_request(
            request_text=req.request_text,
            requester_id=req.requester_id or "u_owner",
            auto_execute=req.auto_execute if req.auto_execute is not None else True
        )
        return result
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Orchestrator error: {str(e)}")

@app.get("/api/tasks")
def list_tasks(status: Optional[str] = None, risk: Optional[str] = None, search: Optional[str] = None):
    conn = get_connection()
    cursor = conn.cursor()
    query = "SELECT * FROM tasks WHERE 1=1"
    params = []

    if status and status != "All":
        query += " AND status = ?"
        params.append(status)
    if risk and risk != "All":
        query += " AND risk_level = ?"
        params.append(risk)
    if search:
        query += " AND (request_text LIKE ? OR plan_summary LIKE ?)"
        params.extend([f"%{search}%", f"%{search}%"])

    query += " ORDER BY created_at DESC"
    cursor.execute(query, params)
    tasks = [dict(r) for r in cursor.fetchall()]
    conn.close()
    return tasks

@app.get("/api/tasks/{task_id}")
def get_task_details(task_id: str):
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT * FROM tasks WHERE task_id = ?", (task_id,))
    task_row = cursor.fetchone()
    if not task_row:
        conn.close()
        raise HTTPException(status_code=404, detail="Task not found")
    
    task = dict(task_row)

    cursor.execute("SELECT * FROM subtasks WHERE task_id = ? ORDER BY created_at ASC", (task_id,))
    subtasks = [dict(r) for r in cursor.fetchall()]

    cursor.execute("SELECT * FROM action_logs WHERE task_id = ? ORDER BY timestamp ASC", (task_id,))
    logs = [dict(r) for r in cursor.fetchall()]

    cursor.execute("SELECT * FROM approvals WHERE task_id = ?", (task_id,))
    approvals = [dict(r) for r in cursor.fetchall()]

    conn.close()

    return {
        "task": task,
        "subtasks": subtasks,
        "logs": logs,
        "approvals": approvals
    }

@app.post("/api/tasks/{task_id}/execute")
def execute_task_plan(task_id: str):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT status FROM tasks WHERE task_id = ?", (task_id,))
    row = cursor.fetchone()
    conn.close()
    if not row:
        raise HTTPException(status_code=404, detail="Task not found")
    if row["status"] != "Planned":
        raise HTTPException(status_code=400, detail=f"Task is already in status '{row['status']}'")

    Orchestrator.execute_plan(task_id)
    return {"message": "Plan approved. Orchestration pipeline initiated.", "task_id": task_id}

@app.post("/api/tasks/{task_id}/cancel")
def cancel_task(task_id: str):
    conn = get_connection()
    cursor = conn.cursor()
    now = datetime.utcnow().isoformat() + "Z"
    cursor.execute("UPDATE tasks SET status = 'Cancelled', updated_at = ? WHERE task_id = ?", (now, task_id))
    cursor.execute("UPDATE subtasks SET status = 'Failed', output_summary = 'Cancelled by administrator' WHERE task_id = ? AND status IN ('Pending', 'Running', 'Awaiting Approval')", (task_id,))
    conn.commit()
    conn.close()

    log_action(task_id, None, "task_cancelled", "orchestrator", "Executed (Real)", 
               "Administrator halted running workflow safely.", None, {})
    return {"message": "Task cancelled safely.", "task_id": task_id}

@app.post("/api/tasks/{task_id}/resume")
def resume_task_pipeline(task_id: str, force_success: bool = False, reviewer_name: str = "Authorized Reviewer"):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT status FROM tasks WHERE task_id = ?", (task_id,))
    row = cursor.fetchone()
    conn.close()
    if not row:
        raise HTTPException(status_code=404, detail="Task not found")

    res = Orchestrator.resume_task(task_id, force_success=force_success, reviewer_name=reviewer_name)
    return res

@app.get("/api/approvals")
def list_approvals(pending_only: bool = False):
    conn = get_connection()
    cursor = conn.cursor()
    if pending_only:
        cursor.execute("""
        SELECT a.*, t.request_text, s.description as subtask_description, s.agent_role
        FROM approvals a
        JOIN tasks t ON a.task_id = t.task_id
        JOIN subtasks s ON a.subtask_id = s.subtask_id
        WHERE a.decision = 'Pending'
        ORDER BY a.created_at DESC
        """)
    else:
        cursor.execute("""
        SELECT a.*, t.request_text, s.description as subtask_description, s.agent_role
        FROM approvals a
        JOIN tasks t ON a.task_id = t.task_id
        JOIN subtasks s ON a.subtask_id = s.subtask_id
        ORDER BY a.created_at DESC
        """)
    rows = [dict(r) for r in cursor.fetchall()]
    conn.close()
    return rows

@app.post("/api/approvals/{approval_id}/decision")
def record_approval_decision(approval_id: str, req: ApprovalDecisionRequest):
    try:
        Orchestrator.decide_approval(
            approval_id=approval_id,
            decision=req.decision,
            reviewer_id=req.reviewer_id or "u_reviewer",
            reviewer_name=req.reviewer_name or "Compliance Lead",
            comments=req.comments or "",
            edited_payload=req.edited_payload
        )
        return {"message": f"Approval decision '{req.decision}' recorded and executed safely."}
    except ValueError as ve:
        raise HTTPException(status_code=404, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/leads")
def list_leads():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM leads ORDER BY created_at DESC")
    leads = [dict(r) for r in cursor.fetchall()]
    conn.close()
    return leads

@app.post("/api/leads")
def create_lead(req: LeadCreateRequest):
    import uuid
    conn = get_connection()
    cursor = conn.cursor()
    lid = f"lead_{uuid.uuid4().hex[:6]}"
    now = datetime.utcnow().isoformat() + "Z"
    cursor.execute("""
    INSERT INTO leads (record_id, name, contact, company, source, score, validation_status, notes, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (lid, req.name, req.contact, req.company or "", req.source, req.score or 50, "Valid", req.notes or "", now, now))
    conn.commit()
    conn.close()
    return {"message": "Lead created successfully", "record_id": lid}

@app.get("/api/logs")
def list_logs(task_id: Optional[str] = None, status: Optional[str] = None, limit: int = 100):
    conn = get_connection()
    cursor = conn.cursor()
    query = "SELECT * FROM action_logs WHERE 1=1"
    params = []
    if task_id:
        query += " AND task_id = ?"
        params.append(task_id)
    if status and status != "All":
        query += " AND status = ?"
        params.append(status)
    query += " ORDER BY timestamp DESC LIMIT ?"
    params.append(limit)
    cursor.execute(query, params)
    logs = [dict(r) for r in cursor.fetchall()]
    conn.close()
    return logs

@app.get("/api/settings")
def get_settings():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT key, value FROM settings")
    settings = dict(cursor.fetchall())
    conn.close()
    return settings

@app.post("/api/settings")
def update_settings(req: SettingsUpdateRequest):
    conn = get_connection()
    cursor = conn.cursor()
    for k, v in req.settings.items():
        cursor.execute("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)", (k, str(v)))
    conn.commit()
    conn.close()
    return {"message": "Settings updated successfully", "settings": req.settings}

@app.post("/api/demo/reset")
def reset_demo_database():
    seed_demo_data()
    return {"message": "Demo database successfully reset with fresh records and audit trail."}

@app.post("/api/demo/simulate-failure")
def set_failure_mode(req: SimulateFailureRequest):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("INSERT OR REPLACE INTO settings (key, value) VALUES ('failure_simulation_mode', ?)", (req.mode,))
    conn.commit()
    conn.close()
    return {"message": f"Failure simulation mode updated to '{req.mode}'."}

# Static files for production built frontend
FRONTEND_DIST = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "frontend", "dist"))
if os.path.exists(FRONTEND_DIST):
    app.mount("/assets", StaticFiles(directory=os.path.join(FRONTEND_DIST, "assets")), name="assets")
    
    @app.get("/")
    def serve_frontend_root():
        return FileResponse(os.path.join(FRONTEND_DIST, "index.html"))

    @app.get("/{full_path:path}")
    def serve_frontend_spa(full_path: str):
        file_path = os.path.join(FRONTEND_DIST, full_path)
        if os.path.exists(file_path) and os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(FRONTEND_DIST, "index.html"))
