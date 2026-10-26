# SanthAI Automated Unit Testing & Algorithmic Verification Guide

> **Review 2 & 3 Compliance Document**: Granular Technical Documentation for Automated Unit Testing Suites, Mathematical Invariants, and Test Harness Architecture.

---

## 1. Executive Summary & Verification Philosophy

SanthAI is an offline-first, voice-enabled intelligent market operating system designed for informal produce merchants and daily mandi vendors in Tamil Nadu. Because produce vendors operate with razor-thin margins (typically 8% to 18%) and face rapid commodity spoilage (3% to 12% daily wastage), algorithmic correctness in pricing corridors, stock forecasting, credit risk, and markdown clearance is critical to vendor survival.

To guarantee zero regression and mathematical determinism, SanthAI includes an automated test harness implemented in TypeScript and executed via Node.js/tsx (`npm test`). The suite requires no external mock servers or internet connectivity; all mathematical formulas are tested against known deterministic ground truths and boundary conditions.

### Test Execution Summary
- **Total Test Suites**: 6 Suites
- **Total Executed Tests**: 64 Unit Tests
- **Pass Rate**: 100% (64 Passed, 0 Failed, 0 Skipped)
- **Execution Time**: ~450ms
- **Test Runner Command**:
  ```bash
  npm test
  # Directly runs: tsx src/services/__tests__/runAllTests.ts
  ```

---

## 2. Test Harness Architecture

The test harness is implemented in `src/services/__tests__/runAllTests.ts`. It utilizes a lightweight, high-performance assertion engine that executes directly in the TypeScript runtime without heavyweight Jest or Mocha overhead, ensuring instantaneous feedback during development and deployment builds:

```typescript
// Core Assertion Signature
function assert(condition: boolean, testName: string, details?: string): void;
```

When an assertion fails, the runner logs the failure message, detailed diff, and exits with status code `1`, causing CI/CD pipelines and deployment scripts (`npm test && npm run build`) to immediately abort.

---

## 3. Detailed Test Suite Specifications

### Test Suite 1: `PricingEngine` & Mandi Statistical Dispersion (9 Tests)
- **Target File**: `src/services/pricing.ts`
- **Core Algorithm**: Statistical sample dispersion and fair price corridor computation over wholesale mandi arrival data.
- **Mathematical Formulations**:
  $$\mu = \frac{1}{N} \sum_{i=1}^N P_{\text{modal}, i}$$
  $$s = \sqrt{\frac{1}{N-1} \sum_{i=1}^N (P_{\text{modal}, i} - \mu)^2}$$
  $$Z = \frac{P_{\text{vendor}} - \mu}{s}$$
  $$\text{Fair Corridor} = \left[ 0.95 \cdot P_{\text{modal}}, 1.35 \cdot P_{\text{modal}} \right]$$

#### Unit Test Breakdown:
| Test ID | Test Description | Input Vector | Expected Invariant / Assertion | Status |
|---|---|---|---|:---:|
| `1.1` | Mean modal wholesale price computation | Koyambedu (₹25), Mattuthavani (₹27), Oddanchatram (₹29) | $\mu = \frac{25 + 27 + 29}{3} = 27.0\text{ ₹/kg}$ | ✅ PASS |
| `1.2` | Minimum floor wholesale detection | Prices across 3 mandis: [20, 22, 24] | $\min = 20.0\text{ ₹/kg}$ | ✅ PASS |
| `1.3` | Maximum ceiling wholesale detection | Prices across 3 mandis: [30, 32, 34] | $\max = 34.0\text{ ₹/kg}$ | ✅ PASS |
| `1.4` | Non-zero sample standard deviation | Price variance across 3 distinct wholesale markets | $s > 0$ (Dispersion verified) | ✅ PASS |
| `1.5` | Fair pricing outlier suppression | Vendor retail price = ₹28/kg (Mandi modal = ₹27) | `isOutlier === false` | ✅ PASS |
| `1.6` | Fair price classification type | Vendor retail price = ₹28/kg | `outlierType === 'none'` | ✅ PASS |
| `1.7` | Fair corridor boundary inclusion | Vendor price = ₹28/kg | $P_{\text{vendor}} \in [0.95 \cdot 27, 1.35 \cdot 27] = [25.65, 36.45]$ | ✅ PASS |
| `1.8` | Predatory price gouging detection | Vendor retail price = ₹60/kg (+122% markup over ₹27) | `isOutlier === true && outlierType === 'gouging'` | ✅ PASS |
| `1.9` | Predatory undercutting detection | Vendor retail price = ₹12/kg (-55% below wholesale floor) | `isOutlier === true && outlierType === 'undercutting'` | ✅ PASS |

---

