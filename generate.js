/**
 * SUPPLEMENTZZ BV — DATA GENERATOR
 * =====================================
 * Reads assumptions.js and generates all fictional business data
 * with three parallel data streams: ACTUAL, BUDGET, FORECAST
 *
 * USAGE:
 *   node generate.js
 *
 * OUTPUT (./data/):
 *   orders.json      — order-level data (actual + forecast)
 *   customers.json   — customer database
 *   financials.json  — monthly P&L / balance sheet / cash flow
 *                      each month has: actual{}, budget{}, forecast{}, variance{}
 *   kpis.json        — monthly KPIs with actual/budget/forecast/variance
 *   tax.json         — quarterly VAT + yearly CIT (all three types)
 *
 * VARIANCE STRUCTURE (every financial record):
 *   variance.actualVsBudget   → { abs, pct } — are we on plan?
 *   variance.actualVsForecast → { abs, pct } — was forecast accurate?
 *   variance.forecastVsBudget → { abs, pct } — will we hit the plan?
 *
 * SIMULATING "CURRENT DATE":
 *   Change ACTUALS_LOCKED_UNTIL_QUARTER in assumptions.js
 *   e.g. set to 7 → 2023+2024 are actual, 2025 is forecast, budget always fixed
 */

const fs   = require('fs');
const path = require('path');
const {
  ASSUMPTIONS, getQ, getY, qIdx, yIdx, qNum, qYear, dataType, variance, round2
} = require('./assumptions');

// ─────────────────────────────────────────────
// UTILITIES
// ─────────────────────────────────────────────

let seed = 42;
function rand()             { seed=(seed*1664525+1013904223)&0xffffffff; return (seed>>>0)/0xffffffff; }
function randBetween(a,b)   { return a+rand()*(b-a); }
function randInt(a,b)       { return Math.floor(randBetween(a,b+1)); }
function round0(n)          { return Math.round(n); }
function pickWeighted(items){ let r=rand()*items.reduce((s,i)=>s+i.weight,0); for(const i of items){r-=i.weight;if(r<=0)return i;} return items[items.length-1]; }

const FIRST = ["Emma","Lucas","Sophie","Liam","Anna","Noah","Julia","Max","Laura","Jan","Finn","Marie","Tom","Sara","Erik","Lisa","David","Nina","Mark","Amy","Peter","Nora","Hans","Lena","Felix","Eva","Paul","Mia","Alex","Ida","Simon","Clara","Tim","Rosa","Robin","Kate"];
const LAST  = ["de Vries","Jansen","van den Berg","Bakker","Visser","Smit","Meijer","van Dijk","Bos","Mulder","Schmidt","Müller","Weber","Fischer","Meyer","Wagner","Dupont","Martin","García","López","Kowalski","Nowak","Andersson","Johansson"];
function randomName() { return FIRST[randInt(0,FIRST.length-1)]+" "+LAST[randInt(0,LAST.length-1)]; }

let orderCounter = 1000;
function newOrderId(y,m) { return `SUP-${y}-${String(m).padStart(2,'0')}-${String(++orderCounter).padStart(4,'0')}`; }

function allMonths(sy,sm,ey,em) {
  const months=[];
  let y=sy,m=sm;
  while(y<ey||(y===ey&&m<=em)){
    const qi=(y-2023)*4+Math.floor((m-1)/3);
    months.push({year:y,month:m,qIndex:qi,yIndex:y-2023,type:dataType(qi)});
    m++; if(m>12){m=1;y++;}
  }
  return months;
}

const MONTHS = allMonths(2023,1,2025,12);

// ─────────────────────────────────────────────
// SUBSCRIBER BASE (actual)
// ─────────────────────────────────────────────

function buildSubscriberBase() {
  const A  = ASSUMPTIONS;
  const result = {};
  for (const p of A.products) {
    let active = A.actuals.startingSubscribersQ1_2023[p.id];
    for (const {year,month,qIndex} of MONTHS) {
      const key = `${year}-${String(month).padStart(2,'0')}`;
      if (!result[key]) result[key] = {};
      result[key][p.id] = active;
      const growth = getQ(A.actuals.monthlyGrowthRate, qIndex);
      const churn  = getQ(A.actuals.monthlyChurnRate,  qIndex);
      active = Math.max(0, active + round0(active*growth) - round0(active*churn));
    }
  }
  return result;
}

