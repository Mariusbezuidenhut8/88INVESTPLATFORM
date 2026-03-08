/**
 * FinancialNeedsStatement.jsx — FNS Calculator (Stage 1: Shell & Navigation)
 *
 * Mirrors the Integrate FNA financials layout:
 *   Top nav:  FINANCIALS | MODELLING | PROCEED
 *   Sidebar:  Goals · Assets · Incomes · Expenses · Liabilities
 *   Header:   Client name & age | CURRENT / PLANNED toggle
 *   Panels:   Assets · Incomes · Expenses (placeholder content for now)
 *
 * Props:
 *   clientProfile  {object}  — from App state
 *   initialData    {object}  — previously saved FNS data
 *   onChange       {fn}
 *   onComplete     {fn}      — called with FNS data
 *   onBack         {fn}      — return to NeedsAnalysis landing
 */

import { useState } from 'react';

// ── Helpers ────────────────────────────────────────────────────────────────

function fmt(n) {
  if (n == null || n === '') return '—';
  return `R${Number(n).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function clientLabel(profile = {}) {
  const name = [profile.firstNames, profile.surname].filter(Boolean).join(' ').toUpperCase() || 'CLIENT';
  const age  = profile.age ? ` (${profile.age})` : '';
  return `${name}${age}`;
}

// ── Top navigation tabs ────────────────────────────────────────────────────

const TOP_TABS = ['FINANCIALS', 'MODELLING', 'PROCEED'];

function TopNav({ active, onChange }) {
  return (
    <div className="flex items-center gap-0 border-b border-gray-200 bg-white px-4">
      {TOP_TABS.map((tab) => (
        <button
          key={tab}
          onClick={() => onChange(tab)}
          className={`px-5 py-3 text-sm font-semibold tracking-wide transition-colors border-b-2 -mb-px
            ${active === tab
              ? 'border-blue-600 text-blue-700'
              : 'border-transparent text-gray-500 hover:text-gray-800'}`}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}

// ── Left sidebar ───────────────────────────────────────────────────────────

const SIDEBAR_SECTIONS = [
  { id: 'goals',       label: 'Goals',       icon: '🎯' },
  { id: 'assets',      label: 'Assets',      icon: '🏦' },
  { id: 'incomes',     label: 'Incomes',     icon: '💵' },
  { id: 'expenses',    label: 'Expenses',    icon: '🧾' },
  { id: 'liabilities', label: 'Liabilities', icon: '⚖️' },
];

function Sidebar({ activeSection, onChange, onBack }) {
  return (
    <aside className="w-52 flex-shrink-0 bg-gray-800 text-white flex flex-col min-h-full rounded-l-xl overflow-hidden">
      <button
        onClick={onBack}
        className="flex items-center gap-2 px-4 py-3 text-xs text-gray-400 hover:text-white hover:bg-gray-700 transition-colors border-b border-gray-700"
      >
        ‹ Back to Analysis
      </button>

      <nav className="flex-1 py-2">
        {SIDEBAR_SECTIONS.map((sec) => (
          <button
            key={sec.id}
            onClick={() => onChange(sec.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors text-left
              ${activeSection === sec.id
                ? 'bg-gray-700 text-white font-semibold border-l-4 border-blue-400'
                : 'text-gray-400 hover:bg-gray-700 hover:text-white border-l-4 border-transparent'}`}
          >
            <span className="text-base">{sec.icon}</span>
            {sec.label}
            <span className="ml-auto text-gray-500">›</span>
          </button>
        ))}
      </nav>

      {/* Font size hint (matches Integrate UI) */}
      <div className="px-4 py-3 border-t border-gray-700 flex items-center gap-2 text-gray-500 text-xs">
        <span className="text-sm">A</span>
        <span className="text-base font-bold">A</span>
        <span className="ml-1">16</span>
      </div>
    </aside>
  );
}

// ── Client header bar ──────────────────────────────────────────────────────

