/**
 * TaxCalculator.jsx — Investment ROA Builder v3
 *
 * South African income tax calculator (2026/2027 tax year).
 * Computes monthly tax, annual tax, average rate, and — critically —
 * the MARGINAL TAX RATE to inform the choice between investment wrappers
 * (Unit Trust transparent vs Endowment flat 30% tax rate).
 *
 * Props:
 *   clientProfile   {object}  — pre-fills age (from DOB) and gross monthly income
 *   initialData     {object}  — previously saved state
 *   onChange        {fn}
 *   onComplete      {fn}
 *   onBack          {fn}      — return to Needs Analysis landing
 */

import { useState, useMemo } from 'react';
import { formatCurrency } from '../shared/ui.js';

// ── 2026/2027 Tax Tables ──────────────────────────────────────────────────

const TAX_BRACKETS = [
  { min: 1,       max: 245100,  base: 0,       rate: 0.18, label: 'R1 – R245,100' },
  { min: 245101,  max: 383100,  base: 44118,   rate: 0.26, label: 'R245,101 – R383,100' },
  { min: 383101,  max: 530200,  base: 79998,   rate: 0.31, label: 'R383,101 – R530,200' },
  { min: 530201,  max: 695800,  base: 125598,  rate: 0.36, label: 'R530,201 – R695,800' },
  { min: 695801,  max: 887000,  base: 185214,  rate: 0.39, label: 'R695,801 – R887,000' },
  { min: 887001,  max: 1878600, base: 259782,  rate: 0.41, label: 'R887,001 – R1,878,600' },
  { min: 1878601, max: Infinity,base: 666337,  rate: 0.45, label: 'R1,878,601 and above' },
];

// Total rebates (cumulative) per age band
const REBATES = [
  { label: 'Primary (age ≤ 64)',  maxAge: 64,  amount: 17820 },
  { label: 'Secondary (age 65–74)', maxAge: 74, amount: 27585 },
  { label: 'Tertiary (age 75+)',  maxAge: 999, amount: 30834 },
];

const THRESHOLDS = [
  { label: 'Age 64 and below', threshold: 99000 },
  { label: 'Age 65 to 74',     threshold: 153250 },
  { label: 'Age 75 and over',  threshold: 171300 },
];

function getRebate(age) {
  const r = REBATES.find(r => age <= r.maxAge);
  return r ? r.amount : 30834;
}

