/**
 * InvestmentCARDocument.jsx
 * Print-ready Investment Client Advice Record document.
 * Mirrors the Fairbairn Consult PDF layout exactly.
 *
 * Usage:
 *   <InvestmentCARDocument carData={...} advisorProfile={...} onEdit={fn} />
 */

import { useRef } from 'react';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const NEEDS_LABELS = {
  retirementAnnuity:    'Retirement Annuity',
  preservation:         'Preservation',
  livingAnnuity:        'Living Annuity',
  fixedAnnuity:         'Fixed Annuity',
  lifeAnnuity:          'Life Annuity',
  guaranteedIncomePlan: 'Guaranteed Income Plan',
  retirementIncomePlan: 'Retirement Income Plan',
  unitTrust:            'Unit Trust',
  taxFree:              'Tax Free',
  endowment:            'Endowment',
  flexible:             'Flexible',
  guaranteedTerm:       'Guaranteed Term',
  emergencyFund:        'Emergency Fund',
  educationPolicy:      'Education Policy',
  other:                'Other',
};

const PRE_RETIREMENT  = ['retirementAnnuity', 'preservation'];
const POST_RETIREMENT = ['livingAnnuity', 'fixedAnnuity', 'lifeAnnuity', 'guaranteedIncomePlan', 'retirementIncomePlan'];
const SAVINGS         = ['unitTrust', 'taxFree', 'endowment', 'flexible', 'guaranteedTerm'];
const OTHER_NEEDS     = ['emergencyFund', 'educationPolicy', 'other'];

const ADDRESSED_LABELS = { Y: 'Yes', N: 'No', P: 'Partially', L: 'Later', '': '—' };

