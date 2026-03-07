/**
 * EducationCalculator.jsx — Investment ROA Builder v3
 *
 * Education savings calculator: plans funding for Primary, Secondary and
 * Tertiary education phases based on child's current age, annual costs,
 * existing provisions, and investment growth.
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

function computeEducationResults({ currentAge, escalationRate, growthRate, phases, provisions }) {
  const enabled = phases.filter(p => p.enabled && Number(p.annualCost) > 0 && Number(p.ageAtStart) > 0 && Number(p.term) > 0);
  if (enabled.length === 0 || !currentAge) return null;

  const g   = growthRate   / 100;
  const esc = escalationRate / 100;
  const g_m   = Math.pow(1 + g,   1 / 12) - 1;
  const esc_m = Math.pow(1 + esc, 1 / 12) - 1;

  // PV today of all future education payments
  let educationPV = 0;
  let lastPhaseEnd = 0;

  enabled.forEach(phase => {
    const yearsToStart = Math.max(0, Number(phase.ageAtStart) - currentAge);
    const phaseEnd = yearsToStart + Number(phase.term);
    if (phaseEnd > lastPhaseEnd) lastPhaseEnd = phaseEnd;

    // Each annual payment y years from now: payment = annualCost * (1+esc)^y
    // PV = payment / (1+g)^y = annualCost * ((1+esc)/(1+g))^y
    for (let i = 0; i < Number(phase.term); i++) {
      const y = yearsToStart + i;
      educationPV += Number(phase.annualCost) * Math.pow((1 + esc) / (1 + g), y);
    }
  });

  const n_total = Math.round(lastPhaseEnd * 12); // months until end of last phase

  // PV of provisions (current value is already PV; treat monthly contributions as fixed annuity PV)
  let provisionsPV = 0;
  provisions.forEach(p => {
    const pv = Number(p.currentValue) || 0;
    const pm = Number(p.monthlyContribution) || 0;
    const r  = Math.pow(1 + (Number(p.growthRate) || growthRate) / 100, 1 / 12) - 1;
    provisionsPV += pv;
    if (pm > 0 && n_total > 0) {
      provisionsPV += r > 0.000001
        ? pm * (1 - Math.pow(1 + r, -n_total)) / r
        : pm * n_total;
    }
  });

  const shortfall = Math.max(0, educationPV - provisionsPV);
  const surplus   = Math.max(0, provisionsPV - educationPV);

  // Required monthly contribution (growing at escalation rate) using growing annuity PV formula
  let requiredMonthly = 0;
  if (shortfall > 0 && n_total > 0) {
    if (Math.abs(g_m - esc_m) < 0.000001) {
      requiredMonthly = shortfall / n_total;
    } else {
      requiredMonthly = shortfall * (g_m - esc_m) / (1 - Math.pow((1 + esc_m) / (1 + g_m), n_total));
    }
  }

  const coveragePct = educationPV > 0 ? Math.min(100, (provisionsPV / educationPV) * 100) : 0;

  return { educationPV, provisionsPV, shortfall, surplus, requiredLumpSum: shortfall, requiredMonthly, coveragePct, lastPhaseEnd, escalationRate };
}

function provisionFV(p, years, defaultGrowth) {
  const pv = Number(p.currentValue) || 0;
  const pm = Number(p.monthlyContribution) || 0;
  const pr = (Number(p.growthRate) || defaultGrowth) / 100;
  const monthly_r = Math.pow(1 + pr, 1 / 12) - 1;
  const n = years * 12;
  let fv = pv * Math.pow(1 + pr, years);
  if (pm > 0 && monthly_r > 0.000001) fv += pm * (Math.pow(1 + monthly_r, n) - 1) / monthly_r;
  return fv;
}

// ── Helpers ───────────────────────────────────────────────────────────────

const ASSET_TYPES = ['Endowment', 'Linked Investment', 'Shares', 'Savings Account', 'Tax Free Investment', 'Unit Trust', 'Other'];

const DEFAULT_PHASES = [
  { id: 'primary',   label: 'Primary School',    enabled: true, ageAtStart: 7,  term: 7, annualCost: 30000 },
  { id: 'secondary', label: 'Secondary School',  enabled: true, ageAtStart: 14, term: 5, annualCost: 30000 },
  { id: 'tertiary',  label: 'Tertiary Education', enabled: true, ageAtStart: 19, term: 4, annualCost: 60000 },
];

const newProvision = () => ({ id: Date.now() + Math.random(), description: '', assetType: '', currentValue: '', monthlyContribution: '', growthRate: 10 });

function NumInput({ value, onChange, step = 1, min, max, prefix, suffix, placeholder, className = '' }) {
  return (
    <div className="relative">
      {prefix && <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">{prefix}</span>}
      <input
        type="number" value={value} onChange={e => onChange(e.target.value)}
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

export default function EducationCalculator({ initialData = {}, onChange, onComplete, onBack }) {
  const [tab, setTab] = useState('requirements');

  const [childName,      setChildName]      = useState(initialData.childName      || '');
  const [currentAge,     setCurrentAge]     = useState(initialData.currentAge     || '');
  const [escalationRate, setEscalationRate] = useState(initialData.escalationRate ?? 8);
  const [growthRate,     setGrowthRate]     = useState(initialData.growthRate     ?? 10);
  const [phases,         setPhases]         = useState(initialData.phases         || DEFAULT_PHASES.map(p => ({ ...p })));
  const [provisions,     setProvisions]     = useState(initialData.provisions     || []);

  const results = useMemo(() => computeEducationResults({
    currentAge:    Number(currentAge),
    escalationRate: Number(escalationRate),
    growthRate:    Number(growthRate),
    phases,
    provisions,
  }), [currentAge, escalationRate, growthRate, phases, provisions]);

  // Phase helpers
  const updatePhase = (id, field, value) =>
    setPhases(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));

  // Provision helpers
  const addProvision    = () => setProvisions(p => [...p, newProvision()]);
  const removeProvision = id => setProvisions(p => p.filter(x => x.id !== id));
  const updateProvision = (id, f, v) => setProvisions(p => p.map(x => x.id === id ? { ...x, [f]: v } : x));

  const handleComplete = () => {
    const data = {
      calcType: 'education', childName,
      currentAge: Number(currentAge), escalationRate: Number(escalationRate),
      growthRate: Number(growthRate), phases, provisions, results,
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
          <h2 className="text-xl font-bold text-gray-800">Education Savings Calculator</h2>
        </div>
        <button onClick={onBack} className="text-sm text-gray-400 hover:text-gray-700 border border-gray-200 rounded-lg px-4 py-2 hover:bg-gray-50 transition-colors flex-shrink-0">
          ← Change analysis type
        </button>
      </div>

      {/* Quick stats bar */}
      {results && (
        <div className="mb-5 bg-white border border-gray-200 rounded-xl px-4 py-3 flex flex-wrap gap-4 text-sm">
          <div><span className="text-xs text-gray-400">Education corpus (PV)</span><p className="font-bold text-gray-800">{formatCurrency(results.educationPV)}</p></div>
          <div className="w-px bg-gray-200" />
          <div><span className="text-xs text-gray-400">{results.shortfall > 0 ? 'Shortfall' : 'Surplus'}</span><p className={`font-bold ${results.shortfall > 0 ? 'text-red-600' : 'text-green-600'}`}>{formatCurrency(results.shortfall || results.surplus)}</p></div>
          <div className="w-px bg-gray-200" />
          <div><span className="text-xs text-gray-400">Monthly Required</span><p className="font-bold text-amber-700">{results.requiredMonthly > 0 ? `${formatCurrency(results.requiredMonthly)} ↑${escalationRate}% p.a.` : '—'}</p></div>
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
          <div className="space-y-5">
            <h3 className="text-sm font-semibold text-gray-700 border-b border-gray-100 pb-2">Child & Assumptions</h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">Child's Name</label>
                <input type="text" value={childName} onChange={e => setChildName(e.target.value)}
                  placeholder="e.g. Emma" className={fieldClass} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">Current Age of Child</label>
                <NumInput value={currentAge} onChange={setCurrentAge} suffix="yrs" min={0} max={25} step={1} placeholder="0" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">Education Escalation Rate</label>
                <NumInput value={escalationRate} onChange={setEscalationRate} suffix="%" min={0} max={20} step={0.5} />
                <p className="text-xs text-gray-400 mt-1">Annual increase in education costs</p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">Expected Investment Growth</label>
                <NumInput value={growthRate} onChange={setGrowthRate} suffix="%" min={0} max={25} step={0.5} />
                <p className="text-xs text-gray-400 mt-1">Net annual return on investment</p>
              </div>
            </div>

            <h3 className="text-sm font-semibold text-gray-700 border-b border-gray-100 pb-2 pt-2">Education Phases</h3>

            <div className="space-y-3">
              {phases.map(phase => (
                <div key={phase.id} className={`border rounded-xl p-4 transition-all ${phase.enabled ? 'border-blue-200 bg-blue-50/30' : 'border-gray-200 opacity-60'}`}>
                  <div className="flex items-center gap-3 mb-3">
                    <input type="checkbox" id={`ph-${phase.id}`} checked={phase.enabled}
                      onChange={e => updatePhase(phase.id, 'enabled', e.target.checked)}
                      className="w-4 h-4 accent-blue-600" />
                    <label htmlFor={`ph-${phase.id}`} className="text-sm font-bold text-gray-800 cursor-pointer">{phase.label}</label>
                    {phase.enabled && currentAge > 0 && Number(phase.ageAtStart) > 0 && (
                      <span className="ml-auto text-xs text-blue-600 font-medium">
                        Starts in {Math.max(0, Number(phase.ageAtStart) - Number(currentAge))} years
                      </span>
                    )}
                  </div>
                  {phase.enabled && (
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1">Age at Start</label>
                        <NumInput value={phase.ageAtStart} onChange={v => updatePhase(phase.id, 'ageAtStart', v)} suffix="yrs" min={0} max={30} step={1} />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1">Duration (term)</label>
                        <NumInput value={phase.term} onChange={v => updatePhase(phase.id, 'term', v)} suffix="yrs" min={1} max={10} step={1} />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1">Annual Cost (today)</label>
                        <NumInput value={phase.annualCost} onChange={v => updatePhase(phase.id, 'annualCost', v)} prefix="R" min={0} step={5000} />
                      </div>
                    </div>
                  )}
                  {phase.enabled && currentAge > 0 && Number(phase.ageAtStart) > 0 && Number(phase.annualCost) > 0 && (
                    <p className="text-xs text-gray-400 mt-2">
                      First year cost in future money:{' '}
                      <strong className="text-gray-600">
                        {formatCurrency(Number(phase.annualCost) * Math.pow(1 + Number(escalationRate) / 100, Math.max(0, Number(phase.ageAtStart) - Number(currentAge))))}
                      </strong>
                    </p>
                  )}
                </div>
              ))}
            </div>

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
              <h3 className="text-sm font-semibold text-gray-700">Existing Education Savings</h3>
              <button onClick={addProvision} className="text-xs text-blue-600 hover:text-blue-800 font-semibold border border-blue-200 rounded-lg px-3 py-1.5 hover:bg-blue-50 transition-colors">
                + Add Asset
              </button>
            </div>

            {provisions.length === 0 && (
              <div className="text-center py-8 text-gray-400">
                <p className="text-sm">No existing provisions added.</p>
                <p className="text-xs mt-1">Add any savings already earmarked for education.</p>
              </div>
            )}

            {provisions.map(p => (
              <div key={p.id} className="border border-gray-200 rounded-xl p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="flex-1">
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Description</label>
                    <input type="text" value={p.description} onChange={e => updateProvision(p.id, 'description', e.target.value)}
                      placeholder="e.g. Education endowment, TFSA..."
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
                    <NumInput value={p.currentValue} onChange={v => updateProvision(p.id, 'currentValue', v)} prefix="R" min={0} step={5000} placeholder="0" />
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
                {results?.lastPhaseEnd > 0 && (Number(p.currentValue) > 0 || Number(p.monthlyContribution) > 0) && (
                  <p className="text-xs text-gray-400">
                    Projected value at end of education ({results.lastPhaseEnd} yrs):{' '}
                    <strong className="text-gray-600">{formatCurrency(provisionFV(p, results.lastPhaseEnd, growthRate))}</strong>
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
                <p className="text-xs mt-1">Ensure the child's age and at least one enabled phase with a cost are filled in.</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <StatCard label="Education Corpus (present value)" value={formatCurrency(results.educationPV)} sub={`Across all enabled phases`} colour="gray" />
                  <StatCard label="Provisions (present value)"       value={formatCurrency(results.provisionsPV)} colour="blue" />
                  <StatCard label={results.shortfall > 0 ? 'Shortfall' : 'Surplus'} value={formatCurrency(results.shortfall || results.surplus)} colour={results.shortfall > 0 ? 'red' : 'green'} />
                  <StatCard label="Coverage" value={`${results.coveragePct.toFixed(1)}%`} colour={results.coveragePct >= 100 ? 'green' : results.coveragePct >= 60 ? 'amber' : 'red'} />
                </div>

                {/* Phase breakdown */}
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Education Phase Summary</p>
                  <table className="w-full text-xs border-collapse">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="text-left px-3 py-2 border border-gray-200 font-semibold text-gray-600">Phase</th>
                        <th className="text-center px-3 py-2 border border-gray-200 font-semibold text-gray-600">Age</th>
                        <th className="text-center px-3 py-2 border border-gray-200 font-semibold text-gray-600">Term</th>
                        <th className="text-right px-3 py-2 border border-gray-200 font-semibold text-gray-600">Annual Cost Now</th>
                        <th className="text-right px-3 py-2 border border-gray-200 font-semibold text-gray-600">First Year (future)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {phases.filter(p => p.enabled).map(p => {
                        const yrs = Math.max(0, Number(p.ageAtStart) - Number(currentAge));
                        const futureCost = Number(p.annualCost) * Math.pow(1 + Number(escalationRate) / 100, yrs);
                        return (
                          <tr key={p.id}>
                            <td className="px-3 py-2 border border-gray-200 font-medium text-gray-800">{p.label}</td>
                            <td className="px-3 py-2 border border-gray-200 text-center text-gray-600">{p.ageAtStart}</td>
                            <td className="px-3 py-2 border border-gray-200 text-center text-gray-600">{p.term} yrs</td>
                            <td className="px-3 py-2 border border-gray-200 text-right">{formatCurrency(p.annualCost)}</td>
                            <td className="px-3 py-2 border border-gray-200 text-right font-medium">{formatCurrency(futureCost)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
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
                        <p className="text-xs text-amber-600">escalating at {escalationRate}% p.a.</p>
                      </div>
                    </div>
                  </div>
                )}

                {results.surplus > 0 && (
                  <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-800">
                    Existing provisions are sufficient. Projected surplus of <strong>{formatCurrency(results.surplus)}</strong> in present value terms.
                  </div>
                )}

                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Assumptions</p>
                  <div className="grid grid-cols-3 gap-2 text-xs text-gray-600">
                    <span>Education escalation: <strong>{escalationRate}%</strong></span>
                    <span>Investment growth: <strong>{growthRate}%</strong></span>
                    <span>Planning horizon: <strong>{results.lastPhaseEnd} years</strong></span>
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
                      ? `Education funding shortfall of ${formatCurrency(results.shortfall)} identified`
                      : `Education is fully funded — surplus of ${formatCurrency(results.surplus)}`}
                  </p>
                  <p className={`text-xs ${results.shortfall > 0 ? 'text-red-700' : 'text-green-700'}`}>
                    {results.shortfall > 0
                      ? `${childName ? `${childName}'s` : 'The'} education requires an additional lump sum of ${formatCurrency(results.requiredLumpSum)} invested today, or a monthly contribution of ${formatCurrency(results.requiredMonthly)} escalating at ${escalationRate}% p.a.`
                      : `Current provisions project above the total education cost in present value terms.`}
                  </p>
                </div>

                <table className="w-full text-xs border-collapse">
                  <tbody>
                    {childName && <tr className="bg-gray-50"><td className="px-3 py-2 border border-gray-200 font-semibold text-gray-600 w-48">Child's Name</td><td className="px-3 py-2 border border-gray-200">{childName}</td></tr>}
                    <tr><td className="px-3 py-2 border border-gray-200 font-semibold text-gray-600">Current Age</td><td className="px-3 py-2 border border-gray-200">{currentAge} years</td></tr>
                    <tr className="bg-gray-50"><td className="px-3 py-2 border border-gray-200 font-semibold text-gray-600">Education Phases</td><td className="px-3 py-2 border border-gray-200">{phases.filter(p => p.enabled).map(p => p.label).join(', ')}</td></tr>
                    <tr><td className="px-3 py-2 border border-gray-200 font-semibold text-gray-600">Education Corpus (PV)</td><td className="px-3 py-2 border border-gray-200">{formatCurrency(results.educationPV)}</td></tr>
                    <tr className="bg-gray-50"><td className="px-3 py-2 border border-gray-200 font-semibold text-gray-600">Existing Provisions (PV)</td><td className="px-3 py-2 border border-gray-200">{formatCurrency(results.provisionsPV)}</td></tr>
                    {results.shortfall > 0 && <>
                      <tr><td className="px-3 py-2 border border-gray-200 font-semibold text-gray-600">Shortfall</td><td className="px-3 py-2 border border-gray-200 text-red-700 font-bold">{formatCurrency(results.shortfall)}</td></tr>
                      <tr className="bg-gray-50"><td className="px-3 py-2 border border-gray-200 font-semibold text-gray-600">Lump Sum Required</td><td className="px-3 py-2 border border-gray-200">{formatCurrency(results.requiredLumpSum)}</td></tr>
                      <tr><td className="px-3 py-2 border border-gray-200 font-semibold text-gray-600">Monthly Contribution Required</td><td className="px-3 py-2 border border-gray-200">{formatCurrency(results.requiredMonthly)} / month, escalating at {escalationRate}% p.a.</td></tr>
                    </>}
                    <tr className="bg-gray-50"><td className="px-3 py-2 border border-gray-200 font-semibold text-gray-600">Assumptions</td><td className="px-3 py-2 border border-gray-200">Education escalation {escalationRate}% · Investment growth {growthRate}%</td></tr>
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
