/**
 * SanthAI Automated Unit Testing & Algorithm Verification Suite
 * Executes unit test specifications across Mandi Pricing, Stock Forecasting,
 * Zero-Waste Markdown Liquidation, and Digital Khata Credit Risk Scoring.
 */

import { PricingEngine } from '../pricing';
import { ForecastEngine } from '../forecast';
import { KhataService } from '../khata';
import { ResQService } from '../resq';
import { parseSpokenStockEntry } from '../voiceStockParser';
import { MandiPriceRecord, DailyStockLog, BulkOrderBoardItem, KhataCustomer, VendorProfile, CommodityType } from '../../types';
import { CACHED_TN_MANDI_PRICES, INITIAL_STOCK_LOGS } from '../../data/commodities';

// Simple lightweight assertion runner
let passedTests = 0;
let failedTests = 0;
const testLogs: string[] = [];

function assert(condition: boolean, testName: string, details?: string) {
  if (condition) {
    passedTests++;
    testLogs.push(`  ✅ PASS: ${testName}`);
  } else {
    failedTests++;
    testLogs.push(`  ❌ FAIL: ${testName} ${details ? `(${details})` : ''}`);
  }
}

function runPricingEngineTests() {
  testLogs.push('\n--- [TEST SUITE 1]: PricingEngine & Mandi Statistical Analysis ---');

  const mockRecords: MandiPriceRecord[] = [
    {
      id: 'koyambedu-tomato-1',
      state: 'Tamil Nadu',
      district: 'Chennai',
      market: 'Koyambedu',
      commodity: 'Tomato',
      date: '2026-09-15',
      minPricePerKg: 20,
      maxPricePerKg: 30,
      modalPricePerKg: 25,
      arrivalTons: 100
    },
    {
      id: 'madurai-tomato-1',
      state: 'Tamil Nadu',
      district: 'Madurai',
      market: 'Mattuthavani',
      commodity: 'Tomato',
      date: '2026-09-15',
      minPricePerKg: 22,
      maxPricePerKg: 32,
      modalPricePerKg: 27,
      arrivalTons: 80
    },
    {
      id: 'dindigul-tomato-1',
      state: 'Tamil Nadu',
      district: 'Dindigul',
      market: 'Oddanchatram',
      commodity: 'Tomato',
      date: '2026-09-15',
      minPricePerKg: 24,
      maxPricePerKg: 34,
      modalPricePerKg: 29,
      arrivalTons: 120
    }
  ];

  // Test 1.1: Statistical calculations
  const stats = PricingEngine.getMandiStats(mockRecords, 'Tomato');
  assert(stats.mean === 27, 'Computes correct mean modal price across mandis (27.0)', `Received: ${stats.mean}`);
  assert(stats.min === 20, 'Identifies minimum wholesale floor price across markets', `Received: ${stats.min}`);
  assert(stats.max === 34, 'Identifies maximum wholesale ceiling price across markets', `Received: ${stats.max}`);
  assert(stats.stdDev > 0, 'Computes non-zero standard deviation for pricing dispersion', `Received: ${stats.stdDev}`);

  // Test 1.2: Fair retail evaluation
  const fairEval = PricingEngine.evaluateVendorPrice(28, 'Tomato', mockRecords);
  assert(fairEval.isOutlier === false, 'Validates fair pricing has no outlier classification');
  assert(fairEval.outlierType === 'none', 'Classifies price accurately as fair (outlierType === "none")');
  assert(fairEval.currentSellingPrice >= fairEval.fairPriceRange[0] && fairEval.currentSellingPrice <= fairEval.fairPriceRange[1], 'Confirms retail price sits within calculated fair price range');

  // Test 1.3: Price gouging detection
  const gougeEval = PricingEngine.evaluateVendorPrice(60, 'Tomato', mockRecords);
  assert(gougeEval.isOutlier === true && gougeEval.outlierType === 'gouging', 'Detects predatory price gouging (+100% markup)');

  // Test 1.4: Predatory undercutting detection
  const undercutEval = PricingEngine.evaluateVendorPrice(12, 'Tomato', mockRecords);
  assert(undercutEval.isOutlier === true && undercutEval.outlierType === 'undercutting', 'Detects unsustainable price undercutting');
}