// Budget subscriber base (uses budget assumptions)
function buildBudgetSubscriberBase() {
  const A  = ASSUMPTIONS;
  const result = {};
  for (const p of A.products) {
    let active = A.actuals.startingSubscribersQ1_2023[p.id];
    for (const {year,month,qIndex} of MONTHS) {
      const key = `${year}-${String(month).padStart(2,'0')}`;
      if (!result[key]) result[key] = {};
      result[key][p.id] = active;
      const growth = A.budget.monthlyGrowthRate[year];
      const churn  = A.budget.monthlyChurnRate[year];
      active = Math.max(0, active + round0(active*growth) - round0(active*churn));
    }
  }
  return result;
}

// Forecast subscriber base (uses forecast assumptions)
function buildForecastSubscriberBase() {
  const A  = ASSUMPTIONS;
  const result = {};
  for (const p of A.products) {
    let active = A.actuals.startingSubscribersQ1_2023[p.id];
    for (const {year,month,qIndex} of MONTHS) {
      const key = `${year}-${String(month).padStart(2,'0')}`;
      if (!result[key]) result[key] = {};
      result[key][p.id] = active;
      const growth = getQ(A.forecast.monthlyGrowthRate, qIndex);
      const churn  = getQ(A.forecast.monthlyChurnRate,  qIndex);
      active = Math.max(0, active + round0(active*growth) - round0(active*churn));
    }
  }
  return result;
}

// ─────────────────────────────────────────────
// ORDERS (actual only — orders are real events)
// ─────────────────────────────────────────────

const customerMap = {};
let customerCounter = 1;
const customerDb = {};

function assignCustomer(productId, country, year, month) {
  const poolKey = `${productId}-${country}`;
  if (!customerMap[poolKey]) customerMap[poolKey] = [];
  const pool = customerMap[poolKey];
  if (pool.length > 0 && rand() < 0.70) return pool[randInt(0,pool.length-1)];
  const id = `CUST-${String(customerCounter++).padStart(5,'0')}`;
  const cData = ASSUMPTIONS.customers.countryPool.find(c=>c.country===country) || ASSUMPTIONS.customers.countryPool[ASSUMPTIONS.customers.countryPool.length-1];
  const city   = cData.cities[randInt(0,cData.cities.length-1)];
  const ageBand= pickWeighted(ASSUMPTIONS.customers.ageDistribution.map(a=>({...a})));
  const age    = randInt(ageBand.min,ageBand.max);
  const gd     = ASSUMPTIONS.customers.genderDistribution[productId]||{male:0.45,female:0.50,other:0.05};
  const gr     = rand();
  const gender = gr<gd.male?'male':gr<gd.male+gd.female?'female':'other';
  customerDb[id] = { customerId:id, name:randomName(), age, gender, country, city, region:country,
    firstOrderDate:`${year}-${String(month).padStart(2,'0')}-${String(randInt(1,28)).padStart(2,'0')}`,
    primaryProduct:productId, status:'active', totalOrders:0, totalSpend:0 };
  pool.push(id);
  return id;
}

