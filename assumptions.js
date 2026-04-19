/**
 * SUPPLEMENTZZ BV — ASSUMPTIONS FILE
 * =====================================
 * All business assumptions live here. Edit any value and re-run generate.js.
 *
 * THREE DATA TYPES — always maintained in parallel:
 *   "actual"   — what actually happened (historical, locked)
 *   "budget"   — fixed plan set at start of each year (never changes mid-year)
 *   "forecast" — rolling best estimate (updated as year progresses)
 *
 * COMPARISON LOGIC (in generate.js):
 *   - Actual vs Budget  → variance (€ and %) — "are we on plan?"
 *   - Actual vs Forecast → variance           — "was our forecast accurate?"
 *   - Forecast vs Budget → variance           — "will we hit the plan?"
 *
 * QUARTER INDEX MAP:
 *   0=Q1'23  1=Q2'23  2=Q3'23  3=Q4'23
 *   4=Q1'24  5=Q2'24  6=Q3'24  7=Q4'24
 *   8=Q1'25  9=Q2'25  10=Q3'25 11=Q4'25
 *   12=Q1'26 13=Q2'26 ... (extend for future periods)
 *
 * USAGE:
 *   - Actuals: quarters 0–11 (2023–2025), ACTUALS_LOCKED_UNTIL_QUARTER = 11
 *   - To simulate "current month": set ACTUALS_LOCKED_UNTIL_QUARTER to e.g. 7 (Q4 2024)
 *     → quarters 0–7 = actual, 8–11 = forecast, budget always fixed
 *   - Add future quarters by extending arrays beyond index 11
 */

