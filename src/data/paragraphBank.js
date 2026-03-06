/**
 * paragraphBank.js — Investment ROA Builder v3
 *
 * Pre-written paragraph options for each section of the ROA document.
 * Advisors select, edit, or combine these in the ContentBuilder module.
 *
 * STRUCTURE: PARAGRAPH_BANK[section][productKey] = [ { id, label, tags, text } ]
 *
 * SECTIONS:
 *   clientNeeds | riskProfile | recommendation | providerRationale
 *   costs | tax | reg28 | faisDisclosure | implementation | reviewSchedule
 *
 * To add a paragraph: add a new object to the relevant array.
 * To archive a paragraph: add archived: true (will be hidden from UI but preserved).
 * Tags help filter: e.g. ['conservative','income','long_term']
 */

// ── HELPER ────────────────────────────────────────────────────────────────
let _id = 1;
const id = () => `p${String(_id++).padStart(4,'0')}`;

export const PARAGRAPH_BANK = {

  // ════════════════════════════════════════════════════════════════════
  // SECTION 1 — CLIENT NEEDS SUMMARY
  // ════════════════════════════════════════════════════════════════════
  clientNeeds: {
    general: [
      { id: id(), label: 'Capital growth — long-term accumulation', tags: ['growth','long_term'],
        text: 'The client\'s primary investment objective is long-term capital growth and wealth accumulation. The client has a long investment horizon and is willing to accept market-related volatility in pursuit of real returns above inflation. Liquidity requirements are low to moderate, and the investment is intended to be a core portfolio holding.' },
      { id: id(), label: 'Capital growth — medium-term', tags: ['growth','medium_term'],
        text: 'The client\'s investment objective is capital growth over a medium-term horizon of 3 to 5 years. While the client accepts some market volatility, capital preservation over the full term remains important. The investment should provide meaningful real returns above the inflation rate.' },
      { id: id(), label: 'Retirement savings', tags: ['retirement','growth'],
        text: 'The client\'s primary objective is to build a retirement fund to provide for financial independence at retirement. The client is in the accumulation phase of their financial plan and requires a tax-efficient, long-term investment vehicle. Maximum tax deductibility of contributions is a key priority.' },
      { id: id(), label: 'Tax-free savings optimisation', tags: ['tfsa','tax_efficiency'],
        text: 'The client wishes to maximise the tax efficiency of their savings by utilising the Tax-Free Savings Account allowance. The client understands that growth, dividends and withdrawals within the TFSA are entirely free of tax, and wishes to maximise the annual contribution limit before investing in other discretionary vehicles.' },
      { id: id(), label: 'Retirement income — living annuity', tags: ['income','retirement','living_annuity'],
        text: 'The client has reached retirement and requires a sustainable monthly income from their accumulated retirement savings. The client requires flexibility to adjust their drawdown rate annually and wishes to retain investment control and leave a residual estate to nominated beneficiaries. The client accepts the investment and longevity risks associated with a living annuity.' },
      { id: id(), label: 'Retirement income — guaranteed', tags: ['income','retirement','guaranteed'],
        text: 'The client has reached retirement and prioritises income certainty over flexibility. The client requires a guaranteed, predictable monthly income for life, regardless of investment market performance or longevity. The client understands that the capital will be surrendered to the insurer in exchange for this guarantee, and that no residual estate value will be available (unless a guaranteed term is specified).' },
      { id: id(), label: 'Endowment — estate planning and tax efficiency', tags: ['endowment','estate','high_tax'],
        text: 'The client has a marginal tax rate in excess of 30% and wishes to invest discretionary savings in a tax-efficient manner while also providing for estate planning and simplified beneficiary transfers. The client can accommodate the 5-year policy restriction period and wishes to nominate beneficiaries directly on the policy to facilitate estate liquidity and minimise executor\'s fees.' },
      { id: id(), label: 'Capital preservation — short term', tags: ['capital_preservation','short_term'],
        text: 'The client\'s primary objective is preservation of capital over a short investment horizon of less than 2 years. The client requires certainty of capital and acceptable returns with minimal market risk. Liquidity may be required before the end of the investment term and therefore no long lock-up periods are appropriate.' },
      { id: id(), label: 'Offshore diversification', tags: ['offshore','diversification'],
        text: 'The client wishes to achieve geographic diversification by investing a portion of their portfolio offshore. This is motivated by currency diversification, access to global asset classes not available in South Africa, and the potential for USD/EUR-denominated growth. The client understands the exchange rate risk associated with offshore investing.' },
    ],
  },

  // ════════════════════════════════════════════════════════════════════
  // SECTION 2 — RISK PROFILE
  // ════════════════════════════════════════════════════════════════════
  riskProfile: {
    general: [
      { id: id(), label: 'Conservative investor', tags: ['conservative'],
        text: 'The client\'s risk profile is Conservative. The client prioritises capital preservation over growth and has a low tolerance for investment losses. The investment portfolio should be positioned predominantly in capital-stable and income-generating assets. The client is unlikely to remain invested through a significant market downturn without concern.' },
      { id: id(), label: 'Moderate / Balanced investor', tags: ['moderate','balanced'],
        text: 'The client\'s risk profile is Moderate/Balanced. The client seeks a balance between capital growth and income, with a medium tolerance for investment volatility. The portfolio should provide a blend of growth and income assets, with the ability to withstand moderate short-term market fluctuations in pursuit of real long-term returns.' },
      { id: id(), label: 'Aggressive / Growth investor', tags: ['aggressive','growth'],
        text: 'The client\'s risk profile is Aggressive/Growth-oriented. The client has a high tolerance for investment volatility and prioritises maximising long-term capital growth. The client is able and willing to remain invested through market downturns. The portfolio should have a high allocation to equities, including offshore and emerging market exposure.' },
      { id: id(), label: 'Income-seeking / Capital stable', tags: ['income','capital_stable'],
        text: 'The client\'s investment profile is Income/Capital Stable. The client requires regular income distributions and has a low tolerance for capital losses. The portfolio should focus on income-generating assets including fixed income, money market and dividend-paying equities.' },
      { id: id(), label: 'Risk profile completion note', tags: ['admin'],
        text: 'The client\'s risk profile was established through completion of a risk profile questionnaire administered at the time of this advice. The questionnaire assesses the client\'s investment objectives, time horizon, tolerance for volatility, prior investment experience and financial capacity to absorb losses. The risk profile result was explained to and accepted by the client.' },
    ],
  },

  // ════════════════════════════════════════════════════════════════════
  // SECTION 3 — PRODUCT RECOMMENDATION RATIONALE
  // ════════════════════════════════════════════════════════════════════
  recommendation: {
    'RETIREMENT ANNUITY': [
      { id: id(), label: 'RA — Standard rationale', tags: ['retirement','tax_deductible'],
        text: 'A Retirement Annuity is recommended as the primary vehicle for the client\'s retirement savings. Contributions qualify for a tax deduction of up to 27.5% of the greater of taxable income or remuneration (capped at R430 000 per annum — 2026 limit). Investment growth within the RA is free of income tax, CGT and dividends tax. Regulation 28 of the Pension Funds Act governs asset allocation, ensuring appropriate diversification. The RA is illiquid until age 55, at which point one-third may be taken as a lump sum (first R550 000 tax-free — 2026) and the remainder must purchase an annuity. The two-pot retirement system (effective September 2024) allows limited access to a savings component before retirement.' },
      { id: id(), label: 'RA — Two-pot system explanation', tags: ['retirement','two_pot'],
        text: 'The Two-Pot Retirement System (effective 1 September 2024) applies to this Retirement Annuity. From this date, contributions are split: one-third to the savings component (accessible — one withdrawal per year, minimum R2 000, taxed at marginal rate) and two-thirds to the retirement component (locked until age 55). Amounts contributed before 1 September 2024 remain in the vested component and are subject to the previous rules. An initial seeding amount of R30 000 was transferred from the vested to the savings component on 1 September 2024.' },
      { id: id(), label: 'RA — Why over discretionary investment', tags: ['retirement','tax_deductible','comparison'],
        text: 'The Retirement Annuity is recommended in preference to a discretionary investment vehicle because: (1) the tax deduction on contributions provides an immediate return equal to the client\'s marginal tax rate; (2) no tax drag on growth, income or dividends within the fund over the accumulation period; (3) Regulation 28 provides managed diversification. The illiquidity to age 55 is appropriate given the client\'s stated retirement savings objective.' },
    ],
    'Tax-Free savings': [
      { id: id(), label: 'TFSA — Standard rationale', tags: ['tfsa','tax_free'],
        text: 'A Tax-Free Savings Account is recommended. The client has not yet maximised the annual contribution limit of R46 000 (2026 — increased from R36 000) and the investment falls within the R500 000 lifetime limit. All growth, dividends and capital gains within the TFSA are exempt from tax. Withdrawals may be made at any time without tax consequences, providing flexibility. The TFSA should be invested in growth-oriented funds to maximise the benefit of tax-free compounding over the long term.' },
      { id: id(), label: 'TFSA — Limit warning', tags: ['tfsa','limits','compliance'],
        text: 'The client is advised that the TFSA annual contribution limit is R46 000 per calendar year (2026). Over-contributions attract a penalty tax of 40% on the excess amount. The lifetime limit is R500 000. Withdrawn amounts do not restore contribution room — once withdrawn, the lifetime limit is permanently reduced. The advisor and client have confirmed that the proposed contribution will not result in an over-contribution.' },
    ],
    'ENDOWMENT': [
      { id: id(), label: 'Endowment — Standard rationale (high tax)', tags: ['endowment','high_tax','estate'],
        text: 'An Endowment Policy is recommended for the client\'s discretionary savings. The client\'s marginal tax rate exceeds 30%, meaning the endowment\'s internal tax rate of 30% (on income) and effective CGT rate of 12% (30% × 40% inclusion) provides a tax saving versus direct investment. The 5-year restriction period is acceptable given the client\'s investment horizon and liquidity position. Beneficiary nomination on the policy facilitates estate planning and bypasses the executor\'s fees (3.5% estate duty excluded from this policy\'s assets).' },
      { id: id(), label: 'Endowment — Estate planning emphasis', tags: ['endowment','estate_planning'],
        text: 'The endowment is recommended with an emphasis on its estate planning benefits. By nominating a beneficiary directly on the policy, the proceeds are paid to the nominated beneficiary outside the estate, avoiding executor\'s fees and estate duty on this portion. This simplifies the estate administration process and ensures rapid access to funds for the beneficiary. A cession of the policy may also be used as security for a loan facility.' },
    ],
    'unit trust': [
      { id: id(), label: 'Unit Trust — Standard discretionary', tags: ['unit_trust','flexible','liquid'],
        text: 'A Unit Trust is recommended as the client\'s discretionary investment vehicle. Unit trusts provide daily liquidity, access to a wide range of asset managers and investment mandates, and no lock-up period. The investment is subject to income tax on distributions (interest and foreign dividends) and CGT on disposal (with the annual CGT exclusion of R50 000 — 2026 — applying). The client\'s chosen fund mandate aligns with their risk profile and investment horizon.' },
      { id: id(), label: 'Unit Trust — After TFSA and RA maximised', tags: ['unit_trust','discretionary','after_wrappers'],
        text: 'Having confirmed that the client\'s TFSA annual limit has been maximised and the RA contribution limit has been considered, a discretionary Unit Trust is the recommended vehicle for additional savings. The Unit Trust provides the flexibility and liquidity appropriate for the client\'s remaining investable capital, with no restriction on access.' },
    ],
    'Living Annuity': [
      { id: id(), label: 'Living Annuity — Standard recommendation', tags: ['living_annuity','income','retirement'],
        text: 'A Living Annuity is recommended for the client\'s compulsory retirement funds. The client retains investment control, selecting a portfolio aligned with their risk profile and income needs. The drawdown rate is set at [X]% per annum, reviewed annually on the policy anniversary. The client has been advised that investment returns and longevity risk remain with them — if investment returns are inadequate or the drawdown rate is too high, the fund may be depleted. The balance remaining at death will be paid to nominated beneficiaries.' },
      { id: id(), label: 'Living Annuity — Sustainability discussion', tags: ['living_annuity','sustainability','risk'],
        text: 'The sustainable withdrawal rate discussion was conducted with the client. A drawdown rate above 6% per annum increases the risk of fund depletion, particularly over a long retirement. The client\'s selected drawdown rate of [X]% has been discussed in the context of: (1) expected real investment returns; (2) the client\'s expected retirement period; (3) access to other income sources; and (4) the availability of the living annuity de minimis commutation threshold (R360 000 — 2026). The client acknowledges the risk and the drawdown rate has been set accordingly.' },
    ],
    'GUARANTEED LIFE ANNUITY': [
      { id: id(), label: 'Guaranteed Life Annuity — Standard recommendation', tags: ['guaranteed_annuity','income','certainty'],
        text: 'A Guaranteed Life Annuity is recommended for the client\'s compulsory retirement funds. The client prioritises certainty of income over flexibility and wishes to eliminate the risk of outliving their savings. The annuity provides a guaranteed monthly income of [R X] for life, with [level/inflation-linked/joint-and-survivor] structure. The capital is surrendered to the insurer in exchange for this guarantee. The client acknowledges that no residual capital will be available to beneficiaries (unless a guaranteed payment term is specified). Quotes were obtained from [X] insurers and the recommended insurer offered the most competitive rate.' },
    ],
    'preservation nfund': [
      { id: id(), label: 'Preservation Fund — Standard recommendation', tags: ['preservation','retirement'],
        text: 'A Preservation Fund is recommended for the client\'s resignation/retrenchment benefit. Transferring to a preservation fund maintains the tax-deferred status of the funds, preserves any Section 10C tax-free portion, and allows the funds to continue growing in a tax-efficient environment until retirement. One withdrawal from the fund is permitted before retirement age (55). The two-pot system applies to amounts transferred in from 1 September 2024.' },
    ],
    'FIXED DEPOSIT': [
      { id: id(), label: 'Fixed Deposit — Short-term recommendation', tags: ['short_term','capital_guarantee'],
        text: 'A Fixed Deposit is recommended for the client\'s short-term capital. The client\'s investment horizon is [X months/years] and capital certainty is the primary requirement. A fixed deposit with [institution] at [X]% per annum for [term] is recommended. The interest is taxable at the client\'s marginal rate, with the annual interest exemption of R23 800 (under 65) or R34 500 (65+) applying. Early withdrawal penalties may apply and have been disclosed to the client.' },
    ],
    'RSA BONDS': [
      { id: id(), label: 'RSA Bonds — Short-term government-guaranteed', tags: ['short_term','government_guarantee'],
        text: 'RSA Retail Savings Bonds are recommended for the client\'s short-to-medium-term capital. Issued by National Treasury, these bonds carry zero credit risk and provide guaranteed returns. The [fixed/inflation-linked] rate of [X]% over a [2/3/5] year term aligns with the client\'s objective of [guaranteed return/inflation protection]. Interest is taxed at the client\'s marginal rate. The bonds are purchased directly through the National Treasury website or Postbank — no platform fees or commission apply.' },
    ],
  },

  // ════════════════════════════════════════════════════════════════════
  // SECTION 4 — PROVIDER SELECTION RATIONALE
  // ════════════════════════════════════════════════════════════════════
  providerRationale: {
    general: [
      { id: id(), label: 'Provider selection — scoring matrix standard', tags: ['provider','due_diligence'],
        text: 'The recommended provider was selected through a structured due diligence process using a weighted scoring matrix. Providers were assessed across five categories: Platform Features (digital access, reporting quality, client portal), Administration (processing efficiency, governance quality, error resolution), Provider Strength (financial strength, market presence, governance structures), Regulatory Standing (FSCA compliance, complaint history, product oversight), and Cost & Value Metrics (cost relative to services, performance and flexibility). The recommended provider achieved a score of [X.XX out of 5.00] and was ranked [#] of [X] providers assessed for this product type.' },
      { id: id(), label: 'Provider selection — top 3 comparison standard', tags: ['provider','comparison'],
        text: 'Three providers were shortlisted for this recommendation based on their overall due diligence scores. The recommended provider, [Provider Name], achieved the highest weighted score of [X.XX] across the assessment criteria relevant to a [Product Type]. Key strengths identified were [strengths]. The alternative providers considered were [Provider 2] (score: [X.XX]) and [Provider 3] (score: [X.XX]). The recommended provider was selected based on the combination of overall score, suitability for the client\'s specific needs, and value for money.' },
      { id: id(), label: 'Provider — financial strength note', tags: ['provider','financial_strength'],
        text: '[Provider Name] is a well-established financial institution with strong financial strength and capital adequacy. The provider is regulated by the FSCA and the Prudential Authority (where applicable). No significant regulatory actions or sanctions have been identified in the review period. The provider\'s complaint history reflects a low ratio of upheld complaints relative to assets under management.' },
    ],
  },

  // ════════════════════════════════════════════════════════════════════
  // SECTION 5 — COSTS & CHARGES
  // ════════════════════════════════════════════════════════════════════
  costs: {
    general: [
      { id: id(), label: 'Cost disclosure — standard', tags: ['fees','disclosure'],
        text: 'The total cost of this investment has been disclosed to the client in writing. The following fees apply: Platform/Administration fee: [X]% per annum; Underlying fund TER (Total Expense Ratio): [X]% per annum; Advice/Service fee: [X]% per annum; Other charges: [X]% per annum. The total ongoing annual cost is [X]% per annum. A benchmark comparison has been provided. The client acknowledges that fees reduce the net investment return and has consented to the fee structure in writing.' },
      { id: id(), label: 'Fee competitiveness note', tags: ['fees','competitiveness'],
        text: 'The fees associated with the recommended product were assessed against market benchmarks for comparable products and providers. The total annual cost of [X]% compares favourably with the market average for this product category. The cost-to-value assessment confirms that the fees are reasonable relative to the level of service, platform quality and investment mandate provided.' },
      { id: id(), label: 'Advice fee structure', tags: ['fees','advice'],
        text: 'The advisor\'s ongoing service fee of [X]% per annum (including VAT) is charged for the provision of continuous financial planning services, including annual reviews, portfolio rebalancing recommendations, and availability for ad hoc financial planning queries. This fee has been agreed upon in writing as part of the client service agreement.' },
    ],
  },

  // ════════════════════════════════════════════════════════════════════
  // SECTION 6 — TAX CONSIDERATIONS
  // ════════════════════════════════════════════════════════════════════
  tax: {
    general: [
      { id: id(), label: 'Individual taxation — general', tags: ['tax','individual'],
        text: 'The client is a natural person (individual) for South African tax purposes. Investment income (interest, dividends and capital gains) is taxable at the client\'s applicable marginal rate, subject to the relevant exemptions and exclusions. Interest is exempt up to R23 800 per annum (under 65) or R34 500 (65 and over). The annual CGT exclusion of R50 000 (2026) applies on disposal of assets. Dividends received from SA companies are generally subject to dividends withholding tax at source (20%).' },
      { id: id(), label: 'Retirement fund taxation', tags: ['tax','retirement'],
        text: 'Investment returns within the retirement fund (RA, pension, provident or preservation fund) accumulate entirely free of income tax, CGT and dividends tax. Tax is only levied at retirement on the lump sum withdrawn (first R550 000 is tax-free — 2026) and on annuity income received after retirement. This tax-deferred compounding over the accumulation period is one of the primary advantages of retirement fund investment.' },
      { id: id(), label: 'Regulation 28 does not apply', tags: ['tax','reg28','not_applicable'],
        text: 'Regulation 28 of the Pension Funds Act does not apply to this discretionary investment. The asset allocation is guided by the client\'s agreed risk profile, investment objectives, and time horizon, without the constraints applicable to retirement fund investments.' },
      { id: id(), label: 'Endowment tax treatment', tags: ['tax','endowment'],
        text: 'The Endowment Policy is taxed internally at a flat rate of 30% on income and an effective CGT rate of 12% (30% income tax × 40% inclusion rate). For clients with a marginal tax rate above 30%, this represents a tax saving. The tax is borne by the policy — no additional personal tax liability arises for the client from income earned within the policy, provided the policy complies with the requirements of Section 54 of the Income Tax Act.' },
    ],
  },

  // ════════════════════════════════════════════════════════════════════
  // SECTION 7 — FAIS / STATUTORY DISCLOSURES
  // ════════════════════════════════════════════════════════════════════
  faisDisclosure: {
    general: [
      { id: id(), label: 'FAIS disclosure — standard full', tags: ['fais','compliance','disclosure'],
        text: 'This Record of Advice is issued in accordance with the requirements of the Financial Advisory and Intermediary Services Act 37 of 2002 (FAIS) and the General Code of Conduct for Authorised Financial Services Providers. The providing advisor holds the relevant FAIS licence and competency qualifications for the advice categories covered in this document. A Statutory Disclosure Notice (Conflict of Interest Declaration, FSP details and Representative details) was provided to the client prior to the rendering of advice.' },
      { id: id(), label: 'Conflict of interest disclosure', tags: ['conflict_of_interest','disclosure'],
        text: 'A conflict of interest assessment has been conducted. [No material conflict of interest was identified in respect of this recommendation / The following potential conflict of interest is disclosed:] [details if applicable]. The recommended product and provider were selected objectively on the basis of the client\'s needs and the due diligence assessment, not influenced by commission or incentive arrangements.' },
      { id: id(), label: 'Risk disclosure', tags: ['risk','disclosure'],
        text: 'The material risks associated with the recommended product have been explained to and acknowledged by the client. These include: investment risk (returns are not guaranteed), liquidity risk (restrictions on access during the investment period), inflation risk (real value of returns may be eroded), counterparty risk (risk of the product provider\'s financial failure), and in the case of living and voluntary annuities, longevity risk (the risk of outliving the investment). The client acknowledged understanding of these risks at the time of this advice.' },
      { id: id(), label: 'FICA / KYC compliance', tags: ['fica','kyc','compliance'],
        text: 'FICA (Financial Intelligence Centre Act) due diligence has been completed. The client\'s identity has been verified, and proof of address has been obtained and documented. The source of funds has been confirmed as [salary/investment proceeds/sale of property/inheritance — specify]. The client has been assessed as a standard risk client under the FICA risk-based approach.' },
    ],
  },

  // ════════════════════════════════════════════════════════════════════
  // SECTION 8 — IMPLEMENTATION STEPS
  // ════════════════════════════════════════════════════════════════════
  implementation: {
    general: [
      { id: id(), label: 'Implementation checklist — standard', tags: ['implementation','checklist'],
        text: 'The following implementation steps are required to activate this advice: (1) Client to complete application / onboarding documentation; (2) FICA/KYC documents to be submitted (ID, proof of residence, bank confirmation); (3) Fee disclosure signed and returned; (4) Source of funds confirmed; (5) Application submitted to [Provider Name]; (6) Confirmation of receipt obtained from provider; (7) Investment allocated per agreed portfolio/fund selection; (8) Confirmation sent to client; (9) Review date scheduled.' },
    ],
  },

  // ════════════════════════════════════════════════════════════════════
  // SECTION 9 — REVIEW SCHEDULE
  // ════════════════════════════════════════════════════════════════════
  reviewSchedule: {
    general: [
      { id: id(), label: 'Annual review — standard', tags: ['review','ongoing'],
        text: 'An annual review of this investment is recommended. The review will assess: (1) performance relative to the agreed benchmark and objectives; (2) changes in the client\'s personal circumstances, risk profile or financial goals; (3) continued suitability of the product, provider and fund selection; (4) drawdown rate appropriateness (for living annuities); (5) TFSA contribution utilisation; and (6) legislative or regulatory changes affecting the product. The next review is scheduled for [date].' },
      { id: id(), label: '6-month review — retirement income', tags: ['review','retirement','income'],
        text: 'A 6-monthly review is recommended for this retirement income investment. Given the client\'s dependence on the investment for ongoing income, more frequent monitoring of the drawdown rate sustainability, portfolio performance, and legislative changes is appropriate. Reviews are scheduled for [month] and [month] annually.' },
    ],
  },

};

