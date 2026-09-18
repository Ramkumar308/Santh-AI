import { CommodityType } from '../types';
import { COMMODITIES } from '../data/commodities';

export interface ParsedStockVoiceInput {
  rawTranscript: string;
  detectedCommodity?: CommodityType;
  receivedKg?: number;
  wasteKg?: number;
  soldKg?: number;
  unsoldKg?: number;
  confidence: 'high' | 'medium' | 'low';
  summaryEn: string;
  summaryTa: string;
}

const TAMIL_NUMBER_MAP: Record<string, number> = {
  'ஒன்று': 1, 'ஒன்னு': 1, 'ஒரு': 1,
  'இரண்டு': 2, 'ரெண்டு': 2, 'ரண்டு': 2,
  'மூன்று': 3, 'மூணு': 3,
  'நான்கு': 4, 'நாலு': 4,
  'ஐந்து': 5, 'அஞ்சு': 5,
  'ஆறு': 6,
  'ஏழு': 7,
  'எட்டு': 8,
  'ஒன்பது': 9,
  'பத்து': 10,
  'இருபது': 20,
  'முப்பது': 30,
  'நாற்பது': 40,
  'ஐம்பது': 50,
  'அறுபது': 60,
  'எழுபது': 70,
  'எண்பது': 80,
  'தொண்ணூறு': 90,
  'நூறு': 100
};

const ENGLISH_NUMBER_MAP: Record<string, number> = {
  'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
  'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10,
  'fifteen': 15, 'twenty': 20, 'twenty five': 25, 'thirty': 30,
  'forty': 40, 'fifty': 50, 'sixty': 60, 'seventy': 70,
  'eighty': 80, 'ninety': 90, 'hundred': 100
};

/**
 * Parses spoken voice input in Tamil, English, or mixed Tanglish
 * into structured daily arrival & waste values for low-literacy produce merchants.
 */
