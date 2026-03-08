/**
 * StrategicWealthEngine.jsx — Investment ROA Builder v3
 *
 * Integrated life-stage financial modelling tool. Captures the client's
 * full financial picture (assets, income, expenses) and models four
 * strategic moves against a year-by-year simulation:
 *   1. Change growth assumptions (separate pre- and post-retirement rates)
 *   2. Increase monthly savings
 *   3. Reduce monthly expenses
 *   4. Work longer (change retirement age)
 *
 * The "life chart" shows total portfolio value from now to life expectancy
 * for both the Current and Planned scenarios, making it immediately visible
 * how long the money lasts and where it runs out.
 *
 * Props:
 *   clientProfile   {object}  — pre-fills age and income
 *   initialData     {object}  — previously saved state
 *   onChange        {fn}
 *   onComplete      {fn}
 *   onBack          {fn}
 */

import { useState, useMemo } from 'react';
import { formatCurrency } from '../shared/ui.js';

// ── Constants ─────────────────────────────────────────────────────────────

const ASSET_TYPES = [
  'Retirement Annuity','Pension Fund','Provident Fund',
  'Preservation Pension Fund','Preservation Provident Fund',
  'Living Annuity','Tax-free Investment','Linked Investment',
  'Endowment','Savings Account','Shares','Property',
  'Business Interest','Vehicle','Other',
];
const INCOME_TYPES  = ['Salary','Investment Income','Rental Income','Business Income','Other Income'];
const EXPENSE_TYPES = ['Living Expenses','Debt Repayment','Insurance Premiums','Investment Contributions','Medical / Gap Cover','Other'];

// ── Financial simulation ──────────────────────────────────────────────────

function simulate({ totalAssets, monthlyIncome, monthlyExpenses,
                    currentAge, retirementAge, lifeExpectancy,
                    preGrowth, postGrowth,
                    extraSavings = 0, expenseReduction = 0, altRetirement }) {
  const retAge = altRetirement || retirementAge;
  const gPre   = preGrowth  / 100;
  const gPost  = postGrowth / 100;
  const annualPreFlow  = (monthlyIncome  - (monthlyExpenses - expenseReduction) + extraSavings) * 12;
  const annualPostFlow = -(monthlyExpenses - expenseReduction) * 12;

  const data = [];
  let balance = Math.max(0, totalAssets);

  for (let age = currentAge; age <= lifeExpectancy; age++) {
    const isRetired = age >= retAge;
    balance = balance * (1 + (isRetired ? gPost : gPre)) + (isRetired ? annualPostFlow : annualPreFlow);
    const bal = Math.max(0, balance);
    data.push({ age, balance: bal, depleted: balance <= 0 });
    if (balance <= 0) {
      for (let a = age + 1; a <= lifeExpectancy; a++) data.push({ age: a, balance: 0, depleted: true });
      break;
    }
  }
  return data;
}

function depletionAge(data) {
  const d = data.find(x => x.depleted);
  return d ? d.age : null;
}

function computeAge(dob) {
  if (!dob) return null;
  const today = new Date();
  const birth = new Date(dob);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age > 0 ? age : null;
}

// ── SVG Life Chart ────────────────────────────────────────────────────────

