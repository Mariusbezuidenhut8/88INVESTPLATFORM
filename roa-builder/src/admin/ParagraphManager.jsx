/**
 * ParagraphManager.jsx — Investment ROA Builder v3
 *
 * Admin tool for managing the paragraph bank.
 * Advisors can: view all built-in paragraphs, add custom ones,
 * edit existing, archive unused, and restore archived.
 *
 * Custom paragraphs are stored via storage.js and merged with
 * the built-in bank at runtime.
 *
 * Props:
 *   onClose  {fn}  — close the manager panel
 */

import { useState, useCallback, useEffect } from 'react';
import { PARAGRAPH_BANK, getAllSections } from '../data/paragraphBank.js';
import { saveParagraphOverrides, loadParagraphOverrides } from '../shared/storage.js';
import { generateParaId, toLabel, uid } from '../shared/ui.js';

const SECTION_ICONS = {
  clientNeeds:       '🎯',
  riskProfile:       '📊',
  recommendation:    '✅',
  providerRationale: '🏦',
  costs:             '💰',
  tax:               '🧾',
  reg28:             '⚖️',
  faisDisclosure:    '📜',
  implementation:    '🚀',
  reviewSchedule:    '🗓️',
};

const PRODUCT_KEYS = [
  'general',
  'RETIREMENT ANNUITY',
  'ENDOWMENT',
  'Living Annuity',
  'unit trust',
  'preservation nfund',
  'Tax-Free savings',
];

