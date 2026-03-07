/**
 * DecisionTree.jsx — Investment ROA Builder v3
 *
 * Interactive step-by-step decision tree that guides the advisor through
 * the product selection process. Mirrors the 26-page Afrikaans PDF logic.
 *
 * Props:
 *   onRecommendation(result)  — called when a terminal node is reached
 *                               result: { productKey, productLabel, rationale, flags, path }
 *   onReset()                 — called when user clicks "Start Over"
 *   initialPath               — optional array of prior answers to restore state
 *   investmentAmount          — optional number, used to pre-fill split amounts
 *
 * The component is self-contained: it reads DECISION_TREE from productTree.js
 * and manages its own traversal state. On recommendation, it calls the parent
 * via onRecommendation so the ROA builder can proceed to provider scoring.
 */

import { useState, useCallback, useMemo } from 'react';
import { DECISION_TREE, getPathSummary, isWithinScoringModel } from '../data/productTree.js';
import { getProductLabel, getProductShort, formatCurrency } from '../shared/ui.js';
import { LIMITS } from '../data/productReference.js';

// ─── colour map per product key ───────────────────────────────────────────
const PRODUCT_COLOURS = {
  'RETIREMENT ANNUITY':       { bg: 'bg-blue-50',   border: 'border-blue-300',   text: 'text-blue-800',   badge: 'bg-blue-600' },
  'ENDOWMENT':                { bg: 'bg-purple-50',  border: 'border-purple-300', text: 'text-purple-800', badge: 'bg-purple-600' },
  'Living Annuity':           { bg: 'bg-green-50',   border: 'border-green-300',  text: 'text-green-800',  badge: 'bg-green-600' },
  'unit trust':               { bg: 'bg-teal-50',    border: 'border-teal-300',   text: 'text-teal-800',   badge: 'bg-teal-600' },
  'preservation nfund':       { bg: 'bg-indigo-50',  border: 'border-indigo-300', text: 'text-indigo-800', badge: 'bg-indigo-600' },
  'Tax-Free savings':         { bg: 'bg-amber-50',   border: 'border-amber-300',  text: 'text-amber-800',  badge: 'bg-amber-600' },
  'FIXED DEPOSIT':            { bg: 'bg-slate-50',   border: 'border-slate-300',  text: 'text-slate-800',  badge: 'bg-slate-600' },
  'RSA BONDS':                { bg: 'bg-emerald-50', border: 'border-emerald-300',text: 'text-emerald-800',badge: 'bg-emerald-600' },
  'MONEY MARKET':             { bg: 'bg-cyan-50',    border: 'border-cyan-300',   text: 'text-cyan-800',   badge: 'bg-cyan-600' },
  'GUARANTEED LIFE ANNUITY':  { bg: 'bg-rose-50',    border: 'border-rose-300',   text: 'text-rose-800',   badge: 'bg-rose-600' },
  'VOLUNTARY LIFE ANNUITY':   { bg: 'bg-pink-50',    border: 'border-pink-300',   text: 'text-pink-800',   badge: 'bg-pink-600' },
  'OFFSHORE UNIT TRUST':      { bg: 'bg-violet-50',  border: 'border-violet-300', text: 'text-violet-800', badge: 'bg-violet-600' },
  'ETF':                      { bg: 'bg-orange-50',  border: 'border-orange-300', text: 'text-orange-800', badge: 'bg-orange-600' },
};

const getColour = (key) => PRODUCT_COLOURS[key] || { bg: 'bg-gray-50', border: 'border-gray-300', text: 'text-gray-800', badge: 'bg-gray-600' };

// ─── product icons (emoji) ─────────────────────────────────────────────────
const PRODUCT_ICONS = {
  'RETIREMENT ANNUITY':       '🏦',
  'ENDOWMENT':                '📋',
  'Living Annuity':           '💰',
  'unit trust':               '📈',
  'preservation nfund':       '🔒',
  'Tax-Free savings':         '✨',
  'FIXED DEPOSIT':            '🏛️',
  'RSA BONDS':                '🇿🇦',
  'MONEY MARKET':             '💵',
  'GUARANTEED LIFE ANNUITY':  '🛡️',
  'VOLUNTARY LIFE ANNUITY':   '📊',
  'OFFSHORE UNIT TRUST':      '🌍',
  'ETF':                      '⚡',
};