function LifeChart({ baseData, planData, retirementAge, altRetirement, currentAge }) {
  const W = 620, H = 220;
  const PL = 58, PB = 28, PT = 18, PR = 12;
  const cW = W - PL - PR, cH = H - PT - PB;

  const allBal = [...baseData, ...planData].map(d => d.balance);
  const maxB   = Math.max(...allBal, 1);
  const minAge = currentAge;
  const maxAge = Math.max(...baseData.map(d => d.age), ...planData.map(d => d.age));
  const span   = Math.max(maxAge - minAge, 1);

  const xS = a  => PL + ((a - minAge) / span) * cW;
  const yS = v  => PT + cH - Math.min(1, v / maxB) * cH;

  const linePath = d => d.map((p, i) => `${i === 0 ? 'M' : 'L'}${xS(p.age).toFixed(1)},${yS(p.balance).toFixed(1)}`).join('');
  const areaPath = d => {
    if (!d.length) return '';
    const last = d[d.length - 1];
    return `${linePath(d)}L${xS(last.age).toFixed(1)},${(PT + cH).toFixed(1)}L${xS(d[0].age).toFixed(1)},${(PT + cH).toFixed(1)}Z`;
  };

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map(f => ({ v: maxB * f, y: yS(maxB * f) }));
  const xTicks = [];
  for (let a = Math.ceil((minAge + 1) / 5) * 5; a <= maxAge; a += 5) xTicks.push(a);

  const baseDep  = depletionAge(baseData);
  const planDep  = depletionAge(planData);
  const retX     = xS(retirementAge);
  const altX     = altRetirement ? xS(altRetirement) : null;

  const fmtV = v => v >= 1e6 ? `R${(v/1e6).toFixed(1)}M` : v >= 1e3 ? `R${(v/1e3).toFixed(0)}k` : `R${v.toFixed(0)}`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ minHeight: 160 }}>
      {/* Grid */}
      {yTicks.map(({ y }) => <line key={y} x1={PL} x2={W-PR} y1={y} y2={y} stroke="#e5e7eb" strokeWidth="0.7" />)}

      {/* Base area + line */}
      <path d={areaPath(baseData)} fill="rgba(148,163,184,0.12)" />
      <path d={linePath(baseData)} fill="none" stroke="rgba(148,163,184,0.8)" strokeWidth="1.5" />

      {/* Plan area + line */}
      <path d={areaPath(planData)} fill="rgba(59,130,246,0.18)" />
      <path d={linePath(planData)} fill="none" stroke="rgba(37,99,235,0.9)" strokeWidth="2.5" />

      {/* Zero / depletion line */}
      <line x1={PL} x2={W-PR} y1={yS(0)} y2={yS(0)} stroke="#ef4444" strokeWidth="0.8" strokeOpacity="0.5" />

      {/* Retirement age */}
      <line x1={retX} x2={retX} y1={PT} y2={PT+cH} stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="5,3" />
      <text x={retX+3} y={PT+11} fill="#d97706" fontSize="8.5" fontWeight="700">Retire {retirementAge}</text>

      {/* Alt retirement age */}
      {altX && <>
        <line x1={altX} x2={altX} y1={PT} y2={PT+cH} stroke="#10b981" strokeWidth="1.5" strokeDasharray="5,3" />
        <text x={altX+3} y={PT+22} fill="#059669" fontSize="8.5" fontWeight="700">Retire {altRetirement}</text>
      </>}

      {/* Depletion markers */}
      {baseDep && baseDep <= maxAge && (
        <circle cx={xS(baseDep)} cy={yS(0)} r="4" fill="#ef4444" opacity="0.5" />
      )}
      {planDep && planDep <= maxAge && (
        <circle cx={xS(planDep)} cy={yS(0)} r="4" fill="#ef4444" opacity="0.9" />
      )}

      {/* Y labels */}
      {yTicks.map(({ v, y }) => (
        <text key={v} x={PL-4} y={y+3.5} textAnchor="end" fontSize="8" fill="#9ca3af">{fmtV(v)}</text>
      ))}

      {/* X labels */}
      {xTicks.map(a => (
        <text key={a} x={xS(a)} y={H-5} textAnchor="middle" fontSize="8" fill="#9ca3af">{a}</text>
      ))}

      {/* Legend */}
      <rect x={PL+8} y={PT+3} width="14" height="3" fill="rgba(148,163,184,0.8)" rx="1" />
      <text x={PL+25} y={PT+8} fontSize="8" fill="#6b7280">Current</text>
      <rect x={PL+72} y={PT+3} width="14" height="3" fill="rgba(37,99,235,0.9)" rx="1" />
      <text x={PL+89} y={PT+8} fontSize="8" fill="#3b82f6" fontWeight="600">Planned</text>
    </svg>
  );
}

// ── Small helpers ─────────────────────────────────────────────────────────

const newAsset   = () => ({ id: Date.now() + Math.random(), description: '', type: '', value: '', growthRate: 10 });
const newIncome  = () => ({ id: Date.now() + Math.random(), description: '', type: 'Salary', monthlyAmount: '' });
const newExpense = () => ({ id: Date.now() + Math.random(), description: '', type: 'Living Expenses', monthlyAmount: '' });

