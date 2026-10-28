import sqlite3
import json
import os
import shutil
from datetime import datetime
from typing import Dict, Any, List, Optional

def get_db_path():
    if "AI_WORKFORCE_DB" in os.environ:
        return os.environ["AI_WORKFORCE_DB"]

    # Vercel's function filesystem is read-only except for /tmp. This database
    # is intentionally ephemeral; use an external database for durable storage.
    if os.environ.get("VERCEL") == "1":
        return "/tmp/ai_workforce.db"
    
    local_path = os.path.join(os.path.dirname(__file__), "ai_workforce.db")
    try:
        # Check if local directory is writable
        test_file = os.path.join(os.path.dirname(__file__), ".write_test")
        with open(test_file, "a") as f:
            pass
        if os.path.exists(test_file):
            os.remove(test_file)
        return local_path
    except (PermissionError, OSError):
        # Fallback to local user appdata directory when running in protected Program Files
        app_data = os.environ.get("LOCALAPPDATA") or os.environ.get("APPDATA") or os.path.expanduser("~")
        fallback_dir = os.path.join(app_data, "AIWorkforce")
        os.makedirs(fallback_dir, exist_ok=True)
        fallback_db = os.path.join(fallback_dir, "ai_workforce.db")
        if not os.path.exists(fallback_db) and os.path.exists(local_path):
            try:
                shutil.copy2(local_path, fallback_db)
            except Exception:
                pass
        return fallback_db

DB_FILE = get_db_path()

def get_connection():
    conn = sqlite3.connect(DB_FILE, check_same_thread=False, timeout=30.0)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode = WAL")
    conn.execute("PRAGMA foreign_keys = ON")
    conn.execute("PRAGMA busy_timeout = 30000")
    return conn

def init_db():
    conn = get_connection()
    cursor = conn.cursor()

    # Users
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        user_id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        role TEXT NOT NULL, -- 'business_owner', 'administrator', 'reviewer'
        status TEXT NOT NULL DEFAULT 'active'
    )
    """)

    # Tasks
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS tasks (
        task_id TEXT PRIMARY KEY,
        requester_id TEXT NOT NULL,
        request_text TEXT NOT NULL,
        plan_summary TEXT,
        status TEXT NOT NULL, -- 'Draft', 'Planned', 'Running', 'Awaiting Approval', 'Completed', 'Failed', 'Needs Human Review', 'Cancelled'
        risk_level TEXT NOT NULL, -- 'Low', 'Medium', 'High'
        difficulty TEXT DEFAULT 'Medium', -- 'Easy', 'Medium', 'Hard'
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
    )
    """)

    # Column migration for existing installations
    try:
        cursor.execute("ALTER TABLE tasks ADD COLUMN difficulty TEXT DEFAULT 'Medium'")
    except Exception:
        pass

    # Subtasks
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS subtasks (
        subtask_id TEXT PRIMARY KEY,
        task_id TEXT NOT NULL,
        agent_role TEXT NOT NULL, -- 'Planner', 'Data/CRM Agent', 'Follow-up Agent', 'Quality Checker'
        description TEXT NOT NULL,
        dependency_ids TEXT NOT NULL, -- JSON array of subtask IDs
        status TEXT NOT NULL, -- 'Pending', 'Running', 'Awaiting Approval', 'Completed', 'Failed', 'Needs Human Review'
        risk_level TEXT NOT NULL DEFAULT 'Low', -- 'Low', 'Medium', 'High'
        input_summary TEXT,
        output_summary TEXT,
        created_at TEXT NOT NULL,
        completed_at TEXT,
        FOREIGN KEY (task_id) REFERENCES tasks (task_id) ON DELETE CASCADE
    )
    """)

    # Action Logs (Immutable Audit Trail)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS action_logs (
        log_id TEXT PRIMARY KEY,
        task_id TEXT NOT NULL,
        subtask_id TEXT,
        action_type TEXT NOT NULL,
        target TEXT NOT NULL,
        status TEXT NOT NULL, -- 'Executed (Real)', 'Simulated (Sandbox)', 'Pending Approval', 'Rejected', 'Failed'
        timestamp TEXT NOT NULL,
        result_summary TEXT NOT NULL,
        error_code TEXT,
        payload_json TEXT,
        FOREIGN KEY (task_id) REFERENCES tasks (task_id) ON DELETE CASCADE
    )
    """)

    # Approvals Queue
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS approvals (
        approval_id TEXT PRIMARY KEY,
        task_id TEXT NOT NULL,
        subtask_id TEXT NOT NULL,
        action_id TEXT NOT NULL,
        reviewer_id TEXT,
        reviewer_name TEXT,
        decision TEXT NOT NULL DEFAULT 'Pending', -- 'Pending', 'Approved', 'Rejected', 'Edited'
        comments TEXT,
        payload_json TEXT NOT NULL,
        risk_level TEXT NOT NULL DEFAULT 'High',
        created_at TEXT NOT NULL,
        decided_at TEXT,
        FOREIGN KEY (task_id) REFERENCES tasks (task_id) ON DELETE CASCADE
    )
    """)

    # Business Records / Leads
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS leads (
        record_id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        contact TEXT NOT NULL,
        company TEXT,
        source TEXT NOT NULL,
        score INTEGER DEFAULT 0,
        validation_status TEXT NOT NULL, -- 'Valid', 'Incomplete', 'Duplicate', 'High Value'
        notes TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
    )
    """)

    # System Settings & Risk Engine Rules
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
    )
    """)

    # Default settings if empty
    defaults = {
        "max_retries": "3",
        "retry_backoff_seconds": "1.0",
        "require_plan_review": "false",
        "require_hard_task_approval": "true", # Ask for approval before tasks that are hard level
        "simulate_bulk_email": "true",
        "simulate_crm_latency": "false",
        "failure_simulation_mode": "off", # 'off', 'crm_error', 'email_error', 'validation_error'
        "auto_approve_medium_risk": "true"
    }
    for k, v in defaults.items():
        cursor.execute("INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)", (k, v))

    # Default users
    default_users = [
        ("u_admin", "Sarah Vance (Admin)", "administrator", "active"),
        ("u_owner", "Alex Chen (Business Owner)", "business_owner", "active"),
        ("u_reviewer", "Elena Rostova (Compliance Lead)", "reviewer", "active")
    ]
    for uid, name, role, status in default_users:
        cursor.execute("INSERT OR IGNORE INTO users (user_id, name, role, status) VALUES (?, ?, ?, ?)", (uid, name, role, status))

    conn.commit()
    conn.close()

def log_action(task_id: str, subtask_id: Optional[str], action_type: str, target: str, 
               status: str, result_summary: str, error_code: Optional[str] = None, 
               payload: Optional[Dict[str, Any]] = None):
    conn = get_connection()
    cursor = conn.cursor()
    import uuid
    log_id = f"log_{uuid.uuid4().hex[:8]}"
    ts = datetime.utcnow().isoformat() + "Z"
    payload_str = json.dumps(payload) if payload else "{}"
    cursor.execute("""
    INSERT INTO action_logs (log_id, task_id, subtask_id, action_type, target, status, timestamp, result_summary, error_code, payload_json)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (log_id, task_id, subtask_id, action_type, target, status, ts, result_summary, error_code, payload_str))
    conn.commit()
    conn.close()
    return log_id
