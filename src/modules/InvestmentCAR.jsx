/**
 * InvestmentCAR.jsx
 * Investment Client Advice Record wizard.
 * Mirrors the Fairbairn Consult "Investment Client Advice Record" PDF structure:
 *   Step 1 – Basic Info (header fields)
 *   Step 2 – Section A: Client Profile
 *   Step 3 – Section B: Needs & Goals grid
 *   Step 4 – Section C: Products Considered + Section D: Recommendation
 *   Step 5 – Section E: Implementation + Section F: Important Info
 *   Step 6 – Section G: Fees + Section H: FA Declaration
 *   Step 7 – Preview (hands off to InvestmentCARDocument)
 *
 * For every free-text field the advisor sees a "Paragraph Suggestions" panel
 * where they can click → Replace or Append pre-written paragraphs.
 */

import { useState, useCallback, useEffect } from 'react';
import { ClipboardList, User, Target, CheckCircle, Zap, CreditCard, FileText, ChevronRight, Check } from 'lucide-react';
import { getCARParagraphs, CAR_PARAGRAPHS } from '../data/investmentCARParagraphs.js';

// ─── Smart suggestion map: productType → paragraph ID in 'recommendation' ─────
const PRODUCT_PARA_MAP = {
  'Retirement Annuity':        'rec_ra',
  'Living Annuity':            'rec_living_annuity',
  'Preservation Fund':         'rec_preservation',
  'Unit Trust':                'rec_unit_trust',
  'Tax-Free Savings Account':  'rec_tfsa',
  'Endowment':                 'rec_endowment',
  'Guaranteed Life Annuity':   'rec_guaranteed_annuity',
  'Fixed Deposit':             'rec_fixed_deposit',
};

// Wrapper-aware override: Life wrapper + Unit Trust product → suggest Endowment
function getSmartSuggestion(productType, wrapper) {
  if (!productType) return null;
  let paraId = PRODUCT_PARA_MAP[productType];
  // If advisor picked "Unit Trust" product type but "Life" wrapper, they likely mean an Endowment
  if (productType === 'Unit Trust' && wrapper === 'Life (Long-term Insurance)') {
    paraId = 'rec_endowment';
  }
  if (!paraId) return null;
  return (CAR_PARAGRAPHS.recommendation || []).find(p => p.id === paraId) || null;
}

// ─── Tokens ──────────────────────────────────────────────────────────────────
function applyTokens(text, carData) {
  if (!text) return text;
  const client = carData.clientName || '[Client Name]';
  return text
    .replace(/\[Client Name\]/g, client)
    .replace(/\[Provider Name\]/g, carData.sectionC?.[0]?.company || '[Provider Name]')
    .replace(/\[Product Type\]/g, carData.sectionC?.[0]?.product || '[Product Type]');
}

