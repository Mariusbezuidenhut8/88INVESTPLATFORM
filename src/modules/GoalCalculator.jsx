/**
 * GoalCalculator.jsx — Investment ROA Builder v3
 *
 * Savings goal calculator: determine the lump sum or monthly contribution
 * needed to reach a specific financial goal by a target date.
 *
 * Props:
 *   initialData   {object}  — previously saved calculator state
 *   onChange      {fn}      — called on every change
 *   onComplete    {fn}      — called when advisor continues to Decision Tree
 *   onBack        {fn}      — called to return to the Needs Analysis landing
 */

import { useState, useMemo } from 'react';
import { formatCurrency } from '../shared/ui.js';

// ── Financial engine ──────────────────────────────────────────────────────

function computeGoalResults({ targetAmount, yearsToGoal, goalEscalation, growthRate, provisions }) {
  if (!yearsToGoal || yearsToGoal <= 0 || !targetAmount || targetAmount <= 0) return null;

  const g   = growthRate   / 100;
  const esc = goalEscalation / 100;

  // Goal in future money (inflation-adjusted)
  const goalFV = targetAmount * Math.pow(1 + esc, yearsToGoal);

  // Future value of each provision
  let provisionsFV = 0;
  provisions.forEach(p => {
    const pv = Number(p.currentValue) || 0;
    const pm = Number(p.monthlyContribution) || 0;
    const pr = (Number(p.growthRate) || growthRate) / 100;
    const monthly_r = Math.pow(1 + pr, 1 / 12) - 1;
    const n = yearsToGoal * 12;
    provisionsFV += pv * Math.pow(1 + pr, yearsToGoal);
    if (pm > 0 && monthly_r > 0.000001) {
      provisionsFV += pm * (Math.pow(1 + monthly_r, n) - 1) / monthly_r;
    }
  });

  const shortfall = Math.max(0, goalFV - provisionsFV);
  const surplus   = Math.max(0, provisionsFV - goalFV);

  // Required lump sum today (PV of shortfall)
  const requiredLumpSum = shortfall > 0
    ? (g > 0.000001 ? shortfall / Math.pow(1 + g, yearsToGoal) : shortfall)
    : 0;

  // Required monthly contribution (annuity FV formula)
  let requiredMonthly = 0;
  if (shortfall > 0) {
    const monthly_g = Math.pow(1 + g, 1 / 12) - 1;
    const n = yearsToGoal * 12;
    requiredMonthly = monthly_g > 0.000001
      ? shortfall * monthly_g / (Math.pow(1 + monthly_g, n) - 1)
      : shortfall / n;
  }

  const coveragePct = goalFV > 0 ? Math.min(100, (provisionsFV / goalFV) * 100) : 0;
  return { goalFV, provisionsFV, shortfall, surplus, requiredLumpSum, requiredMonthly, coveragePct };
}

function provisionFV(p, years) {
  const pv = Number(p.currentValue) || 0;
  const pm = Number(p.monthlyContribution) || 0;
  const pr = (Number(p.growthRate) || 10) / 100;
  const monthly_r = Math.pow(1 + pr, 1 / 12) - 1;
  const n = years * 12;
  let fv = pv * Math.pow(1 + pr, years);
  if (pm > 0 && monthly_r > 0.000001) fv += pm * (Math.pow(1 + monthly_r, n) - 1) / monthly_r;
  return fv;
}

// ── Helpers ───────────────────────────────────────────────────────────────

const ASSET_TYPES = ['Endowment', 'Linked Investment', 'Shares', 'Savings Account', 'Tax Free Investment', 'Unit Trust', 'RA / Pension', 'Other'];

const newProvision = () => ({ id: Date.now() + Math.random(), description: '', assetType: '', currentValue: '', monthlyContribution: '', growthRate: 10 });