### Test Suite 2: `ForecastEngine` & Exponential Demand Smoothing (6 Tests)
- **Target File**: `src/services/forecast.ts`
- **Core Algorithm**: Brown's Single Exponential Smoothing (SES) coupled with Pre-committed Institutional Demand Aggregation.
- **Mathematical Formulations**:
  $$F_{t+1} = \alpha Y_t + (1 - \alpha) F_t$$
  $$\text{Total Procurement} = F_{\text{walk-in}, t+1} + \sum_{k \in \text{ClaimedBulk}} Q_{k}$$

#### Unit Test Breakdown:
| Test ID | Test Description | Input Vector | Expected Invariant / Assertion | Status |
|---|---|---|---|:---:|
| `2.1` | Cold-start zero history fallback | `logs: []`, Bulk: Sri Krishna Mess (20kg claimed), Saravana (15kg unclaimed) | `historyDays === 0` | ✅ PASS |
| `2.2` | Claimed bulk order aggregation | Bulk order board with claimed (20kg) and unclaimed (15kg) | `precommittedBulkKg === 20` (Unclaimed strictly omitted) | ✅ PASS |
| `2.3` | Cold-start total procurement calculation | Default walk-in baseline (30kg) + Claimed bulk (20kg) | `totalForecastKg === 50` | ✅ PASS |
| `2.4` | Historical log chronological tracking | 3 days of historical logs: [35kg, 40kg, 42kg sales] | `historyDays === 3` | ✅ PASS |
| `2.5` | Exponential smoothing bounds | Realized sales: [35, 40, 42], $\alpha = 0.45$ | $35 < F_{\text{walk-in}} < 45$ | ✅ PASS |
| `2.6` | Precommitted bulk addition to smoothed walk-in | Smoothed walk-in demand + 20kg claimed bulk | `totalForecastKg === walkInForecastKg + 20` | ✅ PASS |

---

