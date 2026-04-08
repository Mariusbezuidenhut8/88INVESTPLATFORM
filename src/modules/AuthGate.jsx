/**
 * AuthGate.jsx
 * Full-screen lock screen. Validates advisor codes against Supabase.
 * Session is stored in localStorage so the advisor stays logged in.
 * Zero client data is ever sent to Supabase.
 */

import { useState } from 'react';
import { validateCode } from '../lib/supabase.js';

const SESSION_KEY = 'roa_session';

export function getSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

function saveSession(advisor) {
  localStorage.setItem(SESSION_KEY, JSON.stringify({
    advisorName: advisor.advisor_name,
    code:        advisor.code,
    isAdmin:     advisor.is_admin,
    loginAt:     new Date().toISOString(),
  }));
}

export default function AuthGate({ onAuth }) {
  const [code,    setCode]    = useState('');
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!code.trim()) return;
    setLoading(true);
    setError('');

    try {
      const advisor = await validateCode(code);
      if (!advisor) {
        setError('Invalid or inactive access code. Please check with your administrator.');
        setLoading(false);
        return;
      }
      saveSession(advisor);
      onAuth({ advisorName: advisor.advisor_name, code: advisor.code, isAdmin: advisor.is_admin });
    } catch (err) {
      setError('Connection error. Please check your internet connection and try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 flex items-center justify-center p-6">
      <div className="w-full max-w-sm">

        {/* Logo / branding */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white shadow-xl mb-5">
            <span className="text-blue-700 font-extrabold text-2xl">R</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">ROA Builder</h1>
          <p className="text-blue-200 text-sm mt-1">Fairbairn Consult</p>
        </div>

        {/* Login card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-base font-bold text-gray-800 mb-1">Enter your access code</h2>
          <p className="text-xs text-gray-400 mb-6">Contact your administrator if you don't have a code.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input
                type="text"
                value={code}
                onChange={e => { setCode(e.target.value); setError(''); }}
                placeholder="e.g. ADV001"
                autoFocus
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm font-mono tracking-widest text-center text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400"
                disabled={loading}
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                <p className="text-xs text-red-600">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !code.trim()}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl py-3 text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  Verifying…
                </span>
              ) : 'Access ROA Builder'}
            </button>
          </form>
        </div>

        <p className="text-center text-blue-300 text-xs mt-6">
          FAIS-compliant · No client data stored in the cloud
        </p>
      </div>
    </div>
  );
}
