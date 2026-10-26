# SanthAI Backend API Specification (OpenAPI 3.1 Style Reference)

> **Review 2 & 3 Technical Architecture Document**: Complete Endpoint Reference, Request/Response Payloads, Authentication, Validation Invariants, and Fallback Strategies.

---

## 1. Architecture & Protocol Overview

SanthAI runs a unified Node.js 22 + Express 4 backend integrated with the Google GenAI SDK (`@google/genai`) and Vite SPA middleware.
- **Base URL**: `http://localhost:3000` (or production host)
- **Content-Type**: `application/json` (except video streaming which returns `video/mp4` and WebSocket on `/live-ws`)
- **Error Format**: All errors return a standard JSON object:
  ```json
  {
    "error": "Descriptive human-readable error string",
    "details": "Optional diagnostic payload"
  }
  ```

---

## 2. Complete Endpoint Directory (18 Endpoints)

### Endpoint 1: Health Check & System Status
- **Method**: `GET`
- **Path**: `/api/health`
- **Description**: Verifies Node.js server lifecycle and checks if `GEMINI_API_KEY` is loaded.
- **Request Parameters**: None
- **Response**: `200 OK`
  ```json
  {
    "status": "ok",
    "hasGeminiKey": true,
    "timestamp": "2026-10-26T06:30:00.000Z"
  }
  ```

---

### Endpoint 2: Mandi Wholesale Prices & Statistics
- **Method**: `GET`
- **Path**: `/api/prices/mandi`
- **Query Parameters**:
  - `state` (string, optional): State filter (e.g. `Tamil Nadu`)
  - `commodity` (string, optional): Commodity name (`Tomato`, `Onion`, etc.)
  - `market` (string, optional): Market yard (`Koyambedu`, `Mattuthavani`, `Oddanchatram`)
- **Headers**: `Cache-Control: public, s-maxage=3600, stale-while-revalidate=1800`
- **Response**: `200 OK`
  ```json
  {
    "status": "ok",
    "source": "Agmarknet Government Mandi Feed (Cached Baseline)",
    "records": [
      {
        "id": "tn-koy-tom-1",
        "state": "Tamil Nadu",
        "district": "Chennai",
        "market": "Koyambedu",
        "commodity": "Tomato",
        "date": "2026-10-26",
        "minPricePerKg": 24,
        "maxPricePerKg": 32,
        "modalPricePerKg": 28,
        "arrivalTons": 140
      }
    ],
    "total": 1,
    "stats": {
      "mean": 28.0,
      "min": 24.0,
      "max": 32.0,
      "sampleCount": 1
    },
    "updatedAt": "2026-10-26T06:30:00.000Z"
  }
  ```

---

### Endpoint 3: Field-Collected Vendor Surveys
- **Method**: `GET`
- **Path**: `/api/prices/field-surveys`
- **Description**: Returns empirical retail price surveys collected across 6 vendors at Koyambedu Wholesale Market, Chennai.
- **Response**: `200 OK`
  ```json
  {
    "status": "ok",
    "source": "Empirical Field Surveys (Counted, Not Sourced)",
    "totalVendorsSurveyed": 6,
    "surveys": [
      {
        "vendorId": "SURV-V01",
        "vendorAlias": "Vendor A (Stall #14, Vegetable Row 2)",
        "surveyDate": "2026-10-24",
        "prices": { "Tomato": 38, "Onion": 45, "Potato": 35 }
      }
    ]
  }
  ```

---

### Endpoint 4: Vendor Sales Notebook 14-Day History
- **Method**: `GET`
- **Path**: `/api/prices/notebook-sales`
- **Description**: Returns digitized daily sales, arrivals, and wastage logs from a physical merchant ledger notebook.
- **Response**: `200 OK`
  ```json
  {
    "status": "ok",
    "source": "Vendor Notebook Ledger (14-Day Real Sales History)",
    "records": [
      {
        "day": 14,
        "date": "2026-10-24",
        "commodity": "Tomato",
        "receivedKg": 50,
        "soldKg": 44,
        "unsoldKg": 4,
        "wasteKg": 2,
        "sellingPricePerKg": 38,
        "wholesaleCostPerKg": 28
      }
    ]
  }
  ```

---

### Endpoint 5: Wholesale-to-Retail Gap Findings
- **Method**: `GET`
- **Path**: `/api/prices/wholesale-retail-gaps`
- **Description**: Compares government Agmarknet wholesale rates with empirical street retail prices to quantify the actual markup spread.
- **Response**: `200 OK`
  ```json
  {
    "status": "ok",
    "analysisDate": "2026-10-25",
    "findings": [
      {
        "commodity": "Tomato",
        "agmarknetModalWholesale": 28,
        "fieldRetailMin": 36,
        "fieldRetailMax": 40,
        "fieldRetailAverage": 37.6,
        "markupSpreadRupees": 9.6,
        "markupPercent": 34.3,
        "rationale": "High transport & sorting wastage buffer"
      }
    ]
  }
  ```

---