const CLIENT_DECLARATIONS = [
  'I confirm that a Contact Stage Disclosure letter, setting out the Financial Advisor\'s full particulars, his/her experience and services offered, has been provided to me.',
  'I confirm that I required the Financial Advisor to render the financial services set out in the Service Level Agreement, a copy of which has been provided to me.',
  'Where I elected not to take up the Financial Advisor\'s recommendation of a Full Financial Needs Analysis, or where I explicitly declined to provide any information requested by the Financial Advisor, I confirm that: (a) I clearly understand that there may be limitations on the appropriateness of the advice provided, and (b) I will take particular care to consider on my own whether the advice is appropriate considering my own financial objectives, financial position and particular needs, particularly any aspects of such objectives, situation or needs that were not considered in light of the circumstances.',
  'Where I elected to conclude a transaction that differs from that recommended by the Financial Advisor, or otherwise elected not to follow the advice furnished, or elected to receive more limited information or advice than what the Financial Advisor was able to provide, I was alerted of the clear existence of any risks to myself and was advised to take particular care to consider whether any product selected is appropriate to my needs, objectives and circumstances.',
  'I understand that the accuracy of a Needs Analysis is dependent on the information provided to or obtained by the Financial Advisor. The advice furnished and product recommendations made by the Financial Advisor are based on the information I provided to the Financial Advisor. I understand that material non-disclosures and misrepresentations could result in inappropriate product(s) being recommended and purchased by me.',
  'I confirm that I was provided with copies of quote(s), marketing brochures, rates and benefit sheets for the product(s) selected. All material terms and conditions of the product(s) selected were explained to me prior to any decision made.',
  'I have been informed of and understand all costs, charges, penalties, liquidity and tax implications where applicable. I understand the risks / guarantees (or absence thereof) associated with the product(s) selected.',
  'I confirm that all documents signed by me were fully completed prior to my signing them.',
  'I confirm that where I provided the Financial Advisor with the information required for any risk benefit application forms on my behalf, the Financial Advisor warned me verbally of the risks and consequences of non-disclosure and misrepresentation of such information.',
  'I confirm that the Financial Advisor has made enquiries to ascertain whether the product(s) selected is intended to replace any existing financial products held by me and where applicable, has informed me of the financial implications, costs and consequences of replacement.',
  'Notwithstanding the information provided by the Financial Advisor, I acknowledge that I have an obligation to familiarise myself with the terms and conditions of the product(s) that I have purchased.',
  'I confirm having received a copy of this Client Advice Record.',
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function DocSection({ title, children }) {
  return (
    <div className="mb-6">
      <h3 className="text-sm font-bold text-gray-800 border-b border-gray-300 pb-1 mb-3 uppercase tracking-wide">{title}</h3>
      {children}
    </div>
  );
}

function LabeledCell({ label, value, className = '' }) {
  return (
    <div className={`mb-3 ${className}`}>
      <p className="text-xs font-semibold text-gray-500 mb-0.5">{label}</p>
      <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">{value || '—'}</p>
    </div>
  );
}

function CheckboxRow({ label, selected, options }) {
  return (
    <div className="flex items-center gap-2 mb-1.5">
      <span className="text-xs font-semibold text-gray-600 w-44 flex-shrink-0">{label}:</span>
      <div className="flex flex-wrap gap-3">
        {options.map(opt => (
          <span
            key={opt}
            className={`text-xs px-2.5 py-1 rounded-lg border font-medium ${
              selected === opt
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-gray-50 text-gray-400 border-gray-200'
            }`}
          >
            {opt}
          </span>
        ))}
      </div>
    </div>
  );
}

function NeedsGroup({ title, keys, sectionB }) {
  const hasAny = keys.some(k => sectionB[k]?.addressed || sectionB[k]?.quantified || sectionB[k]?.priority);
  return (
    <div className="mb-4">
      <p className="text-xs font-bold text-blue-700 uppercase tracking-wide bg-blue-50 px-2 py-1 rounded mb-2">{title}</p>
      <div className="overflow-x-auto">
        <table className="w-full text-xs border border-gray-200 rounded-lg overflow-hidden">
          <thead>
            <tr className="bg-gray-50">
              <th className="py-1.5 px-2 text-left font-semibold text-gray-600 border-b border-gray-200">Investment Need</th>
              <th className="py-1.5 px-2 text-left font-semibold text-gray-600 border-b border-gray-200">Quantified</th>
              <th className="py-1.5 px-2 text-left font-semibold text-gray-600 border-b border-gray-200">Priority</th>
              <th className="py-1.5 px-2 text-left font-semibold text-gray-600 border-b border-gray-200">Addressed</th>
              <th className="py-1.5 px-2 text-left font-semibold text-gray-600 border-b border-gray-200">Shortfall</th>
              <th className="py-1.5 px-2 text-left font-semibold text-gray-600 border-b border-gray-200">Review Date</th>
            </tr>
          </thead>
          <tbody>
            {keys.map(key => {
              const d = sectionB[key] || {};
              const highlighted = d.addressed && d.addressed !== 'N';
              return (
                <tr key={key} className={`border-b border-gray-100 ${highlighted ? 'bg-blue-50/30' : ''}`}>
                  <td className="py-1.5 px-2 font-medium text-gray-700">{NEEDS_LABELS[key]}</td>
                  <td className="py-1.5 px-2 text-gray-600">{d.quantified || '—'}</td>
                  <td className="py-1.5 px-2 text-gray-600 text-center">{d.priority || '—'}</td>
                  <td className="py-1.5 px-2">
                    {d.addressed ? (
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${
                        d.addressed === 'Y' ? 'bg-green-100 text-green-700' :
                        d.addressed === 'N' ? 'bg-red-100 text-red-600' :
                        d.addressed === 'P' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-500'
                      }`}>
                        {ADDRESSED_LABELS[d.addressed] || d.addressed}
                      </span>
                    ) : <span className="text-gray-300">—</span>}
                  </td>
                  <td className="py-1.5 px-2 text-gray-600">{d.shortfall || '—'}</td>
                  <td className="py-1.5 px-2 text-gray-600">{d.reviewDate || '—'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── MAIN DOCUMENT ────────────────────────────────────────────────────────────
export default function InvestmentCARDocument({ carData, advisorProfile, onEdit }) {
  const printRef = useRef(null);

  const handlePrint = () => {
    window.print();
  };

  const A = carData.sectionA || {};
  const B = carData.sectionB || {};
  const C = carData.sectionC || [];
  const D = carData.sectionD || {};
  const E = carData.sectionE || {};
  const F = carData.sectionF || {};
  const G = carData.sectionG || {};
  const H = carData.sectionH || {};

  const faName = carData.faName || advisorProfile?.advisorName || '';
  const practiceName = advisorProfile?.practiceName || 'Fairbairn Consult';

  return (
    <div className="max-w-3xl mx-auto">

      {/* ── Toolbar (hidden when printing) ── */}
      <div className="print:hidden flex items-center justify-between mb-4 gap-3">
        <div>
          <h2 className="text-lg font-bold text-gray-800">Investment Client Advice Record</h2>
          <p className="text-xs text-gray-400">Review the completed advice record below, then print or save as PDF.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onEdit}
            className="text-sm text-gray-600 border border-gray-200 rounded-xl px-4 py-2 hover:bg-gray-50 transition-colors"
          >
            ← Edit
          </button>
          <button
            onClick={handlePrint}
            className="text-sm bg-blue-600 text-white rounded-xl px-5 py-2 font-semibold hover:bg-blue-700 transition-colors"
          >
            🖨 Print / Save PDF
          </button>
        </div>
      </div>

      {/* ── PRINTABLE DOCUMENT ── */}
      <div
        ref={printRef}
        id="car-printable"
        className="bg-white border border-gray-200 rounded-2xl p-8 print:border-0 print:rounded-none print:p-6 print:shadow-none"
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-6 pb-5 border-b-2 border-gray-800">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Investment Client Advice Record</h1>
            <p className="text-sm text-gray-500 mt-1">{practiceName}</p>
          </div>
          <div className="text-right">
            {advisorProfile?.logo ? (
              <img src={advisorProfile.logo} alt="Practice logo" className="h-12 object-contain" />
            ) : (
              <div className="text-lg font-extrabold text-gray-700 tracking-wide">FAIRBAIRN CONSULT</div>
            )}
            <p className="text-xs text-gray-400 mt-1">WEALTH CREATION AND PROTECTION</p>
          </div>
        </div>

        {/* Client / FA header row */}
        <div className="grid grid-cols-3 gap-0 border border-gray-300 rounded-lg overflow-hidden mb-6 text-sm">
          <div className="col-span-2 border-r border-gray-300 p-3">
            <span className="text-xs font-semibold text-gray-500 block mb-0.5">Client</span>
            <span className="font-semibold text-gray-800">{carData.clientName || '—'}</span>
          </div>
          <div className="p-3">
            <span className="text-xs font-semibold text-gray-500 block mb-0.5">Reference</span>
            <span className="font-semibold text-gray-800">{carData.referenceNumber || '—'}</span>
          </div>
          <div className="col-span-2 border-t border-r border-gray-300 p-3">
            <span className="text-xs font-semibold text-gray-500 block mb-0.5">Financial Advisor</span>
            <span className="font-semibold text-gray-800">{faName || '—'}</span>
          </div>
          <div className="border-t border-gray-300 p-3">
            <span className="text-xs font-semibold text-gray-500 block mb-0.5">Date</span>
            <span className="font-semibold text-gray-800">{carData.date || '—'}</span>
          </div>
          {carData.contractNumber && (
            <div className="col-span-3 border-t border-gray-300 p-3">
              <span className="text-xs font-semibold text-gray-500 block mb-0.5">Contract / Application Number</span>
              <span className="font-semibold text-gray-800">{carData.contractNumber}</span>
            </div>
          )}
        </div>

        {/* ── SECTION A ── */}
        <DocSection title="Section A — Summary of Information obtained from the Client">
          <LabeledCell label="Client's Needs and Objectives" value={A.clientNeedsObjectives} />
          <LabeledCell label="Financial Situation" value={A.financialSituation} />

          <div className="mb-3">
            <p className="text-xs font-semibold text-gray-500 mb-1.5">Risk Profile</p>
            <CheckboxRow
              label=""
              selected={A.riskProfile}
              options={['Conservative', 'Moderate Conservative', 'Moderate', 'Moderate Aggressive', 'Aggressive']}
            />
          </div>

          <LabeledCell label="Product Knowledge and Experience" value={A.productKnowledge} />

          <div className="mb-3">
            <p className="text-xs font-semibold text-gray-500 mb-1.5">Investment Horizon</p>
            <CheckboxRow
              label=""
              selected={A.investmentHorizon}
              options={['0–2 Years', '2–5 Years', '5–9 Years', '10 Years+']}
            />
          </div>

          <div className="mb-3">
            <p className="text-xs font-semibold text-gray-500 mb-1.5">Access to Capital</p>
            <CheckboxRow
              label=""
              selected={A.accessToCapital}
              options={['Need to draw an income', 'Always require access to capital', 'Do not require access to capital for 5 years']}
            />
          </div>

          <LabeledCell label="Other Information" value={A.otherInformation} />

          <div className="grid grid-cols-2 gap-4">
            <LabeledCell label="Amount Available to be Invested" value={A.amountToInvest} />
            <LabeledCell label="Frequency" value={A.investmentFrequency} />
          </div>
        </DocSection>

        {/* ── SECTION B ── */}
        <DocSection title="Section B — Needs and Goals identified">
          <NeedsGroup title="Pre-Retirement"  keys={PRE_RETIREMENT}  sectionB={B} />
          <NeedsGroup title="Post-Retirement" keys={POST_RETIREMENT} sectionB={B} />
          <NeedsGroup title="Savings"         keys={SAVINGS}         sectionB={B} />
          <NeedsGroup title="Other"           keys={OTHER_NEEDS}     sectionB={B} />
        </DocSection>

        {/* ── SECTION C ── */}
        <DocSection title="Section C — Products Considered">
          <div className="overflow-x-auto">
            <table className="w-full text-xs border border-gray-200 rounded-lg overflow-hidden">
              <thead>
                <tr className="bg-gray-50">
                  <th className="py-1.5 px-3 text-left font-semibold text-gray-600 border-b border-gray-200">Company / Provider</th>
                  <th className="py-1.5 px-3 text-left font-semibold text-gray-600 border-b border-gray-200">Product</th>
                  <th className="py-1.5 px-3 text-left font-semibold text-gray-600 border-b border-gray-200">Premium / Investment Amount</th>
                  <th className="py-1.5 px-3 text-center font-semibold text-gray-600 border-b border-gray-200">Fund Fact Sheet</th>
                  <th className="py-1.5 px-3 text-center font-semibold text-gray-600 border-b border-gray-200">Quote on File</th>
                </tr>
              </thead>
              <tbody>
                {C.filter(r => r.company || r.product).map((row, idx) => (
                  <tr key={idx} className="border-b border-gray-100">
                    <td className="py-2 px-3 text-gray-700">{row.company || '—'}</td>
                    <td className="py-2 px-3 text-gray-700">{row.product || '—'}</td>
                    <td className="py-2 px-3 text-gray-700">{row.amount || '—'}</td>
                    <td className="py-2 px-3 text-center">
                      <span className={`font-bold ${row.fundFactSheet ? 'text-green-600' : 'text-gray-400'}`}>
                        {row.fundFactSheet ? 'Y' : 'N'}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-center">
                      <span className={`font-bold ${row.quoteOnFile ? 'text-green-600' : 'text-gray-400'}`}>
                        {row.quoteOnFile ? 'Y' : 'N'}
                      </span>
                    </td>
                  </tr>
                ))}
                {C.filter(r => r.company || r.product).length === 0 && (
                  <tr><td colSpan={5} className="py-3 px-3 text-gray-400 text-center">No products listed</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </DocSection>

        {/* ── SECTION D ── */}
        <DocSection title="Section D — Initial Recommendation / Advice">
          <div className="grid grid-cols-3 gap-0 border border-gray-200 rounded-lg overflow-hidden text-sm">
            <div className="bg-gray-50 p-3 border-r border-gray-200">
              <p className="text-xs font-semibold text-gray-600">Product / Funds Recommended</p>
              <p className="text-sm font-semibold text-gray-800 mt-1">{D.productsRecommended || '—'}</p>
            </div>
            <div className="col-span-2 p-3">
              <p className="text-xs font-semibold text-gray-500 mb-1">Motivation for Recommendation</p>
              <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{D.motivation || '—'}</p>
            </div>
          </div>
        </DocSection>

        {/* ── SECTION E ── */}
        <DocSection title="Section E — Implementation Motivation">
          <div className="grid grid-cols-3 gap-0 border border-gray-200 rounded-lg overflow-hidden text-sm">
            <div className="bg-gray-50 p-3 border-r border-gray-200">
              <p className="text-xs font-semibold text-gray-600">Product / Funds Implemented</p>
              <p className="text-sm font-semibold text-gray-800 mt-1">{E.productsImplemented || '—'}</p>
            </div>
            <div className="col-span-2 p-3">
              <p className="text-xs font-semibold text-gray-500 mb-1">Rationale for Product(s) Selected</p>
              <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{E.rationale || '—'}</p>
            </div>
          </div>
        </DocSection>

        {/* ── SECTION F ── */}
        <DocSection title="Section F — Important Information highlighted to Client">
          <div className="border border-gray-200 rounded-lg p-4">
            <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{F.importantInfo || '—'}</p>
          </div>
        </DocSection>

        {/* ── SECTION G ── */}
        <DocSection title="Section G — Fees &amp; Commission Disclosure">
          <div className="grid grid-cols-2 gap-0 border border-gray-200 rounded-lg overflow-hidden text-sm mb-4">
            <div className="p-4 border-r border-gray-200">
              <p className="text-xs font-semibold text-gray-500 mb-2">Upfront</p>
              <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{G.upfront || '—'}</p>
            </div>
            <div className="p-4">
              <p className="text-xs font-semibold text-gray-500 mb-2">Ongoing</p>
              <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{G.ongoing || '—'}</p>
            </div>
          </div>
          {G.commissionDisclosure && (
            <div className="border border-gray-200 rounded-lg p-4">
              <p className="text-xs font-semibold text-gray-500 mb-2">Commission Disclosure &amp; Client Acceptance</p>
              <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{G.commissionDisclosure}</p>
            </div>
          )}
        </DocSection>

        {/* ── SECTION H ── */}
        <DocSection title="Section H — Financial Advisor's Declaration">
          <div className="border border-gray-200 rounded-lg overflow-hidden text-sm">
            <div className="grid grid-cols-2 gap-0">
              <div className="p-3 bg-gray-50 border-b border-r border-gray-200 text-xs font-semibold text-gray-600">
                1. Client elected NOT to accept the following recommendations:
              </div>
              <div className="p-3 border-b border-gray-200 text-sm text-gray-700">
                {H.notAcceptedProducts || '—'}
              </div>
              <div className="p-3 bg-gray-50 border-b border-r border-gray-200 text-xs font-semibold text-gray-600">
                2. Reasons the client elected not to accept:
              </div>
              <div className="p-3 border-b border-gray-200 text-sm text-gray-700">
                {H.reasonsNotAccepted || '—'}
              </div>
              <div className="p-3 bg-gray-50 border-b border-r border-gray-200 text-xs font-semibold text-gray-600">
                3. Risks to the client for not concluding the recommended transaction:
              </div>
              <div className="p-3 border-b border-gray-200 text-sm text-gray-700">
                {H.risksExisting || '—'}
              </div>
              <div className="p-3 bg-gray-50 border-r border-gray-200 text-xs font-semibold text-gray-600">
                4. Consequences clearly explained to client?
              </div>
              <div className="p-3 text-sm font-semibold text-gray-700">
                {H.consequencesExplained || '—'}
              </div>
            </div>
            {H.focusedNeed && (
              <div className="border-t border-gray-200 p-3">
                <p className="text-xs font-semibold text-gray-500 mb-1">5. Focused need discussed and agreed:</p>
                <p className="text-sm text-gray-700">{H.focusedNeed}</p>
              </div>
            )}

            {/* Points 6 & 7 – pre-printed text */}
            <div className="border-t border-gray-200 p-3 bg-gray-50/50">
              <p className="text-xs text-gray-500 leading-relaxed">
                <strong>6.</strong> Where there is only a focussed need being addressed or where the Client explicitly declined to provide any information requested by the Advisor, the Advisor confirms that he/she has alerted the client that: (a) There may be limitations on the appropriateness of the advice provided, and (b) The client should take particular care to consider on its own whether the advice is appropriate considering the client's financial objectives, financial position and particular needs.
              </p>
              <p className="text-xs text-gray-500 leading-relaxed mt-2">
                <strong>7.</strong> Where the Advisor does not have a suitable product that is appropriate for the client's needs, the Advisor confirms that: (a) This has been clearly explained to the Client; (b) He/she has declined to recommend a product or transaction; (c) He/she suggested to the client that the client should seek advice from another appropriately authorised provider.
              </p>
            </div>
          </div>
        </DocSection>

        {/* ── SECTION I ── */}
        <DocSection title="Section I — Client Declarations">
          <p className="text-xs text-gray-500 italic mb-3">Please note that it is of utmost importance that you read this section carefully and understand it fully before acceptance.</p>
          <div className="border border-gray-200 rounded-lg overflow-hidden text-xs">
            {CLIENT_DECLARATIONS.map((decl, idx) => (
              <div key={idx} className={`flex gap-3 p-2.5 ${idx < CLIENT_DECLARATIONS.length - 1 ? 'border-b border-gray-100' : ''} ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'}`}>
                <span className="font-bold text-gray-400 flex-shrink-0 w-5 text-right">{idx + 1}.</span>
                <span className="text-gray-600 leading-relaxed">{decl}</span>
              </div>
            ))}
          </div>

          {/* General Comments */}
          <div className="mt-4 border border-gray-200 rounded-lg p-4 min-h-[80px]">
            <p className="text-xs font-semibold text-gray-500 mb-2">General Comments</p>
            <p className="text-sm text-gray-700"> </p>
          </div>
        </DocSection>

        {/* ── SIGNATURE BLOCK ── */}
        <div className="mt-8 grid grid-cols-2 gap-8 border-t-2 border-gray-200 pt-6">
          <div>
            <div className="border-b border-gray-400 h-12 mb-1"></div>
            <p className="text-xs font-semibold text-gray-600">Client's Signature</p>
            <div className="mt-3 border-b border-gray-300 h-8 mb-1"></div>
            <p className="text-xs text-gray-500">Client's Name</p>
            <div className="mt-3 border-b border-gray-300 h-8 mb-1"></div>
            <p className="text-xs text-gray-500">Date</p>
          </div>
          <div>
            <div className="border-b border-gray-400 h-12 mb-1"></div>
            <p className="text-xs font-semibold text-gray-600">Financial Advisor's Signature</p>
            <div className="mt-3 border-b border-gray-300 h-8 mb-1">
              <p className="text-xs text-gray-400 pt-1">{faName}</p>
            </div>
            <p className="text-xs text-gray-500">Financial Advisor's Name</p>
            <div className="mt-3 border-b border-gray-300 h-8 mb-1">
              <p className="text-xs text-gray-400 pt-1">{carData.date}</p>
            </div>
            <p className="text-xs text-gray-500">Date</p>
          </div>
        </div>

        {/* Page footer */}
        <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
          <span>{practiceName} — Investment Client Advice Record</span>
          <span>Generated {new Date().toLocaleDateString('en-ZA')}</span>
        </div>
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #car-printable, #car-printable * { visibility: visible; }
          #car-printable { position: absolute; left: 0; top: 0; width: 100%; }
          @page { margin: 15mm; }
        }
      `}</style>
    </div>
  );
}
