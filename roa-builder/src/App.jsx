/**
 * App.jsx — Investment ROA Builder v3
 * Main application shell. Wires all modules together.
 *
 * Workflow steps:
 *   0. splash / new ROA
 *   1. clientProfile  — capture client details
 *   2. decisionTree   — product type selection
 *   3. providerScoring — provider selection (if scoreable product)
 *   4. feeDisclosure  — fee entry
 *   5. contentBuilder — ROA text assembly
 *   6. roaDocument    — preview + print
 *
 * Admin overlays (open from nav):
 *   - ProfileSettings
 *   - ParagraphManager
 *   - Saved ROAs
 */

import { useState, useCallback, useEffect } from 'react';
import ClientProfile   from './modules/ClientProfile.jsx';
import DecisionTree    from './modules/DecisionTree.jsx';
import ProviderScoring from './modules/ProviderScoring.jsx';
import FeeDisclosure   from './modules/FeeDisclosure.jsx';
import ContentBuilder  from './modules/ContentBuilder.jsx';
import ROADocument     from './modules/ROADocument.jsx';
import ParagraphManager from './admin/ParagraphManager.jsx';
import ProfileSettings  from './admin/ProfileSettings.jsx';
import {
  saveROA, loadROAs, loadROAById, saveDraft, loadDraft, clearDraft,
  loadProfile, saveProfile, generateROAId,
} from './shared/storage.js';
import { formatDate, formatCurrency, getProductLabel, uid } from './shared/ui.js';

// ── Step definitions ───────────────────────────────────────────────────────
const STEPS = [
  { id: 'client',   label: 'Client Profile',     icon: '👤' },
  { id: 'tree',     label: 'Product Type',        icon: '🌳' },
  { id: 'scoring',  label: 'Provider Selection',  icon: '🏦' },
  { id: 'fees',     label: 'Fee Disclosure',       icon: '💰' },
  { id: 'content',  label: 'ROA Content',          icon: '✍️' },
  { id: 'document', label: 'Preview & Print',      icon: '📄' },
];

