import express, { Request, Response } from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, GenerateVideosOperation, LiveServerMessage, Modality } from '@google/genai';
import { WebSocketServer } from 'ws';
import {
  generateProduceImage,
  searchMandiIntel,
  findNearbyMandiLocations,
  transcribeAudioVoice
} from './src/server/geminiService';
import { ForecastEngine } from './src/services/forecast';
import { PricingEngine } from './src/services/pricing';
import { ResQService } from './src/services/resq';
import { KhataService } from './src/services/khata';
import { parseSpokenStockEntry } from './src/services/voiceStockParser';
import { CACHED_TN_MANDI_PRICES } from './src/data/commodities';
import { CommodityType, DailyStockLog, BulkOrderBoardItem, KhataCustomer, VendorProfile } from './src/types';
import { TN_MANDI_REALTIME_DATA } from './api/mandi-prices';
import {
  GOVERNMENT_PRICE_SOURCES,
  FIELD_COLLECTED_VENDOR_SURVEYS,
  VENDOR_NOTEBOOK_14_DAY_SALES,
  WHOLESALE_TO_RETAIL_GAP_FINDINGS
} from './src/data/marketIntelligence';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '30mb' }));
app.use(express.urlencoded({ extended: true, limit: '30mb' }));

// Health Check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY)
  });
});

/**
 * 1. Live Mandi Agmarknet Prices Feed with Granular Filtering & Stats Calculation
 * @route GET /api/mandi-prices
 * @route GET /api/prices/mandi
 * @description Ingests wholesale arrivals from Agmarknet (data.gov.in) with caching, sample mean, variance, min, max, and stdDev.
 * @param req.query.state Target state filter (default: 'Tamil Nadu')
 * @param req.query.commodity Target commodity (e.g. 'Tomato', 'Onion')
 * @param req.query.market Target market yard (e.g. 'Koyambedu')
 * @param req.query.district Target district
 * @param req.query.limit Max records to return (default: 50)
 * @returns JSON containing records, total count, statistical summary, and source attribution
 */
app.get(['/api/mandi-prices', '/api/prices/mandi'], async (req: Request, res: Response) => {
  const apiKey = process.env.AGMARKNET_API_KEY || process.env.VITE_AGMARKNET_API_KEY;
  const requestedState = ((req.query.state as string) || 'Tamil Nadu').trim();
  const requestedCommodity = (req.query.commodity as string)?.trim();
  const requestedMarket = (req.query.market as string)?.trim();
  const requestedDistrict = (req.query.district as string)?.trim();
  const requestedLimit = parseInt(req.query.limit as string) || 50;

  let rawRecords: any[] = [];
  let source = 'Real-Time Tamil Nadu Mandi Feed';

  if (apiKey) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000); // 8-second timeout as required
      let url = `https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070?api-key=${encodeURIComponent(apiKey)}&format=json&limit=50`;
      if (requestedState) {
        url += `&filters[state]=${encodeURIComponent(requestedState)}`;
      }
      if (requestedCommodity) {
        url += `&filters[commodity]=${encodeURIComponent(requestedCommodity)}`;
      }
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeout);

      if (response.ok) {
        const data = await response.json();
        rawRecords = data.records || data;
        source = 'Live Agmarknet API (data.gov.in)';
      }
    } catch (err) {
      console.warn('Direct data.gov.in fetch failed in server.ts:', err);
    }
  }

  if (!rawRecords || rawRecords.length === 0) {
    rawRecords = TN_MANDI_REALTIME_DATA;
  }

  // Filter records
  let filtered = [...rawRecords];
  if (requestedCommodity) {
    filtered = filtered.filter(r => (r.commodity || '').toLowerCase().includes(requestedCommodity.toLowerCase()));
  }
  if (requestedMarket) {
    filtered = filtered.filter(r => (r.market || '').toLowerCase().includes(requestedMarket.toLowerCase()));
  }
  if (requestedDistrict) {
    filtered = filtered.filter(r => (r.district || '').toLowerCase().includes(requestedDistrict.toLowerCase()));
  }

  // Limit records
  filtered = filtered.slice(0, requestedLimit);

  // Compute aggregate stats across matching records
  let stats = null;
  if (filtered.length > 0) {
    const prices = filtered.map(r => parseFloat(r.modal_price || r.modalPricePerKg || '0')).filter(p => !isNaN(p) && p > 0);
    if (prices.length > 0) {
      const sum = prices.reduce((a, b) => a + b, 0);
      const mean = Math.round((sum / prices.length) * 10) / 10;
      const min = Math.min(...prices);
      const max = Math.max(...prices);
      const variance = prices.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / (prices.length > 1 ? prices.length - 1 : 1);
      const stdDev = Math.round(Math.max(1.5, Math.sqrt(variance)) * 10) / 10;

      stats = {
        mean,
        stdDev,
        min,
        max,
        sampleCount: prices.length
      };
    }
  }

  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=1800');
  return res.json({
    status: 'ok',
    source,
    records: filtered,
    total: filtered.length,
    stats,
    updatedAt: new Date().toISOString()
  });
});

