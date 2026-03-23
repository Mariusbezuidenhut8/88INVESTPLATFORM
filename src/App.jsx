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
import ProviderScoring       from './modules/ProviderScoring.jsx';
import FeeDisclosure         from './modules/FeeDisclosure.jsx';
import ContentBuilder        from './modules/ContentBuilder.jsx';
import ROADocument           from './modules/ROADocument.jsx';
import InvestmentCAR         from './modules/InvestmentCAR.jsx';
import InvestmentCARDocument from './modules/InvestmentCARDocument.jsx';
import AuthGate, { getSession, clearSession } from './modules/AuthGate.jsx';
import CARParagraphManager   from './admin/CARParagraphManager.jsx';
import AccessCodeManager     from './admin/AccessCodeManager.jsx';
import ParagraphManager      from './admin/ParagraphManager.jsx';
import ProfileSettings       from './admin/ProfileSettings.jsx';
import SavedROAsManager      from './admin/SavedROAsManager.jsx';
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
  return (
    <div className="flex items-center gap-0 overflow-x-auto pb-1">
      {STEPS.map((step, i) => {
        const done   = completedSteps.includes(step.id);
        const active = step.id === currentStep;
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

// ── Landing page shown when no ROA type is selected ───────────────────────────
function LandingPage({ onSelect }) {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-6">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-600 text-white font-bold text-2xl mb-4 shadow-lg">R</div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">ROA Builder</h1>
          <p className="text-gray-500 mt-2 text-sm">Select the type of advice record you want to create.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Investment CAR */}
          <button
            onClick={() => onSelect('investmentCAR')}
            className="group bg-white border-2 border-blue-200 rounded-2xl p-6 text-left hover:border-blue-500 hover:shadow-lg transition-all"
          >
            <div className="text-3xl mb-3">📋</div>
            <h2 className="text-base font-bold text-gray-800 mb-1 group-hover:text-blue-700">Investment CAR</h2>
            <p className="text-xs text-gray-500 leading-relaxed">
              Investment Client Advice Record — Sections A–I per FAIS requirements.
              Collect client info, select from pre-written paragraphs per field, and
              compose the full advice record ready to sign.
            </p>
            <span className="inline-block mt-3 text-xs text-blue-600 font-semibold group-hover:underline">Start Investment CAR →</span>
          </button>

          {/* Standard ROA */}
          <button
            onClick={() => onSelect('standard')}
            className="group bg-white border-2 border-gray-200 rounded-2xl p-6 text-left hover:border-blue-400 hover:shadow-lg transition-all"
          >
            <div className="text-3xl mb-3">📊</div>
            <h2 className="text-base font-bold text-gray-800 mb-1 group-hover:text-blue-700">Standard ROA</h2>
            <p className="text-xs text-gray-500 leading-relaxed">
              Full investment ROA workflow — client profile, needs analysis,
              product decision tree, provider scoring matrix, fee disclosure,
              and 10-section content builder.
            </p>
            <span className="inline-block mt-3 text-xs text-blue-600 font-semibold group-hover:underline">Start Standard ROA →</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  // ── Auth session ──────────────────────────────────────────────────────────
  const [session, setSession] = useState(() => getSession());

  const handleLogout = useCallback(() => {
    clearSession();
    setSession(null);
    setRoaType(null);
  }, []);

  const [roaType,           setRoaType]           = useState(null); // null | 'standard' | 'investmentCAR'
  const [carData,           setCarData]           = useState(null);
  const [showCARDoc,        setShowCARDoc]        = useState(false);
  const [showCARParaManager,setShowCARParaManager]= useState(false);
  const [showAccessCodes,   setShowAccessCodes]   = useState(false);
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

  // ── Auth gate ────────────────────────────────────────────────────────────
  if (!session) {
    return <AuthGate onAuth={setSession} />;
  }

  // ── Landing page ─────────────────────────────────────────────────────────
  if (roaType === null) {
    return (
      <>
        <LandingPage onSelect={(type) => setRoaType(type)} />
        {showSettings && <ProfileSettings onClose={() => setShowSettings(false)} onChange={p => { setAdvisorProfile(p); saveProfile(p); }} />}
        {showAccessCodes && session?.isAdmin && <AccessCodeManager onClose={() => setShowAccessCodes(false)} />}
      </>
    );
  }

  // ── Investment CAR flow ─────────────────────────────────────────────────
  if (roaType === 'investmentCAR') {
    return (
      <div className="min-h-screen bg-gray-100">
        <nav className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
          <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">R</div>
              <div className="hidden sm:block">
                <p className="text-sm font-bold text-gray-800 leading-tight">ROA Builder</p>
                <p className="text-xs text-gray-400 leading-tight">{session?.advisorName || 'Investment CAR'}</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <button onClick={() => { setRoaType(null); setCarData(null); setShowCARDoc(false); }} className="text-xs text-gray-500 hover:text-gray-800 border border-gray-200 bg-white rounded-lg px-3 py-2 font-medium hover:bg-gray-50 transition-all">← Home</button>
              <button onClick={() => setShowCARParaManager(true)} className="text-xs text-gray-500 hover:text-gray-800 border border-gray-200 bg-white rounded-lg px-3 py-2 font-medium hover:bg-gray-50 transition-all hidden sm:block">Paragraphs</button>
              {session?.isAdmin && <button onClick={() => setShowAccessCodes(true)} className="text-xs text-amber-700 border border-amber-200 bg-amber-50 rounded-lg px-3 py-2 font-medium hover:bg-amber-100 transition-all hidden sm:block">Codes</button>}
              <button onClick={() => setShowSettings(true)} className="text-xs bg-blue-600 text-white rounded-lg px-3 py-2 font-semibold hover:bg-blue-700 shadow-sm shadow-blue-200 transition-all">Settings</button>
              <button onClick={handleLogout} className="text-xs text-gray-400 hover:text-red-500 hover:border-red-200 border border-gray-200 bg-white rounded-lg px-3 py-2 font-medium transition-all">Sign out</button>
            </div>
          </div>
        </nav>
        <main className="max-w-5xl mx-auto px-4 py-8">
          {!showCARDoc ? (
            <InvestmentCAR advisorProfile={advisorProfile} initialData={carData} onComplete={(data) => { setCarData(data); setShowCARDoc(true); }} />
          ) : (
            <InvestmentCARDocument carData={carData} advisorProfile={advisorProfile} onEdit={() => setShowCARDoc(false)} />
          )}
        </main>
        {showSettings       && <ProfileSettings     onClose={() => setShowSettings(false)}       onChange={p => { setAdvisorProfile(p); saveProfile(p); }} />}
        {showCARParaManager && <CARParagraphManager onClose={() => setShowCARParaManager(false)} />}
        {showAccessCodes && session?.isAdmin && <AccessCodeManager onClose={() => setShowAccessCodes(false)} />}
      </div>
    );
  }

  // ── Standard ROA flow ───────────────────────────────────────────────────
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
            <button onClick={() => setShowSaved(true)} className="text-xs text-gray-500 hover:text-gray-800 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50 transition-colors">Saved</button>
            <button onClick={() => { setRoaType(null); }} className="text-xs text-gray-500 hover:text-gray-800 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50 transition-colors">← Home</button>
            <button onClick={handleNewROA} className="text-xs text-gray-500 hover:text-gray-800 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50 transition-colors">New ROA</button>
            <button onClick={() => setShowParaManager(true)} className="text-xs text-gray-500 hover:text-gray-800 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50 transition-colors hidden sm:block">Paragraphs</button>
            {session?.isAdmin && <button onClick={() => setShowAccessCodes(true)} className="text-xs text-amber-600 border border-amber-200 rounded-lg px-3 py-1.5 hover:bg-amber-50 transition-colors hidden sm:block">🔐 Codes</button>}
            <button onClick={() => setShowSettings(true)} className="text-xs bg-gray-800 text-white rounded-lg px-3 py-1.5 hover:bg-gray-700 transition-colors">Settings</button>
            <button onClick={handleLogout} className="text-xs text-gray-400 hover:text-red-500 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50 transition-colors">Sign out</button>
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
      {showSettings    && <ProfileSettings   onClose={() => setShowSettings(false)}    onChange={p => { setAdvisorProfile(p); saveProfile(p); }} />}
      {showParaManager && <ParagraphManager  onClose={() => setShowParaManager(false)} />}
      {showSaved       && <SavedROAsManager  onLoad={handleLoadROA}                    onClose={() => setShowSaved(false)} />}
      {showAccessCodes && session?.isAdmin && <AccessCodeManager onClose={() => setShowAccessCodes(false)} />}

    </div>
  );
}