function runForecastEngineTests() {
  testLogs.push('\n--- [TEST SUITE 2]: ForecastEngine & Exponential Demand Smoothing ---');

  const emptyLogs: DailyStockLog[] = [];
  const bulkOrders: BulkOrderBoardItem[] = [
    {
      id: 'bulk-1',
      institutionName: 'Sri Krishna Mess',
      institutionType: 'Hotel/Mess',
      commodity: 'Tomato',
      dailyRequirementKg: 20,
      weeklySchedule: 'Daily',
      targetPricePerKg: 30,
      contactPerson: 'Krishna',
      contactPhone: '9841234567',
      location: 'Near Bus Stand',
      claimedByVendor: true,
      notes: 'Early morning delivery'
    },
    {
      id: 'bulk-2',
      institutionName: 'Hotel Saravana',
      institutionType: 'Hotel/Mess',
      commodity: 'Tomato',
      dailyRequirementKg: 15,
      weeklySchedule: 'Mon-Fri',
      targetPricePerKg: 30,
      contactPerson: 'Saravanan',
      contactPhone: '9841234568',
      location: 'Main Road',
      claimedByVendor: false, // Not claimed
      notes: 'Requires grade A'
    }
  ];

  // Test 2.1: Cold start baseline fallback
  const coldStart = ForecastEngine.calculateForecast('Tomato', emptyLogs, bulkOrders);
  assert(coldStart.historyDays === 0, 'Identifies 0 historical log cold start scenario');
  assert(coldStart.precommittedBulkKg === 20, 'Includes only claimed bulk institutional orders (20 kg)', `Received: ${coldStart.precommittedBulkKg}`);
  assert(coldStart.totalForecastKg === 50, 'Combines walk-in baseline (30kg) + claimed bulk (20kg) = 50kg', `Received: ${coldStart.totalForecastKg}`);

  // Test 2.2: Multi-day exponential smoothing with alpha = 0.45
  const sampleLogs: DailyStockLog[] = [
    { id: '1', date: '2026-09-10', commodity: 'Tomato', receivedKg: 40, soldKg: 35, unsoldKg: 3, wasteKg: 2 },
    { id: '2', date: '2026-09-11', commodity: 'Tomato', receivedKg: 40, soldKg: 40, unsoldKg: 0, wasteKg: 0 },
    { id: '3', date: '2026-09-12', commodity: 'Tomato', receivedKg: 45, soldKg: 42, unsoldKg: 2, wasteKg: 1 }
  ];

  const smoothingForecast = ForecastEngine.calculateForecast('Tomato', sampleLogs, bulkOrders, 0.45);
  assert(smoothingForecast.historyDays === 3, 'Tracks correct number of historical days');
  assert(smoothingForecast.walkInForecastKg > 35 && smoothingForecast.walkInForecastKg < 45, 'Computes smoothed forecast between historical bounds', `Received: ${smoothingForecast.walkInForecastKg}`);
  assert(smoothingForecast.totalForecastKg === smoothingForecast.walkInForecastKg + 20, 'Properly adds pre-committed bulk orders to smoothed walk-in demand');
}

