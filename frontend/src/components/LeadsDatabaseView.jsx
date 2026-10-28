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
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-blue-600" />
            <h2 className="text-base font-semibold text-slate-900">
              Verified Business Records (CRM)
            </h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-blue-100 text-blue-800">
              {leads.length} Records Persisted
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
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
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, email, or company..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs border-0 focus:ring-0 text-slate-800 placeholder-slate-400 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-1">
          {['All', 'High Value', 'Valid', 'Incomplete'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                statusFilter === status
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Leads Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
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
          <tbody className="divide-y divide-slate-200">
            {filteredLeads.length === 0 ? (
              <tr>
                <td colSpan="7" className="text-center py-10 text-slate-400">
                  No records match current filter.
                </td>
              </tr>
            ) : (
              filteredLeads.map((l) => (
                <tr key={l.record_id} className="hover:bg-slate-50/50">
                  <td className="px-4 py-3 font-mono text-slate-600 font-medium">{l.record_id}</td>
                  <td className="px-4 py-3">
                    <div className="font-semibold text-slate-900">{l.name}</div>
                    <div className="text-slate-500 text-[11px] font-mono">{l.contact}</div>
                  </td>
                  <td className="px-4 py-3 text-slate-700 font-medium">{l.company || '-'}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1 text-[11px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                      <Tag className="w-3 h-3 text-slate-400" />
                      <span>{l.source}</span>
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`font-semibold ${
                      l.score >= 80 ? 'text-emerald-600' : l.score >= 60 ? 'text-blue-600' : 'text-slate-600'
                    }`}>
                      {l.score}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-semibold text-[11px] ${
                      l.validation_status === 'High Value'
                        ? 'bg-purple-100 text-purple-800'
                        : l.validation_status === 'Valid'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      <CheckCircle2 className="w-3 h-3" />
                      <span>{l.validation_status}</span>
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500">
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
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-base font-semibold text-slate-900">
                Create Business Lead Record
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name:
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Jane Doe"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Contact Email:
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. jane@acme.com"
                  value={newContact}
                  onChange={(e) => setNewContact(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Organization / Company:
                </label>
                <input
                  type="text"
                  placeholder="e.g. Acme Corporation"
                  value={newCompany}
                  onChange={(e) => setNewCompany(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Lead Notes:
                </label>
                <textarea
                  rows={2}
                  placeholder="Notes about prospective requirements..."
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 border border-slate-200"
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
