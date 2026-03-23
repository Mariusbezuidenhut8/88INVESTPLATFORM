/**
 * investmentCARParagraphs.js
 * Paragraph bank for the Investment Client Advice Record (CAR).
 */

export const CAR_PARAGRAPHS = {

  // ── Section A: Client Needs & Objectives ─────────────────────────────────
  clientNeedsObjectives: [
    {
      id: 'cno_retirement_growth',
      label: 'Retirement accumulation - growth focus',
      tags: ['retirement', 'growth', 'long_term'],
      text: `The client seeks to invest [monthly contributions / a lump sum] with the primary objective of long-term capital growth to supplement retirement income. The client wishes to build wealth over the investment horizon in a tax-efficient manner and has identified a surplus of income / capital that is not required in the short term.`,
    },
    {
      id: 'cno_wealth_accumulation',
      label: 'General wealth accumulation',
      tags: ['general', 'growth', 'medium_term'],
      text: `The client's primary investment objective is to grow capital above inflation over the medium to long term through exposure to a diversified portfolio of assets. The client wishes to invest surplus income / a lump sum in a structured investment vehicle that balances growth with acceptable risk.`,
    },
    {
      id: 'cno_specific_goal',
      label: 'Specific financial goal',
      tags: ['general', 'goal', 'medium_term'],
      text: `The client has identified a specific financial goal, namely [education funding / property purchase / capital reserve], and requires a structured investment vehicle to accumulate the necessary capital over the agreed investment horizon. The client is prepared to accept [conservative / moderate / growth] risk in pursuit of this objective.`,
    },
    {
      id: 'cno_supplement_retirement',
      label: 'Supplement existing retirement savings',
      tags: ['retirement', 'pre_retirement'],
      text: `The client is in the pre-retirement phase and seeks to maximise investment growth over the remaining years of their working life. The primary need is to supplement existing retirement savings and address a projected retirement income shortfall. The client wishes to invest in a tax-efficient vehicle that supports this objective.`,
    },
    {
      id: 'cno_lump_sum',
      label: 'Invest lump sum / windfall',
      tags: ['lump_sum', 'general'],
      text: `The client has received a lump sum (through [inheritance / bonus / property sale / maturity proceeds]) and seeks to invest this capital in a structured and prudent manner. The client's objective is to preserve and grow the capital over the long term while managing downside risk appropriately.`,
    },
    {
      id: 'cno_income_post_retirement',
      label: 'Post-retirement income',
      tags: ['post_retirement', 'income', 'living_annuity'],
      text: `The client is transitioning into retirement and requires a sustainable income stream from accumulated retirement capital. The client wishes to invest in a product that provides a regular income while maintaining the potential for capital growth to sustain the income over the long term.`,
    },
    {
      id: 'cno_tax_efficient',
      label: 'Tax-efficient savings',
      tags: ['tax_free', 'endowment', 'tax'],
      text: `The client seeks a tax-efficient investment vehicle to grow capital over the long term with minimal tax leakage. The client has reviewed the available options and wishes to maximise the tax advantages available within the relevant legislative framework.`,
    },
  ],

  // ── Section A: Financial Situation ───────────────────────────────────────
  financialSituation: [
    {
      id: 'fs_employed_surplus',
      label: 'Employed with monthly surplus',
      tags: ['employed', 'monthly'],
      text: `The client is employed / self-employed with a gross monthly income of approximately R[X]. Monthly living expenses and existing financial commitments amount to R[Y], leaving a monthly surplus of R[Z] available for investment. The client has existing retirement provision through [employer pension fund / group RA / personal RA] and holds [life cover / disability cover] to address risk needs.`,
    },
    {
      id: 'fs_lump_sum_available',
      label: 'Lump sum available to invest',
      tags: ['lump_sum', 'employed'],
      text: `The client is in a financially stable position and has a lump sum of R[X] available for investment. This capital has arisen from [a bonus / inheritance / maturity of an existing policy / sale of an asset]. The client has no immediate need for access to these funds and is in a position to commit to a medium to long-term investment horizon.`,
    },
    {
      id: 'fs_approaching_retirement',
      label: 'Approaching retirement',
      tags: ['pre_retirement', 'retirement'],
      text: `The client is approaching retirement within approximately [X] years and has accumulated retirement savings through [employer pension / personal RA / preservation fund]. A needs analysis indicates that the current trajectory may result in a retirement income shortfall. Additional savings are required to bridge this gap and achieve the client's target retirement income of approximately R[X] per month.`,
    },
    {
      id: 'fs_post_retirement',
      label: 'Recently retired / in retirement',
      tags: ['post_retirement', 'living_annuity'],
      text: `The client has recently retired and has accumulated retirement capital of approximately R[X]. The client requires a sustainable income from this capital and has no other significant source of income. Existing monthly expenses are estimated at R[Y] per month. The client's financial situation necessitates careful management of withdrawal rates to ensure the longevity of capital.`,
    },
    {
      id: 'fs_established_foundation',
      label: 'Established financial foundation',
      tags: ['general', 'existing_portfolio'],
      text: `The client is in a sound financial position with income exceeding expenses and existing financial arrangements in place, including [life cover / disability cover / existing investments / retirement savings]. The recommended product addresses a specific gap or opportunity in the client's overall financial portfolio.`,
    },
  ],

  // ── Section A: Product Knowledge & Experience ────────────────────────────
  productKnowledge: [
    {
      id: 'pk_moderate',
      label: 'Moderate understanding',
      tags: ['moderate', 'general'],
      text: `The client has a moderate understanding of investment products and financial markets. The recommended product, its features, underlying assets, risk characteristics, and cost structure were explained in detail during the advice process. The client understands that investment values may fluctuate and that past performance is not indicative of future returns.`,
    },
    {
      id: 'pk_limited',
      label: 'Limited experience',
      tags: ['limited', 'general'],
      text: `The client has limited prior experience with investment products. A comprehensive explanation of the recommended product was provided, including the nature of the underlying assets, applicable legislation, fee structure, liquidity terms, and investment risks. The client confirmed understanding of the product before proceeding.`,
    },
    {
      id: 'pk_experienced',
      label: 'Financially experienced',
      tags: ['experienced', 'sophisticated'],
      text: `The client is financially experienced and has previously invested in similar products. The client has a sound understanding of investment risk, market volatility, and the legislative framework applicable to the recommended product. The client is aware of the risks and benefits associated with the product and required limited explanation.`,
    },
    {
      id: 'pk_existing_product',
      label: 'Experience with similar products',
      tags: ['existing_product', 'moderate'],
      text: `The client has prior experience with similar investment products through their existing portfolio, which includes [unit trusts / RA / endowment / tax-free savings]. The client is familiar with the general workings of the recommended product type, including the fee structure, risk profile, and applicable legislation.`,
    },
  ],

  // ── Section A: Other Information ─────────────────────────────────────────
  otherInformation: [
    {
      id: 'oi_retirement_details',
      label: 'Retirement age & escalation',
      tags: ['retirement', 'general'],
      text: `The client's target retirement age is [X]. An annual contribution escalation of [X]% has been recommended to maintain the real value of premiums against inflation. The growth rate used in illustrative projections is [X]% per annum (net of fees). These projections are illustrative and not guaranteed.`,
    },
    {
      id: 'oi_tax_considerations',
      label: 'Tax considerations',
      tags: ['tax', 'general'],
      text: `Tax considerations were discussed with the client. The client's marginal income tax rate is [X]%, which was taken into account in the product recommendation. [RA: contributions reduce taxable income.] [TFSA: growth and withdrawals are tax-free.] [Endowment: internal tax is capped at 30%, beneficial for clients with a marginal rate above 30%.] The client was advised to consult a tax practitioner for personal tax advice.`,
    },
    {
      id: 'oi_estate_planning',
      label: 'Estate planning & beneficiaries',
      tags: ['estate', 'beneficiary'],
      text: `Estate planning implications were discussed with the client. Beneficiary nominations have been made where applicable to facilitate the direct transfer of death benefits outside of the estate. The client understands that RA and living annuity death benefits are paid to nominated beneficiaries, and that endowment proceeds bypass the estate if a beneficiary is nominated. The client has been advised to review beneficiary nominations regularly.`,
    },
    {
      id: 'oi_no_increase',
      label: 'No premium increase selected',
      tags: ['general'],
      text: `No premium escalation has been selected at this stage. The client is aware that the real value of fixed contributions will erode over time due to inflation and has been advised to review this at the next annual review. No specific exit strategy has been identified beyond the agreed investment horizon.`,
    },
    {
      id: 'oi_specific_goals',
      label: 'Specific goals noted',
      tags: ['goal', 'general'],
      text: `The following specific goals were identified and discussed: [education funding for dependants / building an emergency reserve / property purchase / capital growth above inflation]. The client understands that investment projections are illustrative and not guaranteed, and that actual returns will depend on market performance, fees, and the investment horizon.`,
    },
  ],

  // ── Section D: Motivation for Recommendation ─────────────────────────────
  recommendation: [
    {
      id: 'rec_ra',
      label: 'Retirement Annuity (RA)',
      tags: ['retirement_annuity', 'retirement', 'tax_deductible'],
      text: `A Retirement Annuity (RA) is recommended as the most appropriate product for the client's identified needs. The client is in the pre-retirement accumulation phase and requires a tax-efficient vehicle to build retirement savings. RA contributions are tax-deductible up to 27.5% of remuneration or taxable income, subject to a maximum of R430,000 per annum (2026), providing an immediate tax saving. Growth within the fund is tax-free. The investment is governed by Regulation 28, ensuring appropriate diversification across asset classes. The two-pot system provisions apply from September 2024, providing limited access to the savings component without compromising the retirement component. This product aligns with the client's [X]-year investment horizon, [risk profile], and retirement objectives as identified in Section A.`,
    },
    {
      id: 'rec_unit_trust',
      label: 'Unit Trust / Investment Account',
      tags: ['unit_trust', 'general', 'liquid'],
      text: `A Unit Trust investment account is recommended based on the client's requirement for a flexible, liquid investment with broad exposure to diversified asset classes. The client's investment horizon and objectives do not require a retirement-specific product at this stage, and a unit trust structure provides the necessary flexibility and transparency. The product offers daily liquidity, daily pricing, a wide range of fund options, and the ability to switch between portfolios. The recommended portfolio aligns with the client's [risk profile] as established by the risk questionnaire. This product is appropriate given the client's financial situation, investment horizon, and need for flexibility as identified in Section A.`,
    },
    {
      id: 'rec_tfsa',
      label: 'Tax-Free Savings Account (TFSA)',
      tags: ['tax_free', 'tfsa', 'savings'],
      text: `A Tax-Free Savings Account (TFSA) is recommended as a tax-efficient supplementary savings vehicle. The TFSA allows the client to contribute up to R46,000 per annum (2026) with a lifetime contribution limit of R500,000. All growth, interest, dividends, and withdrawals within the TFSA are completely free of tax, resulting in superior after-tax returns over the long term. This product is appropriate as a complement to the client's existing retirement provision and aligns with the client's long-term savings objectives and [risk profile]. The client has been advised of the over-contribution penalty of 40% and that withdrawals do not restore annual or lifetime contribution room.`,
    },
    {
      id: 'rec_endowment',
      label: 'Endowment',
      tags: ['endowment', 'tax', 'estate'],
      text: `An Endowment investment is recommended based on the client's marginal tax rate of [X]%, which exceeds the 30% rate at which income and capital gains are taxed internally within the endowment. The endowment structure provides a tax-efficient investment environment for higher-income earners, enables beneficiary nomination to facilitate transfer of proceeds outside the estate, and provides certainty through the structured investment term. Access is subject to a 5-year restriction period, after which withdrawals are permitted. This product aligns with the client's [X]-year investment horizon, estate planning objectives, and [risk profile] as identified in Section A.`,
    },
    {
      id: 'rec_living_annuity',
      label: 'Living Annuity',
      tags: ['living_annuity', 'post_retirement', 'income'],
      text: `A Living Annuity is recommended for the client who is transitioning into retirement with accumulated retirement capital of approximately R[X]. The living annuity allows the client to draw a flexible income between 2.5% and 17.5% of the fund value per annum, adjusted annually on the policy anniversary. The fund remains invested in the client's chosen portfolio, providing continued growth potential. The client has been advised of the risk of capital depletion if drawdowns are excessive relative to investment returns, and an initial drawdown rate of [X]% per annum has been recommended to support capital longevity. Regulation 28 applies. Death benefits are paid directly to nominated beneficiaries.`,
    },
    {
      id: 'rec_preservation',
      label: 'Preservation Fund',
      tags: ['preservation', 'retirement', 'resignation'],
      text: `A Preservation Fund is recommended to preserve the client's accumulated retirement savings following [resignation / retrenchment / divorce]. Transferring to a preservation fund maintains the tax-deferred status of the capital, preserves the Section 10C tax-free withdrawal entitlement, and prevents erosion of retirement savings through unnecessary encashment. The client is entitled to one withdrawal before retirement age, subject to tax. The fund is governed by Regulation 28 and the two-pot system provisions apply from September 2024. This product is appropriate given the client's circumstances and the importance of preserving retirement capital for the long term.`,
    },
    {
      id: 'rec_fixed_deposit',
      label: 'Fixed Deposit',
      tags: ['fixed_deposit', 'capital_preservation', 'short_term'],
      text: `A Fixed Deposit is recommended for the portion of the client's capital that requires certainty of return and capital preservation over the short to medium term. The fixed deposit provides a guaranteed interest rate for the agreed term, with no exposure to market volatility. This product is appropriate for the client's short-term capital requirement and complements the longer-term investment component of the overall portfolio.`,
    },
    {
      id: 'rec_guaranteed_annuity',
      label: 'Guaranteed Life Annuity',
      tags: ['guaranteed_annuity', 'post_retirement', 'income'],
      text: `A Guaranteed Life Annuity is recommended to provide the client with a guaranteed income for life, irrespective of investment performance or longevity. This product eliminates the risk of capital depletion and provides certainty of income in retirement. Quotes were obtained from multiple insurers and compared on the basis of income per R1,000,000 of capital invested, guarantee period, and escalation options. The recommended option from [Insurer] provides the most competitive terms for the client's circumstances. The client understands that this is an irrevocable decision and the capital cannot be accessed once the annuity is purchased.`,
    },
  ],

  // ── Section E: Implementation Rationale ──────────────────────────────────
  implementation: [
    {
      id: 'impl_full',
      label: 'Fully implemented as recommended',
      tags: ['full', 'general'],
      text: `The [Product Type] with [Provider Name] was implemented as recommended in Section D. The client has invested R[X] as a lump sum / R[X] per month. All required application documentation has been completed and submitted. The need identified in Section B has been fully addressed. Confirmation of the investment will be provided once the application has been processed.`,
    },
    {
      id: 'impl_partial',
      label: 'Partially implemented',
      tags: ['partial', 'general'],
      text: `The recommended product has been partially implemented at this stage. The client has committed to an initial investment of R[X], with the balance to be invested [at a future date / upon receipt of additional funds]. The partial implementation addresses the most urgent aspect of the client's identified need. The outstanding portion will be reviewed and addressed at the next scheduled review.`,
    },
    {
      id: 'impl_deviation',
      label: 'Client deviated from recommendation',
      tags: ['deviation', 'client_choice'],
      text: `The client elected to implement a modified version of the recommendation. [Describe the deviation, e.g., client selected a lower contribution amount / different product / different provider]. The reasons for the deviation were discussed and documented. The client was advised of the risks associated with the deviation and confirmed understanding. The risks are noted in Section H of this record.`,
    },
    {
      id: 'impl_phased',
      label: 'Phased implementation',
      tags: ['phased', 'lump_sum'],
      text: `The investment has been implemented on a phased basis to manage the risk of investing a large lump sum at a single market entry point. The total investment of R[X] has been split into [X] tranches of R[X] each, to be invested [monthly / quarterly]. This approach reduces the impact of short-term market volatility on the overall investment entry point.`,
    },
  ],

  // ── Section F: Important Information ─────────────────────────────────────
  importantInfo: [
    {
      id: 'ii_ra_full',
      label: 'RA - Tax, liquidity & legislation',
      tags: ['retirement_annuity', 'tax', 'liquidity', 'legislative'],
      text: `Tax Implications: RA contributions are tax-deductible up to 27.5% of remuneration or taxable income (maximum R430,000 p.a., 2026). Growth within the fund is tax-free. At retirement, the first R550,000 of the lump sum (one-third) is tax-free; the balance is taxed per the retirement lump sum tax table. The remaining two-thirds must be used to purchase an annuity.

Liquidity: The RA is illiquid until age 55 (except in cases of death, disability, or emigration). The two-pot system provides access to the savings component (seeded with R30,000 from 1 September 2024) once per tax year, subject to tax and a minimum withdrawal of R2,000.

Regulation 28: The investment must comply with Regulation 28 of the Pension Funds Act, which limits offshore exposure to 45% and prescribes maximum allocations to various asset classes.

Investment Term: The client understands that the RA is a long-term retirement savings vehicle and that early access is severely restricted.`,
    },
    {
      id: 'ii_unit_trust_full',
      label: 'Unit Trust - Tax, liquidity & costs',
      tags: ['unit_trust', 'tax', 'liquidity'],
      text: `Tax Implications: Interest income earned within the unit trust is subject to income tax (interest exemption: R23,800 p.a. for individuals under 65; R34,500 p.a. for those 65 and older). Dividends are subject to Dividends Withholding Tax at 20%. Capital gains on sale of units are subject to CGT; the annual exclusion is R50,000 (2026). The inclusion rate for individuals is 40%; the maximum effective CGT rate for individuals is 18%.

Liquidity: The unit trust investment is fully liquid with daily pricing and no lock-up period. Redemptions are processed within [T+3] business days. No early termination penalties apply.

Costs & Charges: All fees have been disclosed in Section G. The client understands the impact of fees on long-term investment returns. The Total Expense Ratio (TER) and Transaction Costs (TC) are disclosed in the fund fact sheet.`,
    },
    {
      id: 'ii_tfsa_full',
      label: 'TFSA - Limits, tax & withdrawal rules',
      tags: ['tax_free', 'tfsa', 'legislative'],
      text: `Tax Implications: All growth, interest, dividends, and withdrawals from a Tax-Free Savings Account are completely exempt from income tax, Dividends Withholding Tax, and Capital Gains Tax. This results in superior after-tax returns over the long term compared to taxable investments.

Contribution Limits: The annual contribution limit is R46,000 per tax year (2026) and the lifetime contribution limit is R500,000. Over-contributions attract a penalty tax of 40% on the excess amount. The client must ensure contributions across all TFSA accounts do not exceed these limits.

Withdrawal Rules: Withdrawals from a TFSA do not restore annual or lifetime contribution room. The client is advised to avoid unnecessary withdrawals to maximise the benefit of the tax-free environment.

Liquidity: The TFSA is fully liquid with no lock-up period, subject to the product provider's standard redemption processing time.`,
    },
    {
      id: 'ii_endowment_full',
      label: 'Endowment - Tax, restriction & estate',
      tags: ['endowment', 'tax', 'estate', 'legislative'],
      text: `Tax Implications: Income and capital gains within the endowment are taxed internally at a rate of 30% (income) and 12% (capital gains effective rate). This is beneficial for clients whose marginal tax rate exceeds 30%. No further tax is payable by the policyholder on maturity or on withdrawal after the restriction period.

Restriction Period: An endowment is subject to a 5-year restriction period from inception (or from the date of any additional premium). During this period, withdrawals are limited to one-third of the net investment value or the total premiums paid (whichever is lower), unless exceptional circumstances apply (death, disability, retrenchment, emigration).

Estate Planning: A beneficiary may be nominated to receive the policy proceeds directly on death, bypassing the estate and avoiding executor's fees. The proceeds are not subject to estate duty if the beneficiary is a spouse.

Investment Term: The client understands that the endowment is a medium to long-term investment and that early surrender may result in a surrender value lower than premiums paid.`,
    },
    {
      id: 'ii_living_annuity_full',
      label: 'Living Annuity - Drawdown & sustainability',
      tags: ['living_annuity', 'post_retirement', 'income'],
      text: `Drawdown Rate: The client may draw an income between 2.5% and 17.5% of the fund value per annum, adjusted annually on the policy anniversary. The initial drawdown rate has been set at [X]% per annum. The client has been advised that a drawdown rate exceeding 6% per annum materially increases the risk of capital depletion during the client's lifetime.

Sustainability Risk: The client understands that if investment returns are lower than the drawdown rate, the capital will be depleted over time. The client accepts this risk as a feature of the living annuity structure.

Regulation 28: The fund must comply with Regulation 28 of the Pension Funds Act, limiting offshore exposure to 45%.

Death Benefit: On death, the remaining fund value is paid to nominated beneficiaries as a lump sum (subject to tax) or transferred to a new living annuity on behalf of a surviving spouse.

De Minimis: If the fund value falls below R360,000 (2026), the remaining capital may be commuted to a lump sum.`,
    },
    {
      id: 'ii_general_costs',
      label: 'General - Costs, risks & replacement',
      tags: ['general', 'costs', 'replacement'],
      text: `Costs & Charges: All fees and charges applicable to the recommended product have been disclosed to the client in monetary terms as set out in Section G. The client understands that fees reduce investment returns and that the long-term impact of fees on the investment value can be significant.

Investment Risk: The client was made aware that investment values may fluctuate and that returns are not guaranteed. The recommended product aligns with the client's risk profile and investment horizon. Short-term market volatility should be viewed in the context of the long-term investment objective.

Replacement: [If applicable] The client was advised of the financial implications, costs, and consequences of replacing an existing financial product, including early termination penalties, loss of investment guarantees, and potential tax implications. The replacement was considered to be in the client's best interest for the following reasons: [reasons].

Investment Term: The client understands that the recommended product is intended as a [short / medium / long]-term investment and that early withdrawal may not achieve the desired investment objective.`,
    },
  ],

  // ── Section G: Commission & Fee Disclosure ────────────────────────────────
  commissionDisclosure: [
    {
      id: 'comm_initial_ongoing',
      label: 'Initial + Ongoing commission (standard)',
      tags: ['commission', 'initial', 'ongoing'],
      text: `Fee Disclosure and Client Acceptance

The following fees and commissions are payable in respect of the recommended financial product and have been fully disclosed to the client in monetary terms:

Initial (Upfront) Fee: [Upfront %]% of the investment amount = R[Upfront R] ([incl./excl.] VAT).
Ongoing Service Fee: [Ongoing %]% per annum of the fund value = approximately R[Ongoing R] per annum ([incl./excl.] VAT), reviewed annually.
[Platform/Administration Fee: [Platform %]% per annum of the fund value.]
Total Expense Ratio (TER): [TER]% per annum (as disclosed in the fund fact sheet).
Effective Annual Cost (EAC): [EAC]% per annum.

The client acknowledges that the above fees have been explained in full, that the client understands the nature and quantum of the fees, and that the client accepts the fees as fair and reasonable remuneration for the financial advice and ongoing service provided.

The client further acknowledges that fees reduce investment returns and that the long-term impact of fees on the investment value has been explained. The client has been advised that the ongoing service fee may be cancelled at any time by written notice to the product provider.`,
    },
    {
      id: 'comm_initial_only',
      label: 'Initial commission only (lump sum / once-off)',
      tags: ['commission', 'initial', 'lump_sum'],
      text: `Fee Disclosure and Client Acceptance

The following once-off fee is payable in respect of the recommended financial product and has been fully disclosed to the client:

Initial (Upfront) Advisory Fee: [Upfront %]% of the investment amount = R[Upfront R] ([incl./excl.] VAT).
No ongoing service fee is applicable to this transaction.
[Platform/Administration Fee: [Platform %]% per annum of the fund value.]
Total Expense Ratio (TER): [TER]% per annum (as disclosed in the fund fact sheet).

The client acknowledges that the above once-off fee has been explained in full, that the client understands the nature and quantum of the fee, and that the client accepts it as fair and reasonable remuneration for the financial advice provided.`,
    },
    {
      id: 'comm_ongoing_only',
      label: 'Ongoing service fee only (no upfront)',
      tags: ['commission', 'ongoing', 'service_fee'],
      text: `Fee Disclosure and Client Acceptance

No initial (upfront) advisory fee is charged in respect of this investment. The following ongoing service fee is payable and has been fully disclosed to the client:

Ongoing Service Fee: [Ongoing %]% per annum of the fund value = approximately R[Ongoing R] per annum ([incl./excl.] VAT), reviewed annually on the policy anniversary.
[Platform/Administration Fee: [Platform %]% per annum of the fund value.]
Total Expense Ratio (TER): [TER]% per annum (as disclosed in the fund fact sheet).
Effective Annual Cost (EAC): [EAC]% per annum.

The client acknowledges that the ongoing service fee has been explained in full, including the services to be rendered in exchange for the fee (annual review, portfolio monitoring, advice, and administration). The client accepts the fee as fair and reasonable and understands that it may be cancelled at any time by written notice to the product provider.`,
    },
    {
      id: 'comm_fee_based',
      label: 'Fee for service (no commission)',
      tags: ['fee_for_service', 'no_commission'],
      text: `Fee Disclosure and Client Acceptance

This transaction is conducted on a fee-for-service basis. No commission is earned by the financial advisor in respect of this product. The following advisor fee has been agreed upon and is payable by the client:

Advisory Fee: R[Upfront R] ([incl./excl.] VAT) — payable as a [once-off / monthly deduction from the investment].
[Ongoing Service Fee: R[Ongoing R] per annum ([incl./excl.] VAT), reviewed annually.]

The client acknowledges that the above fees have been discussed and agreed upon prior to implementation, and that the client accepts the fees as fair and reasonable remuneration for the financial advice and service provided.`,
    },
    {
      id: 'comm_nil',
      label: 'No commission / no advisor fee',
      tags: ['no_commission', 'nil'],
      text: `Fee Disclosure

No initial commission, ongoing service fee, or advisor fee is charged in respect of this investment. The client invests at the net asset value of the fund without any deduction for advisor remuneration. All applicable product costs (Total Expense Ratio, Transaction Costs, and any applicable platform fees) are disclosed in the fund fact sheet and have been explained to the client.`,
    },
  ],
};