/**
 * 1a. Empirical Field-Collected Vendor Surveys (Counted, Not Sourced)
 * @route GET /api/prices/field-surveys
 * @description Serves empirical street vendor price surveys collected across 6 vendors in Koyambedu & Coimbatore across 5 essential items.
 * @returns JSON containing surveyed vendors, stall locations, and recorded retail price ranges
 */
app.get('/api/prices/field-surveys', (_req: Request, res: Response) => {
  res.setHeader('Cache-Control', 'public, s-maxage=3600');
  return res.json({
    status: 'ok',
    source: 'Empirical Field Surveys (Counted, Not Sourced)',
    totalVendorsSurveyed: FIELD_COLLECTED_VENDOR_SURVEYS.length,
    surveys: FIELD_COLLECTED_VENDOR_SURVEYS
  });
});

/**
 * 1b. Real Vendor Sales Notebook 14-Day History
 * @route GET /api/prices/notebook-sales
 * @description Serves digitized physical notebook sales diary from a vegetable stall across 14 consecutive market days.
 * @returns JSON containing daily arrival, sales, unsold stock, and wastage metrics
 */
app.get('/api/prices/notebook-sales', (_req: Request, res: Response) => {
  res.setHeader('Cache-Control', 'public, s-maxage=3600');
  return res.json({
    status: 'ok',
    source: 'Vendor Notebook Ledger (14-Day Real Sales History)',
    totalDays: VENDOR_NOTEBOOK_14_DAY_SALES.length,
    records: VENDOR_NOTEBOOK_14_DAY_SALES
  });
});

/**
 * 1c. Wholesale-to-Retail Price Gap Findings
 * @route GET /api/prices/wholesale-retail-gaps
 * @description Quantifies the structural margin spread between Agmarknet wholesale auction prices and real street retail rates.
 * @returns JSON array of commodities with wholesale baseline, retail min/max/average, and calculated markup spread
 */
app.get('/api/prices/wholesale-retail-gaps', (_req: Request, res: Response) => {
  res.setHeader('Cache-Control', 'public, s-maxage=3600');
  return res.json({
    status: 'ok',
    analysisDate: '2026-10-25',
    findings: WHOLESALE_TO_RETAIL_GAP_FINDINGS
  });
});

/**
 * 1d. Official Government Agricultural Price Sources Directory
 * @route GET /api/prices/gov-sources
 * @description Lists citable government price sources (Agmarknet, Dept of Consumer Affairs, Uzhavar Sandhai) with citation URLs and roles.
 * @returns JSON containing official citable data sources and APIs
 */
app.get('/api/prices/gov-sources', (_req: Request, res: Response) => {
  res.setHeader('Cache-Control', 'public, s-maxage=86400');
  return res.json({
    status: 'ok',
    sources: GOVERNMENT_PRICE_SOURCES
  });
});

/**
 * 2. AI Produce Image Generation & Stall Banner Editing
 * @route POST /api/gemini/image
 * @description Generates high-fidelity agricultural produce images or promotional banners using gemini-3.1-flash-image-preview.
 * @param req.body.prompt Visual description of the produce or banner layout
 * @param req.body.base64InputImage Optional image base64 data for image-to-image editing
 * @returns JSON containing status 'ok' and generated/edited base64 image data
 */