function generateOrders(actualSubs) {
  const A = ASSUMPTIONS;
  const orders = [];
  for (const {year,month,qIndex,yIndex:yIdx_,type} of MONTHS) {
    const key = `${year}-${String(month).padStart(2,'0')}`;
    const planMix = getQ(A.actuals.planMix, qIndex);
    const promo   = getQ(A.actuals.promoDiscountPct, qIndex);
    const nlShare = getQ(A.actuals.nlOrderSharePct, qIndex);
    const channelSplit = getQ(A.actuals.channelSplit, qIndex);

    for (const p of A.products) {
      const activeSubs = actualSubs[key]?.[p.id] || 0;
      const orderCount = round0(activeSubs * 0.95);
      for (let i=0;i<orderCount;i++) {
        const plan    = pickWeighted(Object.entries(planMix).map(([k,v])=>({id:k,weight:v})));
        const planDef = A.plans[plan.id];
        const price   = round2(p.basePrice*(1-planDef.discountPct)*(1-promo));
        const isNL    = rand()<nlShare;
        const country = isNL ? "Netherlands" : (pickWeighted(A.customers.countryPool.filter(c=>c.country!=="Netherlands"))?.country||"Germany");
        const custId  = assignCustomer(p.id, country, year, month);
        const r = rand();
        const channel = r<channelSplit.meta?'meta':r<channelSplit.meta+channelSplit.google?'google':'influencer';
        const returned= rand()<getY(A.fulfilment.returnRatePct,yIdx_);
        orders.push({
          orderId:newOrderId(year,month), date:`${year}-${String(month).padStart(2,'0')}-${String(randInt(1,28)).padStart(2,'0')}`,
          year,month,quarter:qNum(qIndex), dataType:type,
          customerId:custId, productId:p.id, productName:p.name,
          plan:plan.id, quantity:1, unitPrice:price, totalPrice:price,
          currency:"EUR", country, isNL, channel,
          status:returned?"returned":"fulfilled",
        });
      }
    }

    // Bundle orders
    const totalSubs = A.products.reduce((s,p)=>s+(actualSubs[key]?.[p.id]||0),0);
    const bundleCount = round0(totalSubs * A.bundle.shareOfOrders / A.products.length);
    for (let i=0;i<bundleCount;i++) {
      const plan    = pickWeighted(Object.entries(planMix).map(([k,v])=>({id:k,weight:v})));
      const planDef = A.plans[plan.id];
      const price   = round2(A.bundle.monthlyPrice*(1-planDef.discountPct)*(1-promo));
      const isNL    = rand()<nlShare;
      const country = isNL?"Netherlands":"Germany";
      const custId  = assignCustomer("BUNDLE-001",country,year,month);
      orders.push({
        orderId:newOrderId(year,month), date:`${year}-${String(month).padStart(2,'0')}-${String(randInt(1,28)).padStart(2,'0')}`,
        year,month,quarter:qNum(qIndex), dataType:type,
        customerId:custId, productId:"BUNDLE-001", productName:A.bundle.name,
        plan:plan.id, quantity:1, unitPrice:price, totalPrice:price,
        currency:"EUR", country, isNL, channel:"meta",
        status:rand()<0.98?"fulfilled":"returned",
      });
    }
  }
  return orders;
}

// ─────────────────────────────────────────────
// MONTHLY P&L — for a given data stream
// ─────────────────────────────────────────────