function ClientHeader({ clientProfile, view, onViewChange }) {
  return (
    <div className="flex items-center justify-between bg-blue-50 border-b border-blue-100 px-5 py-2.5">
      <div className="flex items-center gap-3 text-sm font-semibold text-gray-700 uppercase tracking-wide">
        <span className="text-blue-600 font-bold">FINANCIALS</span>
        <span className="text-gray-400">|</span>
        <span>{clientLabel(clientProfile)}</span>
        <span className="text-gray-400">|</span>
        <button
          onClick={() => onViewChange(view === 'current' ? 'planned' : 'current')}
          className="flex items-center gap-1 text-blue-700 hover:text-blue-900 transition-colors"
        >
          {view === 'current' ? 'CURRENT' : 'PLANNED'}
          <span className="text-xs">▼</span>
        </button>
      </div>

      {/* CURRENT / PLANNED tabs */}
      <div className="flex items-center gap-1">
        {['CURRENT', 'PLANNED'].map((v) => (
          <button
            key={v}
            onClick={() => onViewChange(v.toLowerCase())}
            className={`text-xs px-3 py-1.5 rounded font-semibold transition-colors
              ${view === v.toLowerCase()
                ? 'bg-blue-600 text-white'
                : 'text-gray-500 hover:text-gray-800'}`}
          >
            {v}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Generic panel placeholder ──────────────────────────────────────────────

function Panel({ title, total, children, onAdd }) {
  return (
    <div className="flex-1 min-w-0 bg-white border border-gray-200 rounded-xl overflow-hidden flex flex-col">
      {/* Panel header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">{title}</p>
          {total != null && (
            <p className="text-sm font-bold text-gray-800 mt-0.5">{fmt(total)}</p>
          )}
        </div>
        <button
          onClick={onAdd}
          className="w-7 h-7 rounded-full bg-blue-500 hover:bg-blue-600 text-white flex items-center justify-center text-lg leading-none transition-colors"
          title={`Add ${title}`}
        >
          +
        </button>
      </div>

      {/* Panel body */}
      <div className="flex-1 p-3 space-y-2">
        {children}
      </div>
    </div>
  );
}

// ── Placeholder item row ───────────────────────────────────────────────────

function ItemRow({ label, amount, onExpand }) {
  return (
    <button
      onClick={onExpand}
      className="w-full flex items-center justify-between bg-gray-50 hover:bg-blue-50 border border-gray-100 rounded-lg px-3 py-2.5 text-left transition-colors group"
    >
      <span className="text-sm text-gray-700 font-medium group-hover:text-blue-700">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold text-gray-800">{fmt(amount)}</span>
        <span className="text-gray-400 group-hover:text-blue-500">›</span>
      </div>
    </button>
  );
}

// ── Main FINANCIALS view ───────────────────────────────────────────────────

function FinancialsView({ data, onAdd }) {
  const { assets = [], incomes = [], expenses = [] } = data;

  const totalAssets   = assets.reduce((s, a) => s + (Number(a.value) || 0), 0);
  const totalIncomes  = incomes.reduce((s, i) => s + (Number(i.amount) || 0), 0);
  const totalExpenses = expenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);

  return (
    <div className="flex gap-4 p-4 flex-1 overflow-x-auto">
      {/* Assets panel */}
      <Panel title="Assets" total={totalAssets || null} onAdd={() => onAdd('asset')}>
        {assets.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-4">No assets added yet.</p>
        ) : (
          assets.map((a, i) => (
            <ItemRow key={i} label={a.type || a.label || 'Asset'} amount={a.value} onExpand={() => {}} />
          ))
        )}
      </Panel>

      {/* Incomes panel */}
      <Panel title="Incomes" total={totalIncomes || null} onAdd={() => onAdd('income')}>
        {incomes.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-4">No incomes added yet.</p>
        ) : (
          incomes.map((inc, i) => (
            <ItemRow key={i} label={inc.type || inc.label || 'Income'} amount={inc.amount} onExpand={() => {}} />
          ))
        )}
      </Panel>

      {/* Expenses panel */}
      <Panel title="Expenses" total={totalExpenses || null} onAdd={() => onAdd('expense')}>
        {expenses.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-4">No expenses added yet.</p>
        ) : (
          expenses.map((exp, i) => (
            <ItemRow key={i} label={exp.type || exp.label || 'Expense'} amount={exp.amount} onExpand={() => {}} />
          ))
        )}
      </Panel>
    </div>
  );
}

// ── Placeholder views for other sections ──────────────────────────────────

function PlaceholderView({ label }) {
  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="text-center text-gray-400">
        <p className="text-4xl mb-3">🚧</p>
        <p className="text-sm font-semibold">{label} — Coming Soon</p>
        <p className="text-xs mt-1">This section will be built in a future stage.</p>
      </div>
    </div>
  );
}

