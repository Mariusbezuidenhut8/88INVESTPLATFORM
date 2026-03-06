/**
 * ProviderScoring.jsx — Investment ROA Builder v3
 *
 * Displays the provider scoring matrix for a given product type.
 * Shows all ranked providers, top 3 highlighted, category breakdown,
 * and allows the advisor to confirm or override the recommendation.
 *
 * Props:
 *   productKey        {string}   — e.g. "RETIREMENT ANNUITY"
 *   productLabel      {string}   — human-readable label
 *   onProviderSelect  {fn}       — called with { recommended, alternatives, productKey }
 *   initialSelected   {string}   — pre-selected provider name (for restore)
 *   advisorOverrides  {object}   — optional score overrides from ProfileSettings
 */

import { useState, useMemo, useCallback } from 'react';
import {
  PROVIDER_SCORES,
  PROVIDER_META,
  SUBCATEGORY_WEIGHTS,
  computeProviderScore,
  rankProvidersForProduct,
} from '../data/providerDB.js';
import { PRODUCT_CATALOGUE } from '../data/productCatalogue.js';
import {
  formatScore,
  formatCurrency,
  rankColour,
  ordinal,
  getProductLabel,
} from '../shared/ui.js';

// ── Category colours ───────────────────────────────────────────────────────
const CAT_STYLES = {
  'Platform Features':    { bg: 'bg-blue-50',   text: 'text-blue-700',   bar: 'bg-blue-400' },
  'Administration':       { bg: 'bg-purple-50', text: 'text-purple-700', bar: 'bg-purple-400' },
  'Provider Strength':    { bg: 'bg-green-50',  text: 'text-green-700',  bar: 'bg-green-400' },
  'Regulatory Standing':  { bg: 'bg-amber-50',  text: 'text-amber-700',  bar: 'bg-amber-400' },
  'COST & VALUE METRICS': { bg: 'bg-rose-50',   text: 'text-rose-700',   bar: 'bg-rose-400' },
};

const getCatStyle = (cat) => CAT_STYLES[cat] || { bg: 'bg-gray-50', text: 'text-gray-600', bar: 'bg-gray-300' };

// ── Client priority questions ──────────────────────────────────────────────
const CLIENT_QUESTIONS = [
  { key: 'Platform Features',    label: 'Platform / Digital',  q: "How important is online/digital self-service to the client?" },
  { key: 'Regulatory Standing',  label: 'Regulatory Standing', q: "How concerned is the client about the provider's FAIS/regulatory history?" },
  { key: 'Administration',       label: 'Administration',      q: "Is administrative efficiency and error resolution a priority for the client?" },
  { key: 'Provider Strength',    label: 'Provider Stability',  q: "How much does long-term provider stability matter to the client?" },
  { key: 'COST & VALUE METRICS', label: 'Cost & Value',        q: "How price-sensitive is the client relative to service quality?" },
];

const ANSWER_MULTIPLIERS = { Low: 0.6, Medium: 1.0, High: 1.5 };

const DEFAULT_ANSWERS = {
  'Platform Features':    'Medium',
  'Regulatory Standing':  'Medium',
  'Administration':       'Medium',
  'Provider Strength':    'Medium',
  'COST & VALUE METRICS': 'Medium',
};

