# SanthAI – Low-Literacy, Voice-First Produce Vendor Intelligence Platform

> **Milestone Status:** Review 1 (Phase 1: Architecture, Core Intelligence Engines & Production UI — 35% Completed)  
> **Lead Developer:** ksramkumar2148@gmail.com  
> **Target Domain:** Agritech / Retail Micro-Enterprises / Informal Mandi Economy  
> **Production Live URL:** [https://ais-pre-q2k7no3arxtftmpc4pyrrm-158741063681.asia-southeast1.run.app](https://ais-pre-q2k7no3arxtftmpc4pyrrm-158741063681.asia-southeast1.run.app)

---

## 1. System Architecture & Component Hierarchy

SanthAI is architected as an offline-first Progressive Web Application (PWA) with client-side reactive state management and serverless API integration for live wholesale pricing.

```
+-----------------------------------------------------------------------------------+
|                                 SanthAI Frontend                                  |
|                                                                                   |
|  +-----------------------------------------------------------------------------+  |
|  |                    ErrorBoundary (App Crash & Data Isolation)               |  |
|  |                                                                             |  |
|  |  +-----------------------------------------------------------------------+  |  |
|  |  |                 Navbar (Lang, Theme, Outdoor Sunlight Mode, TTS)      |  |  |
|  |  +-----------------------------------------------------------------------+  |  |
|  |  |                 MarketPulseTicker (Live Mandi Wholesale Strip)        |  |  |
|  |  +-----------------------------------------------------------------------+  |  |
|  |  |                 MarketSessionBanner (Morning / Day / Evening Phase)   |  |  |
|  |  +-----------------------------------------------------------------------+  |  |
|  |  |                                                                       |  |  |
|  |  |   [Stock Module]       [Prices Module]     [ResQ Module]  [Khata Module] |  |  |
|  |  |   - Inventory Logs     - Mandi Z-Scores    - Markdown     - Ledger       |  |  |
|  |  |   - SES Forecasting    - Corridor Audit    - WhatsApp     - Risk Scoring |  |  |
|  |  |   - Bulk Demand        - Trust Index       - Clearance    - Receipts     |  |  |
|  |  +-----------------------------------------------------------------------+  |  |
|  |  |      DataVaultModal (Encrypted JSON Export/Import & Offline Resilience)|  |  |
|  +--+-----------------------------------------------------------------------+--+  |
+-----------------------------------------------------------------------------------+
                                        |
                                        v
                    +---------------------------------------+
                    |       API Endpoint Layer              |
                    |       GET /api/mandi-prices           |
                    |       (Agmarknet data.gov.in Proxy)   |
                    +---------------------------------------+
```

---

## 2. Database Schema & Data Models

SanthAI persists vendor data locally using structured schema models designed for high relational integrity, offline operation, and seamless JSON export.

### 2.1 Commodity Master Catalog (`Commodity`)
| Field | Type | Description | Constraints |
| :--- | :--- | :--- | :--- |
| `name` | `CommodityType` | Unique identifier (e.g., 'Tomato', 'Onion') | Primary Key, Enum |
| `tamilName` | `string` | Vernacular script representation (e.g., 'தக்காளி') | Required |
| `category` | `string` | Category grouping ('Vegetable' \| 'Root' \| 'Spice') | Required |
| `perishabilityDays`| `number` | Shelf-life span before unmarketable spoilage | Integer (1 - 30) |
| `standardUnit` | `string` | Default measurement unit (e.g., 'kg', 'bundle') | Default: 'kg' |
| `icon` | `string` | Emoji or visual visual glyph | Required |

### 2.2 Mandi Price Record Schema (`MandiPriceRecord`)
| Field | Type | Description | Sample Value |
| :--- | :--- | :--- | :--- |
| `id` | `string` | Unique record composite key | `"koyambedu_tomato_20260915"` |
| `commodity` | `CommodityType` | Standardized produce name | `"Tomato"` |
| `state` | `string` | Mandi state jurisdiction | `"Tamil Nadu"` |
| `district` | `string` | Revenue district | `"Chennai"` |
| `market` | `string` | Regulated wholesale market name | `"Koyambedu Market"` |
| `variety` | `string` | Crop variety grade | `"Hybrid / Local"` |
| `minPricePerKg` | `number` | Daily floor wholesale price (₹/kg) | `24.00` |
| `maxPricePerKg` | `number` | Daily ceiling wholesale price (₹/kg) | `32.00` |
| `modalPricePerKg`| `number` | Most frequent transactional price (₹/kg) | `28.00` |
| `arrivalTons` | `number` | Market daily influx volume (metric tonnes) | `142` |
| `date` | `string` | ISO 8601 recording date | `"2026-09-15"` |

### 2.3 Daily Stock & Inventory Log Schema (`DailyStockLog`)
| Field | Type | Description | Constraints |
| :--- | :--- | :--- | :--- |
| `id` | `string` | Unique log UUID | Primary Key |
| `date` | `string` | Transaction business date | YYYY-MM-DD |
| `commodity` | `CommodityType` | Item tracked | Foreign Key to Commodity |
| `procuredKg` | `number` | Total morning wholesale procurement | $\ge 0$ |
| `soldKg` | `number` | Total retail quantity sold | $\ge 0$ |
| `unsoldKg` | `number` | Surplus quantity at close of business | Calculated: $\text{Procured} - \text{Sold} - \text{Discarded}$ |
| `discardedKg` | `number` | Spoiled/decayed waste volume | $\ge 0$ |
| `procurementPricePerKg` | `number` | Morning wholesale purchase cost | ₹/kg |
| `retailPricePerKg` | `number` | Stall retail selling price | ₹/kg |

### 2.4 Customer Khata Ledger Schema (`KhataCustomer` & `KhataTransaction`)
```typescript
interface KhataCustomer {
  id: string;                    // Primary key (UUID / 'cust-101')
  name: string;                  // Customer or business name ('Annamalai Tea Stall')
  phone: string;                 // WhatsApp contact number ('+919876543210')
  type: 'Tea Stall' | 'Mess' | 'Hotel' | 'Regular Consumer';
  trustScore: number;            // Normalized credit score (0 - 100)
  outstandingBalance: number;    // Cumulative pending credit (INR)
  creditLimit: number;           // Maximum allowed exposure (INR)
  lastPaymentDate: string;       // YYYY-MM-DD
  transactions: KhataTransaction[];
}

interface KhataTransaction {
  id: string;                    // Transaction UUID
  date: string;                  // ISO Date
  type: 'credit' | 'payment';    // Balance addition vs. settlement
  amount: number;                // Rupee value
  commodity?: string;            // Item description for credit
  notes?: string;                // Context note ('GPay', 'Morning delivery')
  daysDelayed?: number;          // Days past scheduled payment terms
}
```

---

## 3. API Endpoints Specification

### 3.1 Live Mandi Prices Feed
- **Endpoint:** `GET /api/mandi-prices`
- **Controller:** `api/mandi-prices.ts`
- **Upstream Source:** National Agmarknet Portal (`api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070`)

#### Query Parameters:
| Param | Type | Required | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `state` | `string` | No | `"Tamil Nadu"` | Target state filter |
| `commodity` | `string` | No | `all` | Filter by commodity ('Tomato', 'Onion', etc.) |
| `limit` | `number` | No | `50` | Maximum records returned |

#### HTTP Response Schema (200 OK):
```json
{
  "status": "ok",
  "source": "Live Agmarknet API (data.gov.in)",
  "records": [
    {
      "state": "Tamil Nadu",
      "district": "Chennai",
      "market": "Koyambedu Market",
      "commodity": "Tomato",
      "variety": "Hybrid / Local",
      "arrival_date": "15/09/2026",
      "min_price": "24",
      "max_price": "32",
      "modal_price": "28",
      "arrivals_tonnes": "142"
    }
  ],
  "total": 42,
  "updatedAt": "2026-09-15T10:30:00.000Z"
}
```

#### Cache-Control Policy:
- `Cache-Control: public, s-maxage=21600, stale-while-revalidate=3600`
- Provides 6-hour shared edge caching with 1-hour background revalidation to guarantee sub-50ms latency for mobile vendors while preventing rate-limiting on government APIs.

---

## 4. Error Boundaries & Client Resilience

Informal market stall environments suffer from frequent device overheating, unexpected connection drops, and browser memory throttling. SanthAI implements an enterprise React Error Boundary:

- **Component:** `src/components/ErrorBoundary.tsx`
- **Isolation Scope:** Encapsulates the entire `<App />` root in `src/main.tsx`.
- **Key Capabilities:**
  1. **Zero Data Loss:** Traps JavaScript runtime render exceptions before unmounting state, serializing current `santhai_*` LocalStorage keys into an isolated emergency recovery object.
  2. **Soft Session Retry:** Allows vendors to restart the rendering loop without reloading the page or clearing session state via `getDerivedStateFromError`.
  3. **1-Tap Emergency JSON Export:** Vendors can download an instant offline backup file (`santhai_emergency_backup_*.json`) directly from the crash screen.
  4. **Vernacular Diagnostics:** Bilingual error notifications (Tamil & English) explaining stall data security to low-literacy vendors.

---

## 5. Unit Testing Strategy & Test Coverage Matrix

The repository contains an automated test runner (`npm test` / `tsx src/services/__tests__/runAllTests.ts`) executing 24 deterministic unit test cases across all four mathematical core engines:

| Test Suite | Subsystem Under Test | Assertions Covered | Pass Rate |
| :--- | :--- | :--- | :--- |
| **Suite 1** | `PricingEngine` | Modal mean calculation, sample variance & std dev, minimum/maximum floor bounds, fair price corridor verification, predatory price-gouging outlier detection ($Z > +1.8$), and predatory undercutting detection ($Z < -1.8$). | **100% (8/8)** |
| **Suite 2** | `ForecastEngine` | Zero-history cold start baseline fallbacks, pre-committed institutional bulk order aggregation, single exponential smoothing with $\alpha = 0.45$, Mean Absolute Deviation (MAD), and margin of error estimation. | **100% (6/6)** |
| **Suite 3** | `KhataService` | Net debit/credit arithmetic ledger reconciliation, recency-weighted late payment penalties, credit limit breach warnings, and customer risk scoring (0-100 scale). | **100% (4/4)** |
| **Suite 4** | `ResQService` | $\ge 5\text{ kg}$ surplus inventory detection, time-to-close dynamic markdown percentage calculation (15% to 45%), closing hour urgency escalation, and WhatsApp alert generation. | **100% (6/6)** |
| **Suite 5** | `VoiceStockParser` | Spoken Tamil and English commodity extraction, arrival and spoilage quantity identification, spoken number word translation (`இருபது` -> 20, `ஒரு` -> 1), keyword/number order awareness, and audio readback generation. | **100% (18/18)** |
| **Suite 6** | `PricingEngine` (Profit Calculator) | Potential daily net profit estimation, Mandi wholesale modal vs. vendor retail margin calculation, dual basis evaluation (`daily_arrival` vs. `remaining_unsold`), below-cost underpricing alerts (`loss_risk`), custom stock simulation overrides, and top-profit commodity identification. | **100% (15/15)** |

### Executing the Test Suite:
```bash
npm test
```
**Output Summary:**
```text
======================================================================
  TOTAL TESTS: 57 | PASSED: 57 | FAILED: 0
  SUCCESS RATE: 100%
======================================================================
```

---

## 6. How to Run, Build & Verify Locally

### Prerequisites
- Node.js 18+ or Bun
- npm or bun

### Commands
```bash
# 1. Install dependencies
npm install

# 2. Run automated unit testing suite
npm test

# 3. Validate TypeScript types (Strict static check)
npm run lint

# 4. Start local development server (Port 3000)
npm run dev

# 5. Compile production build
npm run build
```
