const BASE_URL = '/api';

export const api = {
  getHealth: async () => {
    const res = await fetch(`${BASE_URL}/health`);
    if (!res.ok) throw new Error('Health check failed');
    return res.json();
  },

  getTasks: async (filters = {}) => {
    const query = new URLSearchParams();
    if (filters.status) query.append('status', filters.status);
    if (filters.risk) query.append('risk', filters.risk);
    if (filters.search) query.append('search', filters.search);
    const res = await fetch(`${BASE_URL}/tasks?${query.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch tasks');
    return res.json();
  },

  getTaskDetails: async (taskId) => {
    const res = await fetch(`${BASE_URL}/tasks/${taskId}`);
    if (!res.ok) throw new Error('Failed to fetch task details');
    return res.json();
  },

  submitTask: async (requestText, autoExecute = true, requesterId = 'u_owner') => {
    const res = await fetch(`${BASE_URL}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ request_text: requestText, auto_execute: autoExecute, requester_id: requesterId }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Failed to submit task');
    }
    return res.json();
  },

  executeTaskPlan: async (taskId) => {
    const res = await fetch(`${BASE_URL}/tasks/${taskId}/execute`, { method: 'POST' });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Failed to execute plan');
    }
    return res.json();
  },

  cancelTask: async (taskId) => {
    const res = await fetch(`${BASE_URL}/tasks/${taskId}/cancel`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to cancel task');
    return res.json();
  },

  getApprovals: async (pendingOnly = false) => {
    const res = await fetch(`${BASE_URL}/approvals?pending_only=${pendingOnly}`);
    if (!res.ok) throw new Error('Failed to fetch approvals');
    return res.json();
  },

  decideApproval: async (approvalId, decision, comments = '', reviewerName = 'Compliance Officer', editedPayload = null) => {
    const res = await fetch(`${BASE_URL}/approvals/${approvalId}/decision`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        approval_id: approvalId,
        decision,
        comments,
        reviewer_name: reviewerName,
        edited_payload: editedPayload,
      }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Failed to record approval decision');
    }
    return res.json();
  },

  getLeads: async () => {
    const res = await fetch(`${BASE_URL}/leads`);
    if (!res.ok) throw new Error('Failed to fetch leads');
    return res.json();
  },

  createLead: async (leadData) => {
    const res = await fetch(`${BASE_URL}/leads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(leadData),
    });
    if (!res.ok) throw new Error('Failed to create lead');
    return res.json();
  },

  getLogs: async (filters = {}) => {
    const query = new URLSearchParams();
    if (filters.taskId) query.append('task_id', filters.taskId);
    if (filters.status) query.append('status', filters.status);
    if (filters.limit) query.append('limit', filters.limit);
    const res = await fetch(`${BASE_URL}/logs?${query.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch audit logs');
    return res.json();
  },

  getSettings: async () => {
    const res = await fetch(`${BASE_URL}/settings`);
    if (!res.ok) throw new Error('Failed to fetch settings');
    return res.json();
  },

  updateSettings: async (settings) => {
    const res = await fetch(`${BASE_URL}/settings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ settings }),
    });
    if (!res.ok) throw new Error('Failed to update settings');
    return res.json();
  },

  resetDemo: async () => {
    const res = await fetch(`${BASE_URL}/demo/reset`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to reset demo data');
    return res.json();
  },

  simulateFailure: async (mode) => {
    const res = await fetch(`${BASE_URL}/demo/simulate-failure`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode }),
    });
    if (!res.ok) throw new Error('Failed to set failure simulation mode');
    return res.json();
  },
};