// ── Client Priorities Panel ────────────────────────────────────────────────
function ClientPreferencesPanel({ answers, onAnswer, onReset }) {
  const [open, setOpen] = useState(true);
  const isDefault = CLIENT_QUESTIONS.every(q => answers[q.key] === 'Medium');

  // Compute resulting category weight percentages
  const BASE = 15; // 3 subcategories × weight 5 per category
  const rawWeights = CLIENT_QUESTIONS.map(q => ({
    ...q,
    w: BASE * (ANSWER_MULTIPLIERS[answers[q.key]] ?? 1.0),
  }));
  const totalW = rawWeights.reduce((s, r) => s + r.w, 0);
  const effectiveWeights = rawWeights.map(r => ({ ...r, pct: Math.round(r.w / totalW * 100) }));

  const answerBtn = (cat, val) => {
    const selected = answers[cat] === val;
    const colourMap = {
      Low:    selected ? 'bg-gray-500 border-gray-500 text-white' : '',
      Medium: selected ? 'bg-blue-600 border-blue-600 text-white' : '',
      High:   selected ? 'bg-green-600 border-green-600 text-white' : '',
    };
    return (
      <button
        key={val}
        onClick={() => onAnswer(cat, val)}
        className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors ${
          colourMap[val] || 'border-gray-200 bg-white text-gray-400 hover:bg-gray-50'
        }`}
      >
        {val}
      </button>
    );
  };

  return (
    <div className="bg-white rounded-xl border border-blue-200 overflow-hidden mb-6 shadow-sm">
      <div
        className="px-5 py-3 bg-blue-50 border-b border-blue-100 flex items-center justify-between cursor-pointer select-none"
        onClick={() => setOpen(v => !v)}
      >
        <div>
          <p className="text-sm font-semibold text-blue-800">Client Priorities</p>
          <p className="text-xs text-blue-500 mt-0.5">Answers adjust scoring weights — rankings update live.</p>
        </div>
        <div className="flex items-center gap-2">
          {!isDefault && (
            <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full font-semibold">Customised</span>
          )}
          <span className="text-blue-400 text-sm">{open ? '▲' : '▼'}</span>
        </div>
      </div>

      {open && (
        <div className="px-5 py-4">
          {/* Questions */}
          <div className="space-y-3 mb-5">
            {CLIENT_QUESTIONS.map(({ key, q }) => (
              <div key={key} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                <p className="text-xs text-gray-700 flex-1">{q}</p>
                <div className="flex gap-1.5 flex-shrink-0">
                  {['Low', 'Medium', 'High'].map(val => answerBtn(key, val))}
                </div>
              </div>
            ))}
          </div>

          {/* Weight visualisation */}
          <div className="bg-gray-50 rounded-lg px-4 py-3 border border-gray-100">
            <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Resulting category weights</p>
            <div className="space-y-2">
              {effectiveWeights.map(({ key, label, pct }) => {
                const style = getCatStyle(key);
                return (
                  <div key={key} className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 w-32 flex-shrink-0 truncate">{label}</span>
                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${style.bar}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-xs font-semibold text-gray-600 w-8 text-right">{pct}%</span>
                  </div>
                );
              })}
            </div>
            {!isDefault && (
              <button
                onClick={onReset}
                className="mt-3 text-xs text-gray-400 hover:text-gray-600 underline"
              >
                Reset to neutral (equal weights)
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Score bar ──────────────────────────────────────────────────────────────
function ScoreBar({ score, max = 5, catKey }) {
  const pct = Math.min((score / max) * 100, 100);
  const style = getCatStyle(catKey);
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${style.bar}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs font-semibold text-gray-600 w-7 text-right">{formatScore(score)}</span>
    </div>
  );
}

// ── Overall score ring ─────────────────────────────────────────────────────
function ScoreRing({ score }) {
  const pct = (score / 5) * 100;
  const colour = score >= 4 ? '#16a34a' : score >= 3 ? '#2563eb' : score >= 2 ? '#d97706' : '#dc2626';
  const r = 22, cx = 28, cy = 28, circumference = 2 * Math.PI * r;
  const dash = (pct / 100) * circumference;
  return (
    <svg width={56} height={56} className="flex-shrink-0">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#e5e7eb" strokeWidth={5} />
      <circle
        cx={cx} cy={cy} r={r} fill="none"
        stroke={colour} strokeWidth={5}
        strokeDasharray={`${dash} ${circumference}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${cx} ${cy})`}
        className="transition-all duration-700"
      />
      <text x={cx} y={cy + 1} textAnchor="middle" dominantBaseline="middle"
        fontSize={11} fontWeight={700} fill={colour}>
        {formatScore(score)}
      </text>
    </svg>
  );
}

// ── Tier badge ─────────────────────────────────────────────────────────────
function TierBadge({ tier }) {
  const styles = {
    'Tier 1 – Preferred':    'bg-green-100 text-green-800 border-green-200',
    'Tier 2 – Approved':     'bg-blue-100 text-blue-800 border-blue-200',
    'Tier 3 – Conditional':  'bg-yellow-100 text-yellow-800 border-yellow-200',
    'Tier 4 – Limited':      'bg-red-100 text-red-800 border-red-200',
  };
  return (
    <span className={`text-xs font-semibold border px-2 py-0.5 rounded-full ${styles[tier] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
      {tier || 'Unranked'}
    </span>
  );
}

// ── Category breakdown panel ───────────────────────────────────────────────
function CategoryBreakdown({ providerName, productKey, categoryMultipliers }) {
  const { breakdown } = useMemo(
    () => computeProviderScore(providerName, productKey, categoryMultipliers),
    [providerName, productKey, categoryMultipliers]
  );
  const providerData = PROVIDER_SCORES[providerName]?.[productKey] || {};

  return (
    <div className="mt-3 space-y-3">
      {Object.entries(breakdown).map(([cat, data]) => {
        const style = getCatStyle(cat);
        const subcats = Object.entries(providerData).filter(
          ([sub]) => SUBCATEGORY_WEIGHTS[sub]?.category === cat
        );
        return (
          <div key={cat} className={`rounded-lg ${style.bg} px-3 py-2`}>
            <div className="flex items-center justify-between mb-1">
              <span className={`text-xs font-semibold ${style.text}`}>{cat}</span>
              <span className={`text-xs font-bold ${style.text}`}>{formatScore(data.average)} / 5</span>
            </div>
            <ScoreBar score={data.average} catKey={cat} />
            <div className="mt-2 space-y-1">
              {subcats.map(([sub, d]) => (
                <div key={sub} className="flex items-start justify-between gap-2 text-xs text-gray-500">
                  <span className="flex-1">{sub}</span>
                  <span className="font-medium text-gray-700 flex-shrink-0">{d.score}/5</span>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Provider row (in full table) ───────────────────────────────────────────
function ProviderRow({ provider, rank, productKey, isSelected, onSelect, isExpanded, onToggleExpand, categoryMultipliers }) {
  const meta      = PROVIDER_META[provider.name] || {};
  const catalogue = PRODUCT_CATALOGUE[provider.name]?.[productKey];
  const rc        = rankColour(rank);

  return (
    <>
      <tr
        className={`border-b border-gray-100 cursor-pointer transition-colors ${isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
        onClick={() => onSelect(provider.name)}
      >
        <td className="px-3 py-3 text-center">
          <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold border ${rc}`}>
            {rank}
          </span>
        </td>
        <td className="px-3 py-3">
          <p className="font-semibold text-sm text-gray-800">{provider.name}</p>
          <p className="text-xs text-gray-400">{meta.type}</p>
        </td>
        <td className="px-3 py-3 hidden sm:table-cell">
          <TierBadge tier={meta.tier} />
        </td>
        <td className="px-3 py-3">
          <ScoreRing score={provider.score} />
        </td>
        <td className="px-3 py-3 hidden md:table-cell">
          <p className="text-xs text-gray-600">{catalogue?.name || '—'}</p>
          {catalogue?.minLumpSum && (
            <p className="text-xs text-gray-400 mt-0.5">Min: {formatCurrency(catalogue.minLumpSum)}</p>
          )}
        </td>
        <td className="px-3 py-3 text-right">
          <div className="flex items-center justify-end gap-2">
            {isSelected && (
              <span className="text-xs font-semibold text-blue-600 bg-blue-50 border border-blue-200 rounded px-2 py-0.5">Selected</span>
            )}
            <button
              onClick={(e) => { e.stopPropagation(); onToggleExpand(); }}
              className="text-gray-400 hover:text-gray-700 text-sm transition-colors"
              title="View breakdown"
            >
              {isExpanded ? '▲' : '▼'}
            </button>
          </div>
        </td>
      </tr>

      {isExpanded && (
        <tr className="bg-gray-50 border-b border-gray-100">
          <td colSpan={6} className="px-4 pb-4 pt-1">
            <div className="max-w-lg">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Score Breakdown — {provider.name}</p>
              <CategoryBreakdown
                providerName={provider.name}
                productKey={productKey}
                categoryMultipliers={categoryMultipliers}
              />
              {catalogue?.notes && (
                <p className="text-xs text-gray-500 mt-3 italic border-t border-gray-200 pt-2">{catalogue.notes}</p>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

// ── Top 3 recommendation cards ─────────────────────────────────────────────
function TopThreeCards({ ranked, productKey, selectedProvider, onSelect }) {
  const top3 = ranked.slice(0, 3);
  const RANK_LABELS = ['Recommended', '2nd Choice', '3rd Choice'];
  const RANK_ICONS  = ['🥇', '🥈', '🥉'];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
      {top3.map((p, i) => {
        const meta      = PROVIDER_META[p.name] || {};
        const catalogue = PRODUCT_CATALOGUE[p.name]?.[productKey];
        const isSelected = selectedProvider === p.name;
        return (
          <button
            key={p.name}
            onClick={() => onSelect(p.name)}
            className={`text-left rounded-xl border-2 p-4 transition-all duration-150 ${
              isSelected
                ? 'border-blue-500 bg-blue-50 shadow-md'
                : i === 0
                ? 'border-green-300 bg-green-50 hover:border-green-400'
                : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-lg">{RANK_ICONS[i]}</span>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                i === 0 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
              }`}>{RANK_LABELS[i]}</span>
            </div>
            <p className="font-bold text-gray-800 text-sm mb-1">{p.name}</p>
            <p className="text-xs text-gray-500 mb-2">{catalogue?.name || getProductLabel(productKey)}</p>
            <div className="flex items-center justify-between">
              <TierBadge tier={meta.tier} />
              <span className="text-lg font-bold text-gray-700">{formatScore(p.score)}</span>
            </div>
            {isSelected && (
              <p className="text-xs text-blue-600 font-semibold mt-2">✓ Selected for ROA</p>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════════════════════

export default function ProviderScoring({
  productKey,
  productLabel,
  onProviderSelect,
  initialSelected = null,
  advisorOverrides = {},
  advisorProfile = {},
}) {
  const [selectedProvider, setSelectedProvider] = useState(initialSelected);
  const [expandedRow, setExpandedRow]           = useState(null);
  const [showAll, setShowAll]                   = useState(false);
  const [filterTier, setFilterTier]             = useState('all');
  const [filterType, setFilterType]             = useState('all');

  // ── Client priority answers ──
  const [answers, setAnswers] = useState(DEFAULT_ANSWERS);

  const setAnswer = useCallback((cat, val) => {
    setAnswers(prev => ({ ...prev, [cat]: val }));
  }, []);

  const resetAnswers = useCallback(() => setAnswers(DEFAULT_ANSWERS), []);

  // ── Derived category multipliers from answers ──
  const categoryMultipliers = useMemo(() => (
    Object.fromEntries(
      CLIENT_QUESTIONS.map(q => [q.key, ANSWER_MULTIPLIERS[answers[q.key]] ?? 1.0])
    )
  ), [answers]);

  // ── Ranked list — filtered to advisor's active providers if configured ──
  const allRanked = useMemo(() => {
    const ranked = rankProvidersForProduct(productKey, 30, categoryMultipliers);
    const active = advisorProfile?.activeProviders;
    if (!active?.length) return ranked;
    return ranked.filter(p => active.includes(p.name));
  }, [productKey, advisorProfile, categoryMultipliers]);

  // ── Filter ──
  const filtered = useMemo(() => {
    return allRanked.filter(p => {
      const meta = PROVIDER_META[p.name] || {};
      const tierMatch = filterTier === 'all' || meta.tier === filterTier;
      const typeMatch = filterType === 'all' || meta.type === filterType;
      return tierMatch && typeMatch;
    });
  }, [allRanked, filterTier, filterType]);

  const displayed = showAll ? filtered : filtered.slice(0, 10);

  // ── Unique filter options ──
  const tierOptions = useMemo(() => {
    const tiers = [...new Set(allRanked.map(p => PROVIDER_META[p.name]?.tier).filter(Boolean))];
    return tiers.sort();
  }, [allRanked]);

  const typeOptions = useMemo(() => {
    const types = [...new Set(allRanked.map(p => PROVIDER_META[p.name]?.type).filter(Boolean))];
    return types.sort();
  }, [allRanked]);

  const handleSelect = useCallback((providerName) => {
    setSelectedProvider(providerName);
  }, []);

  const handleConfirm = useCallback(() => {
    if (!selectedProvider) return;
    const top3 = allRanked.slice(0, 3);
    const recommended = allRanked.find(p => p.name === selectedProvider);
    const alternatives = top3.filter(p => p.name !== selectedProvider);
    if (onProviderSelect) {
      onProviderSelect({
        recommended:      { ...recommended, catalogue: PRODUCT_CATALOGUE[selectedProvider]?.[productKey] },
        alternatives:     alternatives.map(p => ({ ...p, catalogue: PRODUCT_CATALOGUE[p.name]?.[productKey] })),
        allRanked:        allRanked.slice(0, 3),
        clientPriorities: answers,
        productKey,
      });
    }
  }, [selectedProvider, allRanked, productKey, answers, onProviderSelect]);

  const selectedRank = allRanked.findIndex(p => p.name === selectedProvider) + 1;
  const isCustomised = CLIENT_QUESTIONS.some(q => answers[q.key] !== 'Medium');

  return (
    <div className="max-w-4xl mx-auto">

      {/* Header */}
      <div className="mb-6">
        <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">Provider Scoring Matrix</p>
        <h2 className="text-xl font-bold text-gray-800">{productLabel || getProductLabel(productKey)}</h2>
        <p className="text-sm text-gray-500 mt-1">
          {allRanked.length} providers ranked by weighted due diligence score.
          Adjust client priorities below to personalise the weighting.
        </p>
        {advisorProfile?.activeProviders?.length > 0 && (
          <div className="mt-3 flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            <span>⚠</span>
            <span>Filtered to your approved panel: <strong>{advisorProfile.activeProviders.length} providers</strong> selected in Settings. Non-panel providers are excluded.</span>
          </div>
        )}
      </div>

      {/* Client Priorities */}
      <ClientPreferencesPanel
        answers={answers}
        onAnswer={setAnswer}
        onReset={resetAnswers}
      />

      {/* Top 3 cards */}
      <TopThreeCards
        ranked={allRanked}
        productKey={productKey}
        selectedProvider={selectedProvider}
        onSelect={handleSelect}
      />

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <span className="text-xs font-semibold text-gray-500">Filter:</span>
        <select
          value={filterTier}
          onChange={e => setFilterTier(e.target.value)}
          className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-400"
        >
          <option value="all">All tiers</option>
          {tierOptions.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select
          value={filterType}
          onChange={e => setFilterType(e.target.value)}
          className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-400"
        >
          <option value="all">All types</option>
          {typeOptions.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        {isCustomised && (
          <span className="text-xs text-blue-600 font-medium bg-blue-50 border border-blue-200 rounded-full px-2.5 py-0.5">
            Client-weighted
          </span>
        )}
        <span className="ml-auto text-xs text-gray-400">{filtered.length} providers</span>
      </div>

      {/* Full scoring table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm mb-6">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-3 py-3 text-center text-xs font-semibold text-gray-500 w-12">#</th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500">Provider</th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 hidden sm:table-cell">Tier</th>
              <th className="px-3 py-3 text-center text-xs font-semibold text-gray-500">Score</th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 hidden md:table-cell">Product</th>
              <th className="px-3 py-3 text-right text-xs font-semibold text-gray-500 w-28"></th>
            </tr>
          </thead>
          <tbody>
            {displayed.map((provider) => {
              const rank = filtered.indexOf(provider) + 1;
              return (
                <ProviderRow
                  key={provider.name}
                  provider={provider}
                  rank={rank}
                  productKey={productKey}
                  isSelected={selectedProvider === provider.name}
                  onSelect={handleSelect}
                  isExpanded={expandedRow === provider.name}
                  onToggleExpand={() => setExpandedRow(expandedRow === provider.name ? null : provider.name)}
                  categoryMultipliers={categoryMultipliers}
                />
              );
            })}
          </tbody>
        </table>

        {!showAll && filtered.length > 10 && (
          <div className="border-t border-gray-100 px-4 py-3 text-center">
            <button
              onClick={() => setShowAll(true)}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors"
            >
              Show all {filtered.length} providers ▼
            </button>
          </div>
        )}
      </div>

      {/* Score legend */}
      <div className="bg-gray-50 rounded-lg px-4 py-3 mb-6 text-xs text-gray-500 border border-gray-100">
        <p className="font-semibold text-gray-600 mb-2">Scoring Categories</p>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {Object.entries(CAT_STYLES).map(([cat, style]) => (
            <span key={cat} className={`${style.bg} ${style.text} rounded px-2 py-1 font-medium text-center`}>{cat}</span>
          ))}
        </div>
        <p className="mt-2 text-gray-400">
          Each category contains 3 sub-criteria scored 1–5.
          {isCustomised
            ? ' Weights have been personalised using client priorities above.'
            : ' All categories carry equal weight by default.'}
        </p>
      </div>

      {/* Confirm CTA */}
      <div className="bg-white rounded-xl border-2 border-gray-200 px-6 py-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          {selectedProvider ? (
            <>
              <p className="font-bold text-gray-800">{selectedProvider}</p>
              <p className="text-xs text-gray-500 mt-0.5">
                Ranked {ordinal(selectedRank)} of {allRanked.length} · Score: {formatScore(allRanked.find(p => p.name === selectedProvider)?.score)}
                {isCustomised && ' (client-weighted)'}
              </p>
            </>
          ) : (
            <p className="text-sm text-gray-500">Select a provider above to continue</p>
          )}
        </div>
        <div className="flex gap-3">
          {selectedProvider && (
            <p className="text-xs text-gray-400 self-center hidden sm:block">
              Top 3 will be included in ROA for FAIS audit trail
            </p>
          )}
          <button
            onClick={handleConfirm}
            disabled={!selectedProvider}
            className={`px-6 py-2.5 rounded-lg font-semibold text-sm transition-all ${
              selectedProvider
                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            Confirm & Continue →
          </button>
        </div>
      </div>

    </div>
  );
}