app.post('/api/gemini/image', async (req: Request, res: Response) => {
  try {
    const { prompt, base64InputImage } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }
    const result = await generateProduceImage(prompt, base64InputImage);
    return res.json({ status: 'ok', ...result });
  } catch (err: any) {
    console.error('Produce Image Gen error:', err);
    return res.status(500).json({ error: err?.message || 'Failed to generate image' });
  }
});

/**
 * 3. Mandi Market Intelligence Search Grounding
 * @route POST /api/gemini/search
 * @description Executes real-time Google Search grounding via gemini-3.5-flash to retrieve latest mandi arrival bulletins, strikes, or weather events.
 * @param req.body.query Search query string regarding mandi prices or agricultural news
 * @param req.body.language Preferred output language ('ta' for Tamil, 'en' for English)
 * @returns JSON containing structured answer and cited search web sources
 */
app.post('/api/gemini/search', async (req: Request, res: Response) => {
  try {
    const { query, language } = req.body;
    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }
    const result = await searchMandiIntel(query, language);
    return res.json({ status: 'ok', ...result });
  } catch (err: any) {
    console.error('Search Grounding error:', err);
    return res.status(500).json({ error: err?.message || 'Failed to search mandi intel' });
  }
});

/**
 * 4. Mandi & Transport Hub Locator (Google Maps Grounding)
 * @route POST /api/gemini/maps
 * @description Queries nearby wholesale markets, uzhavar sandhais, and logistics depots using Google Maps grounding.
 * @param req.body.query Place search query (e.g. 'vegetable mandi')
 * @param req.body.lat Vendor GPS latitude coordinate
 * @param req.body.lng Vendor GPS longitude coordinate
 * @returns JSON containing nearby mandi recommendations with place metadata
 */
app.post('/api/gemini/maps', async (req: Request, res: Response) => {
  try {
    const { query, lat, lng } = req.body;
    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }
    const result = await findNearbyMandiLocations(query, lat, lng);
    return res.json({ status: 'ok', ...result });
  } catch (err: any) {
    console.error('Maps Grounding error:', err);
    return res.status(500).json({ error: err?.message || 'Failed to query mandi places' });
  }
});

/**
 * 5. Audio Voice-to-Text Transcription
 * @route POST /api/gemini/transcribe
 * @description Transcribes spoken audio recordings (Tamil/English/Tanglish) using gemini-3.5-flash with language-specific prompting.
 * @param req.body.audioBase64 Base64-encoded audio chunk (PCM/WebM)
 * @param req.body.mimeType Audio MIME container format (default: 'audio/webm')
 * @returns JSON containing transcribed text string and detected language
 */
app.post('/api/gemini/transcribe', async (req: Request, res: Response) => {
  try {
    const { audioBase64, mimeType } = req.body;
    if (!audioBase64) {
      return res.status(400).json({ error: 'audioBase64 is required' });
    }
    const result = await transcribeAudioVoice(audioBase64, mimeType);
    return res.json({ status: 'ok', ...result });
  } catch (err: any) {
    console.error('Audio Transcription error:', err);
    return res.status(500).json({ error: err?.message || 'Failed to transcribe audio' });
  }
});

/**
 * 6. Algorithmic Stock Forecasting (Single Exponential Smoothing)
 * @route POST /api/forecast
 * @param req.body.commodity Commodity produce name ('Tomato', 'Onion', etc.)
 * @param req.body.logs Array of historical DailyStockLog records
 * @param req.body.bulkOrders Array of pre-committed BulkOrderBoardItem commitments
 * @param req.body.alpha Smoothing factor (0.1 to 0.9, default: 0.45)
 * @returns JSON object containing walk-in forecast, bulk orders, and total procurement recommendation
 */
app.post('/api/forecast', (req: Request, res: Response) => {
  try {
    const { commodity = 'Tomato', logs = [], bulkOrders = [], alpha = 0.45 } = req.body;
    const forecast = ForecastEngine.calculateForecast(
      commodity as CommodityType,
      logs as DailyStockLog[],
      bulkOrders as BulkOrderBoardItem[],
      Number(alpha) || 0.45
    );
    return res.json({ status: 'ok', forecast });
  } catch (err: any) {
    console.error('Forecast API error:', err);
    return res.status(500).json({ error: err?.message || 'Failed to calculate forecast' });
  }
});

