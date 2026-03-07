/**
 * ROADocument.jsx — Investment ROA Builder v3
 *
 * Final formatted ROA document view. Renders a print-ready, FAIS-compliant
 * Record of Advice that the advisor can print or save as PDF via browser print.
 *
 * Sections rendered in order:
 *   1. Header (practice logo, reference number, date)
 *   2. Client Details
 *   3. Client Needs & Objectives
 *   4. Risk Profile
 *   5. Product Recommendation (with decision tree path)
 *   6. Provider Rationale (top 3 scoring table)
 *   7. Fee Disclosure
 *   8. Tax Implications
 *   9. Regulation 28 (if applicable)
 *  10. FAIS & Statutory Disclosures
 *  11. Implementation Steps
 *  12. Review Schedule
 *  13. Signature blocks
 *
 * Props:
 *   roaData        {object}  — full assembled ROA object from App state
 *   advisorProfile {object}  — practice name, FSP, advisor details, logo
 *   onEdit         {fn}      — called to return to editing mode
 *   onSave         {fn}      — called to save/export
 */

import { useRef, useCallback } from 'react';
import { getProductLabel, formatCurrency, formatDate, formatPct, formatScore, buildRefNumber, getRiskProfile } from '../shared/ui.js';
import { PROVIDER_META } from '../data/providerDB.js';
import { PRODUCT_CATALOGUE } from '../data/productCatalogue.js';
import { LIMITS } from '../data/productReference.js';

// ── FNA provision FV helper ────────────────────────────────────────────────
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

// ── Print styles injected into head ───────────────────────────────────────
const PRINT_CSS = `
@media print {
  body * { visibility: hidden; }
  #roa-printable, #roa-printable * { visibility: visible; }
  #roa-printable { position: absolute; left: 0; top: 0; width: 100%; }
  .no-print { display: none !important; }
  .page-break { page-break-before: always; }
  @page { margin: 20mm; size: A4; }
}
`;

// ── Helper: Section heading ────────────────────────────────────────────────
function DocSection({ number, title, children }) {
  return (
    <div className="mb-8">
      <div className="flex items-center gap-3 mb-3 pb-2 border-b-2 border-gray-800">
        <span className="w-7 h-7 rounded-full bg-gray-800 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">{number}</span>
        <h2 className="text-base font-bold text-gray-900 uppercase tracking-wide">{title}</h2>
      </div>
      <div className="pl-10">{children}</div>
    </div>
  );
}

// ── Helper: Two-col detail row ─────────────────────────────────────────────
function DetailRow({ label, value, span }) {
  if (!value) return null;
  return (
    <div className={`${span ? 'col-span-2' : ''}`}>
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-0.5">{label}</p>
      <p className="text-sm text-gray-800">{value}</p>
    </div>
  );
}

