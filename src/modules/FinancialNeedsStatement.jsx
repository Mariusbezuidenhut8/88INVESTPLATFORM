/**
 * FinancialNeedsStatement.jsx — FNS Calculator (Stage 2: Data Entry)
 *
 * Financials layout mirroring Integrate FNA:
 *   Overview  — 3-panel (Assets · Incomes · Expenses) with inline add dropdowns
 *   Section   — sidebar donut + detail table when a section is active
 *   Modals    — per-type edit forms for Assets, Incomes, Expenses, Liabilities, Goals
 */

import { useState } from 'react';

// ── Type lists ─────────────────────────────────────────────────────────────

const ASSET_TYPES = [
  'Pension Fund', 'Provident Fund', 'Retirement Annuity',
  'Preservation Pension Fund', 'Preservation Provident Fund',
  'Living Annuity', 'Linked Investment', 'Shares',
  'Tax-free Investment', 'Savings Account', 'Endowment',
  'Business Interest', 'Vehicle', 'Property', 'Other',
];

const INCOME_TYPES = ['Investment Income', 'Rental', 'Salary', 'Other'];

const EXPENSE_TYPES = [
  'Debt Repayment', 'Insurance Premium', 'Investment Contributions',
  'Living Expenses', 'Medical', 'Other',
];

const LIABILITY_TYPES = ['Bond', 'Vehicle Finance', 'Personal Loan', 'Credit Card', 'Other'];

const LIFESTYLE_CATEGORIES = [
  'Other', 'Housing', 'Transport', 'Education', 'Healthcare',
  'Entertainment', 'Food & Groceries', 'Clothing', 'Travel',
];

const SECTION_COLORS = {
  goals:       '#14B8A6',
  assets:      '#3B82F6',
  incomes:     '#22C55E',
  expenses:    '#EC4899',
  liabilities: '#F97316',
};

const SECTION_LABELS = {
  goals: 'Goals', assets: 'Assets', incomes: 'Incomes',
  expenses: 'Expenses', liabilities: 'Liabilities',
};

// ── Helpers ────────────────────────────────────────────────────────────────