// ─── Step progress bar ─────────────────────────────────────────────────────
const STEPS = [
  { n: 1, label: 'Primary Goal' },
  { n: 2, label: 'Time Horizon' },
  { n: 3, label: 'Vehicle Type' },
  { n: 4, label: 'Tax & Structure' },
  { n: 5, label: 'Recommendation' },
];

function ProgressBar({ currentStep }) {
  return (
    <div className="flex items-center gap-0 mb-8">
      {STEPS.map((s, i) => {
        const done   = currentStep > s.n;
        const active = currentStep === s.n;
        return (
          <div key={s.n} className="flex items-center flex-1">
            <div className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all
                ${done   ? 'bg-blue-600 border-blue-600 text-white'
                : active ? 'bg-white border-blue-600 text-blue-600'
                          : 'bg-white border-gray-200 text-gray-400'}`}>
                {done ? '✓' : s.n}
              </div>
              <span className={`text-xs mt-1 whitespace-nowrap ${active ? 'text-blue-700 font-semibold' : done ? 'text-blue-500' : 'text-gray-400'}`}>
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 mx-1 mb-5 transition-all ${done ? 'bg-blue-400' : 'bg-gray-200'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Breadcrumb trail ──────────────────────────────────────────────────────
function BreadcrumbTrail({ history, onJumpTo }) {
  if (!history.length) return null;
  return (
    <div className="flex flex-wrap items-center gap-1 text-xs text-gray-500 mb-6 bg-gray-50 rounded-lg px-3 py-2">
      <span className="font-medium text-gray-600">Path:</span>
      {history.map((h, i) => (
        <span key={i} className="flex items-center gap-1">
          <button
            onClick={() => onJumpTo(i)}
            className="hover:text-blue-600 hover:underline transition-colors"
            title="Jump back to this step"
          >
            {h.answer}
          </button>
          {i < history.length - 1 && <span className="text-gray-300">›</span>}
        </span>
      ))}
    </div>
  );
}

// ─── Context / Info box ────────────────────────────────────────────────────
function ContextBox({ text }) {
  if (!text) return null;
  return (
    <div className="flex gap-3 bg-blue-50 border border-blue-100 rounded-lg px-4 py-3 mb-5 text-sm text-blue-800">
      <span className="text-blue-400 text-base flex-shrink-0 mt-0.5">ℹ</span>
      <span>{text}</span>
    </div>
  );
}

// ─── Compliance flags ──────────────────────────────────────────────────────
function FlagPills({ flags }) {
  if (!flags?.length) return null;
  const FLAG_STYLES = {
    reg28:            'bg-indigo-100 text-indigo-700',
    two_pot:          'bg-blue-100 text-blue-700',
    illiquid:         'bg-red-100 text-red-700',
    tfsa_limit:       'bg-amber-100 text-amber-700',
    offshore:         'bg-violet-100 text-violet-700',
    estate_planning:  'bg-purple-100 text-purple-700',
    income_tax:       'bg-orange-100 text-orange-700',
    cgt:              'bg-green-100 text-green-700',
    no_reg28:         'bg-gray-100 text-gray-600',
  };
  const FLAG_LABELS = {
    reg28:            'Regulation 28',
    two_pot:          'Two-Pot System',
    illiquid:         'Illiquid to Age 55',
    tfsa_limit:       `TFSA: R${(LIMITS.tfsaAnnual/1000).toFixed(0)}k/yr limit`,
    offshore:         'Offshore Allowance Required',
    estate_planning:  'Estate Planning Benefit',
    income_tax:       'Taxable in Hands of Client',
    cgt:              `CGT Exclusion R${(LIMITS.cgtAnnualExclusion/1000).toFixed(0)}k`,
    no_reg28:         'No Reg 28 Restriction',
  };
  return (
    <div className="flex flex-wrap gap-2 mt-4">
      {flags.map(f => (
        <span key={f} className={`text-xs font-medium px-2 py-0.5 rounded-full ${FLAG_STYLES[f] || 'bg-gray-100 text-gray-600'}`}>
          {FLAG_LABELS[f] || f}
        </span>
      ))}
    </div>
  );
}

// ─── Allocation Plan Card ──────────────────────────────────────────────────
function AllocationCard({ node, path, onAccept, onReset, investmentAmount = 0 }) {
  const total = Number(investmentAmount) || 0;

  // Compute default amounts from allocation definitions
  const defaultAmounts = useMemo(() => {
    const amounts = {};
    let allocated = 0;
    // First pass: fixed amounts
    node.allocations.forEach(a => {
      if (a.amountType === 'fixed') {
        const amt = total > 0 ? Math.min(a.defaultAmount, total) : a.defaultAmount;
        amounts[a.productKey + a.amountType] = amt;
        allocated += amt;
      }
    });
    // Second pass: pct_remainder
    const remainder1 = Math.max(0, total - allocated);
    node.allocations.forEach(a => {
      if (a.amountType === 'pct_remainder') {
        const amt = total > 0 ? Math.round((remainder1 * (a.defaultPct / 100)) / 1000) * 1000 : 0;
        amounts[a.productKey + a.amountType] = amt;
        allocated += amt;
      }
    });
    // Third pass: remainder
    node.allocations.forEach(a => {
      if (a.amountType === 'remainder') {
        amounts[a.productKey + a.amountType] = Math.max(0, total - allocated);
      }
    });
    return amounts;
  }, [node.allocations, total]);

  const [amounts, setAmounts] = useState(defaultAmounts);

  const getKey = (a) => a.productKey + a.amountType;

  const setAmount = (a, val) => {
    const newVal = Number(val) || 0;
    const key = getKey(a);
    setAmounts(prev => {
      const next = { ...prev, [key]: newVal };
      // If there's a 'remainder' allocation, auto-adjust it
      const remainderAlloc = node.allocations.find(x => x.amountType === 'remainder');
      if (remainderAlloc && getKey(remainderAlloc) !== key) {
        const otherTotal = node.allocations
          .filter(x => x.amountType !== 'remainder')
          .reduce((s, x) => s + (next[getKey(x)] || 0), 0);
        next[getKey(remainderAlloc)] = Math.max(0, total - otherTotal);
      }
      return next;
    });
  };

  const allocatedTotal = node.allocations.reduce((s, a) => s + (amounts[getKey(a)] || 0), 0);
  const balanceOk = total === 0 || Math.abs(allocatedTotal - total) < 1;

  const handleConfirm = () => {
    const resolvedAllocations = node.allocations.map(a => ({
      productKey: a.productKey,
      productLabel: a.productLabel,
      amount: amounts[getKey(a)] || 0,
      reason: a.reason,
      scoreable: isWithinScoringModel(a.productKey),
    })).filter(a => a.amount > 0);

    onAccept({ type: 'allocation_plan', allocations: resolvedAllocations, rationale: node.rationale, flags: node.flags || [] }, path);
  };

  return (
    <div className="rounded-xl border-2 border-blue-300 bg-blue-50 p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-0.5">Recommended Portfolio Allocation</p>
          <h2 className="text-xl font-bold text-blue-800">Comprehensive Investment Plan</h2>
        </div>
        <span className="text-xs font-semibold bg-blue-600 text-white px-2 py-1 rounded-full flex-shrink-0">Multi-product</span>
      </div>

      {/* Rationale */}
      <div className="bg-white bg-opacity-70 rounded-lg px-4 py-3 mb-5">
        <p className="text-sm text-gray-700 leading-relaxed">{node.rationale}</p>
      </div>

      {/* Allocation table */}
      <div className="bg-white rounded-xl border border-blue-200 overflow-hidden mb-4">
        <div className="px-4 py-2.5 bg-blue-100 border-b border-blue-200 flex items-center justify-between">
          <p className="text-xs font-semibold text-blue-700 uppercase tracking-wider">Allocation Plan</p>
          {total > 0 && (
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${balanceOk ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
              {balanceOk ? `${formatCurrency(total)} fully allocated` : `Unallocated: ${formatCurrency(Math.abs(total - allocatedTotal))}`}
            </span>
          )}
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500">#</th>
              <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500">Product</th>
              <th className="text-right px-4 py-2 text-xs font-semibold text-gray-500">Amount</th>
            </tr>
          </thead>
          <tbody>
            {node.allocations.map((a, i) => {
              const key = getKey(a);
              const amt = amounts[key] || 0;
              const pct = total > 0 ? ((amt / total) * 100).toFixed(1) : null;
              const col = getColour(a.productKey);
              return (
                <tr key={key} className="border-b border-gray-50 last:border-0">
                  <td className="px-4 py-3 text-xs font-bold text-gray-400">{i + 1}</td>
                  <td className="px-4 py-3">
                    <p className={`text-sm font-semibold ${col.text}`}>{a.productLabel}</p>
                    <p className="text-xs text-gray-400 mt-0.5 leading-snug">{a.reason}</p>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex flex-col items-end gap-1">
                      {a.amountType !== 'remainder' ? (
                        <div className="relative w-36">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400">R</span>
                          <input
                            type="number"
                            min="0"
                            step="1000"
                            value={amt}
                            onChange={e => setAmount(a, e.target.value)}
                            className="w-full text-sm border border-gray-200 rounded-lg pl-6 pr-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-400 text-right"
                          />
                        </div>
                      ) : (
                        <p className="text-sm font-semibold text-gray-700">{formatCurrency(amt)}</p>
                      )}
                      {pct && <span className="text-xs text-gray-400">{pct}%</span>}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
          {total > 0 && (
            <tfoot>
              <tr className="bg-gray-50 border-t-2 border-gray-200">
                <td colSpan={2} className="px-4 py-2.5 text-sm font-bold text-gray-700">Total</td>
                <td className="px-4 py-2.5 text-right text-sm font-bold text-gray-700">{formatCurrency(allocatedTotal)}</td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* Path summary */}
      <div className="pt-4 border-t border-blue-200">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Decision Path</p>
        <div className="flex flex-wrap gap-1">
          {path.map((p, i) => (
            <span key={i} className="flex items-center gap-1 text-xs text-gray-500">
              <span className="bg-white border border-gray-200 rounded px-1.5 py-0.5">{p.answer}</span>
              {i < path.length - 1 && <span className="text-gray-300">›</span>}
            </span>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="flex gap-3 mt-6">
        <button
          onClick={handleConfirm}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-3 rounded-lg transition-colors text-sm"
        >
          Accept Allocation Plan →
        </button>
        <button
          onClick={onReset}
          className="px-4 py-3 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors"
        >
          Start Over
        </button>
      </div>
    </div>
  );
}

// ─── Secondary product options ─────────────────────────────────────────────
const ALL_SECONDARY_PRODUCTS = [
  { key: 'unit trust',          label: 'Unit Trust / Discretionary Investment' },
  { key: 'RETIREMENT ANNUITY',  label: 'Retirement Annuity (RA)' },
  { key: 'ENDOWMENT',           label: 'Endowment Policy' },
  { key: 'Tax-Free savings',    label: 'Tax-Free Savings Account (TFSA)' },
  { key: 'Living Annuity',      label: 'Living Annuity' },
  { key: 'preservation nfund',  label: 'Preservation Fund' },
  { key: 'FIXED DEPOSIT',       label: 'Fixed Deposit' },
  { key: 'MONEY MARKET',        label: 'Money Market / Call Account' },
  { key: 'RSA BONDS',           label: 'RSA Retail Savings Bonds' },
];

// ─── Recommendation card ───────────────────────────────────────────────────
function RecommendationCard({ node, path, onAccept, onReset, investmentAmount = 0 }) {
  const rec  = node.recommendation;
  const col  = getColour(rec.productKey);
  const icon = PRODUCT_ICONS[rec.productKey] || '📌';
  const scoreable = isWithinScoringModel(rec.productKey);

  // ── Split state ──
  const [showSplit,     setShowSplit]     = useState(false);
  const [secondaryKey,  setSecondaryKey]  = useState('unit trust');

  // Default primary amount: for TFSA use annual limit, for RA use deduction cap, else full amount
  const defaultPrimary = (() => {
    const amt = Number(investmentAmount) || 0;
    if (!amt) return 0;
    if (rec.productKey === 'Tax-Free savings') return Math.min(amt, LIMITS.tfsaAnnual);
    if (rec.productKey === 'RETIREMENT ANNUITY') return Math.min(amt, LIMITS.raDeductionCap);
    return amt;
  })();

  const [primaryAmt,   setPrimaryAmt]   = useState(defaultPrimary);
  const [secondaryAmt, setSecondaryAmt] = useState(
    investmentAmount > 0 ? Math.max(0, Number(investmentAmount) - defaultPrimary) : 0
  );

  const total = Number(investmentAmount) || 0;
  const balance = total - Number(primaryAmt || 0) - Number(secondaryAmt || 0);
  const balanceOk = Math.abs(balance) < 1;

  const handlePrimaryAmtChange = (val) => {
    const p = Number(val) || 0;
    setPrimaryAmt(p);
    if (total > 0) setSecondaryAmt(Math.max(0, total - p));
  };

  const handleSecondaryAmtChange = (val) => {
    const s = Number(val) || 0;
    setSecondaryAmt(s);
    if (total > 0) setPrimaryAmt(Math.max(0, total - s));
  };

  const splitConfig = showSplit ? {
    secondaryProductKey: secondaryKey,
    splitAmounts: { primary: Number(primaryAmt) || 0, secondary: Number(secondaryAmt) || 0 },
  } : null;

  // Filter out the primary product from secondary options
  const secondaryOptions = ALL_SECONDARY_PRODUCTS.filter(p => p.key !== rec.productKey);

  return (
    <div className={`rounded-xl border-2 ${col.border} ${col.bg} p-6`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{icon}</span>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-0.5">Decision Tree Recommendation</p>
            <h2 className={`text-xl font-bold ${col.text}`}>{getProductLabel(rec.productKey)}</h2>
          </div>
        </div>
        {scoreable && (
          <span className="text-xs font-semibold bg-green-600 text-white px-2 py-1 rounded-full">
            Provider scoring available
          </span>
        )}
      </div>

      {/* Rationale */}
      <div className="bg-white bg-opacity-70 rounded-lg px-4 py-3 mb-4">
        <p className="text-sm text-gray-700 leading-relaxed">{rec.rationale}</p>
      </div>

      {/* Flags */}
      <FlagPills flags={rec.flags} />

      {/* ── Split investment panel ── */}
      {!showSplit ? (
        <div className="mt-4">
          <button
            onClick={() => setShowSplit(true)}
            className="text-xs text-blue-600 hover:text-blue-800 border border-blue-200 bg-blue-50 hover:bg-blue-100 rounded-lg px-3 py-2 transition-colors flex items-center gap-1.5"
          >
            <span>+</span>
            <span>Split investment across two products</span>
          </button>
          {rec.flags?.includes('tfsa_limit') && total > LIMITS.tfsaAnnual && (
            <p className="text-xs text-amber-600 mt-2 bg-amber-50 border border-amber-100 rounded px-2.5 py-1.5">
              TFSA annual limit is {formatCurrency(LIMITS.tfsaAnnual)}. Consider investing the remainder in a second product.
            </p>
          )}
        </div>
      ) : (
        <div className="mt-4 bg-white bg-opacity-80 border border-gray-200 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Split Investment</p>
            <button onClick={() => setShowSplit(false)} className="text-xs text-gray-400 hover:text-gray-600">Remove split</button>
          </div>

          {/* Row 1: Primary product */}
          <div className="flex items-center gap-3 mb-2">
            <div className={`flex-1 text-xs font-semibold ${col.text} bg-white border ${col.border} rounded-lg px-3 py-2 truncate`}>
              {PRODUCT_ICONS[rec.productKey]} {getProductLabel(rec.productKey)}
            </div>
            <div className="relative flex-shrink-0 w-36">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400">R</span>
              <input
                type="number"
                min="0"
                step="1000"
                value={primaryAmt}
                onChange={e => handlePrimaryAmtChange(e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-lg pl-6 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 text-right"
              />
            </div>
          </div>

          {/* Row 2: Secondary product */}
          <div className="flex items-center gap-3 mb-3">
            <select
              value={secondaryKey}
              onChange={e => setSecondaryKey(e.target.value)}
              className="flex-1 text-xs border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
            >
              {secondaryOptions.map(p => (
                <option key={p.key} value={p.key}>{p.label}</option>
              ))}
            </select>
            <div className="relative flex-shrink-0 w-36">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400">R</span>
              <input
                type="number"
                min="0"
                step="1000"
                value={secondaryAmt}
                onChange={e => handleSecondaryAmtChange(e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-lg pl-6 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 text-right"
              />
            </div>
          </div>

          {/* Balance indicator */}
          {total > 0 && (
            <div className={`text-xs rounded-lg px-3 py-2 flex items-center justify-between ${
              balanceOk ? 'bg-green-50 text-green-700 border border-green-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
            }`}>
              <span>Total investment: {formatCurrency(total)}</span>
              <span className="font-semibold">
                {balanceOk ? 'Balanced' : `Unallocated: ${formatCurrency(Math.abs(balance))}`}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Path summary */}
      <div className="mt-5 pt-4 border-t border-gray-200">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Decision Path</p>
        <div className="flex flex-wrap gap-1">
          {path.map((p, i) => (
            <span key={i} className="flex items-center gap-1 text-xs text-gray-500">
              <span className="bg-white border border-gray-200 rounded px-1.5 py-0.5">{p.answer}</span>
              {i < path.length - 1 && <span className="text-gray-300">›</span>}
            </span>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="flex gap-3 mt-6">
        <button
          onClick={() => onAccept(rec, path, splitConfig)}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-3 rounded-lg transition-colors text-sm"
        >
          {splitConfig
            ? 'Continue — 2 Products →'
            : scoreable ? 'Continue to Provider Scoring →' : 'Accept Recommendation →'}
        </button>
        <button
          onClick={onReset}
          className="px-4 py-3 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors"
        >
          Start Over
        </button>
      </div>

      {!scoreable && !splitConfig && (
        <p className="text-xs text-gray-400 mt-3 text-center">
          This product type is outside the platform scoring model. The recommendation will be recorded in the ROA without provider comparison.
        </p>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════════════════════

export default function DecisionTree({ onRecommendation, onReset: externalReset, initialPath = [], investmentAmount = 0 }) {

  const [currentNodeId, setCurrentNodeId] = useState('root');
  const [history, setHistory]             = useState([]); // [{ nodeId, answer, selectedValue }]
  const [animating, setAnimating]         = useState(false);

  const currentNode = DECISION_TREE[currentNodeId];

  // ── Navigate to next node ──
  const handleSelect = useCallback((option) => {
    if (animating) return;
    setAnimating(true);

    const newHistory = [
      ...history,
      {
        nodeId:        currentNodeId,
        question:      currentNode.question,
        answer:        option.label,
        selectedValue: option.value,
      },
    ];
    setHistory(newHistory);

    setTimeout(() => {
      setCurrentNodeId(option.next);
      setAnimating(false);
    }, 150);
  }, [animating, history, currentNodeId, currentNode]);

  // ── Jump back to a prior step ──
  const handleJumpTo = useCallback((historyIndex) => {
    const targetNode = historyIndex === 0 ? 'root' : history[historyIndex].nodeId;
    setHistory(history.slice(0, historyIndex));
    setCurrentNodeId(targetNode);
  }, [history]);

  // ── Reset ──
  const handleReset = useCallback(() => {
    setCurrentNodeId('root');
    setHistory([]);
    if (externalReset) externalReset();
  }, [externalReset]);

  // ── Accept recommendation ──
  const handleAccept = useCallback((recOrPlan, path, splitConfig) => {
    if (!onRecommendation) return;

    // Allocation plan path
    if (recOrPlan?.type === 'allocation_plan') {
      const allocations = recOrPlan.allocations;
      // Primary = largest scoreable allocation; fallback to largest overall
      const scoreable = allocations.filter(a => a.scoreable);
      const sorted = [...allocations].sort((a, b) => b.amount - a.amount);
      const primary = scoreable.length ? scoreable.sort((a, b) => b.amount - a.amount)[0] : sorted[0];
      const secondary = scoreable.filter(a => a !== primary)[0];
      onRecommendation({
        productKey:   primary.productKey,
        productLabel: primary.productLabel,
        rationale:    recOrPlan.rationale,
        flags:        recOrPlan.flags || [],
        path,
        scoreable:    primary.scoreable,
        allocationPlan: allocations,
        ...(secondary && {
          secondaryProductKey:   secondary.productKey,
          secondaryProductLabel: secondary.productLabel,
          secondaryScoreable:    secondary.scoreable,
          splitAmounts:          { primary: primary.amount, secondary: secondary.amount },
        }),
      });
      return;
    }

    // Single / split product path
    const rec = recOrPlan;
    onRecommendation({
      productKey:   rec.productKey,
      productLabel: getProductLabel(rec.productKey),
      rationale:    rec.rationale,
      flags:        rec.flags || [],
      path,
      scoreable:    isWithinScoringModel(rec.productKey),
      ...(splitConfig && {
        secondaryProductKey:   splitConfig.secondaryProductKey,
        secondaryProductLabel: getProductLabel(splitConfig.secondaryProductKey),
        secondaryScoreable:    isWithinScoringModel(splitConfig.secondaryProductKey),
        splitAmounts:          splitConfig.splitAmounts,
      }),
    });
  }, [onRecommendation]);

  if (!currentNode) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p className="text-lg mb-4">Decision tree node not found: <code>{currentNodeId}</code></p>
        <button onClick={handleReset} className="text-blue-600 underline">Reset</button>
      </div>
    );
  }

  const stepNum = currentNode.step || (currentNode.type === 'recommendation' ? 5 : 1);

  return (
    <div className="max-w-2xl mx-auto">

      {/* Progress bar */}
      <ProgressBar currentStep={stepNum} />

      {/* Breadcrumb */}
      <BreadcrumbTrail history={history} onJumpTo={handleJumpTo} />

      {/* Main card */}
      <div className={`transition-opacity duration-150 ${animating ? 'opacity-0' : 'opacity-100'}`}>

        {/* ── RECOMMENDATION node ── */}
        {currentNode.type === 'recommendation' && (
          <RecommendationCard
            node={currentNode}
            path={history}
            onAccept={handleAccept}
            onReset={handleReset}
            investmentAmount={investmentAmount}
          />
        )}

        {/* ── ALLOCATION PLAN node ── */}
        {currentNode.type === 'allocation' && (
          <AllocationCard
            node={currentNode}
            path={history}
            onAccept={handleAccept}
            onReset={handleReset}
            investmentAmount={investmentAmount}
          />
        )}

        {/* ── QUESTION node ── */}
        {currentNode.type === 'question' && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">

            {/* Step label */}
            <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-2">
              Step {stepNum} · {currentNode.stepLabel || 'Question'}
            </p>

            {/* Question */}
            <h2 className="text-lg font-bold text-gray-800 mb-4 leading-snug">
              {currentNode.question}
            </h2>

            {/* Context */}
            <ContextBox text={currentNode.context} />

            {/* Options */}
            <div className="flex flex-col gap-3">
              {currentNode.options.map((opt, i) => (
                <button
                  key={i}
                  onClick={() => handleSelect(opt)}
                  className="w-full text-left group flex items-start gap-4 bg-white hover:bg-blue-50 border-2 border-gray-200 hover:border-blue-300 rounded-xl px-5 py-4 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  <span className="mt-0.5 w-7 h-7 flex-shrink-0 rounded-full border-2 border-gray-300 group-hover:border-blue-400 flex items-center justify-center text-xs font-bold text-gray-400 group-hover:text-blue-500 transition-colors">
                    {String.fromCharCode(65 + i)}
                  </span>
                  <div className="flex-1">
                    <span className="font-semibold text-gray-700 group-hover:text-blue-700 transition-colors text-sm">
                      {opt.label}
                    </span>
                    {opt.context && (
                      <p className="text-xs text-gray-400 mt-0.5">{opt.context}</p>
                    )}
                  </div>
                  <span className="text-gray-300 group-hover:text-blue-400 text-lg self-center transition-colors">›</span>
                </button>
              ))}
            </div>

            {/* Back button */}
            {history.length > 0 && (
              <div className="mt-5 pt-4 border-t border-gray-100 flex justify-between items-center">
                <button
                  onClick={() => handleJumpTo(history.length - 1)}
                  className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 transition-colors"
                >
                  ‹ Back
                </button>
                <button
                  onClick={handleReset}
                  className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                >
                  Start Over
                </button>
              </div>
            )}
          </div>
        )}

      </div>

      {/* 2026 Legislative quick reference */}
      <div className="mt-6 bg-gray-50 rounded-lg px-4 py-3 text-xs text-gray-500 grid grid-cols-2 gap-x-6 gap-y-1 border border-gray-100">
        <p className="col-span-2 font-semibold text-gray-600 mb-1">2026 Key Limits (Quick Reference)</p>
        <span>TFSA annual: <strong>{formatCurrency(LIMITS.tfsaAnnual)}</strong></span>
        <span>TFSA lifetime: <strong>{formatCurrency(LIMITS.tfsaLifetime)}</strong></span>
        <span>RA deduction: <strong>{LIMITS.raDeductionPct}% / {formatCurrency(LIMITS.raDeductionCap)}</strong></span>
        <span>Retirement tax-free: <strong>{formatCurrency(LIMITS.retirementTaxFree)}</strong></span>
        <span>LA drawdown: <strong>{LIMITS.laMinDrawdown}%–{LIMITS.laMaxDrawdown}%</strong></span>
        <span>CGT exclusion: <strong>{formatCurrency(LIMITS.cgtAnnualExclusion)}</strong></span>
      </div>

    </div>
  );
}
