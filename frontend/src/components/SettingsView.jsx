import React, { useState, useEffect } from 'react';
import { Settings, Save, Shield, RefreshCw, Cpu, Server, CheckCircle2 } from 'lucide-react';

export default function SettingsView({ settings, onUpdateSettings }) {
  const [formData, setFormData] = useState({
    max_retries: '3',
    retry_backoff_seconds: '1.0',
    require_plan_review: 'false',
    simulate_bulk_email: 'true',
    auto_approve_medium_risk: 'true'
  });
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (settings) {
      setFormData({
        max_retries: settings.max_retries || '3',
        retry_backoff_seconds: settings.retry_backoff_seconds || '1.0',
        require_plan_review: settings.require_plan_review || 'false',
        simulate_bulk_email: settings.simulate_bulk_email || 'true',
        auto_approve_medium_risk: settings.auto_approve_medium_risk || 'true'
      });
    }
  }, [settings]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onUpdateSettings(formData);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      alert(`Error updating settings: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-semibold text-slate-900">
              System Policy & Orchestration Parameters
            </h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-slate-100 text-slate-800">
              SRS FR-30 Configurable
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Configure risk thresholds, retry policies, and sandbox simulation mode without modifying core orchestration code (NFR-14).
          </p>
        </div>

        {savedSuccess && (
          <div className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Settings saved successfully!</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Risk & Safety Policy */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-200">
            <Shield className="w-4 h-4 text-amber-500" />
            <h3 className="text-sm font-semibold text-slate-900">
              Security & Risk Governance
            </h3>
          </div>

          <div className="space-y-4 text-xs">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.require_plan_review === 'true'}
                onChange={(e) => setFormData({ ...formData, require_plan_review: e.target.checked ? 'true' : 'false' })}
                className="mt-0.5 w-4 h-4 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500"
              />
              <div>
                <span className="font-semibold text-slate-800 block">
                  Mandatory Plan Review Before Execution (FR-04)
                </span>
                <span className="text-slate-500">
                  When enabled, all decomposed task plans pause in 'Planned' status until a business manager clicks 'Approve & Dispatch'.
                </span>
              </div>
            </label>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.simulate_bulk_email === 'true'}
                onChange={(e) => setFormData({ ...formData, simulate_bulk_email: e.target.checked ? 'true' : 'false' })}
                className="mt-0.5 w-4 h-4 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500"
              />
              <div>
                <span className="font-semibold text-slate-800 block">
                  Sandbox Simulation Mode for High-Risk External Actions (AC-09)
                </span>
                <span className="text-slate-500">
                  Dispatches external emails to simulated sandbox mailboxes clearly tagged as 'Simulated (Sandbox)' to eliminate accidental spam.
                </span>
              </div>
            </label>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.auto_approve_medium_risk === 'true'}
                onChange={(e) => setFormData({ ...formData, auto_approve_medium_risk: e.target.checked ? 'true' : 'false' })}
                className="mt-0.5 w-4 h-4 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500"
              />
              <div>
                <span className="font-semibold text-slate-800 block">
                  Auto-Permit Medium-Risk Database Operations (FR-15)
                </span>
                <span className="text-slate-500">
                  Allows Data/CRM Agent to insert and update vetted records within approved schema without stopping the pipeline.
                </span>
              </div>
            </label>
          </div>
        </div>

        {/* Reliability & Retry Limits */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-200">
            <RefreshCw className="w-4 h-4 text-blue-500" />
            <h3 className="text-sm font-semibold text-slate-900">
              Reliability & Retry Limits (FR-21, FR-22)
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Maximum Bounded Retries:
              </label>
              <select
                value={formData.max_retries}
                onChange={(e) => setFormData({ ...formData, max_retries: e.target.value })}
                className="w-full p-2.5 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="1">1 attempt (No retries)</option>
                <option value="2">2 attempts</option>
                <option value="3">3 attempts (Recommended)</option>
                <option value="5">5 attempts</option>
              </select>
              <span className="text-[11px] text-slate-400 mt-1 block">
                Prevents runaway loops on unrecoverable external failures.
              </span>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Exponential Backoff Factor (seconds):
              </label>
              <select
                value={formData.retry_backoff_seconds}
                onChange={(e) => setFormData({ ...formData, retry_backoff_seconds: e.target.value })}
                className="w-full p-2.5 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="0.5">0.5s initial backoff</option>
                <option value="1.0">1.0s initial backoff (Standard)</option>
                <option value="2.0">2.0s initial backoff</option>
              </select>
              <span className="text-[11px] text-slate-400 mt-1 block">
                Initial pause before retrying transient exceptions.
              </span>
            </div>
          </div>
        </div>

        {/* System Deployment Architecture */}
        <div className="bg-slate-50 rounded-xl border border-slate-200 p-5 text-xs space-y-2 text-slate-600">
          <div className="flex items-center gap-2 font-semibold text-slate-800">
            <Server className="w-4 h-4 text-slate-600" />
            <span>Architecture & Environment Details</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-[11px] pt-1">
            <div>Backend: Python FastAPI</div>
            <div>Database: SQLite 3 (WAL)</div>
            <div>Frontend: React + Tailwind CSS</div>
            <div>Runtime: Node v24 + Python 3.13</div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Saving Policy...' : 'Save System Policy'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
