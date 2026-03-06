/**
 * FeeDisclosure.jsx — Investment ROA Builder v3
 * FAIS-compliant fee disclosure: product charges, advisor fees, EAC summary.
 */

import { useState, useEffect, useCallback } from 'react';
import { getProductLabel, formatCurrency, formatPct } from '../shared/ui.js';

const VAT = 0.15;
const FEE_TYPES = [
  { key: 'productAdminFee',  label: 'Product / Platform Administration Fee', category: 'product', hint: '% p.a. of investment value' },
  { key: 'ter',              label: 'Total Expense Ratio (TER)',              category: 'product', hint: '% p.a. — from fund fact sheet' },
  { key: 'transactionCosts', label: 'Transaction Costs (TC)',                 category: 'product', hint: '% p.a. — from fund KIID/MDD' },
  { key: 'advisorInitial',   label: 'Advisor Initial Fee',                    category: 'advisor', hint: '% of lump sum (incl. VAT)' },
  { key: 'advisorOngoing',   label: 'Advisor Ongoing Service Fee',            category: 'advisor', hint: '% p.a. of investment value (incl. VAT)' },
  { key: 'otherFees',        label: 'Other Charges',                          category: 'other',   hint: 'e.g. switching, guarantee, or platform fees' },
];

function FeeRow({ fee, value, onChange, amount, readOnly }) {
  const rand = value && amount ? (parseFloat(value) / 100) * parseFloat(amount) : null;
  return (
    <div className="grid grid-cols-12 gap-3 items-center py-3 border-b border-gray-100 last:border-0">
      <div className="col-span-5">
        <p className="text-sm font-medium text-gray-700">{fee.label}</p>
        <p className="text-xs text-gray-400 mt-0.5">{fee.hint}</p>
      </div>
      <div className="col-span-3">
        <div className="relative">
          <input type="number" value={value || ''} onChange={e => onChange(e.target.value)}
            disabled={readOnly} step="0.01" min="0" max="20" placeholder="0.00"
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 pr-7 focus:outline-none focus:ring-2 focus:ring-blue-400 text-right disabled:bg-gray-50" />
          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400">%</span>
        </div>
      </div>
      <div className="col-span-4 text-right">
        {rand !== null
          ? <p className="text-sm font-semibold text-gray-700">{formatCurrency(rand)} p.a.</p>
          : <p className="text-xs text-gray-300">—</p>}
      </div>
    </div>
  );
}

