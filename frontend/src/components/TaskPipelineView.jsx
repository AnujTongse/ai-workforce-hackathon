import React, { useState } from 'react';
import { 
  CheckCircle2, Clock, AlertCircle, ShieldAlert, ArrowRight, 
  ChevronRight, Database, Mail, ShieldCheck, Cpu, Play, Ban,
  RefreshCw, Sparkles, User, Building, ExternalLink, Zap, Check, X
} from 'lucide-react';

export default function TaskPipelineView({ 
  tasks, selectedTask, selectedTaskDetails, onSelectTask, 
  onExecutePlan, onCancelTask, onOpenApproval, onRefreshDetails,
  onResumeTask, onTurnOffSimulatorAndRetry, onDecideApproval, approvals
}) {
  const [filterStatus, setFilterStatus] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileTab, setMobileTab] = useState('details'); // 'list' or 'details'

  const filteredTasks = tasks.filter(t => {
    if (filterStatus !== 'All' && t.status !== filterStatus) return false;
    if (searchQuery && !t.request_text.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Completed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Completed</span>
          </span>
        );
      case 'Running':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 animate-pulse">
            <RefreshCw className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 animate-spin" />
            <span>In Progress</span>
          </span>
        );
      case 'Awaiting Approval':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span>Needs Approval</span>
          </span>
        );
      case 'Needs Human Review':
      case 'Failed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
            <AlertCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
            <span>Needs Human Review</span>
          </span>
        );
      case 'Planned':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
            <Clock className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
            <span>Plan Ready</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
            <span>{status}</span>
          </span>
        );
    }
  };

  const getAgentInfo = (role) => {
    switch (role) {
      case 'Planner': 
        return { 
          icon: <Cpu className="w-4 h-4 text-purple-600 dark:text-purple-400" />,
          title: 'Planning Agent',
          bg: 'bg-purple-50 dark:bg-purple-950/50 border-purple-200 dark:border-purple-800'
        };
      case 'Data/CRM Agent': 
        return { 
          icon: <Database className="w-4 h-4 text-blue-600 dark:text-blue-400" />,
          title: 'Data & CRM Agent',
          bg: 'bg-blue-50 dark:bg-blue-950/50 border-blue-200 dark:border-blue-800'
        };
      case 'Follow-up Agent': 
        return { 
          icon: <Mail className="w-4 h-4 text-amber-600 dark:text-amber-400" />,
          title: 'Client Outreach Agent',
          bg: 'bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800'
        };
      case 'Quality Checker': 
        return { 
          icon: <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />,
          title: 'Quality & Audit Checker',
          bg: 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800'
        };
      default: 
        return { 
          icon: <Cpu className="w-4 h-4 text-slate-600 dark:text-slate-400" />,
          title: role,
          bg: 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
        };
    }
  };

  // Find pending approval for this task if any
  const taskApproval = approvals?.find(a => a.task_id === selectedTask?.task_id && a.decision === 'Pending');

  return (
    <div className="space-y-4">
      {/* Mobile/Tablet view switcher buttons */}
      <div className="flex lg:hidden bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
        <button
          onClick={() => setMobileTab('list')}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
            mobileTab === 'list'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          All Tasks ({tasks.length})
        </button>
        <button
          onClick={() => setMobileTab('details')}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
            mobileTab === 'details'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          Selected Pipeline
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Task History (4 cols) */}
        <div className={`lg:col-span-4 space-y-3 ${mobileTab === 'details' ? 'hidden lg:block' : 'block'}`}>
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs transition-colors">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Workflow History</h3>
              <span className="text-xs text-slate-400 dark:text-slate-500 font-mono">{filteredTasks.length} tasks</span>
            </div>

            {/* Search and filters */}
            <div className="space-y-2 mb-3">
              <input
                type="text"
                placeholder="Filter workflows..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white placeholder-slate-400 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <div className="flex flex-wrap gap-1">
                {['All', 'Running', 'Awaiting Approval', 'Completed', 'Needs Human Review'].map((st) => (
                  <button
                    key={st}
                    onClick={() => setFilterStatus(st)}
                    className={`px-2 py-0.5 rounded-md text-[11px] font-medium transition-colors ${
                      filterStatus === st
                        ? 'bg-slate-900 dark:bg-indigo-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                    }`}
                  >
                    {st === 'Needs Human Review' ? 'Review Needed' : st}
                  </button>
                ))}
              </div>
            </div>

            {/* Task List */}
            <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
              {filteredTasks.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-400 dark:text-slate-500">
                  No tasks match filter.
                </div>
              ) : (
                filteredTasks.map((t) => {
                  const isSelected = selectedTask?.task_id === t.task_id;
                  return (
                    <div
                      key={t.task_id}
                      onClick={() => {
                        onSelectTask(t.task_id);
                        setMobileTab('details');
                      }}
                      className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                        isSelected
                          ? 'border-indigo-500 dark:border-indigo-400 bg-indigo-50/30 dark:bg-indigo-950/40 shadow-xs ring-1 ring-indigo-500/20'
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50/70 dark:hover:bg-slate-800/40'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1.5 mb-1.5">
                        <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                          {t.task_id}
                        </span>
                        {getStatusBadge(t.status)}
                      </div>
                      <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 line-clamp-2 leading-relaxed mb-1.5">
                        {t.request_text}
                      </p>
                      <div className="flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500">
                        <span>Risk: {t.risk_level}</span>
                        <span>{new Date(t.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Execution Pipeline Details (8 cols) */}
        <div className={`lg:col-span-8 space-y-4 ${mobileTab === 'list' ? 'hidden lg:block' : 'block'}`}>
          {selectedTask ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-6 shadow-xs transition-colors space-y-5">
              {/* Header */}
              <div className="flex flex-wrap items-start justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="space-y-1 max-w-xl">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-semibold text-slate-600 dark:text-slate-300">
                      {selectedTask.task_id}
                    </span>
                    {getStatusBadge(selectedTask.status)}
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      Overall Risk: <strong>{selectedTask.risk_level}</strong>
                    </span>
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-snug">
                    {selectedTask.request_text}
                  </h3>
                </div>

                {/* Header Action Controls */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onRefreshDetails(selectedTask.task_id)}
                    title="Refresh"
                    className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>

                  {selectedTask.status === 'Planned' && (
                    <button
                      onClick={() => onExecutePlan(selectedTask.task_id)}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs"
                    >
                      <Play className="w-3.5 h-3.5" />
                      <span>Approve & Dispatch</span>
                    </button>
                  )}

                  {['Running', 'Awaiting Approval', 'Needs Human Review'].includes(selectedTask.status) && (
                    <button
                      onClick={() => onCancelTask(selectedTask.task_id)}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-medium"
                    >
                      <Ban className="w-3.5 h-3.5" />
                      <span>Halt</span>
                    </button>
                  )}
                </div>
              </div>

              {/* ============================================================== */}
              {/* PROMINENT HUMAN ACTION BAR: HOW TO APPROVE OR RESOLVE REQUEST */}
              {/* ============================================================== */}

              {/* Scenario 1: Task Needs Human Review (due to retries or error) */}
              {selectedTask.status === 'Needs Human Review' && (
                <div className="bg-rose-50 dark:bg-rose-950/40 border-2 border-rose-400 dark:border-rose-600/80 rounded-2xl p-4 shadow-xs space-y-3 animate-fadeIn">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-rose-100 dark:bg-rose-900/60 flex items-center justify-center shrink-0 text-rose-600 dark:text-rose-300">
                        <AlertCircle className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-rose-900 dark:text-rose-200">
                          Human Review Required: Task Paused Safely
                        </h4>
                        <p className="text-xs text-rose-700 dark:text-rose-300 mt-0.5 leading-relaxed">
                          A step encountered an error or exhausted its retry limit. As an authorized human operator, you can resolve this now:
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* One-Click Resolution Actions */}
                  <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-rose-200 dark:border-rose-800/80">
                    <button
                      onClick={() => onResumeTask(selectedTask.task_id, true)}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors"
                    >
                      <Check className="w-4 h-4" />
                      <span>Manually Approve & Proceed (Bypass Error)</span>
                    </button>

                    <button
                      onClick={() => onTurnOffSimulatorAndRetry(selectedTask.task_id)}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Disable Simulation & Retry Step</span>
                    </button>

                    <button
                      onClick={() => onResumeTask(selectedTask.task_id, false)}
                      className="flex items-center gap-1 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 text-xs font-medium"
                    >
                      <span>Retry Without Changes</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Scenario 2: Task Awaiting Approval (High-Risk Action Gated) */}
              {selectedTask.status === 'Awaiting Approval' && (
                <div className="bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-400 dark:border-amber-600/80 rounded-2xl p-4 shadow-xs space-y-3 animate-fadeIn">
                  <div className="flex items-start gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/60 flex items-center justify-center shrink-0 text-amber-700 dark:text-amber-300">
                      <ShieldAlert className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-amber-900 dark:text-amber-200">
                        Human Sign-Off Required Before Execution
                      </h4>
                      <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5 leading-relaxed">
                        This workflow contains a High-Risk operation (such as external messaging or broadcast). Review and decide below:
                      </p>
                    </div>
                  </div>

                  {/* One-Click Approval Controls */}
                  <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-amber-200 dark:border-amber-800/80">
                    {taskApproval ? (
                      <button
                        onClick={() => onDecideApproval(taskApproval.approval_id, 'Approved', 'Approved directly from pipeline view')}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>One-Click Approve & Send</span>
                      </button>
                    ) : null}

                    <button
                      onClick={onOpenApproval}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Inspect Details in Approval Queue</span>
                    </button>

                    {taskApproval ? (
                      <button
                        onClick={() => onDecideApproval(taskApproval.approval_id, 'Rejected', 'Rejected by operator')}
                        className="flex items-center gap-1 px-3 py-2 rounded-xl border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950 text-xs font-medium"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Reject & Cancel</span>
                      </button>
                    ) : null}
                  </div>
                </div>
              )}

              {/* Progress Summary Bar */}
              <div className="bg-slate-50 dark:bg-slate-950 p-3 sm:p-4 rounded-xl border border-slate-100 dark:border-slate-800/80">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">
                  <span>Multi-Agent Execution Pipeline</span>
                  <span className="text-slate-900 dark:text-white font-bold">
                    {selectedTaskDetails?.subtasks?.filter(s => s.status === 'Completed').length || 0} of {selectedTaskDetails?.subtasks?.length || 0} Steps Complete
                  </span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${
                        selectedTaskDetails?.subtasks?.length
                          ? (selectedTaskDetails.subtasks.filter(s => s.status === 'Completed').length / selectedTaskDetails.subtasks.length) * 100
                          : 0
                      }%`
                    }}
                  />
                </div>
              </div>

              {/* Agent Subtasks Pipeline Cards */}
              <div className="space-y-3.5">
                {selectedTaskDetails?.subtasks?.map((st, index) => {
                  const agent = getAgentInfo(st.agent_role);
                  const isAwaiting = st.status === 'Awaiting Approval';
                  const isDone = st.status === 'Completed';
                  const isRunning = st.status === 'Running';
                  const isFailed = st.status === 'Failed';

                  return (
                    <div
                      key={st.subtask_id}
                      className={`rounded-2xl border p-4 sm:p-5 transition-all ${
                        isAwaiting
                          ? 'border-amber-300 dark:border-amber-600/80 bg-amber-50/20 dark:bg-amber-950/20 ring-1 ring-amber-300'
                          : isRunning
                          ? 'border-blue-300 dark:border-blue-700 bg-blue-50/20 dark:bg-blue-950/20'
                          : isDone
                          ? 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
                          : isFailed
                          ? 'border-rose-300 dark:border-rose-800 bg-rose-50/30 dark:bg-rose-950/30'
                          : 'border-slate-200/70 dark:border-slate-800/60 bg-slate-50/40 dark:bg-slate-950/30 opacity-70'
                      }`}
                    >
                      <div className="flex flex-wrap sm:flex-nowrap items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${agent.bg}`}>
                            {agent.icon}
                          </div>
                          <div>
                            <div className="flex flex-wrap items-center gap-1.5 mb-1">
                              <span className="text-xs font-bold text-slate-900 dark:text-white">
                                Step {index + 1}: {agent.title}
                              </span>
                              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                                st.risk_level === 'High'
                                  ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                              }`}>
                                {st.risk_level} Risk
                              </span>
                            </div>
                            <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                              {st.description}
                            </p>
                          </div>
                        </div>

                        {/* Status Pills and Quick Action */}
                        <div className="shrink-0 flex items-center gap-2">
                          {isDone && (
                            <div className="flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Verified</span>
                            </div>
                          )}
                          {isAwaiting && (
                            <button
                              onClick={onOpenApproval}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs animate-pulse"
                            >
                              <ShieldAlert className="w-3.5 h-3.5" />
                              <span>Sign-off</span>
                            </button>
                          )}
                          {isRunning && (
                            <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 px-2.5 py-1 rounded-full border border-blue-200 dark:border-blue-800">
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              <span>Running</span>
                            </div>
                          )}
                          {isFailed && (
                            <div className="flex items-center gap-1 text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 px-2.5 py-1 rounded-full border border-rose-200 dark:border-rose-800">
                              <AlertCircle className="w-3.5 h-3.5" />
                              <span>Failed (Human Review Needed)</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Subtask Output / Error Message Display */}
                      {st.output_summary && (
                        <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-950/80 border border-slate-200/80 dark:border-slate-800 rounded-xl text-xs text-slate-700 dark:text-slate-300">
                          {st.output_summary.includes('Exhausted') ? (
                            <div className="space-y-2">
                              <div className="flex items-center gap-1.5 font-semibold text-rose-700 dark:text-rose-400">
                                <AlertCircle className="w-4 h-4" />
                                <span>{st.output_summary}</span>
                              </div>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                Note: This occurred because failure simulation mode is enabled. Use the action buttons at the top of the workflow to bypass or retry.
                              </p>
                            </div>
                          ) : (
                            st.output_summary
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center text-slate-400 dark:text-slate-500">
              <Cpu className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">No Task Selected</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                Select a task from the list on the left to inspect its autonomous multi-agent pipeline and results.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
