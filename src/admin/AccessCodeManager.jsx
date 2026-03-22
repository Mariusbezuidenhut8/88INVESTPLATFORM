/**
 * AccessCodeManager.jsx
 * Admin panel for managing advisor access codes.
 * Only visible to users who logged in with an is_admin code.
 * Reads/writes to Supabase advisor_codes table — zero client data involved.
 */

import { useState, useEffect, useCallback } from 'react';
import { fetchAllCodes, createCode, toggleCode, deleteCode } from '../lib/supabase.js';

function uid6() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' });
}

function isExpired(expires_at) {
  if (!expires_at) return false;
  return new Date(expires_at) < new Date();
}

// ── New code form ─────────────────────────────────────────────────────────────
function NewCodeForm({ onCreated, onCancel }) {
  const [advisorName, setAdvisorName] = useState('');
  const [code,        setCode]        = useState(uid6());
  const [isAdmin,     setIsAdmin]     = useState(false);
  const [expiresAt,   setExpiresAt]   = useState('');
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!advisorName.trim()) { setError('Advisor name is required'); return; }
    if (!code.trim())        { setError('Code is required'); return; }
    setLoading(true);
    setError('');
    try {
      const created = await createCode({
        code,
        advisor_name: advisorName.trim(),
        is_admin: isAdmin,
        expires_at: expiresAt || null,
      });
      onCreated(created);
    } catch (err) {
      setError(err.message?.includes('duplicate') ? 'That code already exists — choose a different one.' : `Error: ${err.message}`);
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-800">New Advisor Code</h3>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Advisor Name <span className="text-red-400">*</span>
            </label>
            <input
              value={advisorName}
              onChange={e => setAdvisorName(e.target.value)}
              placeholder="e.g. Jane Smith"
              className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Access Code <span className="text-red-400">*</span>
            </label>
            <div className="flex gap-2">
              <input
                value={code}
                onChange={e => setCode(e.target.value.toUpperCase())}
                placeholder="e.g. ADV001"
                className="flex-1 text-sm border border-gray-200 rounded-xl px-3 py-2.5 font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-400 uppercase"
              />
              <button
                type="button"
                onClick={() => setCode(uid6())}
                className="text-xs text-gray-500 border border-gray-200 rounded-xl px-3 hover:bg-gray-50 transition-colors"
              >
                Generate
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-1">Share this code with the advisor — they enter it on the login screen.</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Expiry Date (optional)</label>
            <input
              type="date"
              value={expiresAt}
              onChange={e => setExpiresAt(e.target.value)}
              className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <p className="text-xs text-gray-400 mt-1">Leave blank for no expiry.</p>
          </div>

          <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
            <input
              type="checkbox"
              id="isAdmin"
              checked={isAdmin}
              onChange={e => setIsAdmin(e.target.checked)}
              className="rounded"
            />
            <label htmlFor="isAdmin" className="text-xs text-amber-800 font-medium cursor-pointer">
              Admin access — can manage advisor codes and app settings
            </label>
          </div>

          {error && (
            <p className="text-xs text-red-500 bg-red-50 rounded-xl px-3 py-2">{error}</p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="text-sm text-gray-500 border border-gray-200 px-4 py-2 rounded-xl hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="text-sm bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2 rounded-xl transition-colors disabled:opacity-50"
            >
              {loading ? 'Creating…' : 'Create Code'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Code row ──────────────────────────────────────────────────────────────────
function CodeRow({ row, onToggle, onDelete }) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const expired = isExpired(row.expires_at);
  const status  = !row.active ? 'inactive' : expired ? 'expired' : 'active';

  return (
    <tr className="border-b border-gray-100 hover:bg-gray-50/50">
      <td className="py-3 px-4">
        <span className="font-mono text-sm font-bold text-gray-800 tracking-widest">{row.code}</span>
      </td>
      <td className="py-3 px-4 text-sm text-gray-700">{row.advisor_name}</td>
      <td className="py-3 px-4">
        {row.is_admin
          ? <span className="text-xs bg-amber-100 text-amber-700 font-semibold px-2 py-0.5 rounded-full">Admin</span>
          : <span className="text-xs bg-blue-50 text-blue-600 font-medium px-2 py-0.5 rounded-full">Advisor</span>
        }
      </td>
      <td className="py-3 px-4">
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
          status === 'active'   ? 'bg-green-100 text-green-700' :
          status === 'expired'  ? 'bg-orange-100 text-orange-700' :
                                  'bg-gray-100 text-gray-500'
        }`}>
          {status === 'active' ? 'Active' : status === 'expired' ? 'Expired' : 'Inactive'}
        </span>
      </td>
      <td className="py-3 px-4 text-xs text-gray-500">{formatDate(row.expires_at)}</td>
      <td className="py-3 px-4 text-xs text-gray-400">{formatDate(row.created_at)}</td>
      <td className="py-3 px-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onToggle(row.id, !row.active)}
            className={`text-xs px-2.5 py-1 rounded-lg border transition-colors ${
              row.active
                ? 'border-orange-200 text-orange-600 hover:bg-orange-50'
                : 'border-green-200 text-green-600 hover:bg-green-50'
            }`}
          >
            {row.active ? 'Deactivate' : 'Activate'}
          </button>
          {confirmDelete ? (
            <div className="flex gap-1">
              <button
                onClick={() => onDelete(row.id)}
                className="text-xs px-2 py-1 rounded-lg bg-red-600 text-white hover:bg-red-700"
              >
                Confirm
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="text-xs px-2 py-1 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              className="text-xs px-2.5 py-1 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition-colors"
            >
              Delete
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}

// ── MAIN COMPONENT ────────────────────────────────────────────────────────────
export default function AccessCodeManager({ onClose }) {
  const [codes,      setCodes]      = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');
  const [showForm,   setShowForm]   = useState(false);
  const [filter,     setFilter]     = useState('all'); // all | active | inactive

  const loadCodes = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchAllCodes();
      setCodes(data);
    } catch (err) {
      setError('Failed to load codes. Check your connection.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadCodes(); }, [loadCodes]);

  const handleCreated = (newCode) => {
    setCodes(prev => [newCode, ...prev]);
    setShowForm(false);
  };

  const handleToggle = async (id, active) => {
    await toggleCode(id, active);
    setCodes(prev => prev.map(c => c.id === id ? { ...c, active } : c));
  };

  const handleDelete = async (id) => {
    await deleteCode(id);
    setCodes(prev => prev.filter(c => c.id !== id));
  };

  const filtered = codes.filter(c => {
    if (filter === 'active')   return c.active && !isExpired(c.expires_at);
    if (filter === 'inactive') return !c.active || isExpired(c.expires_at);
    return true;
  });

  const activeCount = codes.filter(c => c.active && !isExpired(c.expires_at)).length;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-end sm:items-center justify-center z-40 p-0 sm:p-4">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-5xl flex flex-col" style={{ maxHeight: '90vh' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-xl">🔐</span>
            <div>
              <h2 className="font-bold text-gray-800">Advisor Access Codes</h2>
              <p className="text-xs text-gray-500">{activeCount} active code{activeCount !== 1 ? 's' : ''} · {codes.length} total</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={loadCodes}
              className="text-xs text-gray-500 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50 transition-colors"
            >
              ↻ Refresh
            </button>
            <button
              onClick={() => setShowForm(true)}
              className="text-xs bg-blue-600 hover:bg-blue-700 text-white font-semibold px-3 py-1.5 rounded-lg transition-colors"
            >
              + New Code
            </button>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl ml-2">✕</button>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1 px-6 py-3 border-b border-gray-100 flex-shrink-0">
          {[['all', 'All'], ['active', 'Active'], ['inactive', 'Inactive / Expired']].map(([val, label]) => (
            <button
              key={val}
              onClick={() => setFilter(val)}
              className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                filter === val ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-gray-400">
              <svg className="animate-spin h-6 w-6 mr-2" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
              </svg>
              Loading codes…
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-16 text-red-500">
              <p className="text-sm">{error}</p>
              <button onClick={loadCodes} className="text-xs text-blue-600 hover:underline mt-2">Retry</button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <p className="text-3xl mb-2">🔑</p>
              <p className="text-sm">No codes yet</p>
              <button onClick={() => setShowForm(true)} className="text-xs text-blue-600 hover:underline mt-2">
                Create the first advisor code
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[700px]">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="py-2.5 px-4 text-left text-xs font-semibold text-gray-500">Code</th>
                    <th className="py-2.5 px-4 text-left text-xs font-semibold text-gray-500">Advisor Name</th>
                    <th className="py-2.5 px-4 text-left text-xs font-semibold text-gray-500">Role</th>
                    <th className="py-2.5 px-4 text-left text-xs font-semibold text-gray-500">Status</th>
                    <th className="py-2.5 px-4 text-left text-xs font-semibold text-gray-500">Expires</th>
                    <th className="py-2.5 px-4 text-left text-xs font-semibold text-gray-500">Created</th>
                    <th className="py-2.5 px-4 text-left text-xs font-semibold text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(row => (
                    <CodeRow
                      key={row.id}
                      row={row}
                      onToggle={handleToggle}
                      onDelete={handleDelete}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-gray-100 flex-shrink-0 flex items-center justify-between">
          <p className="text-xs text-gray-400">
            Codes are stored in Supabase · No client data is ever synced to the cloud
          </p>
          <button onClick={onClose} className="text-sm text-gray-600 border border-gray-200 px-4 py-2 rounded-xl hover:bg-gray-50 transition-colors">
            Close
          </button>
        </div>
      </div>

      {showForm && <NewCodeForm onCreated={handleCreated} onCancel={() => setShowForm(false)} />}
    </div>
  );
}