### Test Suite 3: `KhataService` & Credit Risk Scoring (10 Tests)
- **Target File**: `src/services/khata.ts`
- **Core Algorithm**: Double-entry ledger reconciliation, credit limit headroom monitoring, and NPCI UPI QR string encoding.
- **Mathematical Formulations**:
  $$\text{Balance Due} = \sum \text{Debit}_{\text{credit\_sales}} - \sum \text{Credit}_{\text{payments}}$$
  $$\text{Credit Headroom} = \text{Credit Limit} - \text{Balance Due}$$
  $$\text{UPI URI Scheme} = \text{upi://pay?pa=}\langle\text{VPA}\rangle\text{\&pn=}\langle\text{Merchant}\rangle\text{\&am=}\langle\text{Due}\rangle\text{\&cu=INR\&tn=}\langle\text{Note}\rangle$$

#### Unit Test Breakdown:
| Test ID | Test Description | Input Vector | Expected Invariant / Assertion | Status |
|---|---|---|---|:---:|
| `3.1` | Double-entry ledger balance computation | Tx: Credit ₹800, Payment ₹500, Credit ₹900 | $800 - 500 + 900 = 1200\text{ ₹}$ | ✅ PASS |
| `3.2` | Credit limit headroom computation | Credit Limit: ₹3000, Total Due: ₹1200 | $3000 - 1200 = 1800\text{ ₹}$ | ✅ PASS |
| `3.3` | Hard credit limit breach check | Due: ₹1200, Limit: ₹3000 | `totalDue < creditLimit === true` | ✅ PASS |
| `3.4` | NPCI UPI URI scheme verification | Vendor VPA: `santhai.traders@okaxis`, Customer: Annamalai Tea Stall | Starts with `upi://pay?` | ✅ PASS |
| `3.5` | Dynamic UPI amount parameter encoding | Customer balance: ₹1200 | Contains `am=1200.00` | ✅ PASS |
| `3.6` | Payee VPA URL encoding | Merchant VPA: `santhai.traders@okaxis` | Contains `pa=santhai.traders%40okaxis` | ✅ PASS |
| `3.7` | Transaction note parameter encoding | Customer: Annamalai Tea Stall | Contains `tn=Khata%20Due%20-%20Annamalai%20Tea%20Stall` | ✅ PASS |
| `3.8` | Custom settlement amount override | Requested partial payment: ₹600 | Contains `am=600.00` | ✅ PASS |
| `3.9` | WhatsApp deep-link generation | Phone: `+919876543210` | Starts with `https://wa.me/` | ✅ PASS |
| `3.10` | WhatsApp reminder due amount payload | Customer balance: ₹1200 | Message payload contains `1200` | ✅ PASS |

---

### Test Suite 4: `ResQService` Zero-Waste Markdown Clearance (6 Tests)
- **Target File**: `src/services/resq.ts`
- **Core Algorithm**: Dynamic markdown heuristic incorporating remaining perishable stock volume and market closing deadline decay.
- **Mathematical Formulations**:
  $$\Delta t = \max(0.5, \min(8.0, \tau_{\text{close}} - t_{\text{current}}))$$
  $$\text{Discount \%} = \min(45, \max(15, 15 + (4 - \Delta t)\cdot 5 + (\text{unsold} / 5)\cdot 4))$$
  $$P_{\text{markdown}} = \max(8.0, \text{round}(P_{\text{normal}} \cdot (1 - \text{Discount \%} / 100)))$$

#### Unit Test Breakdown:
| Test ID | Test Description | Input Vector | Expected Invariant / Assertion | Status |
|---|---|---|---|:---:|
| `4.1` | Surplus threshold activation | Unsold = 12 kg (Threshold $\ge$ 5 kg) | `alerts.length === 1` | ✅ PASS |
| `4.2` | Correct commodity identification | Surplus log for 'Tomato' | `alerts[0].commodity === 'Tomato'` | ✅ PASS |
| `4.3` | Bounded discount margin verification | Time: 5:30 PM (2.5 hrs to close) | $15\% \le \text{discountPercent} \le 45\%$ | ✅ PASS |
| `4.4` | Strict markdown price depreciation | Normal retail = ₹32/kg | $P_{\text{markdown}} < 32\text{ ₹/kg}$ | ✅ PASS |
| `4.5` | Late-hour urgency escalation | Time: 7:30 PM (0.5 hrs to 8:00 PM close) | `urgency === 'high'` ($\Delta t \le 2.0\text{ hrs}$) | ✅ PASS |
| `4.6` | Dynamic discount escalation | Comparing 7:30 PM discount vs 5:30 PM discount | $\text{Discount}_{\text{late}} \ge \text{Discount}_{\text{early}}$ | ✅ PASS |

---

### Test Suite 5: Voice-to-Text Stock & Wastage Parser (17 Tests)
- **Target File**: `src/services/voiceStockParser.ts`
- **Core Algorithm**: Rule-based Tamil & English NLP entity extraction with Tamil numeral translation and stock equation balancing.
- **Mathematical Formulations**:
  $$\text{Unsold Kg} = \text{Received Kg} - \text{Sold Kg} - \text{Waste Kg}$$
  $$\text{Confidence} = \begin{cases} \text{'high'}, & \text{if Received, Waste, and Commodity detected} \\ \text{'medium'}, & \text{if Received and Commodity detected} \\ \text{'low'}, & \text{otherwise} \end{cases}$$

#### Unit Test Breakdown:
| Test ID | Test Description | Input Phrase | Expected Invariant / Assertion | Status |
|---|---|---|---|:---:|
| `5.1` | Tamil commodity detection | `"தக்காளி வரவு 50 கிலோ கழிவு 2 கிலோ"` | `detectedCommodity === 'Tomato'` | ✅ PASS |
| `5.2` | Tamil arrival quantity extraction | Phrase containing `"50 கிலோ"` | `receivedKg === 50` | ✅ PASS |
| `5.3` | Tamil wastage quantity extraction | Phrase containing `"கழிவு 2 கிலோ"` | `wasteKg === 2` | ✅ PASS |
| `5.4` | High confidence parsing classification | Dual entity extraction (arrival + waste) | `confidence === 'high'` | ✅ PASS |
| `5.5` | Tamil vocal readout generation | Arrival 50kg, Waste 2kg | Summary string contains `"50"` and `"2"` | ✅ PASS |
| `5.6` | English commodity detection | `"Onion arrival 60 kg waste 3 kg"` | `detectedCommodity === 'Onion'` | ✅ PASS |
| `5.7` | English arrival quantity extraction | Phrase containing `"60 kg"` | `receivedKg === 60` | ✅ PASS |
| `5.8` | English waste quantity extraction | Phrase containing `"waste 3 kg"` | `wasteKg === 3` | ✅ PASS |
| `5.9` | Tamil Potato commodity detection | `"உருளைக்கிழங்கு வரவு 40 கிலோ..."` | `detectedCommodity === 'Potato'` | ✅ PASS |
| `5.10` | Multi-entity received extraction | Full breakdown phrase | `receivedKg === 40` | ✅ PASS |
| `5.11` | Spoken sales quantity extraction | Phrase containing `"விற்பனை 35 கிலோ"` | `soldKg === 35` | ✅ PASS |
| `5.12` | Spoken waste quantity extraction | Phrase containing `"கழிவு 1 கிலோ"` | `wasteKg === 1` | ✅ PASS |
| `5.13` | Stock conservation balancing equation | $40\text{ (rcv)} - 35\text{ (sold)} - 1\text{ (wst)}$ | `unsoldKg === 4` | ✅ PASS |
| `5.14` | Tamil phonetic Carrot detection | Phrase containing `"கேரட்"` | `detectedCommodity === 'Carrot'` | ✅ PASS |
| `5.15` | Spoken Tamil word numeral conversion | Spoken `"இருபது கிலோ"` | `receivedKg === 20` | ✅ PASS |
| `5.16` | Spoken Tamil waste numeral conversion | Spoken `"ஒரு கிலோ வேஸ்ட்"` | `wasteKg === 1` | ✅ PASS |
| `5.17` | Fallback commodity assignment | `"arrival 55 kg waste 2 kg"`, fallback: Carrot | `receivedKg === 55 && wasteKg === 2` | ✅ PASS |

---

### Test Suite 6: Daily Potential Profit Calculator (16 Tests)
- **Target File**: `src/services/pricing.ts` (`calculateDailyProfitEstimate`)
- **Core Algorithm**: Financial margin projection combining wholesale procurement outlay, retail selling prices, and wastage risk.
- **Mathematical Formulations**:
  $$\text{Margin}_{\text{per kg}} = P_{\text{retail}} - P_{\text{mandi modal}}$$
  $$\text{Potential Profit} = Q_{\text{stock}} \cdot \text{Margin}_{\text{per kg}}$$
  $$\text{Total Wholesale Outlay} = \sum Q_{\text{stock}, i} \cdot P_{\text{mandi modal}, i}$$
  $$\text{Overall ROI \%} = \frac{\text{Total Profit}}{\text{Total Wholesale Outlay}} \times 100$$

#### Unit Test Breakdown:
| Test ID | Test Description | Input Vector | Expected Invariant / Assertion | Status |
|---|---|---|---|:---:|
| `6.1` | Multi-commodity projection scope | 6 primary commodities (Tomato, Onion, Potato, Brinjal, Cabbage, Carrot) | `items.length === 6` | ✅ PASS |
| `6.2` | Positive profit projection | Healthy markups above mandi modal | `totalPotentialProfit > 0` | ✅ PASS |
| `6.3` | Wholesale procurement outlay positivity | Wholesale mandi prices with non-zero stock | `totalWholesaleCost > 0` | ✅ PASS |
| `6.4` | Gross revenue exceeds wholesale cost | Positive margin assumptions | `totalPotentialRevenue > totalWholesaleCost` | ✅ PASS |
| `6.5` | Positive return on investment (ROI) | Net positive markup | `overallRoiPercent > 0` | ✅ PASS |
| `6.6` | Unit gross margin accuracy | Tomato selling: ₹36, Mandi modal: ₹28 | `grossMarginPerKg === 8` (36 - 28) | ✅ PASS |
| `6.7` | Item profit scalar multiplication | Stock: 40kg, Margin: ₹8/kg | `potentialProfit === 320` ($40 \times 8$) | ✅ PASS |
| `6.8` | Profitable commodity status classification | Tomato with ₹8/kg margin | `status === 'highly_profitable' \|\| 'moderate'` | ✅ PASS |
| `6.9` | Negative profit detection | Tomato selling: ₹20 (Below Mandi modal ₹28) | `potentialProfit < 0` | ✅ PASS |
| `6.10` | Loss risk status assignment | Produce priced below wholesale cost | `status === 'loss_risk'` | ✅ PASS |
| `6.11` | Loss risk commodity indexing | Tomato underpriced | `lossRiskCommodities.includes('Tomato')` | ✅ PASS |
| `6.12` | Unsold stock volume variance | Comparing 'daily_arrival' vs 'remaining_unsold' | `unsoldEstimate.totalStockKg < arrivalEstimate.totalStockKg` | ✅ PASS |
| `6.13` | Calculation basis metadata tag | Basis: 'remaining_unsold' | `estimate.calculationBasis === 'remaining_unsold'` | ✅ PASS |
| `6.14` | Scenario simulation stock overrides | Tomato stock override = 120 kg | `tomatoItem.stockKg === 120` | ✅ PASS |
| `6.15` | Top earning commodity identification | Profit rankings across 6 commodities | `typeof estimate.topProfitCommodity === 'string'` | ✅ PASS |
| `6.16` | Non-empty top earner name | Valid commodity set | `estimate.topProfitCommodity.length > 0` | ✅ PASS |

---

## 4. How to Extend the Test Suites

To append new test assertions to the SanthAI test harness:

1. Open `src/services/__tests__/runAllTests.ts`.
2. Locate the corresponding suite function or declare a new suite function (e.g., `runOfflineSyncTests()`).
3. Formulate the test input vector and invoke the target service method.
4. Call `assert(booleanCondition, "Descriptive test title", optionalFailureDetails)`.
5. Register the suite execution in the root execution runner at the bottom of `runAllTests.ts`.
6. Run `npm test` to verify zero regressions.
