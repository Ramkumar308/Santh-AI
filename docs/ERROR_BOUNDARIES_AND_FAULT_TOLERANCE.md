# SanthAI Error Boundaries, Fault Isolation & Graceful Degradation Architecture

> **Review 2 & 3 Compliance Document**: Granular Technical Documentation for React Fiber Error Boundaries, 3-Tier Recovery Ladder, Emergency Data Vault, and Async Fault Isolation.

---

## 1. Overview & Operational Realities

Informal produce vendors operate under harsh environmental and operational conditions:
- **Harsh Outdoor Sunlight**: Glare on low-end Android mobile displays makes delicate UI elements invisible.
- **Intermittent Mandi Connectivity**: Crowded wholesale agricultural yards suffer severe 2G/3G packet drops and cellular congestion.
- **Critical Financial Exposure**: Produce merchants cannot afford app crashes during morning retail rush hours or while settling customer credit ledgers. A crash that locks data or loses pending transactions destroys vendor trust.

To survive these conditions, SanthAI implements a fault-tolerant architecture centered on React Error Boundaries, non-render error interceptors, a 3-tier recovery ladder, and an offline-first emergency data vault.

---

## 2. React Error Boundary Lifecycle & Implementation

React Error Boundaries are class components that catch JavaScript errors anywhere in their child component tree during rendering, in lifecycle methods, and in constructors of the whole tree below them.

### Source Code: `src/components/ErrorBoundary.tsx`

```tsx
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  crashTimestamp: string | null;
}
```

### Lifecycle Hook Execution Flow

```
[React Fiber Render Phase]
          │
          ▼
   (Exception Thrown)
          │
          ▼
┌────────────────────────────────────────────────────────┐
│ static getDerivedStateFromError(error: Error)          │
│ • Pure function (No side effects)                      │
│ • Returns: { hasError: true, error, crashTimestamp }  │
│ • Triggers fallback UI render without crashing DOM     │
└────────────────────────────────────────────────────────┘
          │
          ▼
┌────────────────────────────────────────────────────────┐
│ componentDidCatch(error: Error, errorInfo: ErrorInfo)  │
│ • Commit Phase (Side effects allowed)                  │
│ • Captures React component stack trace                 │
│ • Writes telemetry snapshot to localStorage            │
│   Key: 'santhai_last_crash_log'                        │
│ • Dispatches audio chime & haptic feedback             │
└────────────────────────────────────────────────────────┘
```

### Telemetry Crash Schema (`santhai_last_crash_log`)
When an unhandled render error occurs, `componentDidCatch` immediately records a JSON payload into `localStorage`:
```json
{
  "timestamp": "2026-10-26T06:30:15.123Z",
  "name": "TypeError",
  "message": "Cannot read properties of undefined (reading 'modalPricePerKg')",
  "stack": "TypeError: Cannot read properties of undefined...\n at PricesModule.tsx:142",
  "componentStack": "\n in PricesModule (at App.tsx:128)\n in ErrorBoundary (at App.tsx:112)",
  "userAgent": "Mozilla/5.0 (Linux; Android 13; SM-A536B)...",
  "url": "http://localhost:3000/"
}
```

---

## 3. What Error Boundaries Do NOT Catch (and How SanthAI Solves It)

Per the React specification, Error Boundaries do **not** catch errors for:
1. **Event handlers** (e.g., `onClick`, `onSubmit`)
2. **Asynchronous callbacks** (e.g., `setTimeout`, `requestAnimationFrame`, `fetch`, Promises)
3. **Server-side rendering** (SSR)
4. **Errors thrown in the Error Boundary itself** rather than its children

### SanthAI Non-Render Fault Isolation Strategy:

1. **Global Unhandled Rejection Interceptors**:
   In `src/main.tsx` and `src/App.tsx`, global listeners capture uncaught async Promise rejections and network faults:
   ```typescript
   window.addEventListener('unhandledrejection', (event) => {
     console.error('[SanthAI Async Error Interceptor]:', event.reason);
     // Prevent white screen crash; log to diagnostics
     try {
       localStorage.setItem('santhai_async_error_log', JSON.stringify({
         timestamp: new Date().toISOString(),
         reason: String(event.reason?.message || event.reason)
       }));
     } catch {}
   });
   ```

2. **Inline Protective Try/Catch with Audio/Haptic Feedback**:
   All user-initiated action handlers (e.g. adding a khata ledger transaction, clearing inventory, calculating markdowns) wrap state modifications in localized `try/catch` blocks:
   ```typescript
   try {
     const upi = KhataService.generateUpiUrl(customer, vendor);
     setUpiQrUrl(upi);
   } catch (err) {
     console.warn('[Khata Action Guard]: Falling back to standard UPI ID');
     navigator?.vibrate?.([100, 50, 100]); // Dual haptic pulse
     setNotification('UPI QR generation failed; displaying vendor VPA text.');
   }
   ```

---

## 4. The Three-Tier Vendor Recovery Ladder

