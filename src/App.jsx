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

import { useState, useCallback, useEffect, useRef } from 'react';
import ClientProfile         from './modules/ClientProfile.jsx';
import NeedsAnalysis         from './modules/NeedsAnalysis.jsx';
import DecisionTree          from './modules/DecisionTree.jsx';
import ProviderScoring from './modules/ProviderScoring.jsx';
import FeeDisclosure   from './modules/FeeDisclosure.jsx';
import ContentBuilder  from './modules/ContentBuilder.jsx';
import ROADocument     from './modules/ROADocument.jsx';
import ParagraphManager  from './admin/ParagraphManager.jsx';
import ProfileSettings   from './admin/ProfileSettings.jsx';
import SavedROAsManager  from './admin/SavedROAsManager.jsx';
import AccessCodeManager from './admin/AccessCodeManager.jsx';
import AuthGate, { getSession, clearSession } from './modules/AuthGate.jsx';
import {
  saveROA, saveDraft, loadDraft, clearDraft,
  loadProfile, saveProfile, generateROAId,
} from './shared/storage.js';
import { getProductLabel } from './shared/ui.js';

// ── Step definitions ───────────────────────────────────────────────────────
const STEPS = [
  { id: 'client',   label: 'Client Profile',     icon: '👤' },
  { id: 'calc',     label: 'Needs Analysis',      icon: '📊' },
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


// ══════════════════════════════════════════════════════════════════════════
// MAIN APP
// ══════════════════════════════════════════════════════════════════════════

export default function App() {
  const [session, setSession] = useState(() => getSession());

  if (!session) {
    return <AuthGate onAuth={(s) => setSession(s)} />;
  }

  return <AppShell session={session} onSignOut={() => { clearSession(); setSession(null); }} />;
}

function AppShell({ session, onSignOut }) {
  const [step,           setStep]           = useState('client');
  const [completedSteps, setCompleted]      = useState([]);
  const [roaData,        setRoaData]        = useState({
    id:            generateROAId(),
    createdAt:     new Date().toISOString(),
    clientProfile:   {},
    retirementCalc:  {},
    treeResult:      {},
    providerResult:  {},
    providerResult2: {},
    content:         {},
    fees:            {},
  });
  const [scoringPhase, setScoringPhase] = useState(1);
  const roaDataRef = useRef(roaData);
  useEffect(() => { roaDataRef.current = roaData; }, [roaData]);

  // Admin overlays
  const [showSettings,      setShowSettings]      = useState(false);
  const [showParaManager,   setShowParaManager]   = useState(false);
  const [showSaved,         setShowSaved]         = useState(false);
  const [showAccessCodes,   setShowAccessCodes]   = useState(false);

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
    setStep('calc');
  }, [updateRoa, markComplete]);

  const handleCalcComplete = useCallback((calcData) => {
    updateRoa({ retirementCalc: calcData });
    markComplete('calc');
    setStep('tree');
  }, [updateRoa, markComplete]);

  const handleCalcSkip = useCallback(() => {
    markComplete('calc');
    setStep('tree');
  }, [markComplete]);

  const handleTreeRecommendation = useCallback((result) => {
    updateRoa({ treeResult: result });
    markComplete('tree');
    setScoringPhase(1);
    // Skip scoring for non-scoreable products
    setStep(result.scoreable ? 'scoring' : 'fees');
    if (!result.scoreable) markComplete('scoring');
  }, [updateRoa, markComplete]);

  const handleProviderSelect = useCallback((result) => {
    updateRoa({ providerResult: result });
    const tr = roaDataRef.current.treeResult;
    if (tr.secondaryScoreable) {
      setScoringPhase(2);
    } else {
      markComplete('scoring');
      setStep('fees');
    }
  }, [updateRoa, markComplete]);

  const handleProvider2Select = useCallback((result) => {
    updateRoa({ providerResult2: result });
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
      setRoaData({ id: generateROAId(), createdAt: new Date().toISOString(), clientProfile:{}, retirementCalc:{}, treeResult:{}, providerResult:{}, providerResult2:{}, content:{}, fees:{} });
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
            <span className="text-xs text-gray-400 hidden sm:block">{session.advisorName}</span>
            <button onClick={() => setShowSaved(true)} className="text-xs text-gray-500 hover:text-gray-800 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50 transition-colors">
              Saved
            </button>
            <button onClick={handleNewROA} className="text-xs text-gray-500 hover:text-gray-800 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50 transition-colors">
              New ROA
            </button>
            <button onClick={() => setShowParaManager(true)} className="text-xs text-gray-500 hover:text-gray-800 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50 transition-colors hidden sm:block">
              Paragraphs
            </button>
            {session.isAdmin && (
              <button onClick={() => setShowAccessCodes(true)} className="text-xs text-amber-600 border border-amber-200 rounded-lg px-3 py-1.5 hover:bg-amber-50 transition-colors hidden sm:block">
                Access Codes
              </button>
            )}
            <button onClick={() => setShowSettings(true)} className="text-xs bg-gray-800 text-white rounded-lg px-3 py-1.5 hover:bg-gray-700 transition-colors">
              Settings
            </button>
            <button onClick={onSignOut} className="text-xs text-red-500 border border-red-200 rounded-lg px-3 py-1.5 hover:bg-red-50 transition-colors">
              Sign out
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

        {step === 'calc' && (
          <NeedsAnalysis
            clientProfile={roaData.clientProfile}
            initialData={roaData.retirementCalc}
            onChange={calcData => updateRoa({ retirementCalc: calcData })}
            onComplete={handleCalcComplete}
            onSkip={handleCalcSkip}
          />
        )}

        {step === 'tree' && (
          <DecisionTree
            onRecommendation={handleTreeRecommendation}
            initialPath={roaData.treeResult?.path}
            investmentAmount={roaData.clientProfile?.investmentAmount}
          />
        )}

        {step === 'scoring' && roaData.treeResult?.productKey && scoringPhase === 1 && (
          <ProviderScoring
            productKey={productKey}
            productLabel={getProductLabel(productKey)}
            onProviderSelect={handleProviderSelect}
            initialSelected={roaData.providerResult?.recommended?.name}
            advisorProfile={advisorProfile}
          />
        )}

        {step === 'scoring' && roaData.treeResult?.secondaryProductKey && scoringPhase === 2 && (
          <div>
            <div className="max-w-3xl mx-auto mb-4 flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-sm text-blue-800">
              <span className="font-semibold">Provider Scoring — Step 2 of 2:</span>
              <span>{roaData.treeResult.secondaryProductLabel}</span>
            </div>
            <ProviderScoring
              productKey={roaData.treeResult.secondaryProductKey}
              productLabel={roaData.treeResult.secondaryProductLabel}
              onProviderSelect={handleProvider2Select}
              initialSelected={roaData.providerResult2?.recommended?.name}
              advisorProfile={advisorProfile}
            />
          </div>
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
            retirementCalc={roaData.retirementCalc}
            treeResult={roaData.treeResult}
            providerResult={roaData.providerResult}
            providerResult2={roaData.providerResult2}
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
      {showSaved       && <SavedROAsManager  onLoad={handleLoadROA}                    onClose={() => setShowSaved(false)} />}
      {showAccessCodes && <AccessCodeManager onClose={() => setShowAccessCodes(false)} />}

    </div>
  );
}
