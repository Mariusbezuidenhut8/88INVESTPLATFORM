import { useState, useCallback, useMemo } from 'react';
import { saveProfile, loadProfile } from '../shared/storage.js';
import { isValidEmail, isValidPhone } from '../shared/ui.js';
import { getAllProviderNames } from '../data/providerDB.js';

function Field({ label, value, onChange, type='text', placeholder='', hint, error, required }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1">
        {label}{required && <span className="text-red-400 ml-1">*</span>}
      </label>
      <input type={type} value={value||''} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className={`w-full text-sm border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 ${error?'border-red-300 bg-red-50':'border-gray-200'}`} />
      {error && <p className="text-xs text-red-500 mt-0.5">{error}</p>}
      {hint && !error && <p className="text-xs text-gray-400 mt-0.5">{hint}</p>}
    </div>
  );
}

function Toggle({ label, description, value, onChange }) {
  return (
    <div className="flex items-center justify-between py-2">
      <div><p className="text-sm font-medium text-gray-700">{label}</p><p className="text-xs text-gray-400">{description}</p></div>
      <div onClick={() => onChange(!value)} className={`w-11 h-6 rounded-full flex items-center px-0.5 cursor-pointer flex-shrink-0 ${value!==false?'bg-blue-500':'bg-gray-300'}`}>
        <div className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${value!==false?'translate-x-5':'translate-x-0'}`} />
      </div>
    </div>
  );
}

// ── Platform Provider selector ─────────────────────────────────────────────
const ALL_PROVIDERS = getAllProviderNames();

function ProviderSelector({ activeProviders, onChange }) {
  const activeSet = useMemo(
    () => new Set(activeProviders?.length ? activeProviders : ALL_PROVIDERS),
    [activeProviders]
  );
  const activeCount = activeSet.size;

  const toggle = (name) => {
    const next = new Set(activeSet);
    if (next.has(name)) next.delete(name); else next.add(name);
    const arr = [...next];
    onChange(arr.length === ALL_PROVIDERS.length ? [] : arr);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-5 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-gray-700">Platform Providers</p>
          <p className="text-xs text-gray-400 mt-0.5">Only ticked providers appear in the scoring matrix. Untick providers not on your approved panel.</p>
        </div>
        <span className="text-xs font-semibold text-blue-600 bg-blue-50 border border-blue-200 rounded-full px-2.5 py-0.5 ml-3 flex-shrink-0">
          {activeCount} / {ALL_PROVIDERS.length} active
        </span>
      </div>
      <div className="px-5 py-4">
        <div className="flex gap-3 mb-3">
          <button onClick={() => onChange([])}
            className="text-xs text-blue-600 hover:text-blue-800 underline">Select all</button>
          <button onClick={() => onChange([ALL_PROVIDERS[0]])}
            className="text-xs text-gray-400 hover:text-gray-600 underline">Deselect all</button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-60 overflow-y-auto pr-1">
          {ALL_PROVIDERS.map(name => {
            const on = activeSet.has(name);
            return (
              <label key={name} className={`flex items-center gap-2 rounded-lg border px-2.5 py-1.5 cursor-pointer transition-colors text-xs select-none ${on ? 'border-blue-200 bg-blue-50 text-blue-800' : 'border-gray-200 bg-gray-50 text-gray-400'}`}>
                <input type="checkbox" checked={on} onChange={() => toggle(name)} className="accent-blue-600 flex-shrink-0" />
                <span className="truncate font-medium">{name}</span>
              </label>
            );
          })}
        </div>
        {activeProviders?.length > 0 && (
          <p className="text-xs text-amber-600 mt-3 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
            {activeProviders.length} of {ALL_PROVIDERS.length} providers active — only these will be scored and recommended.
          </p>
        )}
      </div>
    </div>
  );
}

export default function ProfileSettings({ onClose, onChange }) {
  const [profile, setProfile] = useState(loadProfile());
  const [errors,  setErrors]  = useState({});
  const [saved,   setSaved]   = useState(false);
  const [hvInput, setHvInput] = useState('');

  const set = useCallback((field, value) => {
    setProfile(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => { const e={...prev}; delete e[field]; return e; });
  }, [errors]);

  const validate = () => {
    const e = {};
    if (!profile.practiceName?.trim()) e.practiceName = 'Required';
    if (!profile.advisorName?.trim())  e.advisorName  = 'Required';
    if (!profile.fspNumber?.trim())    e.fspNumber    = 'Required';
    if (profile.email && !isValidEmail(profile.email)) e.email = 'Invalid email';
    if (profile.phone && !isValidPhone(profile.phone)) e.phone = 'Invalid phone';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    saveProfile(profile);
    if (onChange) onChange(profile);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const addHouseView = () => {
    const v = hvInput.trim();
    if (!v) return;
    set('houseViews', [...(profile.houseViews||[]), { id: Date.now(), text: v, active: true }]);
    setHvInput('');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-end sm:items-center justify-center z-40 p-0 sm:p-4">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col" style={{maxHeight:'90vh'}}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <h2 className="font-bold text-gray-800">Practice Settings</h2>
          <div className="flex items-center gap-3">
            {saved && <span className="text-xs text-green-600 font-semibold bg-green-50 rounded-full px-2 py-0.5">Saved</span>}
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">x</button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-3 bg-gray-50 border-b border-gray-100"><p className="text-sm font-semibold text-gray-700">Practice Details</p></div>
            <div className="px-5 py-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <Field label="Practice / FSP Name" value={profile.practiceName} onChange={v=>set('practiceName',v)} required error={errors.practiceName} placeholder="ABC Wealth Management" />
                <Field label="FSP Licence Number"  value={profile.fspNumber}    onChange={v=>set('fspNumber',v)}    required error={errors.fspNumber}    placeholder="12345" hint="FSCA FSP number" />
                <Field label="Advisor Name"        value={profile.advisorName}  onChange={v=>set('advisorName',v)}  required error={errors.advisorName}  placeholder="Jane Smith CFP" />
                <Field label="Phone"               value={profile.phone}        onChange={v=>set('phone',v)}        type="tel"   error={errors.phone}   placeholder="011 123 4567" />
                <Field label="Email"               value={profile.email}        onChange={v=>set('email',v)}        type="email" error={errors.email}   placeholder="advisor@practice.co.za" />
              </div>
              <Field label="Office Address" value={profile.address} onChange={v=>set('address',v)} placeholder="123 Main St, Sandton, 2196" />
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-3 bg-gray-50 border-b border-gray-100"><p className="text-sm font-semibold text-gray-700">Practice Logo</p></div>
            <div className="px-5 py-4">
              <Field label="Logo URL" value={profile.logoUrl} onChange={v=>set('logoUrl',v)} placeholder="https://your-practice.co.za/logo.png" hint="URL to your logo. Shown on printed ROA header." />
              {profile.logoUrl && <div className="mt-3 p-3 bg-gray-50 rounded-lg inline-block"><img src={profile.logoUrl} alt="Logo preview" className="h-10 object-contain" onError={e=>{e.target.style.display='none'}} /></div>}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-3 bg-gray-50 border-b border-gray-100"><p className="text-sm font-semibold text-gray-700">Default Fee Settings</p></div>
            <div className="px-5 py-4">
              <p className="text-xs text-gray-500 mb-4">Pre-populate fee disclosure forms. Override per ROA as needed.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Default Initial Fee</label>
                  <div className="relative"><input type="number" step="0.1" min="0" max="10" value={profile.defaultInitialFee||''} onChange={e=>set('defaultInitialFee',e.target.value)} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 pr-7 focus:outline-none focus:ring-2 focus:ring-blue-400 text-right" /><span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400">%</span></div>
                  <p className="text-xs text-gray-400 mt-0.5">% of lump sum (incl. VAT)</p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Default Ongoing Fee</label>
                  <div className="relative"><input type="number" step="0.1" min="0" max="10" value={profile.defaultAdvisorFee||'0.5'} onChange={e=>set('defaultAdvisorFee',e.target.value)} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 pr-7 focus:outline-none focus:ring-2 focus:ring-blue-400 text-right" /><span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400">%</span></div>
                  <p className="text-xs text-gray-400 mt-0.5">% p.a. of portfolio value (incl. VAT)</p>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-2">Default Fee Frequency</label>
                <div className="flex gap-2">
                  {['monthly','quarterly','annually'].map(f=>(
                    <button key={f} onClick={()=>set('defaultFeeFrequency',f)} className={`text-xs px-3 py-1.5 rounded-lg border capitalize ${profile.defaultFeeFrequency===f?'border-blue-400 bg-blue-50 text-blue-700 font-semibold':'border-gray-200 text-gray-500 hover:bg-gray-50'}`}>{f}</button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-3 bg-gray-50 border-b border-gray-100"><p className="text-sm font-semibold text-gray-700">House Views</p></div>
            <div className="px-5 py-4">
              <p className="text-xs text-gray-500 mb-3">Practice house views available as quick-inserts in the content builder.</p>
              <div className="space-y-2 mb-3">
                {(profile.houseViews||[]).map(v=>(
                  <div key={v.id} className={`flex items-start gap-2 rounded-lg border px-3 py-2 ${v.active?'border-green-200 bg-green-50':'border-gray-200 bg-gray-50 opacity-60'}`}>
                    <p className="text-xs text-gray-700 flex-1">{v.text}</p>
                    <button onClick={()=>set('houseViews',(profile.houseViews||[]).map(hv=>hv.id===v.id?{...hv,active:!hv.active}:hv))} className={`text-xs px-2 py-0.5 rounded border flex-shrink-0 ${v.active?'border-green-300 text-green-600':'border-gray-200 text-gray-400'}`}>{v.active?'On':'Off'}</button>
                    <button onClick={()=>set('houseViews',(profile.houseViews||[]).filter(hv=>hv.id!==v.id))} className="text-xs text-gray-300 hover:text-red-400 flex-shrink-0">x</button>
                  </div>
                ))}
                {!(profile.houseViews?.length)&&<p className="text-xs text-gray-400 italic">No house views yet.</p>}
              </div>
              <div className="flex gap-2">
                <input value={hvInput} onChange={e=>setHvInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&addHouseView()} placeholder="Add a house view and press Enter..." className="flex-1 text-xs border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-400" />
                <button onClick={addHouseView} className="text-xs bg-gray-800 text-white px-3 py-2 rounded-lg hover:bg-gray-700">Add</button>
              </div>
            </div>
          </div>

          <ProviderSelector activeProviders={profile.activeProviders} onChange={v => set('activeProviders', v)} />

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-3 bg-gray-50 border-b border-gray-100"><p className="text-sm font-semibold text-gray-700">App Settings</p></div>
            <div className="px-5 py-2">
              <Toggle label="Auto-save drafts"     description="Save ROA progress automatically" value={profile.autoSave}             onChange={v=>set('autoSave',v)} />
              <Toggle label="Show 2026 limits bar" description="Quick-reference limits in decision tree" value={profile.showLimitsBar!==false} onChange={v=>set('showLimitsBar',v)} />
            </div>
          </div>

        </div>
        <div className="px-6 py-4 border-t border-gray-100 flex-shrink-0 flex items-center justify-between gap-3">
          <p className="text-xs text-gray-400">Settings saved to browser storage.</p>
          <div className="flex gap-3">
            <button onClick={onClose} className="text-sm text-gray-500 border border-gray-200 px-4 py-2 rounded-lg hover:bg-gray-50">Cancel</button>
            <button onClick={handleSave} className="text-sm bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2 rounded-lg">Save Settings</button>
          </div>
        </div>
      </div>
    </div>
  );
}
