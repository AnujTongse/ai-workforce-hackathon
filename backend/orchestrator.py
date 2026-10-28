import json
import time
import uuid
from datetime import datetime
from typing import Dict, Any, List, Optional
import threading

from database import get_connection, log_action
from risk_engine import RiskEngine
from agents import PlannerAgent, DataCrmAgent, FollowupAgent, QualityCheckerAgent
from tool_gateway import ToolGateway

class Orchestrator:
    """
    Core AI Workforce Orchestrator:
    - Task decomposition and DAG dependency enforcement
    - Risk classification and Human-in-the-Loop gating
    - Bounded retries with exponential backoff
    - Quality verification and audit trail enforcement
    """

    @classmethod
    def submit_business_request(cls, request_text: str, requester_id: str = "u_owner", 
                                auto_execute: bool = True) -> Dict[str, Any]:
        # 1. Input validation & sanitization
        clean_text = request_text.strip()
        if len(clean_text) < 3:
            raise ValueError("Business request too short. Please provide meaningful task instructions.")
        if len(clean_text) > 2000:
            raise ValueError("Business request exceeds maximum allowable character limit (2000 chars).")

        conn = get_connection()
        cursor = conn.cursor()

        # Check settings
        cursor.execute("SELECT key, value FROM settings")
        settings = dict(cursor.fetchall())
        require_plan_review = settings.get("require_plan_review", "false").lower() == "true"

        task_id = f"task_{uuid.uuid4().hex[:6]}"
        now = datetime.utcnow().isoformat() + "Z"

        # 2. Planner agent decomposes request
        planned_subtasks = PlannerAgent.decompose_request(clean_text)

        # Overall risk level is highest of any subtask
        overall_risk = "Low"
        for st in planned_subtasks:
            risk_level, _, requires_approval = RiskEngine.evaluate_action_risk(
                st.get("action_type", ""), st.get("target", ""), st.get("payload_template", {})
            )
            st["risk_level"] = risk_level
            st["requires_approval"] = requires_approval
            if risk_level == "High":
                overall_risk = "High"
            elif risk_level == "Medium" and overall_risk != "High":
                overall_risk = "Medium"

        plan_summary = f"Decomposed into {len(planned_subtasks)} agent subtasks with dependencies."
        initial_status = "Planned" if require_plan_review else "Running"

        # Insert main task
        cursor.execute("""
        INSERT INTO tasks (task_id, requester_id, request_text, plan_summary, status, risk_level, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (task_id, requester_id, clean_text, plan_summary, initial_status, overall_risk, now, now))

        # Insert subtasks
        for st in planned_subtasks:
            st_id = f"{task_id}_{st['subtask_id']}"
            cursor.execute("""
            INSERT INTO subtasks (subtask_id, task_id, agent_role, description, dependency_ids, status, risk_level, input_summary, created_at)
            VALUES (?, ?, ?, ?, ?, 'Pending', ?, ?, ?)
            """, (
                st_id,
                task_id,
                st["agent_role"],
                st["description"],
                json.dumps([f"{task_id}_{dep}" for dep in st["dependency_ids"]]),
                st["risk_level"],
                json.dumps(st.get("payload_template", {})),
                now
            ))

        conn.commit()
        conn.close()

        log_action(task_id, None, "task_submission", "orchestrator", "Executed (Real)", 
                   f"Business request initialized: '{clean_text[:60]}...'", None, {"subtasks_count": len(planned_subtasks)})

        # If auto-execute and not gated by manual plan review, run pipeline in background thread
        if auto_execute and not require_plan_review:
            threading.Thread(target=cls._run_pipeline, args=(task_id,), daemon=True).start()

        return {
            "task_id": task_id,
            "status": initial_status,
            "risk_level": overall_risk,
            "plan_summary": plan_summary,
            "subtasks_count": len(planned_subtasks),
            "require_plan_review": require_plan_review
        }

    @classmethod
    def execute_plan(cls, task_id: str):
        """
        Manually trigger execution after plan review approval.
        """
        conn = get_connection()
        cursor = conn.cursor()
        now = datetime.utcnow().isoformat() + "Z"
        cursor.execute("UPDATE tasks SET status = 'Running', updated_at = ? WHERE task_id = ?", (now, task_id))
        conn.commit()
        conn.close()
        threading.Thread(target=cls._run_pipeline, args=(task_id,), daemon=True).start()

    @classmethod
    def _run_pipeline(cls, task_id: str):
        """
        Background orchestrator worker resolving dependency DAG, handling approvals and retries.
        """
        conn = get_connection()
        cursor = conn.cursor()
        
        cursor.execute("SELECT key, value FROM settings")
        settings = dict(cursor.fetchall())
        max_retries = int(settings.get("max_retries", 3))
        backoff_sec = float(settings.get("retry_backoff_seconds", 1.0))
        failure_mode = settings.get("failure_simulation_mode", "off")
        conn.close()

        while True:
            conn = get_connection()
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM tasks WHERE task_id = ?", (task_id,))
            task = cursor.fetchone()
            if not task or task["status"] in ("Completed", "Failed", "Cancelled", "Needs Human Review"):
                conn.close()
                break

            cursor.execute("SELECT * FROM subtasks WHERE task_id = ? ORDER BY created_at ASC", (task_id,))
            subtasks = [dict(r) for r in cursor.fetchall()]
            conn.close()

            # Map of completed subtask IDs
            completed_ids = set(st["subtask_id"] for st in subtasks if st["status"] == "Completed")
            
            # Find next runnable subtask
            runnable_subtask = None
            for st in subtasks:
                if st["status"] == "Pending":
                    deps = json.loads(st["dependency_ids"] or "[]")
                    # Check if all dependencies are satisfied
                    if all(dep in completed_ids for dep in deps):
                        runnable_subtask = st
                        break

            # If no runnable subtask found, check if anything is Awaiting Approval or if all done
            if not runnable_subtask:
                awaiting = [st for st in subtasks if st["status"] == "Awaiting Approval"]
                if awaiting:
                    # Update main task status to Awaiting Approval
                    cls._update_task_status(task_id, "Awaiting Approval")
                    break
                
                # Check if all subtasks completed
                all_done = all(st["status"] == "Completed" for st in subtasks)
                if all_done:
                    # Run Quality Checker Agent
                    cls._finalize_workflow(task_id)
                    break
                else:
                    # Stalled or pending without completion
                    break

            # Process the runnable subtask
            cls._execute_subtask_with_retry(task_id, runnable_subtask, max_retries, backoff_sec, failure_mode)
            time.sleep(0.5)

    @classmethod
    def _execute_subtask_with_retry(cls, task_id: str, subtask: Dict[str, Any], 
                                    max_retries: int, backoff_sec: float, failure_mode: str):
        st_id = subtask["subtask_id"]
        agent_role = subtask["agent_role"]
        risk_level = subtask["risk_level"]
        input_payload = json.loads(subtask["input_summary"] or "{}")

        # Check Human Approval Gate for High Risk
        if risk_level == "High":
            # Check if approval record exists and is approved
            conn = get_connection()
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM approvals WHERE subtask_id = ?", (st_id,))
            existing_approval = cursor.fetchone()

            if not existing_approval:
                # Create pending approval
                approval_id = f"appr_{uuid.uuid4().hex[:6]}"
                now = datetime.utcnow().isoformat() + "Z"
                cursor.execute("""
                INSERT INTO approvals (approval_id, task_id, subtask_id, action_id, decision, payload_json, risk_level, created_at)
                VALUES (?, ?, ?, ?, 'Pending', ?, ?, ?)
                """, (approval_id, task_id, st_id, f"act_{st_id}", json.dumps(input_payload), risk_level, now))

                # Update subtask and task status
                cursor.execute("UPDATE subtasks SET status = 'Awaiting Approval' WHERE subtask_id = ?", (st_id,))
                cursor.execute("UPDATE tasks SET status = 'Awaiting Approval', updated_at = ? WHERE task_id = ?", (now, task_id))
                conn.commit()
                conn.close()

                log_action(task_id, st_id, "approval_gate_paused", "human_approval_queue", "Pending Approval",
                           f"High-risk action '{subtask['description']}' paused for explicit human review.",
                           None, input_payload)
                return

            elif existing_approval["decision"] == "Pending":
                conn.close()
                return

            elif existing_approval["decision"] == "Rejected":
                # Marked as rejected
                now = datetime.utcnow().isoformat() + "Z"
                cursor.execute("UPDATE subtasks SET status = 'Failed', output_summary = 'Action rejected by Human Reviewer' WHERE subtask_id = ?", (st_id,))
                cursor.execute("UPDATE tasks SET status = 'Needs Human Review', updated_at = ? WHERE task_id = ?", (now, task_id))
                conn.commit()
                conn.close()
                log_action(task_id, st_id, "approval_rejected", "human_approval_queue", "Rejected",
                           f"Reviewer rejected high-risk execution. Pipeline paused safely.", None, {})
                return
            
            # If approved, use approved payload (which may have been edited by human)
            if existing_approval["decision"] in ("Approved", "Edited"):
                input_payload = json.loads(existing_approval["payload_json"])
            conn.close()

        # Update subtask status to Running
        cls._update_subtask_status(st_id, "Running")

        attempt = 0
        last_error = None

        while attempt < max_retries:
            attempt += 1
            try:
                # Execute agent action
                output = None
                if agent_role == "Data/CRM Agent":
                    subtask_copy = dict(subtask)
                    subtask_copy["payload_template"] = input_payload
                    output = DataCrmAgent.execute(subtask_copy, task_id, failure_mode=failure_mode)
                elif agent_role == "Follow-up Agent":
                    subtask_copy = dict(subtask)
                    subtask_copy["payload_template"] = input_payload
                    is_approved = (risk_level != "High") or True
                    output = FollowupAgent.execute(subtask_copy, task_id, is_approved=is_approved, failure_mode=failure_mode)
                elif agent_role == "Quality Checker":
                    output = QualityCheckerAgent.verify_task_results(task_id)
                else:
                    output = {"status": "Executed (Real)", "message": "Default agent task executed."}

                # Mark Completed
                cls._update_subtask_status(st_id, "Completed", output_summary=json.dumps(output))
                return

            except Exception as e:
                last_error = str(e)
                log_action(task_id, st_id, "transient_error", agent_role, "Failed",
                           f"Attempt {attempt}/{max_retries} failed: {last_error}", "ERR_RETRY", {"attempt": attempt})

                if attempt < max_retries:
                    sleep_time = backoff_sec * (2 ** (attempt - 1))
                    time.sleep(sleep_time)
                else:
                    # Exhausted retries -> escalate safely (FR-23)
                    cls._update_subtask_status(st_id, "Failed", output_summary=f"Exhausted {max_retries} retries. Error: {last_error}")
                    cls._update_task_status(task_id, "Needs Human Review")
                    log_action(task_id, st_id, "escalation_to_human", "operator", "Failed",
                               f"Workflow halted safely after {max_retries} attempts: {last_error}. Escalated to human operator.", "ERR_EXHAUSTED", {})
                    return

    @classmethod
    def _finalize_workflow(cls, task_id: str):
        # Run final quality check verification
        result = QualityCheckerAgent.verify_task_results(task_id)
        status = "Completed" if result["verified"] else "Needs Human Review"
        cls._update_task_status(task_id, status)
        log_action(task_id, None, "workflow_finalized", "quality_checker", 
                   "Executed (Real)" if result["verified"] else "Failed",
                   result["summary"], None, result)

    @classmethod
    def _update_task_status(cls, task_id: str, status: str):
        conn = get_connection()
        cursor = conn.cursor()
        now = datetime.utcnow().isoformat() + "Z"
        cursor.execute("UPDATE tasks SET status = ?, updated_at = ? WHERE task_id = ?", (status, now, task_id))
        conn.commit()
        conn.close()

    @classmethod
    def _update_subtask_status(cls, subtask_id: str, status: str, output_summary: Optional[str] = None):
        conn = get_connection()
        cursor = conn.cursor()
        now = datetime.utcnow().isoformat() + "Z"
        if output_summary:
            cursor.execute("UPDATE subtasks SET status = ?, output_summary = ?, completed_at = ? WHERE subtask_id = ?", 
                           (status, output_summary, now, subtask_id))
        else:
            cursor.execute("UPDATE subtasks SET status = ? WHERE subtask_id = ?", (status, subtask_id))
        conn.commit()
        conn.close()

    @classmethod
    def decide_approval(cls, approval_id: str, decision: str, reviewer_id: str = "u_reviewer", 
                        reviewer_name: str = "Compliance Lead", comments: str = "", 
                        edited_payload: Optional[Dict[str, Any]] = None):
        """
        Human reviewer approves, rejects, or edits & approves a pending action.
        """
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM approvals WHERE approval_id = ?", (approval_id,))
        appr = cursor.fetchone()
        if not appr:
            conn.close()
            raise ValueError(f"Approval ID {approval_id} not found.")

        task_id = appr["task_id"]
        subtask_id = appr["subtask_id"]
        now = datetime.utcnow().isoformat() + "Z"

        final_payload = json.dumps(edited_payload) if edited_payload else appr["payload_json"]

        cursor.execute("""
        UPDATE approvals 
        SET decision = ?, reviewer_id = ?, reviewer_name = ?, comments = ?, payload_json = ?, decided_at = ?
        WHERE approval_id = ?
        """, (decision, reviewer_id, reviewer_name, comments, final_payload, now, approval_id))
        
        # If approved, reset subtask to Pending so orchestrator resumes it immediately
        if decision in ("Approved", "Edited"):
            cursor.execute("UPDATE subtasks SET status = 'Pending', input_summary = ? WHERE subtask_id = ?", (final_payload, subtask_id))
            cursor.execute("UPDATE tasks SET status = 'Running', updated_at = ? WHERE task_id = ?", (now, task_id))
        elif decision == "Rejected":
            cursor.execute("UPDATE subtasks SET status = 'Failed', output_summary = ? WHERE subtask_id = ?", 
                           (f"Rejected by {reviewer_name}: {comments}", subtask_id))
            cursor.execute("UPDATE tasks SET status = 'Needs Human Review', updated_at = ? WHERE task_id = ?", (now, task_id))

        conn.commit()
        conn.close()

        log_action(task_id, subtask_id, "approval_decision", "human_approval_queue", 
                   "Executed (Real)" if decision != "Rejected" else "Rejected",
                   f"Reviewer {reviewer_name} recorded decision: {decision}. Comments: '{comments}'",
                   None, {"decision": decision, "reviewer": reviewer_name, "comments": comments})

        # Resume background orchestrator pipeline
        if decision in ("Approved", "Edited"):
            threading.Thread(target=cls._run_pipeline, args=(task_id,), daemon=True).start()
