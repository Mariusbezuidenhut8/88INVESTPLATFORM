/**
 * productReference.js — Investment ROA Builder v3
 *
 * 2026 Legislative limits, tax rules, and product reference data.
 * UPDATE THIS FILE annually when new Budget limits are announced.
 *
 * Last updated: 2026 Budget / Revenue Laws Amendment Act
 */

// ── TAX YEAR ──────────────────────────────────────────────────────────────
export const TAX_YEAR = {
  year: '2026/2027',
  effectiveDate: '1 March 2026',
  note: 'Verify limits against SARS official publications annually.',
};

// ── RETIREMENT LIMITS ─────────────────────────────────────────────────────
export const RETIREMENT_LIMITS = {
  // Retirement Annuity / Pension Fund deduction
  deductionPercentage: 27.5,         // % of the greater of remuneration or taxable income
  deductionCapRand: 430000,          // R430 000 per year (increased from R350 000)
  deductionCapNote: 'Unused deduction carries forward to future years (no expiry).',

  // Retirement lump sum: one-third at retirement
  lumpSumTaxFreePortionOnDeath: 500000, // R500 000 lifetime tax-free on death
  lumpSumTaxFreeAtRetirement: 550000,   // First R550 000 tax-free (2026) — Retirement Fund Lump Sum benefit table

  // Retirement lump sum tax table (cumulative)
  lumpSumTaxTable: [
    { upTo: 550000,   rate: 0,    base: 0 },
    { upTo: 770000,   rate: 0.18, base: 0 },
    { upTo: 1155000,  rate: 0.27, base: 39600 },
    { upTo: Infinity, rate: 0.36, base: 143550 },
  ],

  // Withdrawal / resignation lump sum tax table (cumulative, stricter)
  withdrawalTaxTable: [
    { upTo: 27500,    rate: 0,    base: 0 },
    { upTo: 726000,   rate: 0.18, base: 0 },
    { upTo: 1089000,  rate: 0.27, base: 125730 },
    { upTo: Infinity, rate: 0.36, base: 223740 },
  ],

  minimumRetirementAge: 55,
  note: 'Tax tables are cumulative across all retirement fund lump sums received in a lifetime.',
};

// ── LIVING ANNUITY RULES ───────────────────────────────────────────────────
export const LIVING_ANNUITY_RULES = {
  minDrawdownPct: 2.5,   // % per annum minimum
  maxDrawdownPct: 17.5,  // % per annum maximum
  drawdownReviewFrequency: 'annual', // can only change at annual policy anniversary
  sustainableDrawdownNote: 'Drawdown above 6% p.a. risks capital depletion. Document sustainability risk.',

  // Commutation thresholds (2026)
  deminimisThreshold: 360000,  // R360 000 — full fund may be commuted at insurer's option
  commutationThreshold: 150000, // R150 000 — full fund may be commuted by member's election
  previousDeminimis: 247500,    // Prior limit for reference
  previousCommutation: 125000,  // Prior limit for reference

  taxTreatment: 'Drawdown payments taxed as ordinary income (PAYE via retirement fund). No CGT within fund.',
  deathBenefit: 'Balance paid to nominated beneficiaries — no estate duty, no executor fees on nominated portion.',
  reg28Applies: true,
  note: '2026: De minimis increased from R247 500 to R360 000. Commutation from R125 000 to R150 000.',
};

// ── TAX-FREE SAVINGS ACCOUNT ───────────────────────────────────────────────
export const TFSA_RULES = {
  annualLimit: 46000,       // R46 000 per year (2026) — increased from R36 000
  lifetimeLimit: 500000,    // R500 000 lifetime
  previousAnnualLimit: 36000,
  overContributionPenalty: '40% tax on over-contributions',
  carryForward: false,       // Unused annual limit CANNOT be carried forward
  taxOnGrowth: false,
  taxOnDividends: false,
  taxOnWithdrawals: false,
  withdrawalEffect: 'Withdrawals do not restore annual or lifetime contribution room.',
  bestFundChoice: 'Growth/equity funds maximise benefit of tax-free compounding.',
  note: '2026: Annual limit increased from R36 000 to R46 000. Verify SARS confirmation of effective date.',
};

// ── ENDOWMENT RULES ────────────────────────────────────────────────────────
export const ENDOWMENT_RULES = {
  taxRateWithinPolicy: 30,        // % — capped at 30% regardless of client rate
  cgtInclusionRate: 40,           // % inclusion within endowment
  effectiveCGTRate: 12,           // 30% × 40% = 12% effective CGT
  restrictionPeriod: 5,           // years
  restrictionExceptions: [
    'Death of policyholder',
    'Disability of policyholder',
    'Insolvency of policyholder',
    'One partial withdrawal allowed during restriction period',
    'One loan facility allowed during restriction period',
  ],
  beneficiaryNomination: true,
  estateBypassOnDeath: true,
  benefitForMarginalRateAbove: 30, // % — endowment beneficial when marginal rate > 30%
  note: 'Confirm TFSA and RA limits are maximised before recommending an endowment.',
};