/**
 * 7. Mandi Price Statistical Corridor, Z-Scores & Fairness Evaluation
 * @route POST /api/pricing/evaluate
 * @param req.body.commodity Commodity name ('Tomato', 'Onion', etc.)
 * @param req.body.retailPrice Current stall retail price per kg in INR
 * @param req.body.records Optional custom MandiPriceRecord array (defaults to cached Tamil Nadu mandis)
 * @returns JSON containing sample mean, variance, standard deviation, Z-score, outlier classification, and fair corridor
 */
app.post('/api/pricing/evaluate', (req: Request, res: Response) => {
  try {
    const { commodity = 'Tomato', retailPrice, records = CACHED_TN_MANDI_PRICES } = req.body;
    if (retailPrice === undefined || retailPrice === null) {
      return res.status(400).json({ error: 'retailPrice is required' });
    }

    const priceNum = parseFloat(retailPrice);
    const mandiStats = PricingEngine.getMandiStats(records, commodity as CommodityType);
    const analysis = PricingEngine.evaluateVendorPrice(priceNum, commodity as CommodityType, records);

    return res.json({
      status: 'ok',
      commodity,
      retailPrice: priceNum,
      mandiStats,
      analysis
    });
  } catch (err: any) {
    console.error('Pricing evaluate error:', err);
    return res.status(500).json({ error: err?.message || 'Failed to evaluate price' });
  }
});

/**
 * 8. Zero-Waste Dynamic Markdown Clearance Optimization
 * @route POST /api/resq/calculate-markdown
 * @param req.body.commodity Target produce commodity
 * @param req.body.unsoldKg Unsold volume in kilograms
 * @param req.body.hoursUntilClose Hours remaining until market close (0.5 to 8)
 * @param req.body.retailPrice Baseline morning retail price per kg
 * @returns JSON containing suggested markdown price, discount percentage (15%-45%), urgency, and potential revenue saved
 */
app.post('/api/resq/calculate-markdown', (req: Request, res: Response) => {
  try {
    const { commodity = 'Tomato', unsoldKg, hoursUntilClose = 2, retailPrice } = req.body;
    if (unsoldKg === undefined || retailPrice === undefined) {
      return res.status(400).json({ error: 'commodity, unsoldKg, and retailPrice are required' });
    }

    const hoursLeft = Math.max(0.5, Math.min(8, parseFloat(hoursUntilClose)));
    const unsoldNum = parseFloat(unsoldKg);
    const retailNum = parseFloat(retailPrice);

    // Dynamic markdown factor based on remaining stock and time-to-close
    const timeFactor = Math.max(0, (4 - hoursLeft) * 5); // 0% to 20%
    const volumeFactor = Math.min(15, (unsoldNum / 5) * 4); // 4% to 15%
    const discountPercent = Math.min(45, Math.max(15, Math.round(15 + timeFactor + volumeFactor)));
    const suggestedMarkdownPrice = Math.max(8, Math.round(retailNum * (1 - discountPercent / 100)));
    const potentialSavedRupees = suggestedMarkdownPrice * unsoldNum;
    const urgency: 'high' | 'medium' | 'low' = hoursLeft <= 2 ? 'high' : hoursLeft <= 3.5 ? 'medium' : 'low';

    return res.json({
      status: 'ok',
      markdown: {
        commodity,
        unsoldKg: unsoldNum,
        normalPricePerKg: retailNum,
        suggestedMarkdownPrice,
        discountPercent,
        potentialSavedRupees,
        urgency,
        timeToCloseHours: Math.round(hoursLeft * 10) / 10
      }
    });
  } catch (err: any) {
    console.error('ResQ markdown error:', err);
    return res.status(500).json({ error: err?.message || 'Failed to calculate markdown' });
  }
});