function CostBar({ label, pct, amount }) {
  const barPct = Math.min((pct / 5) * 100, 100);
  const colour = pct > 3 ? 'bg-red-400' : pct > 2 ? 'bg-amber-400' : 'bg-green-400';
  return (
    <div className="mb-3">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-medium text-gray-600">{label}</span>
        <div className="flex items-center gap-3">
          {amount !== null && <span className="text-xs text-gray-500">{formatCurrency(amount)} p.a.</span>}
          <span className="text-sm font-bold text-gray-700">{formatPct(pct)}</span>
        </div>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${colour}`} style={{ width: `${barPct}%` }} />
      </div>
    </div>
  );
}

export default function FeeDisclosure({ productKey='unit trust', investmentAmount=0, initialData={}, advisorProfile={}, onChange, onComplete, readOnly=false }) {
  const [fees, setFees] = useState({
    productAdminFee: '', ter: '', transactionCosts: '',
    advisorInitial: advisorProfile?.defaultInitialFee || '',
    advisorOngoing: advisorProfile?.defaultAdvisorFee || '0.5',
    otherFees: '', vatTreatment: 'included', notes: '', ...initialData,
  });

  const amount = parseFloat(investmentAmount) || 0;
  useEffect(() => { if (onChange) onChange(fees); }, [fees]); // eslint-disable-line
  const setFee = useCallback((key, val) => setFees(prev => ({ ...prev, [key]: val })), []);

  const productTotal = ['productAdminFee','ter','transactionCosts'].reduce((s,k) => s + (parseFloat(fees[k])||0), 0);
  const advisorTotal = ['advisorOngoing','otherFees'].reduce((s,k) => s + (parseFloat(fees[k])||0), 0);
  const eac          = productTotal + advisorTotal;
  const initialRand  = fees.advisorInitial && amount ? (parseFloat(fees.advisorInitial)/100)*amount : 0;
  const eacRand      = amount ? (eac/100)*amount : null;
  const eacColour    = eac > 3 ? 'text-red-600' : eac > 2 ? 'text-amber-600' : 'text-green-600';
  const isComplete   = fees.ter !== '' && fees.advisorOngoing !== '';

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-0.5">Fee Disclosure</p>
        <h2 className="text-xl font-bold text-gray-800">{getProductLabel(productKey)}</h2>
        <p className="text-sm text-gray-500 mt-1">All fees disclosed per FAIS General Code of Conduct Section 9. Enter percentages per annum unless noted.</p>
      </div>

      {amount > 0 && (
        <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 mb-5 flex items-center justify-between">
          <span className="text-sm text-blue-700 font-medium">Investment Amount</span>
          <span className="text-lg font-bold text-blue-800">{formatCurrency(amount)}</span>
        </div>
      )}

      {[
        { title: 'Product & Platform Charges', cat: 'product' },
        { title: 'Advisor Fees', cat: 'advisor' },
        { title: 'Other Charges', cat: 'other' },
      ].map(({ title, cat }) => (
        <div key={cat} className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-4">
          <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider">{title}</p>
          </div>
          <div className="px-5">
            {FEE_TYPES.filter(f => f.category === cat).map(fee => (
              <FeeRow key={fee.key} fee={fee} value={fees[fee.key]} onChange={v => setFee(fee.key, v)} amount={amount} readOnly={readOnly} />
            ))}
            {cat === 'advisor' && fees.advisorInitial && amount > 0 && (
              <div className="py-3 border-t border-gray-100 flex items-center justify-between">
                <p className="text-xs text-gray-500">Once-off initial fee on {formatCurrency(amount)}</p>
                <p className="text-sm font-bold text-gray-700">{formatCurrency(initialRand)}</p>
              </div>
            )}
          </div>
        </div>
      ))}

      <div className="bg-white rounded-xl border-2 border-gray-200 p-5 mb-4">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Total Cost Summary</p>
        <CostBar label="Product & Platform Charges" pct={productTotal} amount={amount ? (productTotal/100)*amount : null} />
        <CostBar label="Advisor Fees (ongoing)"      pct={advisorTotal} amount={amount ? (advisorTotal/100)*amount : null} />
        <div className="border-t-2 border-gray-200 pt-3 mt-3 flex items-center justify-between">
          <div>
            <p className="font-bold text-gray-800">Effective Annual Cost (EAC)</p>
            <p className="text-xs text-gray-400 mt-0.5">Total ongoing fees per year</p>
          </div>
          <div className="text-right">
            <p className={`text-2xl font-bold ${eacColour}`}>{formatPct(eac)}</p>
            {eacRand !== null && <p className="text-xs text-gray-500">{formatCurrency(eacRand)} p.a.</p>}
          </div>
        </div>
        {eac > 2.5 && (
          <div className="mt-3 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs text-amber-700">
            ⚠ EAC exceeds 2.5% p.a. Ensure cost justification is documented in the ROA.
          </div>
        )}
      </div>

      <div className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 mb-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <p className="text-xs text-gray-600">VAT treatment</p>
          <div className="flex gap-2">
            {['included','excluded','exempt'].map(v => (
              <button key={v} onClick={() => !readOnly && setFee('vatTreatment', v)}
                className={`text-xs px-2 py-1 rounded border transition-all ${fees.vatTreatment===v ? 'border-blue-400 bg-blue-50 text-blue-700 font-semibold' : 'border-gray-200 text-gray-500 hover:bg-gray-100'}`}>
                {v==='included'?'VAT included':v==='excluded'?'VAT excluded':'VAT exempt'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {!readOnly && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
          <label className="block text-xs font-semibold text-gray-600 mb-2">Additional Fee Notes</label>
          <textarea value={fees.notes||''} onChange={e => setFee('notes',e.target.value)} rows={3}
            placeholder="Fee waivers, conditional arrangements, or additional disclosures..."
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none" />
        </div>
      )}

      {!readOnly && (
        <div className="bg-white rounded-xl border border-gray-200 px-5 py-4 flex items-center justify-between gap-3">
          <p className="text-xs text-gray-500">{isComplete ? '✓ Fee disclosure complete' : 'Enter TER and advisor ongoing fee to continue'}</p>
          <button onClick={() => isComplete && onComplete && onComplete(fees)} disabled={!isComplete}
            className={`px-6 py-2.5 rounded-lg font-semibold text-sm transition-all ${isComplete ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}>
            Confirm Fees →
          </button>
        </div>
      )}
    </div>
  );
}