function NumInput({ value, onChange, step = 1, min, max, prefix, suffix, placeholder, className = '' }) {
  return (
    <div className="relative">
      {prefix && <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">{prefix}</span>}
      <input
        type="number"
        value={value}
        onChange={e => onChange(e.target.value)}
        step={step} min={min} max={max} placeholder={placeholder}
        className={`w-full text-sm border border-gray-200 rounded-lg py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 ${prefix ? 'pl-6' : 'pl-3'} ${suffix ? 'pr-7' : 'pr-3'} text-right ${className}`}
      />
      {suffix && <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">{suffix}</span>}
    </div>
  );
}

function StatCard({ label, value, sub, colour = 'gray' }) {
  const colours = { gray: 'bg-gray-50 border-gray-200 text-gray-900', red: 'bg-red-50 border-red-200 text-red-800', green: 'bg-green-50 border-green-200 text-green-800', amber: 'bg-amber-50 border-amber-200 text-amber-800', blue: 'bg-blue-50 border-blue-200 text-blue-800' };
  const labelColours = { gray: 'text-gray-500', red: 'text-red-600', green: 'text-green-600', amber: 'text-amber-600', blue: 'text-blue-600' };
  return (
    <div className={`rounded-xl border px-4 py-4 ${colours[colour]}`}>
      <p className={`text-xs font-semibold uppercase tracking-wider mb-1 ${labelColours[colour]}`}>{label}</p>
      <p className="text-2xl font-bold">{value}</p>
      {sub && <p className="text-xs mt-1 opacity-70">{sub}</p>}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════════════════════

export default function GoalCalculator({ initialData = {}, onChange, onComplete, onBack }) {
  const [tab, setTab] = useState('requirements');

  const [goalDescription, setGoalDescription] = useState(initialData.goalDescription || '');
  const [targetAmount,    setTargetAmount]    = useState(initialData.targetAmount    || '');
  const [yearsToGoal,     setYearsToGoal]     = useState(initialData.yearsToGoal     || '');
  const [goalEscalation,  setGoalEscalation]  = useState(initialData.goalEscalation  ?? 5);
  const [growthRate,      setGrowthRate]      = useState(initialData.growthRate      ?? 10);
  const [provisions,      setProvisions]      = useState(initialData.provisions      || []);

  const results = useMemo(() => computeGoalResults({
    targetAmount:   Number(targetAmount),
    yearsToGoal:    Number(yearsToGoal),
    goalEscalation: Number(goalEscalation),
    growthRate:     Number(growthRate),
    provisions,
  }), [targetAmount, yearsToGoal, goalEscalation, growthRate, provisions]);

  const addProvision    = () => setProvisions(p => [...p, newProvision()]);
  const removeProvision = id => setProvisions(p => p.filter(x => x.id !== id));
  const updateProvision = (id, f, v) => setProvisions(p => p.map(x => x.id === id ? { ...x, [f]: v } : x));

  const handleComplete = () => {
    const data = {
      calcType: 'goal', goalDescription,
      targetAmount: Number(targetAmount), yearsToGoal: Number(yearsToGoal),
      goalEscalation: Number(goalEscalation), growthRate: Number(growthRate),
      provisions, results,
    };
    if (onComplete) onComplete(data);
  };

  const TABS = [
    { id: 'requirements', label: 'Requirements' },
    { id: 'provisions',   label: 'Provisions' },
    { id: 'results',      label: 'Results' },
    { id: 'nextsteps',    label: 'Next Steps' },
  ];

  const fieldClass = 'w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400';

  return (
    <div className="max-w-3xl mx-auto">

      {/* Header */}
      <div className="mb-5 flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-0.5">Financial Needs Analysis</p>
          <h2 className="text-xl font-bold text-gray-800">Savings Goal Planner</h2>
        </div>
        <button onClick={onBack} className="text-sm text-gray-400 hover:text-gray-700 border border-gray-200 rounded-lg px-4 py-2 hover:bg-gray-50 transition-colors flex-shrink-0">
          ← Change analysis type
        </button>
      </div>

      {/* Quick stats bar */}
      {results && (
        <div className="mb-5 bg-white border border-gray-200 rounded-xl px-4 py-3 flex flex-wrap gap-4 text-sm">
          <div><span className="text-xs text-gray-400">Goal (future money)</span><p className="font-bold text-gray-800">{formatCurrency(results.goalFV)}</p></div>
          <div className="w-px bg-gray-200" />
          <div><span className="text-xs text-gray-400">{results.shortfall > 0 ? 'Shortfall' : 'Surplus'}</span><p className={`font-bold ${results.shortfall > 0 ? 'text-red-600' : 'text-green-600'}`}>{formatCurrency(results.shortfall || results.surplus)}</p></div>
          <div className="w-px bg-gray-200" />
          <div><span className="text-xs text-gray-400">Monthly Required</span><p className="font-bold text-amber-700">{results.requiredMonthly > 0 ? formatCurrency(results.requiredMonthly) : '—'}</p></div>
          <div className="w-px bg-gray-200" />
          <div><span className="text-xs text-gray-400">Coverage</span><p className={`font-bold ${results.coveragePct >= 100 ? 'text-green-600' : 'text-red-600'}`}>{results.coveragePct.toFixed(1)}%</p></div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-5 bg-gray-100 rounded-xl p-1">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex-1 text-xs font-semibold py-2 rounded-lg transition-colors ${tab === t.id ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-5">

        {/* ── REQUIREMENTS ── */}
        {tab === 'requirements' && (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-700 border-b border-gray-100 pb-2">Goal Details</h3>

            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">Goal Description</label>
              <input type="text" value={goalDescription} onChange={e => setGoalDescription(e.target.value)}
                placeholder="e.g. Children's education, Holiday home, Vehicle, Emergency fund..."
                className={fieldClass} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">Target Amount (today's money)</label>
                <NumInput value={targetAmount} onChange={setTargetAmount} prefix="R" placeholder="500 000" min={0} step={10000} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">Years to Goal</label>
                <NumInput value={yearsToGoal} onChange={setYearsToGoal} suffix="yrs" placeholder="10" min={1} max={40} step={1} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">Goal Escalation Rate</label>
                <NumInput value={goalEscalation} onChange={setGoalEscalation} suffix="%" min={0} max={20} step={0.5} />
                <p className="text-xs text-gray-400 mt-1">Rate at which goal inflates annually (e.g. CPI)</p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">Expected Investment Growth</label>
                <NumInput value={growthRate} onChange={setGrowthRate} suffix="%" min={0} max={25} step={0.5} />
                <p className="text-xs text-gray-400 mt-1">Net annual return on investment</p>
              </div>
            </div>

            {targetAmount > 0 && yearsToGoal > 0 && (
              <div className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-3 text-sm text-blue-800">
                <strong>{formatCurrency(Number(targetAmount))}</strong> today will be approximately{' '}
                <strong>{formatCurrency(Number(targetAmount) * Math.pow(1 + Number(goalEscalation) / 100, Number(yearsToGoal)))}</strong>{' '}
                in {yearsToGoal} years at {goalEscalation}% escalation.
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button onClick={() => setTab('provisions')} className="bg-blue-600 text-white text-sm font-semibold px-5 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                Next: Add Provisions →
              </button>
            </div>
          </div>
        )}

        {/* ── PROVISIONS ── */}
        {tab === 'provisions' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
              <h3 className="text-sm font-semibold text-gray-700">Existing Savings & Investments</h3>
              <button onClick={addProvision} className="text-xs text-blue-600 hover:text-blue-800 font-semibold border border-blue-200 rounded-lg px-3 py-1.5 hover:bg-blue-50 transition-colors">
                + Add Asset
              </button>
            </div>

            {provisions.length === 0 && (
              <div className="text-center py-8 text-gray-400">
                <p className="text-sm">No provisions added.</p>
                <p className="text-xs mt-1">Add existing savings or investments that will contribute to this goal.</p>
              </div>
            )}

            {provisions.map(p => (
              <div key={p.id} className="border border-gray-200 rounded-xl p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="flex-1">
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Description</label>
                    <input type="text" value={p.description} onChange={e => updateProvision(p.id, 'description', e.target.value)}
                      placeholder="e.g. Unit Trust, Savings Account..."
                      className={fieldClass} />
                  </div>
                  <div className="w-44">
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Asset Type</label>
                    <select value={p.assetType} onChange={e => updateProvision(p.id, 'assetType', e.target.value)} className={fieldClass}>
                      <option value="">Select...</option>
                      {ASSET_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <button onClick={() => removeProvision(p.id)} className="text-xs text-red-400 hover:text-red-600 mt-6 px-2 py-1">✕</button>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Current Value</label>
                    <NumInput value={p.currentValue} onChange={v => updateProvision(p.id, 'currentValue', v)} prefix="R" min={0} step={10000} placeholder="0" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Monthly Contribution</label>
                    <NumInput value={p.monthlyContribution} onChange={v => updateProvision(p.id, 'monthlyContribution', v)} prefix="R" min={0} step={500} placeholder="0" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Growth Rate</label>
                    <NumInput value={p.growthRate} onChange={v => updateProvision(p.id, 'growthRate', v)} suffix="%" min={0} max={25} step={0.5} />
                  </div>
                </div>
                {Number(yearsToGoal) > 0 && (Number(p.currentValue) > 0 || Number(p.monthlyContribution) > 0) && (
                  <p className="text-xs text-gray-400">
                    Projected value in {yearsToGoal} yrs:{' '}
                    <strong className="text-gray-600">{formatCurrency(provisionFV(p, Number(yearsToGoal)))}</strong>
                  </p>
                )}
              </div>
            ))}

            <div className="flex justify-between pt-2">
              <button onClick={() => setTab('requirements')} className="text-sm text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg px-4 py-2 hover:bg-gray-50 transition-colors">← Back</button>
              <button onClick={() => setTab('results')} className="bg-blue-600 text-white text-sm font-semibold px-5 py-2 rounded-lg hover:bg-blue-700 transition-colors">View Results →</button>
            </div>
          </div>
        )}

        {/* ── RESULTS ── */}
        {tab === 'results' && (
          <div className="space-y-5">
            {!results ? (
              <div className="text-center py-8 text-gray-400">
                <p className="text-sm">Complete the Requirements tab to see results.</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <StatCard label="Goal Amount (future money)" value={formatCurrency(results.goalFV)} sub={`${formatCurrency(Number(targetAmount))} today · ${yearsToGoal} yrs`} colour="gray" />
                  <StatCard label="Provisions at Target Date"  value={formatCurrency(results.provisionsFV)} colour="blue" />
                  <StatCard label={results.shortfall > 0 ? 'Shortfall' : 'Surplus'} value={formatCurrency(results.shortfall || results.surplus)} colour={results.shortfall > 0 ? 'red' : 'green'} />
                  <StatCard label="Coverage" value={`${results.coveragePct.toFixed(1)}%`} colour={results.coveragePct >= 100 ? 'green' : results.coveragePct >= 60 ? 'amber' : 'red'} />
                </div>

                {results.shortfall > 0 && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                    <p className="text-sm font-semibold text-amber-800 mb-3">To close the shortfall of {formatCurrency(results.shortfall)}:</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-white rounded-lg border border-amber-200 px-4 py-3 text-center">
                        <p className="text-xs text-amber-600 font-semibold uppercase tracking-wider mb-1">Lump Sum (invest now)</p>
                        <p className="text-2xl font-bold text-amber-800">{formatCurrency(results.requiredLumpSum)}</p>
                      </div>
                      <div className="bg-white rounded-lg border border-amber-200 px-4 py-3 text-center">
                        <p className="text-xs text-amber-600 font-semibold uppercase tracking-wider mb-1">Monthly Contribution</p>
                        <p className="text-2xl font-bold text-amber-800">{formatCurrency(results.requiredMonthly)}</p>
                        <p className="text-xs text-amber-600">per month for {yearsToGoal} years</p>
                      </div>
                    </div>
                  </div>
                )}

                {results.surplus > 0 && (
                  <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-800">
                    Existing provisions project to <strong>{formatCurrency(results.provisionsFV)}</strong>, exceeding the goal — surplus of <strong>{formatCurrency(results.surplus)}</strong>.
                  </div>
                )}

                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Assumptions</p>
                  <div className="grid grid-cols-3 gap-2 text-xs text-gray-600">
                    <span>Goal escalation: <strong>{goalEscalation}%</strong></span>
                    <span>Investment growth: <strong>{growthRate}%</strong></span>
                    <span>Time horizon: <strong>{yearsToGoal} years</strong></span>
                  </div>
                </div>
              </>
            )}

            <div className="flex justify-between pt-2">
              <button onClick={() => setTab('provisions')} className="text-sm text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg px-4 py-2 hover:bg-gray-50 transition-colors">← Back</button>
              <button onClick={() => setTab('nextsteps')} className="bg-blue-600 text-white text-sm font-semibold px-5 py-2 rounded-lg hover:bg-blue-700 transition-colors">Next Steps →</button>
            </div>
          </div>
        )}

        {/* ── NEXT STEPS ── */}
        {tab === 'nextsteps' && (
          <div className="space-y-5">
            {results ? (
              <>
                <div className={`rounded-xl px-5 py-4 border ${results.shortfall > 0 ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
                  <p className={`text-sm font-bold mb-1 ${results.shortfall > 0 ? 'text-red-800' : 'text-green-800'}`}>
                    {results.shortfall > 0
                      ? `Shortfall of ${formatCurrency(results.shortfall)} identified`
                      : `Goal is fully funded — surplus of ${formatCurrency(results.surplus)}`}
                  </p>
                  <p className={`text-xs ${results.shortfall > 0 ? 'text-red-700' : 'text-green-700'}`}>
                    {results.shortfall > 0
                      ? `To reach ${goalDescription ? `"${goalDescription}"` : 'the goal'} of ${formatCurrency(results.goalFV)} in ${yearsToGoal} years, an additional lump sum of ${formatCurrency(results.requiredLumpSum)} or a monthly investment of ${formatCurrency(results.requiredMonthly)} is required.`
                      : `Existing provisions project to ${formatCurrency(results.provisionsFV)}, exceeding the goal of ${formatCurrency(results.goalFV)}.`}
                  </p>
                </div>

                <table className="w-full text-xs border-collapse">
                  <tbody>
                    <tr className="bg-gray-50"><td className="px-3 py-2 border border-gray-200 font-semibold text-gray-600 w-48">Goal Description</td><td className="px-3 py-2 border border-gray-200">{goalDescription || '—'}</td></tr>
                    <tr><td className="px-3 py-2 border border-gray-200 font-semibold text-gray-600">Target Amount (today)</td><td className="px-3 py-2 border border-gray-200">{formatCurrency(Number(targetAmount))}</td></tr>
                    <tr className="bg-gray-50"><td className="px-3 py-2 border border-gray-200 font-semibold text-gray-600">Goal Amount (future money)</td><td className="px-3 py-2 border border-gray-200">{formatCurrency(results.goalFV)}</td></tr>
                    <tr><td className="px-3 py-2 border border-gray-200 font-semibold text-gray-600">Time Horizon</td><td className="px-3 py-2 border border-gray-200">{yearsToGoal} years</td></tr>
                    <tr className="bg-gray-50"><td className="px-3 py-2 border border-gray-200 font-semibold text-gray-600">Existing Provisions (projected FV)</td><td className="px-3 py-2 border border-gray-200">{formatCurrency(results.provisionsFV)}</td></tr>
                    {results.shortfall > 0 && <>
                      <tr><td className="px-3 py-2 border border-gray-200 font-semibold text-gray-600">Shortfall</td><td className="px-3 py-2 border border-gray-200 text-red-700 font-bold">{formatCurrency(results.shortfall)}</td></tr>
                      <tr className="bg-gray-50"><td className="px-3 py-2 border border-gray-200 font-semibold text-gray-600">Lump Sum Required (invest now)</td><td className="px-3 py-2 border border-gray-200">{formatCurrency(results.requiredLumpSum)}</td></tr>
                      <tr><td className="px-3 py-2 border border-gray-200 font-semibold text-gray-600">Monthly Contribution Required</td><td className="px-3 py-2 border border-gray-200">{formatCurrency(results.requiredMonthly)} / month for {yearsToGoal} years</td></tr>
                    </>}
                  </tbody>
                </table>
              </>
            ) : (
              <p className="text-sm text-gray-400 text-center py-8">Complete Requirements to see the summary.</p>
            )}

            <div className="flex justify-between pt-2">
              <button onClick={() => setTab('results')} className="text-sm text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg px-4 py-2 hover:bg-gray-50 transition-colors">← Back</button>
              <button onClick={handleComplete} className="bg-blue-600 text-white text-sm font-semibold px-6 py-2.5 rounded-lg hover:bg-blue-700 transition-colors">
                Continue to Product Type Selection →
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