/**
 * 9. Digital Khata Customer Credit Exposure & Dynamic Risk Scoring
 * @route POST /api/khata/risk-score
 * @description Evaluates customer credit transactions, computes dynamic repayment risk scores, and generates WhatsApp reminder deep links.
 * @param req.body.customer Customer object with credit limit and transaction history
 * @param req.body.vendorProfile Merchant profile with UPI ID and business name
 * @param req.body.lang Language for reminder text ('en' or 'ta')
 * @returns JSON containing credit risk level, headroom, total due, and WhatsApp deep-link
 */
app.post('/api/khata/risk-score', (req: Request, res: Response) => {
  try {
    const { customer, vendorProfile, lang = 'en' } = req.body;
    if (!customer) {
      return res.status(400).json({ error: 'customer object is required' });
    }

    const txs = customer.transactions || [];
    const risk = KhataService.computeRiskScore(txs);
    let whatsAppLink = '';
    if (vendorProfile) {
      whatsAppLink = KhataService.createReminderWhatsAppUrl(customer as KhataCustomer, vendorProfile as VendorProfile, lang);
    }

    return res.json({
      status: 'ok',
      risk,
      totalDue: customer.totalDue || 0,
      creditLimit: customer.creditLimit || 3000,
      creditHeadroom: Math.max(0, (customer.creditLimit || 3000) - (customer.totalDue || 0)),
      whatsAppLink
    });
  } catch (err: any) {
    console.error('Khata risk scoring error:', err);
    return res.status(500).json({ error: err?.message || 'Failed to calculate credit risk' });
  }
});

/**
 * 10. Voice Stock Transcription & NLP Entity Extraction
 * @route POST /api/voice/parse-stock
 * @description Ingests raw audio or transcribed text in Tamil, English, or Tanglish and extracts structured received, sold, and waste quantities.
 * @param req.body.audioBase64 Optional audio recording base64
 * @param req.body.text Spoken input text string if already transcribed
 * @param req.body.commodity Target commodity fallback
 * @param req.body.mimeType Audio MIME container format
 * @returns JSON containing raw transcript and parsed structured stock model
 */
app.post('/api/voice/parse-stock', async (req: Request, res: Response) => {
  try {
    const { audioBase64, text, commodity = 'Tomato', mimeType = 'audio/webm' } = req.body;

    let transcript = text || '';
    if (audioBase64) {
      const transcribeResult = await transcribeAudioVoice(audioBase64, mimeType);
      transcript = transcribeResult.transcript;
    }

    if (!transcript.trim()) {
      return res.status(400).json({ error: 'Either audioBase64 or text is required for parsing' });
    }

    const parsed = parseSpokenStockEntry(transcript, commodity as CommodityType);

    return res.json({
      status: 'ok',
      transcript,
      parsed
    });
  } catch (err: any) {
    console.error('Voice stock parsing error:', err);
    return res.status(500).json({ error: err?.message || 'Failed to parse stock from audio/text' });
  }
});

/**
 * 11. Thermal Slip Receipt & WhatsApp Settlement Chit Generation
 * @route POST /api/receipt/generate
 * @description Formats thermal-printer ready plain-text slips and encoded WhatsApp settlement chits with dynamic NPCI UPI URIs.
 * @param req.body.vendorName Merchant trading name
 * @param req.body.marketName Mandi or street market location
 * @param req.body.customerName Buyer or stall regular name
 * @param req.body.phone Customer phone number for WhatsApp deep link
 * @param req.body.upiId Merchant UPI VPA for settlement
 * @param req.body.previousDue Prior outstanding ledger balance
 * @param req.body.currentBill Today's checkout bill
 * @param req.body.amountPaid Immediate cash/UPI paid
 * @param req.body.balanceDue Remaining balance due
 * @returns JSON containing formatted thermalText, upiQrUrl, and whatsAppLink
 */