// ── Step progress bar ──────────────────────────────────────────────────────
function StepBar({ currentStep, completedSteps }) {
  const currentIdx = STEPS.findIndex(s => s.id === currentStep);
  return (
    <div className="flex items-center gap-0 overflow-x-auto pb-1">
      {STEPS.map((step, i) => {
        const done   = completedSteps.includes(step.id);
        const active = step.id === currentStep;
        const future = i > currentIdx;
        return (
          <div key={step.id} className="flex items-center flex-shrink-0">
            <div className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm border-2 transition-all
                ${done   ? 'bg-blue-600 border-blue-600 text-white'
                : active ? 'bg-white border-blue-600 text-blue-600'
                          : 'bg-white border-gray-200 text-gray-400'}`}>
                {done ? '✓' : step.icon}
              </div>
              <span className={`text-xs mt-1 hidden sm:block whitespace-nowrap ${active ? 'text-blue-700 font-semibold' : done ? 'text-blue-500' : 'text-gray-400'}`}>
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`w-8 sm:w-12 h-0.5 mx-1 mb-5 ${done ? 'bg-blue-400' : 'bg-gray-200'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Saved ROA list ─────────────────────────────────────────────────────────
function SavedROAList({ onLoad, onClose }) {
  const roas = loadROAs();
  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-end sm:items-center justify-center z-40 p-0 sm:p-4">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-lg flex flex-col" style={{maxHeight:'80vh'}}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <h2 className="font-bold text-gray-800">Saved ROAs</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">x</button>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-3">
          {roas.length === 0 && <p className="text-sm text-gray-400 text-center py-8">No saved ROAs yet.</p>}
          {roas.map(roa => (
            <button key={roa.id} onClick={() => onLoad(roa)}
              className="w-full text-left rounded-xl border border-gray-200 hover:border-blue-300 p-4 mb-2 transition-all hover:bg-blue-50">
              <div className="flex items-center justify-between mb-1">
                <p className="font-semibold text-sm text-gray-800">{[roa.clientProfile?.firstNames, roa.clientProfile?.surname].filter(Boolean).join(' ') || 'Unnamed Client'}</p>
                <span className="text-xs text-gray-400">{formatDate(roa.createdAt)}</span>
              </div>
              <p className="text-xs text-gray-500">{getProductLabel(roa.providerResult?.productKey || roa.treeResult?.productKey)} · {roa.providerResult?.recommended?.name || 'Provider not selected'}</p>
              <p className="text-xs text-gray-400 mt-0.5">Ref: {roa.id}</p>
            </button>
          ))}
        </div>
        <div className="px-6 py-3 border-t border-gray-100 flex-shrink-0">
          <button onClick={onClose} className="w-full text-sm text-gray-500 border border-gray-200 py-2 rounded-lg hover:bg-gray-50">Close</button>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// MAIN APP
// ══════════════════════════════════════════════════════════════════════════

export default function App() {
  const [step,           setStep]           = useState('client');
  const [completedSteps, setCompleted]      = useState([]);
  const [roaData,        setRoaData]        = useState({
    id:            generateROAId(),
    createdAt:     new Date().toISOString(),
    clientProfile: {},
    treeResult:    {},
    providerResult:{},
    content:       {},
    fees:          {},
  });

  // Admin overlays
  const [showSettings,   setShowSettings]   = useState(false);
  const [showParaManager,setShowParaManager]= useState(false);
  const [showSaved,      setShowSaved]      = useState(false);

  // Advisor profile
  const [advisorProfile, setAdvisorProfile] = useState(loadProfile());

  // Auto-save
  useEffect(() => {
    if (advisorProfile?.autoSave !== false) saveDraft(roaData);
  }, [roaData, advisorProfile]);

  // Load draft on mount
  useEffect(() => {
    const draft = loadDraft();
    if (draft?.clientProfile?.firstNames) {
      const restore = window.confirm('Resume unsaved ROA draft?');
      if (restore) {
        setRoaData(draft);
        setCompleted(['client']);
      }
    }
  }, []); // eslint-disable-line

  const updateRoa = useCallback((updates) => {
    setRoaData(prev => ({ ...prev, ...updates }));
  }, []);

  const markComplete = useCallback((stepId) => {
    setCompleted(prev => prev.includes(stepId) ? prev : [...prev, stepId]);
  }, []);

  // ── Step handlers ──────────────────────────────────────────────────────

  const handleClientComplete = useCallback((profile) => {
    updateRoa({ clientProfile: profile });
    markComplete('client');
    setStep('tree');
  }, [updateRoa, markComplete]);

  const handleTreeRecommendation = useCallback((result) => {
    updateRoa({ treeResult: result });
    markComplete('tree');
    // Skip scoring for non-scoreable products
    setStep(result.scoreable ? 'scoring' : 'fees');
    if (!result.scoreable) markComplete('scoring');
  }, [updateRoa, markComplete]);

  const handleProviderSelect = useCallback((result) => {
    updateRoa({ providerResult: result });
    markComplete('scoring');
    setStep('fees');
  }, [updateRoa, markComplete]);

  const handleFeesComplete = useCallback((fees) => {
    updateRoa({ fees });
    markComplete('fees');
    setStep('content');
  }, [updateRoa, markComplete]);

  const handleContentComplete = useCallback((content) => {
    updateRoa({ content });
    markComplete('content');
    setStep('document');
  }, [updateRoa, markComplete]);

  const handleSave = useCallback((data) => {
    saveROA(data || roaData);
    alert('ROA saved successfully.');
  }, [roaData]);

  const handleLoadROA = useCallback((savedRoa) => {
    setRoaData(savedRoa);
    setCompleted(STEPS.map(s => s.id));
    setStep('document');
    setShowSaved(false);
  }, []);

  const handleNewROA = useCallback(() => {
    if (window.confirm('Start a new ROA? Unsaved progress will be lost.')) {
      clearDraft();
      setRoaData({ id: generateROAId(), createdAt: new Date().toISOString(), clientProfile:{}, treeResult:{}, providerResult:{}, content:{}, fees:{} });
      setCompleted([]);
      setStep('client');
    }
  }, []);

  const productKey = roaData.providerResult?.productKey || roaData.treeResult?.productKey || 'unit trust';

  return (
    <div className="min-h-screen bg-gray-100">

      {/* ── NAV BAR ── */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">R</div>
            <div className="hidden sm:block">
              <p className="text-sm font-bold text-gray-800 leading-tight">ROA Builder</p>
              <p className="text-xs text-gray-400 leading-tight">{advisorProfile?.practiceName || 'Configure practice in Settings'}</p>
            </div>
          </div>

          <div className="flex-1 max-w-xl hidden md:block">
            <StepBar currentStep={step} completedSteps={completedSteps} />
          </div>

          <div className="flex items-center gap-2">
            <button onClick={() => setShowSaved(true)} className="text-xs text-gray-500 hover:text-gray-800 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50 transition-colors">
              Saved
            </button>
            <button onClick={handleNewROA} className="text-xs text-gray-500 hover:text-gray-800 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50 transition-colors">
              New ROA
            </button>
            <button onClick={() => setShowParaManager(true)} className="text-xs text-gray-500 hover:text-gray-800 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50 transition-colors hidden sm:block">
              Paragraphs
            </button>
            <button onClick={() => setShowSettings(true)} className="text-xs bg-gray-800 text-white rounded-lg px-3 py-1.5 hover:bg-gray-700 transition-colors">
              Settings
            </button>
          </div>
        </div>

        {/* Mobile step bar */}
        <div className="md:hidden px-4 pb-3">
          <StepBar currentStep={step} completedSteps={completedSteps} />
        </div>
      </nav>

      {/* ── MAIN CONTENT ── */}
      <main className="max-w-5xl mx-auto px-4 py-8">

        {step === 'client' && (
          <ClientProfile
            initialData={roaData.clientProfile}
            onChange={profile => updateRoa({ clientProfile: profile })}
            onComplete={handleClientComplete}
          />
        )}

        {step === 'tree' && (
          <DecisionTree
            onRecommendation={handleTreeRecommendation}
            initialPath={roaData.treeResult?.path}
          />
        )}

        {step === 'scoring' && roaData.treeResult?.productKey && (
          <ProviderScoring
            productKey={productKey}
            productLabel={getProductLabel(productKey)}
            onProviderSelect={handleProviderSelect}
            initialSelected={roaData.providerResult?.recommended?.name}
            advisorProfile={advisorProfile}
          />
        )}

        {step === 'fees' && (
          <FeeDisclosure
            productKey={productKey}
            investmentAmount={roaData.clientProfile?.investmentAmount}
            initialData={roaData.fees}
            advisorProfile={advisorProfile}
            onComplete={handleFeesComplete}
            onChange={fees => updateRoa({ fees })}
          />
        )}

        {step === 'content' && (
          <ContentBuilder
            productKey={productKey}
            clientProfile={roaData.clientProfile}
            providerResult={roaData.providerResult}
            initialContent={roaData.content}
            onChange={content => updateRoa({ content })}
            onComplete={handleContentComplete}
          />
        )}

        {step === 'document' && (
          <ROADocument
            roaData={roaData}
            advisorProfile={advisorProfile}
            onEdit={() => setStep('content')}
            onSave={handleSave}
          />
        )}

        {/* ── Step navigation (back/skip) ── */}
        {step !== 'client' && step !== 'document' && (
          <div className="max-w-3xl mx-auto mt-6 flex items-center justify-between text-xs text-gray-400">
            <button
              onClick={() => {
                const idx = STEPS.findIndex(s => s.id === step);
                if (idx > 0) setStep(STEPS[idx-1].id);
              }}
              className="hover:text-gray-600 transition-colors flex items-center gap-1"
            >
              Back
            </button>
            <span className="bg-gray-200 rounded-full px-3 py-1 font-medium">
              Step {STEPS.findIndex(s => s.id === step) + 1} of {STEPS.length}
            </span>
            {completedSteps.includes(step) && (
              <button
                onClick={() => {
                  const idx = STEPS.findIndex(s => s.id === step);
                  if (idx < STEPS.length - 1) setStep(STEPS[idx+1].id);
                }}
                className="hover:text-gray-600 transition-colors"
              >
                Skip
              </button>
            )}
          </div>
        )}

      </main>

      {/* ── ADMIN OVERLAYS ── */}
      {showSettings    && <ProfileSettings  onClose={() => setShowSettings(false)}    onChange={p => { setAdvisorProfile(p); saveProfile(p); }} />}
      {showParaManager && <ParagraphManager onClose={() => setShowParaManager(false)} />}
      {showSaved       && <SavedROAList     onLoad={handleLoadROA}                    onClose={() => setShowSaved(false)} />}

    </div>
  );
}