const ASSUMPTIONS = {

  // ─────────────────────────────────────────────
  // META
  // ─────────────────────────────────────────────
  companyName:   "Supplementzz BV",
  kvk:           "87654321",
  vatNumber:     "NL004567891B01",
  currency:      "EUR",
  dataStartDate: "2023-01-01",
  dataEndDate:   "2025-12-31",

  /**
   * ACTUALS_LOCKED_UNTIL_QUARTER
   * Quarters 0 → this value are "actual" (historical, locked).
   * Quarters after this value are "forecast" (still rolling estimates).
   * Budget is always "budget" regardless.
   *
   * Set this to simulate any point in time:
   *   11 = all of 2023-2025 are actuals (fully historical)
   *    7 = 2023 + 2024 are actuals, 2025 is forecast
   *    3 = only 2023 is actual, 2024-2025 are forecast
   */
  ACTUALS_LOCKED_UNTIL_QUARTER: 11,

  /**
   * BUDGET_SET_QUARTERS
   * Which quarter index each year's budget was set.
   * Budget is fixed at that point and never changes.
   *   2023 budget set Q4 2022 (before data starts) → index -1
   *   2024 budget set Q4 2023 → index 3
   *   2025 budget set Q4 2024 → index 7
   */
  BUDGET_SET_QUARTERS: { 2023: -1, 2024: 3, 2025: 7 },

  // ─────────────────────────────────────────────
  // FUNDING & OPENING BALANCE
  // ─────────────────────────────────────────────
  funding: {
    friendsAndFamilyLoan:    300000,
    loanInterestRateFlat:    0.04,
    loanDisbursementQuarter: 0,
    openingCashQ1_2023:      80000,
    initialInventoryInvestment: 15000,
    fixedAssets:             5000,
    fixedAssetsUsefulLifeYears: 3,
    futureRounds: [],
  },

  // ─────────────────────────────────────────────
  // PRODUCTS
  // ─────────────────────────────────────────────
  products: [
    { id: "HM-001", name: "HairMax Formula",  color: "teal", basePrice: 49 },
    { id: "VC-002", name: "VigorCore Complex", color: "blue", basePrice: 54 },
    { id: "BH-003", name: "BalanceHer Blend",  color: "pink", basePrice: 52 },
  ],
  bundle: {
    id: "BUNDLE-001", name: "Complete Bundle",
    monthlyPrice: 89, shareOfOrders: 0.05,
  },
  plans: {
    "1mo":  { months: 1,  discountPct: 0.00 },
    "3mo":  { months: 3,  discountPct: 0.10 },
    "6mo":  { months: 6,  discountPct: 0.20 },
    "12mo": { months: 12, discountPct: 0.33 },
  },

  // ─────────────────────────────────────────────
  // ACTUALS — what actually happened
  // Extend arrays beyond index 11 as new actuals come in
  // ─────────────────────────────────────────────
  actuals: {
    startingSubscribersQ1_2023: { "HM-001": 120, "VC-002": 90, "BH-003": 80 },

    monthlyGrowthRate: [
      0.08, 0.08, 0.10, 0.12,
      0.11, 0.13, 0.14, 0.12,
      0.08, 0.07, 0.06, 0.06,
    ],
    monthlyChurnRate: [
      0.060, 0.060, 0.055, 0.050,
      0.045, 0.040, 0.040, 0.035,
      0.030, 0.030, 0.025, 0.025,
    ],
    planMix: [
      { "1mo":0.40,"3mo":0.30,"6mo":0.20,"12mo":0.10 },
      { "1mo":0.38,"3mo":0.30,"6mo":0.21,"12mo":0.11 },
      { "1mo":0.35,"3mo":0.30,"6mo":0.22,"12mo":0.13 },
      { "1mo":0.32,"3mo":0.30,"6mo":0.23,"12mo":0.15 },
      { "1mo":0.30,"3mo":0.28,"6mo":0.25,"12mo":0.17 },
      { "1mo":0.28,"3mo":0.27,"6mo":0.26,"12mo":0.19 },
      { "1mo":0.25,"3mo":0.27,"6mo":0.27,"12mo":0.21 },
      { "1mo":0.23,"3mo":0.26,"6mo":0.27,"12mo":0.24 },
      { "1mo":0.20,"3mo":0.25,"6mo":0.28,"12mo":0.27 },
      { "1mo":0.19,"3mo":0.25,"6mo":0.28,"12mo":0.28 },
      { "1mo":0.18,"3mo":0.25,"6mo":0.28,"12mo":0.29 },
      { "1mo":0.18,"3mo":0.24,"6mo":0.28,"12mo":0.30 },
    ],
    promoDiscountPct: [
      0.05,0.00,0.00,0.08,
      0.05,0.00,0.00,0.10,
      0.05,0.00,0.00,0.08,
    ],
    marketingPctOfRevenue: [
      0.35,0.33,0.32,0.34,
      0.30,0.28,0.27,0.29,
      0.22,0.20,0.19,0.21,
    ],
    channelSplit: [
      {meta:0.45,google:0.30,influencer:0.25},
      {meta:0.45,google:0.30,influencer:0.25},
      {meta:0.47,google:0.28,influencer:0.25},
      {meta:0.48,google:0.27,influencer:0.25},
      {meta:0.45,google:0.28,influencer:0.27},
      {meta:0.43,google:0.30,influencer:0.27},
      {meta:0.42,google:0.30,influencer:0.28},
      {meta:0.44,google:0.28,influencer:0.28},
      {meta:0.40,google:0.28,influencer:0.32},
      {meta:0.38,google:0.30,influencer:0.32},
      {meta:0.38,google:0.30,influencer:0.32},
      {meta:0.40,google:0.28,influencer:0.32},
    ],
    nlOrderSharePct: [
      0.60,0.58,0.57,0.55,
      0.53,0.52,0.50,0.50,
      0.48,0.47,0.46,0.45,
    ],
    claimsPerQuarter:       [ 8,10, 9,14, 12,15,16,20, 18,20,19,25 ],
    claimsResolutionRate:   [ 0.88,0.89,0.90,0.88, 0.91,0.92,0.92,0.91, 0.93,0.94,0.95,0.94 ],
    claimsAvgResolutionDays:[ 2.8,2.6,2.5,3.0, 2.4,2.2,2.2,2.5, 2.0,1.9,1.8,2.1 ],
  },

  // ─────────────────────────────────────────────
  // BUDGET — fixed plan, set once per year, never updated mid-year
  // Represents management expectations at budget-setting time
  // ─────────────────────────────────────────────
  budget: {
    // Annual revenue budget (distributed monthly via seasonality)
    annualRevenue: { 2023: 280000, 2024: 580000, 2025: 1050000 },

    // Monthly seasonality index (must average to 1.0 across 12 months)
    seasonalityIndex: [
      0.75,0.78,0.88,0.92,
      0.95,0.98,1.00,1.02,
      1.05,1.08,1.15,1.44,
    ],

    // Budget growth rate per year (set at budget time, more optimistic)
    monthlyGrowthRate: { 2023:0.10, 2024:0.13, 2025:0.08 },

    // Budget churn rate per year
    monthlyChurnRate:  { 2023:0.050, 2024:0.038, 2025:0.025 },

    // Budget marketing % of revenue per year
    marketingPct:      { 2023:0.30, 2024:0.26, 2025:0.18 },

    // Budget COGS % of revenue per year
    cogsPct:           { 2023:0.28, 2024:0.27, 2025:0.26 },

    // Budget personnel cost per year
    personnelAnnual:   { 2023:75000, 2024:120000, 2025:180000 },

    // Budget other opex per year (excl. marketing + personnel)
    opexAnnual:        { 2023:45000, 2024:55000, 2025:65000 },

    // Budget claims per quarter
    claimsPerQuarter:  [ 7,8,8,10, 10,12,12,15, 14,16,16,20 ],

    // Budget churn rate per quarter
    churnRatePerQuarter: [
      0.050,0.050,0.048,0.046,
      0.042,0.040,0.038,0.036,
      0.028,0.026,0.025,0.024,
    ],
  },

  // ─────────────────────────────────────────────
  // FORECAST — rolling best estimate, updated as year progresses
  // For past quarters: same as actuals (locked)
  // For future quarters: management's current best estimate
  // Extend arrays beyond index 11 for future periods
  // ─────────────────────────────────────────────
  forecast: {
    // For locked quarters (≤ ACTUALS_LOCKED_UNTIL_QUARTER): mirrors actuals
    // For open quarters: management's rolling estimate
    // Format mirrors actuals arrays — same indices

    monthlyGrowthRate: [
      // 2023 (locked = actuals)
      0.08,0.08,0.10,0.12,
      // 2024 (locked = actuals)
      0.11,0.13,0.14,0.12,
      // 2025 (locked = actuals)
      0.08,0.07,0.06,0.06,
      // Q1 2026+ (add forecast values here)
      // 0.05,0.05,0.05,0.05
    ],
    monthlyChurnRate: [
      0.060,0.060,0.055,0.050,
      0.045,0.040,0.040,0.035,
      0.030,0.030,0.025,0.025,
    ],
    marketingPctOfRevenue: [
      0.35,0.33,0.32,0.34,
      0.30,0.28,0.27,0.29,
      0.22,0.20,0.19,0.21,
    ],
    annualRevenue: {
      // Rolling forecast of full-year revenue (updated each quarter)
      // At Q1: initial forecast; by Q4: very close to actuals
      2023: { Q1:260000, Q2:270000, Q3:278000, Q4:282000 },
      2024: { Q1:540000, Q2:558000, Q3:571000, Q4:576000 },
      2025: { Q1:980000, Q2:1010000, Q3:1038000, Q4:1048000 },
    },
    claimsPerQuarter: [
      8,10,9,14,
      12,15,16,20,
      18,20,19,25,
    ],
    claimsResolutionRate: [
      0.88,0.89,0.90,0.88,
      0.91,0.92,0.92,0.91,
      0.93,0.94,0.95,0.94,
    ],
  },

  // ─────────────────────────────────────────────
  // COGS — shared across actual/budget/forecast (cost reality)
  // ─────────────────────────────────────────────
  cogs: {
    manufacturingCostPerUnit: {
      "HM-001":     [12.00,11.50,11.00],
      "VC-002":     [14.00,13.50,13.00],
      "BH-003":     [13.00,12.50,12.00],
      "BUNDLE-001": [37.00,35.50,34.00],
    },
    importDutyPct:             0.035,
    qualityTestingPerBatch:    [800,800,900],
    batchesPerYearPerProduct:  [4,5,6],
    packagingPerUnit:          [1.20,1.10,1.00],
    inboundFreightPerShipment: [1200,1100,1000],
    shipmentsPerYear:          [4,5,6],
  },

  // ─────────────────────────────────────────────
  // FULFILMENT
  // ─────────────────────────────────────────────
  fulfilment: {
    storageCostPerPalletPerMonth: [45,45,48],
    avgPalletsStored:             [3,5,8],
    pickAndPackPerOrder:          [2.50,2.40,2.30],
    shippingCostNL:               [4.50,4.50,4.50],
    shippingCostEU:               [8.50,8.00,7.80],
    returnRatePct:                [0.030,0.025,0.020],
    returnHandlingCost:           [6.00,6.00,6.00],
  },

  // ─────────────────────────────────────────────
  // PERSONNEL
  // ─────────────────────────────────────────────
  personnel: {
    founder1GrossSalaryPerMonth: [2500,3500,5000],
    founder2GrossSalaryPerMonth: [2000,3000,4500],
    employerCostsPct:  0.22,
    freelancePerMonth: [800,1200,1500],
  },

  // ─────────────────────────────────────────────
  // OPERATIONS
  // ─────────────────────────────────────────────
  operations: {
    flexOfficePerMonth:        [550,600,650],
    softwareStackPerMonth:     [450,550,650],
    legalPatentPerYear:        [3500,3500,4000],
    accountantPerQuarter:      [750,850,1000],
  },

  // ─────────────────────────────────────────────
  // FINANCE
  // ─────────────────────────────────────────────
  finance: {
    paymentProcessingFeePct: 0.018,
    bankChargesPerMonth:     35,
    accountsPayableDays:     45,
    accountsReceivableDays:  0,
  },

  // ─────────────────────────────────────────────
  // TAX
  // ─────────────────────────────────────────────
  tax: {
    vat: {
      Netherlands:0.21, Germany:0.19, Belgium:0.21,
      France:0.20, Italy:0.22, Spain:0.21,
      Sweden:0.25, Denmark:0.25, OTHER_EU:0.20,
    },
    countryRevenueSplit: [
      {Netherlands:0.60,Germany:0.15,Belgium:0.08,France:0.07,OTHER_EU:0.10},
      {Netherlands:0.58,Germany:0.16,Belgium:0.08,France:0.08,OTHER_EU:0.10},
      {Netherlands:0.57,Germany:0.16,Belgium:0.08,France:0.08,OTHER_EU:0.11},
      {Netherlands:0.55,Germany:0.17,Belgium:0.08,France:0.09,OTHER_EU:0.11},
      {Netherlands:0.53,Germany:0.17,Belgium:0.09,France:0.09,OTHER_EU:0.12},
      {Netherlands:0.52,Germany:0.18,Belgium:0.09,France:0.09,OTHER_EU:0.12},
      {Netherlands:0.50,Germany:0.18,Belgium:0.09,France:0.10,OTHER_EU:0.13},
      {Netherlands:0.50,Germany:0.18,Belgium:0.09,France:0.10,OTHER_EU:0.13},
      {Netherlands:0.48,Germany:0.19,Belgium:0.09,France:0.10,OTHER_EU:0.14},
      {Netherlands:0.47,Germany:0.19,Belgium:0.09,France:0.11,OTHER_EU:0.14},
      {Netherlands:0.46,Germany:0.20,Belgium:0.09,France:0.11,OTHER_EU:0.14},
      {Netherlands:0.45,Germany:0.20,Belgium:0.09,France:0.12,OTHER_EU:0.14},
    ],
    cit: {
      rateBelowThreshold: 0.19,
      rateAboveThreshold: 0.258,
      thresholdEUR:       200000,
    },
  },

  // ─────────────────────────────────────────────
  // CUSTOMER DATABASE
  // ─────────────────────────────────────────────
  customers: {
    countryPool: [
      {country:"Netherlands",cities:["Amsterdam","Rotterdam","Utrecht","Den Haag","Eindhoven","Groningen","Tilburg","Breda"],weight:0.50},
      {country:"Germany",    cities:["Berlin","Hamburg","Munich","Cologne","Frankfurt","Stuttgart","Düsseldorf","Leipzig"],weight:0.18},
      {country:"Belgium",    cities:["Brussels","Antwerp","Ghent","Liège","Bruges","Leuven"],weight:0.09},
      {country:"France",     cities:["Paris","Lyon","Marseille","Toulouse","Nice","Nantes","Strasbourg"],weight:0.10},
      {country:"Sweden",     cities:["Stockholm","Gothenburg","Malmö"],weight:0.04},
      {country:"Spain",      cities:["Madrid","Barcelona","Valencia","Seville"],weight:0.04},
      {country:"Other EU",   cities:["Warsaw","Copenhagen","Rome","Vienna","Dublin"],weight:0.05},
    ],
    ageDistribution: [
      {min:22,max:29,weight:0.18},
      {min:30,max:39,weight:0.32},
      {min:40,max:49,weight:0.28},
      {min:50,max:65,weight:0.22},
    ],
    genderDistribution: {
      "HM-001":     {male:0.55,female:0.40,other:0.05},
      "VC-002":     {male:0.88,female:0.08,other:0.04},
      "BH-003":     {male:0.04,female:0.93,other:0.03},
      "BUNDLE-001": {male:0.35,female:0.60,other:0.05},
    },
  },

  // ─────────────────────────────────────────────
  // EMAIL MARKETING
  // ─────────────────────────────────────────────
  email: {
    listSizeQ1_2023: 800,
    monthlyListGrowthRate: [
      0.12,0.12,0.14,0.15,
      0.13,0.14,0.15,0.13,
      0.10,0.09,0.08,0.08,
    ],
    openRatePct: [
      0.28,0.27,0.26,0.29,
      0.27,0.26,0.25,0.28,
      0.26,0.25,0.24,0.27,
    ],
    clickToOpenRatePct: 0.18,
    conversionRatePct:  0.032,
  },

  // ─────────────────────────────────────────────
  // INVENTORY
  // ─────────────────────────────────────────────
  inventory: {
    safetyStockWeeks:   4,
    reorderMultiplier:  1.15,
  },
};

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