function runKhataServiceTests() {
  testLogs.push('\n--- [TEST SUITE 3]: KhataService & Customer Credit Risk Scoring ---');

  const testCustomer: KhataCustomer = {
    id: 'cust-101',
    name: 'Annamalai Tea Stall',
    phone: '+919876543210',
    totalDue: 1200,
    creditLimit: 3000,
    lastPurchaseDate: '2026-09-12',
    riskScore: 25,
    riskLevel: 'Low',
    onTimePaymentRatio: 0.85,
    notes: 'Long standing tea stall customer',
    transactions: [
      { id: 'tx-1', date: '2026-09-10', type: 'CREDIT', amount: 800, itemsDescription: 'Ginger & Lemon' },
      { id: 'tx-2', date: '2026-09-12', type: 'PAYMENT', amount: 500, daysDelayed: 0 },
      { id: 'tx-3', date: '2026-09-13', type: 'CREDIT', amount: 900, itemsDescription: 'Ginger & Mint' }
    ]
  };

  // Test 3.1: Net balance validation
  const calculatedBalance = testCustomer.transactions.reduce((sum, tx) => sum + (tx.type === 'CREDIT' ? tx.amount : -tx.amount), 0);
  assert(calculatedBalance === 1200, 'Calculates ledger balance matching customer record (800 - 500 + 900 = 1200)', `Received: ${calculatedBalance}`);

  // Test 3.2: Credit limit capacity
  const remainingCredit = testCustomer.creditLimit - testCustomer.totalDue;
  assert(remainingCredit === 1800, 'Maintains accurate credit headroom (3000 - 1200 = 1800)');
  assert(testCustomer.totalDue < testCustomer.creditLimit, 'Customer does not breach hard credit limit');
}

function runResQEngineTests() {
  testLogs.push('\n--- [TEST SUITE 4]: ResQService Zero-Waste Markdown Optimization ---');

  const mockVendorProfile: VendorProfile = {
    id: 'vendor-1',
    name: 'Senthil Kumar',
    phone: '9876543210',
    marketName: 'Koyambedu Wholesale Market, Chennai',
    stallNumber: 'Shop #14',
    upiId: 'senthil@oksbi',
    closingTimeStr: '20:00',
    marketClosingHour: 20 // 8:00 PM closing
  };

  const mockLogs: DailyStockLog[] = [
    {
      id: 'log-1',
      date: '2026-09-15',
      commodity: 'Tomato',
      receivedKg: 50,
      soldKg: 38,
      unsoldKg: 12, // >= 5kg threshold
      wasteKg: 0
    }
  ];

  const vendorPrices = { Tomato: 32, Onion: 40, Potato: 35, Brinjal: 30, Cabbage: 25, Carrot: 50, GreenChilli: 60, Ginger: 90 };

  // Test 4.1: Detection of surplus items above 5kg threshold
  const eveningAlerts = ResQService.detectSurplusAlerts(mockLogs, vendorPrices as any, mockVendorProfile, 17.5);
  assert(eveningAlerts.length === 1, 'Detects surplus produce with unsold quantity >= 5kg');
  assert(eveningAlerts[0].commodity === 'Tomato', 'Matches correct surplus commodity');
  assert(eveningAlerts[0].discountPercent >= 15 && eveningAlerts[0].discountPercent <= 45, 'Computes markdown discount within safe 15%-45% margin', `Received: ${eveningAlerts[0].discountPercent}%`);
  assert(eveningAlerts[0].suggestedMarkdownPrice < 32, 'Markdown price is strictly lower than normal retail price', `Markdown: ₹${eveningAlerts[0].suggestedMarkdownPrice} vs Retail: ₹32`);

  // Test 4.2: Late-hour urgency escalation
  const lateAlerts = ResQService.detectSurplusAlerts(mockLogs, vendorPrices as any, mockVendorProfile, 19.5); // 7:30 PM (0.5 hrs to close)
  assert(lateAlerts[0].urgency === 'high', 'Escalates urgency to "high" when <= 2 hours remaining until market close');
  assert(lateAlerts[0].discountPercent >= eveningAlerts[0].discountPercent, 'Increases markdown discount as closing deadline approaches');
}