/**
 * Returns paragraph options for a given CAR section key,
 * merged with any custom paragraphs saved in localStorage.
 * Archived paragraphs are excluded.
 */
export function getCARParagraphs(sectionKey, filterTags = []) {
  const builtIn = (CAR_PARAGRAPHS[sectionKey] || []).filter(p => !p.archived);

  // Merge custom paragraphs from localStorage
  let custom = [];
  try {
    const stored = localStorage.getItem('roa_car_paragraphs');
    if (stored) {
      const overrides = JSON.parse(stored);
      custom = (overrides[sectionKey] || []).filter(p => !p.archived);
    }
  } catch (_) { /* ignore */ }

  const all = [...builtIn, ...custom];
  if (!filterTags.length) return all;
  return all.filter(p => filterTags.some(tag => p.tags?.includes(tag)));
}

/** Returns all CAR section keys that have paragraphs. */
export const CAR_SECTION_KEYS = Object.keys(CAR_PARAGRAPHS);

export const CAR_SECTION_LABELS = {
  clientNeedsObjectives: 'Client Needs & Objectives',
  financialSituation:    'Financial Situation',
  productKnowledge:      'Product Knowledge & Experience',
  otherInformation:      'Other Information',
  recommendation:        'Recommendation (Section D)',
  implementation:        'Implementation (Section E)',
  importantInfo:         'Important Information (Section F)',
  commissionDisclosure:  'Commission & Fee Disclosure (Section G)',
};
