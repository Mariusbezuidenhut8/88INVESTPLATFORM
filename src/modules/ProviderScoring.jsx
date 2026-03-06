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
  getProductShort,
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
function CategoryBreakdown({ providerName, productKey }) {
  const { breakdown } = useMemo(
    () => computeProviderScore(providerName, productKey),
    [providerName, productKey]
  );
  const providerData = PROVIDER_SCORES[providerName]?.[productKey] || {};

  return (
    <div className="mt-3 space-y-3">
      {Object.entries(breakdown).map(([cat, data]) => {
        const style = getCatStyle(cat);
        // get subcategories belonging to this category
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
            {/* subcategory detail */}
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
function ProviderRow({ provider, rank, productKey, isSelected, onSelect, isExpanded, onToggleExpand }) {
  const meta    = PROVIDER_META[provider.name] || {};
  const catalogue = PRODUCT_CATALOGUE[provider.name]?.[productKey];
  const rc      = rankColour(rank);

  return (
    <>
      <tr
        className={`border-b border-gray-100 cursor-pointer transition-colors ${isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
        onClick={() => onSelect(provider.name)}
      >
        {/* Rank */}
        <td className="px-3 py-3 text-center">
          <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold border ${rc}`}>
            {rank}
          </span>
        </td>
        {/* Provider */}
        <td className="px-3 py-3">
          <div className="flex items-start gap-2">
            <div>
              <p className="font-semibold text-sm text-gray-800">{provider.name}</p>
              <p className="text-xs text-gray-400">{meta.type}</p>
            </div>
          </div>
        </td>
        {/* Tier */}
        <td className="px-3 py-3 hidden sm:table-cell">
          <TierBadge tier={meta.tier} />
        </td>
        {/* Score ring */}
        <td className="px-3 py-3">
          <ScoreRing score={provider.score} />
        </td>
        {/* Product name */}
        <td className="px-3 py-3 hidden md:table-cell">
          <p className="text-xs text-gray-600">{catalogue?.name || '—'}</p>
          {catalogue?.minLumpSum && (
            <p className="text-xs text-gray-400 mt-0.5">Min: {formatCurrency(catalogue.minLumpSum)}</p>
          )}
        </td>
        {/* Select + expand */}
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

      {/* Expanded breakdown */}
      {isExpanded && (
        <tr className="bg-gray-50 border-b border-gray-100">
          <td colSpan={6} className="px-4 pb-4 pt-1">
            <div className="max-w-lg">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Score Breakdown — {provider.name}</p>
              <CategoryBreakdown providerName={provider.name} productKey={productKey} />
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

  // ── Ranked list — filtered to advisor's active providers if configured ──
  const allRanked = useMemo(() => {
    const ranked = rankProvidersForProduct(productKey);
    const active = advisorProfile?.activeProviders;
    if (!active?.length) return ranked;
    return ranked.filter(p => active.includes(p.name));
  }, [productKey, advisorProfile]);

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

  // ── Handle selection ──
  const handleSelect = useCallback((providerName) => {
    setSelectedProvider(providerName);
  }, []);

  // ── Confirm selection ──
  const handleConfirm = useCallback(() => {
    if (!selectedProvider) return;
    const top3 = allRanked.slice(0, 3);
    const recommended = allRanked.find(p => p.name === selectedProvider);
    const alternatives = top3.filter(p => p.name !== selectedProvider);
    if (onProviderSelect) {
      onProviderSelect({
        recommended:  { ...recommended, catalogue: PRODUCT_CATALOGUE[selectedProvider]?.[productKey] },
        alternatives: alternatives.map(p => ({ ...p, catalogue: PRODUCT_CATALOGUE[p.name]?.[productKey] })),
        allRanked:    allRanked.slice(0, 3),
        productKey,
      });
    }
  }, [selectedProvider, allRanked, productKey, onProviderSelect]);

  const selectedRank = allRanked.findIndex(p => p.name === selectedProvider) + 1;

  return (
    <div className="max-w-4xl mx-auto">

      {/* Header */}
      <div className="mb-6">
        <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">Provider Scoring Matrix</p>
        <h2 className="text-xl font-bold text-gray-800">{productLabel || getProductLabel(productKey)}</h2>
        <p className="text-sm text-gray-500 mt-1">
          {allRanked.length} providers ranked by weighted due diligence score across 5 categories and 15 sub-criteria.
          Select the recommended provider for the ROA.
        </p>
      </div>

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
            {displayed.map((provider, idx) => {
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
        <p className="font-semibold text-gray-600 mb-2">Scoring Categories (equal weight)</p>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {Object.entries(CAT_STYLES).map(([cat, style]) => (
            <span key={cat} className={`${style.bg} ${style.text} rounded px-2 py-1 font-medium text-center`}>{cat}</span>
          ))}
        </div>
        <p className="mt-2 text-gray-400">Each category contains 3 sub-criteria scored 1–5. The overall score is the weighted average across all 15 sub-criteria.</p>
      </div>

      {/* Confirm CTA */}
      <div className="bg-white rounded-xl border-2 border-gray-200 px-6 py-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          {selectedProvider ? (
            <>
              <p className="font-bold text-gray-800">{selectedProvider}</p>
              <p className="text-xs text-gray-500 mt-0.5">
                Ranked {ordinal(selectedRank)} of {allRanked.length} · Score: {formatScore(allRanked.find(p => p.name === selectedProvider)?.score)}
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