function round2(n) { return Math.round(n * 100) / 100; }

// Get quarterly value from array
function getQ(arr, qIndex) {
  if (!arr || arr.length === 0) return 0;
  return qIndex < arr.length ? arr[qIndex] : arr[arr.length - 1];
}

// Get yearly value from array (yIdx: 0=2023, 1=2024, 2=2025)
function getY(arr, yIdx) {
  if (!arr || arr.length === 0) return 0;
  return yIdx < arr.length ? arr[yIdx] : arr[arr.length - 1];
}

// Quarter index from year + quarter number
function qIdx(year, q) { return (year - 2023) * 4 + (q - 1); }

// Year index from quarter index
function yIdx(qi) { return Math.floor(qi / 4); }

// Quarter number (1-4) from quarter index
function qNum(qi) { return (qi % 4) + 1; }

// Year from quarter index
function qYear(qi) { return 2023 + Math.floor(qi / 4); }

// Data type for a given quarter index
function dataType(qi) {
  if (qi <= ASSUMPTIONS.ACTUALS_LOCKED_UNTIL_QUARTER) return "actual";
  return "forecast";
}

// Variance calculation: actual vs reference
function variance(actual, reference) {
  if (!reference || reference === 0) return { abs: 0, pct: 0 };
  return {
    abs: round2(actual - reference),
    pct: round2((actual - reference) / Math.abs(reference)),
  };
}

if (typeof module !== 'undefined') {
  module.exports = { ASSUMPTIONS, getQ, getY, qIdx, yIdx, qNum, qYear, dataType, variance, round2 };
}
