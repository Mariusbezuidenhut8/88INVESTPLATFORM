/**
 * SavedROAsManager.jsx
 *
 * Full ROA history manager with:
 *   - Search by client name or reference number
 *   - Filter by product type
 *   - Sort by date or client name
 *   - Delete with confirmation
 *   - Load / continue any saved ROA
 *   - Stats bar showing total and product breakdown
 */

import { useState, useMemo } from 'react';
import { loadROAs, deleteROA } from '../shared/storage.js';
import { formatDate, getProductLabel } from '../shared/ui.js';

const SORT_OPTIONS = [
  { value: 'date_desc',  label: 'Newest first' },
  { value: 'date_asc',   label: 'Oldest first' },
  { value: 'name_asc',   label: 'Client A → Z' },
  { value: 'name_desc',  label: 'Client Z → A' },
];

function getClientName(roa) {
  return [roa.clientProfile?.firstNames, roa.clientProfile?.surname].filter(Boolean).join(' ') || 'Unnamed Client';
}

function getProductKey(roa) {
  return roa.providerResult?.productKey || roa.treeResult?.productKey || '';
}

function StatusBadge({ roa }) {
  const steps = ['clientProfile','treeResult','providerResult','fees','content'];
  const filled = steps.filter(k => {
    if (k === 'content') return roa.content && Object.values(roa.content).some(v => v && (typeof v === 'string' ? v.trim().length > 10 : true));
    if (k === 'fees')    return roa.fees && Object.keys(roa.fees).length > 0;
    return roa[k] && Object.keys(roa[k]).length > 0;
  }).length;
  const pct = Math.round((filled / steps.length) * 100);
  const colour = pct === 100 ? 'bg-green-100 text-green-700' : pct >= 60 ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700';
  return (
    <span className={`text-xs font-semibold rounded-full px-2 py-0.5 ${colour}`}>
      {pct === 100 ? 'Complete' : `${pct}%`}
    </span>
  );
}