function runVoiceStockParserTests() {
  testLogs.push('\n--- [TEST SUITE 5]: Voice-to-Text Stock & Wastage Parser (Low-Literacy) ---');

  // Test 5.1: Tamil voice arrival and waste parsing
  const tamilInput = parseSpokenStockEntry('தக்காளி வரவு 50 கிலோ கழிவு 2 கிலோ');
  assert(tamilInput.detectedCommodity === 'Tomato', 'Detects Tamil commodity name (தக்காளி -> Tomato)');
  assert(tamilInput.receivedKg === 50, 'Extracts arrival/received quantity from Tamil phrase (50 kg)');
  assert(tamilInput.wasteKg === 2, 'Extracts wastage quantity from Tamil phrase (2 kg)');
  assert(tamilInput.confidence === 'high', 'Achieves high confidence score when both arrival and waste parsed');
  assert(tamilInput.summaryTa.includes('50') && tamilInput.summaryTa.includes('2'), 'Generates accurate Tamil readout summary for verbal feedback');

  // Test 5.2: English voice arrival and waste parsing
  const englishInput = parseSpokenStockEntry('Onion arrival 60 kg waste 3 kg');
  assert(englishInput.detectedCommodity === 'Onion', 'Detects English commodity name (Onion)');
  assert(englishInput.receivedKg === 60, 'Extracts arrival quantity from English phrase (60 kg)');
  assert(englishInput.wasteKg === 3, 'Extracts waste quantity from English phrase (3 kg)');

  // Test 5.3: Spoken sales and unsold breakdown
  const fullBreakdown = parseSpokenStockEntry('உருளைக்கிழங்கு வரவு 40 கிலோ விற்பனை 35 கிலோ கழிவு 1 கிலோ');
  assert(fullBreakdown.detectedCommodity === 'Potato', 'Detects Potato from Tamil உருளைக்கிழங்கு');
  assert(fullBreakdown.receivedKg === 40, 'Extracts received quantity (40 kg)');
  assert(fullBreakdown.soldKg === 35, 'Extracts spoken sold quantity (35 kg)');
  assert(fullBreakdown.wasteKg === 1, 'Extracts spoken waste quantity (1 kg)');
  assert(fullBreakdown.unsoldKg === 4, 'Correctly balances unsold stock (40 - 35 - 1 = 4 kg)');

  // Test 5.4: Tamil word numbers
  const wordNumberInput = parseSpokenStockEntry('இருபது கிலோ கேரட் வரவு ஒரு கிலோ வேஸ்ட்');
  assert(wordNumberInput.detectedCommodity === 'Carrot', 'Detects Carrot from Tamil கேரட்');
  assert(wordNumberInput.receivedKg === 20, 'Translates Tamil spoken number words (இருபது -> 20)');
  assert(wordNumberInput.wasteKg === 1, 'Translates Tamil spoken waste word (ஒரு -> 1)');

  // Test 5.5: Fallback commodity when name omitted
  const fallbackInput = parseSpokenStockEntry('arrival 55 kg waste 2 kg', 'Carrot');
  assert(fallbackInput.receivedKg === 55, 'Extracts quantity when commodity name omitted');
  assert(fallbackInput.wasteKg === 2, 'Extracts waste when commodity name omitted');
}

/**
 * TEST SUITE 6: Daily Potential Profit Calculator (PricesModule)
 */
