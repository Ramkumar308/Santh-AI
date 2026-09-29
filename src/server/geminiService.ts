import { GoogleGenAI } from '@google/genai';

let geminiClient: GoogleGenAI | null = null;

export function getGemini(): GoogleGenAI {
  if (!geminiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error('GEMINI_API_KEY environment variable is not configured');
    }
    geminiClient = new GoogleGenAI({ apiKey: key });
  }
  return geminiClient;
}

/**
 * 1. Generate or edit produce promotional banner images
 * Model: gemini-3.1-flash-image-preview
 */
export async function generateProduceImage(prompt: string, base64InputImage?: string): Promise<{
  imageDataUrl: string;
  mimeType: string;
  description: string;
}> {
  const ai = getGemini();

  const parts: any[] = [];
  if (base64InputImage) {
    const commaIdx = base64InputImage.indexOf(',');
    const rawBase64 = commaIdx >= 0 ? base64InputImage.slice(commaIdx + 1) : base64InputImage;
    const matchMime = base64InputImage.match(/^data:(image\/[a-zA-Z+]+);base64,/);
    const mimeType = matchMime ? matchMime[1] : 'image/jpeg';

    parts.push({
      inlineData: {
        data: rawBase64,
        mimeType
      }
    });
  }

  parts.push({
    text: prompt
  });

  const response = await ai.models.generateContent({
    model: 'gemini-3.1-flash-image-preview',
    contents: parts,
    config: {
      responseModalities: ['IMAGE', 'TEXT']
    }
  });

  let foundImageDataUrl = '';
  let foundMime = 'image/png';
  let textDescription = '';

  const candidates = response.candidates || [];
  for (const c of candidates) {
    for (const part of c.content?.parts || []) {
      if ((part as any).inlineData) {
        const d = (part as any).inlineData;
        foundMime = d.mimeType || 'image/png';
        foundImageDataUrl = `data:${foundMime};base64,${d.data}`;
      } else if (part.text) {
        textDescription += part.text;
      }
    }
  }

  if (!foundImageDataUrl) {
    throw new Error('No image was returned from Gemini model. ' + (textDescription || ''));
  }

  return {
    imageDataUrl: foundImageDataUrl,
    mimeType: foundMime,
    description: textDescription.trim()
  };
}

/**
 * 2. Search Grounding for Live Wholesale Mandi Intelligence & Agricultural Policies
 * Model: gemini-3.5-flash
 */
export async function searchMandiIntel(query: string, language: 'en' | 'ta' = 'en'): Promise<{
  content: string;
  sources: { title: string; url: string }[];
}> {
  const ai = getGemini();

  const prompt = language === 'ta'
    ? `நீங்கள் தமிழ்நாட்டின் காய்கறி சந்தை மற்றும் மண்டி நிபுணர். இந்த கேள்விக்கு துல்லியமான சமீபத்திய தகவலை Google Search கொண்டு வழங்கவும்:\n\n${query}`
    : `You are an expert agricultural market and mandi intelligence analyst for Tamil Nadu and India. Use Google Search to provide up-to-date accurate information on:\n\n${query}`;

  const response = await ai.models.generateContent({
    model: 'gemini-3.5-flash',
    contents: prompt,
    config: {
      tools: [{ googleSearch: {} }]
    }
  });

  const content = response.text || '';
  const sources: { title: string; url: string }[] = [];

  const candidates = response.candidates || [];
  for (const cand of candidates) {
    const grounding = cand.groundingMetadata;
    if (grounding?.groundingChunks) {
      for (const chunk of grounding.groundingChunks) {
        if ((chunk as any).web) {
          sources.push({
            title: (chunk as any).web.title || 'Web Resource',
            url: (chunk as any).web.uri || ''
          });
        }
      }
    }
  }

  return {
    content,
    sources
  };
}

/**
 * 3. Maps Grounding for Mandi Logistics, Market Stalls, and Cold Storage Locators
 * Model: gemini-3.5-flash
 */
export async function findNearbyMandiLocations(query: string, lat?: number, lng?: number): Promise<{
  content: string;
  places: { title: string; uri: string }[];
}> {
  const ai = getGemini();

  const toolConfig = (lat !== undefined && lng !== undefined)
    ? {
        retrievalConfig: {
          latLng: {
            latitude: lat,
            longitude: lng
          }
        }
      }
    : undefined;

  const response = await ai.models.generateContent({
    model: 'gemini-3.5-flash',
    contents: `Find wholesale produce mandis, vegetable markets, cold storages, and agriculture transport hubs for: ${query}. Mention names, locations, and logistical accessibility for produce vendors.`,
    config: {
      tools: [{ googleMaps: {} }],
      toolConfig
    }
  });

  const content = response.text || '';
  const places: { title: string; uri: string }[] = [];

  const candidates = response.candidates || [];
  for (const cand of candidates) {
    const grounding = cand.groundingMetadata;
    if (grounding?.groundingChunks) {
      for (const chunk of grounding.groundingChunks) {
        if ((chunk as any).maps) {
          places.push({
            title: (chunk as any).maps.title || 'Mandi Location',
            uri: (chunk as any).maps.uri || ''
          });
        }
      }
    }
  }

  return {
    content,
    places
  };
}

/**
 * 4. Audio Transcription with gemini-3.5-transcribe
 * Transcribes recorded vendor spoken audio (WAV / MP3 / OGG / WEBM)
 */
export async function transcribeAudioVoice(audioBase64: string, mimeType: string = 'audio/webm'): Promise<{
  transcript: string;
}> {
  const ai = getGemini();

  const commaIdx = audioBase64.indexOf(',');
  const rawBase64 = commaIdx >= 0 ? audioBase64.slice(commaIdx + 1) : audioBase64;

  const response = await ai.models.generateContent({
    model: 'gemini-3.5-transcribe',
    contents: [
      {
        inlineData: {
          data: rawBase64,
          mimeType
        }
      },
      {
        text: 'Transcribe the spoken audio with maximum precision. It may contain Tamil, English, or Tanglish spoken numbers and produce commodity names (e.g., தக்காளி, வெங்காயம், உருளை, கிலோ, வரவு, சேதம்).'
      }
    ]
  });

  return {
    transcript: response.text || ''
  };
}
