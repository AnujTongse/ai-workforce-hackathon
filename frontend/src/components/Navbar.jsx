import React from 'react';
import { 
  Bot, ShieldCheck, Database, FileText, CheckCircle2, 
  Settings, RefreshCw, AlertTriangle, UserCheck, Sun, Moon, X
} from 'lucide-react';

export default function Navbar({ 
  activeTab, setActiveTab, health, onResetDemo, 
  userRole, setUserRole, theme, onToggleTheme, onDisableSimulation 
}) {
  const tabs = [
    { id: 'studio', label: 'Workforce Studio', icon: Bot, badge: null },
    { 
      id: 'approvals', 
      label: 'Approval Queue', 
      icon: ShieldCheck, 
      badge: health?.pending_approvals > 0 ? health.pending_approvals : null,
      badgeColor: 'bg-amber-500 text-white animate-pulse'
    },
    { id: 'database', label: 'CRM & Records', icon: Database, badge: health?.total_leads || null },
    { id: 'audit', label: 'Audit Trail', icon: FileText, badge: null },
    { id: 'quality', label: 'Quality & Verification', icon: CheckCircle2, badge: null },
    { id: 'settings', label: 'System Policy', icon: Settings, badge: null },
  ];

  return (
    <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30 shadow-xs transition-colors">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between min-h-16 py-2 gap-2">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-slate-900 dark:bg-slate-800 flex items-center justify-center text-white shadow-xs ring-1 ring-slate-800 dark:ring-slate-700 shrink-0">
              <Bot className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 dark:text-slate-100 text-base sm:text-lg tracking-tight">AI Workforce</span>
                <span className="text-[10px] font-semibold tracking-wide uppercase px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                  MVP v1.0
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block">Autonomous Multi-Agent Business Operations</p>
            </div>
          </div>

          {/* Right Controls: Role, Simulator, Theme, Reset */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {health && health.failure_simulation_mode && health.failure_simulation_mode !== 'off' && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-50 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700 animate-pulse">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span className="hidden md:inline">Simulating:</span>
                <span>{health.failure_simulation_mode}</span>
                <button
                  onClick={onDisableSimulation}
                  title="Turn off failure simulation mode"
                  className="ml-1 p-0.5 rounded hover:bg-amber-200/60 dark:hover:bg-amber-800/60 text-amber-900 dark:text-amber-100 flex items-center"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}

            {/* Role indicator */}
            <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/80 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs">
              <UserCheck className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 hidden sm:block" />
              <select 
                value={userRole} 
                onChange={(e) => setUserRole(e.target.value)}
                className="bg-transparent font-medium text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer text-xs"
              >
                <option value="business_owner" className="dark:bg-slate-900">Owner (Alex Chen)</option>
                <option value="reviewer" className="dark:bg-slate-900">Reviewer (Elena Rostova)</option>
                <option value="admin" className="dark:bg-slate-900">Admin (Sarah Vance)</option>
              </select>
            </div>

            {/* Dark Mode Toggle */}
            <button
              onClick={onToggleTheme}
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              className="p-1.5 sm:p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-slate-600" />
              )}
            </button>

            {/* Reset Demo button */}
            <button
              onClick={onResetDemo}
              title="Reset sandbox database with fresh sample data"
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <nav className="flex space-x-1 -mb-px overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 sm:gap-2 px-3 py-2 border-b-2 text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap ${
                  isActive
                    ? 'border-indigo-600 dark:border-indigo-400 text-indigo-600 dark:text-indigo-400'
                    : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'}`} />
                <span>{tab.label}</span>
                {tab.badge !== null && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    tab.badgeColor || 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
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
