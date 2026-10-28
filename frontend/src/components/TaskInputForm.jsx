import React, { useState } from 'react';
import { Send, Sparkles, Layers, Shield, FileCheck, ArrowRight, HelpCircle } from 'lucide-react';

const PRESET_TEMPLATES = [
  {
    id: 'leads',
    title: 'Lead Ingestion & Outreach',
    desc: 'Extract qualified leads, insert into CRM, draft tailored email, pause for approval before sending.',
    prompt: 'Process newly received business leads for Apex Global Solutions, save verified records in CRM, and prepare personalized follow-up emails.'
  },
  {
    id: 'invoice',
    title: 'Vendor Invoice Reconciliation',
    desc: 'Audit vendor invoices against purchase orders, flag discrepancies, and draft payment approval.',
    prompt: 'Reconcile quarterly vendor invoice from CloudScale Infrastructure, verify purchase order match, and draft payment release notice.'
  },
  {
    id: 'onboarding',
    title: 'Partner Onboarding & Database Sync',
    desc: 'Validate organization credentials, update database records, and issue stakeholder notifications.',
    prompt: 'Onboard new technology partner Nexus Enterprises, ingest verified contact details into database, and notify the operations team.'
  }
];

export default function TaskInputForm({ onSubmitTask, isSubmitting }) {
  const [requestText, setRequestText] = useState('');
  const [autoExecute, setAutoExecute] = useState(true);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!requestText.trim() || isSubmitting) return;
    onSubmitTask(requestText.trim(), autoExecute);
    setRequestText('');
  };

  const applyTemplate = (prompt) => {
    setRequestText(prompt);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-500" />
            <span>Submit Business Task</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Describe what you need in plain English. The Orchestrator will plan, delegate to specialized agents, and gate high-risk actions.
          </p>
        </div>

        {/* Multi-Agent team preview badges */}
        <div className="hidden sm:flex items-center gap-2">
          <span className="text-[11px] text-slate-400 font-medium">Assigned AI Agents:</span>
          <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-purple-50 text-purple-700 border border-purple-200">
            Planner
          </span>
          <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200">
            Data/CRM
          </span>
          <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
            Follow-up
          </span>
          <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            Quality Checker
          </span>
        </div>
      </div>

      {/* Preset template cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        {PRESET_TEMPLATES.map((tmpl) => (
          <button
            key={tmpl.id}
            type="button"
            onClick={() => applyTemplate(tmpl.prompt)}
            className="text-left p-3 rounded-lg border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/30 transition-all group"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-slate-800 group-hover:text-indigo-600">
                {tmpl.title}
              </span>
              <ArrowRight className="w-3 h-3 text-slate-400 group-hover:text-indigo-500 transition-transform group-hover:translate-x-0.5" />
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed line-clamp-2">
              {tmpl.desc}
            </p>
          </button>
        ))}
      </div>

      {/* Main input form */}
      <form onSubmit={handleSubmit}>
        <div className="relative">
          <textarea
            rows={3}
            value={requestText}
            onChange={(e) => setRequestText(e.target.value)}
            placeholder="e.g., Process new qualified leads, insert valid records into the database, and draft welcome follow-up emails..."
            className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm text-slate-900 placeholder-slate-400 transition-all resize-none"
            maxLength={2000}
            required
          />
          <div className="absolute right-3 bottom-3 text-[11px] text-slate-400">
            {requestText.length}/2000
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 mt-3 pt-3 border-t border-slate-100">
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-600 select-none">
              <input
                type="checkbox"
                checked={autoExecute}
                onChange={(e) => setAutoExecute(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500"
              />
              <span>Auto-execute safe tasks immediately</span>
            </label>
            <span className="text-slate-300">|</span>
            <div className="flex items-center gap-1 text-[11px] text-slate-500">
              <Shield className="w-3.5 h-3.5 text-amber-500" />
              <span>High-risk actions always require human sign-off</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={!requestText.trim() || isSubmitting}
            className="flex items-center gap-2 px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold shadow-xs transition-colors"
          >
            {isSubmitting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Orchestrating...</span>
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                <span>Launch AI Workforce</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
