/**
 * RetirementCalculator.jsx — Investment ROA Builder v3
 *
 * Optional Financial Needs Analysis step between Client Profile and Decision Tree.
 * Follows the tabbed structure: Requirements → Expenses → Provisions → Results → Next Steps
 *
 * Props:
 *   clientProfile   {object}  — from App state (provides DOB, monthly income)
 *   initialData     {object}  — previously saved calculator state
 *   onChange        {fn}      — called on every change with current data
 *   onComplete      {fn}      — called when advisor accepts and continues to Decision Tree
 *   onSkip          {fn}      — called when advisor skips the calculator
 */

import { useState, useMemo } from 'react';
import { formatCurrency } from '../shared/ui.js';

// ── Financial engine ──────────────────────────────────────────────────────

function computeAge(dob) {
  if (!dob) return null;
  const today = new Date();
  const birth = new Date(dob);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age > 0 ? age : null;
}

function computeResults({ retirementAge, currentAge, yearsInRetirement, growthRate, inflationRate, advisorFees, expenses, provisions }) {
  const ytr = retirementAge - (currentAge || 0);
  if (ytr <= 0 || !currentAge) return null;

  const g   = Math.max(0, (growthRate - advisorFees) / 100);
  const inf = inflationRate / 100;

  const totalMonthly = expenses.reduce((s, e) => s + (Number(e.monthlyAmount) || 0), 0);
  if (totalMonthly <= 0) return null;

  // Annual income needed at retirement in future money
  const annualFuture = totalMonthly * 12 * Math.pow(1 + inf, ytr);

  // Real annual return
  const realAnnual = (1 + g) / (1 + inf) - 1;

  // Corpus needed (PV of inflation-escalating annuity during retirement)
  let corpus;
  if (Math.abs(realAnnual) < 0.001) {
    corpus = annualFuture * yearsInRetirement;
  } else {
    corpus = annualFuture * (1 - Math.pow(1 + realAnnual, -yearsInRetirement)) / realAnnual;
  }

  // Future value of each provision
  let provisionsFV = 0;
  provisions.forEach(p => {
    const pv = Number(p.currentValue) || 0;
    const pm = Number(p.monthlyContribution) || 0;
    const pr = (Number(p.growthRate) || growthRate) / 100;
    const monthly_r = Math.pow(1 + pr, 1 / 12) - 1;
    const n = ytr * 12;
    provisionsFV += pv * Math.pow(1 + pr, ytr);
    if (pm > 0 && monthly_r > 0.000001) {
      provisionsFV += pm * (Math.pow(1 + monthly_r, n) - 1) / monthly_r;
    }
  });

  const shortfall = Math.max(0, corpus - provisionsFV);
  const surplus   = Math.max(0, provisionsFV - corpus);

  // Required monthly contribution to close shortfall (annuity FV formula)
  let requiredMonthly = 0;
  if (shortfall > 0) {
    const monthly_g = Math.pow(1 + g, 1 / 12) - 1;
    const n = ytr * 12;
    requiredMonthly = monthly_g > 0.000001
      ? shortfall * monthly_g / (Math.pow(1 + monthly_g, n) - 1)
      : shortfall / n;
  }

  const coveragePct = corpus > 0 ? Math.min(100, (provisionsFV / corpus) * 100) : 0;

  return { ytr, totalMonthlyNow: totalMonthly, annualFuture, corpus, provisionsFV, shortfall, surplus, requiredMonthly, coveragePct };
}

function provisionFV(p, ytr) {
  const pv = Number(p.currentValue) || 0;
  const pm = Number(p.monthlyContribution) || 0;
  const pr = (Number(p.growthRate) || 10) / 100;
  const monthly_r = Math.pow(1 + pr, 1 / 12) - 1;
  const n = ytr * 12;
  let fv = pv * Math.pow(1 + pr, ytr);
  if (pm > 0 && monthly_r > 0.000001) fv += pm * (Math.pow(1 + monthly_r, n) - 1) / monthly_r;
  return fv;
}

// ── Small helpers ─────────────────────────────────────────────────────────

const newExpense   = () => ({ id: Date.now() + Math.random(), description: 'Living Expenses', monthlyAmount: '', escalation: 5 });
const newProvision = () => ({ id: Date.now() + Math.random(), description: '', currentValue: '', monthlyContribution: '', growthRate: 10, type: 'RA' });