// ── HELPERS ────────────────────────────────────────────────────────────────

/**
 * Get all paragraphs for a given section and product key.
 * Falls back to 'general' if no product-specific paragraphs exist.
 */
export const getParagraphs = (section, productKey = 'general') => {
  const sectionData = PARAGRAPH_BANK[section];
  if (!sectionData) return [];
  const productParas = sectionData[productKey] || [];
  const generalParas = sectionData.general || [];
  // Deduplicate and combine
  const ids = new Set(productParas.map(p => p.id));
  return [...productParas, ...generalParas.filter(p => !ids.has(p.id))]
    .filter(p => !p.archived);
};

/**
 * Get a single paragraph by id (across all sections).
 */
export const getParagraphById = (paragraphId) => {
  for (const section of Object.values(PARAGRAPH_BANK)) {
    for (const paras of Object.values(section)) {
      const found = paras.find(p => p.id === paragraphId);
      if (found) return found;
    }
  }
  return null;
};

/**
 * Get all paragraphs matching one or more tags.
 */
export const getParagraphsByTags = (tags) => {
  const results = [];
  const tagSet = new Set(tags);
  for (const section of Object.values(PARAGRAPH_BANK)) {
    for (const paras of Object.values(section)) {
      paras.forEach(p => {
        if (!p.archived && p.tags?.some(t => tagSet.has(t))) {
          results.push(p);
        }
      });
    }
  }
  return results;
};

/**
 * List all section keys.
 */
export const getAllSections = () => Object.keys(PARAGRAPH_BANK);
