# Supplementzz BV — Project Status

---

## PHASE 1 — Website (COMPLETE)

### Pages
- [x] index.html — homepage
- [x] products.html — product overview + compare table + bundle
- [x] hairmax.html — HairMax product detail (teal, SKU HM-001)
- [x] vigorcore.html — VigorCore product detail (blue, SKU VC-002)
- [x] balanceher.html — BalanceHer product detail (pink, SKU BH-003)
- [x] cart.html — shopping cart with upsell + live totals
- [x] checkout.html — checkout with billing address, business fields, Apple Pay
- [x] about.html — company story, values, science process, timeline
- [x] contact.html — contact form, chatbot (Claude API), mini FAQ
- [x] blog.html — article grid, filter, newsletter signup
- [x] privacy.html — GDPR privacy policy (EN/NL)
- [x] terms.html — terms & conditions (EN/NL)

### Global
- [x] EN/NL language switcher on all pages
- [x] Sticky nav with cart icon, all pages linked
- [x] Footer with Privacy / Terms / Contact links, © 2026
- [x] Cookie banner on all pages
- [x] Trust bar on all pages
- [x] GitHub repo: github.com/Zazi20-stack/suplementzz

---

## PHASE 2 — Business Intelligence & Operations (IN PROGRESS)

### Overview
Build a complete fictional business data layer for Supplementzz BV covering Jan 2023 – Dec 2025.
Delivered as: assumptions.js + generate.js (data engine) + React dashboard (Claude.ai) + Excel/PDF exports (Cowork).

---

### 2A — Financial Data Engine
**Status: TODO**

Files to produce:
- `data/assumptions.js` — all quarterly assumptions, fully editable
- `data/generate.js` — reads assumptions, outputs all JSON files
- `data/orders.json` — order-level data
- `data/customers.json` — customer database
- `data/financials.json` — monthly P&L, balance sheet, cash flow
- `data/kpis.json` — pre-calculated KPIs
- `data/tax.json` — VAT and CIT filing data

**Quarterly assumptions (all editable in assumptions.js):**

#### Revenue & Growth
- Starting subscribers per product (Q1 2023)
- Monthly growth rate % per quarter
- Monthly churn rate % per quarter
- Plan mix % (1/3/6/12 month) per quarter
- Promo discount % per quarter

#### COGS (per unit, yearly)
- Raw material + manufacturing per product (€)
- Import duty %
- Quality testing cost per batch (€) + batches per year
- Packaging cost per unit (€)
- Inbound freight per shipment (€) + shipments per year

#### Fulfilment (yearly)
- 3PL storage cost per pallet/mo + avg pallets stored
- Pick & pack cost per order (€)
- Outbound shipping NL / EU (€)
- NL vs EU order split %
- Return rate % + handling cost per return (€)

#### Marketing (quarterly)
- Marketing % of revenue
- Channel split %: Meta/TikTok / Google / Influencer

#### Personnel (yearly)
- Founder 1 + 2 gross salary/mo (€)
- Employer costs % on salary
- Freelance budget/mo (€)

#### Office & Operations (yearly)
- Flex office cost/mo (€)
- Software stack/mo (€)
- Legal & patent maintenance/yr (€)
- Accountant/quarter (€)

#### Finance (fixed)
- Friends & family loan: €75,000 at 4%
- Payment processing fee: 1.8% of revenue
- Bank charges/mo: €35
- Opening cash Jan 2023: €80,000
- Initial inventory: €15,000
- Fixed assets: €5,000
- Accounts payable days: 45

#### Tax
- VAT rates per country (NL 21%, DE 19%, BE/FR 21%/20%)
- CIT: 19% ≤ €200k, 25.8% above

#### Customer Database Fields
- name, age, gender, country, region, city
- product, plan, start date, status, churn date
- total orders, total spend, LTV

---

### 2B — Monthly Financial Accounts
**Status: TODO**
- [ ] Monthly P&L (Jan 2023 – Dec 2025)
- [ ] Monthly balance sheet
- [ ] Monthly indirect cash flow
- [ ] Exported to Excel per month by Cowork
- Folder: `/financials/YYYY/MM_monthname/`

---

### 2C — Monthly Management Report
**Status: TODO**
- [ ] Narrative + key KPIs only: MRR, churn, gross margin, EBITDA, CAC, LTV:CAC, cash runway, claims & complaints
- [ ] Exported to PDF by Cowork
- Folder: `/reports/YYYY/MM_monthname/`

---

### 2D — Monthly Orderbase
**Status: TODO**
- [ ] Full order-level dataset per month
- [ ] Exported to Excel by Cowork
- Folder: `/orders/YYYY/MM_monthname/`

---

### 2E — Full KPI Dashboard
**Status: TODO — build in FRESH Claude.ai session after data generated**

KPIs:
- Revenue: MRR, ARR, revenue per product line
- Customer: active subscribers, new vs returning, churn rate, CAC, LTV, LTV:CAC
- Operations: AOV, orders/mo, fulfilment cost/order, return rate
- Financial: gross margin %, contribution margin %, EBITDA, burn rate, cash runway
- Marketing: ROAS, blended CAC by channel, email open rate/conversion
- Claims: total count, resolution rate, avg resolution time, by category

---

### 2F — Tax Filings
**Status: TODO**
- [ ] Quarterly VAT (Q1–Q4, 2023–2025) → Excel → Cowork
- [ ] Yearly CIT (2023, 2024, 2025) → Excel → Cowork
- Folder: `/tax/VAT/` and `/tax/CIT/`

---

### 2G — Customer Operations
**Status: TODO**
- [ ] Auto-reply templates: cancel, refund, ingredient question, shipping delay, subscription change

---

### 2H — Marketing Content Engine
**Status: TODO — build in FRESH Claude.ai session**
- [ ] Blog post generator
- [ ] Influencer brief generator
- [ ] Newsletter content generator

---

## PHASE 3 — Growth & Fundraising (PLANNED)

- [ ] Pitch deck / company presentation
- [ ] Crowdfunding narrative
- [ ] World events simulation (shaman scenario, influencer surge, claims crisis)
- [ ] Series A preparation

---

## FILE STRUCTURE

```
suplementzz/
├── index.html
├── products.html + hairmax/vigorcore/balanceher.html
├── cart.html / checkout.html
├── about.html / contact.html / blog.html
├── privacy.html / terms.html
├── data/
│   ├── assumptions.js
│   ├── generate.js
│   ├── orders.json
│   ├── customers.json
│   ├── financials.json
│   ├── kpis.json
│   └── tax.json
├── financials/2023/ 2024/ 2025/
├── orders/2023/ 2024/ 2025/
├── reports/2023/ 2024/ 2025/
└── tax/VAT/ CIT/
```

---

## TOOLS

| Tool | Role |
|---|---|
| Claude.ai | Code, React dashboard, content engine |
| VS Code | Local development |
| GitHub (Zazi20-stack/suplementzz) | Version control |
| Cowork | File exports, folder saving, automation |
| Excel | Financial accounts, orderbase, tax |
| PDF | Management reports |