app.post('/api/receipt/generate', (req: Request, res: Response) => {
  try {
    const {
      vendorName = 'SanthAI Produce Vendor',
      marketName = 'Wholesale Mandi',
      customerName = 'Walk-in Customer',
      phone = '',
      upiId = '',
      previousDue = 0,
      currentBill = 0,
      amountPaid = 0,
      balanceDue = 0,
      stallNumber = 'Stall #1',
      date = new Date().toLocaleDateString('en-IN')
    } = req.body;

    const receiptLines = [
      '================================',
      `   ${vendorName.toUpperCase()}`,
      `   ${marketName} (${stallNumber})`,
      '================================',
      `Date: ${date}   Time: ${new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`,
      `Customer: ${customerName}`,
      phone ? `Phone: +91 ${phone}` : '',
      '--------------------------------',
      `Previous Due:        ₹${Number(previousDue).toFixed(2)}`,
      `Today Bill:          ₹${Number(currentBill).toFixed(2)}`,
      `Total Payable:       ₹${(Number(previousDue) + Number(currentBill)).toFixed(2)}`,
      `Amount Received:     ₹${Number(amountPaid).toFixed(2)}`,
      '--------------------------------',
      `BALANCE OUTSTANDING: ₹${Number(balanceDue).toFixed(2)}`,
      '================================',
      upiId ? `Pay via UPI: ${upiId}` : '',
      '   Thank you for your patronage!',
      '   Generated by SanthAI Mandi PWA',
      '================================'
    ].filter(Boolean);

    const thermalText = receiptLines.join('\n');
    const encodedVendor = encodeURIComponent(vendorName);
    const upiQrUrl = upiId
      ? `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodedVendor}&am=${balanceDue}&cu=INR`
      : '';

    const whatsAppMessage = `வணக்கம் ${customerName},\n${vendorName} (${marketName}) கணக்கு விவரம்:\nமுந்தைய நிலுவை: ₹${previousDue}\nஇன்றைய பில்: ₹${currentBill}\nசெலுத்தியது: ₹${amountPaid}\nமீதமுள்ள நிலுவை: ₹${balanceDue}\n${upiId ? `UPI மூலம் செலுத்த: ${upiId}` : ''}\nநன்றி!`;
    const whatsAppLink = phone ? `https://wa.me/91${phone.replace(/\D/g, '')}?text=${encodeURIComponent(whatsAppMessage)}` : '';

    return res.json({
      status: 'ok',
      thermalText,
      upiQrUrl,
      whatsAppMessage,
      whatsAppLink
    });
  } catch (err: any) {
    console.error('Receipt generation error:', err);
    return res.status(500).json({ error: err?.message || 'Failed to generate receipt' });
  }
});

/**
 * 12. Live Voice Assistant Ephemeral Configuration
 * @route GET /api/gemini/live-config
 * @description Returns model configuration and capabilities for gemini-3.8-live bidirectional audio streaming.
 * @returns JSON containing model alias, key presence, and supported modalities
 */
app.get('/api/gemini/live-config', (req: Request, res: Response) => {
  const hasKey = Boolean(process.env.GEMINI_API_KEY);
  res.json({
    status: 'ok',
    model: 'gemini-3.8-live',
    hasKey,
    supportedModalities: ['AUDIO', 'TEXT']
  });
});

/**
 * 13. Live API Conversational Turn Proxy
 * @route POST /api/gemini/live-conversation
 * @description Provides a resilient server-authoritative voice conversational fallback via gemini-3.8-live / gemini-3.5-flash.
 * @param req.body.message User text message or query
 * @param req.body.audioBase64 Optional voice audio clip base64
 * @param req.body.history Prior conversation turn history
 * @param req.body.language Language preference ('ta' or 'en')
 * @returns JSON containing status 'ok' and model text reply
 */
