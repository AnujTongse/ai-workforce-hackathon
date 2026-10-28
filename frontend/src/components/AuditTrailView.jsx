import React, { useState } from 'react';
import { FileText, Search, Download, ShieldCheck, CheckCircle2, AlertTriangle, XCircle, Clock } from 'lucide-react';

export default function AuditTrailView({ logs }) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const filteredLogs = logs.filter(l => {
    if (statusFilter !== 'All' && l.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        l.log_id.toLowerCase().includes(q) ||
        l.task_id.toLowerCase().includes(q) ||
        l.action_type.toLowerCase().includes(q) ||
        l.result_summary.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const exportAuditLog = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(logs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `ai_workforce_audit_${new Date().toISOString().slice(0,10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs flex flex-wrap items-center justify-between gap-4 transition-colors">
        <div>
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              Immutable Action Audit Trail
            </h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
              {logs.length} Recorded Events
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
            SRS FR-25 & AC-06: Chronological record of task plans, tool calls, approval decisions, transient retries, and verification results.
          </p>
        </div>

        <button
          onClick={exportAuditLog}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-medium shadow-xs"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export Audit Log (JSON)</span>
        </button>
      </div>

      {/* Filter and search bar */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs flex flex-wrap items-center justify-between gap-3 transition-colors">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            placeholder="Search by action, task ID, log ID, or details..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs border-0 focus:ring-0 text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 bg-transparent focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-1">
          {['All', 'Executed (Real)', 'Simulated (Sandbox)', 'Pending Approval', 'Rejected', 'Failed'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                statusFilter === status
                  ? 'bg-slate-900 dark:bg-indigo-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs transition-colors">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
            <tr>
              <th className="px-4 py-3">Timestamp</th>
              <th className="px-4 py-3">Log ID</th>
              <th className="px-4 py-3">Task ID</th>
              <th className="px-4 py-3">Action Type</th>
              <th className="px-4 py-3">Target</th>
              <th className="px-4 py-3">Execution Status</th>
              <th className="px-4 py-3">Outcome Summary</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {filteredLogs.length === 0 ? (
              <tr>
                <td colSpan="7" className="text-center py-10 text-slate-400 dark:text-slate-500">
                  No log entries found.
                </td>
              </tr>
            ) : (
              filteredLogs.map((l) => (
                <tr key={l.log_id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400 font-mono text-[11px] whitespace-nowrap">
                    {new Date(l.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </td>
                  <td className="px-4 py-3 font-mono text-slate-600 dark:text-slate-400 text-[11px]">{l.log_id}</td>
                  <td className="px-4 py-3 font-mono text-slate-600 dark:text-slate-400 text-[11px]">{l.task_id}</td>
                  <td className="px-4 py-3 font-semibold text-slate-900 dark:text-slate-100">{l.action_type}</td>
                  <td className="px-4 py-3 font-mono text-slate-600 dark:text-slate-400 text-[11px]">{l.target}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-semibold text-[11px] ${
                      l.status === 'Executed (Real)'
                        ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                        : l.status === 'Simulated (Sandbox)'
                        ? 'bg-sky-100 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300'
                        : l.status === 'Pending Approval'
                        ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
                        : 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300'
                    }`}>
                      {l.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-700 dark:text-slate-300 max-w-sm leading-relaxed">
                    {l.result_summary}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