function calcMonthlyPL(year, month, qIndex, yIndex, revenue, orderCount, returnedCount, streamType, subscriberCount) {
  const A  = ASSUMPTIONS;
  const yi = yIndex;

  // COGS
  const cogsPct = streamType === 'budget' ? A.budget.cogsPct[year] : 0.30;
  const totalCOGS = round2(revenue * cogsPct);
  const grossProfit = round2(revenue - totalCOGS);
  const grossMarginPct = revenue > 0 ? round2(grossProfit / revenue) : 0;

  // Fulfilment
  const nlOrders  = round0(orderCount * getQ(A.actuals.nlOrderSharePct, qIndex));
  const euOrders  = orderCount - nlOrders;
  const shipping  = round2(nlOrders*getY(A.fulfilment.shippingCostNL,yi) + euOrders*getY(A.fulfilment.shippingCostEU,yi));
  const pickPack  = round2(orderCount*getY(A.fulfilment.pickAndPackPerOrder,yi));
  const storage   = round2(getY(A.fulfilment.storageCostPerPalletPerMonth,yi)*getY(A.fulfilment.avgPalletsStored,yi));
  const returns   = round2(returnedCount*getY(A.fulfilment.returnHandlingCost,yi));
  const totalFulfilment = round2(shipping+pickPack+storage+returns);

  // Marketing
  const mktPct = streamType==='budget' ? A.budget.marketingPct[year]
               : streamType==='forecast' ? getQ(A.forecast.marketingPctOfRevenue, qIndex)
               : getQ(A.actuals.marketingPctOfRevenue, qIndex);
  const totalMarketing = round2(revenue * mktPct);
  const cs = getQ(A.actuals.channelSplit, qIndex);
  const metaSpend       = round2(totalMarketing*cs.meta);
  const googleSpend     = round2(totalMarketing*cs.google);
  const influencerSpend = round2(totalMarketing*cs.influencer);

  // Personnel
  const f1 = getY(A.personnel.founder1GrossSalaryPerMonth,yi);
  const f2 = getY(A.personnel.founder2GrossSalaryPerMonth,yi);
  const empCosts   = round2((f1+f2)*A.personnel.employerCostsPct);
  const freelance  = getY(A.personnel.freelancePerMonth,yi);
  const totalPersonnel = streamType==='budget'
    ? round2(A.budget.personnelAnnual[year]/12)
    : round2(f1+f2+empCosts+freelance);

  // Operations
  const office    = getY(A.operations.flexOfficePerMonth,yi);
  const software  = getY(A.operations.softwareStackPerMonth,yi);
  const legal     = round2(getY(A.operations.legalPatentPerYear,yi)/12);
  const accountant= round2(getY(A.operations.accountantPerQuarter,yi)/3);
  const totalOps  = streamType==='budget'
    ? round2(A.budget.opexAnnual[year]/12)
    : round2(office+software+legal+accountant);

  // Finance
  const processingFees  = round2(revenue*A.finance.paymentProcessingFeePct);
  const bankCharges     = A.finance.bankChargesPerMonth;
  const interestExpense = round2((A.funding.friendsAndFamilyLoan*A.funding.loanInterestRateFlat)/12);
  const totalFinance    = round2(processingFees+bankCharges+interestExpense);

  // Depreciation
  const depreciation = round2(A.funding.fixedAssets/(A.funding.fixedAssetsUsefulLifeYears*12));

  // Summary
  const totalOpex  = round2(totalFulfilment+totalMarketing+totalPersonnel+totalOps+totalFinance);
  const ebitda     = round2(grossProfit-totalOpex);
  const ebit       = round2(ebitda-depreciation);
  const netProfit  = round2(ebit);
  const ebitdaMgn  = revenue>0?round2(ebitda/revenue):0;
  const netMgn     = revenue>0?round2(netProfit/revenue):0;

  // CAC
  const newCust = round0(subscriberCount * (streamType==='budget'?A.budget.monthlyGrowthRate[year]:getQ(A.actuals.monthlyGrowthRate,qIndex)) * 0.8);
  const cac     = newCust>0?round2(totalMarketing/Math.max(newCust,1)):0;
  const ltv     = cac>0?round2(cac*18):0; // simplified LTV = 18x CAC

  return {
    revenue, totalCOGS, grossProfit, grossMarginPct,
    fulfilment:{ total:totalFulfilment, shipping, pickPack, storage, returns },
    marketing: { total:totalMarketing, meta:metaSpend, google:googleSpend, influencer:influencerSpend },
    personnel: { total:totalPersonnel },
    operations:{ total:totalOps },
    finance:   { total:totalFinance, processingFees, bankCharges, interestExpense },
    depreciation,
    totalOpex, ebitda, ebit, netProfit, ebitdaMarginPct:ebitdaMgn, netMarginPct:netMgn,
    cac, ltv, newCustomers:newCust,
  };
}

// ─────────────────────────────────────────────
// MONTHLY REVENUE — budget stream
// ─────────────────────────────────────────────

function budgetRevenue(year, month) {
  const A = ASSUMPTIONS;
  const annual = A.budget.annualRevenue[year];
  const seasonIdx = A.budget.seasonalityIndex[month-1];
  const avgSeason = A.budget.seasonalityIndex.reduce((s,v)=>s+v,0)/12;
  return round2(annual * (seasonIdx/avgSeason) / 12);
}

function forecastRevenue(year, month, qIndex) {
  // Use the latest quarterly forecast of annual revenue, distributed by seasonality
  const A = ASSUMPTIONS;
  const q = Math.floor((month-1)/3)+1;
  const quarterKey = `Q${q}`;
  const annualForecast = A.forecast.annualRevenue[year]?.[quarterKey] || A.budget.annualRevenue[year];
  const seasonIdx = A.budget.seasonalityIndex[month-1];
  const avgSeason = A.budget.seasonalityIndex.reduce((s,v)=>s+v,0)/12;
  return round2(annualForecast * (seasonIdx/avgSeason) / 12);
}

// ─────────────────────────────────────────────
// MAIN FINANCIALS BUILDER
// ─────────────────────────────────────────────