// ── CAPITAL GAINS TAX ─────────────────────────────────────────────────────
export const CGT_RULES = {
  annualExclusion: 50000,    // R50 000 per year (2026) — increased from R40 000
  deathExclusion: 300000,    // R300 000 in year of death
  primaryResidenceExclusion: 2000000, // R2 000 000 on primary residence
  inclusionRateIndividual: 40,  // % of net capital gain included in taxable income
  inclusionRateCompany: 80,     // % for companies
  inclusionRateTrust: 80,       // % for trusts
  maxEffectiveCGTRate: 18,      // % — at top marginal rate of 45% × 40% = 18%
  previousAnnualExclusion: 40000,
  note: '2026: Annual exclusion increased from R40 000 to R50 000.',
};

// ── INTEREST EXEMPTION ────────────────────────────────────────────────────
export const INTEREST_EXEMPTION = {
  underAge65: 23800,   // R23 800 per year
  age65AndOver: 34500, // R34 500 per year
  foreignInterest: 23800, // same limit applies to foreign interest
  note: 'Interest above exemption is taxed at marginal rate. Applies to bank interest, money market, etc.',
};

// ── INCOME TAX RATES (2026/2027) ───────────────────────────────────────────
export const INCOME_TAX_TABLE = [
  { from: 1,       to: 237100,   rate: 0.18, base: 0,       rebate: 'primary' },
  { from: 237101,  to: 370500,   rate: 0.26, base: 42678,   rebate: 'primary' },
  { from: 370501,  to: 512800,   rate: 0.31, base: 77362,   rebate: 'primary' },
  { from: 512801,  to: 673000,   rate: 0.36, base: 121475,  rebate: 'primary' },
  { from: 673001,  to: 857900,   rate: 0.39, base: 179147,  rebate: 'primary' },
  { from: 857901,  to: 1817000,  rate: 0.41, base: 251258,  rebate: 'primary' },
  { from: 1817001, to: Infinity, rate: 0.45, base: 644489,  rebate: 'primary' },
];

export const TAX_REBATES = {
  primary: 17235,     // All taxpayers
  secondary: 9444,    // Age 65–74
  tertiary: 3145,     // Age 75+
};

export const TAX_THRESHOLDS = {
  underAge65: 95750,
  age65to74: 148217,
  age75Plus: 165689,
};

export const DIVIDENDS_WITHHOLDING_TAX = 20; // % — DWT rate

// ── RSA RETAIL SAVINGS BONDS (2026) ───────────────────────────────────────
export const RSA_BONDS = {
  fixedRates: [
    { term: '2 year', rate: 7.00 },
    { term: '3 year', rate: 7.25 },
    { term: '5 year', rate: 7.50 },
    { term: '10 year', rate: 7.75 },
  ],
  inflationLinked: [
    { term: '3 year', realReturn: 4.75 },
    { term: '5 year', realReturn: 5.00 },
    { term: '10 year', realReturn: 5.00 },
  ],
  minInvestment: 1000,
  maxInvestment: 5000000, // R5 000 000 per bond
  taxTreatment: 'Interest taxed at marginal rate. Interest exemption applies (R23 800 / R34 500).',
  earlyRedemption: 'Partial redemptions allowed after 12 months. Full redemption after 12 months with 30 days notice.',
  creditRisk: 'Zero credit risk — guaranteed by South African Government.',
  purchaseChannels: 'www.rsaretailbonds.gov.za | Postbank | Pick n Pay | Shoprite Checkers',
  note: 'Rates correct as at Q1 2026. Verify current rates at time of recommendation.',
};

// ── PRESERVATION FUND RULES ───────────────────────────────────────────────
export const PRESERVATION_FUND_RULES = {
  oneWithdrawalAllowed: true,
  withdrawalBeforeAge55: 'One withdrawal allowed before age 55 — taxed per withdrawal lump sum table.',
  transferIn: 'Funds transferred in from employer pension/provident fund on resignation/retrenchment.',
  reg28Applies: true,
  taxFreePortionOnTransfer: 'Section 10C: pre-1998 contributions may have a tax-free portion — confirm with fund.',
  retirementAge: 55,
  note: 'Preserves Section 10C tax-free portion. Investigate before recommending transfer.',
};

