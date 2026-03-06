/**
 * ui.js — Investment ROA Builder v3
 *
 * Shared UI utility functions: formatting, validation, display helpers.
 * Import these anywhere in the app to keep formatting consistent.
 *
 * Categories:
 *   Currency / Number formatting
 *   Date formatting
 *   Score / Tier display helpers
 *   Validation helpers
 *   ROA document helpers
 *   Colour / badge helpers
 */

// ══════════════════════════════════════════════════════════════════════
// CURRENCY & NUMBER FORMATTING
// ══════════════════════════════════════════════════════════════════════

/**
 * Format a number as South African Rand.
 * formatCurrency(125000)        → "R 125 000"
 * formatCurrency(125000.50)     → "R 125 000.50"
 * formatCurrency(null)          → "—"
 */
export const formatCurrency = (value, opts = {}) => {
  if (value === null || value === undefined || isNaN(value)) return '—';
  const { decimals = 0, symbol = 'R' } = opts;
  return `${symbol} ${Number(value).toLocaleString('en-ZA', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;
};

/**
 * Format a percentage.
 * formatPct(27.5)  → "27.5%"
 * formatPct(0.275, { isDecimal: true })  → "27.5%"
 */
export const formatPct = (value, opts = {}) => {
  if (value === null || value === undefined || isNaN(value)) return '—';
  const { decimals = 1, isDecimal = false } = opts;
  const pct = isDecimal ? value * 100 : value;
  return `${pct.toFixed(decimals)}%`;
};

/**
 * Format a score (0–5 scale) for display.
 * formatScore(4.375)  → "4.38"
 */
export const formatScore = (score) => {
  if (score === null || score === undefined) return '—';
  return Number(score).toFixed(2);
};

/**
 * Format minimum investment requirement.
 * formatMinInvestment(20000, null)          → "Min lump sum: R 20 000 | No monthly"
 * formatMinInvestment(20000, 500)           → "Min lump sum: R 20 000 | Min monthly: R 500"
 */
export const formatMinInvestment = (lumpSum, monthly) => {
  const ls = lumpSum ? `Min lump sum: ${formatCurrency(lumpSum)}` : null;
  const mo = monthly ? `Min monthly: ${formatCurrency(monthly)}` : null;
  return [ls, mo].filter(Boolean).join(' | ') || '—';
};


// ══════════════════════════════════════════════════════════════════════
// DATE FORMATTING
// ══════════════════════════════════════════════════════════════════════

/**
 * Format a date as "DD Month YYYY" for ROA documents.
 * formatDate(new Date())  → "3 March 2026"
 * formatDate('2026-03-03')  → "3 March 2026"
 */
export const formatDate = (date) => {
  const d = date ? new Date(date) : new Date();
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' });
};

/**
 * Format a date as short "DD/MM/YYYY".
 */
export const formatDateShort = (date) => {
  const d = date ? new Date(date) : new Date();
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-ZA', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

/**
 * Return today's date as ISO string "YYYY-MM-DD".
 */
export const todayISO = () => new Date().toISOString().split('T')[0];

/**
 * Return current year as number.
 */
export const currentYear = () => new Date().getFullYear();


// ══════════════════════════════════════════════════════════════════════
// SCORE & TIER DISPLAY
// ══════════════════════════════════════════════════════════════════════

/**
 * Convert a numeric score (0–5) to a Tier label.
 */
export const scoreToTier = (score) => {
  if (score >= 4.5) return 'Tier 1';
  if (score >= 3.5) return 'Tier 2';
  if (score >= 2.5) return 'Tier 3';
  return 'Tier 4';
};

/**
 * Get Tailwind colour class for a score tier.
 * Used in badges, rank indicators, etc.
 */
export const tierColour = (score) => {
  if (score >= 4.5) return 'bg-green-100 text-green-800 border-green-200';
  if (score >= 3.5) return 'bg-blue-100 text-blue-800 border-blue-200';
  if (score >= 2.5) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
  return 'bg-red-100 text-red-800 border-red-200';
};

/**
 * Get Tailwind colour class for rank position (1st, 2nd, 3rd).
 */
export const rankColour = (rank) => {
  if (rank === 1) return 'bg-amber-100 text-amber-800 border-amber-300';   // gold
  if (rank === 2) return 'bg-slate-100 text-slate-700 border-slate-300';   // silver
  if (rank === 3) return 'bg-orange-100 text-orange-700 border-orange-300'; // bronze
  return 'bg-gray-50 text-gray-600 border-gray-200';
};

/**
 * Ordinal suffix: 1 → "1st", 2 → "2nd", 3 → "3rd", 4 → "4th"
 */
export const ordinal = (n) => {
  const s = ['th','st','nd','rd'];
  const v = n % 100;
  return n + (s[(v-20)%10] || s[v] || s[0]);
};


// ══════════════════════════════════════════════════════════════════════
// PRODUCT KEY / LABEL MAPPING
// ══════════════════════════════════════════════════════════════════════

export const PRODUCT_LABELS = {
  'RETIREMENT ANNUITY':   'Retirement Annuity (RA)',
  'ENDOWMENT':            'Endowment Policy',
  'Living Annuity':       'Living Annuity',
  'unit trust':           'Unit Trust / Investment Account',
  'preservation nfund':   'Preservation Fund',
  'Tax-Free savings':     'Tax-Free Savings Account (TFSA)',
  'FIXED DEPOSIT':        'Fixed Deposit',
  'RSA BONDS':            'RSA Retail Savings Bond',
  'MONEY MARKET':         'Money Market / Call Account',
  'GUARANTEED LIFE ANNUITY': 'Guaranteed Life Annuity',
  'VOLUNTARY LIFE ANNUITY':  'Voluntary Life Annuity',
  'OFFSHORE UNIT TRUST':     'Offshore Unit Trust / Feeder Fund',
  'ETF':                     'Exchange Traded Fund (ETF)',
};

/**
 * Get a display label for a product key.
 * getProductLabel('unit trust')  → "Unit Trust / Investment Account"
 */
export const getProductLabel = (key) => PRODUCT_LABELS[key] || key;

/**
 * Short product abbreviation for compact display.
 */
export const PRODUCT_SHORT = {
  'RETIREMENT ANNUITY':   'RA',
  'ENDOWMENT':            'Endowment',
  'Living Annuity':       'Living Annuity',
  'unit trust':           'Unit Trust',
  'preservation nfund':   'Preservation',
  'Tax-Free savings':     'TFSA',
  'FIXED DEPOSIT':        'Fixed Deposit',
  'RSA BONDS':            'RSA Bond',
  'MONEY MARKET':         'Money Market',
  'GUARANTEED LIFE ANNUITY': 'Guaranteed Annuity',
  'VOLUNTARY LIFE ANNUITY':  'Voluntary Annuity',
  'OFFSHORE UNIT TRUST':     'Offshore Unit Trust',
  'ETF':                     'ETF',
};

export const getProductShort = (key) => PRODUCT_SHORT[key] || key;

/**
 * The 6 scoreable product keys (match providerDB.js exactly).
 */
export const SCOREABLE_PRODUCTS = [
  'RETIREMENT ANNUITY',
  'ENDOWMENT',
  'Living Annuity',
  'unit trust',
  'preservation nfund',
  'Tax-Free savings',
];

export const isScoreable = (productKey) => SCOREABLE_PRODUCTS.includes(productKey);


// ══════════════════════════════════════════════════════════════════════
// VALIDATION HELPERS
// ══════════════════════════════════════════════════════════════════════

/**
 * Check that a required string field is not empty.
 */
export const isRequired = (val) => val !== null && val !== undefined && String(val).trim() !== '';

/**
 * Check that a value is a positive number.
 */
export const isPositive = (val) => !isNaN(val) && Number(val) > 0;

/**
 * Check that a value is a number within a range (inclusive).
 */
export const inRange = (val, min, max) => !isNaN(val) && Number(val) >= min && Number(val) <= max;

/**
 * Check that an amount does not exceed the TFSA annual limit.
 * Returns { ok: true } or { ok: false, message: string }
 */
export const validateTFSAContribution = (amount, annualLimit = 46000) => {
  if (!isPositive(amount)) return { ok: false, message: 'Amount must be a positive number.' };
  if (Number(amount) > annualLimit) {
    return {
      ok: false,
      message: `Amount of ${formatCurrency(amount)} exceeds the ${currentYear()} TFSA annual limit of ${formatCurrency(annualLimit)}. An over-contribution penalty of 40% applies on the excess.`,
    };
  }
  return { ok: true };
};

/**
 * Check that a living annuity drawdown rate is within FSCA limits.
 */
export const validateDrawdown = (pct) => {
  if (!isPositive(pct)) return { ok: false, message: 'Drawdown must be a positive percentage.' };
  if (Number(pct) < 2.5) return { ok: false, message: 'Minimum drawdown is 2.5% per annum (FSCA regulation).' };
  if (Number(pct) > 17.5) return { ok: false, message: 'Maximum drawdown is 17.5% per annum (FSCA regulation).' };
  return { ok: true };
};

/**
 * Validate an email address (basic).
 */
export const isValidEmail = (val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(val).trim());

/**
 * Validate a South African phone number (basic — 10 digits, may start with +27).
 */
export const isValidPhone = (val) => {
  const clean = String(val).replace(/[\s\-()]/g, '');
  return /^(\+27|0)[0-9]{9}$/.test(clean);
};

/**
 * Validate a FSCA FSP number (format: XXXXX or similar numeric).
 */
export const isValidFSP = (val) => /^[0-9]{1,6}$/.test(String(val).trim());


// ══════════════════════════════════════════════════════════════════════
// ROA DOCUMENT HELPERS
// ══════════════════════════════════════════════════════════════════════

/**
 * Build a document reference number.
 * buildRefNumber('ROA', advisorFSP, clientSurname, date)
 *   → "ROA-45678-SMITH-20260303"
 */
export const buildRefNumber = (prefix = 'ROA', fsp = '', surname = '', date = null) => {
  const d = date ? new Date(date) : new Date();
  const dateStr = d.toISOString().split('T')[0].replace(/-/g, '');
  const surnameClean = surname.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 8);
  return [prefix, fsp, surnameClean, dateStr].filter(Boolean).join('-');
};

/**
 * Truncate a string to maxLen characters, appending "…" if needed.
 */
export const truncate = (str, maxLen = 60) => {
  if (!str) return '';
  return str.length > maxLen ? str.slice(0, maxLen - 1) + '…' : str;
};

/**
 * Capitalise first letter of each word.
 */
export const titleCase = (str) => {
  if (!str) return '';
  return str.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
};

/**
 * Convert a camelCase or snake_case key to a readable label.
 * toLabel('clientNeeds')  → "Client Needs"
 * toLabel('reg28')        → "Reg 28"
 */
export const toLabel = (key) => {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
};

/**
 * Build initials from a full name.
 * initials('John Smith')  → "JS"
 */
export const initials = (name) => {
  if (!name) return '';
  return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 3);
};


// ══════════════════════════════════════════════════════════════════════
// RISK PROFILE HELPERS
// ══════════════════════════════════════════════════════════════════════

export const RISK_PROFILES = [
  { value: 'conservative',    label: 'Conservative',        colour: 'bg-blue-100 text-blue-800',    score: 1 },
  { value: 'moderate',        label: 'Moderate',            colour: 'bg-teal-100 text-teal-800',    score: 2 },
  { value: 'moderate_growth', label: 'Moderate Growth',     colour: 'bg-green-100 text-green-800',  score: 3 },
  { value: 'growth',          label: 'Growth',              colour: 'bg-yellow-100 text-yellow-800',score: 4 },
  { value: 'aggressive',      label: 'Aggressive Growth',   colour: 'bg-red-100 text-red-800',      score: 5 },
];

export const getRiskProfile = (value) =>
  RISK_PROFILES.find((r) => r.value === value) || RISK_PROFILES[1];

export const getRiskColour = (value) => getRiskProfile(value).colour;


// ══════════════════════════════════════════════════════════════════════
// MISC
// ══════════════════════════════════════════════════════════════════════

/**
 * Generate a simple UUID-like string for client-side unique IDs.
 */
export const uid = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

/**
 * Deep clone an object (JSON-safe values only).
 */
export const deepClone = (obj) => JSON.parse(JSON.stringify(obj));

/**
 * Check if an object is empty.
 */
export const isEmpty = (obj) =>
  obj === null || obj === undefined ||
  (typeof obj === 'object' && Object.keys(obj).length === 0) ||
  (typeof obj === 'string' && obj.trim() === '');

/**
 * Debounce a function.
 */
export const debounce = (fn, delay = 300) => {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
};
