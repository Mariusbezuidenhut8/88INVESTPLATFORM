/**
 * CARParagraphManager.jsx
 * Admin panel for managing custom paragraphs in the Investment CAR paragraph bank.
 * Custom paragraphs are saved to localStorage under 'roa_car_paragraphs'.
 */

import { useState, useCallback, useEffect } from 'react';
import { CAR_PARAGRAPHS, CAR_SECTION_KEYS, CAR_SECTION_LABELS } from '../data/investmentCARParagraphs.js';
import { saveCARParagraphOverrides, loadCARParagraphOverrides } from '../shared/storage.js';

function uid() {
  return `car_custom_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

// ── Paragraph card ────────────────────────────────────────────────────────────
function ParaCard({ para, isCustom, onEdit, onArchive, onRestore }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className={`rounded-lg border p-3 mb-2 transition-all ${
      para.archived
        ? 'opacity-50 border-dashed border-gray-200 bg-gray-50'
        : isCustom
          ? 'border-blue-200 bg-blue-50'
          : 'border-gray-200 bg-white'
    }`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <p className="text-xs font-semibold text-gray-700">{para.label}</p>
            {isCustom  && <span className="text-xs bg-blue-100 text-blue-600 rounded-full px-1.5 py-0.5">Custom</span>}
            {para.archived && <span className="text-xs bg-gray-100 text-gray-500 rounded-full px-1.5 py-0.5">Archived</span>}
          </div>
          {para.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-1">
              {para.tags.map(t => (
                <span key={t} className="text-xs bg-gray-100 text-gray-400 rounded px-1.5 py-0.5">{t}</span>
              ))}
            </div>
          )}
          <p className={`text-xs text-gray-500 leading-relaxed whitespace-pre-wrap ${expanded ? '' : 'line-clamp-2'}`}>
            {para.text}
          </p>
          <button
            onClick={() => setExpanded(e => !e)}
            className="text-xs text-blue-500 hover:text-blue-700 mt-1"
          >
            {expanded ? 'Show less' : 'Show more'}
          </button>
        </div>
        <div className="flex flex-col gap-1 flex-shrink-0">
          {isCustom && !para.archived && (
            <button
              onClick={() => onEdit(para)}
              className="text-xs text-gray-500 hover:text-blue-600 border border-gray-200 rounded px-2 py-0.5 transition-colors"
            >
              Edit
            </button>
          )}
          {!para.archived
            ? (
              <button
                onClick={() => onArchive(para.id)}
                className="text-xs text-gray-400 hover:text-red-500 border border-gray-200 rounded px-2 py-0.5 transition-colors"
              >
                {isCustom ? 'Delete' : 'Hide'}
              </button>
            )
            : (
              <button
                onClick={() => onRestore(para.id)}
                className="text-xs text-gray-400 hover:text-green-600 border border-gray-200 rounded px-2 py-0.5 transition-colors"
              >
                Restore
              </button>
            )
          }
        </div>
      </div>
    </div>
  );
}

// ── Paragraph editor modal ────────────────────────────────────────────────────
function ParaEditor({ para, onSave, onCancel }) {
  const [label, setLabel] = useState(para?.label || '');
  const [text,  setText]  = useState(para?.text  || '');
  const [tags,  setTags]  = useState(para?.tags?.join(', ') || '');
  const [error, setError] = useState('');

  const handleSave = () => {
    if (!label.trim()) { setError('Label is required'); return; }
    if (!text.trim())  { setError('Paragraph text is required'); return; }
    onSave({
      id:      para?.id || uid(),
      label:   label.trim(),
      text:    text.trim(),
      tags:    tags.split(',').map(t => t.trim()).filter(Boolean),
      custom:  true,
      archived: false,
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-800">{para?.id ? 'Edit Paragraph' : 'New Paragraph'}</h3>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Label <span className="text-red-400">*</span>
            </label>
            <input
              value={label}
              onChange={e => setLabel(e.target.value)}
              placeholder="Short descriptive name shown in the picker"
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Paragraph Text <span className="text-red-400">*</span>
            </label>
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              rows={8}
              placeholder="Full paragraph text. You can use tokens like [Client Name], [Provider Name], [Product Type]."
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 resize-y"
            />
            <p className="text-xs text-gray-400 mt-0.5">
              {text.trim().split(/\s+/).filter(Boolean).length} words
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Tags (comma-separated)</label>
            <input
              value={tags}
              onChange={e => setTags(e.target.value)}
              placeholder="e.g. retirement, tax_deductible, long_term"
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <p className="text-xs text-gray-400 mt-0.5">Tags help filter suggestions (optional)</p>
          </div>

          {error && (
            <p className="text-xs text-red-500 bg-red-50 rounded px-3 py-2">{error}</p>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="text-sm text-gray-500 border border-gray-200 px-4 py-2 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="text-sm bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            Save Paragraph
          </button>
        </div>
      </div>
    </div>
  );
}

// ── MAIN COMPONENT ────────────────────────────────────────────────────────────
export default function CARParagraphManager({ onClose }) {
  const [activeSection, setActiveSection] = useState(CAR_SECTION_KEYS[0]);
  const [overrides,     setOverrides]     = useState({});
  const [showArchived,  setShowArchived]  = useState(false);
  const [editing,       setEditing]       = useState(null);
  const [searchTerm,    setSearchTerm]    = useState('');
  const [saved,         setSaved]         = useState(false);

  // Load saved custom paragraphs
  useEffect(() => {
    const stored = loadCARParagraphOverrides();
    if (stored) setOverrides(stored);
  }, []);

  // Combined paragraphs for a section (built-in + custom)
  const getParasForSection = useCallback((sectionKey) => {
    const builtIn = (CAR_PARAGRAPHS[sectionKey] || []).map(p => ({ ...p, _builtin: true }));
    const custom  = overrides[sectionKey] || [];
    return [...builtIn, ...custom];
  }, [overrides]);

  const allParas = getParasForSection(activeSection);
  const filtered = searchTerm
    ? allParas.filter(p =>
        p.label?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.text?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : allParas;
  const visible = showArchived ? filtered : filtered.filter(p => !p.archived);

  const customCount   = Object.values(overrides).flat().filter(p => !p.archived && p.custom).length;

  // Save paragraph
  const handleSave = useCallback((para) => {
    const existing = overrides[activeSection] || [];
    const idx      = existing.findIndex(p => p.id === para.id);
    const updated  = idx >= 0
      ? existing.map(p => p.id === para.id ? para : p)
      : [...existing, para];
    const newOverrides = { ...overrides, [activeSection]: updated };
    setOverrides(newOverrides);
    saveCARParagraphOverrides(newOverrides);
    setEditing(null);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }, [overrides, activeSection]);

  // Archive (hide built-in or delete custom)
  const handleArchive = useCallback((paraId) => {
    const newOverrides = { ...overrides };
    // Check if it's a custom para already in overrides
    let found = false;
    for (const [sec, paras] of Object.entries(newOverrides)) {
      const idx = paras.findIndex(p => p.id === paraId);
      if (idx >= 0) {
        newOverrides[sec] = paras.map(p => p.id === paraId ? { ...p, archived: true } : p);
        found = true;
        break;
      }
    }
    // If it's a built-in para, add an archived override entry
    if (!found) {
      const builtIn = allParas.find(p => p.id === paraId);
      if (builtIn) {
        const secParas = newOverrides[activeSection] || [];
        newOverrides[activeSection] = [...secParas, { ...builtIn, archived: true, _overridden: true }];
      }
    }
    setOverrides(newOverrides);
    saveCARParagraphOverrides(newOverrides);
  }, [overrides, activeSection, allParas]);

  // Restore archived para
  const handleRestore = useCallback((paraId) => {
    const newOverrides = { ...overrides };
    for (const [sec, paras] of Object.entries(newOverrides)) {
      const idx = paras.findIndex(p => p.id === paraId);
      if (idx >= 0) {
        newOverrides[sec] = paras.map(p => p.id === paraId ? { ...p, archived: false } : p);
        break;
      }
    }
    setOverrides(newOverrides);
    saveCARParagraphOverrides(newOverrides);
  }, [overrides]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-end sm:items-center justify-center z-40 p-0 sm:p-4">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-4xl flex flex-col" style={{ maxHeight: '90vh' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-xl">📚</span>
            <div>
              <h2 className="font-bold text-gray-800">Investment CAR — Paragraph Bank</h2>
              <p className="text-xs text-gray-500">
                {customCount} custom paragraph{customCount !== 1 ? 's' : ''} · built-in paragraphs can be hidden
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {saved && (
              <span className="text-xs text-green-600 font-semibold bg-green-50 rounded-full px-2 py-0.5">✓ Saved</span>
            )}
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
          </div>
        </div>

        <div className="flex flex-1 min-h-0">

          {/* Section sidebar */}
          <div className="w-52 flex-shrink-0 border-r border-gray-100 bg-gray-50 overflow-y-auto py-3">
            {CAR_SECTION_KEYS.map(sec => {
              const count = getParasForSection(sec).filter(p => !p.archived).length;
              const customInSection = (overrides[sec] || []).filter(p => !p.archived && p.custom).length;
              return (
                <button
                  key={sec}
                  onClick={() => setActiveSection(sec)}
                  className={`w-full text-left flex items-center justify-between px-4 py-2.5 text-xs font-medium transition-colors ${
                    activeSection === sec
                      ? 'bg-white text-blue-700 border-r-2 border-blue-500'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <span className="truncate pr-2">{CAR_SECTION_LABELS[sec] || sec}</span>
                  <span className="flex items-center gap-1 flex-shrink-0">
                    {customInSection > 0 && (
                      <span className="text-blue-500 font-bold">+{customInSection}</span>
                    )}
                    <span className="text-gray-400">{count}</span>
                  </span>
                </button>
              );
            })}
          </div>

          {/* Main content */}
          <div className="flex-1 flex flex-col min-w-0 min-h-0">

            {/* Toolbar */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 flex-shrink-0 flex-wrap">
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search paragraphs..."
                className="text-xs border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-400 w-44"
              />
              <label className="flex items-center gap-1.5 text-xs text-gray-500 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showArchived}
                  onChange={e => setShowArchived(e.target.checked)}
                  className="rounded"
                />
                Show hidden
              </label>
              <div className="ml-auto">
                <button
                  onClick={() => setEditing({})}
                  className="text-xs bg-blue-600 hover:bg-blue-700 text-white font-semibold px-3 py-1.5 rounded-lg transition-colors"
                >
                  + New Paragraph
                </button>
              </div>
            </div>

            {/* Paragraph list */}
            <div className="flex-1 overflow-y-auto px-4 py-3">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                {CAR_SECTION_LABELS[activeSection]} · {visible.length} paragraph{visible.length !== 1 ? 's' : ''}
              </p>

              {visible.length === 0 && (
                <div className="text-center py-12 text-gray-400">
                  <p className="text-3xl mb-2">📝</p>
                  <p className="text-sm">No paragraphs in this section</p>
                  <button
                    onClick={() => setEditing({})}
                    className="text-xs text-blue-600 hover:underline mt-2"
                  >
                    Add the first one
                  </button>
                </div>
              )}

              {visible.map(para => (
                <ParaCard
                  key={para.id}
                  para={para}
                  isCustom={!!para.custom}
                  onEdit={setEditing}
                  onArchive={handleArchive}
                  onRestore={handleRestore}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-gray-100 flex-shrink-0 flex items-center justify-between">
          <p className="text-xs text-gray-400">
            Custom paragraphs are saved in your browser and appear instantly in the CAR wizard.
          </p>
          <button
            onClick={onClose}
            className="text-sm text-gray-600 border border-gray-200 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
        </div>
      </div>

      {/* Editor modal */}
      {editing !== null && (
        <ParaEditor
          para={editing?.id ? editing : null}
          onSave={handleSave}
          onCancel={() => setEditing(null)}
        />
      )}
    </div>
  );
}