// ── Provider scoring mini table ────────────────────────────────────────────
function ProviderTable({ providerResult }) {
  if (!providerResult?.allRanked?.length) return null;
  const top3 = providerResult.allRanked.slice(0, 3);
  return (
    <table className="w-full text-xs border-collapse mt-2">
      <thead>
        <tr className="bg-gray-100">
          <th className="text-left px-3 py-2 font-semibold text-gray-600 border border-gray-200">#</th>
          <th className="text-left px-3 py-2 font-semibold text-gray-600 border border-gray-200">Provider</th>
          <th className="text-left px-3 py-2 font-semibold text-gray-600 border border-gray-200">Tier</th>
          <th className="text-left px-3 py-2 font-semibold text-gray-600 border border-gray-200">Product</th>
          <th className="text-right px-3 py-2 font-semibold text-gray-600 border border-gray-200">Score</th>
          <th className="text-left px-3 py-2 font-semibold text-gray-600 border border-gray-200">Status</th>
        </tr>
      </thead>
      <tbody>
        {top3.map((p, i) => {
          const meta      = PROVIDER_META[p.name] || {};
          const catalogue = PRODUCT_CATALOGUE[p.name]?.[providerResult.productKey];
          const isRec     = p.name === providerResult.recommended?.name;
          return (
            <tr key={p.name} className={isRec ? 'bg-green-50' : ''}>
              <td className="px-3 py-2 border border-gray-200 text-center font-bold">{i + 1}</td>
              <td className="px-3 py-2 border border-gray-200 font-semibold text-gray-800">{p.name}</td>
              <td className="px-3 py-2 border border-gray-200 text-gray-600">{meta.tier || '—'}</td>
              <td className="px-3 py-2 border border-gray-200 text-gray-600">{catalogue?.name || getProductLabel(providerResult.productKey)}</td>
              <td className="px-3 py-2 border border-gray-200 text-right font-bold">{formatScore(p.score)}</td>
              <td className="px-3 py-2 border border-gray-200">
                {isRec
                  ? <span className="font-semibold text-green-700">✓ Recommended</span>
                  : <span className="text-gray-500">Alternative</span>}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

// ── Fee table ──────────────────────────────────────────────────────────────
function FeeTable({ fees, investmentAmount }) {
  if (!fees) return null;
  const amount = parseFloat(investmentAmount) || 0;
  const rows = [
    { label: 'Product / Platform Administration Fee', value: fees.productAdminFee },
    { label: 'Total Expense Ratio (TER)',             value: fees.ter },
    { label: 'Transaction Costs (TC)',                value: fees.transactionCosts },
    { label: 'Advisor Initial Fee (once-off)',        value: fees.advisorInitial },
    { label: 'Advisor Ongoing Service Fee',           value: fees.advisorOngoing },
    { label: 'Other Charges',                         value: fees.otherFees },
  ].filter(r => r.value);

  const productTotal = ['productAdminFee','ter','transactionCosts'].reduce((s,k) => s+(parseFloat(fees[k])||0),0);
  const advisorOngoing = (parseFloat(fees.advisorOngoing)||0) + (parseFloat(fees.otherFees)||0);
  const eac = productTotal + advisorOngoing;

  return (
    <table className="w-full text-xs border-collapse mt-2">
      <thead>
        <tr className="bg-gray-100">
          <th className="text-left px-3 py-2 font-semibold text-gray-600 border border-gray-200">Fee Component</th>
          <th className="text-right px-3 py-2 font-semibold text-gray-600 border border-gray-200">Rate</th>
          {amount > 0 && <th className="text-right px-3 py-2 font-semibold text-gray-600 border border-gray-200">Annual Amount</th>}
        </tr>
      </thead>
      <tbody>
        {rows.map(row => (
          <tr key={row.label}>
            <td className="px-3 py-2 border border-gray-200 text-gray-700">{row.label}</td>
            <td className="px-3 py-2 border border-gray-200 text-right font-medium">{formatPct(parseFloat(row.value))}</td>
            {amount > 0 && <td className="px-3 py-2 border border-gray-200 text-right">{formatCurrency((parseFloat(row.value)/100)*amount)}</td>}
          </tr>
        ))}
        <tr className="bg-gray-50 font-bold">
          <td className="px-3 py-2 border border-gray-200">Effective Annual Cost (EAC)</td>
          <td className="px-3 py-2 border border-gray-200 text-right">{formatPct(eac)}</td>
          {amount > 0 && <td className="px-3 py-2 border border-gray-200 text-right">{formatCurrency((eac/100)*amount)}</td>}
        </tr>
      </tbody>
    </table>
  );
}

// ── Paragraph text renderer ────────────────────────────────────────────────
function DocText({ text }) {
  if (!text) return <p className="text-sm text-gray-400 italic">[Section not completed]</p>;
  return (
    <div className="space-y-3">
      {text.split('\n\n').filter(Boolean).map((para, i) => (
        <p key={i} className="text-sm text-gray-800 leading-relaxed">{para}</p>
      ))}
    </div>
  );
}

// ── Decision path breadcrumb ───────────────────────────────────────────────
function PathTrail({ path }) {
  if (!path?.length) return null;
  return (
    <div className="mt-3 bg-gray-50 rounded-lg px-3 py-2">
      <p className="text-xs font-semibold text-gray-500 mb-1">Decision Tree Path</p>
      <div className="flex flex-wrap items-center gap-1 text-xs text-gray-500">
        {path.map((p, i) => (
          <span key={i} className="flex items-center gap-1">
            <span className="bg-white border border-gray-200 rounded px-1.5 py-0.5">{p.answer}</span>
            {i < path.length - 1 && <span className="text-gray-300">›</span>}
          </span>
        ))}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════════════════════

export default function ROADocument({ roaData = {}, advisorProfile = {}, onEdit, onSave }) {
  const printRef = useRef(null);

  const {
    clientProfile   = {},
    retirementCalc  = {},
    treeResult      = {},
    providerResult  = {},
    providerResult2 = {},
    content         = {},
    fees            = {},
    createdAt,
    roaId,
  } = roaData;

  const refNumber = buildRefNumber('ROA', advisorProfile.fspNumber, clientProfile.surname, createdAt);
  const clientFullName = [clientProfile.firstNames, clientProfile.surname].filter(Boolean).join(' ') || '—';
  const riskProfile = getRiskProfile(clientProfile.riskProfileEffective || clientProfile.riskProfileComputed);

  const handlePrint = useCallback(() => {
    // Inject print CSS
    let styleEl = document.getElementById('roa-print-style');
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = 'roa-print-style';
      document.head.appendChild(styleEl);
    }
    styleEl.textContent = PRINT_CSS;
    window.print();
  }, []);

  const isReg28Product = ['RETIREMENT ANNUITY','Living Annuity','preservation nfund'].includes(providerResult?.productKey);

  return (
    <div className="max-w-4xl mx-auto">

      {/* Toolbar */}
      <div className="no-print flex items-center justify-between mb-6 bg-white rounded-xl border border-gray-200 px-5 py-3">
        <div className="flex items-center gap-3">
          <span className="text-lg">📄</span>
          <div>
            <p className="text-sm font-bold text-gray-800">ROA Document Preview</p>
            <p className="text-xs text-gray-500">Ref: {refNumber}</p>
          </div>
        </div>
        <div className="flex gap-3">
          {onEdit && (
            <button onClick={onEdit} className="text-sm text-gray-600 hover:text-gray-800 border border-gray-200 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors">
              ← Edit
            </button>
          )}
          <button
            onClick={handlePrint}
            className="text-sm bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
          >
            🖨️ Print / Save PDF
          </button>
          {onSave && (
            <button onClick={() => onSave(roaData)} className="text-sm bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-2 rounded-lg transition-colors">
              💾 Save
            </button>
          )}
        </div>
      </div>

      {/* ROA Document */}
      <div id="roa-printable" ref={printRef} className="bg-white rounded-xl border border-gray-200 shadow-sm p-10 print:p-0 print:shadow-none print:border-0">

        {/* ── HEADER ── */}
        <div className="flex items-start justify-between mb-8 pb-6 border-b-2 border-gray-900">
          <div>
            {advisorProfile.logoUrl && (
              <img src={advisorProfile.logoUrl} alt="Practice Logo" className="h-12 mb-3 object-contain" />
            )}
            <h1 className="text-2xl font-bold text-gray-900 uppercase tracking-widest">Record of Advice</h1>
            <p className="text-xs text-gray-500 mt-1 uppercase tracking-wider">Financial Advisory and Intermediary Services Act 37 of 2002</p>
          </div>
          <div className="text-right text-xs text-gray-600 space-y-1">
            <p><strong>Reference:</strong> {refNumber}</p>
            <p><strong>Date:</strong> {formatDate(createdAt || new Date())}</p>
            <p><strong>FSP Number:</strong> {advisorProfile.fspNumber || '—'}</p>
            {clientProfile.contractNumber && (
              <p><strong>Contract/App No:</strong> {clientProfile.contractNumber}</p>
            )}
            {roaId && <p className="text-gray-400">ID: {roaId}</p>}
          </div>
        </div>

        {/* ── 1. PRACTICE & ADVISOR DETAILS ── */}
        <DocSection number="1" title="Practice & Advisor Details">
          <div className="grid grid-cols-2 gap-4">
            <DetailRow label="Practice / FSP Name"   value={advisorProfile.practiceName} />
            <DetailRow label="FSP Number"            value={advisorProfile.fspNumber} />
            <DetailRow label="Advisor"               value={advisorProfile.advisorName} />
            <DetailRow label="Contact"               value={advisorProfile.phone} />
            <DetailRow label="Email"                 value={advisorProfile.email} />
            <DetailRow label="Address"               value={advisorProfile.address} />
          </div>
        </DocSection>

        {/* ── 2. CLIENT DETAILS ── */}
        <DocSection number="2" title="Client Details">
          <div className="grid grid-cols-2 gap-4">
            <DetailRow label="Full Name"             value={clientFullName} />
            <DetailRow label="ID Number"             value={clientProfile.idNumber} />
            <DetailRow label="Date of Birth"         value={clientProfile.dateOfBirth ? formatDate(clientProfile.dateOfBirth) : null} />
            <DetailRow label="Tax Reference Number"  value={clientProfile.taxNumber} />
            <DetailRow label="Email"                 value={clientProfile.email} />
            <DetailRow label="Phone"                 value={clientProfile.phone} />
            <DetailRow label="Employment Status"     value={clientProfile.employmentStatus} />
            <DetailRow label="Dependants"            value={clientProfile.dependants} />
            <DetailRow label="Gross Monthly Income"  value={clientProfile.grossMonthlyIncome ? formatCurrency(clientProfile.grossMonthlyIncome) : null} />
            <DetailRow label="Total Assets"          value={clientProfile.totalAssets ? formatCurrency(clientProfile.totalAssets) : null} />
            <DetailRow label="Total Liabilities"     value={clientProfile.totalLiabilities ? formatCurrency(clientProfile.totalLiabilities) : null} />
            <DetailRow label="Residential Address"   value={clientProfile.address} span />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
            <DetailRow label="Investment Amount"         value={clientProfile.investmentAmount ? formatCurrency(clientProfile.investmentAmount) : null} />
            <DetailRow label="Monthly Contribution"      value={clientProfile.monthlyAmount ? formatCurrency(clientProfile.monthlyAmount) : null} />
            <DetailRow label="Investment Time Horizon"   value={clientProfile.investmentHorizon} />
            <DetailRow label="Liquidity Requirement"     value={clientProfile.liquidityNeeds} />
            <DetailRow label="Meeting Date"              value={clientProfile.meetingDate ? formatDate(clientProfile.meetingDate) : null} />
            {clientProfile.contractNumber && (
              <DetailRow label="Contract / Application Number" value={clientProfile.contractNumber || 'To be completed at implementation'} />
            )}
          </div>
        </DocSection>

        {/* ── FNA. FINANCIAL NEEDS ANALYSIS (conditional) ── */}
        {retirementCalc?.results && retirementCalc.calcType !== 'goal' && (
          <DocSection number="FNA" title="Financial Needs Analysis — Retirement Planning">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              {[
                { label: 'Corpus Needed',                value: formatCurrency(retirementCalc.results.corpus),       colour: 'bg-gray-50 border-gray-200' },
                { label: retirementCalc.results.shortfall > 0 ? 'Shortfall' : 'Surplus', value: formatCurrency(retirementCalc.results.shortfall || retirementCalc.results.surplus), colour: retirementCalc.results.shortfall > 0 ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200' },
                { label: 'Provisions at Retirement',     value: formatCurrency(retirementCalc.results.provisionsFV), colour: 'bg-blue-50 border-blue-200' },
                { label: 'Monthly Contribution Required', value: retirementCalc.results.requiredMonthly > 0 ? formatCurrency(retirementCalc.results.requiredMonthly) : '—', colour: 'bg-amber-50 border-amber-200' },
              ].map(card => (
                <div key={card.label} className={`border rounded-lg px-3 py-2 ${card.colour}`}>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-0.5">{card.label}</p>
                  <p className="text-sm font-bold text-gray-900">{card.value}</p>
                </div>
              ))}
            </div>
            <table className="w-full text-xs border-collapse mb-3">
              <tbody>
                <tr className="bg-gray-50"><td className="px-3 py-1.5 border border-gray-200 font-semibold text-gray-600 w-48">Current Monthly Expenses</td><td className="px-3 py-1.5 border border-gray-200">{formatCurrency(retirementCalc.results.totalMonthlyNow)} / month</td></tr>
                <tr><td className="px-3 py-1.5 border border-gray-200 font-semibold text-gray-600">Income Needed at Retirement</td><td className="px-3 py-1.5 border border-gray-200">{formatCurrency(retirementCalc.results.annualFuture / 12)} / month (future money)</td></tr>
                <tr className="bg-gray-50"><td className="px-3 py-1.5 border border-gray-200 font-semibold text-gray-600">Coverage</td><td className="px-3 py-1.5 border border-gray-200">{retirementCalc.results.coveragePct.toFixed(1)}%</td></tr>
                <tr><td className="px-3 py-1.5 border border-gray-200 font-semibold text-gray-600">Retirement Age / Duration</td><td className="px-3 py-1.5 border border-gray-200">{retirementCalc.retirementAge} — {retirementCalc.yearsInRetirement} years in retirement</td></tr>
                <tr className="bg-gray-50"><td className="px-3 py-1.5 border border-gray-200 font-semibold text-gray-600">Assumptions</td><td className="px-3 py-1.5 border border-gray-200">Growth {retirementCalc.growthRate}% · Inflation {retirementCalc.inflationRate}% · Advisor fees {retirementCalc.advisorFees}%</td></tr>
              </tbody>
            </table>
            {retirementCalc.provisions?.length > 0 && (
              <div className="mt-2">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Existing Provisions</p>
                <table className="w-full text-xs border-collapse">
                  <thead><tr className="bg-gray-100"><th className="text-left px-3 py-1.5 border border-gray-200 font-semibold text-gray-600">Description</th><th className="text-left px-3 py-1.5 border border-gray-200 font-semibold text-gray-600">Type</th><th className="text-right px-3 py-1.5 border border-gray-200 font-semibold text-gray-600">Current Value</th><th className="text-right px-3 py-1.5 border border-gray-200 font-semibold text-gray-600">Monthly</th><th className="text-right px-3 py-1.5 border border-gray-200 font-semibold text-gray-600">Projected FV</th></tr></thead>
                  <tbody>
                    {retirementCalc.provisions.map((p, i) => (
                      <tr key={i}>
                        <td className="px-3 py-1.5 border border-gray-200">{p.description || '—'}</td>
                        <td className="px-3 py-1.5 border border-gray-200">{p.type || p.assetType || '—'}</td>
                        <td className="px-3 py-1.5 border border-gray-200 text-right">{p.currentValue ? formatCurrency(p.currentValue) : '—'}</td>
                        <td className="px-3 py-1.5 border border-gray-200 text-right">{p.monthlyContribution ? formatCurrency(p.monthlyContribution) : '—'}</td>
                        <td className="px-3 py-1.5 border border-gray-200 text-right font-medium">{formatCurrency(provisionFV(p, retirementCalc.results.ytr))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </DocSection>
        )}

        {/* ── FNA (goal planner variant) ── */}
        {retirementCalc?.results && retirementCalc.calcType === 'goal' && (
          <DocSection number="FNA" title={`Financial Needs Analysis — Savings Goal${retirementCalc.goalDescription ? `: ${retirementCalc.goalDescription}` : ''}`}>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              {[
                { label: 'Goal Amount (future money)',    value: formatCurrency(retirementCalc.results.goalFV),        colour: 'bg-gray-50 border-gray-200' },
                { label: retirementCalc.results.shortfall > 0 ? 'Shortfall' : 'Surplus', value: formatCurrency(retirementCalc.results.shortfall || retirementCalc.results.surplus), colour: retirementCalc.results.shortfall > 0 ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200' },
                { label: 'Provisions at Target Date',     value: formatCurrency(retirementCalc.results.provisionsFV),  colour: 'bg-blue-50 border-blue-200' },
                { label: 'Monthly Contribution Required', value: retirementCalc.results.requiredMonthly > 0 ? formatCurrency(retirementCalc.results.requiredMonthly) : '—', colour: 'bg-amber-50 border-amber-200' },
              ].map(card => (
                <div key={card.label} className={`border rounded-lg px-3 py-2 ${card.colour}`}>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-0.5">{card.label}</p>
                  <p className="text-sm font-bold text-gray-900">{card.value}</p>
                </div>
              ))}
            </div>
            <table className="w-full text-xs border-collapse mb-3">
              <tbody>
                <tr className="bg-gray-50"><td className="px-3 py-1.5 border border-gray-200 font-semibold text-gray-600 w-48">Target Amount (today's money)</td><td className="px-3 py-1.5 border border-gray-200">{formatCurrency(retirementCalc.targetAmount)}</td></tr>
                <tr><td className="px-3 py-1.5 border border-gray-200 font-semibold text-gray-600">Time Horizon</td><td className="px-3 py-1.5 border border-gray-200">{retirementCalc.yearsToGoal} years</td></tr>
                <tr className="bg-gray-50"><td className="px-3 py-1.5 border border-gray-200 font-semibold text-gray-600">Coverage</td><td className="px-3 py-1.5 border border-gray-200">{retirementCalc.results.coveragePct.toFixed(1)}%</td></tr>
                {retirementCalc.results.shortfall > 0 && (
                  <tr><td className="px-3 py-1.5 border border-gray-200 font-semibold text-gray-600">Lump Sum Required (invest now)</td><td className="px-3 py-1.5 border border-gray-200">{formatCurrency(retirementCalc.results.requiredLumpSum)}</td></tr>
                )}
                <tr className="bg-gray-50"><td className="px-3 py-1.5 border border-gray-200 font-semibold text-gray-600">Assumptions</td><td className="px-3 py-1.5 border border-gray-200">Growth {retirementCalc.growthRate}% · Escalation {retirementCalc.goalEscalation}%</td></tr>
              </tbody>
            </table>
            {retirementCalc.provisions?.length > 0 && (
              <div className="mt-2">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Existing Provisions</p>
                <table className="w-full text-xs border-collapse">
                  <thead><tr className="bg-gray-100"><th className="text-left px-3 py-1.5 border border-gray-200 font-semibold text-gray-600">Description</th><th className="text-left px-3 py-1.5 border border-gray-200 font-semibold text-gray-600">Asset Type</th><th className="text-right px-3 py-1.5 border border-gray-200 font-semibold text-gray-600">Current Value</th><th className="text-right px-3 py-1.5 border border-gray-200 font-semibold text-gray-600">Monthly</th><th className="text-right px-3 py-1.5 border border-gray-200 font-semibold text-gray-600">Projected FV</th></tr></thead>
                  <tbody>
                    {retirementCalc.provisions.map((p, i) => (
                      <tr key={i}>
                        <td className="px-3 py-1.5 border border-gray-200">{p.description || '—'}</td>
                        <td className="px-3 py-1.5 border border-gray-200">{p.assetType || p.type || '—'}</td>
                        <td className="px-3 py-1.5 border border-gray-200 text-right">{p.currentValue ? formatCurrency(p.currentValue) : '—'}</td>
                        <td className="px-3 py-1.5 border border-gray-200 text-right">{p.monthlyContribution ? formatCurrency(p.monthlyContribution) : '—'}</td>
                        <td className="px-3 py-1.5 border border-gray-200 text-right font-medium">{formatCurrency(provisionFV(p, retirementCalc.yearsToGoal))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </DocSection>
        )}

        {/* ── 3. CLIENT NEEDS ── */}
        <DocSection number="3" title="Client Needs & Objectives">
          <DocText text={content.clientNeeds} />
        </DocSection>

        {/* ── 4. RISK PROFILE ── */}
        <DocSection number="4" title="Risk Profile">
          {riskProfile && (
            <div className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 mb-3 text-sm font-semibold ${riskProfile.colour}`}>
              <span>Risk Profile: {riskProfile.label}</span>
              {clientProfile.riskProfileOverride && <span className="text-xs font-normal opacity-75">(Advisor override)</span>}
            </div>
          )}
          <DocText text={content.riskProfile} />
          {clientProfile.riskNotes && (
            <div className="mt-3 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 text-xs text-amber-700">
              <strong>Override justification:</strong> {clientProfile.riskNotes}
            </div>
          )}
        </DocSection>

        {/* ── 5. PRODUCT RECOMMENDATION ── */}
        <DocSection number="5" title="Product Recommendation">
          {treeResult?.allocationPlan?.length > 0 ? (
            <>
              <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 mb-4">
                <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-0.5">Comprehensive Portfolio Allocation</p>
                <p className="text-sm text-blue-800 leading-relaxed">{treeResult.rationale}</p>
              </div>
              <table className="w-full text-xs border-collapse mb-4">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="text-left px-3 py-2 font-semibold text-gray-600 border border-gray-200">#</th>
                    <th className="text-left px-3 py-2 font-semibold text-gray-600 border border-gray-200">Product</th>
                    <th className="text-left px-3 py-2 font-semibold text-gray-600 border border-gray-200">Rationale</th>
                    <th className="text-right px-3 py-2 font-semibold text-gray-600 border border-gray-200">Amount</th>
                    {clientProfile.investmentAmount && <th className="text-right px-3 py-2 font-semibold text-gray-600 border border-gray-200">%</th>}
                  </tr>
                </thead>
                <tbody>
                  {treeResult.allocationPlan.map((a, i) => {
                    const pct = clientProfile.investmentAmount
                      ? ((a.amount / clientProfile.investmentAmount) * 100).toFixed(1)
                      : null;
                    return (
                      <tr key={i}>
                        <td className="px-3 py-2 border border-gray-200 text-center font-bold text-gray-500">{i + 1}</td>
                        <td className="px-3 py-2 border border-gray-200 font-semibold text-gray-800">{a.productLabel}</td>
                        <td className="px-3 py-2 border border-gray-200 text-gray-600">{a.reason}</td>
                        <td className="px-3 py-2 border border-gray-200 text-right font-bold">{formatCurrency(a.amount)}</td>
                        {pct && <td className="px-3 py-2 border border-gray-200 text-right">{pct}%</td>}
                      </tr>
                    );
                  })}
                  <tr className="bg-gray-50 font-bold">
                    <td colSpan={3} className="px-3 py-2 border border-gray-200">Total</td>
                    <td className="px-3 py-2 border border-gray-200 text-right">{formatCurrency(treeResult.allocationPlan.reduce((s, a) => s + (a.amount || 0), 0))}</td>
                    {clientProfile.investmentAmount && <td className="px-3 py-2 border border-gray-200 text-right">100%</td>}
                  </tr>
                </tbody>
              </table>
            </>
          ) : (
            <div className="bg-gray-50 rounded-lg px-4 py-3 mb-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Recommended Product</p>
                <p className="text-lg font-bold text-gray-900 mt-0.5">{getProductLabel(providerResult?.productKey || treeResult?.productKey)}</p>
                {treeResult?.secondaryProductKey && (
                  <p className="text-sm font-semibold text-gray-700 mt-0.5">+ {getProductLabel(treeResult.secondaryProductKey)}</p>
                )}
              </div>
              {treeResult?.flags?.length > 0 && (
                <div className="flex flex-wrap gap-1 justify-end">
                  {treeResult.flags.map(f => (
                    <span key={f} className="text-xs bg-blue-100 text-blue-700 rounded-full px-2 py-0.5">{f}</span>
                  ))}
                </div>
              )}
            </div>
          )}
          {treeResult?.splitAmounts && !treeResult?.allocationPlan && (
            <div className="mb-4 border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full text-xs">
                <thead><tr className="bg-gray-100"><th className="text-left px-3 py-2 font-semibold text-gray-600">Product</th><th className="text-right px-3 py-2 font-semibold text-gray-600">Allocation</th></tr></thead>
                <tbody>
                  <tr><td className="px-3 py-2 border-t border-gray-100">{getProductLabel(treeResult.productKey)}</td><td className="px-3 py-2 border-t border-gray-100 text-right font-medium">{formatCurrency(treeResult.splitAmounts.primary)}</td></tr>
                  <tr><td className="px-3 py-2 border-t border-gray-100">{getProductLabel(treeResult.secondaryProductKey)}</td><td className="px-3 py-2 border-t border-gray-100 text-right font-medium">{formatCurrency(treeResult.splitAmounts.secondary)}</td></tr>
                  <tr className="bg-gray-50 font-bold"><td className="px-3 py-2 border-t border-gray-200">Total</td><td className="px-3 py-2 border-t border-gray-200 text-right">{formatCurrency((treeResult.splitAmounts.primary||0)+(treeResult.splitAmounts.secondary||0))}</td></tr>
                </tbody>
              </table>
            </div>
          )}
          <DocText text={content.recommendation} />
          <PathTrail path={treeResult?.path} />
        </DocSection>

        {/* ── 6. PROVIDER RATIONALE ── */}
        <DocSection number="6" title="Provider Rationale">
          <DocText text={content.providerRationale} />
          <div className="mt-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Due Diligence Scoring — {getProductLabel(providerResult?.productKey || treeResult?.productKey)} — Top 3 Providers
            </p>
            <ProviderTable providerResult={providerResult} />
          </div>
          {providerResult2?.allRanked?.length > 0 && (
            <div className="mt-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Due Diligence Scoring — {getProductLabel(treeResult?.secondaryProductKey)} — Top 3 Providers
              </p>
              <ProviderTable providerResult={providerResult2} />
            </div>
          )}
          {providerResult?.recommended?.catalogue && (
            <div className="mt-4 bg-gray-50 rounded-lg px-4 py-3">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Recommended Product Details</p>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-xs text-gray-400">Product Name</span><p className="font-medium text-gray-800">{providerResult.recommended.catalogue.name}</p></div>
                <div><span className="text-xs text-gray-400">Minimum Lump Sum</span><p className="font-medium text-gray-800">{formatCurrency(providerResult.recommended.catalogue.minLumpSum)}</p></div>
                {providerResult.recommended.catalogue.minMonthly && (
                  <div><span className="text-xs text-gray-400">Minimum Monthly</span><p className="font-medium text-gray-800">{formatCurrency(providerResult.recommended.catalogue.minMonthly)}</p></div>
                )}
              </div>
              {providerResult.recommended.catalogue.notes && (
                <p className="text-xs text-gray-500 mt-2 italic">{providerResult.recommended.catalogue.notes}</p>
              )}
            </div>
          )}
        </DocSection>

        {/* ── 7. COSTS & FEES ── */}
        <DocSection number="7" title="Costs & Fees">
          <DocText text={content.costs} />
          <FeeTable fees={fees} investmentAmount={clientProfile.investmentAmount} />
          {fees?.notes && (
            <div className="mt-3 text-xs text-gray-500 italic border-t border-gray-100 pt-2">{fees.notes}</div>
          )}
        </DocSection>

        {/* ── 8. TAX IMPLICATIONS ── */}
        <DocSection number="8" title="Tax Implications">
          <DocText text={content.tax} />
          <div className="mt-3 bg-gray-50 rounded-lg px-4 py-3 text-xs text-gray-600 grid grid-cols-2 gap-x-6 gap-y-1">
            <p className="col-span-2 font-semibold text-gray-700 mb-1">2026 Legislative Limits (for reference)</p>
            <span>TFSA annual: <strong>{formatCurrency(LIMITS.tfsaAnnual)}</strong></span>
            <span>TFSA lifetime: <strong>{formatCurrency(LIMITS.tfsaLifetime)}</strong></span>
            <span>RA deduction: <strong>{LIMITS.raDeductionPct}% / {formatCurrency(LIMITS.raDeductionCap)}</strong></span>
            <span>Retirement lump sum tax-free: <strong>{formatCurrency(LIMITS.retirementTaxFree)}</strong></span>
            <span>Interest exemption (&lt;65): <strong>{formatCurrency(LIMITS.interestExemptU65)}</strong></span>
            <span>Interest exemption (65+): <strong>{formatCurrency(LIMITS.interestExempt65)}</strong></span>
            <span>CGT annual exclusion: <strong>{formatCurrency(LIMITS.cgtAnnualExclusion)}</strong></span>
            <span>LA drawdown: <strong>{LIMITS.laMinDrawdown}%–{LIMITS.laMaxDrawdown}%</strong></span>
          </div>
        </DocSection>

        {/* ── 9. REGULATION 28 (conditional) ── */}
        {(isReg28Product || content.reg28) && (
          <DocSection number="9" title="Regulation 28">
            {content.reg28
              ? <DocText text={content.reg28} />
              : <p className="text-sm text-gray-700">This investment is subject to Regulation 28 of the Pension Funds Act. The asset allocation will comply with the prescribed limits including a maximum equity exposure of 75%, maximum property exposure of 25%, and maximum offshore exposure of 45% (including 10% African markets). The selected fund mandate complies with Regulation 28 requirements.</p>
            }
          </DocSection>
        )}

        {/* ── 10. FAIS & STATUTORY DISCLOSURES ── */}
        <DocSection number={isReg28Product || content.reg28 ? "10" : "9"} title="FAIS & Statutory Disclosures">
          <DocText text={content.faisDisclosure} />
          {clientProfile.replacingProduct === 'yes' && (
            <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
              <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider mb-1">Product Replacement Disclosure</p>
              <p className="text-sm text-amber-800">{clientProfile.replacementReason || 'Replacement reason to be documented.'}</p>
            </div>
          )}
        </DocSection>

        {/* ── 11. IMPLEMENTATION ── */}
        {content.implementation && (
          <DocSection number={isReg28Product || content.reg28 ? "11" : "10"} title="Implementation Steps">
            <DocText text={content.implementation} />
          </DocSection>
        )}

        {/* ── 12. REVIEW SCHEDULE ── */}
        {content.reviewSchedule && (
          <DocSection number={isReg28Product || content.reg28 ? "12" : "11"} title="Review Schedule">
            <DocText text={content.reviewSchedule} />
          </DocSection>
        )}

        {/* ── SECTION I. CLIENT DECLARATIONS ── */}
        <DocSection number="I" title="Client Declarations">
          <p className="text-xs text-gray-500 italic mb-3">[Please note that it is of utmost importance that you read this section carefully and understand it fully before acceptance.]</p>
          <table className="w-full text-xs border-collapse">
            <tbody>
              {[
                { n:'1',  text: 'I confirm that a Contact Stage Disclosure letter, setting out the Financial Advisor\'s full particulars, his/her experience and services offered, has been provided to me.' },
                { n:'2',  text: 'I confirm that I required the Financial Advisor to render the financial services set out in the Service Level Agreement, a copy of which has been provided to me.' },
                { n:'3',  text: null, sub: [
                  'Where I elected not to take up the Financial Advisor\'s recommendation of a Full Financial Needs Analysis, or where I explicitly declined to provide any information requested by the Financial Advisor, I confirm that:',
                  'a) I clearly understand that there may be limitations on the appropriateness of the advice provided, and',
                  'b) I will take particular care to consider on my own whether the advice is appropriate considering my own financial objectives, financial position and particular needs, particularly any aspects of such objectives, situation or needs that were not considered in light of the circumstances.',
                ]},
                { n:'4',  text: 'Where I elected to conclude a transaction that differs from that recommended by the Financial Advisor, or otherwise elected not to follow the advice furnished, or elected to receive more limited information or advice than what the Financial Advisor was able to provide, I was alerted of the clear existence of any risks to myself and was advised to take particular care to consider whether any product selected is appropriate to my needs, objectives and circumstances.' },
                { n:'5',  text: 'I understand that the accuracy of a Needs Analysis is dependent on the information provided to or obtained by the Financial Advisor. The advice furnished and product recommendations made by the Financial Advisor are based on the information I provided to the Financial Advisor. I understand that material non-disclosures and misrepresentations could result in inappropriate product(s) being recommended and purchased by me.' },
                { n:'6',  text: 'I confirm that I was provided with copies of quote(s), marketing brochures, rates and benefit sheets for the product(s) selected. All material terms and conditions of the product(s) selected were explained to me prior to any decision made.' },
                { n:'7',  text: 'I have been informed of and understand all costs, charges, penalties, liquidity and tax implications where applicable. I understand the risks / guarantees (or absence thereof) associated with the product(s) selected.' },
                { n:'8',  text: 'I confirm that all documents signed by me were fully completed prior to my signing them.' },
                { n:'9',  text: 'I confirm that where I provided the Financial Advisor with the information required for any risk benefit application forms on my behalf, the Financial Advisor warned me verbally of the risks and consequences of non-disclosure and misrepresentation of such information.' },
                { n:'10', text: 'I confirm that the Financial Advisor has made enquiries to ascertain whether the product(s) selected is intended to replace any existing financial products held by me and where applicable, has informed me of the financial implications, costs and consequences of replacement.' },
                { n:'11', text: 'Notwithstanding the information provided by the Financial Advisor, I acknowledge that I have an obligation to familiarise myself with the terms and conditions of the product(s) that I have purchased.' },
                { n:'12', text: 'I confirm having received a copy of this Client Advice Record.' },
              ].map(row => (
                <tr key={row.n}>
                  <td className="border border-gray-300 px-2 py-2 text-center font-bold text-gray-600 align-top w-8">{row.n}.</td>
                  <td className="border border-gray-300 px-3 py-2 text-gray-700 leading-relaxed">
                    {row.sub ? (
                      <div>
                        <p>{row.sub[0]}</p>
                        <div className="mt-1.5 ml-3 space-y-1">
                          <p>{row.sub[1]}</p>
                          <p>{row.sub[2]}</p>
                        </div>
                      </div>
                    ) : row.text}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-4">
            <p className="text-xs font-semibold text-gray-600 mb-1">General Comments:</p>
            <div className="border border-gray-300 rounded min-h-16 px-3 py-2 text-sm text-gray-800">
              {content.clientDeclComments || <span className="text-gray-300 italic"> </span>}
            </div>
          </div>
        </DocSection>

        {/* ── SECTION H. FINANCIAL ADVISOR'S DECLARATION ── */}
        <DocSection number="H" title="Financial Advisor's Declaration">
          <table className="w-full text-xs border-collapse">
            <tbody>
              <tr>
                <td className="border border-gray-300 px-2 py-2 text-center font-bold text-gray-600 w-6 align-top">1.</td>
                <td className="border border-gray-300 px-3 py-2 text-gray-700 align-top" style={{width:'35%'}}>The client has elected not to accept the following product recommendations:</td>
                <td className="border border-gray-300 px-3 py-2 text-gray-800 align-top">
                  {content.advisorDeclaration?.declined
                    ? <span className="whitespace-pre-wrap">{content.advisorDeclaration.declined}</span>
                    : <span className="text-gray-400 italic">N/A</span>}
                </td>
              </tr>
              <tr>
                <td className="border border-gray-300 px-2 py-2 text-center font-bold text-gray-600 align-top">2.</td>
                <td className="border border-gray-300 px-3 py-2 text-gray-700 align-top">Reasons that the client elected not to accept the product recommendations above:</td>
                <td className="border border-gray-300 px-3 py-2 text-gray-800 align-top">
                  {content.advisorDeclaration?.reasons
                    ? <span className="whitespace-pre-wrap">{content.advisorDeclaration.reasons}</span>
                    : <span className="text-gray-400 italic">N/A</span>}
                </td>
              </tr>
              <tr>
                <td className="border border-gray-300 px-2 py-2 text-center font-bold text-gray-600 align-top">3.</td>
                <td className="border border-gray-300 px-3 py-2 text-gray-700 align-top">Existence of any risks to the client for not concluding the transaction recommended:</td>
                <td className="border border-gray-300 px-3 py-2 text-gray-800 align-top">
                  {content.advisorDeclaration?.risks
                    ? <span className="whitespace-pre-wrap">{content.advisorDeclaration.risks}</span>
                    : <span className="text-gray-400 italic">N/A</span>}
                </td>
              </tr>
              <tr>
                <td className="border border-gray-300 px-2 py-2 text-center font-bold text-gray-600 align-top">4.</td>
                <td colSpan={2} className="border border-gray-300 px-3 py-2">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-gray-700">The consequences thereof have been clearly explained to the Client:</span>
                    <div className="flex gap-6 flex-shrink-0">
                      <span className={`font-bold ${content.advisorDeclaration?.consequences === true ? 'text-gray-900' : 'text-gray-300'}`}>
                        {content.advisorDeclaration?.consequences === true ? '☑' : '☐'} Yes
                      </span>
                      <span className={`font-bold ${content.advisorDeclaration?.consequences === false ? 'text-gray-900' : 'text-gray-300'}`}>
                        {content.advisorDeclaration?.consequences === false ? '☑' : '☐'} No
                      </span>
                    </div>
                  </div>
                </td>
              </tr>
              <tr>
                <td className="border border-gray-300 px-2 py-2 text-center font-bold text-gray-600 align-top">5.</td>
                <td className="border border-gray-300 px-3 py-2 text-gray-700 align-top">Where there is only a focussed need being addressed, the following was discussed and agreed with the Client:</td>
                <td className="border border-gray-300 px-3 py-2 text-gray-800 align-top">
                  {content.advisorDeclaration?.focussed
                    ? <span className="whitespace-pre-wrap">{content.advisorDeclaration.focussed}</span>
                    : <span className="text-gray-400 italic">N/A</span>}
                </td>
              </tr>
              <tr>
                <td className="border border-gray-300 px-2 py-2 text-center font-bold text-gray-600 align-top">6.</td>
                <td colSpan={2} className="border border-gray-300 px-3 py-2 text-gray-700 leading-relaxed">
                  Where there is only a focussed need being addressed or where the Client explicitly declined to provide any information requested by the Advisor, the Advisor confirms that he/she has alerted the client that:
                  <div className="mt-1.5 ml-4 space-y-1">
                    <p>a) There may be limitations on the appropriateness of the advice provided, and</p>
                    <p>b) The client should take particular care to consider on its own whether the advice is appropriate considering the client's financial objectives, financial position and particular needs, particularly any aspects of such objectives, situation or needs that were not considered in light of the circumstances.</p>
                  </div>
                </td>
              </tr>
              <tr>
                <td className="border border-gray-300 px-2 py-2 text-center font-bold text-gray-600 align-top">7.</td>
                <td colSpan={2} className="border border-gray-300 px-3 py-2 text-gray-700 leading-relaxed">
                  Where the Advisor does not have a suitable product that is appropriate for the client's needs, the Advisor confirms that:
                  <div className="mt-1.5 ml-4 space-y-1">
                    <p>a) This has been clearly explained to the Client</p>
                    <p>b) He/she has declined to recommend a product or transaction</p>
                    <p>c) He/she suggested to the client that the client should seek advice from another appropriately authorised provider.</p>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </DocSection>

        {/* ── SIGNATURE BLOCK ── */}
        <div className="mt-12 pt-8 border-t-2 border-gray-900 page-break">
          <h2 className="text-base font-bold text-gray-900 uppercase tracking-wide mb-6">Acknowledgement & Signatures</h2>
          <p className="text-sm text-gray-600 mb-8 leading-relaxed">
            I/We, the undersigned, confirm that: (1) the information provided in this Record of Advice is accurate and complete to the best of my/our knowledge; (2) the risks, costs, product features, and tax implications of the recommended product have been explained and understood; (3) the recommendation is appropriate for my/our financial situation, needs, and objectives as disclosed; and (4) I/we have received and reviewed a copy of this Record of Advice prior to signing.
          </p>
          <div className="grid grid-cols-2 gap-12">
            <div>
              <div className="border-b-2 border-gray-400 mb-2 pb-8"></div>
              <p className="text-sm font-semibold text-gray-700">{clientFullName}</p>
              <p className="text-xs text-gray-500">Client Signature</p>
              <p className="text-xs text-gray-400 mt-1">Date: ___________________</p>
            </div>
            <div>
              <div className="border-b-2 border-gray-400 mb-2 pb-8"></div>
              <p className="text-sm font-semibold text-gray-700">{advisorProfile.advisorName || 'Financial Advisor'}</p>
              <p className="text-xs text-gray-500">Advisor Signature</p>
              <p className="text-xs text-gray-400 mt-1">Date: ___________________</p>
            </div>
          </div>
          {clientProfile.applicationDate && (
            <p className="text-xs text-gray-400 mt-6 text-center">Application date: {formatDate(clientProfile.applicationDate)} · FSP: {advisorProfile.fspNumber || '—'} · Ref: {refNumber}</p>
          )}
        </div>

      </div>
    </div>
  );
}