### Endpoint 6: Single Exponential Smoothing Stock Forecast
- **Method**: `POST`
- **Path**: `/api/forecast`
- **Request Body**:
  ```json
  {
    "commodity": "Tomato",
    "logs": [
      { "id": "1", "date": "2026-10-23", "commodity": "Tomato", "receivedKg": 45, "soldKg": 40, "unsoldKg": 3, "wasteKg": 2 },
      { "id": "2", "date": "2026-10-24", "commodity": "Tomato", "receivedKg": 50, "soldKg": 44, "unsoldKg": 4, "wasteKg": 2 }
    ],
    "bulkOrders": [
      { "id": "b1", "commodity": "Tomato", "dailyRequirementKg": 20, "claimedByVendor": true }
    ],
    "alpha": 0.45
  }
  ```
- **Response**: `200 OK`
  ```json
  {
    "status": "ok",
    "forecast": {
      "commodity": "Tomato",
      "walkInForecastKg": 42.2,
      "precommittedBulkKg": 20,
      "totalForecastKg": 62.2,
      "alpha": 0.45,
      "historyDays": 2,
      "errorMarginKg": 3.8,
      "trend": "increasing",
      "simpleAdviceEn": "Order around 62 kg tomorrow (42 kg walk-in + 20 kg bulk orders).",
      "simpleAdviceTa": "நாளை 62 கிலோ வாங்கவும் (42 கிலோ சில்லறை + 20 கிலோ மொத்த ஆர்டர்)."
    }
  }
  ```

---

### Endpoint 7: Mandi Price Statistical Corridor & Fairness Evaluation
- **Method**: `POST`
- **Path**: `/api/pricing/evaluate`
- **Request Body**:
  ```json
  {
    "commodity": "Tomato",
    "retailPrice": 36
  }
  ```
- **Response**: `200 OK`
  ```json
  {
    "status": "ok",
    "commodity": "Tomato",
    "retailPrice": 36,
    "mandiStats": {
      "mean": 28.0,
      "min": 24.0,
      "max": 32.0,
      "stdDev": 2.82
    },
    "analysis": {
      "currentSellingPrice": 36,
      "mandiModalWholesale": 28,
      "fairPriceRange": [26.6, 37.8],
      "isOutlier": false,
      "outlierType": "none",
      "markupPercent": 28.6,
      "verdictEn": "Fair and competitive retail pricing.",
      "verdictTa": "சரியான நியாயமான சந்தை விலை."
    }
  }
  ```

---

### Endpoint 8: Zero-Waste Dynamic Markdown Clearance Optimization
- **Method**: `POST`
- **Path**: `/api/resq/calculate-markdown`
- **Request Body**:
  ```json
  {
    "commodity": "Tomato",
    "unsoldKg": 14,
    "hoursUntilClose": 1.5,
    "retailPrice": 36
  }
  ```
- **Response**: `200 OK`
  ```json
  {
    "status": "ok",
    "markdown": {
      "commodity": "Tomato",
      "unsoldKg": 14,
      "normalPricePerKg": 36,
      "suggestedMarkdownPrice": 24,
      "discountPercent": 33,
      "potentialSavedRupees": 336,
      "urgency": "high",
      "timeToCloseHours": 1.5
    }
  }
  ```

---

### Endpoint 9: Digital Khata Customer Risk Scoring
- **Method**: `POST`
- **Path**: `/api/khata/risk-score`
- **Request Body**:
  ```json
  {
    "customer": {
      "id": "cust-1",
      "name": "Murugan Tea Stall",
      "totalDue": 1400,
      "creditLimit": 2500,
      "transactions": [
        { "id": "t1", "type": "CREDIT", "amount": 1000 },
        { "id": "t2", "type": "PAYMENT", "amount": 600, "daysDelayed": 2 },
        { "id": "t3", "type": "CREDIT", "amount": 1000 }
      ]
    },
    "vendorProfile": {
      "name": "Senthil Traders",
      "upiId": "senthil@okaxis"
    },
    "lang": "ta"
  }
  ```
- **Response**: `200 OK`
  ```json
  {
    "status": "ok",
    "risk": {
      "score": 28,
      "level": "Low",
      "onTimePaymentRatio": 0.82
    },
    "totalDue": 1400,
    "creditLimit": 2500,
    "creditHeadroom": 1100,
    "whatsAppLink": "https://wa.me/91...?text=..."
  }
  ```

---

### Endpoint 10: NLP Voice Stock & Wastage Parsing
- **Method**: `POST`
- **Path**: `/api/voice/parse-stock`
- **Request Body**:
  ```json
  {
    "text": "தக்காளி வரவு 50 கிலோ கழிவு 2 கிலோ",
    "commodity": "Tomato"
  }
  ```
- **Response**: `200 OK`
  ```json
  {
    "status": "ok",
    "transcript": "தக்காளி வரவு 50 கிலோ கழிவு 2 கிலோ",
    "parsed": {
      "rawTranscript": "தக்காளி வரவு 50 கிலோ கழிவு 2 கிலோ",
      "detectedCommodity": "Tomato",
      "receivedKg": 50,
      "wasteKg": 2,
      "confidence": "high",
      "summaryEn": "Recorded Tomato: Arrival 50 kg, Wastage 2 kg.",
      "summaryTa": "தக்காளி வரவு: 50 கிலோ, கழிவு: 2 கிலோ சேமிக்கப்பட்டது."
    }
  }
  ```

