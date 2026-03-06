/**
 * ClientProfile.jsx — Investment ROA Builder v3
 *
 * Captures all client information required for a FAIS-compliant ROA:
 *   - Personal details (name, ID, contact, tax number)
 *   - Financial position (income, assets, liabilities, dependants)
 *   - Risk profile (questionnaire → score → category)
 *   - Investment needs and objectives
 *   - Existing policies / products (for replacement disclosure)
 *   - Contract / application number (optional at drafting, mandatory at implementation)
 *
 * Props:
 *   initialData   {object}  — existing profile data to restore
 *   onChange      {fn}      — called on every change with updated profile object
 *   onComplete    {fn}      — called when advisor marks profile complete
 *   readOnly      {bool}    — disable all fields (for ROA preview)
 */

import { useState, useCallback, useEffect } from 'react';
import {
  isRequired,
  isValidEmail,
  isValidPhone,
  formatDate,
  todayISO,
  RISK_PROFILES,
  getRiskProfile,
  uid,
} from '../shared/ui.js';

// ── Risk questionnaire ─────────────────────────────────────────────────────
const RISK_QUESTIONS = [
  {
    id: 'horizon',
    question: 'What is the client\'s primary investment time horizon?',
    options: [
      { label: 'Less than 2 years', score: 1 },
      { label: '2–5 years',         score: 2 },
      { label: '5–10 years',        score: 3 },
      { label: '10–20 years',       score: 4 },
      { label: 'More than 20 years',score: 5 },
    ],
  },
  {
    id: 'reaction',
    question: 'If the client\'s portfolio dropped 20% in one year, they would:',
    options: [
      { label: 'Sell everything — cannot tolerate losses',           score: 1 },
      { label: 'Sell some and move to safer investments',            score: 2 },
      { label: 'Hold — understand markets recover over time',        score: 3 },
      { label: 'Hold and consider rebalancing if appropriate',       score: 4 },
      { label: 'Buy more — a 20% fall is a buying opportunity',      score: 5 },
    ],
  },
  {
    id: 'objective',
    question: 'The client\'s primary investment objective is:',
    options: [
      { label: 'Preserve capital — no risk of loss',               score: 1 },
      { label: 'Generate income with minimal capital risk',         score: 2 },
      { label: 'Balance income and growth',                         score: 3 },
      { label: 'Grow capital — willing to accept some volatility',  score: 4 },
      { label: 'Maximise long-term growth — comfortable with high volatility', score: 5 },
    ],
  },
  {
    id: 'knowledge',
    question: 'The client\'s investment knowledge and experience:',
    options: [
      { label: 'None — first time investing',                 score: 1 },
      { label: 'Limited — mainly savings accounts',           score: 2 },
      { label: 'Moderate — some unit trust / RA experience',  score: 3 },
      { label: 'Good — understands asset classes and risk',   score: 4 },
      { label: 'Sophisticated — experienced across markets',  score: 5 },
    ],
  },
  {
    id: 'liquidity',
    question: 'If the client urgently needed funds, they could:',
    options: [
      { label: 'Not afford any reduction in this investment',             score: 1 },
      { label: 'Manage for up to 6 months before needing access',        score: 2 },
      { label: 'Manage for 1–3 years — have other liquid assets',        score: 3 },
      { label: 'Manage for 3–5 years comfortably',                       score: 4 },
      { label: 'Never need to access this investment — fully committed',  score: 5 },
    ],
  },
];

const scoreToProfile = (avg) => {
  if (avg <= 1.4) return 'conservative';
  if (avg <= 2.4) return 'moderate';
  if (avg <= 3.4) return 'moderate_growth';
  if (avg <= 4.4) return 'growth';
  return 'aggressive';
};

