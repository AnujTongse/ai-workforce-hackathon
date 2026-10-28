import React, { useState } from 'react';
import { 
  ShieldAlert, CheckCircle2, XCircle, Edit3, AlertTriangle, 
  UserCheck, ExternalLink, MessageSquare, Clock, ArrowRight, ShieldCheck 
} from 'lucide-react';

export default function ApprovalQueueView({ approvals, onDecideApproval, userRole }) {
  const [selectedApproval, setSelectedApproval] = useState(null);
  const [decisionModalMode, setDecisionModalMode] = useState(null); // 'Approve', 'Reject', 'Edit'
  const [comments, setComments] = useState('');
  const [editedPayloadJson, setEditedPayloadJson] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const pendingApprovals = approvals.filter(a => a.decision === 'Pending');
  const pastApprovals = approvals.filter(a => a.decision !== 'Pending');

  const handleOpenModal = (appr, mode) => {
    setSelectedApproval(appr);
    setDecisionModalMode(mode);
    setComments('');
    try {
      const parsed = JSON.parse(appr.payload_json || '{}');
      setEditedPayloadJson(JSON.stringify(parsed, null, 2));
    } catch {
      setEditedPayloadJson(appr.payload_json || '{}');
    }
  };

  const handleSubmitDecision = async () => {
    if (!selectedApproval || !decisionModalMode) return;
    setIsProcessing(true);
    try {
      let finalPayload = null;
      if (decisionModalMode === 'Edit') {
        finalPayload = JSON.parse(editedPayloadJson);
      }
      await onDecideApproval(
        selectedApproval.approval_id,
        decisionModalMode === 'Edit' ? 'Edited' : decisionModalMode,
        comments,
        userRole === 'reviewer' ? 'Elena Rostova (Compliance Lead)' : 'Authorized Operator',
        finalPayload
      );
      setDecisionModalMode(null);
      setSelectedApproval(null);
    } catch (err) {
      alert(`Approval error: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs flex flex-wrap items-center justify-between gap-4 transition-colors">
        <div>
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-amber-500" />
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              Human-in-the-Loop (HITL) Gatekeeper
            </h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
              {pendingApprovals.length} Pending Actions
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
            In accordance with SRS Policy Section 9, high-risk actions (bulk email broadcasting, external system modifications, payments) are strictly paused until authorized human review.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-lg text-slate-600 dark:text-slate-300">
          <UserCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <span>Security Protocol: Cryptographic Payload Binding Enabled</span>
        </div>
      </div>

      {/* Pending Approvals List */}
      <div>
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2">
          <span>Active Actions Requiring Sign-off</span>
          <span className="text-xs font-mono text-slate-400 dark:text-slate-500">({pendingApprovals.length})</span>
        </h3>

        {pendingApprovals.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-12 text-center text-slate-400 dark:text-slate-500">
            <ShieldCheck className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
            <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Approval Queue Clear</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              No high-impact actions are currently awaiting authorization. The autonomous pipeline is operating within safe parameters.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingApprovals.map((appr) => {
              let payload = {};
              try {
                payload = JSON.parse(appr.payload_json || '{}');
              } catch {
                payload = {};
              }

              return (
                <div 
                  key={appr.approval_id} 
                  className="bg-white dark:bg-slate-900 rounded-xl border-2 border-amber-300 dark:border-amber-600/80 shadow-sm p-6 relative overflow-hidden transition-colors"
                >
                  <div className="absolute top-0 right-0 bg-amber-500 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-bl-lg">
                    High Risk Action Gated
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Left Info (8 cols) */}
                    <div className="lg:col-span-8 space-y-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-semibold text-slate-600 dark:text-slate-300">
                            {appr.approval_id}
                          </span>
                          <span className="text-xs font-mono text-slate-400 dark:text-slate-500">
                            Task: {appr.task_id}
                          </span>
                        </div>
                        <h4 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                          {appr.subtask_description || 'High-Risk External Tool Action'}
                        </h4>
                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                          Parent Request: "{appr.request_text}"
                        </p>
                      </div>

                      {/* Action Specs */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-950 p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 text-xs">
                        <div>
                          <span className="text-slate-400 dark:text-slate-500 block text-[11px]">Proposed Agent:</span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200">{appr.agent_role || 'Follow-up Agent'}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 dark:text-slate-500 block text-[11px]">Target System:</span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200 font-mono">
                            {payload.target || 'External SMTP Gateway / CRM'}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 dark:text-slate-500 block text-[11px]">Affected Recipients / Records:</span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            {Array.isArray(payload.recipients) 
                              ? `${payload.recipients.length} external recipient(s)` 
                              : (payload.recipients || payload.recipient || 'External recipient')}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 dark:text-slate-500 block text-[11px]">Risk Classification:</span>
                          <span className="font-bold text-amber-700 dark:text-amber-400">High Risk (External Communication)</span>
                        </div>
                      </div>

                      {/* Payload preview */}
                      <div>
                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                          Exact Action Payload Preview:
                        </span>
                        <pre className="bg-slate-900 dark:bg-slate-950 text-emerald-400 p-3 rounded-lg text-xs font-mono overflow-x-auto max-h-36 border border-slate-800">
                          {JSON.stringify(payload, null, 2)}
                        </pre>
                      </div>
                    </div>

                    {/* Right Decision Panel (4 cols) */}
                    <div className="lg:col-span-4 flex flex-col justify-between border-t lg:border-t-0 lg:border-l border-slate-200 dark:border-slate-800 pt-4 lg:pt-0 lg:pl-6">
                      <div className="space-y-3">
                        <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-lg border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300">
                          <div className="flex items-center gap-1.5 font-semibold mb-1">
                            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                            <span>Oversight Requirement</span>
                          </div>
                          Review the payload carefully. Approving will authorize the Tool Gateway to dispatch this payload.
                        </div>

                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          <span className="block font-medium text-slate-700 dark:text-slate-300">Queued at:</span>
                          <span>{new Date(appr.created_at).toLocaleString()}</span>
                        </div>
                      </div>

                      {/* Decision buttons */}
                      <div className="space-y-2 mt-4">
                        <button
                          onClick={() => handleOpenModal(appr, 'Approve')}
                          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Approve & Execute</span>
                        </button>

                        <button
                          onClick={() => handleOpenModal(appr, 'Edit')}
                          className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold border border-slate-300 dark:border-slate-700 transition-colors"
                        >
                          <Edit3 className="w-4 h-4" />
                          <span>Modify Payload & Approve</span>
                        </button>

                        <button
                          onClick={() => handleOpenModal(appr, 'Reject')}
                          className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-semibold transition-colors"
                        >
                          <XCircle className="w-4 h-4" />
                          <span>Reject Action (Halt)</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Past Decisions History */}
      <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3">
          Historical Human-in-the-Loop Sign-Offs
        </h3>
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs transition-colors">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="px-4 py-3">Approval ID</th>
                <th className="px-4 py-3">Task ID</th>
                <th className="px-4 py-3">Decision</th>
                <th className="px-4 py-3">Reviewer</th>
                <th className="px-4 py-3">Decided At</th>
                <th className="px-4 py-3">Comments</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {pastApprovals.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-6 text-slate-400 dark:text-slate-500">
                    No historical approvals recorded yet.
                  </td>
                </tr>
              ) : (
                pastApprovals.map((pa) => (
                  <tr key={pa.approval_id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="px-4 py-3 font-mono font-medium text-slate-700 dark:text-slate-300">{pa.approval_id}</td>
                    <td className="px-4 py-3 font-mono text-slate-500 dark:text-slate-400">{pa.task_id}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full font-semibold text-[11px] ${
                        pa.decision === 'Approved' || pa.decision === 'Edited'
                          ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                          : 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300'
                      }`}>
                        {pa.decision}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-200">{pa.reviewer_name || 'System'}</td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
                      {pa.decided_at ? new Date(pa.decided_at).toLocaleString() : '-'}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400 max-w-xs truncate">{pa.comments || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Decision Modal */}
      {decisionModalMode && selectedApproval && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 max-w-lg w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h4 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                Confirm Human Decision: {decisionModalMode}
              </h4>
              <button
                onClick={() => setDecisionModalMode(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400">
              You are recording an official governance decision for approval ID <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-slate-800 dark:text-slate-200">{selectedApproval.approval_id}</code>.
            </p>

            {decisionModalMode === 'Edit' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Edit Action Payload (JSON):
                </label>
                <textarea
                  rows={6}
                  value={editedPayloadJson}
                  onChange={(e) => setEditedPayloadJson(e.target.value)}
                  className="w-full p-2.5 bg-slate-900 dark:bg-slate-950 text-emerald-400 font-mono text-xs rounded-lg border border-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <span className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 block">
                  Per SRS Section 9.2, modified payloads are re-validated before tool execution.
                </span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Reviewer Notes & Decision Rationale:
              </label>
              <textarea
                rows={2}
                placeholder="e.g. Verified recipient address and approved for sandbox dispatch."
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                className="w-full p-2.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setDecisionModalMode(null)}
                className="px-4 py-2 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmitDecision}
                disabled={isProcessing}
                className={`px-4 py-2 rounded-lg text-xs font-semibold text-white shadow-xs ${
                  decisionModalMode === 'Reject'
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : 'bg-indigo-600 hover:bg-indigo-700'
                }`}
              >
                {isProcessing ? 'Recording...' : `Confirm ${decisionModalMode}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
