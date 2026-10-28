# AI Workforce for Businesses
### Autonomous Multi-Agent Orchestration for Business Task Execution
*Software Requirements Specification (SRS v1.0) & Technical Requirements Implementation*

---

## 1. Executive Summary

**AI Workforce for Businesses** is a professional, minimalist, web-based AI workflow control center designed for business owners, compliance officers, and operations teams. It accepts high-level business requests in plain English, decomposes them into structured dependency graphs (DAG), coordinates specialized role-based agents, executes approved actions through a verified Backend Tool Gateway, pauses high-risk actions in an interactive Human-in-the-Loop (HITL) approval queue, independently verifies outcomes via a Quality Checker, and maintains an immutable audit trail.

---

## 2. Key Architecture & Technology Stack

- **Frontend**: React 18+, Tailwind CSS (minimalist aesthetic with slate/zinc neutrals, clean contrast, crisp borders, and refined color accents), Lucide Icons, Vite.
- **Backend API**: Python FastAPI (REST endpoints, CORS middleware, background task orchestration).
- **Database & Persistence**: SQLite 3 with Foreign Key constraints and Write-Ahead Logging (WAL).
- **Tool Gateway**: Parameterized execution layer enforcing least-privilege permissions and separating `Executed (Real)` database transactions from `Simulated (Sandbox)` external broadcasts.
- **Human-in-the-Loop (HITL)**: Cryptographic payload-bound approval queue allowing reviewers to Approve, Reject, or Edit & Approve sensitive operations.
- **Reliability & Recovery**: Bounded retries with exponential backoff and safe escalation to human operators on persistent failures.

---

## 3. Specialized Role-Based Agents

| Agent Role | Primary Responsibility | Privilege Level & Constraints |
| :--- | :--- | :--- |
| **Planner / Orchestrator** | Decomposes business requests into subtasks, resolves DAG dependencies, estimates risk, and establishes acceptance criteria. | Read-only reasoning; cannot invoke privileged external tools. |
| **Data / CRM Agent** | Ingests, validates, scores, and modifies customer/lead records in SQLite database. | Restricted to parameterized database write tools (`db_insert_lead`, `db_update_lead`). |
| **Follow-up Agent** | Drafts personalized customer communications and prepares campaign broadcasts. | Drafts are Low Risk; external message broadcasts are strictly **High Risk** requiring Human Sign-Off. |
| **Quality Checker** | Independently inspects database state and execution logs against expected criteria before marking any task as Completed. | Independent auditor; never marks unverified actions complete. |

---

## 4. Risk Classification & Human-in-the-Loop Policy

Per SRS Section 3.4 and Section 9:

- **Low Risk**: Read-only summaries, local validation, email drafting. *Runs automatically.*
- **Medium Risk**: Ingesting or updating business records within approved schema. *Configurable auto-execution.*
- **High Risk**: External bulk messaging, financial transactions, deletions, access changes.
  - **Human Gatekeeper**: Workflow automatically pauses in `Awaiting Approval`.
  - **Payload Binding**: Approval is strictly bound to the exact displayed payload. Any material modification requires re-validation.
  - **Decision Options**: Reviewer can **Approve & Execute**, **Modify Payload & Approve**, or **Reject Action (Halt Pipeline)**.

---

## 5. Acceptance Criteria Traceability Matrix

| SRS Criteria | Requirement Description | Implementation in MVP |
| :--- | :--- | :--- |
| **AC-01** | Natural-language business request submission and task plan preview. | `TaskInputForm.jsx` & `TaskPipelineView.jsx` with quick templates and DAG plan visualization. |
| **AC-02** | At least 3 role-based agent components visible in workflow. | Planner, Data/CRM Agent, Follow-up Agent, and Quality Checker active in pipeline. |
| **AC-03** | Real database insert/update with result verification. | Real SQLite `leads` table persistence confirmed via `ToolGateway._tool_db_insert_lead`. |
| **AC-04** | High-risk actions remain blocked until human approval. | High-risk actions pause in `Awaiting Approval` and cannot execute without reviewer sign-off. |
| **AC-05** | Rejected actions do not execute. | Rejecting an approval immediately halts the pipeline and logs rejection. |
| **AC-06** | Tool actions and approval decisions logged. | Append-only `action_logs` table recording actor, action, timestamp, status, and payload. |
| **AC-07** | Failed actions shown as Failed/Needs Human Review rather than falsely Completed. | Bounded retries catch failures and escalate safely to `Needs Human Review`. |
| **AC-08** | Retry and execution limits prevent runaway workflows. | Configurable max retry limits (default 3) with exponential backoff factor. |
| **AC-09** | UI clearly labels simulated integrations. | Distinct badges for `Executed (Real)` vs `Simulated (Sandbox)` on all actions. |

---

## 6. How to Launch and Use

### Quick Launch (One-Click)

1. Double click `start_website.bat` or run:
   ```powershell
   python run_app.py
   ```
2. The application will automatically initialize the database and open your browser at:
   - **Dashboard**: `http://localhost:8000`
   - **Interactive API Documentation**: `http://localhost:8000/docs`

### Vercel Deployment

The FastAPI backend and Vite frontend deploy together through Vercel. The demo uses SQLite in `/tmp` on Vercel, so changes are temporary and may differ between function instances. Use a managed external database for durable shared data.

### Demo Scenarios to Test in the Dashboard

1. **Successful Multi-Agent Task**:
   - In **Workforce Studio**, click the preset template: *"Lead Ingestion & Outreach"*.
   - Click **Launch AI Workforce**.
   - Watch the DAG pipeline progress: Planner decomposes -> Data Agent inserts real lead into SQLite -> Follow-up Agent drafts email -> Follow-up Agent pauses on bulk email for Human Approval.
2. **Human-in-the-Loop Sign-Off**:
   - Navigate to the **Approval Queue** tab.
   - Inspect the pending action, review the recipients and payload, and click **Approve & Execute**.
   - Watch the Quality Checker independently confirm the final results.
3. **Verified Records**:
   - Navigate to **CRM & Records** to view the live records persisted in the database.
4. **Reliability & Failure Recovery (AC-07/AC-08)**:
   - Go to **Quality & Verification** tab.
   - Under *Fault-Tolerance Simulator*, select **"2. Transient Network Error"**.
   - Submit a task to observe bounded retries with backoff and safe escalation.
