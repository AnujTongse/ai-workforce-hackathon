import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import TaskInputForm from './components/TaskInputForm';
import TaskPipelineView from './components/TaskPipelineView';
import ApprovalQueueView from './components/ApprovalQueueView';
import LeadsDatabaseView from './components/LeadsDatabaseView';
import AuditTrailView from './components/AuditTrailView';
import QualityReportView from './components/QualityReportView';
import SettingsView from './components/SettingsView';
import { api } from './api';

export default function App() {
  const getInitialTab = () => {
    try {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get('tab');
      if (['studio', 'approvals', 'database', 'audit', 'quality', 'settings'].includes(tab)) {
        return tab;
      }
    } catch {}
    return 'studio';
  };

  const [activeTab, setActiveTabState] = useState(getInitialTab);
  const [userRole, setUserRole] = useState('business_owner');

  const setActiveTab = (tabId) => {
    setActiveTabState(tabId);
    try {
      const url = new URL(window.location);
      url.searchParams.set('tab', tabId);
      window.history.pushState({}, '', url);
    } catch {}
  };

  const [health, setHealth] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [selectedTaskDetails, setSelectedTaskDetails] = useState(null);
  const [approvals, setApprovals] = useState([]);
  const [leads, setLeads] = useState([]);
  const [logs, setLogs] = useState([]);
  const [settings, setSettings] = useState({});

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg, type = 'info') => {
    setToastMessage({ msg, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Fetch full system state
  const loadData = useCallback(async (keepSelected = true) => {
    try {
      const [hData, tData, aData, lData, logsData, sData] = await Promise.all([
        api.getHealth(),
        api.getTasks(),
        api.getApprovals(),
        api.getLeads(),
        api.getLogs(),
        api.getSettings(),
      ]);

      setHealth(hData);
      setTasks(tData);
      setApprovals(aData);
      setLeads(lData);
      setLogs(logsData);
      setSettings(sData);

      // Maintain or default selected task
      if (tData.length > 0) {
        let currentId = keepSelected && selectedTask ? selectedTask.task_id : tData[0].task_id;
        const found = tData.find((t) => t.task_id === currentId) || tData[0];
        setSelectedTask(found);

        // Fetch details
        const details = await api.getTaskDetails(found.task_id);
        setSelectedTaskDetails(details);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    }
  }, [selectedTask]);

  // Initial load
  useEffect(() => {
    loadData(false);
  }, []);

  // Real-time polling every 2.5 seconds (NFR-11)
  useEffect(() => {
    const timer = setInterval(() => {
      loadData(true);
    }, 2500);
    return () => clearInterval(timer);
  }, [loadData]);

  // Select a task to view details
  const handleSelectTask = async (taskId) => {
    const found = tasks.find((t) => t.task_id === taskId);
    if (found) {
      setSelectedTask(found);
      try {
        const details = await api.getTaskDetails(taskId);
        setSelectedTaskDetails(details);
      } catch (e) {
        console.error(e);
      }
    }
  };

  // Submit business task
  const handleSubmitTask = async (text, autoExecute) => {
    setIsSubmitting(true);
    try {
      const res = await api.submitTask(text, autoExecute, userRole === 'business_owner' ? 'u_owner' : 'u_admin');
      showToast(`Task ${res.task_id} launched. Decomposed into ${res.subtasks_count} subtasks.`, 'success');
      await loadData(false);
    } catch (err) {
      showToast(`Submission error: ${err.message}`, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Dispatch planned task
  const handleExecutePlan = async (taskId) => {
    try {
      await api.executeTaskPlan(taskId);
      showToast(`Plan approved. Multi-agent execution running for ${taskId}.`, 'success');
      await loadData(true);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Cancel task
  const handleCancelTask = async (taskId) => {
    if (!window.confirm('Are you sure you want to halt this running workflow?')) return;
    try {
      await api.cancelTask(taskId);
      showToast(`Task ${taskId} cancelled safely.`, 'info');
      await loadData(true);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Approval decision
  const handleDecideApproval = async (approvalId, decision, comments, reviewerName, editedPayload) => {
    try {
      await api.decideApproval(approvalId, decision, comments, reviewerName, editedPayload);
      showToast(`Decision recorded: ${decision}. Pipeline updated.`, 'success');
      await loadData(true);
    } catch (err) {
      showToast(`Approval failed: ${err.message}`, 'error');
    }
  };

  // Add lead
  const handleAddLead = async (leadData) => {
    try {
      await api.createLead(leadData);
      showToast('Lead record saved to database.', 'success');
      await loadData(true);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Settings update
  const handleUpdateSettings = async (newSettings) => {
    await api.updateSettings(newSettings);
    showToast('System configuration updated.', 'success');
    await loadData(true);
  };

  // Reset demo
  const handleResetDemo = async () => {
    if (!window.confirm('Reset database to clean demo state?')) return;
    try {
      await api.resetDemo();
      showToast('Demo dataset reset successfully.', 'info');
      await loadData(false);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Simulate failure
  const handleSimulateFailure = async (mode) => {
    await api.simulateFailure(mode);
    showToast(`Simulation mode changed to: ${mode}`, 'info');
    await loadData(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        health={health}
        onResetDemo={handleResetDemo}
        userRole={userRole}
        setUserRole={setUserRole}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 animate-bounce">
          <div className={`px-4 py-2.5 rounded-lg shadow-lg text-xs font-semibold flex items-center gap-2 ${
            toastMessage.type === 'error'
              ? 'bg-rose-600 text-white'
              : toastMessage.type === 'success'
              ? 'bg-emerald-600 text-white'
              : 'bg-slate-900 text-white'
          }`}>
            <span>{toastMessage.msg}</span>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'studio' && (
          <div className="space-y-6">
            <TaskInputForm
              onSubmitTask={handleSubmitTask}
              isSubmitting={isSubmitting}
            />

            <TaskPipelineView
              tasks={tasks}
              selectedTask={selectedTask}
              selectedTaskDetails={selectedTaskDetails}
              onSelectTask={handleSelectTask}
              onExecutePlan={handleExecutePlan}
              onCancelTask={handleCancelTask}
              onOpenApproval={() => setActiveTab('approvals')}
              onRefreshDetails={handleSelectTask}
            />
          </div>
        )}

        {activeTab === 'approvals' && (
          <ApprovalQueueView
            approvals={approvals}
            onDecideApproval={handleDecideApproval}
            userRole={userRole}
          />
        )}

        {activeTab === 'database' && (
          <LeadsDatabaseView
            leads={leads}
            onAddLead={handleAddLead}
          />
        )}

        {activeTab === 'audit' && (
          <AuditTrailView
            logs={logs}
          />
        )}

        {activeTab === 'quality' && (
          <QualityReportView
            tasks={tasks}
            onSimulateFailure={handleSimulateFailure}
            failureMode={health?.failure_simulation_mode || 'off'}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsView
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
          />
        )}
      </main>

      {/* Minimal Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-wrap items-center justify-between gap-2">
          <span>AI Workforce for Businesses • Autonomous Multi-Agent Orchestration MVP</span>
          <span className="text-[11px] text-slate-400">
            SRS v1.0 • Built with Python FastAPI, SQLite, React & Tailwind CSS
          </span>
        </div>
      </footer>
    </div>
  );
}