function fmt(n) {
  if (n == null || n === '' || isNaN(Number(n))) return '—';
  return `R${Number(n).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function clientLabel(profile = {}) {
  const name = [profile.firstNames, profile.surname].filter(Boolean).join(' ').toUpperCase() || 'CLIENT';
  const age  = profile.age ? ` (${profile.age})` : '';
  return `${name}${age}`;
}

function groupByType(items) {
  const map = new Map();
  items.forEach((item, idx) => {
    const key = item.type || 'Other';
    if (!map.has(key)) map.set(key, []);
    map.get(key).push({ ...item, _idx: idx });
  });
  return map;
}

function itemValue(it) {
  return Number(it.value || it.amount || it.balance || 0);
}

// ── Donut chart ────────────────────────────────────────────────────────────

function DonutChart({ value = 0, color, size = 120, stroke = 16 }) {
  const r    = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const fill = value > 0 ? circ * 0.78 : 0;

  const label = value === 0 ? '00.00'
    : value >= 1_000_000
      ? `${(value / 1_000_000).toFixed(2)}m`
      : value.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#374151" strokeWidth={stroke} />
      {value > 0 && (
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={`${fill} ${circ}`}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      )}
      <text
        x={size / 2} y={size / 2}
        textAnchor="middle" dominantBaseline="middle"
        fill="white" fontSize="9" fontWeight="600"
      >
        {label}
      </text>
    </svg>
  );
}

// ── Modal shell ────────────────────────────────────────────────────────────

function Modal({ title, onCancel, onSave, onDelete, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <p className="text-sm font-bold text-gray-800">{title}</p>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
        </div>
        <div className="px-5 py-4 max-h-[60vh] overflow-y-auto space-y-4">
          {children}
        </div>
        <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 bg-gray-50">
          <div className="flex gap-2">
            <button onClick={onCancel} className="text-xs text-gray-500 hover:text-gray-700 px-4 py-2 uppercase tracking-wide">
              Cancel
            </button>
            {onDelete && (
              <button onClick={onDelete} className="text-xs text-red-500 hover:text-red-700 px-4 py-2 uppercase tracking-wide">
                Delete
              </button>
            )}
          </div>
          <button
            onClick={onSave}
            className="bg-teal-500 hover:bg-teal-600 text-white text-xs font-bold px-6 py-2 rounded-lg transition-colors uppercase tracking-wide"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Form primitives ────────────────────────────────────────────────────────

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 mb-1">{label}</label>
      {children}
    </div>
  );
}

function TInput({ value, onChange, placeholder }) {
  return (
    <input type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-blue-400" />
  );
}

function NInput({ value, onChange }) {
  return (
    <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden focus-within:border-blue-400">
      <span className="px-3 py-2 text-sm text-gray-400 bg-gray-50 border-r border-gray-200">R</span>
      <input type="number" value={value} onChange={e => onChange(e.target.value)} placeholder="0.00"
        className="flex-1 px-3 py-2 text-sm text-gray-800 focus:outline-none" />
    </div>
  );
}

function PctInput({ value, onChange }) {
  return (
    <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden focus-within:border-blue-400">
      <input type="number" value={value} onChange={e => onChange(e.target.value)} placeholder="0.00"
        className="flex-1 px-3 py-2 text-sm text-gray-800 focus:outline-none" />
      <span className="px-3 py-2 text-sm text-gray-400 bg-gray-50 border-l border-gray-200">%</span>
    </div>
  );
}

function TArea({ value, onChange, rows = 2 }) {
  return (
    <textarea value={value} onChange={e => onChange(e.target.value)} rows={rows}
      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-blue-400 resize-none" />
  );
}

function Sel({ value, onChange, options }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)}
      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-blue-400 bg-white">
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}

// ── Modals ─────────────────────────────────────────────────────────────────

function AssetModal({ item, isNew, onSave, onCancel, onDelete }) {
  const [f, setF] = useState({ type: item.type || ASSET_TYPES[0], description: item.description || '', value: item.value || '' });
  const s = k => v => setF(p => ({ ...p, [k]: v }));
  return (
    <Modal title={`${isNew ? 'Add' : 'Edit'} Asset | ${f.type}`} onCancel={onCancel} onSave={() => onSave(f)} onDelete={!isNew ? onDelete : undefined}>
      <Field label="Asset Type"><Sel value={f.type} onChange={s('type')} options={ASSET_TYPES} /></Field>
      <Field label="Description (optional)"><TInput value={f.description} onChange={s('description')} placeholder="e.g. Allan Gray Living Annuity" /></Field>
      <Field label="Current Value"><NInput value={f.value} onChange={s('value')} /></Field>
    </Modal>
  );
}

function IncomeModal({ item, isNew, onSave, onCancel, onDelete }) {
  const [f, setF] = useState({ type: item.type || INCOME_TYPES[0], description: item.description || '', amount: item.amount || '' });
  const s = k => v => setF(p => ({ ...p, [k]: v }));
  return (
    <Modal title={`${isNew ? 'Add' : 'Edit'} Income | ${f.type}`} onCancel={onCancel} onSave={() => onSave(f)} onDelete={!isNew ? onDelete : undefined}>
      <Field label="Income Type"><Sel value={f.type} onChange={s('type')} options={INCOME_TYPES} /></Field>
      <Field label="Description (optional)"><TInput value={f.description} onChange={s('description')} placeholder="e.g. Dividend income from portfolio" /></Field>
      <Field label="Monthly Amount"><NInput value={f.amount} onChange={s('amount')} /></Field>
      {Number(f.amount) > 0 && <p className="text-xs text-gray-400">Annual: {fmt(Number(f.amount) * 12)}</p>}
    </Modal>
  );
}

function ExpenseModal({ item, isNew, onSave, onCancel, onDelete }) {
  const [f, setF] = useState({ type: item.type || EXPENSE_TYPES[0], description: item.description || '', amount: item.amount || '' });
  const s = k => v => setF(p => ({ ...p, [k]: v }));
  return (
    <Modal title={`${isNew ? 'Add' : 'Edit'} Expense | ${f.type}`} onCancel={onCancel} onSave={() => onSave(f)} onDelete={!isNew ? onDelete : undefined}>
      <Field label="Expense Type"><Sel value={f.type} onChange={s('type')} options={EXPENSE_TYPES} /></Field>
      <Field label="Description (optional)"><TInput value={f.description} onChange={s('description')} placeholder="e.g. Monthly bond repayment" /></Field>
      <Field label="Monthly Amount"><NInput value={f.amount} onChange={s('amount')} /></Field>
      {Number(f.amount) > 0 && <p className="text-xs text-gray-400">Annual: {fmt(Number(f.amount) * 12)}</p>}
    </Modal>
  );
}

function LiabilityModal({ item, isNew, onSave, onCancel, onDelete }) {
  const [f, setF] = useState({ type: item.type || LIABILITY_TYPES[0], description: item.description || '', balance: item.balance || '', monthly: item.monthly || '', rate: item.rate || '' });
  const s = k => v => setF(p => ({ ...p, [k]: v }));
  return (
    <Modal title={`${isNew ? 'Add' : 'Edit'} Liability | ${f.type}`} onCancel={onCancel} onSave={() => onSave(f)} onDelete={!isNew ? onDelete : undefined}>
      <Field label="Liability Type"><Sel value={f.type} onChange={s('type')} options={LIABILITY_TYPES} /></Field>
      <Field label="Description (optional)"><TInput value={f.description} onChange={s('description')} placeholder="e.g. FNB Home Loan" /></Field>
      <Field label="Outstanding Balance"><NInput value={f.balance} onChange={s('balance')} /></Field>
      <Field label="Monthly Repayment"><NInput value={f.monthly} onChange={s('monthly')} /></Field>
      <Field label="Interest Rate"><PctInput value={f.rate} onChange={s('rate')} /></Field>
    </Modal>
  );
}

function GoalModal({ item, isNew, onSave, onCancel, onDelete }) {
  const [f, setF] = useState({
    name:        item.name        || 'New Goal',
    description: item.description || 'Goals',
    value:       item.value       || '',
    category:    item.category    || 'Other',
    fundWith:    item.fundWith    || 'Liquid Capital',
  });
  const s = k => v => setF(p => ({ ...p, [k]: v }));
  return (
    <Modal title={`${isNew ? 'Add' : 'Edit'} Goal | ${f.name}`} onCancel={onCancel} onSave={() => onSave(f)} onDelete={!isNew ? onDelete : undefined}>
      <div className="flex gap-5">
        {/* Left nav (matches Integrate) */}
        <div className="w-28 flex-shrink-0 border-r border-gray-100 pr-4 pt-1">
          <p className="text-xs text-gray-400 uppercase font-semibold mb-2">Goal Details</p>
          <p className="text-xs text-gray-600 font-medium">{f.name || 'Other'}</p>
        </div>
        {/* Fields */}
        <div className="flex-1 space-y-4">
          <p className="text-sm font-bold text-gray-700">{f.name || 'Other'} Details</p>
          <Field label="Name:"><TInput value={f.name} onChange={s('name')} /></Field>
          <Field label="Description:"><TArea value={f.description} onChange={s('description')} /></Field>
          <Field label="Goal Value:"><NInput value={f.value} onChange={s('value')} /></Field>
          <Field label="Lifestyle Category:"><Sel value={f.category} onChange={s('category')} options={LIFESTYLE_CATEGORIES} /></Field>
          <Field label="How do you want to fund your goal?">
            <div className="flex gap-6 mt-1">
              {['Liquid Capital', 'Income'].map(opt => (
                <label key={opt} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input type="radio" name="fundWith" value={opt} checked={f.fundWith === opt}
                    onChange={() => s('fundWith')(opt)} className="accent-teal-500" />
                  {opt}
                </label>
              ))}
            </div>
          </Field>
        </div>
      </div>
    </Modal>
  );
}

// ── Top nav ────────────────────────────────────────────────────────────────

const TOP_TABS = ['FINANCIALS', 'MODELLING', 'PROCEED'];

function TopNav({ active, onChange }) {
  return (
    <div className="flex items-center border-b border-gray-200 bg-white px-4">
      {TOP_TABS.map(tab => (
        <button key={tab} onClick={() => onChange(tab)}
          className={`px-5 py-3 text-sm font-semibold tracking-wide transition-colors border-b-2 -mb-px
            ${active === tab ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-500 hover:text-gray-800'}`}>
          {tab}
        </button>
      ))}
    </div>
  );
}

