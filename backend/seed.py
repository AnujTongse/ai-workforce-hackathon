import json
import uuid
from datetime import datetime, timedelta
from database import get_connection, init_db

def seed_demo_data():
    init_db()
    conn = get_connection()
    cursor = conn.cursor()

    # Clear existing data for fresh seed if requested
    cursor.execute("DELETE FROM action_logs")
    cursor.execute("DELETE FROM approvals")
    cursor.execute("DELETE FROM subtasks")
    cursor.execute("DELETE FROM tasks")
    cursor.execute("DELETE FROM leads")

    now = datetime.utcnow()

    # 1. Seed sample leads
    sample_leads = [
        ("lead_101", "Marcus Aurelius", "m.aurelius@stoicgrowth.com", "Stoic Growth Capital", "Inbound Enterprise Demo", 94, "High Value", "Requested autonomous lead routing with human approval.", (now - timedelta(days=2)).isoformat() + "Z"),
        ("lead_102", "Elena Vance", "elena@blackmesa-labs.io", "Black Mesa Research", "Partner Referral", 88, "Valid", "Requires invoice reconciliation and audit trail logging.", (now - timedelta(days=1)).isoformat() + "Z"),
        ("lead_103", "Julian Thorne", "jthorne@novapulse.co", "NovaPulse Dynamics", "Webinar Signup", 72, "Valid", "Standard qualification workflow.", (now - timedelta(hours=5)).isoformat() + "Z"),
        ("lead_104", "Clara Oswald", "clara@tardis-logistics.uk", "TARDIS Logistics", "Contact Us", 65, "Incomplete", "Missing department identifier.", (now - timedelta(hours=1)).isoformat() + "Z")
    ]

    for lid, name, contact, company, source, score, val_status, notes, ts in sample_leads:
        cursor.execute("""
        INSERT INTO leads (record_id, name, contact, company, source, score, validation_status, notes, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (lid, name, contact, company, source, score, val_status, notes, ts, ts))

    # 2. Seed a completed demo task
    t1_id = "task_demo_completed"
    t1_time = (now - timedelta(hours=3)).isoformat() + "Z"
    cursor.execute("""
    INSERT INTO tasks (task_id, requester_id, request_text, plan_summary, status, risk_level, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        t1_id,
        "u_owner",
        "Process incoming enterprise lead for Marcus Aurelius (Stoic Growth Capital), verify credentials in CRM, and prepare welcome outreach.",
        "Decomposed into 4 agent subtasks: Lead Verification, Email Drafting, Outreach Broadcast, and Quality Audit.",
        "Completed",
        "High",
        t1_time,
        (now - timedelta(hours=2)).isoformat() + "Z"
    ))

    # Subtasks for Task 1
    subtasks_t1 = [
        (f"{t1_id}_st_1", t1_id, "Data/CRM Agent", "Validate and insert lead Marcus Aurelius into CRM database.", "[]", "Completed", "Medium", json.dumps({"name": "Marcus Aurelius", "company": "Stoic Growth Capital"}), json.dumps({"status": "Executed (Real)", "record_id": "lead_101", "verification": "Confirmed in SQLite Database"}), t1_time, (now - timedelta(hours=2, minutes=50)).isoformat() + "Z"),
        (f"{t1_id}_st_2", t1_id, "Follow-up Agent", "Draft executive welcome email with demo sandbox link.", json.dumps([f"{t1_id}_st_1"]), "Completed", "Low", json.dumps({"recipient": "m.aurelius@stoicgrowth.com"}), json.dumps({"status": "Executed (Real)", "draft_id": "draft_9281", "subject": "Welcome to AI Workforce"}), (now - timedelta(hours=2, minutes=49)).isoformat() + "Z", (now - timedelta(hours=2, minutes=40)).isoformat() + "Z"),
        (f"{t1_id}_st_3", t1_id, "Follow-up Agent", "Dispatch external welcome email broadcast.", json.dumps([f"{t1_id}_st_2"]), "Completed", "High", json.dumps({"recipients": ["m.aurelius@stoicgrowth.com"]}), json.dumps({"status": "Simulated (Sandbox)", "delivered_count": 1, "provider": "Sandbox Mock Gateway"}), (now - timedelta(hours=2, minutes=39)).isoformat() + "Z", (now - timedelta(hours=2, minutes=10)).isoformat() + "Z"),
        (f"{t1_id}_st_4", t1_id, "Quality Checker", "Independently inspect database state, confirm lead existence, and verify communication logs.", json.dumps([f"{t1_id}_st_1", f"{t1_id}_st_3"]), "Completed", "Low", "{}", json.dumps({"verified": True, "confidence_score": 100, "summary": "Quality verification PASSED with 100% compliance."}), (now - timedelta(hours=2, minutes=9)).isoformat() + "Z", (now - timedelta(hours=2)).isoformat() + "Z")
    ]
    for sid, tid, role, desc, deps, st_status, r_level, inp, outp, cr, comp in subtasks_t1:
        cursor.execute("""
        INSERT INTO subtasks (subtask_id, task_id, agent_role, description, dependency_ids, status, risk_level, input_summary, output_summary, created_at, completed_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (sid, tid, role, desc, deps, st_status, r_level, inp, outp, cr, comp))

    # Seed approval for Task 1 (Approved)
    cursor.execute("""
    INSERT INTO approvals (approval_id, task_id, subtask_id, action_id, reviewer_id, reviewer_name, decision, comments, payload_json, risk_level, created_at, decided_at)
    VALUES (?, ?, ?, ?, ?, ?, 'Approved', ?, ?, 'High', ?, ?)
    """, (
        "appr_t1",
        t1_id,
        f"{t1_id}_st_3",
        f"act_{t1_id}_st_3",
        "u_reviewer",
        "Elena Rostova (Compliance Lead)",
        "Verified lead identity and approved external sandbox email broadcast.",
        json.dumps({"recipients": ["m.aurelius@stoicgrowth.com"], "subject": "Welcome to AI Workforce"}),
        (now - timedelta(hours=2, minutes=30)).isoformat() + "Z",
        (now - timedelta(hours=2, minutes=15)).isoformat() + "Z"
    ))

    # Action logs for Task 1
    t1_logs = [
        (f"log_{uuid.uuid4().hex[:6]}", t1_id, None, "task_submission", "orchestrator", "Executed (Real)", "Task initiated: Process incoming enterprise lead.", None, "{}", t1_time),
        (f"log_{uuid.uuid4().hex[:6]}", t1_id, f"{t1_id}_st_1", "db_insert_lead", "leads_table", "Executed (Real)", "Inserted verified lead record 'Marcus Aurelius' (Stoic Growth Capital) into SQLite DB.", None, json.dumps({"record_id": "lead_101"}), (now - timedelta(hours=2, minutes=50)).isoformat() + "Z"),
        (f"log_{uuid.uuid4().hex[:6]}", t1_id, f"{t1_id}_st_2", "draft_email", "email_queue", "Executed (Real)", "Drafted personalized outreach email to m.aurelius@stoicgrowth.com.", None, "{}", (now - timedelta(hours=2, minutes=40)).isoformat() + "Z"),
        (f"log_{uuid.uuid4().hex[:6]}", t1_id, f"{t1_id}_st_3", "approval_decision", "human_approval_queue", "Executed (Real)", "Reviewer Elena Rostova approved action. Signed off.", None, "{}", (now - timedelta(hours=2, minutes=15)).isoformat() + "Z"),
        (f"log_{uuid.uuid4().hex[:6]}", t1_id, f"{t1_id}_st_3", "send_bulk_email", "smtp_gateway", "Simulated (Sandbox)", "[Simulated (Sandbox)] Dispatched email broadcast to 1 recipient(s) after human approval.", None, "{}", (now - timedelta(hours=2, minutes=10)).isoformat() + "Z"),
        (f"log_{uuid.uuid4().hex[:6]}", t1_id, f"{t1_id}_st_4", "workflow_finalized", "quality_checker", "Executed (Real)", "Quality verification PASSED (100% verified) with 100% compliance score.", None, "{}", (now - timedelta(hours=2)).isoformat() + "Z")
    ]
    for lid, tid, stid, atype, tgt, stat, res, err, pl, lts in t1_logs:
        cursor.execute("""
        INSERT INTO action_logs (log_id, task_id, subtask_id, action_type, target, status, timestamp, result_summary, error_code, payload_json)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (lid, tid, stid, atype, tgt, stat, lts, res, err, pl))

    # 3. Seed an active task that is currently in "Awaiting Approval" queue!
    t2_id = "task_demo_awaiting"
    t2_time = (now - timedelta(minutes=15)).isoformat() + "Z"
    cursor.execute("""
    INSERT INTO tasks (task_id, requester_id, request_text, plan_summary, status, risk_level, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        t2_id,
        "u_owner",
        "Process 5 newly acquired tech startup leads and trigger bulk follow-up promotion campaign.",
        "Decomposed into 4 agent subtasks. Step 3 (Bulk Outreach) paused in Human Approval Queue.",
        "Awaiting Approval",
        "High",
        t2_time,
        now.isoformat() + "Z"
    ))

    subtasks_t2 = [
        (f"{t2_id}_st_1", t2_id, "Data/CRM Agent", "Validate and persist 5 tech startup leads into SQLite database.", "[]", "Completed", "Medium", json.dumps({"count": 5}), json.dumps({"status": "Executed (Real)", "records_saved": 5}), t2_time, (now - timedelta(minutes=12)).isoformat() + "Z"),
        (f"{t2_id}_st_2", t2_id, "Follow-up Agent", "Generate bulk outreach copy tailored to tech founders.", json.dumps([f"{t2_id}_st_1"]), "Completed", "Low", "{}", json.dumps({"status": "Executed (Real)", "subject": "Exclusive AI Workforce Access"}), (now - timedelta(minutes=11)).isoformat() + "Z", (now - timedelta(minutes=8)).isoformat() + "Z"),
        (f"{t2_id}_st_3", t2_id, "Follow-up Agent", "Broadcast campaign email to 5 external founder addresses.", json.dumps([f"{t2_id}_st_2"]), "Awaiting Approval", "High", json.dumps({"recipients": ["founder1@novapulse.co", "founder2@startup.io", "tech@apex.ai", "lead@venture.org", "team@cloudgen.io"], "subject": "Exclusive AI Workforce Early Access", "body": "Hello founders,\n\nWe are excited to share early access to our autonomous multi-agent orchestration center..."}), None, (now - timedelta(minutes=7)).isoformat() + "Z", None),
        (f"{t2_id}_st_4", t2_id, "Quality Checker", "Verify post-send delivery telemetry and ensure audit logging.", json.dumps([f"{t2_id}_st_3"]), "Pending", "Low", "{}", None, (now - timedelta(minutes=7)).isoformat() + "Z", None)
    ]
    for sid, tid, role, desc, deps, st_status, r_level, inp, outp, cr, comp in subtasks_t2:
        cursor.execute("""
        INSERT INTO subtasks (subtask_id, task_id, agent_role, description, dependency_ids, status, risk_level, input_summary, output_summary, created_at, completed_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (sid, tid, role, desc, deps, st_status, r_level, inp, outp, cr, comp))

    # Approval item waiting in queue for Task 2
    cursor.execute("""
    INSERT INTO approvals (approval_id, task_id, subtask_id, action_id, reviewer_id, reviewer_name, decision, comments, payload_json, risk_level, created_at, decided_at)
    VALUES (?, ?, ?, ?, NULL, NULL, 'Pending', NULL, ?, 'High', ?, NULL)
    """, (
        "appr_t2_live",
        t2_id,
        f"{t2_id}_st_3",
        f"act_{t2_id}_st_3",
        json.dumps({
            "recipients": ["founder1@novapulse.co", "founder2@startup.io", "tech@apex.ai", "lead@venture.org", "team@cloudgen.io"],
            "subject": "Exclusive AI Workforce Early Access",
            "body": "Hello founders,\n\nWe are excited to share early access to our autonomous multi-agent orchestration center.",
            "target": "External SMTP Broadcast",
            "reason": "Mass communication involves brand reputation and deliverability risk."
        }),
        (now - timedelta(minutes=7)).isoformat() + "Z"
    ))

    t2_logs = [
        (f"log_{uuid.uuid4().hex[:6]}", t2_id, None, "task_submission", "orchestrator", "Executed (Real)", "Task initiated: Process 5 newly acquired tech startup leads.", None, "{}", t2_time),
        (f"log_{uuid.uuid4().hex[:6]}", t2_id, f"{t2_id}_st_1", "db_insert_lead", "leads_table", "Executed (Real)", "Ingested and validated 5 records into database.", None, "{}", (now - timedelta(minutes=12)).isoformat() + "Z"),
        (f"log_{uuid.uuid4().hex[:6]}", t2_id, f"{t2_id}_st_2", "draft_email", "email_queue", "Executed (Real)", "Generated personalized promotional copy for founder list.", None, "{}", (now - timedelta(minutes=8)).isoformat() + "Z"),
        (f"log_{uuid.uuid4().hex[:6]}", t2_id, f"{t2_id}_st_3", "approval_gate_paused", "human_approval_queue", "Pending Approval", "High-risk action 'Broadcast campaign email' paused in Human Approval Queue.", None, "{}", (now - timedelta(minutes=7)).isoformat() + "Z")
    ]
    for lid, tid, stid, atype, tgt, stat, res, err, pl, lts in t2_logs:
        cursor.execute("""
        INSERT INTO action_logs (log_id, task_id, subtask_id, action_type, target, status, timestamp, result_summary, error_code, payload_json)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (lid, tid, stid, atype, tgt, stat, lts, res, err, pl))

    conn.commit()
    conn.close()
    print("Demo data seeded successfully.")

if __name__ == "__main__":
    seed_demo_data()