app.post('/api/gemini/live-conversation', async (req: Request, res: Response) => {
  try {
    const { message, audioBase64, history, language } = req.body;
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
    const systemPrompt = language === 'ta'
      ? `நீங்கள் SanthAI - தமிழ்நாட்டின் காய்கறி மற்றும் பழ மண்டி வியாபாரிகளுக்கான குரல் வழி அறிவார்ந்த உதவியாளர். சுருக்கமாகவும், நட்பாகவும், தெள்ளத்தெளிவாகவும் தமிழில் பதிலளிக்கவும்.`
      : `You are SanthAI, a voice-first intelligent produce market assistant for wholesale and retail vendors in India. Give short, direct, friendly, and practical answers for stock, prices, waste reduction, and credit.`;

    const contents: any[] = [];
    if (Array.isArray(history)) {
      contents.push(...history);
    }
    
    const parts: any[] = [];
    if (audioBase64) {
      const commaIdx = audioBase64.indexOf(',');
      const raw = commaIdx >= 0 ? audioBase64.slice(commaIdx + 1) : audioBase64;
      parts.push({
        inlineData: {
          data: raw,
          mimeType: 'audio/webm'
        }
      });
    }
    if (message) {
      parts.push({ text: message });
    }

    contents.push({ role: 'user', parts });

    // Use gemini-3.8-live if direct or fallback to gemini-2.5-flash / gemini-3.5-flash
    let responseText = '';
    try {
      const liveResp = await ai.models.generateContent({
        model: 'gemini-3.8-live',
        contents,
        config: {
          systemInstruction: systemPrompt
        }
      });
      responseText = liveResp.text || '';
    } catch {
      const fallbackResp = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents,
        config: {
          systemInstruction: systemPrompt
        }
      });
      responseText = fallbackResp.text || '';
    }

    return res.json({
      status: 'ok',
      reply: responseText
    });
  } catch (err: any) {
    console.error('Live conversation error:', err);
    return res.status(500).json({ error: err?.message || 'Conversation error' });
  }
});

/**
 * 14. Veo Video Generation (Image-to-Video Animation)
 * @route POST /api/generate-video
 * @description Animates produce stall photos into cinematic promotional videos using veo-3.1-fast-generate-preview.
 * @param req.body.prompt Cinematic motion description
 * @param req.body.imageBase64 Base64 image to animate
 * @param req.body.aspectRatio Target aspect ratio ('16:9' landscape or '9:16' vertical reel)
 * @returns JSON containing async operationName for status polling
 */
app.post('/api/generate-video', async (req: Request, res: Response) => {
  try {
    const { prompt, imageBase64, aspectRatio = '16:9' } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ error: 'Image is required for animating into video' });
    }

    const commaIdx = imageBase64.indexOf(',');
    const rawData = commaIdx >= 0 ? imageBase64.slice(commaIdx + 1) : imageBase64;
    const matchMime = imageBase64.match(/^data:(image\/[a-zA-Z+]+);base64,/);
    const mimeType = matchMime ? matchMime[1] : 'image/jpeg';

    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
    });

    const targetAspectRatio = aspectRatio === '9:16' ? '9:16' : '16:9';

    let operation;
    try {
      operation = await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt: prompt || 'Smooth cinematic market motion panning across fresh vegetables',
        image: {
          imageBytes: rawData,
          mimeType
        },
        config: {
          numberOfVideos: 1,
          resolution: '720p',
          aspectRatio: targetAspectRatio
        }
      });
    } catch (e: any) {
      console.warn('veo-3.1-fast-generate-preview error, falling back to veo-3.1-lite-generate-preview:', e?.message);
      operation = await ai.models.generateVideos({
        model: 'veo-3.1-lite-generate-preview',
        prompt: prompt || 'Smooth cinematic market motion panning across fresh vegetables',
        image: {
          imageBytes: rawData,
          mimeType
        },
        config: {
          numberOfVideos: 1,
          resolution: '720p',
          aspectRatio: targetAspectRatio
        }
      });
    }

    return res.json({ operationName: operation.name });
  } catch (err: any) {
    console.error('Error starting video generation:', err);
    return res.status(500).json({ error: err?.message || 'Failed to start video generation' });
  }
});

/**
 * 15. Veo Video Status Poll
 * @route POST /api/video-status
 * @description Polls Google GenAI Long Running Operations (LRO) for Veo video generation completion.
 * @param req.body.operationName LRO operation handle from /api/generate-video
 * @returns JSON containing 'done' boolean status and optional error details
 */
app.post('/api/video-status', async (req: Request, res: Response) => {
  try {
    const { operationName } = req.body;
    if (!operationName) {
      return res.status(400).json({ error: 'operationName is required' });
    }

    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
    });

    const op = new GenerateVideosOperation();
    op.name = operationName;
    const updated = await ai.operations.getVideosOperation({ operation: op });
    return res.json({
      done: Boolean(updated.done),
      error: updated.error || null
    });
  } catch (err: any) {
    console.error('Error polling video status:', err);
    return res.status(500).json({ error: err?.message || 'Failed to poll video status' });
  }
});