export default function SavedROAsManager({ onLoad, onClose }) {
  const [search,    setSearch]    = useState('');
  const [product,   setProduct]   = useState('');
  const [sortBy,    setSortBy]    = useState('date_desc');
  const [deleteId,  setDeleteId]  = useState(null);
  const [roas,      setRoas]      = useState(() => loadROAs());

  // Unique product types for filter dropdown
  const productTypes = useMemo(() => {
    const keys = [...new Set(roas.map(r => getProductKey(r)).filter(Boolean))];
    return keys.sort();
  }, [roas]);

  // Filter + sort
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    let list = roas.filter(r => {
      if (product && getProductKey(r) !== product) return false;
      if (q) {
        const name = getClientName(r).toLowerCase();
        const ref  = (r.id || '').toLowerCase();
        const id   = (r.clientProfile?.idNumber || '').toLowerCase();
        if (!name.includes(q) && !ref.includes(q) && !id.includes(q)) return false;
      }
      return true;
    });
    list = [...list].sort((a, b) => {
      switch (sortBy) {
        case 'date_asc':  return new Date(a.createdAt) - new Date(b.createdAt);
        case 'name_asc':  return getClientName(a).localeCompare(getClientName(b));
        case 'name_desc': return getClientName(b).localeCompare(getClientName(a));
        default:          return new Date(b.createdAt) - new Date(a.createdAt);
      }
    });
    return list;
  }, [roas, search, product, sortBy]);

  // Product breakdown for stats
  const stats = useMemo(() => {
    const map = {};
    roas.forEach(r => {
      const k = getProductKey(r) || 'Unknown';
      map[k] = (map[k] || 0) + 1;
    });
    return map;
  }, [roas]);

  const handleDelete = (id) => {
    deleteROA(id);
    setRoas(loadROAs());
    setDeleteId(null);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-40 p-0 sm:p-4">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-3xl flex flex-col" style={{maxHeight:'92vh'}}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <div>
            <h2 className="font-bold text-gray-800 text-lg">ROA History</h2>
            <p className="text-xs text-gray-400 mt-0.5">{roas.length} record{roas.length !== 1 ? 's' : ''} saved in this browser</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
        </div>

        {/* Stats bar */}
        {roas.length > 0 && (
          <div className="px-6 py-3 bg-gray-50 border-b border-gray-100 flex-shrink-0 overflow-x-auto">
            <div className="flex gap-3 text-xs whitespace-nowrap">
              <span className="font-semibold text-gray-500">Products:</span>
              {Object.entries(stats).map(([k, v]) => (
                <button key={k} onClick={() => setProduct(product === k ? '' : k)}
                  className={`rounded-full px-2.5 py-0.5 font-medium transition-colors ${product === k ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-blue-300'}`}>
                  {getProductLabel(k)} ({v})
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="px-6 py-3 border-b border-gray-100 flex-shrink-0 flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by client name, reference, or ID number..."
            className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-300"
          />
          <div className="flex gap-2">
            <select value={product} onChange={e => setProduct(e.target.value)}
              className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-300 bg-white">
              <option value="">All products</option>
              {productTypes.map(k => <option key={k} value={k}>{getProductLabel(k)}</option>)}
            </select>
            <select value={sortBy} onChange={e => setSortBy(e.target.value)}
              className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-300 bg-white">
              {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        </div>

        {/* Results count */}
        {(search || product) && (
          <div className="px-6 py-2 flex-shrink-0">
            <p className="text-xs text-gray-500">
              {filtered.length} of {roas.length} records
              {(search || product) && (
                <button onClick={() => { setSearch(''); setProduct(''); }} className="ml-2 text-blue-500 hover:text-blue-700 underline">
                  Clear filters
                </button>
              )}
            </p>
          </div>
        )}

        {/* List */}
        <div className="flex-1 overflow-y-auto px-4 py-3">
          {roas.length === 0 && (
            <div className="text-center py-16">
              <p className="text-4xl mb-3">📋</p>
              <p className="text-sm font-semibold text-gray-600">No saved ROAs yet</p>
              <p className="text-xs text-gray-400 mt-1">Complete and save an ROA to see it here.</p>
            </div>
          )}
          {roas.length > 0 && filtered.length === 0 && (
            <div className="text-center py-12">
              <p className="text-2xl mb-2">🔍</p>
              <p className="text-sm text-gray-500">No records match your search.</p>
              <button onClick={() => { setSearch(''); setProduct(''); }} className="mt-2 text-xs text-blue-500 underline">Clear filters</button>
            </div>
          )}
          {filtered.map(roa => (
            <div key={roa.id} className="rounded-xl border border-gray-200 hover:border-blue-200 hover:shadow-sm p-4 mb-2 transition-all bg-white">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <p className="font-semibold text-sm text-gray-800">{getClientName(roa)}</p>
                    <StatusBadge roa={roa} />
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-gray-500">
                    <span>📅 {formatDate(roa.createdAt)}</span>
                    {getProductKey(roa) && <span>📦 {getProductLabel(getProductKey(roa))}</span>}
                    {roa.providerResult?.recommended?.name && <span>🏦 {roa.providerResult.recommended.name}</span>}
                    {roa.clientProfile?.idNumber && <span>🪪 {roa.clientProfile.idNumber}</span>}
                  </div>
                  <p className="text-xs text-gray-300 mt-1 font-mono">Ref: {roa.id}</p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => onLoad(roa)}
                    className="text-xs bg-blue-600 hover:bg-blue-700 text-white font-semibold px-3 py-1.5 rounded-lg transition-colors"
                  >
                    Open
                  </button>
                  <button
                    onClick={() => setDeleteId(roa.id)}
                    className="text-xs text-red-400 hover:text-red-600 border border-red-100 hover:border-red-300 px-2.5 py-1.5 rounded-lg transition-colors"
                    title="Delete"
                  >
                    🗑
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-gray-100 flex-shrink-0 flex items-center justify-between gap-3">
          <p className="text-xs text-gray-400">Records are stored locally in this browser. Export via Print / Save PDF.</p>
          <button onClick={onClose} className="text-sm text-gray-500 border border-gray-200 px-4 py-2 rounded-lg hover:bg-gray-50">Close</button>
        </div>

      </div>

      {/* Delete confirmation dialog */}
      {deleteId && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <p className="text-2xl mb-3 text-center">🗑️</p>
            <h3 className="font-bold text-gray-800 text-center mb-2">Delete this ROA?</h3>
            <p className="text-sm text-gray-500 text-center mb-1">
              <strong>{getClientName(roas.find(r => r.id === deleteId) || {})}</strong>
            </p>
            <p className="text-xs text-gray-400 text-center mb-6">This cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 text-sm border border-gray-200 py-2.5 rounded-xl hover:bg-gray-50 font-medium">
                Cancel
              </button>
              <button onClick={() => handleDelete(deleteId)} className="flex-1 text-sm bg-red-500 hover:bg-red-600 text-white py-2.5 rounded-xl font-semibold">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
