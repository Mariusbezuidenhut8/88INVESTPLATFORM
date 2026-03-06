# Investment ROA Builder v3

FAIS-compliant React application for South African financial advisors.

## Quick Start

```bash
npm install
npm run dev
```
Open http://localhost:3000

## Build

```bash
npm run build
```

## Project Structure

```
src/
  data/              # All data (edit to update providers, paragraphs, etc.)
    providerDB.js      27 providers x 6 products x 15 criteria
    productCatalogue.js Named products per provider
    productTree.js     Decision tree (from 26-page PDF)
    paragraphBank.js   Pre-written ROA paragraphs
    productReference.js 2026 legislation limits
  modules/           # React UI modules
    ClientProfile.jsx  Client details + risk questionnaire
    DecisionTree.jsx   Step-by-step product selection
    ProviderScoring.jsx Provider ranking + selection
    FeeDisclosure.jsx  FAIS fee disclosure + EAC
    ContentBuilder.jsx Section-by-section ROA text
    ROADocument.jsx    Print-ready final ROA
  admin/             # Admin tools
    ParagraphManager.jsx Add/edit/archive paragraphs
    ProfileSettings.jsx  Practice and advisor settings
  shared/            # Utilities
    storage.js         localStorage helpers
    ui.js              Formatting, validation, display helpers
  App.jsx            # Main shell
  main.jsx           # Entry point
```

## 2026 Key Limits (pre-configured)
- TFSA: R46 000/year | R500 000 lifetime
- RA deduction: 27.5% / R430 000 cap
- Retirement lump sum tax-free: R550 000
- Living Annuity drawdown: 2.5% – 17.5%
- LA de minimis: R360 000 | Commutation: R150 000
- CGT exclusion: R50 000/year
- Interest exemption: R23 800 (<65) | R34 500 (65+)

## Notes
- All settings are saved to browser localStorage
- Custom paragraphs are merged with built-in bank at runtime
- ROA documents are printed via browser Print / Save as PDF
- Contract number can be left blank at drafting; complete before implementation