// ── Overview sidebar (all sections listed) ─────────────────────────────────

const SIDEBAR_SECTIONS = [
  { id: 'goals',       label: 'Goals'       },
  { id: 'assets',      label: 'Assets'      },
  { id: 'incomes',     label: 'Incomes'     },
  { id: 'expenses',    label: 'Expenses'    },
  { id: 'liabilities', label: 'Liabilities' },
];

function OverviewSidebar({ onSectionClick, onBack }) {
  return (
    <aside className="w-52 flex-shrink-0 bg-gray-800 text-white flex flex-col rounded-l-xl overflow-hidden">
      <button onClick={onBack}
        className="flex items-center gap-2 px-4 py-3 text-xs text-gray-400 hover:text-white hover:bg-gray-700 transition-colors border-b border-gray-700">
        ‹ Back to Analysis
      </button>
      <nav className="flex-1 py-2">
        {SIDEBAR_SECTIONS.map(sec => (
          <button key={sec.id} onClick={() => onSectionClick(sec.id)}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-400 hover:bg-gray-700 hover:text-white transition-colors text-left border-l-4 border-transparent">
            {sec.label}
            <span className="ml-auto text-gray-600">›</span>
          </button>
        ))}
      </nav>
      <div className="px-4 py-3 border-t border-gray-700 flex items-center gap-2 text-gray-500 text-xs">
        <span className="text-sm">A</span><span className="text-base font-bold">A</span><span className="ml-1">16</span>
      </div>
    </aside>
  );
}

