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
 *
 * The component is self-contained: it reads DECISION_TREE from productTree.js
 * and manages its own traversal state. On recommendation, it calls the parent
 * via onRecommendation so the ROA builder can proceed to provider scoring.
 */

import { useState, useCallback } from 'react';
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

// ─── Recommendation card ───────────────────────────────────────────────────
function RecommendationCard({ node, path, onAccept, onReset }) {
  const rec  = node.recommendation;
  const col  = getColour(rec.productKey);
  const icon = PRODUCT_ICONS[rec.productKey] || '📌';
  const scoreable = isWithinScoringModel(rec.productKey);

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
          onClick={() => onAccept(rec, path)}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-3 rounded-lg transition-colors text-sm"
        >
          {scoreable ? 'Continue to Provider Scoring →' : 'Accept Recommendation →'}
        </button>
        <button
          onClick={onReset}
          className="px-4 py-3 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors"
        >
          Start Over
        </button>
      </div>

      {!scoreable && (
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

export default function DecisionTree({ onRecommendation, onReset: externalReset, initialPath = [] }) {

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
    const truncated = history.slice(0, historyIndex);
    setHistory(truncated);
    setCurrentNodeId(truncated.length ? DECISION_TREE[truncated[truncated.length - 1].nodeId]
      ? history[historyIndex - 1]?.nodeId || 'root'
      : 'root' : 'root');
    // Simpler: restore to the node that was current at that point
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
  const handleAccept = useCallback((rec, path) => {
    if (onRecommendation) {
      onRecommendation({
        productKey:   rec.productKey,
        productLabel: getProductLabel(rec.productKey),
        rationale:    rec.rationale,
        flags:        rec.flags || [],
        path:         path,
        scoreable:    isWithinScoringModel(rec.productKey),
      });
    }
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
