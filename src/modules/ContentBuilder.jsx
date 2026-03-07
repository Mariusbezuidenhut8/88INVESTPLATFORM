/**
 * ContentBuilder.jsx — Investment ROA Builder v3
 *
 * Section-by-section ROA text builder. For each section the advisor can:
 *   1. Click a pre-written paragraph from the bank to insert it
 *   2. Edit the selected text freely in a textarea
 *   3. Append multiple paragraphs together
 *   4. Write from scratch
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { getParagraphs } from '../data/paragraphBank.js';
import { getProductLabel, formatScore } from '../shared/ui.js';

const SECTIONS = [
  { key: 'clientNeeds',      label: 'Client Needs & Objectives',    icon: '🎯', required: true,  hint: "Describe the client's investment objectives, financial goals, and reasons for investing." },
  { key: 'riskProfile',      label: 'Risk Profile',                 icon: '📊', required: true,  hint: "Summarise the client's risk profile, questionnaire result, and how it informs the recommendation." },
  { key: 'recommendation',   label: 'Product Recommendation',       icon: '✅', required: true,  hint: 'Explain why this product is recommended and why it is appropriate for the client\'s needs.' },
  { key: 'providerRationale',label: 'Provider Rationale',           icon: '🏦', required: true,  hint: 'Justify the recommended provider based on the due diligence scoring and client fit.' },
  { key: 'costs',            label: 'Costs & Fees',                 icon: '💰', required: true,  hint: 'Disclose all fees: product charges, platform fees, and advisor fees.' },
  { key: 'tax',              label: 'Tax Implications',             icon: '🧾', required: true,  hint: 'Explain the tax treatment of the recommended product for this client.' },
  { key: 'reg28',            label: 'Regulation 28',                icon: '⚖️', required: false, hint: 'Applicable to retirement funds only. Explain Regulation 28 compliance.' },
  { key: 'faisDisclosure',   label: 'FAIS & Statutory Disclosures', icon: '📜', required: true,  hint: 'FAIS compliance, conflict of interest, risk disclosure, FICA status.' },
  { key: 'implementation',   label: 'Implementation Steps',         icon: '🚀', required: false, hint: 'Steps required to action this advice.' },
  { key: 'reviewSchedule',       label: 'Review Schedule',                    icon: '🗓️', required: false, hint: 'When and how the investment will be reviewed.' },
  { key: 'clientDeclComments',   label: 'Section I — Client Declarations (General Comments)', icon: '📝', required: false, hint: 'Optional general comments from the client regarding this Record of Advice. The 12 client declarations are pre-printed in the document.' },
];

const applyTokens = (text, clientProfile, providerResult) => {
  if (!text) return text;
  const client   = clientProfile || {};
  const provider = providerResult?.recommended;
  const alts     = providerResult?.alternatives || [];
  const fullName = [client.firstNames, client.surname].filter(Boolean).join(' ') || '[Client Name]';
  return text
    .replace(/\[Client Name\]/g, fullName)
    .replace(/\[Client Surname\]/g, client.surname || '[Surname]')
    .replace(/\[Provider Name\]/g, provider?.name || '[Provider Name]')
    .replace(/\[Product Type\]/g, getProductLabel(providerResult?.productKey || '') || '[Product Type]')
    .replace(/\[X\.XX\]/g, provider ? formatScore(provider.score) : '[Score]')
    .replace(/\[Provider 2\]/g, alts[0]?.name || '[Provider 2]')
    .replace(/\[Provider 3\]/g, alts[1]?.name || '[Provider 3]')
    .replace(/\[strengths\]/g, 'regulatory standing, cost efficiency and platform features')
    .replace(/\[date\]/g, new Date(Date.now() + 365*24*60*60*1000).toLocaleDateString('en-ZA', { day:'numeric', month:'long', year:'numeric' }));
};

// ── Derive which paragraph IDs to suggest for a section + client context ──
function getSuggestedIds(sectionKey, paragraphs, clientProfile) {
  if (!paragraphs.length) return [];

  if (sectionKey === 'riskProfile') {
    const rp = (clientProfile?.riskProfileEffective || '').toLowerCase();
    const tagMatch = (tags) => tags?.some(t => rp.includes(t));
    const priority = [
      ['conservative'],
      ['moderate', 'balanced'],
      ['aggressive', 'growth'],
      ['income', 'capital_stable'],
    ];
    for (const group of priority) {
      if (group.some(kw => rp.includes(kw))) {
        const match = paragraphs.find(p => tagMatch(p.tags));
        if (match) return [match.id];
      }
    }
    return [];
  }

  // All other sections: first paragraph is the suggested default
  return [paragraphs[0].id];
}

function ParaChip({ para, isSuggested, onAppend, onReplace }) {
  return (
    <div className={`group rounded-lg border p-3 mb-2 transition-all ${
      isSuggested
        ? 'border-green-300 bg-green-50 hover:border-green-400'
        : 'border-gray-200 bg-white hover:border-blue-200 hover:bg-blue-50/50'
    }`}>
      <div className="flex items-start justify-between gap-2 mb-1">
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          {isSuggested && (
            <span className="flex-shrink-0 text-xs font-semibold text-green-700 bg-green-100 border border-green-200 rounded-full px-1.5 py-0.5 leading-none">
              ✓ Suggested
            </span>
          )}
          <p className="text-xs font-semibold text-gray-700 truncate">{para.label}</p>
        </div>
        <div className="flex gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => onReplace(para)} className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded hover:bg-blue-700">Replace</button>
          <button onClick={() => onAppend(para)}  className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded hover:bg-gray-200">Append</button>
        </div>
      </div>
      <p className="text-xs text-gray-500 leading-relaxed line-clamp-3">{para.text}</p>
      {para.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-1.5">
          {para.tags.map(t => <span key={t} className={`text-xs rounded px-1.5 py-0.5 ${isSuggested ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>{t}</span>)}
        </div>
      )}
    </div>
  );
}

function SectionEditor({ section, productKey, text, onChange, clientProfile, providerResult }) {
  const [showBank, setShowBank] = useState(false);
  const [filter, setFilter]     = useState('');
  const paragraphs   = getParagraphs(section.key, productKey);
  const suggestedIds = getSuggestedIds(section.key, paragraphs, clientProfile);

  // Suggested paragraphs float to the top
  const sorted = [
    ...paragraphs.filter(p => suggestedIds.includes(p.id)),
    ...paragraphs.filter(p => !suggestedIds.includes(p.id)),
  ];
  const filtered = filter
    ? sorted.filter(p => p.label.toLowerCase().includes(filter.toLowerCase()) || p.tags?.some(t => t.includes(filter.toLowerCase())))
    : sorted;

  const wordCount = text ? text.trim().split(/\s+/).filter(Boolean).length : 0;

  const handleReplace = (para) => { onChange(applyTokens(para.text, clientProfile, providerResult)); setShowBank(false); };
  const handleAppend  = (para) => { const r = applyTokens(para.text, clientProfile, providerResult); onChange(text ? text + '\n\n' + r : r); };

  return (
    <div className="flex min-h-0">
      {showBank && (
        <div className="w-72 flex-shrink-0 border-r border-gray-200 bg-gray-50 flex flex-col" style={{maxHeight:'400px'}}>
          <div className="px-3 py-2 border-b border-gray-200 flex items-center justify-between">
            <p className="text-xs font-semibold text-gray-600">Paragraph Bank</p>
            <button onClick={() => setShowBank(false)} className="text-gray-400 hover:text-gray-600">✕</button>
          </div>
          <div className="px-3 py-2 border-b border-gray-100">
            <input type="text" value={filter} onChange={e => setFilter(e.target.value)} placeholder="Search..." className="w-full text-xs border border-gray-200 rounded px-2 py-1.5 focus:outline-none" />
          </div>
          <div className="flex-1 overflow-y-auto px-3 py-2">
            {filtered.length === 0 && <p className="text-xs text-gray-400 text-center py-4">No matches</p>}
            {filtered.map(p => (
              <ParaChip key={p.id} para={p} isSuggested={suggestedIds.includes(p.id)} onAppend={handleAppend} onReplace={handleReplace} />
            ))}
          </div>
        </div>
      )}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100 bg-gray-50">
          <div className="flex items-center gap-3">
            {!showBank && paragraphs.length > 0 && (
              <button onClick={() => setShowBank(true)} className="text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors">
                📚 Paragraph bank ({paragraphs.length})
              </button>
            )}
            {text && <button onClick={() => onChange('')} className="text-xs text-gray-400 hover:text-red-500 transition-colors">Clear</button>}
          </div>
          <span className="text-xs text-gray-400">{wordCount} words</span>
        </div>
        <textarea
          value={text || ''}
          onChange={e => onChange(e.target.value)}
          placeholder={section.hint}
          rows={8}
          className="flex-1 w-full text-sm px-4 py-3 border-0 focus:outline-none resize-none leading-relaxed text-gray-700 placeholder-gray-300"
        />
      </div>
    </div>
  );
}

// ── Advisor Declaration sub-field (text area + paragraph bank) ─────────────
function DeclSubField({ number, label, paraKey, value, onChange, productKey, clientProfile, providerResult }) {
  const [showBank, setShowBank] = useState(false);
  const paragraphs   = getParagraphs(paraKey, 'general');
  const suggestedIds = getSuggestedIds(paraKey, paragraphs, clientProfile);
  const sorted = [
    ...paragraphs.filter(p => suggestedIds.includes(p.id)),
    ...paragraphs.filter(p => !suggestedIds.includes(p.id)),
  ];
  const handleReplace = (para) => { onChange(applyTokens(para.text, clientProfile, providerResult)); setShowBank(false); };
  const handleAppend  = (para) => { const r = applyTokens(para.text, clientProfile, providerResult); onChange(value ? value + '\n\n' + r : r); };
  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-1.5">
        <p className="text-xs font-semibold text-gray-700">{number}. {label}</p>
        {paragraphs.length > 0 && (
          <button onClick={() => setShowBank(v => !v)} className="text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors">
            📚 Suggestions ({paragraphs.length})
          </button>
        )}
      </div>
      {showBank && (
        <div className="border border-gray-200 rounded-lg bg-gray-50 p-2 mb-2 max-h-48 overflow-y-auto">
          {sorted.map(p => (
            <ParaChip key={p.id} para={p} isSuggested={suggestedIds.includes(p.id)} onAppend={handleAppend} onReplace={handleReplace} />
          ))}
        </div>
      )}
      <textarea
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        rows={3}
        className="w-full text-sm px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-300 resize-none text-gray-700 placeholder-gray-300"
        placeholder={`Enter text for item ${number}...`}
      />
    </div>
  );
}

// ── Advisor Declaration section ────────────────────────────────────────────
function AdvisorDeclarationSection({ value = {}, onChange, isOpen, onToggle, productKey, clientProfile, providerResult }) {
  const hasContent = !!(value?.declined || value?.reasons || value?.risks || value?.focussed || value?.consequences !== null && value?.consequences !== undefined);
  const update = (field, val) => onChange({ ...value, [field]: val });
  return (
    <div className={`rounded-xl border overflow-hidden mb-3 transition-all ${isOpen ? 'border-blue-200 shadow-sm' : 'border-gray-200'}`}>
      <button onClick={onToggle} className={`w-full flex items-center justify-between px-5 py-3.5 text-left transition-colors ${isOpen ? 'bg-blue-50' : 'bg-white hover:bg-gray-50'}`}>
        <div className="flex items-center gap-3">
          <span className="text-base">📋</span>
          <span className="font-semibold text-sm text-gray-800">Section H — Financial Advisor's Declaration</span>
        </div>
        <div className="flex items-center gap-3">
          {hasContent
            ? <span className="text-xs text-green-600 font-semibold bg-green-50 border border-green-100 rounded-full px-2 py-0.5">✓ Completed</span>
            : <span className="text-xs text-gray-400">Optional</span>}
          <span className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}>▼</span>
        </div>
      </button>
      {isOpen && (
        <div className="px-5 py-4 border-t border-gray-100">
          <p className="text-xs text-gray-500 mb-4 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
            Complete items 1–5 if the client declined any recommendations, if advice was rendered on a focussed-need basis, or if no suitable product was available. Items 6 and 7 are statutory declarations pre-printed in the document.
          </p>
          <DeclSubField number="1" label="Product recommendations the client elected not to accept"
            paraKey="advisorDecl_declined" value={value?.declined} onChange={v => update('declined', v)}
            productKey={productKey} clientProfile={clientProfile} providerResult={providerResult} />
          <DeclSubField number="2" label="Reasons the client elected not to accept the product recommendations above"
            paraKey="advisorDecl_reasons" value={value?.reasons} onChange={v => update('reasons', v)}
            productKey={productKey} clientProfile={clientProfile} providerResult={providerResult} />
          <DeclSubField number="3" label="Existence of any risks to the client for not concluding the transaction recommended"
            paraKey="advisorDecl_risks" value={value?.risks} onChange={v => update('risks', v)}
            productKey={productKey} clientProfile={clientProfile} providerResult={providerResult} />
          <div className="mb-4">
            <p className="text-xs font-semibold text-gray-700 mb-2">4. The consequences thereof have been clearly explained to the Client:</p>
            <div className="flex gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="decl_consequences" checked={value?.consequences === true} onChange={() => update('consequences', true)} className="accent-blue-600" />
                <span className="text-sm text-gray-700">Yes</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="decl_consequences" checked={value?.consequences === false} onChange={() => update('consequences', false)} className="accent-blue-600" />
                <span className="text-sm text-gray-700">No</span>
              </label>
            </div>
          </div>
          <DeclSubField number="5" label="Where there is only a focussed need being addressed, the following was discussed and agreed with the Client"
            paraKey="advisorDecl_focussed" value={value?.focussed} onChange={v => update('focussed', v)}
            productKey={productKey} clientProfile={clientProfile} providerResult={providerResult} />
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mt-1">
            <p className="text-xs font-semibold text-gray-500 mb-1">Items 6 & 7 are statutory declarations (always printed in the document):</p>
            <p className="text-xs text-gray-400 italic">6. Advisor confirms client was alerted to limitations of focussed-need advice and their obligation to assess its appropriateness.</p>
            <p className="text-xs text-gray-400 italic mt-1">7. Where no suitable product exists, advisor confirms this was explained and the client was referred to another provider.</p>
          </div>
        </div>
      )}
    </div>
  );
}

function SectionItem({ section, isOpen, onToggle, text, onChange, productKey, clientProfile, providerResult }) {
  const hasContent = text && text.trim().length > 20;
  const wordCount  = text ? text.trim().split(/\s+/).filter(Boolean).length : 0;
  return (
    <div className={`rounded-xl border overflow-hidden mb-3 transition-all ${isOpen ? 'border-blue-200 shadow-sm' : 'border-gray-200'}`}>
      <button onClick={onToggle} className={`w-full flex items-center justify-between px-5 py-3.5 text-left transition-colors ${isOpen ? 'bg-blue-50' : 'bg-white hover:bg-gray-50'}`}>
        <div className="flex items-center gap-3">
          <span className="text-base">{section.icon}</span>
          <span className="font-semibold text-sm text-gray-800">{section.label}{section.required && <span className="text-red-400 text-xs ml-1">*</span>}</span>
        </div>
        <div className="flex items-center gap-3">
          {hasContent
            ? <span className="text-xs text-green-600 font-semibold bg-green-50 border border-green-100 rounded-full px-2 py-0.5">✓ {wordCount}w</span>
            : section.required
            ? <span className="text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-full px-2 py-0.5">Required</span>
            : <span className="text-xs text-gray-400">Optional</span>}
          <span className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}>▼</span>
        </div>
      </button>
      {isOpen && (
        <SectionEditor section={section} productKey={productKey} text={text} onChange={onChange} clientProfile={clientProfile} providerResult={providerResult} />
      )}
    </div>
  );
}

export default function ContentBuilder({ productKey='unit trust', clientProfile={}, treeResult={}, providerResult=null, providerResult2=null, initialContent={}, onChange, onComplete }) {
  const [content, setContent]         = useState(initialContent);
  const [openSection, setOpenSection] = useState('clientNeeds');
  const [autoFilled, setAutoFilled]   = useState(false);

  useEffect(() => { if (onChange) onChange(content); }, [content]); // eslint-disable-line

  const setSection = useCallback((key, text) => setContent(prev => ({ ...prev, [key]: text })), []);

  const autoFillProviderRationale = useCallback(() => {
    if (!providerResult?.recommended) return;
    const rec  = providerResult.recommended;
    const alt1 = providerResult.alternatives?.[0];
    const alt2 = providerResult.alternatives?.[1];
    const lines = [
      `Three providers were shortlisted for this recommendation based on their overall due diligence scores across five categories: Platform Features, Administration, Provider Strength, Regulatory Standing, and Cost & Value Metrics.`,
      ``,
      `The recommended provider, ${rec.name}, achieved the highest weighted score of ${formatScore(rec.score)} out of 5.00 for the ${getProductLabel(productKey)} product category. ${rec.catalogue?.notes || ''}`,
    ];
    if (alt1) lines.push(``, `Alternative considered: ${alt1.name} (score: ${formatScore(alt1.score)}). ${alt1.catalogue?.notes || ''}`);
    if (alt2) lines.push(``, `Alternative considered: ${alt2.name} (score: ${formatScore(alt2.score)}). ${alt2.catalogue?.notes || ''}`);
    if (providerResult2?.recommended) {
      const rec2  = providerResult2.recommended;
      const alt2a = providerResult2.alternatives?.[0];
      const pKey2 = treeResult?.secondaryProductKey;
      lines.push(
        ``,
        `A split investment strategy was recommended. The ${getProductLabel(pKey2)} allocation was placed with ${rec2.name} (score: ${formatScore(rec2.score)} out of 5.00). ${rec2.catalogue?.notes || ''}`,
      );
      if (alt2a) lines.push(``, `Alternative considered for ${getProductLabel(pKey2)}: ${alt2a.name} (score: ${formatScore(alt2a.score)}).`);
    }
    lines.push(``, `The recommended provider(s) were selected based on the combination of overall due diligence score, suitability for the client's specific needs, and value for money. The top 3 providers and their full scoring breakdowns are retained on file for FAIS audit purposes.`);
    setSection('providerRationale', lines.join('\n'));
    setAutoFilled(true);
  }, [providerResult, providerResult2, treeResult, productKey, setSection]);

  const requiredSections  = SECTIONS.filter(s => s.required);
  const completedRequired = requiredSections.filter(s => content[s.key]?.trim().length > 20);
  const allComplete       = completedRequired.length === requiredSections.length;
  const completionPct     = Math.round((completedRequired.length / requiredSections.length) * 100);

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div>
            <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-0.5">ROA Content Builder</p>
            <h2 className="text-xl font-bold text-gray-800">{getProductLabel(productKey)}</h2>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-gray-700">{completionPct}%</p>
            <p className="text-xs text-gray-400">{completedRequired.length}/{requiredSections.length} required</p>
          </div>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all duration-500 ${completionPct===100?'bg-green-500':'bg-blue-500'}`} style={{width:`${completionPct}%`}} />
        </div>
      </div>

      {providerResult?.recommended && !autoFilled && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 mb-5 flex items-center justify-between gap-3">
          <p className="text-sm text-blue-700">Provider scoring complete — auto-fill provider rationale?</p>
          <button onClick={autoFillProviderRationale} className="text-xs font-semibold bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 flex-shrink-0">Auto-fill</button>
        </div>
      )}

      {SECTIONS.map(section => (
        <SectionItem
          key={section.key}
          section={section}
          isOpen={openSection === section.key}
          onToggle={() => setOpenSection(openSection === section.key ? null : section.key)}
          text={content[section.key] || ''}
          onChange={text => setSection(section.key, text)}
          productKey={productKey}
          clientProfile={clientProfile}
          providerResult={providerResult}
        />
      ))}

      <AdvisorDeclarationSection
        value={content.advisorDeclaration || {}}
        onChange={val => setSection('advisorDeclaration', val)}
        isOpen={openSection === 'advisorDeclaration'}
        onToggle={() => setOpenSection(openSection === 'advisorDeclaration' ? null : 'advisorDeclaration')}
        productKey={productKey}
        clientProfile={clientProfile}
        providerResult={providerResult}
      />

      <div className="bg-white rounded-xl border border-gray-200 px-5 py-4 mt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          {allComplete
            ? <p className="text-sm font-semibold text-green-600">✓ All required sections complete</p>
            : <p className="text-sm text-gray-500">Still needed: {requiredSections.filter(s => !(content[s.key]?.trim().length > 20)).map(s => s.label).join(', ')}</p>}
        </div>
        <button onClick={() => allComplete && onComplete && onComplete(content)} disabled={!allComplete}
          className={`px-6 py-2.5 rounded-lg font-semibold text-sm transition-all ${allComplete ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}>
          Preview ROA Document →
        </button>
      </div>
    </div>
  );
}