function generateFinancials(orders, actualSubs, budgetSubs, forecastSubs) {
  const A = ASSUMPTIONS;
  const result = [];

  let cashActual=A.funding.openingCashQ1_2023+A.funding.friendsAndFamilyLoan;
  let cashBudget=cashActual, cashForecast=cashActual;
  let retainedActual=0, retainedBudget=0, retainedForecast=0;
  let inventoryActual=A.funding.initialInventoryInvestment;
  let inventoryBudget=inventoryActual, inventoryForecast=inventoryActual;
  let accDepreciation=0;

  for (const {year,month,qIndex,yIndex:yi,type} of MONTHS) {
    const key = `${year}-${String(month).padStart(2,'0')}`;
    const monthOrders    = orders.filter(o=>o.year===year&&o.month===month);
    const fulfilledOrders= monthOrders.filter(o=>o.status==='fulfilled');
    const returnedOrders = monthOrders.filter(o=>o.status==='returned');
    const orderCount     = fulfilledOrders.length;
    const returnedCount  = returnedOrders.length;

    const actualSubCount  = A.products.reduce((s,p)=>s+(actualSubs[key]?.[p.id]||0),0);
    const budgetSubCount  = A.products.reduce((s,p)=>s+(budgetSubs[key]?.[p.id]||0),0);
    const forecastSubCount= A.products.reduce((s,p)=>s+(forecastSubs[key]?.[p.id]||0),0);

    // ── ACTUAL REVENUE ──
    const actualRevenue = round2(fulfilledOrders.reduce((s,o)=>s+o.totalPrice,0)
      - returnedOrders.reduce((s,o)=>s+o.totalPrice,0));

    // ── BUDGET REVENUE ──
    const bRev  = budgetRevenue(year, month);

    // ── FORECAST REVENUE ──
    const fRev  = forecastRevenue(year, month, qIndex);

    // ── P&L for each stream ──
    const actual   = calcMonthlyPL(year,month,qIndex,yi,actualRevenue,orderCount,returnedCount,'actual',actualSubCount);
    const budget   = calcMonthlyPL(year,month,qIndex,yi,bRev,round0(bRev/50),round0(bRev/50*0.025),'budget',budgetSubCount);
    const forecast = calcMonthlyPL(year,month,qIndex,yi,fRev,round0(fRev/50),round0(fRev/50*0.025),'forecast',forecastSubCount);

    // ── DEPRECIATION ──
    accDepreciation += actual.depreciation;
    const netFixedAssets = round2(Math.max(0, A.funding.fixedAssets - accDepreciation));

    // ── CASH FLOW (indirect) ──
    const buildCashFlow = (pl) => {
      const wc = round2(-(pl.totalCOGS * (A.finance.accountsPayableDays/30) * 0.05));
      const ocf= round2(pl.netProfit + pl.depreciation + wc);
      return { netProfit:pl.netProfit, depreciation:pl.depreciation, changeInWorkingCapital:wc, operatingCashFlow:ocf, investingCashFlow:0, financingCashFlow:0, netCashFlow:ocf };
    };
    const cfActual   = buildCashFlow(actual);
    const cfBudget   = buildCashFlow(budget);
    const cfForecast = buildCashFlow(forecast);

    cashActual   = round2(cashActual   + cfActual.netCashFlow);
    cashBudget   = round2(cashBudget   + cfBudget.netCashFlow);
    cashForecast = round2(cashForecast + cfForecast.netCashFlow);
    retainedActual   = round2(retainedActual   + actual.netProfit);
    retainedBudget   = round2(retainedBudget   + budget.netProfit);
    retainedForecast = round2(retainedForecast + forecast.netProfit);

    // ── BALANCE SHEET ──
    const buildBS = (cash, inventory, retained, pl) => {
      const loanBal = A.funding.friendsAndFamilyLoan;
      const apBal   = round2(pl.totalCOGS * (A.finance.accountsPayableDays/30) * 0.5);
      const totalAssets= round2(cash+inventory+netFixedAssets);
      const totalLiab  = round2(loanBal+apBal);
      return {
        assets:{cash,inventory,fixedAssetsNet:netFixedAssets,total:totalAssets},
        liabilities:{loan:loanBal,accountsPayable:apBal,total:totalLiab},
        equity:round2(totalAssets-totalLiab),
      };
    };

    // ── VARIANCES ──
    const buildVariance = (act, bud, frc) => ({
      actualVsBudget:   variance(act, bud),
      actualVsForecast: variance(act, frc),
      forecastVsBudget: variance(frc, bud),
    });

    // ── CLAIMS ──
    const claimsActual   = round0((getQ(A.actuals.claimsPerQuarter, qIndex)||0)/3);
    const claimsBudget   = round0((getQ(A.budget.claimsPerQuarter,  qIndex)||0)/3);
    const claimsForecast = round0((getQ(A.forecast.claimsPerQuarter,qIndex)||0)/3);
    const resRate = getQ(A.actuals.claimsResolutionRate, qIndex);
    const resDays = getQ(A.actuals.claimsAvgResolutionDays||[], qIndex) || 2.5;

    // ── EMAIL ──
    const emailList = round0(A.email.listSizeQ1_2023 * Math.pow(1+getQ(A.email.monthlyListGrowthRate,qIndex),(year-2023)*12+month-1));
    const openRate  = getQ(A.email.openRatePct, qIndex);
    const opens     = round0(emailList*openRate);
    const clicks    = round0(opens*A.email.clickToOpenRatePct);
    const convs     = round0(opens*A.email.conversionRatePct);

    // ── CHURN RATES ──
    const churnActual   = getQ(A.actuals.monthlyChurnRate,   qIndex);
    const churnBudget   = getQ(A.budget.churnRatePerQuarter, qIndex);
    const churnForecast = getQ(A.forecast.monthlyChurnRate,  qIndex);

    // ── MRR ──
    const mrrActual   = actual.revenue;
    const mrrBudget   = budget.revenue;
    const mrrForecast = forecast.revenue;
    const roas = actual.marketing.total>0?round2(actual.revenue/actual.marketing.total):0;

    result.push({
      period: key, year, month, quarter:qNum(qIndex), dataType:type,

      // Three parallel P&L streams
      actual:   { ...actual,   cashFlow:cfActual,   balanceSheet:buildBS(cashActual,  inventoryActual,  retainedActual,  actual) },
      budget:   { ...budget,   cashFlow:cfBudget,   balanceSheet:buildBS(cashBudget,  inventoryBudget,  retainedBudget,  budget) },
      forecast: { ...forecast, cashFlow:cfForecast, balanceSheet:buildBS(cashForecast,inventoryForecast,retainedForecast,forecast) },

      // Variances
      variance: {
        revenue:        buildVariance(actual.revenue,   budget.revenue,   forecast.revenue),
        grossProfit:    buildVariance(actual.grossProfit,budget.grossProfit,forecast.grossProfit),
        ebitda:         buildVariance(actual.ebitda,    budget.ebitda,    forecast.ebitda),
        netProfit:      buildVariance(actual.netProfit, budget.netProfit, forecast.netProfit),
        marketing:      buildVariance(actual.marketing.total,budget.marketing.total,forecast.marketing.total),
        cac:            buildVariance(actual.cac,       budget.cac||0,    forecast.cac),
        churnRate:      buildVariance(churnActual,      churnBudget,      churnForecast),
        claims:         buildVariance(claimsActual,     claimsBudget,     claimsForecast),
      },

      // KPIs (actual/budget/forecast in parallel)
      kpis: {
        mrr:           { actual:mrrActual,   budget:mrrBudget,   forecast:mrrForecast,   variance:buildVariance(mrrActual,mrrBudget,mrrForecast) },
        arr:           { actual:round2(mrrActual*12), budget:round2(mrrBudget*12), forecast:round2(mrrForecast*12), variance:buildVariance(mrrActual*12,mrrBudget*12,mrrForecast*12) },
        grossMarginPct:{ actual:actual.grossMarginPct, budget:budget.grossMarginPct, forecast:forecast.grossMarginPct },
        ebitdaMargin:  { actual:actual.ebitdaMarginPct, budget:budget.ebitdaMarginPct, forecast:forecast.ebitdaMarginPct },
        netMargin:     { actual:actual.netMarginPct,    budget:budget.netMarginPct,    forecast:forecast.netMarginPct },
        burnRate:      { actual:actual.netProfit<0?Math.abs(actual.netProfit):0 },
        cashRunway:    { actual:actual.netProfit<0?round2(cashActual/Math.abs(actual.netProfit)):null },
        cac:           { actual:actual.cac, budget:budget.cac, forecast:forecast.cac, variance:buildVariance(actual.cac,budget.cac||0,forecast.cac) },
        ltv:           { actual:actual.ltv },
        ltvCacRatio:   { actual:actual.cac>0?round2(actual.ltv/actual.cac):null },
        churnRate:     { actual:churnActual, budget:churnBudget, forecast:churnForecast, variance:buildVariance(churnActual,churnBudget,churnForecast) },
        activeSubscribers: { actual:actualSubCount, budget:budgetSubCount, forecast:forecastSubCount, variance:buildVariance(actualSubCount,budgetSubCount,forecastSubCount) },
        orderCount:    { actual:orderCount },
        aov:           { actual:orderCount>0?round2(actual.revenue/orderCount):0 },
        returnRate:    { actual:orderCount>0?round2(returnedCount/(orderCount+returnedCount)):0 },
        fulfilmentCostPerOrder: { actual:orderCount>0?round2(actual.fulfilment.total/orderCount):0 },
        roas:          { actual:roas, budget:round2(budget.revenue/Math.max(budget.marketing.total,1)) },
        email:         { listSize:emailList, openRate, opens, clicks, conversions:convs },
        claims: {
          actual:claimsActual, budget:claimsBudget, forecast:claimsForecast,
          variance:buildVariance(claimsActual,claimsBudget,claimsForecast),
          resolutionRate:resRate, avgResolutionDays:resDays,
          categorySplit:ASSUMPTIONS.actuals.claimsPerQuarter ? {product:0.30,shipping:0.35,billing:0.20,other:0.15} : {},
        },
      },
    });
  }
  return result;
}