function NumInput({ value, onChange, step = 1, min, max, prefix, suffix, placeholder, className = '' }) {
  return (
    <div className="relative flex-1">
      {prefix && <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">{prefix}</span>}
      <input type="number" value={value} onChange={e => onChange(e.target.value)}
        step={step} min={min} max={max} placeholder={placeholder}
        className={`w-full text-sm border border-gray-200 rounded-lg py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 ${prefix ? 'pl-6' : 'pl-3'} ${suffix ? 'pr-8' : 'pr-3'} ${className}`}
      />
      {suffix && <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">{suffix}</span>}
    </div>
  );
}

function StatPill({ label, current, planned, positive }) {
  const changed = planned !== current;
  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs">
      <p className="text-gray-500 mb-0.5">{label}</p>
      <p className="font-bold text-gray-800">{current}</p>
      {changed && <p className={`font-semibold mt-0.5 ${positive ? 'text-green-600' : 'text-blue-600'}`}>▶ {planned}</p>}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════════════════════

export default function StrategicWealthEngine({ clientProfile = {}, initialData = {}, onChange, onComplete, onBack }) {
  const derivedAge    = computeAge(clientProfile.dateOfBirth);
  const derivedIncome = clientProfile.grossMonthlyIncome ? Number(clientProfile.grossMonthlyIncome) : null;

  const [tab, setTab] = useState('financials');

  // ── Financials state ──
  const [assets,   setAssets]   = useState(initialData.assets   || []);
  const [incomes,  setIncomes]  = useState(initialData.incomes  || (derivedIncome ? [{ id: 1, description: 'Gross Monthly Income', type: 'Salary', monthlyAmount: derivedIncome }] : []));
  const [expenses, setExpenses] = useState(initialData.expenses || []);

  // ── Base assumptions ──
  const [currentAge,     setCurrentAge]    = useState(initialData.currentAge     || derivedAge || '');
  const [retirementAge,  setRetirementAge] = useState(initialData.retirementAge  || 65);
  const [lifeExpectancy, setLifeExp]       = useState(initialData.lifeExpectancy || 90);
  const [preGrowth,      setPreGrowth]     = useState(initialData.preGrowth      ?? 10);
  const [postGrowth,     setPostGrowth]    = useState(initialData.postGrowth     ?? 7);

  // ── Strategy levers (scenario) ──
  const [moveActive, setMoveActive] = useState({ growth: false, savings: false, expenses: false, retire: false });
  const [altPreGrowth,    setAltPreGrowth]   = useState(initialData.altPreGrowth    || '');
  const [altPostGrowth,   setAltPostGrowth]  = useState(initialData.altPostGrowth   || '');
  const [extraSavings,    setExtraSavings]   = useState(initialData.extraSavings    || '');
  const [expenseReduct,   setExpenseReduct]  = useState(initialData.expenseReduct   || '');
  const [altRetirement,   setAltRetirement]  = useState(initialData.altRetirement   || '');

  const toggleMove = key => setMoveActive(m => ({ ...m, [key]: !m[key] }));

  // ── Computed totals ──
  const totalAssets   = assets.reduce((s, a)  => s + (Number(a.value)         || 0), 0);
  const totalIncome   = incomes.reduce((s, i)  => s + (Number(i.monthlyAmount) || 0), 0);
  const totalExpenses = expenses.reduce((s, e) => s + (Number(e.monthlyAmount) || 0), 0);
  const netMonthly    = totalIncome - totalExpenses;

  // ── Simulation ──
  const baseParams = {
    totalAssets, monthlyIncome: totalIncome, monthlyExpenses: totalExpenses,
    currentAge: Number(currentAge), retirementAge: Number(retirementAge),
    lifeExpectancy: Number(lifeExpectancy), preGrowth: Number(preGrowth), postGrowth: Number(postGrowth),
  };

  const planParams = {
    ...baseParams,
    preGrowth:  moveActive.growth && altPreGrowth  ? Number(altPreGrowth)  : Number(preGrowth),
    postGrowth: moveActive.growth && altPostGrowth ? Number(altPostGrowth) : Number(postGrowth),
    extraSavings:   moveActive.savings  ? (Number(extraSavings)  || 0) : 0,
    expenseReduction: moveActive.expenses ? (Number(expenseReduct) || 0) : 0,
    altRetirement: moveActive.retire && altRetirement ? Number(altRetirement) : undefined,
  };

  const baseData = useMemo(() => {
    if (!currentAge || !totalAssets && !totalIncome) return [];
    return simulate(baseParams);
  }, [totalAssets, totalIncome, totalExpenses, currentAge, retirementAge, lifeExpectancy, preGrowth, postGrowth]);

  const planData = useMemo(() => {
    if (!currentAge) return [];
    return simulate(planParams);
  }, [planParams.totalAssets, planParams.monthlyIncome, planParams.monthlyExpenses,
      planParams.currentAge, planParams.retirementAge, planParams.lifeExpectancy,
      planParams.preGrowth, planParams.postGrowth, planParams.extraSavings,
      planParams.expenseReduction, planParams.altRetirement]);

  const baseDep = depletionAge(baseData);
  const planDep = depletionAge(planData);

  const retirementBalance = (data) => {
    const ret = data.find(d => d.age === Number(retirementAge));
    return ret ? ret.balance : null;
  };

  // ── List helpers ──
  const addItem    = (setter, fn)       => setter(p => [...p, fn()]);
  const removeItem = (setter, id)       => setter(p => p.filter(x => x.id !== id));
  const updateItem = (setter, id, f, v) => setter(p => p.map(x => x.id === id ? { ...x, [f]: v } : x));

  const handleComplete = () => {
    const data = {
      calcType: 'wealth', assets, incomes, expenses,
      currentAge: Number(currentAge), retirementAge: Number(retirementAge),
      lifeExpectancy: Number(lifeExpectancy), preGrowth: Number(preGrowth), postGrowth: Number(postGrowth),
      strategy: { ...moveActive, altPreGrowth, altPostGrowth, extraSavings, expenseReduct, altRetirement },
      results: {
        totalAssets, totalIncome, totalExpenses,
        baseDepletionAge: baseDep,
        planDepletionAge: planDep,
        retirementBalance: retirementBalance(baseData),
        planRetirementBalance: retirementBalance(planData),
      },
    };
    if (onComplete) onComplete(data);
  };

  const fieldCls = 'w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400';

  // ── Render ──
  return (
    <div className="max-w-5xl mx-auto">

      {/* Header */}
      <div className="mb-5 flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-purple-600 uppercase tracking-wider mb-0.5">Financial Needs Analysis</p>
          <h2 className="text-xl font-bold text-gray-800">Strategic Wealth Engine</h2>
          <p className="text-xs text-gray-400 mt-0.5">Model the full financial life plan · test strategies · see how long the money lasts</p>
        </div>
        <button onClick={onBack} className="text-sm text-gray-400 hover:text-gray-700 border border-gray-200 rounded-lg px-4 py-2 hover:bg-gray-50 transition-colors flex-shrink-0">
          ← Change analysis type
        </button>
      </div>

      {/* Summary strip */}
      <div className="mb-5 bg-white border border-gray-200 rounded-xl px-4 py-3 flex flex-wrap gap-3 text-xs">
        <div><span className="text-gray-400">Total Assets</span><p className="font-bold text-gray-800 text-sm">{formatCurrency(totalAssets)}</p></div>
        <div className="w-px bg-gray-200" />
        <div><span className="text-gray-400">Monthly Income</span><p className="font-bold text-gray-800 text-sm">{formatCurrency(totalIncome)}</p></div>
        <div className="w-px bg-gray-200" />
        <div><span className="text-gray-400">Monthly Expenses</span><p className="font-bold text-gray-800 text-sm">{formatCurrency(totalExpenses)}</p></div>
        <div className="w-px bg-gray-200" />
        <div><span className="text-gray-400">Monthly Net</span><p className={`font-bold text-sm ${netMonthly >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(netMonthly)}</p></div>
        {baseDep && <><div className="w-px bg-gray-200" /><div><span className="text-gray-400">Money runs out (current)</span><p className="font-bold text-red-600 text-sm">Age {baseDep}</p></div></>}
        {planDep && planDep !== baseDep && <><div className="w-px bg-gray-200" /><div><span className="text-gray-400">Money runs out (planned)</span><p className="font-bold text-orange-600 text-sm">Age {planDep}</p></div></>}
        {!planDep && planData.length > 0 && <><div className="w-px bg-gray-200" /><div><span className="text-gray-400">Planned scenario</span><p className="font-bold text-green-600 text-sm">Fully funded to {lifeExpectancy}</p></div></>}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 bg-gray-100 rounded-xl p-1">
        {[['financials','Financials'],['modelling','Modelling']].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)}
            className={`flex-1 text-xs font-semibold py-2 rounded-lg transition-colors ${tab === id ? 'bg-white text-purple-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            {label}
          </button>
        ))}
      </div>

      {/* ── FINANCIALS TAB ── */}
      {tab === 'financials' && (
        <div className="space-y-5">

          {/* Base Assumptions */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-gray-700 border-b border-gray-100 pb-2 mb-4">Base Assumptions</h3>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Current Age</label>
                <NumInput value={currentAge} onChange={setCurrentAge} suffix="yrs" min={18} max={80} step={1}
                  placeholder={derivedAge || '40'} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Retirement Age</label>
                <NumInput value={retirementAge} onChange={setRetirementAge} suffix="yrs" min={45} max={80} step={1} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Life Expectancy</label>
                <NumInput value={lifeExpectancy} onChange={setLifeExp} suffix="yrs" min={70} max={110} step={1} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Pre-Retirement Growth</label>
                <NumInput value={preGrowth} onChange={setPreGrowth} suffix="%" min={0} max={25} step={0.5} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Post-Retirement Growth</label>
                <NumInput value={postGrowth} onChange={setPostGrowth} suffix="%" min={0} max={20} step={0.5} />
              </div>
            </div>
          </div>

          {/* Assets */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <div className="flex items-center justify-between border-b border-gray-100 pb-2 mb-4">
              <div>
                <h3 className="text-sm font-semibold text-gray-700">Assets</h3>
                <p className="text-xs text-gray-400">Total: <strong className="text-gray-700">{formatCurrency(totalAssets)}</strong></p>
              </div>
              <button onClick={() => addItem(setAssets, newAsset)} className="text-xs text-purple-600 hover:text-purple-800 font-semibold border border-purple-200 rounded-lg px-3 py-1.5 hover:bg-purple-50 transition-colors">+ Add Asset</button>
            </div>
            {assets.length === 0 && <p className="text-xs text-gray-400 text-center py-4">No assets added. Click "+ Add Asset" to start.</p>}
            <div className="space-y-2">
              {assets.map(a => (
                <div key={a.id} className="flex items-center gap-2">
                  <select value={a.type} onChange={e => updateItem(setAssets, a.id, 'type', e.target.value)} className="text-xs border border-gray-200 rounded-lg px-2 py-2 focus:outline-none focus:ring-2 focus:ring-purple-300 w-44 flex-shrink-0">
                    <option value="">Asset Type...</option>
                    {ASSET_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <input type="text" value={a.description} onChange={e => updateItem(setAssets, a.id, 'description', e.target.value)}
                    placeholder="Description (optional)" className="text-xs border border-gray-200 rounded-lg px-2 py-2 focus:outline-none w-36 flex-shrink-0" />
                  <NumInput value={a.value} onChange={v => updateItem(setAssets, a.id, 'value', v)} prefix="R" min={0} step={10000} placeholder="Market value" />
                  <div className="flex items-center gap-1 flex-shrink-0 w-24">
                    <NumInput value={a.growthRate} onChange={v => updateItem(setAssets, a.id, 'growthRate', v)} suffix="%" min={0} max={25} step={0.5} />
                  </div>
                  <button onClick={() => removeItem(setAssets, a.id)} className="text-xs text-red-400 hover:text-red-600 px-1.5 flex-shrink-0">✕</button>
                </div>
              ))}
            </div>
            {assets.length > 0 && <p className="text-xs text-gray-400 mt-2">Tip: enter individual growth rates per asset, or leave to use base assumptions above.</p>}
          </div>

          {/* Incomes */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <div className="flex items-center justify-between border-b border-gray-100 pb-2 mb-4">
              <div>
                <h3 className="text-sm font-semibold text-gray-700">Monthly Income</h3>
                <p className="text-xs text-gray-400">Total: <strong className="text-green-700">{formatCurrency(totalIncome)} / month</strong></p>
              </div>
              <button onClick={() => addItem(setIncomes, newIncome)} className="text-xs text-green-600 hover:text-green-800 font-semibold border border-green-200 rounded-lg px-3 py-1.5 hover:bg-green-50 transition-colors">+ Add Income</button>
            </div>
            {incomes.length === 0 && <p className="text-xs text-gray-400 text-center py-4">No income streams added.</p>}
            <div className="space-y-2">
              {incomes.map(i => (
                <div key={i.id} className="flex items-center gap-2">
                  <select value={i.type} onChange={e => updateItem(setIncomes, i.id, 'type', e.target.value)} className="text-xs border border-gray-200 rounded-lg px-2 py-2 focus:outline-none w-40 flex-shrink-0">
                    {INCOME_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <input type="text" value={i.description} onChange={e => updateItem(setIncomes, i.id, 'description', e.target.value)}
                    placeholder="Description" className="text-xs border border-gray-200 rounded-lg px-2 py-2 focus:outline-none flex-1 min-w-0" />
                  <NumInput value={i.monthlyAmount} onChange={v => updateItem(setIncomes, i.id, 'monthlyAmount', v)} prefix="R" min={0} step={1000} placeholder="Monthly" />
                  <button onClick={() => removeItem(setIncomes, i.id)} className="text-xs text-red-400 hover:text-red-600 px-1.5 flex-shrink-0">✕</button>
                </div>
              ))}
            </div>
          </div>

          {/* Expenses */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <div className="flex items-center justify-between border-b border-gray-100 pb-2 mb-4">
              <div>
                <h3 className="text-sm font-semibold text-gray-700">Monthly Expenses</h3>
                <p className="text-xs text-gray-400">Total: <strong className="text-red-600">{formatCurrency(totalExpenses)} / month</strong></p>
              </div>
              <button onClick={() => addItem(setExpenses, newExpense)} className="text-xs text-red-600 hover:text-red-800 font-semibold border border-red-200 rounded-lg px-3 py-1.5 hover:bg-red-50 transition-colors">+ Add Expense</button>
            </div>
            {expenses.length === 0 && <p className="text-xs text-gray-400 text-center py-4">No expenses added.</p>}
            <div className="space-y-2">
              {expenses.map(e => (
                <div key={e.id} className="flex items-center gap-2">
                  <select value={e.type} onChange={ev => updateItem(setExpenses, e.id, 'type', ev.target.value)} className="text-xs border border-gray-200 rounded-lg px-2 py-2 focus:outline-none w-44 flex-shrink-0">
                    {EXPENSE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <input type="text" value={e.description} onChange={ev => updateItem(setExpenses, e.id, 'description', ev.target.value)}
                    placeholder="Description" className="text-xs border border-gray-200 rounded-lg px-2 py-2 focus:outline-none flex-1 min-w-0" />
                  <NumInput value={e.monthlyAmount} onChange={v => updateItem(setExpenses, e.id, 'monthlyAmount', v)} prefix="R" min={0} step={1000} placeholder="Monthly" />
                  <button onClick={() => removeItem(setExpenses, e.id)} className="text-xs text-red-400 hover:text-red-600 px-1.5 flex-shrink-0">✕</button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end">
            <button onClick={() => setTab('modelling')} className="bg-purple-600 text-white text-sm font-semibold px-6 py-2.5 rounded-lg hover:bg-purple-700 transition-colors">
              Model Scenarios →
            </button>
          </div>
        </div>
      )}

      {/* ── MODELLING TAB ── */}
      {tab === 'modelling' && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

            {/* Left: Strategy Moves */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-700">Strategic Moves</h3>
              <p className="text-xs text-gray-400 -mt-2">Toggle one or more moves to model a "Planned" scenario against the current position.</p>

              {/* Move 1: Change growth assumptions */}
              <div className={`border-2 rounded-xl p-3 transition-all cursor-pointer ${moveActive.growth ? 'border-purple-400 bg-purple-50' : 'border-gray-200 bg-white'}`}>
                <div className="flex items-center gap-2 mb-2" onClick={() => toggleMove('growth')}>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${moveActive.growth ? 'bg-purple-600 border-purple-600' : 'border-gray-300'}`}>
                    {moveActive.growth && <span className="text-white text-xs">✓</span>}
                  </div>
                  <p className="text-sm font-semibold text-gray-800">Change Investment Strategy</p>
                </div>
                {moveActive.growth && (
                  <div className="space-y-2 ml-7">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Pre-Retirement Growth Rate</label>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400 w-20">Current: {preGrowth}%</span>
                        <NumInput value={altPreGrowth} onChange={setAltPreGrowth} suffix="%" min={0} max={25} step={0.5} placeholder={preGrowth} />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Post-Retirement Growth Rate</label>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400 w-20">Current: {postGrowth}%</span>
                        <NumInput value={altPostGrowth} onChange={setAltPostGrowth} suffix="%" min={0} max={20} step={0.5} placeholder={postGrowth} />
                      </div>
                    </div>
                    <p className="text-xs text-gray-400 italic">e.g. Model a more conservative Inflation Plus 2–3 (±9%) vs Inflation Plus 4–5 (±11%)</p>
                  </div>
                )}
              </div>

              {/* Move 2: Increase savings */}
              <div className={`border-2 rounded-xl p-3 transition-all cursor-pointer ${moveActive.savings ? 'border-green-400 bg-green-50' : 'border-gray-200 bg-white'}`}>
                <div className="flex items-center gap-2 mb-2" onClick={() => toggleMove('savings')}>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${moveActive.savings ? 'bg-green-600 border-green-600' : 'border-gray-300'}`}>
                    {moveActive.savings && <span className="text-white text-xs">✓</span>}
                  </div>
                  <p className="text-sm font-semibold text-gray-800">Increase Savings</p>
                </div>
                {moveActive.savings && (
                  <div className="ml-7">
                    <label className="block text-xs text-gray-500 mb-1">Extra monthly investment</label>
                    <NumInput value={extraSavings} onChange={setExtraSavings} prefix="R" min={0} step={500} placeholder="e.g. 2 000" />
                    <p className="text-xs text-gray-400 mt-1 italic">Models adding to an RA, TFSA, or Linked Investment monthly.</p>
                  </div>
                )}
              </div>

              {/* Move 3: Spend less */}
              <div className={`border-2 rounded-xl p-3 transition-all cursor-pointer ${moveActive.expenses ? 'border-amber-400 bg-amber-50' : 'border-gray-200 bg-white'}`}>
                <div className="flex items-center gap-2 mb-2" onClick={() => toggleMove('expenses')}>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${moveActive.expenses ? 'bg-amber-600 border-amber-600' : 'border-gray-300'}`}>
                    {moveActive.expenses && <span className="text-white text-xs">✓</span>}
                  </div>
                  <p className="text-sm font-semibold text-gray-800">Spend Less</p>
                </div>
                {moveActive.expenses && (
                  <div className="ml-7">
                    <label className="block text-xs text-gray-500 mb-1">Reduce monthly expenses by</label>
                    <NumInput value={expenseReduct} onChange={setExpenseReduct} prefix="R" min={0} step={500} placeholder="e.g. 5 000" />
                    <p className="text-xs text-gray-400 mt-1 italic">Current monthly expenses: {formatCurrency(totalExpenses)}</p>
                  </div>
                )}
              </div>

              {/* Move 4: Work longer */}
              <div className={`border-2 rounded-xl p-3 transition-all cursor-pointer ${moveActive.retire ? 'border-blue-400 bg-blue-50' : 'border-gray-200 bg-white'}`}>
                <div className="flex items-center gap-2 mb-2" onClick={() => toggleMove('retire')}>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${moveActive.retire ? 'bg-blue-600 border-blue-600' : 'border-gray-300'}`}>
                    {moveActive.retire && <span className="text-white text-xs">✓</span>}
                  </div>
                  <p className="text-sm font-semibold text-gray-800">Work Longer</p>
                </div>
                {moveActive.retire && (
                  <div className="ml-7">
                    <label className="block text-xs text-gray-500 mb-1">Retire at age</label>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400 w-20">Current: {retirementAge}</span>
                      <NumInput value={altRetirement} onChange={setAltRetirement} suffix="yrs" min={Number(currentAge) + 1} max={80} step={1} placeholder={retirementAge} />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right: Chart + stats */}
            <div className="lg:col-span-2 space-y-4">

              {/* Life Chart */}
              <div className="bg-white border border-gray-200 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold text-gray-700">Integrated Life Plan</p>
                  <div className="flex gap-3 text-xs text-gray-500">
                    <span>Pre-ret: <strong>{moveActive.growth && altPreGrowth ? altPreGrowth : preGrowth}%</strong></span>
                    <span>Post-ret: <strong>{moveActive.growth && altPostGrowth ? altPostGrowth : postGrowth}%</strong></span>
                    <span>Retire: <strong>{moveActive.retire && altRetirement ? altRetirement : retirementAge}</strong></span>
                  </div>
                </div>
                {baseData.length > 0 ? (
                  <LifeChart
                    baseData={baseData} planData={planData}
                    retirementAge={Number(retirementAge)}
                    altRetirement={moveActive.retire && altRetirement ? Number(altRetirement) : null}
                    currentAge={Number(currentAge)}
                  />
                ) : (
                  <div className="h-40 flex items-center justify-center text-gray-400 text-sm">
                    Enter your financial data in the Financials tab to generate the life chart.
                  </div>
                )}
              </div>

              {/* Scenario comparison */}
              {baseData.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-xl p-4">
                  <p className="text-sm font-semibold text-gray-700 mb-3">Scenario Comparison</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <StatPill
                      label="Portfolio at Retirement"
                      current={formatCurrency(retirementBalance(baseData) || 0)}
                      planned={formatCurrency(retirementBalance(planData) || 0)}
                      positive
                    />
                    <StatPill
                      label="Portfolio runs out"
                      current={baseDep ? `Age ${baseDep}` : `Funded to ${lifeExpectancy}`}
                      planned={planDep  ? `Age ${planDep}`  : `Funded to ${lifeExpectancy}`}
                      positive
                    />
                    <StatPill
                      label="Monthly Net (pre-ret)"
                      current={formatCurrency(netMonthly)}
                      planned={formatCurrency(netMonthly + (moveActive.savings ? (Number(extraSavings)||0) : 0) - (moveActive.expenses ? (Number(expenseReduct)||0) : 0))}
                      positive={false}
                    />
                    <StatPill
                      label="Retirement Age"
                      current={`Age ${retirementAge}`}
                      planned={moveActive.retire && altRetirement ? `Age ${altRetirement}` : `Age ${retirementAge}`}
                      positive
                    />
                  </div>
                </div>
              )}

              {/* Budget table */}
              {baseData.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-xl p-4">
                  <p className="text-sm font-semibold text-gray-700 mb-3">Budget Overview</p>
                  <table className="w-full text-xs border-collapse">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="text-left px-3 py-2 border border-gray-200 text-gray-600 font-semibold"></th>
                        <th className="text-right px-3 py-2 border border-gray-200 text-gray-600 font-semibold">Current · Month 1</th>
                        <th className="text-right px-3 py-2 border border-gray-200 text-gray-600 font-semibold">Current · Year 1</th>
                        <th className="text-right px-3 py-2 border border-gray-200 text-gray-600 font-semibold">Planned · Month 1</th>
                        <th className="text-right px-3 py-2 border border-gray-200 text-gray-600 font-semibold">Planned · Year 1</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        const planIncome  = totalIncome;
                        const planExp     = totalExpenses - (moveActive.expenses ? (Number(expenseReduct)||0) : 0);
                        const planSavings = moveActive.savings ? (Number(extraSavings)||0) : 0;
                        const planNet     = planIncome - planExp + planSavings;
                        return [
                          { label: 'Income',   cur: totalIncome,    plan: planIncome,           cls: 'text-green-700' },
                          { label: 'Expenses', cur: totalExpenses,  plan: planExp,              cls: 'text-red-600' },
                          { label: 'Extra Savings', cur: 0,         plan: planSavings,          cls: 'text-blue-600' },
                          { label: 'Net',      cur: netMonthly,     plan: planNet,              cls: netMonthly < 0 ? 'text-red-600 font-bold' : 'text-green-700 font-bold' },
                        ].map(({ label, cur, plan, cls }) => (
                          <tr key={label}>
                            <td className="px-3 py-2 border border-gray-200 font-semibold text-gray-700">{label}</td>
                            <td className={`px-3 py-2 border border-gray-200 text-right ${cls}`}>{formatCurrency(cur)}</td>
                            <td className={`px-3 py-2 border border-gray-200 text-right ${cls}`}>{formatCurrency(cur * 12)}</td>
                            <td className={`px-3 py-2 border border-gray-200 text-right ${cls}`}>{formatCurrency(plan)}</td>
                            <td className={`px-3 py-2 border border-gray-200 text-right ${cls}`}>{formatCurrency(plan * 12)}</td>
                          </tr>
                        ));
                      })()}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="mt-6 flex items-center justify-between border-t border-gray-100 pt-5">
        <button onClick={() => setTab(tab === 'modelling' ? 'financials' : 'modelling')}
          className="text-sm text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg px-4 py-2 hover:bg-gray-50 transition-colors">
          {tab === 'modelling' ? '← Financials' : '→ Modelling'}
        </button>
        <button onClick={handleComplete} className="bg-purple-600 text-white text-sm font-semibold px-6 py-2.5 rounded-lg hover:bg-purple-700 transition-colors">
          Continue to Product Type Selection →
        </button>
      </div>

    </div>
  );
}