// ── MODELLING / PROCEED placeholders ──────────────────────────────────────

function ModellingView() {
  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="text-center text-gray-400">
        <p className="text-4xl mb-3">📈</p>
        <p className="text-sm font-semibold">Modelling — Coming Soon</p>
        <p className="text-xs mt-1">Cash-flow projections and scenario modelling.</p>
      </div>
    </div>
  );
}

function ProceedView({ onComplete, data }) {
  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="text-center max-w-sm">
        <p className="text-4xl mb-4">✅</p>
        <p className="text-base font-bold text-gray-800 mb-2">FNS Complete</p>
        <p className="text-sm text-gray-500 mb-6">
          Financial Needs Statement captured. Proceed to product selection.
        </p>
        <button
          onClick={() => onComplete(data)}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-8 py-3 rounded-xl transition-colors"
        >
          Proceed to Product Selection →
        </button>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// ROOT COMPONENT
// ══════════════════════════════════════════════════════════════════════════

export default function FinancialNeedsStatement({
  clientProfile = {},
  initialData   = {},
  onChange,
  onComplete,
  onBack,
}) {
  const [topTab,        setTopTab]        = useState('FINANCIALS');
  const [activeSection, setActiveSection] = useState('assets');
  const [view,          setView]          = useState('current');
  const [data,          setData]          = useState({
    assets:      initialData.assets      || [],
    incomes:     initialData.incomes     || [],
    expenses:    initialData.expenses    || [],
    liabilities: initialData.liabilities || [],
    goals:       initialData.goals       || [],
  });

  const update = (patch) => {
    const next = { ...data, ...patch };
    setData(next);
    onChange?.({ ...next, calcType: 'fns' });
  };

  // Stub for add — will be fleshed out in Stage 2
  const handleAdd = (type) => {
    alert(`Add ${type} — full form coming in Stage 2.`);
  };

  // Render right-hand content based on top tab + active sidebar section
  const renderContent = () => {
    if (topTab === 'MODELLING') return <ModellingView />;
    if (topTab === 'PROCEED')   return <ProceedView onComplete={onComplete} data={{ ...data, calcType: 'fns' }} />;

    // FINANCIALS tab
    switch (activeSection) {
      case 'assets':
      case 'incomes':
      case 'expenses':
        return <FinancialsView data={data} onAdd={handleAdd} />;
      default:
        return <PlaceholderView label={SIDEBAR_SECTIONS.find(s => s.id === activeSection)?.label || activeSection} />;
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      {/* Top nav */}
      <TopNav active={topTab} onChange={setTopTab} />

      <div className="flex" style={{ minHeight: '520px' }}>
        {/* Sidebar */}
        <Sidebar
          activeSection={activeSection}
          onChange={setActiveSection}
          onBack={onBack}
        />

        {/* Main area */}
        <div className="flex-1 flex flex-col bg-gray-50 rounded-r-xl overflow-hidden border border-gray-200 border-l-0">
          <ClientHeader
            clientProfile={clientProfile}
            view={view}
            onViewChange={setView}
          />
          {renderContent()}
        </div>
      </div>
    </div>
  );
}
