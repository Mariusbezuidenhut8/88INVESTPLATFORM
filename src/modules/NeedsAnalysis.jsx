/**
 * NeedsAnalysis.jsx — Investment ROA Builder v3
 *
 * Landing page for Step 2 (Needs Analysis). Lets the advisor choose between:
 *   - Retirement Planning (RetirementCalculator)
 *   - Savings Goal Planner (GoalCalculator)
 *   - Skip (proceed directly to Decision Tree)
 *
 * Props:
 *   clientProfile  {object}  — from App state
 *   initialData    {object}  — previously saved data (includes calcType)
 *   onChange       {fn}
 *   onComplete     {fn}      — called with calc data when done
 *   onSkip         {fn}      — called when advisor skips
 */

import { useState } from 'react';
import RetirementCalculator from './RetirementCalculator.jsx';
import GoalCalculator       from './GoalCalculator.jsx';

export default function NeedsAnalysis({ clientProfile, initialData = {}, onChange, onComplete, onSkip }) {
  // If coming back to a saved ROA, restore the previously chosen calc type
  const [calcType, setCalcType] = useState(initialData.calcType || null);

  // ── Retirement Calculator ──
  if (calcType === 'retirement') {
    return (
      <RetirementCalculator
        clientProfile={clientProfile}
        initialData={initialData.calcType === 'retirement' ? initialData : {}}
        onChange={data => onChange?.({ ...data, calcType: 'retirement' })}
        onComplete={data => onComplete?.({ ...data, calcType: 'retirement' })}
        onSkip={() => setCalcType(null)}
      />
    );
  }

  // ── Goal Planner ──
  if (calcType === 'goal') {
    return (
      <GoalCalculator
        initialData={initialData.calcType === 'goal' ? initialData : {}}
        onChange={data => onChange?.({ ...data, calcType: 'goal' })}
        onComplete={data => onComplete?.({ ...data, calcType: 'goal' })}
        onBack={() => setCalcType(null)}
      />
    );
  }

  // ── Landing ──
  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-0.5">Financial Needs Analysis</p>
        <h2 className="text-xl font-bold text-gray-800">What type of analysis does this client need?</h2>
        <p className="text-sm text-gray-500 mt-1">Select a calculator, or skip if this is a straightforward investment mandate with no planning required.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">

        <button
          onClick={() => setCalcType('retirement')}
          className="bg-white border-2 border-gray-200 hover:border-blue-400 rounded-xl p-5 text-left transition-all hover:shadow-md group"
        >
          <div className="text-3xl mb-3">🏖️</div>
          <p className="text-base font-bold text-gray-800 group-hover:text-blue-700">Retirement Planning</p>
          <p className="text-xs text-gray-500 mt-2 leading-relaxed">
            Calculate the corpus needed at retirement, assess existing provisions (RA, pension, savings), and determine required monthly contributions to close any shortfall.
          </p>
        </button>

        <button
          onClick={() => setCalcType('goal')}
          className="bg-white border-2 border-gray-200 hover:border-blue-400 rounded-xl p-5 text-left transition-all hover:shadow-md group"
        >
          <div className="text-3xl mb-3">🎯</div>
          <p className="text-base font-bold text-gray-800 group-hover:text-blue-700">Savings Goal Planner</p>
          <p className="text-xs text-gray-500 mt-2 leading-relaxed">
            Work towards a specific financial target — education, property, vehicle, or any once-off goal. Calculates the lump sum or monthly investment required.
          </p>
        </button>

      </div>

      <div className="text-center">
        <button
          onClick={onSkip}
          className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
        >
          Skip — proceed directly to product selection →
        </button>
      </div>
    </div>
  );
}