function computeTax(monthlyIncome, age) {
  if (!monthlyIncome || monthlyIncome <= 0 || !age || age <= 0) return null;
  const annual = monthlyIncome * 12;
  const bracket = TAX_BRACKETS.find(b => annual <= b.max) || TAX_BRACKETS[TAX_BRACKETS.length - 1];
  const grossAnnual = bracket.base + (annual - bracket.min + 1) * bracket.rate;
  const rebate = getRebate(age);
  const netAnnual = Math.max(0, grossAnnual - rebate);
  const netMonthly = netAnnual / 12;
  const averageRate = annual > 0 ? (netAnnual / annual) * 100 : 0;
  const marginalRate = bracket.rate * 100;
  return { annual, grossAnnual, rebate, netAnnual, netMonthly, averageRate, marginalRate, bracket };
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

// ── Wrapper recommendation logic ─────────────────────────────────────────

const ENDOWMENT_RATE = 30; // endowment flat rate

function getWrapperAdvice(marginalRate) {
  if (marginalRate > ENDOWMENT_RATE) {
    return {
      colour: 'bg-green-50 border-green-300',
      badge:  'bg-green-600 text-white',
      title:  'Endowment wrapper recommended',
      body:   `At a ${marginalRate}% marginal rate, the endowment's flat ${ENDOWMENT_RATE}% tax rate saves ${marginalRate - ENDOWMENT_RATE}% compared to a transparent wrapper. An Endowment or similar structured wrapper is likely more tax efficient for this client.`,
      label:  'Endowment',
    };
  }
  if (marginalRate === ENDOWMENT_RATE) {
    return {
      colour: 'bg-amber-50 border-amber-300',
      badge:  'bg-amber-500 text-white',
      title:  'Marginal rate equals endowment rate',
      body:   `At exactly ${ENDOWMENT_RATE}%, the tax benefit of an endowment is neutral. Wrapper choice should be based on other factors: flexibility, liquidity, estate planning, and investment universe.`,
      label:  'Neutral',
    };
  }
  return {
    colour: 'bg-blue-50 border-blue-300',
    badge:  'bg-blue-600 text-white',
    title:  'Unit Trust / transparent wrapper preferred',
    body:   `At a ${marginalRate}% marginal rate, a transparent Unit Trust wrapper is likely more efficient. The endowment's flat ${ENDOWMENT_RATE}% rate would be higher than the client's actual tax rate — a transparent structure avoids over-taxation.`,
    label:  'Unit Trust',
  };
}

// ── Small input helper ────────────────────────────────────────────────────

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

// ══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════════════════════

export default function TaxCalculator({ clientProfile = {}, initialData = {}, onChange, onComplete, onBack }) {
  const derivedAge  = computeAge(clientProfile.dateOfBirth);
  const derivedIncome = clientProfile.grossMonthlyIncome ? Number(clientProfile.grossMonthlyIncome) : '';

  const [age,           setAge]           = useState(initialData.age           || derivedAge    || '');
  const [monthlyIncome, setMonthlyIncome] = useState(initialData.monthlyIncome || derivedIncome || '');

  const results = useMemo(() => computeTax(Number(monthlyIncome), Number(age)), [monthlyIncome, age]);
  const advice  = results ? getWrapperAdvice(results.marginalRate) : null;

  const handleComplete = () => {
    const data = {
      calcType: 'tax', age: Number(age), monthlyIncome: Number(monthlyIncome),
      results: results ? {
        netAnnual:    results.netAnnual,
        netMonthly:   results.netMonthly,
        averageRate:  results.averageRate,
        marginalRate: results.marginalRate,
        wrapperLabel: advice?.label,
      } : null,
    };
    if (onComplete) onComplete(data);
  };

  return (
    <div className="max-w-3xl mx-auto">

      {/* Header */}
      <div className="mb-5 flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-0.5">Financial Needs Analysis</p>
          <h2 className="text-xl font-bold text-gray-800">Income Tax Calculator</h2>
          <p className="text-xs text-gray-400 mt-0.5">2026/2027 tax year · Natural persons & special trusts</p>
        </div>
        <button onClick={onBack} className="text-sm text-gray-400 hover:text-gray-700 border border-gray-200 rounded-lg px-4 py-2 hover:bg-gray-50 transition-colors flex-shrink-0">
          ← Change analysis type
        </button>
      </div>

      {/* Quick stats bar */}
      {results && (
        <div className="mb-5 bg-white border border-gray-200 rounded-xl px-4 py-3 flex flex-wrap gap-4 text-sm">
          <div><span className="text-xs text-gray-400">Monthly Tax</span><p className="font-bold text-gray-800">{formatCurrency(results.netMonthly)}</p></div>
          <div className="w-px bg-gray-200" />
          <div><span className="text-xs text-gray-400">Annual Tax</span><p className="font-bold text-gray-800">{formatCurrency(results.netAnnual)}</p></div>
          <div className="w-px bg-gray-200" />
          <div><span className="text-xs text-gray-400">Average Rate</span><p className="font-bold text-gray-800">{results.averageRate.toFixed(2)}%</p></div>
          <div className="w-px bg-gray-200" />
          <div>
            <span className="text-xs text-gray-400">Marginal Rate</span>
            <p className={`font-bold text-lg ${results.marginalRate > 30 ? 'text-red-600' : results.marginalRate === 30 ? 'text-amber-600' : 'text-green-600'}`}>
              {results.marginalRate}%
            </p>
          </div>
          {advice && (
            <>
              <div className="w-px bg-gray-200" />
              <div>
                <span className="text-xs text-gray-400">Wrapper</span>
                <span className={`ml-1 text-xs font-bold px-2 py-0.5 rounded-full ${advice.badge}`}>{advice.label}</span>
              </div>
            </>
          )}
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-6">

        {/* ── INPUT ── */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 border-b border-gray-100 pb-2 mb-4">Client Details</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">
                Age
                {derivedAge && <span className="ml-1 font-normal text-gray-400 normal-case">(from client profile: {derivedAge})</span>}
              </label>
              <NumInput value={age} onChange={setAge} suffix="yrs" min={1} max={100} step={1} placeholder="40" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">
                Monthly Taxable Income
                {derivedIncome > 0 && <span className="ml-1 font-normal text-gray-400 normal-case">(from profile)</span>}
              </label>
              <NumInput value={monthlyIncome} onChange={setMonthlyIncome} prefix="R" min={0} step={5000} placeholder="74 000" />
            </div>
          </div>
          {derivedAge && !age && (
            <button onClick={() => setAge(derivedAge)} className="mt-2 text-xs text-blue-600 hover:text-blue-800">
              Use age from client profile ({derivedAge}) →
            </button>
          )}
          {derivedIncome > 0 && !monthlyIncome && (
            <button onClick={() => setMonthlyIncome(derivedIncome)} className="mt-2 ml-4 text-xs text-blue-600 hover:text-blue-800">
              Use income from client profile ({formatCurrency(derivedIncome)}) →
            </button>
          )}
        </div>

        {/* ── RESULTS ── */}
        {results ? (
          <>
            <div>
              <h3 className="text-sm font-semibold text-gray-700 border-b border-gray-100 pb-2 mb-4">Tax Calculation</h3>
              <table className="w-full text-sm border-collapse">
                <tbody>
                  <tr className="bg-gray-50"><td className="px-4 py-2.5 border border-gray-200 text-gray-600 w-56">Annual taxable income</td><td className="px-4 py-2.5 border border-gray-200 text-right font-medium">{formatCurrency(results.annual)}</td></tr>
                  <tr><td className="px-4 py-2.5 border border-gray-200 text-gray-600">Tax before rebates</td><td className="px-4 py-2.5 border border-gray-200 text-right">{formatCurrency(results.grossAnnual)}</td></tr>
                  <tr className="bg-gray-50"><td className="px-4 py-2.5 border border-gray-200 text-gray-600">Tax rebate ({REBATES.find(r => Number(age) <= r.maxAge)?.label || 'Primary'})</td><td className="px-4 py-2.5 border border-gray-200 text-right text-green-700">– {formatCurrency(results.rebate)}</td></tr>
                  <tr className="font-bold text-base"><td className="px-4 py-2.5 border border-gray-200 text-gray-800">Annual tax payable</td><td className="px-4 py-2.5 border border-gray-200 text-right">{formatCurrency(results.netAnnual)}</td></tr>
                  <tr className="bg-gray-50"><td className="px-4 py-2.5 border border-gray-200 text-gray-600">Monthly tax (PAYE estimate)</td><td className="px-4 py-2.5 border border-gray-200 text-right font-medium">{formatCurrency(results.netMonthly)}</td></tr>
                  <tr><td className="px-4 py-2.5 border border-gray-200 text-gray-600">Average effective tax rate</td><td className="px-4 py-2.5 border border-gray-200 text-right font-medium">{results.averageRate.toFixed(2)}%</td></tr>
                </tbody>
              </table>
            </div>

            {/* Marginal rate — key callout */}
            <div className="bg-gray-900 rounded-xl px-5 py-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-0.5">Marginal Tax Rate</p>
                <p className="text-xs text-gray-400 mt-1">{results.bracket.label}</p>
              </div>
              <div className="text-right">
                <p className="text-4xl font-bold text-white">{results.marginalRate}%</p>
                <p className="text-xs text-gray-400 mt-0.5">of the next rand earned</p>
              </div>
            </div>

            {/* Wrapper recommendation */}
            {advice && (
              <div className={`border-2 rounded-xl px-5 py-4 ${advice.colour}`}>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${advice.badge}`}>{advice.label}</span>
                  <p className="text-sm font-bold text-gray-800">{advice.title}</p>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">{advice.body}</p>
                <div className="mt-3 flex items-center gap-6 text-xs text-gray-600">
                  <span>Client marginal rate: <strong className="text-gray-800">{results.marginalRate}%</strong></span>
                  <span>Endowment tax rate: <strong className="text-gray-800">{ENDOWMENT_RATE}%</strong></span>
                  <span>Difference: <strong className={results.marginalRate > ENDOWMENT_RATE ? 'text-green-700' : 'text-blue-700'}>{Math.abs(results.marginalRate - ENDOWMENT_RATE)}%</strong></span>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-6 text-gray-400">
            <p className="text-sm">Enter age and monthly income above to calculate.</p>
          </div>
        )}

        {/* ── TAX TABLE ── */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 border-b border-gray-100 pb-2 mb-3">
            2026/2027 Tax Brackets — Natural Persons
          </h3>
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-gray-800 text-white">
                <th className="text-left px-3 py-2 font-semibold">Taxable Income</th>
                <th className="text-right px-3 py-2 font-semibold">Tax Rate</th>
              </tr>
            </thead>
            <tbody>
              {TAX_BRACKETS.map((b, i) => {
                const isActive = results?.bracket === b;
                return (
                  <tr key={i} className={isActive ? 'bg-blue-50 border-l-2 border-blue-500' : i % 2 === 0 ? 'bg-gray-50' : ''}>
                    <td className={`px-3 py-2 border border-gray-200 ${isActive ? 'font-semibold text-blue-800' : 'text-gray-700'}`}>{b.label}</td>
                    <td className={`px-3 py-2 border border-gray-200 text-right font-medium ${isActive ? 'text-blue-800' : ''}`}>
                      {isActive && <span className="mr-1 text-blue-500">◀</span>}
                      {(b.rate * 100).toFixed(0)}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <p className="font-semibold text-gray-600 uppercase tracking-wider mb-2">Tax Rebates</p>
              {REBATES.map((r, i) => (
                <div key={i} className={`flex justify-between py-1 ${Number(age) <= r.maxAge && i === REBATES.findIndex(x => Number(age) <= x.maxAge) ? 'text-blue-700 font-bold' : 'text-gray-600'}`}>
                  <span>{r.label}</span><span>{formatCurrency(r.amount)}</span>
                </div>
              ))}
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <p className="font-semibold text-gray-600 uppercase tracking-wider mb-2">Tax Thresholds</p>
              {THRESHOLDS.map((t, i) => (
                <div key={i} className="flex justify-between py-1 text-gray-600">
                  <span>{t.label}</span><span>{formatCurrency(t.threshold)}</span>
                </div>
              ))}
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-2 italic">* Calculation assumes no medical expense deductions. PAYE figures are estimates.</p>
        </div>

        {/* ── ACTIONS ── */}
        <div className="flex justify-between pt-2 border-t border-gray-100">
          <button onClick={onBack} className="text-sm text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg px-4 py-2 hover:bg-gray-50 transition-colors">← Back</button>
          <button onClick={handleComplete} disabled={!results} className="bg-blue-600 text-white text-sm font-semibold px-6 py-2.5 rounded-lg hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
            Continue to Product Type Selection →
          </button>
        </div>

      </div>
    </div>
  );
}