// ── GUARANTEED ANNUITY REFERENCE ───────────────────────────────────────────
export const GUARANTEED_ANNUITY_REFERENCE = {
  purchaseWith: 'Compulsory funds only (pension/provident/RA at retirement)',
  irreversible: true,
  capitalForfeited: 'Yes — capital surrendered to insurer in exchange for guaranteed income stream.',
  guaranteedTerm: 'Optional: 5, 10, 15 or 20 years — income paid to beneficiary if annuitant dies within term.',
  survivorBenefit: 'Optional: 50%, 66.67% or 100% of original income continues to spouse.',
  escalation: ['Level (0%)', '3%', '5%', 'CPI', 'CPI + fixed %'],
  taxTreatment: 'Income taxed as ordinary income (PAYE). No CGT.',
  commutation: 'Cannot be commuted once purchased (subject to limited exceptions).',
  uniSexRating: 'Gender-neutral pricing required (per constitutional requirements from 2022).',
  providers: ['Old Mutual', 'Sanlam', 'Momentum', 'Discovery', 'Hollard', 'Metropolitan'],
  note: 'Obtain quotes from minimum 3 insurers. Rates are age, health and market-rate dependent.',
};

// ── VOLUNTARY LIFE ANNUITY (Article 10A) ──────────────────────────────────
export const VOLUNTARY_ANNUITY_REFERENCE = {
  fundSource: 'Discretionary (after-tax) savings only',
  article10ATreatment: true,
  capitalReturnTaxFree: 'The portion of each payment attributable to the return of capital is exempt from income tax.',
  incomeTaxable: 'Only the income portion (gain element) is taxable at marginal rate.',
  capitalReturnRatio: 'Determined at inception: purchase price ÷ expected lifetime payments (using actuarial tables).',
  comparedToUnitTrust: 'More tax-efficient than drawing down a unit trust once the fund has grown, for older clients.',
  note: 'Tax computation must be confirmed with the issuing life insurer at inception.',
};

// ── TWO-POT RETIREMENT SYSTEM (effective September 2024) ──────────────────
export const TWO_POT_SYSTEM = {
  effectiveDate: '1 September 2024',
  savingsComponent: {
    portion: '1/3 of new contributions from 1 Sep 2024',
    access: 'One withdrawal per tax year, minimum R2 000',
    tax: 'Withdrawal taxed at marginal rate (PAYE)',
    note: 'Savings pot cannot be used as collateral for a loan.',
  },
  retirementComponent: {
    portion: '2/3 of new contributions from 1 Sep 2024',
    access: 'Locked until retirement (age 55)',
    tax: 'Taxed per retirement lump sum tax table at retirement',
  },
  vestedComponent: {
    description: 'All contributions made before 1 Sep 2024',
    access: 'Subject to old rules — full access on resignation (one withdrawal)',
    seedingAmount: 'R30 000 seeded from vested component to savings component on 1 Sep 2024 (once-off)',
    note: 'Seeded amount taxed at marginal rate when withdrawn.',
  },
  applies: ['RETIREMENT ANNUITY', 'preservation nfund'],
  doesNotApply: ['ENDOWMENT', 'unit trust', 'Tax-Free savings', 'Living Annuity'],
};

// ── EXCHANGE CONTROL (2026) ───────────────────────────────────────────────
export const EXCHANGE_CONTROL = {
  singleDiscretionaryAllowance: {
    amount: 1000000,   // R1 000 000 per calendar year
    sarsApproval: false,
    description: 'No SARS tax clearance required. Can be used for travel, gifts, maintenance, offshore investment.',
  },
  foreignCapitalAllowance: {
    amount: 10000000,  // R10 000 000 per calendar year
    sarsApproval: true,
    description: 'Requires SARS Tax Compliance Status (TCS) "Good Standing" pin. For offshore investment.',
  },
  feederFunds: {
    description: 'Rand-denominated offshore feeder funds — no exchange control approval required.',
    limit: 'None — limited only by fund mandate.',
  },
};

// ── CONVENIENCE: Get limit by key ─────────────────────────────────────────
export const LIMITS = {
  tfsaAnnual:          TFSA_RULES.annualLimit,
  tfsaLifetime:        TFSA_RULES.lifetimeLimit,
  raDeductionPct:      RETIREMENT_LIMITS.deductionPercentage,
  raDeductionCap:      RETIREMENT_LIMITS.deductionCapRand,
  retirementTaxFree:   RETIREMENT_LIMITS.lumpSumTaxFreeAtRetirement,
  laMinDrawdown:       LIVING_ANNUITY_RULES.minDrawdownPct,
  laMaxDrawdown:       LIVING_ANNUITY_RULES.maxDrawdownPct,
  laDeminimis:         LIVING_ANNUITY_RULES.deminimisThreshold,
  laCommutation:       LIVING_ANNUITY_RULES.commutationThreshold,
  cgtAnnualExclusion:  CGT_RULES.annualExclusion,
  interestExemptU65:   INTEREST_EXEMPTION.underAge65,
  interestExempt65:    INTEREST_EXEMPTION.age65AndOver,
  sdaLimit:            EXCHANGE_CONTROL.singleDiscretionaryAllowance.amount,
  fcaLimit:            EXCHANGE_CONTROL.foreignCapitalAllowance.amount,
  endowmentTaxRate:    ENDOWMENT_RULES.taxRateWithinPolicy,
};