// ── Section detail sidebar (with donut + add menu) ─────────────────────────

function SectionSidebar({ section, total, onBack, onAdd, goalsTab, onGoalsTabChange }) {
  const [showAdd, setShowAdd] = useState(false);
  const color  = SECTION_COLORS[section] || '#3B82F6';
  const label  = SECTION_LABELS[section] || section;
  const types  = section === 'assets'      ? ASSET_TYPES
               : section === 'incomes'     ? INCOME_TYPES
               : section === 'expenses'    ? EXPENSE_TYPES
               : section === 'liabilities' ? LIABILITY_TYPES
               : ['Other'];

  return (
    <aside className="w-52 flex-shrink-0 bg-gray-800 text-white flex flex-col rounded-l-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-3 border-b border-gray-700">
        <button onClick={onBack}
          className="flex items-center gap-1 text-xs text-gray-400 hover:text-white transition-colors">
          ‹ {label}
        </button>
        <div className="relative">
          <button
            onClick={() => setShowAdd(v => !v)}
            className="w-6 h-6 rounded-full bg-teal-500 hover:bg-teal-400 flex items-center justify-center text-white text-xl leading-none transition-colors">
            {showAdd ? '×' : '+'}
          </button>
          {showAdd && (
            <div className="absolute z-50 top-full right-0 mt-1 w-56 bg-white border border-gray-200 rounded-lg shadow-2xl overflow-hidden">
              <div className="flex items-center justify-between px-3 py-2 bg-gray-50 border-b border-gray-100">
                <span className="text-xs font-semibold text-gray-500 uppercase">Add {label}</span>
                <button onClick={() => setShowAdd(false)} className="text-gray-400 hover:text-gray-700 text-lg leading-none">×</button>
              </div>
              {types.map(t => (
                <button key={t} onClick={() => { setShowAdd(false); onAdd(t); }}
                  className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors">
                  {t}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Goals tabs */}
      {section === 'goals' && (
        <div className="flex border-b border-gray-700">
          {['GOALS', 'LIFESTYLE'].map(tab => (
            <button key={tab} onClick={() => onGoalsTabChange?.(tab)}
              className={`flex-1 py-2 text-xs font-semibold transition-colors
                ${goalsTab === tab ? 'text-white border-b-2 border-teal-400' : 'text-gray-500 hover:text-gray-300'}`}>
              {tab}
            </button>
          ))}
        </div>
      )}

      {/* Donut */}
      <div className="flex-1 flex flex-col items-center justify-center py-6 gap-2">
        <p className="text-xs text-gray-400 uppercase tracking-wide">All {label}</p>
        <DonutChart value={total} color={color} />
      </div>

      <div className="px-4 py-3 border-t border-gray-700 flex items-center gap-2 text-gray-500 text-xs">
        <span className="text-sm">A</span><span className="text-base font-bold">A</span><span className="ml-1">16</span>
      </div>
    </aside>
  );
}

// ── Client header bar ──────────────────────────────────────────────────────

function ClientHeader({ section, clientProfile, view, onViewChange }) {
  const label = section ? (SECTION_LABELS[section] || section).toUpperCase() : 'FINANCIALS';
  return (
    <div className="flex items-center justify-between bg-blue-50 border-b border-blue-100 px-5 py-2.5">
      <div className="flex items-center gap-3 text-sm font-semibold text-gray-700 uppercase tracking-wide">
        <span className="text-blue-600 font-bold">{label}</span>
        <span className="text-gray-400">|</span>
        <span>{clientLabel(clientProfile)}</span>
        <span className="text-gray-400">|</span>
        <span className="text-blue-700 cursor-pointer">{view === 'current' ? 'CURRENT' : 'PLANNED'} ▼</span>
      </div>
      <div className="flex items-center gap-1">
        {['CURRENT', 'PLANNED'].map(v => (
          <button key={v} onClick={() => onViewChange(v.toLowerCase())}
            className={`text-xs px-3 py-1.5 rounded font-semibold transition-colors
              ${view === v.toLowerCase() ? 'bg-blue-600 text-white' : 'text-gray-500 hover:text-gray-800'}`}>
            {v}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Overview panel (one of three side-by-side) ─────────────────────────────

function OverviewPanel({ section, title, items, openMenu, setOpenMenu, onAdd, onEdit }) {
  const total = items.reduce((s, it) => s + itemValue(it), 0);
  const groups = groupByType(items);
  const [expanded, setExpanded] = useState({});
  const isOpen = openMenu === section;
  const types  = section === 'assets'  ? ASSET_TYPES
               : section === 'incomes' ? INCOME_TYPES
               : EXPENSE_TYPES;

  return (
    <div className="flex-1 min-w-0 bg-white border border-gray-200 rounded-xl overflow-visible flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">{title}</p>
          {total > 0 && <p className="text-sm font-bold text-gray-800 mt-0.5">{fmt(total)}</p>}
        </div>
        <div className="relative">
          <button onClick={() => setOpenMenu(isOpen ? null : section)}
            className="w-7 h-7 rounded-full bg-blue-500 hover:bg-blue-600 text-white flex items-center justify-center text-xl leading-none transition-colors">
            {isOpen ? '×' : '+'}
          </button>
          {isOpen && (
            <div className="absolute z-50 top-full right-0 mt-1 w-56 bg-white border border-gray-200 rounded-lg shadow-2xl overflow-hidden">
              {types.map(t => (
                <button key={t} onClick={() => { setOpenMenu(null); onAdd(section, t); }}
                  className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors">
                  {t}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Item groups */}
      <div className="flex-1 p-3 space-y-1.5 overflow-y-auto">
        {groups.size === 0 ? (
          <p className="text-xs text-gray-400 text-center py-6">No {title.toLowerCase()} added yet.</p>
        ) : (
          Array.from(groups.entries()).map(([type, typeItems]) => {
            const gTotal = typeItems.reduce((s, it) => s + itemValue(it), 0);
            const isExp  = expanded[type];
            const plural = typeItems.length > 1 ? (type.endsWith('y') ? type.slice(0,-1)+'ies' : type+'s') : type;
            return (
              <div key={type}>
                <button onClick={() => setExpanded(e => ({ ...e, [type]: !e[type] }))}
                  className="w-full flex items-center justify-between bg-gray-50 hover:bg-blue-50 border border-gray-100 rounded-lg px-3 py-2.5 text-left transition-colors group">
                  <span className="text-sm font-semibold text-gray-700 group-hover:text-blue-700">{plural}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">{fmt(gTotal)}</span>
                    <span className="text-gray-400 text-xs">{isExp ? '∧' : '∨'}</span>
                  </div>
                </button>
                {isExp && typeItems.map(it => (
                  <div key={it._idx} className="ml-3 mt-1 flex items-center justify-between bg-white border border-gray-100 rounded-lg px-3 py-2">
                    <span className="text-xs text-gray-600">{it.description || type}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-semibold text-gray-700">{fmt(itemValue(it))}</span>
                      <button onClick={() => onEdit(section, it._idx)} className="text-xs text-blue-500 hover:text-blue-700">Edit</button>
                    </div>
                  </div>
                ))}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ── Section detail table ───────────────────────────────────────────────────

function SectionTable({ section, items, onEdit }) {
  const [expanded, setExpanded] = useState({});
  const groups   = groupByType(items);
  const totalAll = items.reduce((s, it) => s + itemValue(it), 0);

  if (section === 'liabilities' && items.length === 0) {
    return (
      <div className="flex-1 p-6">
        <table className="w-full border-collapse mb-4">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="w-6 pb-2" />
              <th className="text-left text-xs font-semibold text-gray-500 pb-2">Name</th>
              <th className="text-right text-xs font-semibold text-gray-500 pb-2 w-36">Current</th>
            </tr>
          </thead>
        </table>
        <div className="text-center py-10 text-sm text-gray-500">
          <p>You have not added any Liabilities yet.</p>
          <p className="mt-1 text-xs">To add a Liability, click the <strong>plus button</strong> on the left hand menu.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 overflow-y-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="w-6 pb-2">
              <input type="checkbox" disabled className="opacity-30" />
            </th>
            <th className="text-left text-xs font-semibold text-gray-500 pb-2">Name</th>
            <th className="text-right text-xs font-semibold text-gray-500 pb-2 w-40">Current</th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0 ? (
            <tr><td colSpan={3} className="py-10 text-center text-sm text-gray-400">No items added yet.</td></tr>
          ) : (
            Array.from(groups.entries()).map(([type, typeItems]) => {
              const gTotal = typeItems.reduce((s, it) => s + itemValue(it), 0);
              const isExp  = expanded[type];
              const plural = typeItems.length > 1 ? (type.endsWith('y') ? type.slice(0,-1)+'ies' : type+'s') : type;
              return [
                <tr key={`g-${type}`}
                  className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                  onClick={() => setExpanded(e => ({ ...e, [type]: !e[type] }))}>
                  <td className="py-3 pr-2 text-gray-400 text-xs">{isExp ? '▾' : '▸'}</td>
                  <td className="py-3 text-sm font-semibold text-gray-800">{plural}</td>
                  <td className="py-3 text-sm text-right text-gray-800">
                    {Number(gTotal).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                  </td>
                </tr>,
                ...(isExp ? typeItems.map(it => (
                  <tr key={`i-${it._idx}`} className="border-b border-gray-50 bg-gray-50">
                    <td />
                    <td className="py-2 pl-5 text-sm text-gray-600">
                      {it.description || type}
                    </td>
                    <td className="py-2 text-sm text-right">
                      <div className="flex items-center justify-end gap-3">
                        <span className="text-gray-700">
                          {Number(itemValue(it)).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                        </span>
                        <button
                          onClick={e => { e.stopPropagation(); onEdit(it._idx); }}
                          className="text-xs text-blue-500 hover:text-blue-700">
                          Edit
                        </button>
                      </div>
                    </td>
                  </tr>
                )) : [])
              ];
            })
          )}
          {section === 'assets' && totalAll > 0 && (
            <tr className="border-t-2 border-gray-200">
              <td /><td className="py-3 text-sm font-bold text-gray-800">Total Assets:</td>
              <td className="py-3 text-sm font-bold text-right text-gray-800">
                R {Number(totalAll).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

// ── Goals table ────────────────────────────────────────────────────────────

function GoalsTable({ goals, onEdit }) {
  return (
    <div className="flex-1 p-6 overflow-y-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="w-6 pb-2"><input type="checkbox" disabled className="opacity-30" /></th>
            <th className="text-left text-xs font-semibold text-gray-500 pb-2">Name</th>
            <th className="text-right text-xs font-semibold text-gray-500 pb-2 w-36">Current</th>
          </tr>
        </thead>
        <tbody>
          {goals.length === 0 ? (
            <tr><td colSpan={3} className="py-10 text-center text-sm text-gray-400">No goals added yet.</td></tr>
          ) : (
            goals.map((g, i) => (
              <tr key={i} className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer" onClick={() => onEdit(i)}>
                <td className="py-3 text-gray-400 text-xs">›</td>
                <td className="py-3 text-sm text-gray-800">{g.name || 'Other'}</td>
                <td className="py-3 text-sm text-right text-gray-800">
                  {Number(g.value || 0).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

// ── Stub views ─────────────────────────────────────────────────────────────

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
  const totalAssets   = data.assets.reduce((s, a) => s + (Number(a.value) || 0), 0);
  const totalIncomes  = data.incomes.reduce((s, i) => s + (Number(i.amount) || 0), 0);
  const totalExpenses = data.expenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);
  const surplus = totalIncomes - totalExpenses;

  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="text-center max-w-sm">
        <p className="text-4xl mb-4">✅</p>
        <p className="text-base font-bold text-gray-800 mb-4">FNS Complete</p>
        <div className="bg-gray-50 rounded-xl p-4 text-left mb-6 space-y-2">
          <div className="flex justify-between text-sm"><span className="text-gray-500">Total Assets</span><span className="font-semibold">{fmt(totalAssets)}</span></div>
          <div className="flex justify-between text-sm"><span className="text-gray-500">Monthly Income</span><span className="font-semibold text-green-600">{fmt(totalIncomes)}</span></div>
          <div className="flex justify-between text-sm"><span className="text-gray-500">Monthly Expenses</span><span className="font-semibold text-pink-600">{fmt(totalExpenses)}</span></div>
          <div className="flex justify-between text-sm border-t border-gray-200 pt-2 mt-2">
            <span className="text-gray-700 font-semibold">Monthly Surplus/Deficit</span>
            <span className={`font-bold ${surplus >= 0 ? 'text-green-600' : 'text-red-600'}`}>{fmt(surplus)}</span>
          </div>
        </div>
        <button onClick={() => onComplete(data)}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-8 py-3 rounded-xl transition-colors w-full">
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
  const [topTab,     setTopTab]     = useState('FINANCIALS');
  const [section,    setSection]    = useState(null);
  const [view,       setView]       = useState('current');
  const [goalsTab,   setGoalsTab]   = useState('GOALS');
  const [openMenu,   setOpenMenu]   = useState(null);
  const [modal,      setModal]      = useState(null);

  const [data, setData] = useState({
    assets:      initialData.assets      || [],
    incomes:     initialData.incomes     || [],
    expenses:    initialData.expenses    || [],
    liabilities: initialData.liabilities || [],
    goals:       initialData.goals       || [],
  });

  // ── CRUD ─────────────────────────────────────────────────────────────────

  const handleAdd = (sec, type) => {
    const blank = sec === 'goals'
      ? { name: 'New Goal', description: 'Goals', value: '', category: 'Other', fundWith: 'Liquid Capital' }
      : sec === 'assets'
        ? { type, description: '', value: '' }
        : sec === 'liabilities'
          ? { type, description: '', balance: '', monthly: '', rate: '' }
          : { type, description: '', amount: '' };
    setModal({ section: sec, idx: null, item: blank, isNew: true });
  };

  const handleEdit = (sec, idx) => {
    setModal({ section: sec, idx, item: { ...data[sec][idx] }, isNew: false });
  };

  const applyData = (patch) => {
    const next = { ...data, ...patch };
    setData(next);
    onChange?.({ ...next, calcType: 'fns' });
  };

  const handleSave = (formData) => {
    const sec = modal.section;
    const arr = [...data[sec]];
    if (modal.isNew) arr.push(formData);
    else arr[modal.idx] = formData;
    applyData({ [sec]: arr });
    setModal(null);
  };

  const handleDelete = () => {
    const sec = modal.section;
    applyData({ [sec]: data[sec].filter((_, i) => i !== modal.idx) });
    setModal(null);
  };

  // ── Totals ────────────────────────────────────────────────────────────────

  const totals = {
    assets:      data.assets.reduce((s, a) => s + (Number(a.value) || 0), 0),
    incomes:     data.incomes.reduce((s, i) => s + (Number(i.amount) || 0), 0),
    expenses:    data.expenses.reduce((s, e) => s + (Number(e.amount) || 0), 0),
    liabilities: data.liabilities.reduce((s, l) => s + (Number(l.balance) || 0), 0),
    goals:       data.goals.reduce((s, g) => s + (Number(g.value) || 0), 0),
  };

  // ── Renderers ─────────────────────────────────────────────────────────────

  const renderSidebar = () => {
    if (topTab !== 'FINANCIALS' || section === null) {
      return <OverviewSidebar onSectionClick={s => setSection(s)} onBack={onBack} />;
    }
    return (
      <SectionSidebar
        section={section}
        total={totals[section]}
        onBack={() => setSection(null)}
        onAdd={type => handleAdd(section, type)}
        goalsTab={goalsTab}
        onGoalsTabChange={setGoalsTab}
      />
    );
  };

  const renderContent = () => {
    if (topTab === 'MODELLING') return <ModellingView />;
    if (topTab === 'PROCEED')   return <ProceedView onComplete={onComplete} data={{ ...data, calcType: 'fns' }} />;

    if (section === null) {
      return (
        <div className="flex gap-4 p-4 flex-1 overflow-x-auto">
          <OverviewPanel section="assets"   title="Assets"   items={data.assets}   openMenu={openMenu} setOpenMenu={setOpenMenu} onAdd={handleAdd} onEdit={handleEdit} />
          <OverviewPanel section="incomes"  title="Incomes"  items={data.incomes}  openMenu={openMenu} setOpenMenu={setOpenMenu} onAdd={handleAdd} onEdit={handleEdit} />
          <OverviewPanel section="expenses" title="Expenses" items={data.expenses} openMenu={openMenu} setOpenMenu={setOpenMenu} onAdd={handleAdd} onEdit={handleEdit} />
        </div>
      );
    }

    if (section === 'goals') {
      return <GoalsTable goals={data.goals} onEdit={idx => handleEdit('goals', idx)} />;
    }

    return (
      <SectionTable section={section} items={data[section]} onEdit={idx => handleEdit(section, idx)} />
    );
  };

  const renderModal = () => {
    if (!modal) return null;
    const props = { item: modal.item, isNew: modal.isNew, onSave: handleSave, onCancel: () => setModal(null), onDelete: handleDelete };
    switch (modal.section) {
      case 'assets':      return <AssetModal      {...props} />;
      case 'incomes':     return <IncomeModal     {...props} />;
      case 'expenses':    return <ExpenseModal    {...props} />;
      case 'liabilities': return <LiabilityModal  {...props} />;
      case 'goals':       return <GoalModal       {...props} />;
      default:            return null;
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      <TopNav active={topTab} onChange={setTopTab} />

      <div className="flex" style={{ minHeight: '520px' }}>
        {renderSidebar()}

        <div className="flex-1 flex flex-col bg-gray-50 rounded-r-xl overflow-hidden border border-gray-200 border-l-0">
          <ClientHeader section={section} clientProfile={clientProfile} view={view} onViewChange={setView} />
          {renderContent()}
        </div>
      </div>

      {renderModal()}
    </div>
  );
}