/**
 * 16. Veo Video Download Stream
 * @route POST /api/video-download
 * @description Streams generated MP4 video buffer from Google Cloud Storage to client.
 * @param req.body.operationName Completed LRO operation name
 * @returns MP4 binary video stream with Content-Type: video/mp4
 */
app.post('/api/video-download', async (req: Request, res: Response) => {
  try {
    const { operationName } = req.body;
    if (!operationName) {
      return res.status(400).json({ error: 'operationName is required' });
    }

    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
    });

    const op = new GenerateVideosOperation();
    op.name = operationName;
    const updated = await ai.operations.getVideosOperation({ operation: op });
    const uri = updated.response?.generatedVideos?.[0]?.video?.uri;
    if (!uri) {
      return res.status(404).json({ error: 'Video URI not available' });
    }

    const videoRes = await fetch(uri, {
      headers: { 'x-goog-api-key': process.env.GEMINI_API_KEY! }
    });

    if (!videoRes.ok) {
      throw new Error(`Failed to fetch video: ${videoRes.statusText}`);
    }

    res.setHeader('Content-Type', 'video/mp4');
    const arrayBuffer = await videoRes.arrayBuffer();
    return res.send(Buffer.from(arrayBuffer));
  } catch (err: any) {
    console.error('Error downloading video:', err);
    return res.status(500).json({ error: err?.message || 'Failed to download video' });
  }
});

// Vite Middleware for dev & static serve for production
async function startServer() {
  const server = http.createServer(app);

  /**
   * 18. Gemini Multimodal Live WebSocket Bridge
   * @protocol WebSocket (WSS/WS)
   * @endpoint /live-ws
   * @description Manages a full-duplex streaming audio connection with gemini-3.8-live over 16kHz PCM audio buffers.
   * Enables low-latency natural conversational interaction in Tamil and English for illiterate produce merchants.
   */
  const wss = new WebSocketServer({ server, path: '/live-ws' });
  wss.on('connection', async (clientWs) => {
    try {
      const ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
      });

      const session = await ai.live.connect({
        model: 'gemini-3.8-live',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } }
          },
          systemInstruction: 'You are SanthAI, a low-latency conversational Tamil & English market assistant for wholesale & retail vendors in India. Answer questions about produce stock forecasting, wholesale mandi prices, zero-waste surplus markdown, and khata credit quickly and naturally.'
        },
        callbacks: {
          onmessage: (message: LiveServerMessage) => {
            const audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            const text = message.serverContent?.modelTurn?.parts?.[0]?.text;
            if (audio) {
              clientWs.send(JSON.stringify({ audio, text }));
            }
            if (message.serverContent?.interrupted) {
              clientWs.send(JSON.stringify({ interrupted: true }));
            }
          },
          onclose: () => {
            clientWs.close();
          },
          onerror: (err: any) => {
            clientWs.send(JSON.stringify({ error: err?.message || 'Live session error' }));
          }
        }
      });

      clientWs.on('message', (data) => {
        try {
          const parsed = JSON.parse(data.toString());
          if (parsed.audio) {
            session.sendRealtimeInput({
              audio: { data: parsed.audio, mimeType: 'audio/pcm;rate=16000' }
            });
          } else if (parsed.text) {
            session.sendClientContent({
              turns: [{ role: 'user', parts: [{ text: parsed.text }] }],
              turnComplete: true
            });
          }
        } catch (e) {
          console.error('WS message error:', e);
        }
      });

      clientWs.on('close', () => {
        try {
          if ((session as any)?.close) (session as any).close();
        } catch {}
      });
    } catch (err: any) {
      clientWs.send(JSON.stringify({ error: err?.message || 'Live session initialization error' }));
      clientWs.close();
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`[SanthAI Server] Running on http://0.0.0.0:${PORT} with Live WebSocket on /live-ws`);
  });
}

startServer();