// ─── Paragraph picker chip ────────────────────────────────────────────────────
function ParaChip({ para, onAppend, onReplace }) {
  return (
    <div className="group rounded-lg border border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50/40 p-3 mb-2 transition-all">
      <div className="flex items-start justify-between gap-2 mb-1">
        <p className="text-xs font-semibold text-gray-700 flex-1">{para.label}</p>
        <div className="flex gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onReplace(para.text)}
            className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded hover:bg-blue-700"
          >
            Replace
          </button>
          <button
            onClick={() => onAppend(para.text)}
            className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded hover:bg-gray-200"
          >
            Append
          </button>
        </div>
      </div>
      <p className="text-xs text-gray-500 leading-relaxed line-clamp-3">{para.text}</p>
      {para.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-1.5">
          {para.tags.map(t => (
            <span key={t} className="text-xs bg-gray-100 text-gray-400 rounded px-1.5 py-0.5">{t}</span>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Text field with paragraph panel ─────────────────────────────────────────
function TextFieldWithSuggestions({ label, hint, value, onChange, sectionKey, filterTags = [], carData, rows = 5 }) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const paragraphs = getCARParagraphs(sectionKey, filterTags);

  const handleReplace = useCallback((text) => {
    onChange(applyTokens(text, carData));
    setShowSuggestions(false);
  }, [onChange, carData]);

  const handleAppend = useCallback((text) => {
    const applied = applyTokens(text, carData);
    onChange(value ? `${value}\n\n${applied}` : applied);
    setShowSuggestions(false);
  }, [onChange, value, carData]);

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-1">
        <label className="text-sm font-semibold text-gray-700">{label}</label>
        {paragraphs.length > 0 && (
          <button
            type="button"
            onClick={() => setShowSuggestions(s => !s)}
            className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
              showSuggestions
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-blue-600 border-blue-300 hover:bg-blue-50'
            }`}
          >
            {showSuggestions ? '↑ Hide suggestions' : `✦ ${paragraphs.length} suggestions`}
          </button>
        )}
      </div>
      {hint && <p className="text-xs text-gray-400 mb-2">{hint}</p>}

      {showSuggestions && (
        <div className="mb-3 rounded-xl border border-blue-100 bg-blue-50/30 p-3 max-h-72 overflow-y-auto">
          <p className="text-xs font-semibold text-blue-700 mb-2">Click a paragraph to use it:</p>
          {paragraphs.map(para => (
            <ParaChip
              key={para.id}
              para={para}
              onReplace={handleReplace}
              onAppend={handleAppend}
            />
          ))}
        </div>
      )}

      <textarea
        rows={rows}
        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400 resize-y leading-relaxed"
        placeholder={`Enter ${label.toLowerCase()} here, or select from suggestions above…`}
        value={value || ''}
        onChange={e => onChange(e.target.value)}
      />
      {value && (
        <p className="text-xs text-gray-400 mt-1 text-right">{value.split(/\s+/).filter(Boolean).length} words</p>
      )}
    </div>
  );
}

// ─── Smart suggestion banner ──────────────────────────────────────────────────
function SmartSuggestionBanner({ productType, wrapper, onAccept, onDismiss }) {
  const suggestion = getSmartSuggestion(productType, wrapper);
  if (!suggestion) return null;

  const wrapperNote = wrapper ? ` · ${wrapper}` : '';

  return (
    <div className="mb-4 rounded-xl border-2 border-green-400 bg-green-50 p-4">
      <div className="flex items-start justify-between gap-3 mb-2 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-green-700 font-bold text-sm">✦ Smart Suggestion</span>
          <span className="text-xs bg-green-100 text-green-700 rounded-full px-2 py-0.5 font-medium">
            {suggestion.label}{wrapperNote}
          </span>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <button
            type="button"
            onClick={() => onAccept(suggestion.text)}
            className="text-xs bg-green-600 hover:bg-green-700 text-white font-semibold px-3 py-1.5 rounded-lg transition-colors"
          >
            Accept
          </button>
          <button
            type="button"
            onClick={onDismiss}
            className="text-xs text-gray-400 hover:text-gray-600 border border-gray-200 px-3 py-1.5 rounded-lg transition-colors"
          >
            Dismiss
          </button>
        </div>
      </div>
      <p className="text-xs text-green-800 leading-relaxed line-clamp-4 italic">{suggestion.text}</p>
    </div>
  );
}

// ─── Commission paragraph builder ────────────────────────────────────────────
const COMMISSION_PARA_MAP = {
  initial_ongoing: 'comm_initial_ongoing',
  initial_only:    'comm_initial_only',
  ongoing_only:    'comm_ongoing_only',
  fee_based:       'comm_fee_based',
  nil:             'comm_nil',
};

function buildCommissionParagraph(sectionG) {
  const { commissionType, upfrontPct, upfrontRand, ongoingPct, ongoingRand, vatRegistered } = sectionG;
  const paraId = COMMISSION_PARA_MAP[commissionType];
  if (!paraId) return null;
  const base = (CAR_PARAGRAPHS.commissionDisclosure || []).find(p => p.id === paraId);
  if (!base) return null;
  const vat = vatRegistered || 'incl.';
  const text = base.text
    .replace(/\[Upfront %\]/g, upfrontPct   || '[Upfront %]')
    .replace(/\[Upfront R\]/g, upfrontRand  || '[Upfront R]')
    .replace(/\[Ongoing %\]/g, ongoingPct   || '[Ongoing %]')
    .replace(/\[Ongoing R\]/g, ongoingRand  || '[Ongoing R]')
    .replace(/\[incl\.\/excl\.\]/g, vat);
  return { ...base, text };
}

function CommissionSuggestionBanner({ sectionG, onAccept, onDismiss }) {
  const suggestion = buildCommissionParagraph(sectionG);
  if (!suggestion) return null;
  return (
    <div className="mb-4 rounded-xl border-2 border-green-400 bg-green-50 p-4">
      <div className="flex items-start justify-between gap-3 mb-2 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-green-700 font-bold text-sm">✦ Suggested Commission Disclosure</span>
          <span className="text-xs bg-green-100 text-green-700 rounded-full px-2 py-0.5 font-medium">
            {suggestion.label}
          </span>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <button
            type="button"
            onClick={() => onAccept(suggestion.text)}
            className="text-xs bg-green-600 hover:bg-green-700 text-white font-semibold px-3 py-1.5 rounded-lg transition-colors"
          >
            Accept
          </button>
          <button
            type="button"
            onClick={onDismiss}
            className="text-xs text-gray-400 hover:text-gray-600 border border-gray-200 px-3 py-1.5 rounded-lg transition-colors"
          >
            Dismiss
          </button>
        </div>
      </div>
      <p className="text-xs text-green-800 leading-relaxed line-clamp-5 italic whitespace-pre-line">{suggestion.text}</p>
    </div>
  );
}

// ─── Section heading ──────────────────────────────────────────────────────────
function SectionHeading({ label, sub }) {
  return (
    <div className="bg-[#0f172a] -mx-7 -mt-7 px-8 py-4 mb-8 rounded-t-xl">
      <h3 className="text-white font-bold text-xs tracking-widest uppercase">{label}</h3>
      {sub && <p className="text-slate-400 text-xs mt-0.5">{sub}</p>}
    </div>
  );
}

// ─── Needs grid row ───────────────────────────────────────────────────────────
const ADDRESSED_OPTIONS = ['Y', 'N', 'P', 'L'];

function NeedsRow({ label, data, onChange }) {
  const set = (field, val) => onChange({ ...data, [field]: val });
  return (
    <tr className="border-b border-gray-100 hover:bg-gray-50/50">
      <td className="py-2 px-3 text-sm font-medium text-gray-700 whitespace-nowrap">{label}</td>
      <td className="py-2 px-3">
        <input
          type="text"
          placeholder="R amount"
          className="w-32 border border-gray-200 rounded-lg px-2 py-1 text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-400"
          value={data.quantified || ''}
          onChange={e => set('quantified', e.target.value)}
        />
      </td>
      <td className="py-2 px-3">
        <input
          type="text"
          placeholder="1, 2…"
          className="w-14 border border-gray-200 rounded-lg px-2 py-1 text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-400 text-center"
          value={data.priority || ''}
          onChange={e => set('priority', e.target.value)}
        />
      </td>
      <td className="py-2 px-3">
        <div className="flex gap-1">
          {ADDRESSED_OPTIONS.map(opt => (
            <button
              key={opt}
              type="button"
              onClick={() => set('addressed', data.addressed === opt ? '' : opt)}
              className={`w-7 h-7 rounded text-xs font-bold border transition-all ${
                data.addressed === opt
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-400 border-gray-200 hover:border-blue-300'
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      </td>
      <td className="py-2 px-3">
        <input
          type="text"
          placeholder="Shortfall"
          className="w-28 border border-gray-200 rounded-lg px-2 py-1 text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-400"
          value={data.shortfall || ''}
          onChange={e => set('shortfall', e.target.value)}
        />
      </td>
      <td className="py-2 px-3">
        <input
          type="text"
          placeholder="Review date"
          className="w-28 border border-gray-200 rounded-lg px-2 py-1 text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-400"
          value={data.reviewDate || ''}
          onChange={e => set('reviewDate', e.target.value)}
        />
      </td>
    </tr>
  );
}

// ─── Products considered table row ───────────────────────────────────────────
function ProductRow({ row, onChange, onRemove }) {
  const set = (field, val) => onChange({ ...row, [field]: val });
  return (
    <tr className="border-b border-gray-100">
      <td className="py-2 px-2">
        <input
          type="text"
          className="w-full border border-gray-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400"
          placeholder="e.g. Allan Gray"
          value={row.company || ''}
          onChange={e => set('company', e.target.value)}
        />
      </td>
      <td className="py-2 px-2">
        <input
          type="text"
          className="w-full border border-gray-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400"
          placeholder="e.g. Retirement Annuity"
          value={row.product || ''}
          onChange={e => set('product', e.target.value)}
        />
      </td>
      <td className="py-2 px-2">
        <input
          type="text"
          className="w-full border border-gray-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400"
          placeholder="R amount / pm"
          value={row.amount || ''}
          onChange={e => set('amount', e.target.value)}
        />
      </td>
      <td className="py-2 px-2 text-center">
        <button
          type="button"
          onClick={() => set('fundFactSheet', !row.fundFactSheet)}
          className={`w-8 h-8 rounded border text-xs font-bold transition-all ${
            row.fundFactSheet ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-400 border-gray-200 hover:border-blue-300'
          }`}
        >Y</button>
      </td>
      <td className="py-2 px-2 text-center">
        <button
          type="button"
          onClick={() => set('quoteOnFile', !row.quoteOnFile)}
          className={`w-8 h-8 rounded border text-xs font-bold transition-all ${
            row.quoteOnFile ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-400 border-gray-200 hover:border-blue-300'
          }`}
        >Y</button>
      </td>
      <td className="py-2 px-2 text-center">
        <button type="button" onClick={onRemove} className="text-red-400 hover:text-red-600 text-xs">✕</button>
      </td>
    </tr>
  );
}

// ─── Step definitions ─────────────────────────────────────────────────────────
const STEPS = [
  { id: 'basic',     label: 'Basic Info',        Icon: ClipboardList },
  { id: 'sectionA',  label: 'Client Profile',     Icon: User },
  { id: 'sectionB',  label: 'Needs & Goals',      Icon: Target },
  { id: 'sectionCD', label: 'Products & Advice',  Icon: CheckCircle },
  { id: 'sectionEF', label: 'Implementation',     Icon: Zap },
  { id: 'sectionGH', label: 'Fees & Declaration', Icon: CreditCard },
  { id: 'preview',   label: 'Preview & Print',    Icon: FileText },
];

function StepBar({ currentStep }) {
  const currentIdx = STEPS.findIndex(s => s.id === currentStep);
  const pct = Math.round((currentIdx / (STEPS.length - 1)) * 100);

  return (
    <div className="mb-12">
      <div className="flex items-center justify-between relative">
        {/* Background line */}
        <div className="absolute top-7 left-0 w-full h-[2px] bg-slate-200 -z-10" />
        {/* Progress fill */}
        <div
          className="absolute top-7 left-0 h-[2px] bg-[#2563eb] -z-10 transition-all duration-700 ease-out"
          style={{ width: `${pct}%` }}
        />
        {STEPS.map((step, i) => {
          const done   = i < currentIdx;
          const active = i === currentIdx;
          const { Icon } = step;
          return (
            <div key={step.id} className="flex flex-col items-center gap-2 bg-[#f8fafc] px-2 sm:px-4">
              <div className={`
                w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 border-2
                ${done
                  ? 'bg-[#2563eb] border-[#2563eb] shadow-lg shadow-blue-200/60'
                  : active
                  ? 'bg-white border-[#2563eb] shadow-xl shadow-blue-100/80 ring-8 ring-blue-50'
                  : 'bg-white border-slate-200 shadow-sm opacity-40'}
              `}>
                {done
                  ? <Check size={22} className="text-white" strokeWidth={2.5} />
                  : <Icon size={22} className={active ? 'text-[#2563eb]' : 'text-slate-400'} strokeWidth={1.5} />
                }
              </div>
              <span className={`
                hidden sm:block text-[10px] font-black uppercase tracking-tighter text-center leading-tight
                ${done ? 'text-[#2563eb]' : active ? 'text-[#0f172a]' : 'text-slate-400'}
              `}>{i + 1}. {step.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Empty needs row ──────────────────────────────────────────────────────────
const emptyNeed = () => ({ quantified: '', priority: '', addressed: '', shortfall: '', reviewDate: '' });

// ─── Default state ────────────────────────────────────────────────────────────
const defaultCarData = () => ({
  clientName: '',
  faName: '',
  date: new Date().toLocaleDateString('en-ZA'),
  referenceNumber: '',
  contractNumber: '',
  productType: '',
  wrapper: '',

  sectionA: {
    clientNeedsObjectives: '',
    financialSituation: '',
    riskProfile: '',
    productKnowledge: '',
    investmentHorizon: '',
    accessToCapital: '',
    otherInformation: '',
    amountToInvest: '',
    investmentFrequency: '',
  },

  sectionB: {
    // Pre-Retirement
    retirementAnnuity:    emptyNeed(),
    preservation:         emptyNeed(),
    // Post-Retirement
    livingAnnuity:        emptyNeed(),
    fixedAnnuity:         emptyNeed(),
    lifeAnnuity:          emptyNeed(),
    guaranteedIncomePlan: emptyNeed(),
    retirementIncomePlan: emptyNeed(),
    // Savings
    unitTrust:            emptyNeed(),
    taxFree:              emptyNeed(),
    endowment:            emptyNeed(),
    flexible:             emptyNeed(),
    guaranteedTerm:       emptyNeed(),
    // Other
    emergencyFund:        emptyNeed(),
    educationPolicy:      emptyNeed(),
    other:                emptyNeed(),
  },

  sectionC: [{ company: '', product: '', amount: '', fundFactSheet: false, quoteOnFile: false }],

  sectionD: { productsRecommended: '', motivation: '' },
  sectionE: { productsImplemented: '', rationale: '' },
  sectionF: { importantInfo: '' },

  sectionG: {
    upfront: '',
    ongoing: '',
    commissionType: '',
    upfrontPct: '',
    upfrontRand: '',
    ongoingPct: '',
    ongoingRand: '',
    vatRegistered: 'incl.',
    commissionDisclosure: '',
  },

  sectionH: {
    notAcceptedProducts: '',
    reasonsNotAccepted: '',
    risksExisting: '',
    consequencesExplained: '',
    focusedNeed: '',
  },
});

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function InvestmentCAR({ onComplete, advisorProfile, initialData }) {
  const [step, setStep] = useState('basic');
  const [carData, setCarData] = useState(() => initialData || defaultCarData());
  const [suggestionDismissed, setSuggestionDismissed] = useState(false);
  const [commDismissed, setCommDismissed] = useState(false);

  const update = useCallback((updates) => setCarData(prev => ({ ...prev, ...updates })), []);

  // Reset dismissal whenever product type or wrapper changes so suggestion re-appears
  useEffect(() => { setSuggestionDismissed(false); }, [carData.productType, carData.wrapper]);
  useEffect(() => { setCommDismissed(false); }, [carData.sectionG.commissionType]);

  const updateA = useCallback((updates) => setCarData(prev => ({ ...prev, sectionA: { ...prev.sectionA, ...updates } })), []);
  const updateD = useCallback((updates) => setCarData(prev => ({ ...prev, sectionD: { ...prev.sectionD, ...updates } })), []);
  const updateE = useCallback((updates) => setCarData(prev => ({ ...prev, sectionE: { ...prev.sectionE, ...updates } })), []);
  const updateF = useCallback((updates) => setCarData(prev => ({ ...prev, sectionF: { ...prev.sectionF, ...updates } })), []);
  const updateG = useCallback((updates) => setCarData(prev => ({ ...prev, sectionG: { ...prev.sectionG, ...updates } })), []);
  const updateH = useCallback((updates) => setCarData(prev => ({ ...prev, sectionH: { ...prev.sectionH, ...updates } })), []);

  const updateNeed = useCallback((needKey, value) => {
    setCarData(prev => ({ ...prev, sectionB: { ...prev.sectionB, [needKey]: value } }));
  }, []);

  const updateProductRow = useCallback((idx, value) => {
    setCarData(prev => {
      const rows = [...prev.sectionC];
      rows[idx] = value;
      return { ...prev, sectionC: rows };
    });
  }, []);

  const addProductRow = useCallback(() => {
    setCarData(prev => ({
      ...prev,
      sectionC: [...prev.sectionC, { company: '', product: '', amount: '', fundFactSheet: false, quoteOnFile: false }],
    }));
  }, []);

  const removeProductRow = useCallback((idx) => {
    setCarData(prev => ({ ...prev, sectionC: prev.sectionC.filter((_, i) => i !== idx) }));
  }, []);

  const goNext = () => {
    const idx = STEPS.findIndex(s => s.id === step);
    if (idx < STEPS.length - 1) setStep(STEPS[idx + 1].id);
  };
  const goBack = () => {
    const idx = STEPS.findIndex(s => s.id === step);
    if (idx > 0) setStep(STEPS[idx - 1].id);
  };

  const currentIdx = STEPS.findIndex(s => s.id === step);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-10">
        <h2 className="text-3xl font-black text-[#0f172a] mb-1 tracking-tight">Investment Client Advice Record</h2>
        <p className="text-slate-500 text-base">Complete the professional advice journey below.</p>
      </div>

      <StepBar currentStep={step} />

      <div key={step} className="step-enter">

      {/* ── Step: Basic Info ── */}
      {step === 'basic' && (
        <div className="bg-white rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 overflow-hidden">
          <SectionHeading label="Record Header" sub="Client and advisor identification details" />
          <div className="px-8 sm:px-10 pb-10">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-[11px] font-black uppercase text-slate-400 tracking-widest">Client Full Name *</label>
                <input
                  type="text"
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded focus:bg-white focus:border-[#2563eb] focus:ring-4 focus:ring-blue-50 outline-none transition-all placeholder:text-slate-300 font-medium text-sm text-[#0f172a]"
                  placeholder="e.g. John Smith"
                  value={carData.clientName}
                  onChange={e => update({ clientName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="block text-[11px] font-black uppercase text-slate-400 tracking-widest">Financial Advisor</label>
                <input
                  type="text"
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded focus:bg-white focus:border-[#2563eb] focus:ring-4 focus:ring-blue-50 outline-none transition-all placeholder:text-slate-300 font-medium text-sm text-[#0f172a]"
                  placeholder={advisorProfile?.advisorName || 'Advisor name'}
                  value={carData.faName}
                  onChange={e => update({ faName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="block text-[11px] font-black uppercase text-slate-400 tracking-widest">Date</label>
                <input
                  type="text"
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded focus:bg-white focus:border-[#2563eb] focus:ring-4 focus:ring-blue-50 outline-none transition-all placeholder:text-slate-300 font-medium text-sm text-[#0f172a]"
                  value={carData.date}
                  onChange={e => update({ date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="block text-[11px] font-black uppercase text-slate-400 tracking-widest">Reference Number</label>
                <input
                  type="text"
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded focus:bg-white focus:border-[#2563eb] focus:ring-4 focus:ring-blue-50 outline-none transition-all placeholder:text-slate-300 font-medium text-sm text-[#0f172a]"
                  placeholder="e.g. CAR-2026-001"
                  value={carData.referenceNumber}
                  onChange={e => update({ referenceNumber: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="block text-[11px] font-black uppercase text-slate-400 tracking-widest">Contract / Application Number</label>
                <input
                  type="text"
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded focus:bg-white focus:border-[#2563eb] focus:ring-4 focus:ring-blue-50 outline-none transition-all placeholder:text-slate-300 font-medium text-sm text-[#0f172a]"
                  placeholder="Insurer/provider contract number"
                  value={carData.contractNumber}
                  onChange={e => update({ contractNumber: e.target.value })}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Step: Section A ── */}
      {step === 'sectionA' && (
        <div className="bg-white rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 overflow-hidden">
          <SectionHeading
            label="Section A – Summary of Information obtained from the Client"
            sub="Complete each field. Click '✦ suggestions' to insert pre-written paragraphs."
          />
          <div className="px-8 sm:px-10 pb-10">

          <TextFieldWithSuggestions
            label="Client's Needs and Objectives"
            hint="What are the client's needs and what does the client wish to achieve by purchasing this financial product?"
            value={carData.sectionA.clientNeedsObjectives}
            onChange={v => updateA({ clientNeedsObjectives: v })}
            sectionKey="clientNeedsObjectives"
            carData={carData}
            rows={5}
          />

          <TextFieldWithSuggestions
            label="Financial Situation"
            hint="Set out a summary of the client's current financial situation."
            value={carData.sectionA.financialSituation}
            onChange={v => updateA({ financialSituation: v })}
            sectionKey="financialSituation"
            carData={carData}
            rows={5}
          />

          {/* Risk Profile */}
          <div className="mb-6">
            <label className="text-sm font-semibold text-gray-700 block mb-2">Risk Profile</label>
            <p className="text-xs text-gray-400 mb-3">Indicate the client's risk appetite as per the risk questionnaire.</p>
            <div className="flex flex-wrap gap-2">
              {['Conservative', 'Moderate Conservative', 'Moderate', 'Moderate Aggressive', 'Aggressive'].map(opt => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => updateA({ riskProfile: opt })}
                  className={`px-4 py-2 rounded-xl border text-sm font-medium transition-all ${
                    carData.sectionA.riskProfile === opt
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          <TextFieldWithSuggestions
            label="Product Knowledge and Experience"
            hint="Describe the client's level of knowledge and experience of the product purchased."
            value={carData.sectionA.productKnowledge}
            onChange={v => updateA({ productKnowledge: v })}
            sectionKey="productKnowledge"
            carData={carData}
            rows={4}
          />

          {/* Investment Horizon */}
          <div className="mb-6">
            <label className="text-sm font-semibold text-gray-700 block mb-2">Investment Horizon</label>
            <p className="text-xs text-gray-400 mb-3">For how long the client expects their money to be invested before they would like to cash it in?</p>
            <div className="flex flex-wrap gap-2">
              {['0–2 Years', '2–5 Years', '5–9 Years', '10 Years+'].map(opt => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => updateA({ investmentHorizon: opt })}
                  className={`px-4 py-2 rounded-xl border text-sm font-medium transition-all ${
                    carData.sectionA.investmentHorizon === opt
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          {/* Access to Capital */}
          <div className="mb-6">
            <label className="text-sm font-semibold text-gray-700 block mb-2">Access to Capital</label>
            <p className="text-xs text-gray-400 mb-3">The accessibility and liquidity of the investment.</p>
            <div className="flex flex-wrap gap-2">
              {['Need to draw an income', 'Always require access to capital', 'Do not require access to capital for 5 years'].map(opt => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => updateA({ accessToCapital: opt })}
                  className={`px-4 py-2 rounded-xl border text-sm font-medium transition-all ${
                    carData.sectionA.accessToCapital === opt
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          <TextFieldWithSuggestions
            label="Other Information"
            hint="The client's retirement age, premium increase, expected growth rate, tax considerations, specific goals etc."
            value={carData.sectionA.otherInformation}
            onChange={v => updateA({ otherInformation: v })}
            sectionKey="otherInformation"
            carData={carData}
            rows={4}
          />

          {/* Amount to invest */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-[11px] font-black uppercase text-slate-400 tracking-widest">Amount Available to be Invested</label>
              <input
                type="text"
                className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded focus:bg-white focus:border-[#2563eb] focus:ring-4 focus:ring-blue-50 outline-none transition-all placeholder:text-slate-300 font-medium text-sm text-[#0f172a]"
                placeholder="e.g. R500,000 lump sum / R5,000 p.m."
                value={carData.sectionA.amountToInvest}
                onChange={e => updateA({ amountToInvest: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="block text-[11px] font-black uppercase text-slate-400 tracking-widest">Frequency</label>
              <select
                className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded focus:bg-white focus:border-[#2563eb] focus:ring-4 focus:ring-blue-50 outline-none transition-all font-medium text-sm text-[#0f172a]"
                value={carData.sectionA.investmentFrequency}
                onChange={e => updateA({ investmentFrequency: e.target.value })}
              >
                <option value="">Select…</option>
                <option>Lump Sum</option>
                <option>Monthly</option>
                <option>Quarterly</option>
                <option>Annually</option>
                <option>Lump Sum + Monthly</option>
              </select>
            </div>
          </div>
          </div>{/* end px-8 content wrapper */}
        </div>
      )}

      {/* ── Step: Section B ── */}
      {step === 'sectionB' && (
        <div className="bg-white rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 overflow-hidden">
          <SectionHeading
            label="Section B – Needs and Goals identified"
            sub="For each need: enter the quantified amount, priority order, whether addressed (Y/N/P/L), shortfall, and review date."
          />
          <div className="px-8 sm:px-10 pb-10">
          <p className="text-xs text-gray-400 mb-4">Y = Yes (fully addressed) · N = No · P = Partially · L = Later</p>

          <div className="overflow-x-auto -mx-2">
            <table className="w-full text-sm min-w-[700px]">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="py-2 px-3 text-left text-xs font-semibold text-gray-600">Investment Need</th>
                  <th className="py-2 px-3 text-left text-xs font-semibold text-gray-600">Needs Quantified</th>
                  <th className="py-2 px-3 text-left text-xs font-semibold text-gray-600">Priority</th>
                  <th className="py-2 px-3 text-left text-xs font-semibold text-gray-600">Addressed?</th>
                  <th className="py-2 px-3 text-left text-xs font-semibold text-gray-600">Shortfall</th>
                  <th className="py-2 px-3 text-left text-xs font-semibold text-gray-600">Review Date</th>
                </tr>
              </thead>
              <tbody>
                <tr className="bg-blue-50/60"><td colSpan={6} className="py-1.5 px-3 text-xs font-bold text-blue-700 uppercase tracking-wide">Pre-Retirement</td></tr>
                <NeedsRow label="Retirement Annuity"     data={carData.sectionB.retirementAnnuity}    onChange={v => updateNeed('retirementAnnuity', v)} />
                <NeedsRow label="Preservation"           data={carData.sectionB.preservation}          onChange={v => updateNeed('preservation', v)} />

                <tr className="bg-blue-50/60"><td colSpan={6} className="py-1.5 px-3 text-xs font-bold text-blue-700 uppercase tracking-wide">Post-Retirement</td></tr>
                <NeedsRow label="Living Annuity"         data={carData.sectionB.livingAnnuity}         onChange={v => updateNeed('livingAnnuity', v)} />
                <NeedsRow label="Fixed Annuity"          data={carData.sectionB.fixedAnnuity}          onChange={v => updateNeed('fixedAnnuity', v)} />
                <NeedsRow label="Life Annuity"           data={carData.sectionB.lifeAnnuity}           onChange={v => updateNeed('lifeAnnuity', v)} />
                <NeedsRow label="Guaranteed Income Plan" data={carData.sectionB.guaranteedIncomePlan}  onChange={v => updateNeed('guaranteedIncomePlan', v)} />
                <NeedsRow label="Retirement Income Plan" data={carData.sectionB.retirementIncomePlan}  onChange={v => updateNeed('retirementIncomePlan', v)} />

                <tr className="bg-blue-50/60"><td colSpan={6} className="py-1.5 px-3 text-xs font-bold text-blue-700 uppercase tracking-wide">Savings</td></tr>
                <NeedsRow label="Unit Trust"             data={carData.sectionB.unitTrust}             onChange={v => updateNeed('unitTrust', v)} />
                <NeedsRow label="Tax Free"               data={carData.sectionB.taxFree}               onChange={v => updateNeed('taxFree', v)} />
                <NeedsRow label="Endowment"              data={carData.sectionB.endowment}             onChange={v => updateNeed('endowment', v)} />
                <NeedsRow label="Flexible"               data={carData.sectionB.flexible}              onChange={v => updateNeed('flexible', v)} />
                <NeedsRow label="Guaranteed Term"        data={carData.sectionB.guaranteedTerm}        onChange={v => updateNeed('guaranteedTerm', v)} />

                <tr className="bg-blue-50/60"><td colSpan={6} className="py-1.5 px-3 text-xs font-bold text-blue-700 uppercase tracking-wide">Other</td></tr>
                <NeedsRow label="Emergency Fund"         data={carData.sectionB.emergencyFund}         onChange={v => updateNeed('emergencyFund', v)} />
                <NeedsRow label="Education Policy"       data={carData.sectionB.educationPolicy}       onChange={v => updateNeed('educationPolicy', v)} />
                <NeedsRow label="Other"                  data={carData.sectionB.other}                 onChange={v => updateNeed('other', v)} />
              </tbody>
            </table>
          </div>
          </div>{/* end px-8 content wrapper */}
        </div>
      )}

      {/* ── Step: Sections C & D ── */}
      {step === 'sectionCD' && (
        <div className="space-y-6">

          {/* Product Type + Wrapper selector */}
          <div className="bg-white rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 overflow-hidden">
            <div className="bg-[#0f172a] px-8 py-4 rounded-t-xl">
              <h3 className="text-white font-bold text-xs tracking-widest uppercase">✦ Smart Paragraph Assistant</h3>
              <p className="text-slate-400 text-xs mt-0.5">Select product type and wrapper to get an auto-suggested paragraph</p>
            </div>
            <div className="px-8 sm:px-10 pb-8 pt-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-[11px] font-black uppercase text-slate-400 tracking-widest">Product Type</label>
                  <select
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded focus:bg-white focus:border-[#2563eb] focus:ring-4 focus:ring-blue-50 outline-none transition-all font-medium text-sm text-[#0f172a]"
                    value={carData.productType}
                    onChange={e => update({ productType: e.target.value })}
                  >
                    <option value="">Select product type…</option>
                    <option>Retirement Annuity</option>
                    <option>Living Annuity</option>
                    <option>Preservation Fund</option>
                    <option>Unit Trust</option>
                    <option>Tax-Free Savings Account</option>
                    <option>Endowment</option>
                    <option>Guaranteed Life Annuity</option>
                    <option>Fixed Deposit</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="block text-[11px] font-black uppercase text-slate-400 tracking-widest">Wrapper</label>
                  <select
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded focus:bg-white focus:border-[#2563eb] focus:ring-4 focus:ring-blue-50 outline-none transition-all font-medium text-sm text-[#0f172a]"
                    value={carData.wrapper}
                    onChange={e => update({ wrapper: e.target.value })}
                  >
                    <option value="">Select wrapper…</option>
                    <option>Life (Long-term Insurance)</option>
                    <option>Unit Trust / CIS (CISCA)</option>
                    <option>Banking / Deposit</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Section C */}
          <div className="bg-white rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 overflow-hidden">
            <SectionHeading
              label="Section C – Products Considered"
              sub="List all products for which quotes or fund fact sheets were obtained."
            />
            <div className="px-8 sm:px-10 pb-10">
              <div className="overflow-x-auto -mx-2">
                <table className="w-full text-sm min-w-[640px]">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="py-2 px-2 text-left text-xs font-semibold text-gray-600">Company / Provider</th>
                      <th className="py-2 px-2 text-left text-xs font-semibold text-gray-600">Product</th>
                      <th className="py-2 px-2 text-left text-xs font-semibold text-gray-600">Premium / Amount</th>
                      <th className="py-2 px-2 text-center text-xs font-semibold text-gray-600">Fund Fact Sheet</th>
                      <th className="py-2 px-2 text-center text-xs font-semibold text-gray-600">Quote on File</th>
                      <th className="py-2 px-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {carData.sectionC.map((row, idx) => (
                      <ProductRow
                        key={idx}
                        row={row}
                        onChange={v => updateProductRow(idx, v)}
                        onRemove={() => removeProductRow(idx)}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
              <button
                type="button"
                onClick={addProductRow}
                className="mt-3 text-xs text-blue-600 border border-blue-200 rounded-lg px-3 py-1.5 hover:bg-blue-50 transition-colors"
              >
                + Add product
              </button>
            </div>
          </div>

          {/* Section D */}
          <div className="bg-white rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 overflow-hidden">
            <SectionHeading
              label="Section D – Initial Recommendation / Advice"
              sub="Ensure all needs identified in Section B are addressed."
            />
            <div className="px-8 sm:px-10 pb-10">
              <div className="mb-4 space-y-2">
                <label className="block text-[11px] font-black uppercase text-slate-400 tracking-widest">Product / Funds Recommended</label>
                <input
                  type="text"
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded focus:bg-white focus:border-[#2563eb] focus:ring-4 focus:ring-blue-50 outline-none transition-all placeholder:text-slate-300 font-medium text-sm text-[#0f172a]"
                  placeholder="e.g. Allan Gray Retirement Annuity – Balanced Fund"
                  value={carData.sectionD.productsRecommended}
                  onChange={e => updateD({ productsRecommended: e.target.value })}
                />
              </div>
              {!suggestionDismissed && (
                <SmartSuggestionBanner
                  productType={carData.productType}
                  wrapper={carData.wrapper}
                  onAccept={text => { updateD({ motivation: applyTokens(text, carData) }); setSuggestionDismissed(true); }}
                  onDismiss={() => setSuggestionDismissed(true)}
                />
              )}
              <TextFieldWithSuggestions
                label="Motivation for Recommendation"
                hint="State why the product recommended will suit the client. Reference relevant information from Sections A and B."
                value={carData.sectionD.motivation}
                onChange={v => updateD({ motivation: v })}
                sectionKey="recommendation"
                carData={carData}
                rows={8}
              />
            </div>
          </div>
        </div>
      )}

      {/* ── Step: Sections E & F ── */}
      {step === 'sectionEF' && (
        <div className="space-y-6">
          {/* Section E */}
          <div className="bg-white rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 overflow-hidden">
            <SectionHeading
              label="Section E – Implementation Motivation"
              sub="Explain what was finally implemented and the reasons thereof."
            />
            <div className="px-8 sm:px-10 pb-10">
              <div className="mb-4 space-y-2">
                <label className="block text-[11px] font-black uppercase text-slate-400 tracking-widest">Product / Funds Implemented</label>
                <input
                  type="text"
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded focus:bg-white focus:border-[#2563eb] focus:ring-4 focus:ring-blue-50 outline-none transition-all placeholder:text-slate-300 font-medium text-sm text-[#0f172a]"
                  placeholder="e.g. Allan Gray RA – Balanced Fund, R5,000 p.m."
                  value={carData.sectionE.productsImplemented}
                  onChange={e => updateE({ productsImplemented: e.target.value })}
                />
              </div>
              <TextFieldWithSuggestions
                label="Rationale for Product(s) Selected"
                hint="State what was purchased, contribution pattern, and whether the need was fully or partially implemented. Where the client deviated from the recommendation, document this and the risks discussed."
                value={carData.sectionE.rationale}
                onChange={v => updateE({ rationale: v })}
                sectionKey="implementation"
                carData={carData}
                rows={6}
              />
            </div>
          </div>

          {/* Section F */}
          <div className="bg-white rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 overflow-hidden">
            <SectionHeading
              label="Section F – Important Information highlighted to Client"
              sub="e.g. Tax implications, liquidity, legislative restrictions, consequences of replacement, investment term, etc."
            />
            <div className="px-8 sm:px-10 pb-10">
              <TextFieldWithSuggestions
                label="Important Information"
                hint="Document all material information disclosed to the client."
                value={carData.sectionF.importantInfo}
                onChange={v => updateF({ importantInfo: v })}
                sectionKey="importantInfo"
                carData={carData}
                rows={10}
              />
            </div>
          </div>
        </div>
      )}

      {/* ── Step: Sections G & H ── */}
      {step === 'sectionGH' && (
        <div className="space-y-6">
          {/* Section G */}
          <div className="bg-white rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 overflow-hidden">
            <SectionHeading
              label="Section G – Fees & Commission Disclosure"
              sub="Disclosure of fees to the client in monetary value. Include all fees, charges, and advisor commission."
            />
            <div className="px-8 sm:px-10 pb-10">
              {/* ── Fee summary boxes ── */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
                <div className="space-y-2">
                  <label className="block text-[11px] font-black uppercase text-slate-400 tracking-widest">Upfront Fees (summary)</label>
                  <textarea
                    rows={4}
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded focus:bg-white focus:border-[#2563eb] focus:ring-4 focus:ring-blue-50 outline-none transition-all placeholder:text-slate-300 font-medium text-sm text-[#0f172a] resize-y"
                    placeholder="e.g. Advisor initial fee: 1% = R5,000 (incl. VAT)&#10;Product upfront charge: Nil"
                    value={carData.sectionG.upfront}
                    onChange={e => updateG({ upfront: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-[11px] font-black uppercase text-slate-400 tracking-widest">Ongoing Fees (p.a. summary)</label>
                  <textarea
                    rows={4}
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded focus:bg-white focus:border-[#2563eb] focus:ring-4 focus:ring-blue-50 outline-none transition-all placeholder:text-slate-300 font-medium text-sm text-[#0f172a] resize-y"
                    placeholder="e.g. Platform: 0.50% = R2,500&#10;TER: 0.85%&#10;Advisor: 0.575% = R2,875&#10;EAC: 1.93%"
                    value={carData.sectionG.ongoing}
                    onChange={e => updateG({ ongoing: e.target.value })}
                  />
                </div>
              </div>

              {/* ── Commission disclosure builder ── */}
              <div className="border-t border-gray-100 pt-5">
                <p className="text-sm font-bold text-gray-700 mb-3">Commission Disclosure Paragraph</p>
                <p className="text-xs text-gray-400 mb-4">Select the commission structure, enter the amounts, and a compliant client-acceptance paragraph will be proposed for you.</p>

                {/* Commission type */}
                <div className="mb-4">
                  <label className="block text-[11px] font-black uppercase text-slate-400 tracking-widest mb-2">Commission / Fee Type</label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { id: 'initial_ongoing', label: 'Initial + Ongoing' },
                      { id: 'initial_only',    label: 'Initial only' },
                      { id: 'ongoing_only',    label: 'Ongoing only' },
                      { id: 'fee_based',       label: 'Fee for service' },
                      { id: 'nil',             label: 'No commission' },
                    ].map(opt => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => updateG({ commissionType: opt.id })}
                        className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-all ${
                          carData.sectionG.commissionType === opt.id
                            ? 'bg-[#2563eb] text-white border-[#2563eb]'
                            : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Amount fields — only show when relevant */}
                {['initial_ongoing', 'initial_only', 'fee_based'].includes(carData.sectionG.commissionType) && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                    <div className="space-y-2">
                      <label className="block text-[11px] font-black uppercase text-slate-400 tracking-widest">Upfront %</label>
                      <input
                        type="text"
                        className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded focus:bg-white focus:border-[#2563eb] focus:ring-4 focus:ring-blue-50 outline-none transition-all placeholder:text-slate-300 font-medium text-sm text-[#0f172a]"
                        placeholder="e.g. 1.00"
                        value={carData.sectionG.upfrontPct}
                        onChange={e => updateG({ upfrontPct: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-[11px] font-black uppercase text-slate-400 tracking-widest">Upfront R</label>
                      <input
                        type="text"
                        className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded focus:bg-white focus:border-[#2563eb] focus:ring-4 focus:ring-blue-50 outline-none transition-all placeholder:text-slate-300 font-medium text-sm text-[#0f172a]"
                        placeholder="e.g. 5,000"
                        value={carData.sectionG.upfrontRand}
                        onChange={e => updateG({ upfrontRand: e.target.value })}
                      />
                    </div>
                  </div>
                )}

                {['initial_ongoing', 'ongoing_only'].includes(carData.sectionG.commissionType) && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                    <div className="space-y-2">
                      <label className="block text-[11px] font-black uppercase text-slate-400 tracking-widest">Ongoing % p.a.</label>
                      <input
                        type="text"
                        className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded focus:bg-white focus:border-[#2563eb] focus:ring-4 focus:ring-blue-50 outline-none transition-all placeholder:text-slate-300 font-medium text-sm text-[#0f172a]"
                        placeholder="e.g. 0.575"
                        value={carData.sectionG.ongoingPct}
                        onChange={e => updateG({ ongoingPct: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-[11px] font-black uppercase text-slate-400 tracking-widest">Ongoing R p.a.</label>
                      <input
                        type="text"
                        className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded focus:bg-white focus:border-[#2563eb] focus:ring-4 focus:ring-blue-50 outline-none transition-all placeholder:text-slate-300 font-medium text-sm text-[#0f172a]"
                        placeholder="e.g. 2,875"
                        value={carData.sectionG.ongoingRand}
                        onChange={e => updateG({ ongoingRand: e.target.value })}
                      />
                    </div>
                  </div>
                )}

                {carData.sectionG.commissionType && carData.sectionG.commissionType !== 'nil' && (
                  <div className="mb-4">
                    <label className="block text-[11px] font-black uppercase text-slate-400 tracking-widest mb-2">VAT</label>
                    <div className="flex gap-2">
                      {['incl.', 'excl.'].map(v => (
                        <button
                          key={v}
                          type="button"
                          onClick={() => updateG({ vatRegistered: v })}
                          className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-all ${
                            carData.sectionG.vatRegistered === v
                              ? 'bg-[#2563eb] text-white border-[#2563eb]'
                              : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
                          }`}
                        >
                          {v} VAT
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Green suggestion banner */}
                {!commDismissed && carData.sectionG.commissionType && (
                  <CommissionSuggestionBanner
                    sectionG={carData.sectionG}
                    onAccept={text => { updateG({ commissionDisclosure: text }); setCommDismissed(true); }}
                    onDismiss={() => setCommDismissed(true)}
                  />
                )}

                {/* Commission disclosure text area */}
                <TextFieldWithSuggestions
                  label="Commission Disclosure & Client Acceptance"
                  hint="This paragraph will appear in the printed CAR. Edit as needed."
                  value={carData.sectionG.commissionDisclosure}
                  onChange={v => updateG({ commissionDisclosure: v })}
                  sectionKey="commissionDisclosure"
                  carData={carData}
                  rows={10}
                />
              </div>
            </div>
          </div>

          {/* Section H */}
          <div className="bg-white rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 overflow-hidden">
            <SectionHeading
              label="Section H – Financial Advisor's Declaration"
              sub="Complete where applicable. Leave blank if not relevant."
            />
            <div className="px-8 sm:px-10 pb-10">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="block text-[11px] font-black uppercase text-slate-400 tracking-widest">1. Products the client elected NOT to accept:</label>
                  <input
                    type="text"
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded focus:bg-white focus:border-[#2563eb] focus:ring-4 focus:ring-blue-50 outline-none transition-all placeholder:text-slate-300 font-medium text-sm text-[#0f172a]"
                    placeholder="Leave blank if all recommendations were accepted"
                    value={carData.sectionH.notAcceptedProducts}
                    onChange={e => updateH({ notAcceptedProducts: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-[11px] font-black uppercase text-slate-400 tracking-widest">2. Reasons the client elected not to accept:</label>
                  <input
                    type="text"
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded focus:bg-white focus:border-[#2563eb] focus:ring-4 focus:ring-blue-50 outline-none transition-all placeholder:text-slate-300 font-medium text-sm text-[#0f172a]"
                    placeholder="e.g. Client preferred a lower monthly commitment"
                    value={carData.sectionH.reasonsNotAccepted}
                    onChange={e => updateH({ reasonsNotAccepted: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-[11px] font-black uppercase text-slate-400 tracking-widest">3. Risks to the client for not concluding the recommended transaction:</label>
                  <input
                    type="text"
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded focus:bg-white focus:border-[#2563eb] focus:ring-4 focus:ring-blue-50 outline-none transition-all placeholder:text-slate-300 font-medium text-sm text-[#0f172a]"
                    placeholder="e.g. Underinsurance; retirement income shortfall"
                    value={carData.sectionH.risksExisting}
                    onChange={e => updateH({ risksExisting: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-black uppercase text-slate-400 tracking-widest mb-2">4. Consequences thereof clearly explained to client?</label>
                  <div className="flex gap-3 mt-1">
                    {['Yes', 'No', 'N/A'].map(opt => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => updateH({ consequencesExplained: opt })}
                        className={`px-4 py-1.5 rounded-xl border text-sm font-medium transition-all ${
                          carData.sectionH.consequencesExplained === opt
                            ? 'bg-[#2563eb] text-white border-[#2563eb]'
                            : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="block text-[11px] font-black uppercase text-slate-400 tracking-widest">5. Where only a focused need is addressed — details discussed and agreed:</label>
                  <input
                    type="text"
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded focus:bg-white focus:border-[#2563eb] focus:ring-4 focus:ring-blue-50 outline-none transition-all placeholder:text-slate-300 font-medium text-sm text-[#0f172a]"
                    placeholder="Leave blank if a full financial needs analysis was conducted"
                    value={carData.sectionH.focusedNeed}
                    onChange={e => updateH({ focusedNeed: e.target.value })}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Step: Preview ── */}
      {step === 'preview' && (
        <div className="bg-white rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 overflow-hidden">
          <div className="bg-[#0f172a] px-10 py-4">
            <h3 className="text-white font-bold text-xs tracking-widest uppercase">Ready to Generate</h3>
          </div>
          <div className="p-10 sm:p-14 text-center">
            <div className="w-16 h-16 rounded-xl bg-blue-50 flex items-center justify-center mx-auto mb-5">
              <FileText size={30} className="text-[#2563eb]" strokeWidth={1.5} />
            </div>
            <h3 className="text-2xl font-black text-[#0f172a] mb-2">Ready to generate the advice record</h3>
            <p className="text-slate-500 mb-8 max-w-sm mx-auto leading-relaxed">All sections complete. Generate the full Investment Client Advice Record — ready to print and sign.</p>
            <button
              onClick={() => onComplete(carData)}
              className="bg-[#2563eb] text-white rounded px-10 py-4 font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 active:scale-95 inline-flex items-center gap-2"
            >
              Generate Advice Record <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}

      </div>{/* end step-enter wrapper */}

      {/* ── Navigation ── */}
      <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-100">
        <button
          type="button"
          onClick={goBack}
          disabled={currentIdx === 0}
          className="text-sm font-bold text-slate-500 hover:text-[#0f172a] border border-slate-200 bg-white rounded px-6 py-3 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          ← Back
        </button>
        <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">
          Step {currentIdx + 1} of {STEPS.length}
        </span>
        {step !== 'preview' && (
          <button
            type="button"
            onClick={goNext}
            className="bg-[#2563eb] text-white rounded px-8 py-3 text-sm font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 active:scale-95 flex items-center gap-2"
          >
            Save & Continue <ChevronRight size={16} />
          </button>
        )}
        {step === 'preview' && <div />}
      </div>
    </div>
  );
}