export function parseSpokenStockEntry(
  transcript: string,
  fallbackCommodity: CommodityType = 'Tomato'
): ParsedStockVoiceInput {
  let clean = transcript.trim().toLowerCase();

  // Replace spoken word numbers with digits for seamless parsing
  for (const [word, val] of Object.entries(TAMIL_NUMBER_MAP)) {
    clean = clean.split(word).join(String(val));
  }
  for (const [word, val] of Object.entries(ENGLISH_NUMBER_MAP)) {
    clean = clean.split(word).join(String(val));
  }

  let detectedCommodity: CommodityType | undefined = undefined;

  // 1. Detect Commodity
  // Check Tamil names
  if (clean.includes('தக்காளி') || clean.includes('தக்காளி பழம்')) detectedCommodity = 'Tomato';
  else if (clean.includes('வெங்காயம்') || clean.includes('சின்ன வெங்காயம்') || clean.includes('பெரிய வெங்காயம்')) detectedCommodity = 'Onion';
  else if (clean.includes('உருளை') || clean.includes('உருளைக்கிழங்கு')) detectedCommodity = 'Potato';
  else if (clean.includes('கத்தரி') || clean.includes('கத்திரிக்காய்')) detectedCommodity = 'Brinjal';
  else if (clean.includes('முட்டைக்கோஸ்') || clean.includes('முட்டைகோஸ்') || clean.includes('கோஸ்')) detectedCommodity = 'Cabbage';
  else if (clean.includes('கேரட்')) detectedCommodity = 'Carrot';
  // Check English names
  else if (clean.includes('tomato')) detectedCommodity = 'Tomato';
  else if (clean.includes('onion')) detectedCommodity = 'Onion';
  else if (clean.includes('potato')) detectedCommodity = 'Potato';
  else if (clean.includes('brinjal') || clean.includes('eggplant')) detectedCommodity = 'Brinjal';
  else if (clean.includes('cabbage')) detectedCommodity = 'Cabbage';
  else if (clean.includes('carrot')) detectedCommodity = 'Carrot';

  const effectiveCommodity = detectedCommodity || fallbackCommodity || 'Tomato';

  // Determine if vendor spoke numbers before keywords or keywords before numbers
  const allKnownKeywords = [
    'வரவு', 'வந்தது', 'வாங்கியது', 'சரக்கு', 'வந்திருக்கு', 'வாங்கினது',
    'arrival', 'received', 'procured', 'bought', 'inflow', 'got', 'entry',
    'கழிவு', 'சேதம்', 'அழுகல்', 'வேஸ்ட்', 'அழுகினது', 'வீணானது', 'தூக்கியது',
    'waste', 'spoil', 'spoiled', 'spoilage', 'damage', 'damaged', 'loss', 'decay', 'discard',
    'விற்பனை', 'விற்றது', 'வித்தது', 'போனது', 'வித்திருக்கோம்',
    'sold', 'sale', 'sales', 'out',
    'மீதம்', 'மீதி', 'இருப்பு', 'பேலன்ஸ்', 'நிக்கிறது',
    'unsold', 'left', 'balance', 'remaining', 'remain'
  ];

  let firstKwIndex = 999999;
  for (const kw of allKnownKeywords) {
    const idx = clean.indexOf(kw);
    if (idx !== -1 && idx < firstKwIndex) firstKwIndex = idx;
  }
  const firstNumMatch = clean.match(/\b\d+(?:\.\d+)?\b/);
  const firstNumIndex = firstNumMatch ? clean.indexOf(firstNumMatch[0]) : 999999;
  const numbersFirst = firstNumIndex < firstKwIndex;

  // Helper to extract a number following or preceding specific keywords
  const extractQuantity = (keywords: string[]): number | undefined => {
    const tryRegexAfter = (): number | undefined => {
      for (const kw of keywords) {
        const regexAfter = new RegExp(`${kw}\\s*(?:ஆனது|ஆகியது|is|of|was)?\\s*(\\d+(?:\\.\\d+)?)\\s*(?:kg|கிலோ|கிலோகிராம்|kilo)?`, 'i');
        const matchAfter = clean.match(regexAfter);
        if (matchAfter && matchAfter[1]) {
          return parseFloat(matchAfter[1]);
        }
      }
      return undefined;
    };

    const tryRegexBefore = (): number | undefined => {
      for (const kw of keywords) {
        const regexBefore = new RegExp(`(?:^|[^\\d])(\\d+(?:\\.\\d+)?)\\s*(?:kg|கிலோ|கிலோகிராம்|kilo)?\\s*(?:of\\s*)?(?:[a-zA-Z\\u0B80-\\u0BFF]+\\s*)?${kw}`, 'i');
        const matchBefore = clean.match(regexBefore);
        if (matchBefore && matchBefore[1]) {
          return parseFloat(matchBefore[1]);
        }
      }
      return undefined;
    };

    if (numbersFirst) {
      return tryRegexBefore() ?? tryRegexAfter();
    } else {
      return tryRegexAfter() ?? tryRegexBefore();
    }
  };

  // Keywords definitions
  const arrivalKeywords = [
    'வரவு', 'வந்தது', 'வாங்கியது', 'சரக்கு', 'வந்திருக்கு', 'வாங்கினது',
    'arrival', 'received', 'procured', 'bought', 'inflow', 'got', 'entry'
  ];

  const wasteKeywords = [
    'கழிவு', 'சேதம்', 'அழுகல்', 'வேஸ்ட்', 'அழுகினது', 'வீணானது', 'தூக்கியது',
    'waste', 'spoil', 'spoiled', 'spoilage', 'damage', 'damaged', 'loss', 'decay', 'discard'
  ];

  const soldKeywords = [
    'விற்பனை', 'விற்றது', 'வித்தது', 'போனது', 'வித்திருக்கோம்',
    'sold', 'sale', 'sales', 'out'
  ];

  const unsoldKeywords = [
    'மீதம்', 'மீதி', 'இருப்பு', 'பேலன்ஸ்', 'நிக்கிறது',
    'unsold', 'left', 'balance', 'remaining', 'remain'
  ];

  let receivedKg = extractQuantity(arrivalKeywords);
  let wasteKg = extractQuantity(wasteKeywords);
  let soldKg = extractQuantity(soldKeywords);
  let unsoldKg = extractQuantity(unsoldKeywords);

  // Fallback: If no explicit arrival keyword found, look for first standalone number
  const allNumbers = clean.match(/\b\d+(?:\.\d+)?\b/g)?.map(n => parseFloat(n)) || [];

  if (receivedKg === undefined && allNumbers.length > 0) {
    // If the vendor said e.g. "தக்காளி 50 கிலோ 2 கழிவு" or "Tomato 50 2 waste"
    receivedKg = allNumbers[0];
    if (wasteKg === undefined && allNumbers.length > 1) {
      // Second number might be waste if waste keyword is present anywhere
      const hasWasteWord = wasteKeywords.some(w => clean.includes(w));
      if (hasWasteWord) {
        wasteKg = allNumbers[1];
      }
    }
  }

  // If waste is still not found but waste keyword exists and a second number exists
  if (wasteKg === undefined && allNumbers.length >= 2 && wasteKeywords.some(w => clean.includes(w))) {
    wasteKg = allNumbers[allNumbers.length - 1];
  }

  // Derive sensible defaults for sold / unsold if partial data was spoken
  if (receivedKg !== undefined) {
    if (wasteKg === undefined) wasteKg = 0;

    if (soldKg === undefined && unsoldKg === undefined) {
      // Assume end-of-day: vendor typically sold ~85% of arrival minus waste
      soldKg = Math.max(0, Math.round((receivedKg - wasteKg) * 0.85));
      unsoldKg = Math.max(0, receivedKg - soldKg - wasteKg);
    } else if (soldKg !== undefined && unsoldKg === undefined) {
      unsoldKg = Math.max(0, receivedKg - soldKg - wasteKg);
    } else if (unsoldKg !== undefined && soldKg === undefined) {
      soldKg = Math.max(0, receivedKg - unsoldKg - wasteKg);
    }
  }

  const confidence: 'high' | 'medium' | 'low' =
    receivedKg !== undefined && wasteKg !== undefined ? 'high' :
    receivedKg !== undefined ? 'medium' : 'low';

  const commMeta = COMMODITIES[effectiveCommodity] || COMMODITIES.Tomato;
  const summaryEn = receivedKg !== undefined
    ? `${commMeta.nameEn}: Received ${receivedKg} kg, Sold ${soldKg ?? 0} kg, Waste ${wasteKg ?? 0} kg`
    : `Could not determine quantities. Please try speaking like: "Tomato arrival 50 kg waste 2 kg"`;

  const summaryTa = receivedKg !== undefined
    ? `${commMeta.nameTa}: வரவு ${receivedKg} கிலோ, விற்பனை ${soldKg ?? 0} கிலோ, கழிவு ${wasteKg ?? 0} கிலோ`
    : `அளவுகள் புரியவில்லை. தயவுசெய்து "தக்காளி வரவு 50 கிலோ கழிவு 2 கிலோ" என்று பேசவும்`;

  return {
    rawTranscript: transcript,
    detectedCommodity,
    receivedKg,
    wasteKg,
    soldKg,
    unsoldKg,
    confidence,
    summaryEn,
    summaryTa
  };
}