function NumInput({ value, onChange, step = 1, min, max, prefix, suffix, placeholder, className = '' }) {
  return (
    <div className="relative">
      {prefix && <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">{prefix}</span>}
      <input
        type="number"
        value={value}
        onChange={e => onChange(e.target.value)}
        step={step}
        min={min}
        max={max}
        placeholder={placeholder}
        className={`w-full text-sm border border-gray-200 rounded-lg py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 ${prefix ? 'pl-6' : 'pl-3'} ${suffix ? 'pr-7' : 'pr-3'} text-right ${className}`}
      />
      {suffix && <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">{suffix}</span>}
    </div>
  );
}

function StatCard({ label, value, sub, colour = 'gray' }) {
  const colours = {
    gray:   'bg-gray-50 border-gray-200 text-gray-900',
    red:    'bg-red-50 border-red-200 text-red-800',
    green:  'bg-green-50 border-green-200 text-green-800',
    amber:  'bg-amber-50 border-amber-200 text-amber-800',
    blue:   'bg-blue-50 border-blue-200 text-blue-800',
  };
  const labelColours = {
    gray: 'text-gray-500', red: 'text-red-600', green: 'text-green-600', amber: 'text-amber-600', blue: 'text-blue-600',
  };
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

export default function RetirementCalculator({ clientProfile = {}, initialData = {}, onChange, onComplete, onSkip }) {
  const [tab, setTab] = useState('requirements');

  // ── State ──
  const [retirementAge,    setRetirementAge]    = useState(initialData.retirementAge    || 65);
  const [yearsInRetirement,setYearsInRetirement]= useState(initialData.yearsInRetirement|| 25);
  const [growthRate,       setGrowthRate]       = useState(initialData.growthRate       || 10);
  const [inflationRate,    setInflationRate]    = useState(initialData.inflationRate    || 6);
  const [advisorFees,      setAdvisorFees]      = useState(initialData.advisorFees      || 1.25);
  const [expenses,         setExpenses]         = useState(() =>
    initialData.expenses?.length ? initialData.expenses : [newExpense()]
  );
  const [provisions,       setProvisions]       = useState(initialData.provisions || []);

  const currentAge = computeAge(clientProfile.dateOfBirth);
  const ytr        = Math.max(0, Number(retirementAge) - (currentAge || 0));

  // ── Live results ──
  const results = useMemo(() => computeResults({
    retirementAge: Number(retirementAge),
    currentAge,
    yearsInRetirement: Number(yearsInRetirement),
    growthRate:    Number(growthRate),
    inflationRate: Number(inflationRate),
    advisorFees:   Number(advisorFees),
    expenses,
    provisions,
  }), [retirementAge, currentAge, yearsInRetirement, growthRate, inflationRate, advisorFees, expenses, provisions]);

  // ── Expense helpers ──
  const addExpense    = ()              => setExpenses(p => [...p, newExpense()]);
  const removeExpense = id             => setExpenses(p => p.filter(e => e.id !== id));
  const updateExpense = (id, f, v)     => setExpenses(p => p.map(e => e.id === id ? { ...e, [f]: v } : e));

  // ── Provision helpers ──
  const addProvision    = ()           => setProvisions(p => [...p, newProvision()]);
  const removeProvision = id           => setProvisions(p => p.filter(x => x.id !== id));
  const updateProvision = (id, f, v)   => setProvisions(p => p.map(x => x.id === id ? { ...x, [f]: v } : x));

  const handleComplete = () => {
    const data = {
      retirementAge: Number(retirementAge),
      yearsInRetirement: Number(yearsInRetirement),
      growthRate: Number(growthRate),
      inflationRate: Number(inflationRate),
      advisorFees: Number(advisorFees),
      expenses,
      provisions,
      results,
    };
    if (onComplete) onComplete(data);
  };

  const TABS = [
    { id: 'requirements', label: 'Requirements' },
    { id: 'expenses',     label: 'Expenses' },
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
          <h2 className="text-xl font-bold text-gray-800">Retirement Calculator</h2>
          {!clientProfile.dateOfBirth && (
            <p className="text-xs text-amber-600 mt-1">Date of birth not set — return to Client Profile to enable age-based projections.</p>
          )}
        </div>
        <button
          onClick={onSkip}
          className="text-sm text-gray-400 hover:text-gray-700 border border-gray-200 rounded-lg px-4 py-2 hover:bg-gray-50 transition-colors flex-shrink-0"
        >
          Skip — not a retirement planning case
        </button>
      </div>

      {/* Quick stats bar (always visible) */}
      {results && (
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-white border border-gray-200 rounded-xl px-3 py-3 text-center">
            <p className="text-xs text-gray-400 mb-0.5">Corpus needed</p>
            <p className="text-base font-bold text-gray-800">{formatCurrency(results.corpus)}</p>
          </div>
          <div className={`border rounded-xl px-3 py-3 text-center ${results.shortfall > 0 ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
            <p className={`text-xs mb-0.5 ${results.shortfall > 0 ? 'text-red-500' : 'text-green-500'}`}>{results.shortfall > 0 ? 'Shortfall' : 'Surplus'}</p>
            <p className={`text-base font-bold ${results.shortfall > 0 ? 'text-red-700' : 'text-green-700'}`}>{formatCurrency(results.shortfall || results.surplus)}</p>
          </div>
          <div className={`border rounded-xl px-3 py-3 text-center ${results.requiredMonthly > 0 ? 'bg-amber-50 border-amber-200' : 'bg-green-50 border-green-200'}`}>
            <p className={`text-xs mb-0.5 ${results.requiredMonthly > 0 ? 'text-amber-500' : 'text-green-500'}`}>Monthly contribution needed</p>
            <p className={`text-base font-bold ${results.requiredMonthly > 0 ? 'text-amber-700' : 'text-green-700'}`}>{results.requiredMonthly > 0 ? formatCurrency(results.requiredMonthly) : 'On track'}</p>
          </div>
        </div>
      )}

      {/* Card with tabs */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">

        {/* Tab bar */}
        <div className="flex border-b border-gray-200 bg-gray-50 overflow-x-auto">
          {TABS.map((t, i) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 min-w-max text-xs font-semibold py-3 px-3 whitespace-nowrap transition-colors border-b-2 ${
                tab === t.id
                  ? 'bg-white border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
            >
              <span className="inline-block w-4 h-4 rounded-full bg-gray-200 text-gray-600 text-xs font-bold mr-1.5 leading-4 text-center">{i + 1}</span>
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="p-6">

          {/* ── 1. REQUIREMENTS ── */}
          {tab === 'requirements' && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Retirement Age</label>
                  <NumInput value={retirementAge} onChange={setRetirementAge} min={50} max={80} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Years in Retirement</label>
                  <NumInput value={yearsInRetirement} onChange={setYearsInRetirement} min={10} max={40} />
                  <p className="text-xs text-gray-400 mt-0.5">Plan to age {Number(retirementAge) + Number(yearsInRetirement)}</p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Date of Birth</label>
                  <input
                    type="text"
                    value={clientProfile.dateOfBirth || 'Not set in Client Profile'}
                    disabled
                    className={`${fieldClass} bg-gray-50 text-gray-500 border-gray-100`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Current Age / Years to Retirement</label>
                  <input
                    type="text"
                    value={currentAge ? `Age ${currentAge} — ${ytr} year${ytr !== 1 ? 's' : ''} to retirement` : 'Set DOB in Client Profile'}
                    disabled
                    className={`${fieldClass} bg-gray-50 text-gray-500 border-gray-100`}
                  />
                </div>
              </div>

              <div className="border-t border-gray-100 pt-5">
                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-3">Projection Assumptions</p>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Investment Growth Rate</label>
                    <NumInput value={growthRate} onChange={setGrowthRate} step={0.5} suffix="%" />
                    <p className="text-xs text-gray-400 mt-0.5">Nominal p.a. (pre-fee)</p>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Inflation Rate (CPI)</label>
                    <NumInput value={inflationRate} onChange={setInflationRate} step={0.5} suffix="%" />
                    <p className="text-xs text-gray-400 mt-0.5">Annual CPI assumption</p>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Ongoing Fees (incl. advisor)</label>
                    <NumInput value={advisorFees} onChange={setAdvisorFees} step={0.25} suffix="%" />
                    <p className="text-xs text-gray-400 mt-0.5">Net return: <strong>{Math.max(0, Number(growthRate) - Number(advisorFees)).toFixed(2)}% p.a.</strong></p>
                  </div>
                </div>
                <div className="mt-3 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 text-xs text-amber-700">
                  <strong>Assumptions disclaimer:</strong> These projections use assumed rates and are for planning purposes only. Actual returns may differ materially. Disclose all assumptions in the ROA.
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button onClick={() => setTab('expenses')} className="text-sm bg-blue-600 text-white font-semibold px-5 py-2 rounded-lg hover:bg-blue-700">
                  Next: Expenses →
                </button>
              </div>
            </div>
          )}

          {/* ── 2. EXPENSES ── */}
          {tab === 'expenses' && (
            <div>
              <p className="text-xs text-gray-500 mb-4">
                Enter the client's expected monthly expenses in <strong>today's money</strong>. The calculator inflates these to the retirement date using the CPI assumption.
              </p>

              <div className="border border-gray-200 rounded-xl overflow-hidden mb-3">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500">Expense Type</th>
                      <th className="text-right px-3 py-2 text-xs font-semibold text-gray-500">Monthly (today's R)</th>
                      <th className="text-right px-3 py-2 text-xs font-semibold text-gray-500">Escalation</th>
                      <th className="px-2 py-2 w-8"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {expenses.map(e => (
                      <tr key={e.id} className="border-t border-gray-100">
                        <td className="px-3 py-2">
                          <input
                            value={e.description}
                            onChange={x => updateExpense(e.id, 'description', x.target.value)}
                            placeholder="e.g. Living Expenses"
                            className="w-full text-sm border border-gray-200 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-400"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <NumInput
                            value={e.monthlyAmount}
                            onChange={v => updateExpense(e.id, 'monthlyAmount', v)}
                            prefix="R"
                            placeholder="0"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <div className="w-24 ml-auto">
                            <NumInput
                              value={e.escalation}
                              onChange={v => updateExpense(e.id, 'escalation', v)}
                              step={0.5}
                              suffix="%"
                            />
                          </div>
                        </td>
                        <td className="px-2 py-2 text-center">
                          <button onClick={() => removeExpense(e.id)} className="text-gray-300 hover:text-red-400 text-xl leading-none">×</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-gray-200 bg-gray-50">
                      <td className="px-3 py-2 text-sm font-semibold text-gray-700">Total monthly expenses</td>
                      <td className="px-3 py-2 text-right text-sm font-bold text-gray-800">
                        {formatCurrency(expenses.reduce((s, e) => s + (Number(e.monthlyAmount) || 0), 0))}
                      </td>
                      <td colSpan={2}></td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              <button onClick={addExpense} className="text-xs text-blue-600 hover:text-blue-800 border border-blue-200 bg-blue-50 rounded-lg px-3 py-2 mb-2">
                + Add Expense Item
              </button>

              {results && (
                <div className="mt-3 bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 text-xs text-gray-500">
                  At retirement ({ytr} years), monthly income needed in future money: <strong className="text-gray-700">{formatCurrency(results.annualFuture / 12)}</strong>
                </div>
              )}

              <div className="flex justify-between mt-5">
                <button onClick={() => setTab('requirements')} className="text-sm text-gray-500 border border-gray-200 px-4 py-2 rounded-lg hover:bg-gray-50">
                  Back
                </button>
                <button onClick={() => setTab('provisions')} className="text-sm bg-blue-600 text-white font-semibold px-5 py-2 rounded-lg hover:bg-blue-700">
                  Next: Provisions →
                </button>
              </div>
            </div>
          )}

          {/* ── 3. PROVISIONS ── */}
          {tab === 'provisions' && (
            <div>
              <p className="text-xs text-gray-500 mb-4">
                Add the client's existing retirement provisions. Include RAs, pension/provident funds, preservation funds, and discretionary savings. Add monthly contributions where applicable.
              </p>

              {provisions.length === 0 && (
                <div className="border-2 border-dashed border-gray-200 rounded-xl py-8 text-center text-gray-400 mb-4">
                  <p className="text-sm font-medium">No provisions added yet</p>
                  <p className="text-xs mt-1">If the client has no existing provisions, the calculator will show the full corpus as a shortfall.</p>
                </div>
              )}

              <div className="space-y-3 mb-3">
                {provisions.map(p => (
                  <div key={p.id} className="border border-gray-200 rounded-xl p-4 bg-gray-50">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Description</label>
                        <input
                          value={p.description}
                          onChange={x => updateProvision(p.id, 'description', x.target.value)}
                          placeholder="e.g. Sanlam RA"
                          className={`${fieldClass} bg-white`}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Type</label>
                        <select
                          value={p.type}
                          onChange={x => updateProvision(p.id, 'type', x.target.value)}
                          className={`${fieldClass} bg-white`}
                        >
                          <option value="RA">Retirement Annuity (RA)</option>
                          <option value="Pension">Pension Fund</option>
                          <option value="Provident">Provident Fund</option>
                          <option value="Preservation">Preservation Fund</option>
                          <option value="Savings">Discretionary Savings</option>
                          <option value="TFSA">Tax-Free Savings Account</option>
                          <option value="Property">Property (equity value)</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Current Value</label>
                        <NumInput
                          value={p.currentValue}
                          onChange={v => updateProvision(p.id, 'currentValue', v)}
                          prefix="R"
                          placeholder="0"
                          className="bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Assumed Growth Rate</label>
                        <NumInput
                          value={p.growthRate}
                          onChange={v => updateProvision(p.id, 'growthRate', v)}
                          step={0.5}
                          suffix="%"
                          className="bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Monthly Contribution (optional)</label>
                        <NumInput
                          value={p.monthlyContribution}
                          onChange={v => updateProvision(p.id, 'monthlyContribution', v)}
                          prefix="R"
                          placeholder="0"
                          className="bg-white"
                        />
                      </div>
                      <div className="flex flex-col justify-end">
                        {ytr > 0 && (
                          <div className="bg-white border border-gray-200 rounded-lg px-3 py-2">
                            <p className="text-xs text-gray-400 mb-0.5">Projected value at retirement</p>
                            <p className="text-sm font-bold text-gray-700">{formatCurrency(provisionFV(p, ytr))}</p>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex justify-end mt-2">
                      <button onClick={() => removeProvision(p.id)} className="text-xs text-gray-400 hover:text-red-500">
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <button onClick={addProvision} className="text-xs text-blue-600 hover:text-blue-800 border border-blue-200 bg-blue-50 rounded-lg px-3 py-2 w-full">
                + Add Provision
              </button>

              <div className="flex justify-between mt-5">
                <button onClick={() => setTab('expenses')} className="text-sm text-gray-500 border border-gray-200 px-4 py-2 rounded-lg hover:bg-gray-50">
                  Back
                </button>
                <button onClick={() => setTab('results')} className="text-sm bg-blue-600 text-white font-semibold px-5 py-2 rounded-lg hover:bg-blue-700">
                  View Results →
                </button>
              </div>
            </div>
          )}

          {/* ── 4. RESULTS ── */}
          {tab === 'results' && (
            <div>
              {!results ? (
                <div className="text-center py-12 text-gray-400">
                  <p className="text-sm mb-2">Complete the Requirements and Expenses tabs to see results.</p>
                  <button onClick={() => setTab('requirements')} className="text-xs text-blue-600 hover:underline">Go to Requirements →</button>
                </div>
              ) : (
                <>
                  {/* Key metrics */}
                  <div className="grid grid-cols-2 gap-4 mb-5">
                    <StatCard
                      label="Corpus Required at Retirement"
                      value={formatCurrency(results.corpus)}
                      sub={`In ${results.ytr} years (future value)`}
                      colour="gray"
                    />
                    <StatCard
                      label="Existing Provisions (Future Value)"
                      value={formatCurrency(results.provisionsFV)}
                      sub={provisions.length ? `Based on ${provisions.length} provision${provisions.length !== 1 ? 's' : ''}` : 'No provisions entered'}
                      colour="gray"
                    />
                    <StatCard
                      label={results.shortfall > 0 ? 'Shortfall' : 'Surplus'}
                      value={formatCurrency(results.shortfall || results.surplus)}
                      sub={results.shortfall > 0 ? 'Additional capital needed at retirement' : 'Current plan exceeds the target'}
                      colour={results.shortfall > 0 ? 'red' : 'green'}
                    />
                    <StatCard
                      label="Required Monthly Contribution"
                      value={results.requiredMonthly > 0 ? formatCurrency(results.requiredMonthly) : 'None required'}
                      sub={results.requiredMonthly > 0 ? `Additional monthly investment to close gap` : 'Client is on track'}
                      colour={results.requiredMonthly > 0 ? 'amber' : 'green'}
                    />
                  </div>

                  {/* Coverage progress bar */}
                  <div className="mb-5">
                    <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                      <span className="font-semibold">Retirement funding coverage</span>
                      <span className={`font-bold ${results.coveragePct >= 100 ? 'text-green-600' : results.coveragePct >= 60 ? 'text-amber-600' : 'text-red-600'}`}>
                        {results.coveragePct.toFixed(1)}%
                      </span>
                    </div>
                    <div className="h-5 bg-gray-100 rounded-full overflow-hidden border border-gray-200">
                      <div
                        className={`h-full rounded-full transition-all duration-500 flex items-center justify-end pr-2 ${
                          results.coveragePct >= 100 ? 'bg-green-500' : results.coveragePct >= 60 ? 'bg-amber-400' : 'bg-red-500'
                        }`}
                        style={{ width: `${Math.max(2, Math.min(100, results.coveragePct))}%` }}
                      >
                        {results.coveragePct > 15 && (
                          <span className="text-white text-xs font-bold">{results.coveragePct.toFixed(0)}%</span>
                        )}
                      </div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-400 mt-1">
                      <span>R 0</span>
                      <span>{formatCurrency(results.corpus)}</span>
                    </div>
                  </div>

                  {/* Monthly income comparison */}
                  <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 mb-5">
                    <p className="text-xs font-semibold text-blue-700 uppercase tracking-wider mb-2">Monthly Income — Today's Money</p>
                    <div className="grid grid-cols-3 gap-4 text-xs">
                      <div>
                        <p className="text-blue-500 mb-0.5">Income needed:</p>
                        <p className="font-bold text-blue-800 text-sm">{formatCurrency(results.totalMonthlyNow)}</p>
                      </div>
                      <div>
                        <p className="text-blue-500 mb-0.5">Provided by existing plan:</p>
                        <p className="font-bold text-blue-800 text-sm">{formatCurrency(results.totalMonthlyNow * results.coveragePct / 100)}</p>
                      </div>
                      <div>
                        <p className="text-blue-500 mb-0.5">Monthly income gap:</p>
                        <p className={`font-bold text-sm ${results.shortfall > 0 ? 'text-red-700' : 'text-green-700'}`}>
                          {results.shortfall > 0 ? formatCurrency(results.totalMonthlyNow * (1 - results.coveragePct / 100)) : 'None'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Assumptions */}
                  <div className="bg-gray-50 border border-gray-100 rounded-lg px-4 py-3 text-xs text-gray-500">
                    <p className="font-semibold text-gray-600 mb-1.5">Assumptions used in this projection</p>
                    <div className="grid grid-cols-3 gap-x-6 gap-y-1">
                      <span>Growth rate: <strong>{growthRate}% p.a.</strong></span>
                      <span>Inflation (CPI): <strong>{inflationRate}% p.a.</strong></span>
                      <span>Ongoing fees: <strong>{advisorFees}% p.a.</strong></span>
                      <span>Net real return: <strong>{Math.max(0, (1 + (growthRate - advisorFees) / 100) / (1 + inflationRate / 100) - 1).toFixed(4) * 100 < 0.01 ? '≈ 0' : ((Math.max(0, (1 + (growthRate - advisorFees) / 100) / (1 + inflationRate / 100) - 1)) * 100).toFixed(2)}% p.a.</strong></span>
                      <span>Retirement age: <strong>{retirementAge}</strong></span>
                      <span>Years in retirement: <strong>{yearsInRetirement}</strong></span>
                    </div>
                  </div>
                </>
              )}

              <div className="flex justify-between mt-5">
                <button onClick={() => setTab('provisions')} className="text-sm text-gray-500 border border-gray-200 px-4 py-2 rounded-lg hover:bg-gray-50">
                  Back
                </button>
                <button onClick={() => setTab('nextsteps')} className="text-sm bg-blue-600 text-white font-semibold px-5 py-2 rounded-lg hover:bg-blue-700">
                  Next Steps →
                </button>
              </div>
            </div>
          )}

          {/* ── 5. NEXT STEPS ── */}
          {tab === 'nextsteps' && (
            <div>
              <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-4">Summary & Recommended Action</p>

              {results && (
                <div className="space-y-3 mb-6">
                  {results.shortfall > 0 ? (
                    <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                      <span className="text-red-500 mt-0.5 flex-shrink-0">!</span>
                      <div>
                        <p className="text-sm font-semibold text-red-800">
                          Retirement shortfall of {formatCurrency(results.shortfall)}
                        </p>
                        <p className="text-xs text-red-600 mt-0.5">
                          An additional monthly contribution of approximately <strong>{formatCurrency(results.requiredMonthly)}</strong> is required to close this gap, assuming {growthRate}% p.a. growth net of fees over {results.ytr} years.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-3 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
                      <span className="text-green-600 mt-0.5 flex-shrink-0">✓</span>
                      <div>
                        <p className="text-sm font-semibold text-green-800">Client is on track for retirement</p>
                        <p className="text-xs text-green-600 mt-0.5">
                          Existing provisions are projected to exceed the retirement corpus target by <strong>{formatCurrency(results.surplus)}</strong>.
                        </p>
                      </div>
                    </div>
                  )}

                  {results.requiredMonthly > 0 && (
                    <div className="flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
                      <span className="text-blue-500 mt-0.5 flex-shrink-0">→</span>
                      <div>
                        <p className="text-sm font-semibold text-blue-800">Recommended action</p>
                        <p className="text-xs text-blue-600 mt-0.5">
                          Select an investment vehicle in the next step. A Retirement Annuity (RA) is typically the first choice for addressing a retirement shortfall — contributions are tax-deductible up to 27.5% of taxable income (capped at R430 000 p.a. — 2026).
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Summary table */}
                  <div className="bg-gray-50 border border-gray-200 rounded-xl overflow-hidden">
                    <div className="px-4 py-2 bg-gray-100 border-b border-gray-200">
                      <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Key Figures for ROA</p>
                    </div>
                    <table className="w-full text-xs">
                      <tbody>
                        {[
                          ['Monthly income required (today)', formatCurrency(results.totalMonthlyNow)],
                          ['Retirement corpus required', formatCurrency(results.corpus)],
                          ['Existing provisions (future value)', formatCurrency(results.provisionsFV)],
                          [results.shortfall > 0 ? 'Shortfall' : 'Surplus', formatCurrency(results.shortfall || results.surplus)],
                          results.requiredMonthly > 0 ? ['Required monthly contribution', formatCurrency(results.requiredMonthly)] : null,
                          [`Coverage (${results.coveragePct.toFixed(1)}%)`, `${results.coveragePct.toFixed(1)}% of retirement target funded`],
                          ['Projection assumptions', `Growth ${growthRate}% | CPI ${inflationRate}% | Fees ${advisorFees}% | Net real ≈ ${Math.max(0, (growthRate - advisorFees - inflationRate)).toFixed(1)}%`],
                        ].filter(Boolean).map(([label, value], i) => (
                          <tr key={i} className="border-t border-gray-100">
                            <td className="px-4 py-2 text-gray-500 w-1/2">{label}</td>
                            <td className="px-4 py-2 font-semibold text-gray-800 text-right">{value}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {!results && (
                <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-6 text-center text-gray-400 mb-6">
                  <p className="text-sm">Complete at least the Requirements and Expenses tabs to generate results.</p>
                  <button onClick={() => setTab('requirements')} className="mt-2 text-xs text-blue-600 hover:underline">Start with Requirements →</button>
                </div>
              )}

              <div className="border-t border-gray-100 pt-5">
                <button
                  onClick={handleComplete}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-3.5 rounded-xl transition-colors text-sm"
                >
                  Continue to Product Type Selection →
                </button>
                <p className="text-xs text-gray-400 text-center mt-2">
                  Calculator results will be saved to this ROA for FAIS compliance purposes.
                </p>
              </div>

              <div className="flex justify-start mt-4">
                <button onClick={() => setTab('results')} className="text-sm text-gray-500 border border-gray-200 px-4 py-2 rounded-lg hover:bg-gray-50">
                  Back to Results
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