// ─────────────────────────────────────────────
// TAX
// ─────────────────────────────────────────────

function generateTax(financials) {
  const A = ASSUMPTIONS;
  const vatFilings=[], citFilings=[];

  for (let year=2023;year<=2025;year++) {
    for (let q=1;q<=4;q++) {
      const qi     = qIdx(year,q);
      const months = financials.filter(m=>m.year===year&&m.quarter===q);
      const csplit  = getQ(A.tax.countryRevenueSplit, qi);

      const buildVAT = (stream) => {
        const byCountry={};
        let vatCollected=0, vatDeductible=0;
        const totalRev = months.reduce((s,m)=>s+m[stream].revenue,0);
        for (const [country,share] of Object.entries(csplit)) {
          const rate=A.tax.vat[country]||A.tax.vat.OTHER_EU;
          const rev=round2(totalRev*share);
          const vat=round2(rev*rate/(1+rate));
          byCountry[country]={revenue:rev,vatRate:rate,vatCollected:vat};
          vatCollected+=vat;
        }
        const totalCosts=months.reduce((s,m)=>s+m[stream].totalCOGS+m[stream].totalOpex,0);
        vatDeductible=round2(totalCosts*0.21*0.6);
        return {byCountry,totalVatCollected:round2(vatCollected),totalVatDeductible:round2(vatDeductible),vatPayable:round2(vatCollected-vatDeductible)};
      };

      vatFilings.push({
        period:`Q${q} ${year}`, year, quarter:q, dataType:dataType(qi),
        actual:   buildVAT('actual'),
        budget:   buildVAT('budget'),
        forecast: buildVAT('forecast'),
        variance: {
          vatPayable: variance(buildVAT('actual').vatPayable, buildVAT('budget').vatPayable, buildVAT('forecast').vatPayable),
        },
        dueDate:`${year}-${String(q*3+1).padStart(2,'0')}-31`,
      });
    }

    const months = financials.filter(m=>m.year===year);
    const buildCIT = (stream) => {
      const profit = round2(months.reduce((s,m)=>s+m[stream].netProfit,0));
      const taxable= Math.max(0,profit);
      const citDue = taxable<=A.tax.cit.thresholdEUR
        ? round2(taxable*A.tax.cit.rateBelowThreshold)
        : round2(A.tax.cit.thresholdEUR*A.tax.cit.rateBelowThreshold+(taxable-A.tax.cit.thresholdEUR)*A.tax.cit.rateAboveThreshold);
      return {taxableProfit:taxable,citDue,lossCarryforward:profit<0?Math.abs(profit):0};
    };
    const qi = qIdx(year,4);
    citFilings.push({
      year, dataType:dataType(qi),
      actual:   buildCIT('actual'),
      budget:   buildCIT('budget'),
      forecast: buildCIT('forecast'),
      variance: { citDue: variance(buildCIT('actual').citDue, buildCIT('budget').citDue, buildCIT('forecast').citDue) },
      dueDate:`${year+1}-06-01`,
    });
  }
  return {vatFilings,citFilings};
}