// ── Section wrapper ────────────────────────────────────────────────────────
function Section({ title, icon, children, complete }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-4">
      <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 bg-gray-50">
        <div className="flex items-center gap-2">
          <span className="text-base">{icon}</span>
          <h3 className="font-semibold text-sm text-gray-700">{title}</h3>
        </div>
        {complete !== undefined && (
          <span className={`text-xs font-semibold rounded-full px-2 py-0.5 ${complete ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
            {complete ? '✓ Complete' : 'Incomplete'}
          </span>
        )}
      </div>
      <div className="px-5 py-4">{children}</div>
    </div>
  );
}

// ── Field group ────────────────────────────────────────────────────────────
function FieldRow({ children }) {
  return <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">{children}</div>;
}

// ── Text input ─────────────────────────────────────────────────────────────
function Field({ label, value, onChange, type = 'text', placeholder = '', required = false, error, hint, readOnly }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1">
        {label}{required && <span className="text-red-400 ml-1">*</span>}
      </label>
      <input
        type={type}
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={readOnly}
        className={`w-full text-sm border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-colors
          ${error ? 'border-red-300 bg-red-50' : 'border-gray-200'}
          ${readOnly ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : 'bg-white'}`}
      />
      {error && <p className="text-xs text-red-500 mt-0.5">{error}</p>}
      {hint && !error && <p className="text-xs text-gray-400 mt-0.5">{hint}</p>}
    </div>
  );
}

// ── Select ────────────────────────────────────────────────────────────────
function Select({ label, value, onChange, options, required, readOnly }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1">
        {label}{required && <span className="text-red-400 ml-1">*</span>}
      </label>
      <select
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        disabled={readOnly}
        className={`w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400
          ${readOnly ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : ''}`}
      >
        <option value="">— Select —</option>
        {options.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}

// ── Textarea ───────────────────────────────────────────────────────────────
function Textarea({ label, value, onChange, placeholder, rows = 3, hint, readOnly }) {
  return (
    <div className="col-span-2">
      <label className="block text-xs font-semibold text-gray-600 mb-1">{label}</label>
      <textarea
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        disabled={readOnly}
        className={`w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none
          ${readOnly ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : 'bg-white'}`}
      />
      {hint && <p className="text-xs text-gray-400 mt-0.5">{hint}</p>}
    </div>
  );
}

// ── Risk questionnaire sub-component ──────────────────────────────────────
function RiskQuestionnaire({ answers, onChange, readOnly }) {
  const totalScore = Object.values(answers).reduce((sum, v) => sum + (v || 0), 0);
  const avgScore   = Object.keys(answers).length ? totalScore / RISK_QUESTIONS.length : 0;
  const profile    = avgScore > 0 ? getRiskProfile(scoreToProfile(avgScore)) : null;
  const answered   = Object.values(answers).filter(Boolean).length;

  return (
    <div>
      {RISK_QUESTIONS.map((q, qi) => (
        <div key={q.id} className="mb-5">
          <p className="text-sm font-semibold text-gray-700 mb-2">{qi + 1}. {q.question}</p>
          <div className="space-y-1.5">
            {q.options.map((opt, oi) => {
              const selected = answers[q.id] === opt.score;
              return (
                <button
                  key={oi}
                  onClick={() => !readOnly && onChange({ ...answers, [q.id]: opt.score })}
                  disabled={readOnly}
                  className={`w-full text-left flex items-center gap-3 px-3 py-2 rounded-lg border text-sm transition-all
                    ${selected
                      ? 'border-blue-400 bg-blue-50 text-blue-800'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-600'}
                    ${readOnly ? 'cursor-not-allowed opacity-75' : 'cursor-pointer'}`}
                >
                  <span className={`flex-shrink-0 w-4 h-4 rounded-full border-2 flex items-center justify-center
                    ${selected ? 'border-blue-500 bg-blue-500' : 'border-gray-300'}`}>
                    {selected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </span>
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {/* Result */}
      {answered === RISK_QUESTIONS.length && profile && (
        <div className={`mt-4 rounded-xl p-4 ${profile.colour}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold opacity-70 uppercase tracking-wider">Risk Profile Result</p>
              <p className="text-lg font-bold mt-0.5">{profile.label}</p>
            </div>
            <div className="text-right">
              <p className="text-xs opacity-70">Average score</p>
              <p className="text-2xl font-bold">{avgScore.toFixed(1)}</p>
            </div>
          </div>
        </div>
      )}

      {answered < RISK_QUESTIONS.length && (
        <p className="text-xs text-gray-400 mt-2">{answered}/{RISK_QUESTIONS.length} questions answered</p>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════════════════════

const EMPTY_PROFILE = {
  // Personal
  firstNames:         '',
  surname:            '',
  idNumber:           '',
  dateOfBirth:        '',
  taxNumber:          '',
  email:              '',
  phone:              '',
  address:            '',
  // Financial
  employmentStatus:   '',
  grossMonthlyIncome: '',
  netMonthlyIncome:   '',
  totalAssets:        '',
  totalLiabilities:   '',
  dependants:         '',
  // Needs
  investmentAmount:   '',
  investmentFrequency:'lump',
  monthlyAmount:      '',
  investmentObjective:'',
  investmentHorizon:  '',
  liquidityNeeds:     '',
  // Risk
  riskAnswers:        {},
  riskProfileOverride:'',
  riskNotes:          '',
  // Existing products
  existingProducts:   [],
  replacingProduct:   'no',
  replacementReason:  '',
  // Contract
  contractNumber:     '',
  applicationDate:    todayISO(),
  // Meta
  meetingDate:        todayISO(),
  advisorNotes:       '',
  profileComplete:    false,
};

export default function ClientProfile({ initialData = {}, onChange, onComplete, readOnly = false }) {

  const [profile, setProfile] = useState({ ...EMPTY_PROFILE, ...initialData });
  const [errors,  setErrors]  = useState({});
  const [activeSection, setActiveSection] = useState('personal');

  // Propagate changes upward
  useEffect(() => {
    if (onChange) onChange(profile);
  }, [profile]); // eslint-disable-line

  const set = useCallback((field, value) => {
    setProfile(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => { const e = { ...prev }; delete e[field]; return e; });
  }, [errors]);

  // ── Derived risk profile ──
  const riskAnswers    = profile.riskAnswers || {};
  const answeredCount  = Object.values(riskAnswers).filter(Boolean).length;
  const avgRisk        = answeredCount === RISK_QUESTIONS.length
    ? Object.values(riskAnswers).reduce((s, v) => s + v, 0) / RISK_QUESTIONS.length
    : 0;
  const computedProfile = avgRisk > 0 ? scoreToProfile(avgRisk) : '';
  const effectiveProfile = profile.riskProfileOverride || computedProfile;

  // ── Validate ──
  const validate = () => {
    const e = {};
    if (!isRequired(profile.firstNames))   e.firstNames   = 'First name is required';
    if (!isRequired(profile.surname))      e.surname      = 'Surname is required';
    if (!isRequired(profile.idNumber))     e.idNumber     = 'ID number is required';
    if (profile.email && !isValidEmail(profile.email)) e.email = 'Invalid email address';
    if (profile.phone && !isValidPhone(profile.phone)) e.phone = 'Invalid phone number';
    if (!isRequired(profile.investmentAmount)) e.investmentAmount = 'Investment amount is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleComplete = () => {
    if (validate()) {
      const completed = { ...profile, profileComplete: true, riskProfileComputed: computedProfile, riskProfileEffective: effectiveProfile };
      setProfile(completed);
      if (onComplete) onComplete(completed);
    }
  };

  // ── Existing products list ──
  const addExistingProduct = () => {
    set('existingProducts', [...(profile.existingProducts || []), {
      id: uid(), provider: '', product: '', policyNumber: '', value: '', inceptionDate: '',
    }]);
  };

  const updateExistingProduct = (id, field, value) => {
    set('existingProducts', (profile.existingProducts || []).map(p =>
      p.id === id ? { ...p, [field]: value } : p
    ));
  };

  const removeExistingProduct = (id) => {
    set('existingProducts', (profile.existingProducts || []).filter(p => p.id !== id));
  };

  // ── Section completion flags ──
  const personalComplete = isRequired(profile.firstNames) && isRequired(profile.surname) && isRequired(profile.idNumber);
  const financialComplete = isRequired(profile.investmentAmount);
  const riskComplete = answeredCount === RISK_QUESTIONS.length;

  return (
    <div className="max-w-3xl mx-auto">

      {/* Section tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6 overflow-x-auto">
        {[
          { id: 'personal',   label: 'Personal',   icon: '👤', done: personalComplete },
          { id: 'financial',  label: 'Financial',  icon: '💵', done: financialComplete },
          { id: 'risk',       label: 'Risk Profile',icon: '📊', done: riskComplete },
          { id: 'existing',   label: 'Existing',   icon: '📋', done: true },
          { id: 'contract',   label: 'Contract',   icon: '📌', done: !!profile.contractNumber },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveSection(tab.id)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex-shrink-0
              ${activeSection === tab.id ? 'bg-white shadow-sm text-blue-700' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
            {tab.done && <span className="w-2 h-2 rounded-full bg-green-400 flex-shrink-0" />}
          </button>
        ))}
      </div>

      {/* ── PERSONAL DETAILS ── */}
      {activeSection === 'personal' && (
        <Section title="Personal Details" icon="👤" complete={personalComplete}>
          <FieldRow>
            <Field label="First Names" value={profile.firstNames} onChange={v => set('firstNames', v)}
              required error={errors.firstNames} readOnly={readOnly} />
            <Field label="Surname" value={profile.surname} onChange={v => set('surname', v)}
              required error={errors.surname} readOnly={readOnly} />
          </FieldRow>
          <FieldRow>
            <Field label="SA ID Number" value={profile.idNumber} onChange={v => set('idNumber', v)}
              required error={errors.idNumber} placeholder="8001015009087" readOnly={readOnly} />
            <Field label="Date of Birth" value={profile.dateOfBirth} onChange={v => set('dateOfBirth', v)}
              type="date" readOnly={readOnly} />
          </FieldRow>
          <FieldRow>
            <Field label="Tax Reference Number" value={profile.taxNumber} onChange={v => set('taxNumber', v)}
              placeholder="1234567890" readOnly={readOnly} />
            <Field label="Email Address" value={profile.email} onChange={v => set('email', v)}
              type="email" error={errors.email} readOnly={readOnly} />
          </FieldRow>
          <FieldRow>
            <Field label="Phone Number" value={profile.phone} onChange={v => set('phone', v)}
              type="tel" error={errors.phone} placeholder="082 123 4567" readOnly={readOnly} />
            <Select label="Employment Status" value={profile.employmentStatus} onChange={v => set('employmentStatus', v)}
              options={[
                { value: 'employed',   label: 'Employed' },
                { value: 'self',       label: 'Self-employed' },
                { value: 'retired',    label: 'Retired' },
                { value: 'unemployed', label: 'Not employed' },
              ]} readOnly={readOnly} />
          </FieldRow>
          <FieldRow>
            <Textarea label="Residential Address" value={profile.address} onChange={v => set('address', v)}
              placeholder="Street, City, Province, Code" rows={2} readOnly={readOnly} />
          </FieldRow>
          <FieldRow>
            <Field label="Meeting Date" value={profile.meetingDate} onChange={v => set('meetingDate', v)}
              type="date" readOnly={readOnly} />
          </FieldRow>
        </Section>
      )}

      {/* ── FINANCIAL DETAILS ── */}
      {activeSection === 'financial' && (
        <Section title="Financial Position" icon="💵" complete={financialComplete}>
          <p className="text-xs text-gray-500 mb-4">All amounts in South African Rand. Required for FAIS needs analysis.</p>
          <FieldRow>
            <Field label="Gross Monthly Income (R)" value={profile.grossMonthlyIncome} onChange={v => set('grossMonthlyIncome', v)}
              type="number" placeholder="0" readOnly={readOnly} />
            <Field label="Net Monthly Income (R)" value={profile.netMonthlyIncome} onChange={v => set('netMonthlyIncome', v)}
              type="number" placeholder="0" readOnly={readOnly} />
          </FieldRow>
          <FieldRow>
            <Field label="Total Assets (R)" value={profile.totalAssets} onChange={v => set('totalAssets', v)}
              type="number" placeholder="0" readOnly={readOnly} />
            <Field label="Total Liabilities (R)" value={profile.totalLiabilities} onChange={v => set('totalLiabilities', v)}
              type="number" placeholder="0" readOnly={readOnly} />
          </FieldRow>
          <FieldRow>
            <Field label="Number of Dependants" value={profile.dependants} onChange={v => set('dependants', v)}
              type="number" placeholder="0" readOnly={readOnly} />
          </FieldRow>

          <div className="border-t border-gray-100 pt-4 mt-2">
            <p className="text-xs font-semibold text-gray-600 mb-3 uppercase tracking-wider">Investment Details</p>
            <FieldRow>
              <Field label="Lump Sum Investment Amount (R)" value={profile.investmentAmount} onChange={v => set('investmentAmount', v)}
                type="number" required error={errors.investmentAmount} placeholder="0" readOnly={readOnly} />
              <Field label="Monthly Contribution (R)" value={profile.monthlyAmount} onChange={v => set('monthlyAmount', v)}
                type="number" placeholder="0" hint="Leave blank if lump sum only" readOnly={readOnly} />
            </FieldRow>
            <FieldRow>
              <Field label="Investment Time Horizon" value={profile.investmentHorizon} onChange={v => set('investmentHorizon', v)}
                placeholder="e.g. 10 years" readOnly={readOnly} />
              <Select label="Liquidity Requirement" value={profile.liquidityNeeds} onChange={v => set('liquidityNeeds', v)}
                options={[
                  { value: 'none',    label: 'None — can lock away completely' },
                  { value: 'low',     label: 'Low — may need access in 5+ years' },
                  { value: 'medium',  label: 'Medium — may need access in 2–5 years' },
                  { value: 'high',    label: 'High — may need access within 2 years' },
                ]} readOnly={readOnly} />
            </FieldRow>
            <FieldRow>
              <Textarea label="Investment Objective (in client's own words)" value={profile.investmentObjective}
                onChange={v => set('investmentObjective', v)}
                placeholder="e.g. Saving for retirement in 15 years. Want growth but nervous about large short-term losses."
                rows={3} readOnly={readOnly} />
            </FieldRow>
          </div>
        </Section>
      )}

      {/* ── RISK PROFILE ── */}
      {activeSection === 'risk' && (
        <Section title="Risk Profile Assessment" icon="📊" complete={riskComplete}>
          <p className="text-xs text-gray-500 mb-5">
            Complete the questionnaire below. The risk profile is computed automatically.
            The advisor may override the computed result if appropriate, with written justification.
          </p>
          <RiskQuestionnaire
            answers={profile.riskAnswers}
            onChange={v => set('riskAnswers', v)}
            readOnly={readOnly}
          />

          {riskComplete && (
            <div className="mt-6 pt-4 border-t border-gray-100">
              <FieldRow>
                <Select
                  label="Override Risk Profile (if different from questionnaire result)"
                  value={profile.riskProfileOverride}
                  onChange={v => set('riskProfileOverride', v)}
                  options={RISK_PROFILES.map(r => ({ value: r.value, label: r.label }))}
                  readOnly={readOnly}
                />
              </FieldRow>
              {profile.riskProfileOverride && (
                <FieldRow>
                  <Textarea label="Override Justification (required if overriding)" value={profile.riskNotes}
                    onChange={v => set('riskNotes', v)}
                    placeholder="State reasons for overriding the questionnaire result..."
                    rows={2} readOnly={readOnly} />
                </FieldRow>
              )}
              <div className="text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2">
                <strong>Effective risk profile: </strong>
                <span className="font-semibold text-gray-700">{getRiskProfile(effectiveProfile)?.label || '—'}</span>
                {profile.riskProfileOverride && <span className="text-amber-600 ml-2">(Manual override)</span>}
              </div>
            </div>
          )}
        </Section>
      )}

      {/* ── EXISTING PRODUCTS ── */}
      {activeSection === 'existing' && (
        <Section title="Existing Financial Products" icon="📋">
          <p className="text-xs text-gray-500 mb-4">
            Record all existing relevant financial products. Required for replacement disclosure under FAIS.
          </p>

          {(profile.existingProducts || []).map((prod, i) => (
            <div key={prod.id} className="bg-gray-50 rounded-lg p-4 mb-3 border border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-gray-600">Product {i + 1}</p>
                {!readOnly && (
                  <button onClick={() => removeExistingProduct(prod.id)}
                    className="text-xs text-red-400 hover:text-red-600 transition-colors">Remove</button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Provider" value={prod.provider}
                  onChange={v => updateExistingProduct(prod.id, 'provider', v)} readOnly={readOnly} />
                <Field label="Product Type" value={prod.product}
                  onChange={v => updateExistingProduct(prod.id, 'product', v)} readOnly={readOnly} />
                <Field label="Policy / Account Number" value={prod.policyNumber}
                  onChange={v => updateExistingProduct(prod.id, 'policyNumber', v)} readOnly={readOnly} />
                <Field label="Current Value (R)" value={prod.value} type="number"
                  onChange={v => updateExistingProduct(prod.id, 'value', v)} readOnly={readOnly} />
              </div>
            </div>
          ))}

          {!readOnly && (
            <button onClick={addExistingProduct}
              className="w-full border-2 border-dashed border-gray-300 rounded-lg py-3 text-sm text-gray-500 hover:border-blue-300 hover:text-blue-500 transition-colors">
              + Add existing product
            </button>
          )}

          <div className="mt-5 pt-4 border-t border-gray-100">
            <p className="text-xs font-semibold text-gray-600 mb-3">Product Replacement</p>
            <div className="flex gap-3 mb-3">
              {['no', 'yes'].map(v => (
                <button key={v} onClick={() => !readOnly && set('replacingProduct', v)}
                  className={`flex-1 py-2 rounded-lg border text-sm font-semibold transition-all
                    ${profile.replacingProduct === v ? 'border-blue-400 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
                  {v === 'no' ? 'Not a replacement' : 'Replacement of existing product'}
                </button>
              ))}
            </div>
            {profile.replacingProduct === 'yes' && (
              <FieldRow>
                <Textarea label="Replacement Reason (mandatory disclosure)" value={profile.replacementReason}
                  onChange={v => set('replacementReason', v)}
                  placeholder="State why the new product is more suitable than the existing one..."
                  rows={3} readOnly={readOnly} />
              </FieldRow>
            )}
          </div>
        </Section>
      )}

      {/* ── CONTRACT / APPLICATION ── */}
      {activeSection === 'contract' && (
        <Section title="Contract & Application Details" icon="📌">
          <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 mb-5 text-xs text-amber-800">
            <strong>Note:</strong> The contract/application number may be left blank at the drafting stage.
            It must be completed and the ROA updated before or at the time of implementation.
          </div>
          <FieldRow>
            <Field label="Contract / Application Number" value={profile.contractNumber}
              onChange={v => set('contractNumber', v)}
              placeholder="To be completed at implementation"
              hint="Leave blank if not yet available" readOnly={readOnly} />
            <Field label="Application / Submission Date" value={profile.applicationDate}
              onChange={v => set('applicationDate', v)} type="date" readOnly={readOnly} />
          </FieldRow>
          <FieldRow>
            <Textarea label="Advisor Notes (internal — not printed on ROA)" value={profile.advisorNotes}
              onChange={v => set('advisorNotes', v)}
              placeholder="Internal notes, follow-up items, special instructions..."
              rows={3} readOnly={readOnly} />
          </FieldRow>
        </Section>
      )}

      {/* ── Complete CTA ── */}
      {!readOnly && (
        <div className="bg-white rounded-xl border border-gray-200 px-5 py-4 flex items-center justify-between gap-4">
          <div className="text-xs text-gray-500">
            {personalComplete && financialComplete && riskComplete
              ? <span className="text-green-600 font-semibold">✓ All required sections complete</span>
              : <span>Complete all required sections before continuing</span>}
          </div>
          <button
            onClick={handleComplete}
            disabled={!personalComplete || !financialComplete}
            className={`px-6 py-2.5 rounded-lg font-semibold text-sm transition-all ${
              personalComplete && financialComplete
                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            Save & Continue →
          </button>
        </div>
      )}

    </div>
  );
}
