import React, { useState } from 'react';
import { Database, Plus, Search, CheckCircle2, AlertCircle, ShieldCheck, Tag } from 'lucide-react';

export default function LeadsDatabaseView({ leads, onAddLead }) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [showAddModal, setShowAddModal] = useState(false);
  
  const [newName, setNewName] = useState('');
  const [newContact, setNewContact] = useState('');
  const [newCompany, setNewCompany] = useState('');
  const [newSource, setNewSource] = useState('Web Form');
  const [newNotes, setNewNotes] = useState('');

  const filteredLeads = leads.filter(l => {
    if (statusFilter !== 'All' && l.validation_status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        l.name.toLowerCase().includes(q) ||
        l.contact.toLowerCase().includes(q) ||
        (l.company && l.company.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newName.trim() || !newContact.trim()) return;
    await onAddLead({
      name: newName,
      contact: newContact,
      company: newCompany,
      source: newSource,
      notes: newNotes,
      score: 85
    });
    setNewName('');
    setNewContact('');
    setNewCompany('');
    setNewNotes('');
    setShowAddModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs flex flex-wrap items-center justify-between gap-4 transition-colors">
        <div>
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              Verified Business Records (CRM)
            </h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
              {leads.length} Records Persisted
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
            Live records managed by the Data / CRM Agent. Fulfills SRS FR-10: real SQLite database transactions with independent write verification.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Lead Record</span>
        </button>
      </div>

      {/* Filter and search bar */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs flex flex-wrap items-center justify-between gap-3 transition-colors">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            placeholder="Search by name, email, or company..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs border-0 focus:ring-0 text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 bg-transparent focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-1">
          {['All', 'High Value', 'Valid', 'Incomplete'].map((status) => (
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

      {/* Leads Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs transition-colors">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
            <tr>
              <th className="px-4 py-3">Record ID</th>
              <th className="px-4 py-3">Lead Contact</th>
              <th className="px-4 py-3">Company</th>
              <th className="px-4 py-3">Source</th>
              <th className="px-4 py-3">Score</th>
              <th className="px-4 py-3">Validation Status</th>
              <th className="px-4 py-3">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {filteredLeads.length === 0 ? (
              <tr>
                <td colSpan="7" className="text-center py-10 text-slate-400 dark:text-slate-500">
                  No records match current filter.
                </td>
              </tr>
            ) : (
              filteredLeads.map((l) => (
                <tr key={l.record_id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                  <td className="px-4 py-3 font-mono text-slate-600 dark:text-slate-400 font-medium">{l.record_id}</td>
                  <td className="px-4 py-3">
                    <div className="font-semibold text-slate-900 dark:text-slate-100">{l.name}</div>
                    <div className="text-slate-500 dark:text-slate-400 text-[11px] font-mono">{l.contact}</div>
                  </td>
                  <td className="px-4 py-3 text-slate-700 dark:text-slate-300 font-medium">{l.company || '-'}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1 text-[11px] text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                      <Tag className="w-3 h-3 text-slate-400" />
                      <span>{l.source}</span>
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`font-semibold ${
                      l.score >= 80 ? 'text-emerald-600 dark:text-emerald-400' : l.score >= 60 ? 'text-blue-600 dark:text-blue-400' : 'text-slate-600 dark:text-slate-400'
                    }`}>
                      {l.score}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-semibold text-[11px] ${
                      l.validation_status === 'High Value'
                        ? 'bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300'
                        : l.validation_status === 'Valid'
                        ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                        : 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
                    }`}>
                      <CheckCircle2 className="w-3 h-3" />
                      <span>{l.validation_status}</span>
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
                    {new Date(l.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add Lead Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                Create Business Lead Record
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Full Name:
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Jane Doe"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Contact Email:
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. jane@acme.com"
                  value={newContact}
                  onChange={(e) => setNewContact(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Organization / Company:
                </label>
                <input
                  type="text"
                  placeholder="e.g. Acme Corporation"
                  value={newCompany}
                  onChange={(e) => setNewCompany(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Lead Notes:
                </label>
                <textarea
                  rows={2}
                  placeholder="Notes about prospective requirements..."
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-xs"
                >
                  Save Lead
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
