/**
 * productTree.js — Investment ROA Builder v3
 * Source: Comprehensive Afrikaans decision tree PDF (26 pages)
 *
 * Complete 5-step investment product decision tree.
 * Each node has: id, question, options → each option leads to next node or recommendation.
 *
 * STRUCTURE:
 *   - id: unique node identifier
 *   - type: 'question' | 'recommendation' | 'branch'
 *   - question: text shown to user
 *   - context: optional explanatory note
 *   - options: array of { label, value, next, flags }
 *   - recommendation: (on terminal nodes) { productKey, productLabel, rationale, flags }
 *
 * PRODUCT KEYS (match providerDB.js):
 *   'RETIREMENT ANNUITY' | 'ENDOWMENT' | 'Living Annuity' | 'unit trust'
 *   'preservation nfund' | 'Tax-Free savings'
 *   + extended: 'FIXED DEPOSIT' | 'RSA BONDS' | 'MONEY MARKET'
 *   | 'GUARANTEED LIFE ANNUITY' | 'VOLUNTARY LIFE ANNUITY'
 *
 * To update: find the node by id and change question, options or recommendation.
 */

export const DECISION_TREE = {

  // ═══════════════════════════════════════════════════════════════════
  // ROOT — Step 1: Primary Investment Goal
  // ═══════════════════════════════════════════════════════════════════
  root: {
    id: 'root',
    type: 'question',
    step: 1,
    stepLabel: 'Primary Goal',
    question: 'What is the client\'s primary investment objective?',
    context: 'This is the fundamental split in the decision tree. All subsequent questions flow from this answer.',
    options: [
      { label: 'Capital Growth / Wealth Accumulation', value: 'growth', next: 'growth_horizon' },
      { label: 'Income / Retirement Income', value: 'income', next: 'income_source' },
      { label: 'Comprehensive Portfolio Allocation — optimise a lump sum across multiple tax-efficient vehicles', value: 'lump_alloc', next: 'lump_alloc_tfsa' },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════
  // CAPITAL GROWTH PATH
  // ═══════════════════════════════════════════════════════════════════

  // Step 1.1 — Time Horizon
  growth_horizon: {
    id: 'growth_horizon',
    type: 'question',
    step: 2,
    stepLabel: 'Time Horizon',
    question: 'What is the client\'s investment time horizon?',
    context: 'Short-term horizons preclude market-linked products due to volatility risk. Investments under 2 years should prioritise capital preservation.',
    options: [
      { label: '0–2 years (Short-term)', value: 'short', next: 'short_term_branch' },
      { label: '3–5 years (Medium-term)', value: 'medium', next: 'growth_retirement' },
      { label: '5+ years (Long-term)', value: 'long', next: 'growth_retirement' },
    ],
  },

  // Short-term branch
  short_term_branch: {
    id: 'short_term_branch',
    type: 'question',
    step: 2,
    stepLabel: 'Short-Term Preference',
    question: 'For the short-term period, what is the client\'s preference?',
    context: 'Short-term investors should avoid market-linked products. Options include guaranteed return vehicles.',
    options: [
      { label: 'Guaranteed fixed return (certainty)', value: 'fixed', next: 'fixed_deposit_rec' },
      { label: 'Inflation-linked government guarantee', value: 'rsa', next: 'rsa_bonds_rec' },
      { label: 'Highest liquidity / instant access', value: 'liquid', next: 'money_market_rec' },
    ],
  },

  fixed_deposit_rec: {
    id: 'fixed_deposit_rec',
    type: 'recommendation',
    recommendation: {
      productKey: 'FIXED DEPOSIT',
      productLabel: 'Fixed Deposit',
      rationale: 'The client\'s short time horizon (0–2 years) and preference for capital certainty make a fixed deposit the most appropriate vehicle. Fixed deposits offer guaranteed returns for a defined period with no market exposure. Competitive rates are currently available (up to 7.99% p.a. as at 2026). Note: early withdrawal penalties may apply.',
      outsideScoreModel: true,
      outsideNote: 'Fixed deposits are sourced directly from banks. Provider selection falls outside the platform scoring model — advisor to source competitive rates independently from ABSA, Nedbank, Standard Bank, FNB, Investec or other accredited institutions.',
      flags: ['short_term', 'capital_guarantee', 'no_market_risk'],
    },
  },

  rsa_bonds_rec: {
    id: 'rsa_bonds_rec',
    type: 'recommendation',
    recommendation: {
      productKey: 'RSA BONDS',
      productLabel: 'RSA Retail Savings Bonds',
      rationale: 'The client\'s short-to-medium time horizon and preference for government-guaranteed inflation protection make RSA Retail Savings Bonds appropriate. Available in 2, 3 and 5 year fixed terms (7.00%–7.75% p.a.) and inflation-linked (4.75%–5.00% above CPI) as at 2026. Issued directly by National Treasury — zero credit risk.',
      outsideScoreModel: true,
      outsideNote: 'RSA Retail Savings Bonds are purchased directly via www.rsaretailbonds.gov.za or Postbank. No platform or commission fees. Not on provider scoring model.',
      flags: ['short_term', 'government_guarantee', 'inflation_linked_option'],
    },
  },

  money_market_rec: {
    id: 'money_market_rec',
    type: 'recommendation',
    recommendation: {
      productKey: 'MONEY MARKET',
      productLabel: 'Money Market / Call Account',
      rationale: 'The client requires maximum liquidity over a short horizon. A money market fund or call account provides instant access, capital stability and competitive short-term returns. Interest exempt up to R23 800 (under 65) or R34 500 (65+) per annum (2026). Suitable as an emergency fund or short-term parking.',
      outsideScoreModel: false,
      flags: ['short_term', 'full_liquidity', 'capital_stable'],
    },
  },

  // Step 1.2 — Retirement-focused?
  growth_retirement: {
    id: 'growth_retirement',
    type: 'question',
    step: 3,
    stepLabel: 'Retirement Focus',
    question: 'Is the investment specifically for retirement savings?',
    context: 'Retirement-specific savings qualify for significant tax deductions (27.5% of taxable income, capped at R430 000 p.a. in 2026) and benefit from Regulation 28 asset allocation protection.',
    options: [
      { label: 'Yes — primarily for retirement', value: 'yes', next: 'ra_rec' },
      { label: 'No — general wealth accumulation', value: 'no', next: 'growth_tfsa_check' },
    ],
  },

  ra_rec: {
    id: 'ra_rec',
    type: 'recommendation',
    recommendation: {
      productKey: 'RETIREMENT ANNUITY',
      productLabel: 'Retirement Annuity (RA)',
      rationale: 'The client\'s primary goal is retirement savings over a medium-to-long horizon. A Retirement Annuity is the most tax-efficient retirement accumulation vehicle available: contributions are tax-deductible up to 27.5% of taxable income (capped at R430 000 p.a. — 2026 limit), growth accumulates tax-free within the fund, and no CGT applies. Regulation 28 provides diversification protection. Minimum retirement age: 55. At retirement, one-third may be taken as a lump sum (first R550 000 tax-free — 2026). The remaining two-thirds must be used to purchase an annuity. Two-pot system applies from 2024: one third of new contributions accessible (savings component), two-thirds preserved (retirement component).',
      flags: ['retirement', 'tax_deductible', 'reg28', 'illiquid_to_55', 'two_pot'],
    },
  },

  // Step 1.3 — TFSA check
  growth_tfsa_check: {
    id: 'growth_tfsa_check',
    type: 'question',
    step: 3,
    stepLabel: 'Tax-Free Savings',
    question: 'Does the client have an existing Tax-Free Savings Account (TFSA)?',
    context: 'The TFSA annual limit increased to R46 000 in 2026 (from R36 000), with a R500 000 lifetime limit. If the client has not yet maximised their TFSA, this should almost always be considered first for discretionary savings due to zero tax on growth, dividends and withdrawals.',
    options: [
      { label: 'No TFSA — or existing TFSA not yet at annual limit', value: 'no_tfsa', next: 'tfsa_rec' },
      { label: 'TFSA at annual limit (R46 000 already contributed this year)', value: 'maxed', next: 'growth_tax_rate' },
      { label: 'TFSA at lifetime limit (R500 000 contributed)', value: 'lifetime_max', next: 'growth_tax_rate' },
    ],
  },

  tfsa_rec: {
    id: 'tfsa_rec',
    type: 'recommendation',
    recommendation: {
      productKey: 'Tax-Free savings',
      productLabel: 'Tax-Free Savings Account (TFSA)',
      rationale: 'The client should maximise their Tax-Free Savings Account before considering other discretionary vehicles. The TFSA allows tax-free growth, dividends and withdrawals with no CGT. The 2026 annual limit is R46 000 (increased from R36 000) and the lifetime limit is R500 000. Over-contributions attract a 40% penalty tax — strict limit monitoring required. Any unused annual limit is lost and cannot be carried forward. Withdrawals reduce remaining lifetime contribution room. Optimal fund selection (equity/growth funds) within the TFSA maximises the tax-free compounding benefit.',
      flags: ['tfsa', 'tax_free_growth', 'annual_limit_r46000', 'lifetime_limit_r500000', 'flexible_withdrawal'],
    },
  },

  // Step 1.4 — Marginal tax rate / endowment check
  growth_tax_rate: {
    id: 'growth_tax_rate',
    type: 'question',
    step: 4,
    stepLabel: 'Tax Rate & Flexibility',
    question: 'What is the client\'s marginal tax rate, and what level of liquidity is required?',
    context: 'An Endowment is beneficial for clients with a marginal tax rate above 30% (the Endowment tax rate). The 5-year restriction period must be acceptable. For clients requiring full flexibility or with lower tax rates, a Unit Trust / discretionary investment is typically more appropriate.',
    options: [
      {
        label: 'Marginal tax rate above 30% AND client can accept 5-year restriction period',
        value: 'high_tax_locked',
        next: 'endowment_rec',
      },
      {
        label: 'Full flexibility required OR marginal tax rate ≤ 30%',
        value: 'flexible',
        next: 'growth_geography',
      },
    ],
  },

  endowment_rec: {
    id: 'endowment_rec',
    type: 'recommendation',
    recommendation: {
      productKey: 'ENDOWMENT',
      productLabel: 'Endowment Policy',
      rationale: 'The client\'s marginal tax rate exceeds 30% and they can accommodate the 5-year restriction period. An Endowment is tax-efficient for high-income earners: tax within the policy is capped at 30% (vs the client\'s higher marginal rate), resulting in a tax saving on income and dividends. CGT within the endowment is taxed at an effective 12% (30% × 40% inclusion rate). The 5-year restriction limits withdrawals but the policy allows one withdrawal and one loan during the restriction period. Beneficiary nomination facilitates estate planning and avoids executor fees. Note: confirm TFSA annual limit has been maximised before recommending an endowment.',
      flags: ['endowment', 'tax_capped_30pct', 'five_year_restriction', 'beneficiary_nomination', 'estate_planning'],
    },
  },

  // Step 1.5 — Geography
  growth_geography: {
    id: 'growth_geography',
    type: 'question',
    step: 5,
    stepLabel: 'Geography',
    question: 'What geographic exposure does the client require?',
    context: 'Local unit trusts are subject to SA tax. Offshore exposure can be achieved via Rand-denominated feeder funds (no exchange control required) or by utilising the R1 000 000 Single Discretionary Allowance or R10 000 000 Foreign Capital Allowance for direct offshore investment.',
    options: [
      { label: 'South African (local) investment', value: 'local', next: 'unit_trust_local_rec' },
      { label: 'Offshore exposure via feeder fund (Rand-denominated)', value: 'feeder', next: 'unit_trust_feeder_rec' },
      { label: 'Direct offshore (SDA or FCA allowance)', value: 'offshore', next: 'offshore_rec' },
    ],
  },

  unit_trust_local_rec: {
    id: 'unit_trust_local_rec',
    type: 'recommendation',
    recommendation: {
      productKey: 'unit trust',
      productLabel: 'Unit Trust (SA — Discretionary)',
      rationale: 'The client requires full flexibility, has maximised their TFSA, and either has a marginal tax rate at or below 30% or requires liquidity. A South African unit trust provides full flexibility (no lock-up period), access to a wide range of asset managers and fund mandates, and daily liquidity. CGT exclusion of R50 000 applies annually (2026). Tax is payable at the client\'s marginal rate on income distributions. Capital gains trigger CGT at effective rate of marginal rate × 40% inclusion rate.',
      flags: ['unit_trust', 'local', 'fully_liquid', 'cgt_applicable', 'income_tax_on_distributions'],
    },
  },

  unit_trust_feeder_rec: {
    id: 'unit_trust_feeder_rec',
    type: 'recommendation',
    recommendation: {
      productKey: 'unit trust',
      productLabel: 'Unit Trust — Offshore Feeder Fund (Rand-denominated)',
      rationale: 'The client requires offshore exposure without foreign exchange control complexity. A Rand-denominated offshore feeder fund provides exposure to global markets, currencies and asset classes via a SA-registered unit trust — no exchange control approval required, no foreign tax forms. Tax is payable in South Africa at the client\'s marginal rate. CGT exclusion of R50 000 applies. Annual exclusion from foreign income: R1 250 000 exemption for foreign dividends does not apply — all taxable as SA income.',
      flags: ['unit_trust', 'offshore_feeder', 'rand_denominated', 'global_exposure', 'no_exchange_control'],
    },
  },

  offshore_rec: {
    id: 'offshore_rec',
    type: 'recommendation',
    recommendation: {
      productKey: 'unit trust',
      productLabel: 'Direct Offshore Investment (SDA / FCA)',
      rationale: 'The client wishes to externalise capital. The Single Discretionary Allowance (SDA) of R1 000 000 per calendar year requires no SARS approval. The Foreign Capital Allowance (FCA) of R10 000 000 per year requires a SARS tax clearance certificate. Foreign investments are subject to SA tax on worldwide income. Foreign tax credits may apply. Exchange rate movements impact Rand-equivalent values. Recommend using a FSCA-licensed offshore platform or reputable global custodian.',
      outsideScoreModel: true,
      outsideNote: 'Direct offshore investments fall outside the SA provider scoring model. Advisor to source appropriate offshore platform (e.g. Allan Gray Offshore, Ninety One Global, discretionary offshore manager) in line with client\'s risk profile and FCA/SDA allowances.',
      flags: ['offshore', 'direct', 'sda_fca', 'exchange_control', 'foreign_tax_credit'],
    },
  },

  // ═══════════════════════════════════════════════════════════════════
  // INCOME PATH — Step 2
  // ═══════════════════════════════════════════════════════════════════

  income_source: {
    id: 'income_source',
    type: 'question',
    step: 2,
    stepLabel: 'Income Source',
    question: 'What is the source of the funds to be invested for income?',
    context: 'Compulsory funds (from a pension/provident fund or RA at retirement) have specific annuity requirements under the Income Tax Act. Discretionary savings (after-tax money) have different tax treatment.',
    options: [
      { label: 'Compulsory funds — from pension/provident fund or RA at retirement', value: 'compulsory', next: 'income_annuity_type' },
      { label: 'Discretionary funds — own after-tax savings', value: 'discretionary', next: 'voluntary_annuity_rec' },
    ],
  },

  // Step 2.1 — Compulsory: Living vs Guaranteed Annuity
  income_annuity_type: {
    id: 'income_annuity_type',
    type: 'question',
    step: 3,
    stepLabel: 'Annuity Type',
    question: 'Does the client prefer market-linked income with flexibility, or guaranteed income for life?',
    context: 'This is the most critical retirement income decision. A Living Annuity offers flexibility and leaves capital to beneficiaries but carries investment and longevity risk. A Guaranteed Life Annuity offers certainty and cannot be outlived but the capital is surrendered to the insurer. Many clients use a blended approach.',
    options: [
      { label: 'Market-linked income with flexibility (Living Annuity)', value: 'living', next: 'living_annuity_detail' },
      { label: 'Guaranteed income for life (Guaranteed Life Annuity)', value: 'guaranteed', next: 'guaranteed_annuity_detail' },
      { label: 'Blended: part Living, part Guaranteed', value: 'blended', next: 'blended_annuity_rec' },
    ],
  },

  // Step 2.1a — Living Annuity detail
  living_annuity_detail: {
    id: 'living_annuity_detail',
    type: 'question',
    step: 4,
    stepLabel: 'Living Annuity Parameters',
    question: 'What drawdown level is the client expecting?',
    context: 'The minimum drawdown is 2.5% p.a. and maximum is 17.5% p.a. The sustainable withdrawal rate is generally considered to be 4%–6% p.a. to avoid capital depletion. At the de minimis threshold of R360 000 (2026), the entire remaining living annuity may be commuted (taken as a lump sum, taxed per the retirement lump sum tax table). At R150 000 (2026), the full balance may be commuted.',
    options: [
      { label: 'Conservative drawdown (2.5%–5%)', value: 'conservative', next: 'living_annuity_rec' },
      { label: 'Moderate drawdown (5%–10%)', value: 'moderate', next: 'living_annuity_rec' },
      { label: 'Aggressive drawdown (10%–17.5%)', value: 'aggressive', next: 'living_annuity_high_rec' },
    ],
  },

  living_annuity_rec: {
    id: 'living_annuity_rec',
    type: 'recommendation',
    recommendation: {
      productKey: 'Living Annuity',
      productLabel: 'Living Annuity',
      rationale: 'The client\'s compulsory funds will be invested in a Living Annuity (Section 37C). The client retains investment control and can select any Regulation 28-compliant fund. Drawdown rate is set annually (2.5%–17.5% p.a.). The balance remaining at death passes to nominated beneficiaries (not subject to estate duty or executor fees if a beneficiary is nominated). Key risk: investment risk and longevity risk remain with the client — if the portfolio is depleted, income ceases. For drawdown below 6%, a pure living annuity is appropriate. Note: de minimis commutation threshold is R360 000 (2026) and full commutation is available at R150 000 (2026).',
      flags: ['living_annuity', 'compulsory_funds', 'reg28_compliant', 'drawdown_2.5_to_17.5', 'beneficiary_on_death', 'longevity_risk'],
    },
  },

  living_annuity_high_rec: {
    id: 'living_annuity_high_rec',
    type: 'recommendation',
    recommendation: {
      productKey: 'Living Annuity',
      productLabel: 'Living Annuity (High Drawdown — Sustainability Warning)',
      rationale: 'The client is requesting a high drawdown rate (above 10%). At this level, there is a material risk of capital depletion — particularly if investment returns underperform. A drawdown above 10% is generally considered unsustainable over a long retirement. The advisor should document the sustainability risk discussion clearly. A blended annuity approach (partial Guaranteed Life Annuity to cover fixed expenses) should be considered. If a pure Living Annuity is elected at high drawdown, the advisor must ensure the client\'s FAIS obligations are met and the risk is clearly documented. De minimis threshold: R360 000 (2026). Commutation threshold: R150 000 (2026).',
      flags: ['living_annuity', 'high_drawdown', 'sustainability_warning', 'document_risk', 'consider_blend'],
    },
  },

  // Step 2.2 — Guaranteed Life Annuity detail
  guaranteed_annuity_detail: {
    id: 'guaranteed_annuity_detail',
    type: 'question',
    step: 4,
    stepLabel: 'Guaranteed Annuity Structure',
    question: 'What structure of Guaranteed Life Annuity is most appropriate for the client?',
    context: 'The annuity structure determines how income escalates (or not) and how long it continues. A level annuity pays more initially but erodes with inflation. An inflation-linked annuity pays less initially but maintains purchasing power. A joint-and-survivor annuity continues to a surviving spouse. A guaranteed term ensures payment to a beneficiary if the annuitant dies within the guarantee period.',
    options: [
      { label: 'Level annuity (fixed payment, highest initial income)', value: 'level', next: 'guaranteed_annuity_rec' },
      { label: 'Inflation-linked annuity (CPI-escalating, lower initial income)', value: 'cpi', next: 'guaranteed_annuity_cpi_rec' },
      { label: 'Joint-and-survivor annuity (continues to surviving spouse)', value: 'joint', next: 'guaranteed_annuity_joint_rec' },
      { label: 'Guaranteed term annuity (payment continues to beneficiary if death within term)', value: 'term', next: 'guaranteed_annuity_rec' },
    ],
  },

  guaranteed_annuity_rec: {
    id: 'guaranteed_annuity_rec',
    type: 'recommendation',
    recommendation: {
      productKey: 'GUARANTEED LIFE ANNUITY',
      productLabel: 'Guaranteed Life Annuity',
      rationale: 'The client\'s compulsory funds will be invested in a Guaranteed Life Annuity. The insurer guarantees income for life regardless of investment performance or longevity — the client cannot outlive their income. Capital is surrendered to the insurer (no residual estate value unless a guaranteed term is selected). Key advantages: eliminates investment risk and longevity risk, predictable income for budgeting. Key disadvantages: irreversible once purchased, no capital available to beneficiaries (unless guaranteed term applies), inflation erodes purchasing power for level annuities. Taxation: income is taxed as per the retirement fund lump sum tax table in the year of purchase, thereafter as normal income (PAYE). Consider purchasing with enough compulsory funds to cover fixed living expenses, with remaining compulsory funds in a Living Annuity for flexibility.',
      outsideScoreModel: true,
      outsideNote: 'Guaranteed Life Annuities are provided by life insurers (Old Mutual, Sanlam, Momentum, Discovery, Hollard, Metropolitan). Pricing is insurer-specific and depends on age, gender (from 2022 — unisex annuity rates apply per EU ruling), health status, and rate environment at purchase. Advisor to obtain quotes from multiple insurers. Provider selection is outside the platform scoring model for this product.',
      flags: ['guaranteed_annuity', 'compulsory_funds', 'no_longevity_risk', 'no_residual_estate', 'irreversible'],
    },
  },

  guaranteed_annuity_cpi_rec: {
    id: 'guaranteed_annuity_cpi_rec',
    type: 'recommendation',
    recommendation: {
      productKey: 'GUARANTEED LIFE ANNUITY',
      productLabel: 'Guaranteed Life Annuity — Inflation-Linked',
      rationale: 'An inflation-linked (CPI-escalating) Guaranteed Life Annuity is recommended. The initial income is lower than a level annuity but increases annually with CPI inflation, maintaining purchasing power over a long retirement. This is particularly appropriate for younger retirees (under 70) where purchasing power protection over a 20–30 year retirement horizon is a key concern. Taxation and structure as per standard Guaranteed Life Annuity. Obtain quotes from multiple life insurers for comparison.',
      outsideScoreModel: true,
      outsideNote: 'Provider selection outside platform scoring model. Quotes required from Old Mutual, Sanlam, Momentum, Discovery, Hollard, Metropolitan.',
      flags: ['guaranteed_annuity', 'inflation_linked', 'compulsory_funds', 'long_term_purchasing_power'],
    },
  },

  guaranteed_annuity_joint_rec: {
    id: 'guaranteed_annuity_joint_rec',
    type: 'recommendation',
    recommendation: {
      productKey: 'GUARANTEED LIFE ANNUITY',
      productLabel: 'Guaranteed Life Annuity — Joint-and-Survivor',
      rationale: 'A joint-and-survivor Guaranteed Life Annuity continues payment to the surviving spouse (typically 50%–100% of the original annuity) for the remainder of their life. This is appropriate for married clients where the surviving spouse has limited independent income. The initial annuity rate is lower to reflect the longer expected payment period. Typical survivor benefits: 50%, 66.67% or 100% of original income. Documentation: financial dependant status of spouse must be confirmed. Cannot be amended after purchase.',
      outsideScoreModel: true,
      outsideNote: 'Provider selection outside platform scoring model. Quotes required from multiple life insurers.',
      flags: ['guaranteed_annuity', 'joint_survivor', 'spouse_income', 'compulsory_funds'],
    },
  },

  blended_annuity_rec: {
    id: 'blended_annuity_rec',
    type: 'recommendation',
    recommendation: {
      productKey: 'GUARANTEED LIFE ANNUITY',
      productLabel: 'Blended Annuity (Guaranteed + Living)',
      rationale: 'A blended annuity approach is recommended. The client\'s compulsory funds are split: a portion is used to purchase a Guaranteed Life Annuity to cover fixed living expenses (providing a guaranteed income floor), while the remaining portion is invested in a Living Annuity for flexibility, potential capital growth, and access for unexpected expenses. This structure eliminates longevity risk for essential expenses while preserving flexibility and potential estate value. Typical allocation: Guaranteed Annuity to cover 60%–80% of essential monthly expenses; remainder in Living Annuity. Advisors must document the rationale for the split and obtain quotes for the Guaranteed portion from multiple insurers.',
      outsideScoreModel: true,
      outsideNote: 'The Guaranteed Life Annuity component requires quotes from multiple life insurers (outside platform scoring model). The Living Annuity component is scored via the provider matrix.',
      flags: ['blended_annuity', 'guaranteed_floor', 'living_annuity_flexibility', 'longevity_risk_managed'],
    },
  },

  // ═══════════════════════════════════════════════════════════════════
  // COMPREHENSIVE LUMP SUM ALLOCATION PATH
  // Guides the advisor through TFSA → Liquidity → Tax Rate to build
  // a multi-product allocation plan for a large lump sum investment.
  // ═══════════════════════════════════════════════════════════════════

  lump_alloc_tfsa: {
    id: 'lump_alloc_tfsa',
    type: 'question',
    step: 2,
    stepLabel: 'TFSA Status',
    question: 'Has the client maximised their Tax-Free Savings Account (TFSA) annual contribution for the current tax year?',
    context: 'The TFSA annual limit is R46 000 (2026). TFSA should almost always be the first allocation for discretionary savings — all growth, dividends and withdrawals are tax-free. If the client still has capacity, this is priority #1 regardless of investment amount.',
    options: [
      { label: 'No — client still has TFSA capacity this tax year', value: 'tfsa_available', next: 'lump_alloc_liquidity' },
      { label: 'Yes — TFSA annual limit already fully contributed this year', value: 'tfsa_maxed', next: 'lump_alloc_liquidity_no_tfsa' },
      { label: 'Yes — TFSA lifetime limit (R500 000) reached', value: 'tfsa_lifetime', next: 'lump_alloc_liquidity_no_tfsa' },
    ],
  },

  lump_alloc_liquidity: {
    id: 'lump_alloc_liquidity',
    type: 'question',
    step: 3,
    stepLabel: 'Liquidity Needs',
    question: 'What portion of the investment must remain accessible within the next 5 years?',
    context: 'Liquidity requirements determine whether a portion should be kept in a fully liquid vehicle (unit trust / discretionary platform). An endowment has a 5-year restriction period — any capital allocated there must not be needed for at least 5 years.',
    options: [
      { label: 'No specific liquidity requirement — client can commit full amount long-term', value: 'none', next: 'lump_alloc_tax_rate' },
      { label: 'Some liquidity needed — up to ~20–30% may be required within 5 years', value: 'some', next: 'lump_alloc_tax_rate' },
      { label: 'Significant liquidity — 40% or more needed within 5 years', value: 'high', next: 'alloc_high_liq_tfsa' },
    ],
  },

  lump_alloc_liquidity_no_tfsa: {
    id: 'lump_alloc_liquidity_no_tfsa',
    type: 'question',
    step: 3,
    stepLabel: 'Liquidity Needs',
    question: 'What portion of the investment must remain accessible within the next 5 years?',
    context: 'Since the TFSA is already maximised for this year, we focus the remaining capital. Liquidity requirements determine the split between an endowment (restricted for 5 years) and a unit trust (fully liquid).',
    options: [
      { label: 'No specific liquidity requirement — client can commit full amount long-term', value: 'none', next: 'lump_alloc_tax_rate_no_tfsa' },
      { label: 'Some liquidity needed — up to ~20–30% may be required within 5 years', value: 'some', next: 'lump_alloc_tax_rate_no_tfsa' },
      { label: 'Significant liquidity — 40% or more needed within 5 years', value: 'high', next: 'alloc_high_liq_no_tfsa' },
    ],
  },

  lump_alloc_tax_rate: {
    id: 'lump_alloc_tax_rate',
    type: 'question',
    step: 4,
    stepLabel: 'Marginal Tax Rate',
    question: 'What is the client\'s marginal income tax rate?',
    context: 'An Endowment Policy is tax-efficient for clients with a marginal tax rate above 30% — the policy\'s internal tax rate is capped at 30%, providing tax arbitrage on income and dividends. CGT within the endowment is taxed at an effective 12% (vs the client\'s higher rate). For clients at 30% or below, a unit trust is generally more efficient.',
    options: [
      { label: 'High — 41% or 45% marginal rate (taxable income above R353 100)', value: 'high', next: 'alloc_high_tax_tfsa' },
      { label: 'Lower — 30% or below (or uncertain / variable income)', value: 'low', next: 'alloc_low_tax_tfsa' },
    ],
  },

  lump_alloc_tax_rate_no_tfsa: {
    id: 'lump_alloc_tax_rate_no_tfsa',
    type: 'question',
    step: 4,
    stepLabel: 'Marginal Tax Rate',
    question: 'What is the client\'s marginal income tax rate?',
    context: 'An Endowment Policy is tax-efficient for clients with a marginal tax rate above 30% — the policy\'s internal tax rate is capped at 30%, providing tax arbitrage on income and dividends. CGT within the endowment is taxed at an effective 12% (vs the client\'s higher rate).',
    options: [
      { label: 'High — 41% or 45% marginal rate (taxable income above R353 100)', value: 'high', next: 'alloc_high_tax_no_tfsa' },
      { label: 'Lower — 30% or below (or uncertain / variable income)', value: 'low', next: 'alloc_low_tax_no_tfsa' },
    ],
  },

  // ── Allocation terminal nodes ──────────────────────────────────────

  // High tax + TFSA available: TFSA + Endowment (majority) + UT (buffer)
  alloc_high_tax_tfsa: {
    id: 'alloc_high_tax_tfsa',
    type: 'allocation',
    rationale: 'The client has a high marginal tax rate and still has TFSA capacity. The recommended allocation maximises tax efficiency: TFSA is funded first (tax-free compounding), the majority of remaining capital is placed in an Endowment (capped at 30% internal tax rate vs the client\'s 41%/45%, and effective CGT of 12%), and a discretionary unit trust provides a fully liquid buffer. This structure reduces the tax drag on the overall portfolio and provides estate planning benefits via the endowment\'s beneficiary nomination facility.',
    flags: ['comprehensive_allocation', 'high_tax_bracket', 'tfsa_included', 'endowment_tax_arbitrage'],
    allocations: [
      {
        productKey: 'Tax-Free savings',
        productLabel: 'Tax-Free Savings Account (TFSA)',
        amountType: 'fixed',
        defaultAmount: 46000,
        reason: 'First priority: annual TFSA limit (R46 000 — 2026). All growth, dividends and withdrawals are completely tax-free. Invest in a high-growth equity fund to maximise the tax-free compounding benefit.',
      },
      {
        productKey: 'ENDOWMENT',
        productLabel: 'Endowment Policy',
        amountType: 'pct_remainder',
        defaultPct: 65,
        reason: 'Majority of remaining capital in an Endowment. Tax arbitrage: internal rate capped at 30% (vs 41%/45% marginal rate). CGT effective rate: 12%. Beneficiary nomination avoids executor fees. Accept the 5-year restriction period in exchange for long-term tax savings.',
      },
      {
        productKey: 'unit trust',
        productLabel: 'Unit Trust (Discretionary — Liquidity Buffer)',
        amountType: 'remainder',
        reason: 'Remaining capital in a fully liquid discretionary unit trust. No lock-up period — available for unexpected needs, opportunities, or annual TFSA top-ups. CGT annual exclusion of R50 000 applies.',
      },
    ],
  },

  // High tax + TFSA maxed: Endowment (majority) + UT (buffer)
  alloc_high_tax_no_tfsa: {
    id: 'alloc_high_tax_no_tfsa',
    type: 'allocation',
    rationale: 'The client\'s TFSA is fully utilised for this tax year. With a high marginal tax rate, the majority of the lump sum is best placed in an Endowment Policy for tax efficiency — the policy\'s internal tax is capped at 30% (vs 41%/45% marginal rate), with effective CGT of 12%. A discretionary unit trust is maintained as a liquid buffer. Next tax year, consider contributing the annual TFSA limit (R46 000) to use remaining lifetime capacity.',
    flags: ['comprehensive_allocation', 'high_tax_bracket', 'tfsa_maxed', 'endowment_tax_arbitrage'],
    allocations: [
      {
        productKey: 'ENDOWMENT',
        productLabel: 'Endowment Policy',
        amountType: 'pct_remainder',
        defaultPct: 70,
        reason: 'Primary vehicle: Endowment with capped tax rate (30%). Tax arbitrage is significant for 41%/45% taxpayers. CGT effective 12%. Beneficiary nomination for estate efficiency. Minimum 5-year commitment required.',
      },
      {
        productKey: 'unit trust',
        productLabel: 'Unit Trust (Discretionary — Liquidity Buffer)',
        amountType: 'remainder',
        reason: 'Remaining capital in a fully liquid discretionary unit trust. Provides access for upcoming TFSA annual contributions, emergency needs, and investment opportunities. CGT annual exclusion R50 000.',
      },
    ],
  },

  // Low tax + TFSA available: TFSA + Unit Trust
  alloc_low_tax_tfsa: {
    id: 'alloc_low_tax_tfsa',
    type: 'allocation',
    rationale: 'With a lower marginal tax rate (at or below 30%), the tax advantage of an Endowment is negligible or non-existent — the client\'s personal tax rate is comparable to the Endowment\'s internal rate, and the 5-year lock-up does not provide sufficient benefit. The recommended allocation maximises the tax-free TFSA first, with the remainder in a fully liquid, low-cost unit trust. The client retains full flexibility and pays tax at their (already low) marginal rate.',
    flags: ['comprehensive_allocation', 'lower_tax_bracket', 'tfsa_included', 'full_liquidity'],
    allocations: [
      {
        productKey: 'Tax-Free savings',
        productLabel: 'Tax-Free Savings Account (TFSA)',
        amountType: 'fixed',
        defaultAmount: 46000,
        reason: 'First priority: annual TFSA limit (R46 000 — 2026). Even at lower tax rates, tax-free compounding over the long term is highly valuable. Allocate to a growth-oriented equity fund.',
      },
      {
        productKey: 'unit trust',
        productLabel: 'Unit Trust / Discretionary Investment',
        amountType: 'remainder',
        reason: 'Remaining capital in a flexible unit trust. At lower tax rates, the Endowment\'s tax benefit does not justify the 5-year restriction. Full liquidity retained. CGT annual exclusion R50 000 applies.',
      },
    ],
  },

  // Low tax + TFSA maxed: Unit Trust only
  alloc_low_tax_no_tfsa: {
    id: 'alloc_low_tax_no_tfsa',
    type: 'allocation',
    rationale: 'With the TFSA fully utilised and a lower marginal tax rate, a discretionary unit trust is the most appropriate vehicle. The tax advantage of an Endowment is not material at this tax bracket, and the 5-year restriction is not warranted. Consider contributing the annual TFSA limit (R46 000) again next tax year to continue building tax-free savings.',
    flags: ['comprehensive_allocation', 'lower_tax_bracket', 'tfsa_maxed', 'full_liquidity'],
    allocations: [
      {
        productKey: 'unit trust',
        productLabel: 'Unit Trust / Discretionary Investment',
        amountType: 'remainder',
        reason: 'Full lump sum in a flexible unit trust. Tax-efficient at lower marginal rates. Full daily liquidity. CGT annual exclusion R50 000 applies. Wide fund selection and asset manager choice.',
      },
    ],
  },

  // High liquidity + TFSA available
  alloc_high_liq_tfsa: {
    id: 'alloc_high_liq_tfsa',
    type: 'allocation',
    rationale: 'Significant liquidity is required within 5 years — this precludes a large Endowment allocation (5-year restriction period). The TFSA is funded first for tax-free long-term compounding. The bulk of the capital is held in a liquid discretionary unit trust. A smaller endowment allocation is possible only if a defined portion can be committed for 5+ years.',
    flags: ['comprehensive_allocation', 'liquidity_priority', 'tfsa_included'],
    allocations: [
      {
        productKey: 'Tax-Free savings',
        productLabel: 'Tax-Free Savings Account (TFSA)',
        amountType: 'fixed',
        defaultAmount: 46000,
        reason: 'First priority: annual TFSA limit (R46 000). Tax-free compounding. Even with liquidity needs, the TFSA can be withdrawn at any time — it is always appropriate to fund this first.',
      },
      {
        productKey: 'unit trust',
        productLabel: 'Unit Trust / Discretionary Investment',
        amountType: 'remainder',
        reason: 'Majority of capital in a fully liquid unit trust. Accessible within days. No lock-up. Suitable for capital that may be needed within 5 years. Consider a balanced or stable fund if the required date is within 3 years.',
      },
    ],
  },

  // High liquidity + TFSA maxed
  alloc_high_liq_no_tfsa: {
    id: 'alloc_high_liq_no_tfsa',
    type: 'allocation',
    rationale: 'Significant liquidity is required within 5 years and the TFSA is already maximised. A fully liquid discretionary unit trust is the only appropriate vehicle — the Endowment\'s 5-year restriction cannot be accommodated given the liquidity requirements. Next tax year, prioritise the annual TFSA contribution (R46 000) once liquidity needs are clarified.',
    flags: ['comprehensive_allocation', 'liquidity_priority', 'tfsa_maxed'],
    allocations: [
      {
        productKey: 'unit trust',
        productLabel: 'Unit Trust / Discretionary Investment',
        amountType: 'remainder',
        reason: 'Full lump sum in a fully liquid discretionary unit trust. No lock-up. Accessible when needed. Given liquidity requirements, this is the only appropriate vehicle. Revisit allocation structure once liquidity needs are met.',
      },
    ],
  },

  // Step 2.3 — Voluntary (discretionary) Life Annuity
  voluntary_annuity_rec: {
    id: 'voluntary_annuity_rec',
    type: 'recommendation',
    recommendation: {
      productKey: 'VOLUNTARY LIFE ANNUITY',
      productLabel: 'Voluntary Life Annuity (Discretionary Funds)',
      rationale: 'The client wishes to convert discretionary (after-tax) savings into a guaranteed income stream via a Voluntary Life Annuity. The key tax advantage is that each annuity payment consists partly of a capital repayment (the portion attributable to the original capital invested) and partly of income — only the income portion is taxable. This is known as the Article 10A treatment. This makes voluntary life annuities more tax-efficient than simply drawing down a unit trust investment. The capital return portion is fully exempt from income tax. The ratio is determined at inception based on the purchase price vs expected lifetime payments. Quote comparison from multiple life insurers is required.',
      outsideScoreModel: true,
      outsideNote: 'Voluntary Life Annuities are offered by life insurers. Provider selection outside platform scoring model. Obtain quotes from multiple insurers. Tax calculation (Article 10A capital return) must be confirmed with the insurer.',
      flags: ['voluntary_annuity', 'discretionary_funds', 'article_10A', 'capital_return_tax_free', 'income_taxable'],
    },
  },

};

// ── PRODUCT LABELS (user-facing display names) ─────────────────────────────
export const PRODUCT_LABELS = {
  'RETIREMENT ANNUITY':     'Retirement Annuity (RA)',
  'ENDOWMENT':              'Endowment Policy',
  'Living Annuity':         'Living Annuity',
  'unit trust':             'Unit Trust / Discretionary Investment',
  'preservation nfund':     'Preservation Fund',
  'Tax-Free savings':       'Tax-Free Savings Account (TFSA)',
  'FIXED DEPOSIT':          'Fixed Deposit',
  'RSA BONDS':              'RSA Retail Savings Bonds',
  'MONEY MARKET':           'Money Market / Call Account',
  'GUARANTEED LIFE ANNUITY':'Guaranteed Life Annuity',
  'VOLUNTARY LIFE ANNUITY': 'Voluntary Life Annuity',
};

// ── TREE NAVIGATION HELPERS ────────────────────────────────────────────────

/**
 * Get the next node in the tree based on current node and user's answer.
 * @param {string} currentNodeId
 * @param {string} selectedValue  - the value of the chosen option
 * @returns {object} next node from DECISION_TREE
 */
export const getNextNode = (currentNodeId, selectedValue) => {
  const currentNode = DECISION_TREE[currentNodeId];
  if (!currentNode || currentNode.type === 'recommendation') return null;
  const option = currentNode.options.find(o => o.value === selectedValue);
  if (!option) return null;
  return DECISION_TREE[option.next] || null;
};

/**
 * Get a node by id.
 */
export const getNode = (nodeId) => DECISION_TREE[nodeId] || null;

/**
 * Build a readable path summary from an array of { nodeId, selectedValue } decisions.
 * @param {Array} decisions - [{ nodeId, selectedValue, label }, ...]
 * @returns {Array} of { step, stepLabel, question, answer }
 */
export const buildPathSummary = (decisions) =>
  decisions.map(d => {
    const node = DECISION_TREE[d.nodeId];
    if (!node) return null;
    const option = node.options?.find(o => o.value === d.selectedValue);
    return {
      step: node.step,
      stepLabel: node.stepLabel,
      question: node.question,
      answer: option?.label || d.selectedValue,
    };
  }).filter(Boolean);

/**
 * Check if a product is within the platform scoring model.
 */
export const isWithinScoringModel = (productKey) =>
  ['RETIREMENT ANNUITY', 'ENDOWMENT', 'Living Annuity', 'unit trust', 'preservation nfund', 'Tax-Free savings']
    .includes(productKey);
