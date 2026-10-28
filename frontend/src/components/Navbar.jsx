import React from 'react';
import { 
  Bot, ShieldCheck, Database, FileText, CheckCircle2, 
  Settings, RefreshCw, AlertTriangle, UserCheck
} from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, health, onResetDemo, userRole, setUserRole }) {
  const tabs = [
    { id: 'studio', label: 'Workforce Studio', icon: Bot, badge: null },
    { 
      id: 'approvals', 
      label: 'Approval Queue', 
      icon: ShieldCheck, 
      badge: health?.pending_approvals > 0 ? health.pending_approvals : null,
      badgeColor: 'bg-amber-500 text-white'
    },
    { id: 'database', label: 'CRM & Records', icon: Database, badge: health?.total_leads || null },
    { id: 'audit', label: 'Audit Trail', icon: FileText, badge: null },
    { id: 'quality', label: 'Quality & Verification', icon: CheckCircle2, badge: null },
    { id: 'settings', label: 'System Policy', icon: Settings, badge: null },
  ];

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-sm ring-1 ring-slate-800">
              <Bot className="w-6 h-6 text-indigo-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-900 text-lg tracking-tight">AI Workforce</span>
                <span className="text-[11px] font-medium tracking-wide uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                  MVP v1.0
                </span>
              </div>
              <p className="text-xs text-slate-500">Autonomous Multi-Agent Business Operations</p>
            </div>
          </div>

          {/* Role Switcher & System Status */}
          <div className="flex items-center gap-3">
            {health && health.failure_simulation_mode && health.failure_simulation_mode !== 'off' && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200 animate-pulse">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                <span>Simulating: {health.failure_simulation_mode}</span>
              </div>
            )}

            {/* Role indicator */}
            <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 text-xs">
              <UserCheck className="w-4 h-4 text-slate-500" />
              <span className="text-slate-500">Active Role:</span>
              <select 
                value={userRole} 
                onChange={(e) => setUserRole(e.target.value)}
                className="bg-transparent font-medium text-slate-800 focus:outline-none cursor-pointer"
              >
                <option value="business_owner">Business Owner (Alex Chen)</option>
                <option value="reviewer">Reviewer / Compliance (Elena Rostova)</option>
                <option value="admin">System Admin (Sarah Vance)</option>
              </select>
            </div>

            {/* Reset Demo button */}
            <button
              onClick={onResetDemo}
              title="Reset sandbox database with fresh sample data"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset Demo</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <nav className="flex space-x-1 -mb-px overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2.5 border-b-2 text-sm font-medium transition-colors whitespace-nowrap ${
                  isActive
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
                {tab.badge !== null && (
                  <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
                    tab.badgeColor || 'bg-slate-100 text-slate-600'
                  }`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