When an unhandled render crash is caught by `ErrorBoundary`, the vendor is presented with an outdoor-high-contrast recovery interface offering three graduated tiers of resolution:

```
┌────────────────────────────────────────────────────────┐
│                   SANTHAI CRASH SCREEN                 │
│         விண்ணப்பத்தில் எதிர்பாராத பிழை ஏற்பட்டது          │
│               (Unexpected Error Encountered)           │
├────────────────────────────────────────────────────────┤
│                                                        │
│  [TIER 1: SOFT RESET]                                  │
│  "Try Again / மீண்டும் முயற்சி செய்"                      │
│  • Resets component error state                        │
│  • Keeps in-memory React state if salvageable          │
│                                                        │
│  [TIER 2: HARD CONTEXT RELOAD]                         │
│  "Reload App / பக்கத்தை புதுப்பி"                        │
│  • Calls window.location.reload()                      │
│  • Re-initializes clean React Fiber DOM tree           │
│  • Restores persistent state from localStorage/DB      │
│                                                        │
│  [TIER 3: EMERGENCY DATA VAULT EXPORT]                 │
│  "Save My Data (JSON Backup) / தரவை சேமிக்கவும்"       │
│  • Extracts all vendor books, stock, & khata ledgers   │
│  • Downloads 'santhai_emergency_vault_<timestamp>.json'│
│  • Zero vendor data loss even if DOM is unrecoverable  │
│                                                        │
└────────────────────────────────────────────────────────┘
```

### Emergency Data Vault Snapshot (`downloadEmergencyVault`)
The Tier 3 emergency mechanism inspects browser storage and packages every crucial vendor domain table into a downloadable JSON file:
- `santhai_stock_logs`: Daily received, sold, and spoiled inventory.
- `santhai_vendor_profile`: Merchant UPI ID, market stall number, closing time.
- `santhai_khata_customers`: Customer ledger balances, credit limits, transaction histories.
- `santhai_resq_listings`: Active zero-waste surplus markdown deals.
- `santhai_bulk_orders`: Pre-committed mess and hotel recurring orders.
- `santhai_custom_prices`: Vendor custom retail prices overriding wholesale mandi rates.

---

## 5. Five-Module Graceful Degradation Matrix

| Module | Primary Failure Mode | Trigger Condition | Automated Degradation & Fallback Strategy | User-Facing Indicator |
|---|---|---|---|---|
| **1. Prices Module** | Agmarknet / Govt Portal API down or rate-limited | HTTP 500 / 429 / Offline fetch error | Silently falls back to embedded Tamil Nadu Mandi Baseline (`CACHED_TN_MANDI_PRICES`) + Field Survey data (`FIELD_COLLECTED_VENDOR_SURVEYS`). | Amber badge: *"Using Cached Mandi Baseline"* (Full analysis remains functional). |
| **2. Stock Module** | Voice input failure or Web Speech API unsupported | Micro-browser on low-end phone or loud mandi noise | Deactivates audio listener and highlights the one-tap tactile stepper buttons (+/- 5kg, +/- 10kg) with Tamil commodity buttons. | Soft toast: *"குரல் பதிவு கிடைக்கவில்லை. பொத்தான்களைப் பயன்படுத்தவும்"* (Use buttons). |
| **3. Khata Module** | Complete cellular disconnection during customer payment | `navigator.onLine === false` or network timeout | Optimistic local double-entry ledger commit; transaction queued with `syncStatus: 'pending'`; generates NPCI UPI QR string purely offline. | Green badge: *"Offline Mode - QR Code Ready for Scanning"*. |
| **4. ResQ Module** | Notification / SMS push service unavailable | 3rd party SMS gateway failure | Automatically constructs pre-populated WhatsApp sharing link (`https://wa.me/?text=...`) directly to hotel and mess buyers. | Button switches to: *"Send WhatsApp Markdown Chit Directly"*. |
| **5. Live Voice Assistant** | Gemini Multimodal WebSocket (`/live-ws`) disconnection | Heavy cellular latency (>1500ms) or socket close | Downgrades from live bidirectional streaming audio to REST transcription (`POST /api/voice/parse-stock`) and visual recommendation cards. | Switches voice wave animation to static audio badge with transcript cards. |

---

## 6. Sunlight-Readable UI/UX Standards

The Error Boundary fallback screen and recovery controls conform strictly to outdoor agricultural market ergonomics:
- **WCAG 2.1 AAA Contrast Ratio**: High-contrast black (`#0f172a`) text against stark amber/white cards with a contrast ratio exceeding **8.5:1** (exceeding the 7:1 AAA requirement).
- **Large Tactile Touch Targets**: Buttons have a minimum height of **52px** and font size $\ge 18\text{px}$, accommodating vendors operating phones with wet, soil-stained, or produce-handling fingers.
- **Bilingual Tamil-First Typography**: All critical actions, error explanations, and buttons are presented simultaneously in Tamil script (`தமிழ்`) and Indian English.