// ─────────────────────────────────────────────
// FINALISE CUSTOMERS
// ─────────────────────────────────────────────

function finaliseCustomers(orders) {
  for (const o of orders) {
    const c=customerDb[o.customerId];
    if(!c) continue;
    c.totalOrders++;
    c.totalSpend=round2((c.totalSpend||0)+o.totalPrice);
    if(!c.lastOrderDate||o.date>c.lastOrderDate) c.lastOrderDate=o.date;
  }
  for (const c of Object.values(customerDb)) {
    c.ltv=c.totalSpend||0;
    const last=c.lastOrderDate?new Date(c.lastOrderDate):null;
    if(last){const ma=(new Date("2025-12-31")-last)/(1000*60*60*24*30);if(ma>3)c.status="churned";}
  }
  return Object.values(customerDb);
}

// ─────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────

function main() {
  console.log("🚀 Supplementzz BV — Data Generator");
  console.log("=====================================");
  console.log(`📅 Actuals locked until quarter index: ${ASSUMPTIONS.ACTUALS_LOCKED_UNTIL_QUARTER} (${ASSUMPTIONS.ACTUALS_LOCKED_UNTIL_QUARTER<=11?'Q'+(ASSUMPTIONS.ACTUALS_LOCKED_UNTIL_QUARTER%4+1)+' '+qYear(ASSUMPTIONS.ACTUALS_LOCKED_UNTIL_QUARTER):'future'})`);

  const dataDir = path.join(__dirname, 'data');
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir,{recursive:true});

  console.log("📊 Building subscriber bases (actual / budget / forecast)...");
  const actualSubs   = buildSubscriberBase();
  const budgetSubs   = buildBudgetSubscriberBase();
  const forecastSubs = buildForecastSubscriberBase();

  console.log("📦 Generating orders...");
  const orders = generateOrders(actualSubs);
  console.log(`   → ${orders.length.toLocaleString()} orders`);

  console.log("💰 Generating financials (actual / budget / forecast + variances)...");
  const financials = generateFinancials(orders, actualSubs, budgetSubs, forecastSubs);

  console.log("🧾 Generating tax filings...");
  const tax = generateTax(financials);

  console.log("👥 Finalising customer database...");
  const customers = finaliseCustomers(orders);
  console.log(`   → ${customers.length.toLocaleString()} customers`);

  // Extract KPIs as flat array for easy dashboard consumption
  const kpis = financials.map(m=>({
    period:m.period, year:m.year, month:m.month, quarter:m.quarter, dataType:m.dataType,
    ...m.kpis
  }));

  const files = [
    {name:"orders.json",     data:orders},
    {name:"customers.json",  data:customers},
    {name:"financials.json", data:financials},
    {name:"kpis.json",       data:kpis},
    {name:"tax.json",        data:tax},
  ];

  for (const f of files) {
    const fp = path.join(dataDir, f.name);
    fs.writeFileSync(fp,JSON.stringify(f.data,null,2));
    console.log(`✅ ${f.name} (${(fs.statSync(fp).size/1024).toFixed(1)} KB)`);
  }

  // Summary
  const totalActualRevenue = round2(financials.reduce((s,m)=>s+m.actual.revenue,0));
  const totalBudgetRevenue = round2(financials.reduce((s,m)=>s+m.budget.revenue,0));
  const totalActualProfit  = round2(financials.reduce((s,m)=>s+m.actual.netProfit,0));
  console.log("\n📈 SUMMARY");
  console.log(`   Actual revenue 2023-2025:  €${totalActualRevenue.toLocaleString()}`);
  console.log(`   Budget revenue 2023-2025:  €${totalBudgetRevenue.toLocaleString()}`);
  console.log(`   Actual net profit:         €${totalActualProfit.toLocaleString()}`);
  console.log(`   Total orders:              ${orders.length.toLocaleString()}`);
  console.log(`   Total customers:           ${customers.length.toLocaleString()}`);
  console.log("\n✨ Done!");
}

main();
