import React, { useState } from 'react';
import { 
  CheckCircle2, Clock, AlertCircle, ShieldAlert, ArrowRight, 
  ChevronRight, Database, Mail, ShieldCheck, Cpu, Play, Ban,
  Eye, RefreshCw, FileText, Check
} from 'lucide-react';

export default function TaskPipelineView({ 
  tasks, selectedTask, selectedTaskDetails, onSelectTask, 
  onExecutePlan, onCancelTask, onOpenApproval, onRefreshDetails 
}) {
  const [filterStatus, setFilterStatus] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTasks = tasks.filter(t => {
    if (filterStatus !== 'All' && t.status !== filterStatus) return false;
    if (searchQuery && !t.request_text.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Completed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <span>Completed</span>
          </span>
        );
      case 'Running':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 animate-pulse">
            <RefreshCw className="w-3 h-3 text-blue-600 animate-spin" />
            <span>Running</span>
          </span>
        );
      case 'Awaiting Approval':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-800 border border-amber-300">
            <ShieldAlert className="w-3 h-3 text-amber-600" />
            <span>Awaiting Approval</span>
          </span>
        );
      case 'Needs Human Review':
      case 'Failed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200">
            <AlertCircle className="w-3 h-3 text-rose-600" />
            <span>{status}</span>
          </span>
        );
      case 'Planned':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200">
            <Clock className="w-3 h-3 text-purple-600" />
            <span>Plan Ready</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
            <span>{status}</span>
          </span>
        );
    }
  };

  const getAgentIcon = (role) => {
    switch (role) {
      case 'Planner': return <Cpu className="w-4 h-4 text-purple-600" />;
      case 'Data/CRM Agent': return <Database className="w-4 h-4 text-blue-600" />;
      case 'Follow-up Agent': return <Mail className="w-4 h-4 text-amber-600" />;
      case 'Quality Checker': return <ShieldCheck className="w-4 h-4 text-emerald-600" />;
      default: return <Cpu className="w-4 h-4 text-slate-600" />;
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
      {/* Left Column: Task History & Filters (4 cols) */}
      <div className="lg:col-span-4 space-y-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-slate-900">Task Executions</h3>
            <span className="text-xs text-slate-500 font-mono">{filteredTasks.length} tasks</span>
          </div>

          {/* Search and status filter */}
          <div className="space-y-2 mb-3">
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
            />
            <div className="flex flex-wrap gap-1">
              {['All', 'Running', 'Awaiting Approval', 'Completed', 'Needs Human Review'].map((st) => (
                <button
                  key={st}
                  onClick={() => setFilterStatus(st)}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                    filterStatus === st
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Task List */}
          <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
            {filteredTasks.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400">
                No tasks match current filter.
              </div>
            ) : (
              filteredTasks.map((t) => {
                const isSelected = selectedTask?.task_id === t.task_id;
                return (
                  <div
                    key={t.task_id}
                    onClick={() => onSelectTask(t.task_id)}
                    className={`p-3 rounded-lg border text-left cursor-pointer transition-all ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-50/20 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="text-[11px] font-mono text-slate-500">
                        {t.task_id}
                      </span>
                      {getStatusBadge(t.status)}
                    </div>
                    <p className="text-xs font-medium text-slate-800 line-clamp-2 leading-relaxed mb-2">
                      {t.request_text}
                    </p>
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span className={`px-1.5 py-0.2 rounded font-medium ${
                        t.risk_level === 'High' ? 'text-amber-700 bg-amber-50' : 'text-slate-600 bg-slate-100'
                      }`}>
                        Risk: {t.risk_level}
                      </span>
                      <span>{new Date(t.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Right Column: Interactive Multi-Agent Pipeline & DAG (8 cols) */}
      <div className="lg:col-span-8 space-y-4">
        {selectedTask ? (
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
            {/* Header */}
            <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-slate-200">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-semibold">
                    {selectedTask.task_id}
                  </span>
                  {getStatusBadge(selectedTask.status)}
                  <span className={`text-xs px-2 py-0.5 rounded font-semibold ${
                    selectedTask.risk_level === 'High' 
                      ? 'bg-amber-100 text-amber-800' 
                      : 'bg-slate-100 text-slate-600'
                  }`}>
                    Overall Risk: {selectedTask.risk_level}
                  </span>
                </div>
                <h3 className="text-base font-semibold text-slate-900 mt-1">
                  {selectedTask.request_text}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  {selectedTask.plan_summary}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onRefreshDetails(selectedTask.task_id)}
                  title="Refresh pipeline status"
                  className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>

                {selectedTask.status === 'Planned' && (
                  <button
                    onClick={() => onExecutePlan(selectedTask.task_id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>Approve & Dispatch Plan</span>
                  </button>
                )}

                {['Running', 'Awaiting Approval'].includes(selectedTask.status) && (
                  <button
                    onClick={() => onCancelTask(selectedTask.task_id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-medium"
                  >
                    <Ban className="w-3.5 h-3.5" />
                    <span>Cancel Pipeline</span>
                  </button>
                )}
              </div>
            </div>

            {/* Visual Workflow Steps (DAG Execution Graph) */}
            <div className="mt-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
                  Role-Based Agent Pipeline & Verification Nodes
                </h4>
                <span className="text-[11px] text-slate-400">
                  Strict least-privilege tool execution via Backend Tool Gateway
                </span>
              </div>

              <div className="space-y-4">
                {selectedTaskDetails?.subtasks?.map((st, index) => {
                  const isAwaiting = st.status === 'Awaiting Approval';
                  const isDone = st.status === 'Completed';
                  const isRunning = st.status === 'Running';
                  const isFailed = st.status === 'Failed';
                  const isPending = st.status === 'Pending';

                  return (
                    <div
                      key={st.subtask_id}
                      className={`relative rounded-xl border p-4 transition-all ${
                        isAwaiting
                          ? 'border-amber-300 bg-amber-50/40 ring-1 ring-amber-300'
                          : isRunning
                          ? 'border-blue-300 bg-blue-50/20'
                          : isDone
                          ? 'border-slate-200 bg-white'
                          : isFailed
                          ? 'border-rose-200 bg-rose-50/30'
                          : 'border-slate-200 bg-slate-50/50 opacity-70'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                            isDone ? 'bg-emerald-100' : isAwaiting ? 'bg-amber-100' : isRunning ? 'bg-blue-100' : 'bg-slate-100'
                          }`}>
                            {getAgentIcon(st.agent_role)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-semibold text-slate-900">
                                {st.agent_role}
                              </span>
                              <span className="text-slate-300">•</span>
                              <span className={`text-[11px] px-1.5 py-0.2 rounded font-medium ${
                                st.risk_level === 'High'
                                  ? 'bg-amber-100 text-amber-800'
                                  : st.risk_level === 'Medium'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-slate-100 text-slate-600'
                              }`}>
                                {st.risk_level} Risk
                              </span>
                              {st.status && (
                                <span className={`text-[11px] font-medium ml-1 ${
                                  isDone ? 'text-emerald-600' : isAwaiting ? 'text-amber-600' : isRunning ? 'text-blue-600' : 'text-slate-500'
                                }`}>
                                  [{st.status}]
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-700 leading-relaxed font-normal">
                              {st.description}
                            </p>
                          </div>
                        </div>

                        {/* Status / Action trigger */}
                        <div className="shrink-0 flex items-center gap-2">
                          {isAwaiting && (
                            <button
                              onClick={() => onOpenApproval(selectedTask.task_id)}
                              className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 animate-pulse"
                            >
                              <ShieldAlert className="w-3.5 h-3.5" />
                              <span>Review & Decide</span>
                            </button>
                          )}
                          {isDone && (
                            <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-medium">
                              <CheckCircle2 className="w-4 h-4" />
                              <span>Verified</span>
                            </span>
                          )}
                          {isRunning && (
                            <span className="inline-flex items-center gap-1 text-xs text-blue-600 font-medium">
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              <span>Executing...</span>
                            </span>
                          )}
                          {isFailed && (
                            <span className="inline-flex items-center gap-1 text-xs text-rose-600 font-medium">
                              <AlertCircle className="w-3.5 h-3.5" />
                              <span>Failed / Blocked</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Output summary preview */}
                      {st.output_summary && (
                        <div className="mt-3 pt-2.5 border-t border-slate-100 text-xs bg-slate-50 p-2.5 rounded-lg font-mono text-slate-700 break-all">
                          <span className="font-semibold text-slate-900 not-mono text-[11px] block mb-1">
                            Confirmed Tool Gateway Outcome:
                          </span>
                          {st.output_summary}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Real-time Audit logs for selected task */}
            <div className="mt-6 pt-5 border-t border-slate-200">
              <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wider mb-3">
                Task Audit Trail & Gateway Verifications
              </h4>
              <div className="bg-slate-50 rounded-lg p-3 max-h-48 overflow-y-auto space-y-2 font-mono text-[11px]">
                {selectedTaskDetails?.logs?.length === 0 ? (
                  <p className="text-slate-400 not-mono">No action logs recorded yet.</p>
                ) : (
                  selectedTaskDetails?.logs?.map((l) => (
                    <div key={l.log_id} className="flex items-start gap-2 border-b border-slate-200/60 pb-1.5 last:border-0 last:pb-0">
                      <span className="text-slate-400 shrink-0">
                        {new Date(l.timestamp).toLocaleTimeString()}
                      </span>
                      <span className={`px-1.5 py-0.2 rounded font-medium shrink-0 ${
                        l.status === 'Executed (Real)'
                          ? 'bg-emerald-100 text-emerald-800'
                          : l.status === 'Simulated (Sandbox)'
                          ? 'bg-sky-100 text-sky-800'
                          : l.status === 'Pending Approval'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}>
                        {l.status}
                      </span>
                      <span className="font-semibold text-slate-800 shrink-0">
                        [{l.action_type}]
                      </span>
                      <span className="text-slate-600 truncate">
                        {l.result_summary}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400">
            <Cpu className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-slate-700">No Task Selected</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Select a task from the list on the left to inspect its multi-agent DAG pipeline, approval checkpoints, and live verification telemetry.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