// ── Para card ──────────────────────────────────────────────────────────────
function ParaCard({ para, isCustom, onEdit, onArchive, onRestore }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className={`rounded-lg border p-3 mb-2 transition-all ${para.archived ? 'opacity-50 border-dashed border-gray-200 bg-gray-50' : isCustom ? 'border-blue-200 bg-blue-50' : 'border-gray-200 bg-white'}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <p className="text-xs font-semibold text-gray-700">{para.label}</p>
            {isCustom && <span className="text-xs bg-blue-100 text-blue-600 rounded-full px-1.5 py-0.5">Custom</span>}
            {para.archived && <span className="text-xs bg-gray-100 text-gray-500 rounded-full px-1.5 py-0.5">Archived</span>}
          </div>
          {para.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-1">
              {para.tags.map(t => <span key={t} className="text-xs bg-gray-100 text-gray-400 rounded px-1.5 py-0.5">{t}</span>)}
            </div>
          )}
          <p className={`text-xs text-gray-500 leading-relaxed ${expanded ? '' : 'line-clamp-2'}`}>{para.text}</p>
          <button onClick={() => setExpanded(e => !e)} className="text-xs text-blue-500 hover:text-blue-700 mt-1">{expanded ? 'Show less' : 'Show more'}</button>
        </div>
        <div className="flex flex-col gap-1 flex-shrink-0">
          {isCustom && !para.archived && <button onClick={() => onEdit(para)} className="text-xs text-gray-500 hover:text-blue-600 border border-gray-200 rounded px-2 py-0.5 transition-colors">Edit</button>}
          {!para.archived
            ? <button onClick={() => onArchive(para.id)} className="text-xs text-gray-400 hover:text-red-500 border border-gray-200 rounded px-2 py-0.5 transition-colors">Archive</button>
            : <button onClick={() => onRestore(para.id)} className="text-xs text-gray-400 hover:text-green-600 border border-gray-200 rounded px-2 py-0.5 transition-colors">Restore</button>}
        </div>
      </div>
    </div>
  );
}

// ── Para editor modal ──────────────────────────────────────────────────────
function ParaEditor({ para, sectionKey, onSave, onCancel }) {
  const [label, setLabel]     = useState(para?.label || '');
  const [text, setText]       = useState(para?.text  || '');
  const [tags, setTags]       = useState(para?.tags?.join(', ') || '');
  const [product, setProduct] = useState(para?.productKey || 'general');
  const [error, setError]     = useState('');

  const handleSave = () => {
    if (!label.trim()) { setError('Label is required'); return; }
    if (!text.trim())  { setError('Text is required');  return; }
    onSave({
      id:         para?.id || uid(),
      label:      label.trim(),
      text:       text.trim(),
      tags:       tags.split(',').map(t => t.trim()).filter(Boolean),
      productKey: product,
      custom:     true,
      archived:   false,
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-screen overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-800">{para?.id ? 'Edit Paragraph' : 'New Paragraph'}</h3>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Label <span className="text-red-400">*</span></label>
            <input value={label} onChange={e => setLabel(e.target.value)} placeholder="Short descriptive name"
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Product Scope</label>
            <select value={product} onChange={e => setProduct(e.target.value)}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400">
              {PRODUCT_KEYS.map(k => <option key={k} value={k}>{k === 'general' ? 'General (all products)' : k}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Paragraph Text <span className="text-red-400">*</span></label>
            <textarea value={text} onChange={e => setText(e.target.value)} rows={6} placeholder="Full paragraph text..."
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none" />
            <p className="text-xs text-gray-400 mt-0.5">{text.trim().split(/\s+/).filter(Boolean).length} words</p>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Tags (comma-separated)</label>
            <input value={tags} onChange={e => setTags(e.target.value)} placeholder="e.g. retirement, tax_deductible, long_term"
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400" />
          </div>
          {error && <p className="text-xs text-red-500 bg-red-50 rounded px-3 py-2">{error}</p>}
        </div>
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
          <button onClick={onCancel} className="text-sm text-gray-500 border border-gray-200 px-4 py-2 rounded-lg hover:bg-gray-50">Cancel</button>
          <button onClick={handleSave} className="text-sm bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg transition-colors">Save Paragraph</button>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════════════════════

export default function ParagraphManager({ onClose }) {
  const [activeSection, setActiveSection]   = useState(getAllSections()[0]);
  const [overrides, setOverrides]           = useState({});
  const [showArchived, setShowArchived]     = useState(false);
  const [editing, setEditing]               = useState(null);   // null | {} | existing para
  const [editingSection, setEditingSection] = useState(null);
  const [searchTerm, setSearchTerm]         = useState('');
  const [saved, setSaved]                   = useState(false);

  // Load custom overrides from storage
  useEffect(() => {
    const stored = loadParagraphOverrides();
    if (stored) setOverrides(stored);
  }, []);

  // Get combined paragraphs for a section
  const getParagraphsForSection = useCallback((sectionKey) => {
    const builtIn  = [];
    const section  = PARAGRAPH_BANK[sectionKey] || {};
    Object.values(section).forEach(arr => arr.forEach(p => builtIn.push({ ...p, _builtin: true })));
    const custom = (overrides[sectionKey] || []);
    return [...builtIn, ...custom];
  }, [overrides]);

  const allParas = getParagraphsForSection(activeSection);
  const filtered = searchTerm
    ? allParas.filter(p => p.label?.toLowerCase().includes(searchTerm.toLowerCase()) || p.text?.toLowerCase().includes(searchTerm.toLowerCase()))
    : allParas;
  const visible  = showArchived ? filtered : filtered.filter(p => !p.archived);

  // Count stats
  const customCount   = Object.values(overrides).flat().filter(p => !p.archived).length;
  const archivedCount = [...Object.values(overrides).flat(), ...Object.values(PARAGRAPH_BANK).flatMap(s => Object.values(s).flat())].filter(p => p.archived).length;

  // Save custom para
  const handleSave = useCallback((para) => {
    const sectionKey = editingSection || activeSection;
    const existing   = overrides[sectionKey] || [];
    const idx        = existing.findIndex(p => p.id === para.id);
    const updated    = idx >= 0
      ? existing.map(p => p.id === para.id ? para : p)
      : [...existing, para];
    const newOverrides = { ...overrides, [sectionKey]: updated };
    setOverrides(newOverrides);
    saveParagraphOverrides(newOverrides);
    setEditing(null);
    setEditingSection(null);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }, [overrides, editingSection, activeSection]);

  // Archive / restore
  const handleArchive = useCallback((paraId) => {
    // Check if it's a custom para
    const newOverrides = { ...overrides };
    let found = false;
    for (const [sec, paras] of Object.entries(newOverrides)) {
      const idx = paras.findIndex(p => p.id === paraId);
      if (idx >= 0) { newOverrides[sec][idx] = { ...newOverrides[sec][idx], archived: true }; found = true; break; }
    }
    if (!found) {
      // Archive a built-in paragraph by adding an override entry
      const secParas = newOverrides[activeSection] || [];
      const builtIn  = allParas.find(p => p.id === paraId);
      if (builtIn) secParas.push({ ...builtIn, archived: true, _overridden: true });
      newOverrides[activeSection] = secParas;
    }
    setOverrides(newOverrides);
    saveParagraphOverrides(newOverrides);
  }, [overrides, activeSection, allParas]);

  const handleRestore = useCallback((paraId) => {
    const newOverrides = { ...overrides };
    for (const [sec, paras] of Object.entries(newOverrides)) {
      const idx = paras.findIndex(p => p.id === paraId);
      if (idx >= 0) { newOverrides[sec][idx] = { ...newOverrides[sec][idx], archived: false }; break; }
    }
    setOverrides(newOverrides);
    saveParagraphOverrides(newOverrides);
  }, [overrides]);

  const sections = getAllSections();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-end sm:items-center justify-center z-40 p-0 sm:p-4">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-4xl flex flex-col" style={{ maxHeight: '90vh' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-xl">📚</span>
            <div>
              <h2 className="font-bold text-gray-800">Paragraph Bank Manager</h2>
              <p className="text-xs text-gray-500">{customCount} custom · {archivedCount} archived</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {saved && <span className="text-xs text-green-600 font-semibold bg-green-50 rounded-full px-2 py-0.5">✓ Saved</span>}
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl transition-colors">✕</button>
          </div>
        </div>

        <div className="flex flex-1 min-h-0">

          {/* Section sidebar */}
          <div className="w-48 flex-shrink-0 border-r border-gray-100 bg-gray-50 overflow-y-auto py-3">
            {sections.map(sec => {
              const count = getParagraphsForSection(sec).filter(p => !p.archived).length;
              return (
                <button key={sec} onClick={() => setActiveSection(sec)}
                  className={`w-full text-left flex items-center justify-between px-4 py-2.5 text-xs font-medium transition-colors ${activeSection === sec ? 'bg-white text-blue-700 border-r-2 border-blue-500' : 'text-gray-600 hover:bg-gray-100'}`}>
                  <span className="flex items-center gap-1.5">
                    <span>{SECTION_ICONS[sec] || '📝'}</span>
                    <span className="truncate">{toLabel(sec)}</span>
                  </span>
                  <span className="text-gray-400 text-xs">{count}</span>
                </button>
              );
            })}
          </div>

          {/* Main content */}
          <div className="flex-1 flex flex-col min-w-0 min-h-0">

            {/* Toolbar */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 flex-shrink-0 flex-wrap">
              <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search paragraphs..." className="text-xs border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-400 w-48" />
              <label className="flex items-center gap-1.5 text-xs text-gray-500 cursor-pointer">
                <input type="checkbox" checked={showArchived} onChange={e => setShowArchived(e.target.checked)} className="rounded" />
                Show archived
              </label>
              <div className="ml-auto">
                <button
                  onClick={() => { setEditing({}); setEditingSection(activeSection); }}
                  className="text-xs bg-blue-600 hover:bg-blue-700 text-white font-semibold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1">
                  + New Paragraph
                </button>
              </div>
            </div>

            {/* Para list */}
            <div className="flex-1 overflow-y-auto px-4 py-3">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                {toLabel(activeSection)} · {visible.length} paragraph{visible.length !== 1 ? 's' : ''}
              </p>
              {visible.length === 0 && (
                <div className="text-center py-12 text-gray-400">
                  <p className="text-3xl mb-2">📝</p>
                  <p className="text-sm">No paragraphs found</p>
                  <button onClick={() => { setEditing({}); setEditingSection(activeSection); }}
                    className="text-xs text-blue-600 hover:underline mt-2">Add one now</button>
                </div>
              )}
              {visible.map(para => (
                <ParaCard
                  key={para.id}
                  para={para}
                  isCustom={!!para.custom}
                  onEdit={p => { setEditing(p); setEditingSection(activeSection); }}
                  onArchive={handleArchive}
                  onRestore={handleRestore}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-gray-100 flex-shrink-0 flex items-center justify-between">
          <p className="text-xs text-gray-400">Custom paragraphs are saved locally and merged with the built-in bank.</p>
          <button onClick={onClose} className="text-sm text-gray-600 border border-gray-200 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors">Close</button>
        </div>
      </div>

      {/* Editor modal */}
      {editing !== null && (
        <ParaEditor
          para={editing.id ? editing : null}
          sectionKey={editingSection}
          onSave={handleSave}
          onCancel={() => { setEditing(null); setEditingSection(null); }}
        />
      )}
    </div>
  );
}