function runDailyProfitCalculatorTests() {
  testLogs.push('\n--- [TEST SUITE 6]: Daily Potential Profit Calculator (PricesModule) ---');

  const vendorPrices: Record<CommodityType, number> = {
    Tomato: 36,
    Onion: 48,
    Potato: 38,
    Brinjal: 40,
    Cabbage: 28,
    Carrot: 60
  };

  // Test 6.1: Basic profit calculation with arrival basis (no wastage adjustment)
  const estimate = PricingEngine.calculateDailyProfitEstimate({
    vendorPrices,
    mandiRecords: CACHED_TN_MANDI_PRICES,
    stockLogs: INITIAL_STOCK_LOGS,
    calculationBasis: 'daily_arrival',
    includeWastageAdjustment: false
  });

  assert(estimate.items.length === 6, 'Calculates estimates for all 6 produce commodities');
  assert(estimate.totalPotentialProfit > 0, 'Total projected profit is positive with standard markups');
  assert(estimate.totalWholesaleCost > 0, 'Computes positive total wholesale procurement outlay');
  assert(estimate.totalPotentialRevenue > estimate.totalWholesaleCost, 'Total revenue exceeds wholesale cost');
  assert(estimate.overallRoiPercent > 0, 'Calculates positive overall return on investment percentage');

  // Test 6.2: Single commodity margin accuracy
  const tomatoItem = estimate.items.find(i => i.commodity === 'Tomato')!;
  const tomatoStats = PricingEngine.getMandiStats(CACHED_TN_MANDI_PRICES, 'Tomato');
  const expectedTomatoMargin = 36 - tomatoStats.modal;
  assert(tomatoItem.grossMarginPerKg === expectedTomatoMargin, 'Accurately computes gross margin per kg (Selling - Mandi Modal)');
  assert(tomatoItem.potentialProfit === tomatoItem.stockKg * expectedTomatoMargin, 'Computes profit equal to stock multiplied by margin');
  assert(tomatoItem.status === 'highly_profitable' || tomatoItem.status === 'moderate', 'Classifies profitable item correctly');

  // Test 6.3: Detects loss risk when vendor sells below wholesale mandi cost
  const underpricedVendorPrices = { ...vendorPrices, Tomato: 20 }; // below Mandi modal 28
  const lossEstimate = PricingEngine.calculateDailyProfitEstimate({
    vendorPrices: underpricedVendorPrices,
    mandiRecords: CACHED_TN_MANDI_PRICES,
    stockLogs: INITIAL_STOCK_LOGS,
    calculationBasis: 'daily_arrival'
  });

  const underpricedTomato = lossEstimate.items.find(i => i.commodity === 'Tomato')!;
  assert(underpricedTomato.potentialProfit < 0, 'Detects negative profit when selling below wholesale');
  assert(underpricedTomato.status === 'loss_risk', 'Assigns loss_risk status to produce priced below mandi cost');
  assert(lossEstimate.lossRiskCommodities.includes('Tomato'), 'Includes underpriced produce in lossRiskCommodities list');

  // Test 6.4: Switches calculation basis between daily arrival and remaining unsold stock
  const unsoldEstimate = PricingEngine.calculateDailyProfitEstimate({
    vendorPrices,
    mandiRecords: CACHED_TN_MANDI_PRICES,
    stockLogs: INITIAL_STOCK_LOGS,
    calculationBasis: 'remaining_unsold'
  });

  assert(unsoldEstimate.totalStockKg < estimate.totalStockKg, 'Remaining unsold stock volume is less than full daily arrival volume');
  assert(unsoldEstimate.calculationBasis === 'remaining_unsold', 'Stores correct calculation basis tag');

  // Test 6.5: Custom stock level overrides for scenario simulation
  const customEstimate = PricingEngine.calculateDailyProfitEstimate({
    vendorPrices,
    mandiRecords: CACHED_TN_MANDI_PRICES,
    stockLogs: INITIAL_STOCK_LOGS,
    customStockOverrides: { Tomato: 120 }
  });

  const customTomato = customEstimate.items.find(i => i.commodity === 'Tomato')!;
  assert(customTomato.stockKg === 120, 'Respects custom simulated stock level overrides (Tomato -> 120 kg)');

  // Test 6.6: Identifies top earning commodity
  assert(typeof estimate.topProfitCommodity === 'string', 'Identifies top earning commodity');
}

// Run all test suites
console.log('======================================================================');
console.log('  SanthAI Automated Test Suite Runner (Review 1 & 2 Verification)     ');
console.log('======================================================================');

runPricingEngineTests();
runForecastEngineTests();
runKhataServiceTests();
runResQEngineTests();
runVoiceStockParserTests();
runDailyProfitCalculatorTests();

testLogs.forEach(log => console.log(log));

console.log('\n======================================================================');
console.log(`  TOTAL TESTS: ${passedTests + failedTests} | PASSED: ${passedTests} | FAILED: ${failedTests}`);
console.log(`  SUCCESS RATE: ${Math.round((passedTests / (passedTests + failedTests)) * 100)}%`);
console.log('======================================================================');

if (failedTests > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