---

### Endpoint 11: Thermal Slip Receipt & WhatsApp Settlement Chit Generation
- **Method**: `POST`
- **Path**: `/api/receipt/generate`
- **Request Body**:
  ```json
  {
    "vendorName": "SanthAI Mandi Traders",
    "marketName": "Koyambedu Wholesale",
    "customerName": "Murugan Tea Stall",
    "phone": "9841234567",
    "upiId": "santhai@okaxis",
    "previousDue": 1000,
    "currentBill": 400,
    "amountPaid": 200,
    "balanceDue": 1200
  }
  ```
- **Response**: `200 OK`
  ```json
  {
    "status": "ok",
    "thermalText": "================================\n   SANTHAI MANDI TRADERS\n...",
    "upiQrUrl": "upi://pay?pa=santhai%40okaxis&pn=SanthAI%20Mandi%20Traders&am=1200&cu=INR",
    "whatsAppMessage": "வணக்கம் Murugan Tea Stall,\n...",
    "whatsAppLink": "https://wa.me/919841234567?text=..."
  }
  ```

---

### Endpoint 12: Gemini 3.8 Live Assistant Configuration
- **Method**: `GET`
- **Path**: `/api/gemini/live-config`
- **Description**: Returns live audio configuration, supported modalities, and API key status.
- **Response**: `200 OK`
  ```json
  {
    "status": "ok",
    "model": "gemini-3.8-live",
    "hasKey": true,
    "supportedModalities": ["AUDIO", "TEXT"]
  }
  ```

---

### Endpoint 13: Live API Conversational Turn Proxy
- **Method**: `POST`
- **Path**: `/api/gemini/live-conversation`
- **Request Body**:
  ```json
  {
    "message": "தக்காளி இன்றைய விலை எப்படி?",
    "language": "ta"
  }
  ```
- **Response**: `200 OK`
  ```json
  {
    "status": "ok",
    "reply": "இன்று கோயம்பேடு சந்தையில் தக்காளி கிலோ ₹28 ஆக உள்ளது. சில்லறை விற்பனைக்கு ₹36 வரை நியாயமான விலை."
  }
  ```

---

### Endpoint 14: AI Produce Stall Banner & Image Editing
- **Method**: `POST`
- **Path**: `/api/gemini/image`
- **Request Body**:
  ```json
  {
    "prompt": "Fresh ripe Tamil Nadu country tomatoes arranged neatly in a bamboo basket",
    "base64InputImage": null
  }
  ```
- **Response**: `200 OK`
  ```json
  {
    "status": "ok",
    "imageUrl": "data:image/jpeg;base64,..."
  }
  ```

---

### Endpoint 15: Mandi Search Grounding
- **Method**: `POST`
- **Path**: `/api/gemini/search`
- **Request Body**:
  ```json
  {
    "query": "Koyambedu wholesale tomato arrivals today Tamil Nadu",
    "language": "ta"
  }
  ```
- **Response**: `200 OK`
  ```json
  {
    "status": "ok",
    "answer": "...",
    "sources": [
      { "title": "Agmarknet Daily Bulletin", "url": "https://agmarknet.gov.in" }
    ]
  }
  ```

---

### Endpoint 16: Mandi & Logistics Hub Locator (Google Maps Grounding)
- **Method**: `POST`
- **Path**: `/api/gemini/maps`
- **Request Body**:
  ```json
  {
    "query": "Vegetable wholesale market nearby",
    "lat": 13.0694,
    "lng": 80.1948
  }
  ```
- **Response**: `200 OK`
  ```json
  {
    "status": "ok",
    "recommendations": [
      {
        "name": "Koyambedu Wholesale Market Complex",
        "address": "Koyambedu, Chennai, Tamil Nadu",
        "distanceKm": 1.2
      }
    ]
  }
  ```

---

### Endpoint 17: Voice Audio Transcription
- **Method**: `POST`
- **Path**: `/api/gemini/transcribe`
- **Request Body**:
  ```json
  {
    "audioBase64": "UklGRi...",
    "mimeType": "audio/webm"
  }
  ```
- **Response**: `200 OK`
  ```json
  {
    "status": "ok",
    "transcript": "தக்காளி வரவு 50 கிலோ",
    "language": "ta"
  }
  ```

---

### Endpoint 18: Gemini Multimodal Live Audio WebSocket Bridge
- **Protocol**: `WebSocket (WSS / WS)`
- **Path**: `/live-ws`
- **Description**: Bidirectional real-time audio streaming connection with `gemini-3.8-live` using PCM 16kHz audio frames.
- **Client Message Format**:
  ```json
  {
    "audio": "<base64_pcm_chunk_16khz>",
    "text": "Optional text query"
  }
  ```
- **Server Message Format**:
  ```json
  {
    "audio": "<base64_audio_response>",
    "text": "Partial or complete text transcript",
    "interrupted": false
  }
  ```
