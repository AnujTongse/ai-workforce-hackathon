import React, { useState } from 'react';
import { Sparkles, ArrowRight, Shield, Zap, Bot, ChevronUp, ChevronDown } from 'lucide-react';

const PRESET_TEMPLATES = [
  {
    id: 'leads',
    icon: '🎯',
    title: 'Lead Ingestion & Follow-up',
    tag: 'Sales & CRM',
    desc: 'Verify new prospects, save records into CRM, and draft personalized outreach.',
    prompt: 'Process newly received business leads for Apex Global Solutions, save verified records in CRM, and prepare personalized follow-up emails.'
  },
  {
    id: 'invoice',
    icon: '📑',
    title: 'Vendor Invoice Audit',
    tag: 'Finance',
    desc: 'Reconcile invoice line items against purchase orders and prepare payment sign-off.',
    prompt: 'Reconcile quarterly vendor invoice from CloudScale Infrastructure, verify purchase order match, and draft payment release notice.'
  },
  {
    id: 'onboarding',
    icon: '🤝',
    title: 'Client Onboarding',
    tag: 'Operations',
    desc: 'Validate organization credentials, create database records, and alert stakeholders.',
    prompt: 'Onboard new technology partner Nexus Enterprises, ingest verified contact details into database, and notify the operations team.'
  }
];

export default function TaskInputForm({ onSubmitTask, isSubmitting }) {
  const [requestText, setRequestText] = useState('');
  const [autoExecute, setAutoExecute] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!requestText.trim() || isSubmitting) return;
    onSubmitTask(requestText.trim(), autoExecute);
    setRequestText('');
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-4 sm:p-5 transition-colors">
      {/* Top Banner with Collapse Button */}
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-indigo-500" />
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Submit Business Task
          </h2>
          <span className="hidden sm:inline-flex text-[11px] font-medium text-slate-500 dark:text-slate-400">
            • Autonomous Multi-Agent Orchestration
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Multi-Agent status chips (compact) */}
          <div className="hidden md:flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full text-[11px] font-medium text-slate-600 dark:text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>4 Agents Active</span>
          </div>

          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="flex items-center gap-1 text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white px-2 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <span>{isCollapsed ? 'Expand Prompt Form' : 'Minimize'}</span>
            {isCollapsed ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {!isCollapsed && (
        <div className="space-y-3.5 animate-fadeIn">
          {/* Main Prompt Input Box */}
          <form onSubmit={handleSubmit}>
            <div className="relative rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-950 p-3 focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-all">
              <textarea
                rows={2}
                value={requestText}
                onChange={(e) => setRequestText(e.target.value)}
                placeholder="Describe your goal in plain English (e.g. 'Process new sales leads, verify CRM details, and draft outreach emails')..."
                className="w-full text-xs sm:text-sm border-0 focus:ring-0 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 bg-transparent resize-none leading-relaxed focus:outline-none"
                maxLength={2000}
                required
              />
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-200/60 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-1.5 cursor-pointer text-xs font-medium text-slate-600 dark:text-slate-300 select-none">
                    <input
                      type="checkbox"
                      checked={autoExecute}
                      onChange={(e) => setAutoExecute(e.target.checked)}
                      className="w-3.5 h-3.5 rounded text-indigo-600 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-indigo-500"
                    />
                    <span>Auto-execute safe steps</span>
                  </label>
                  <span className="text-slate-300 dark:text-slate-700">|</span>
                  <div className="hidden sm:flex items-center gap-1 text-[11px] text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-800">
                    <Shield className="w-3 h-3" />
                    <span>High-risk requires sign-off</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-400 font-mono">
                    {requestText.length}/2000
                  </span>
                  <button
                    type="submit"
                    disabled={!requestText.trim() || isSubmitting}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white text-xs font-semibold shadow-xs transition-colors"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Launching...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Run AI Workforce</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </form>

          {/* Quick Start Examples (Compact & Responsive) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {PRESET_TEMPLATES.map((tmpl) => (
              <button
                key={tmpl.id}
                type="button"
                onClick={() => setRequestText(tmpl.prompt)}
                className="text-left p-2.5 sm:p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-950/40 hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-white dark:hover:bg-slate-900 transition-all group"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 flex items-center gap-1.5">
                    <span>{tmpl.icon}</span>
                    <span>{tmpl.title}</span>
                  </span>
                  <ArrowRight className="w-3 h-3 text-slate-400 group-hover:text-indigo-500 transition-transform group-hover:translate-x-0.5" />
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                  {tmpl.desc}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
