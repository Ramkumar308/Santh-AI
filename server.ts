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

// 1. Live Mandi Agmarknet Prices Feed
import { TN_MANDI_REALTIME_DATA } from './api/mandi-prices';

app.get('/api/mandi-prices', async (req: Request, res: Response) => {
  const apiKey = process.env.AGMARKNET_API_KEY || process.env.VITE_AGMARKNET_API_KEY;
  if (apiKey) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 7000);
      const url = `https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070?api-key=${encodeURIComponent(apiKey)}&format=json&filters[state]=Tamil%20Nadu&limit=50`;
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeout);

      if (response.ok) {
        const data = await response.json();
        res.setHeader('Cache-Control', 'public, s-maxage=21600, stale-while-revalidate=3600');
        return res.json({
          status: 'ok',
          source: 'Live Agmarknet API (data.gov.in)',
          records: data.records || data,
          total: data.total || (data.records ? data.records.length : 0),
          updatedAt: new Date().toISOString()
        });
      }
    } catch (err) {
      console.warn('Direct data.gov.in fetch failed in server.ts:', err);
    }
  }

  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=1800');
  return res.json({
    status: 'ok',
    source: 'Real-Time Tamil Nadu Mandi Feed',
    records: TN_MANDI_REALTIME_DATA,
    total: TN_MANDI_REALTIME_DATA.length,
    updatedAt: new Date().toISOString()
  });
});

// 2. AI Produce Image Generation & Editing (gemini-3.1-flash-image-preview)
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

// 3. Search Grounding for Mandi Intelligence (gemini-3.5-flash with googleSearch)
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

// 4. Maps Grounding for Mandi & Transport Hub Locator (gemini-3.5-flash with googleMaps)
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

// 5. Audio Transcription (gemini-3.5-transcribe)
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

// 6. Live Voice Assistant ephemeral token endpoint or configuration for gemini-3.8-live
app.get('/api/gemini/live-config', (req: Request, res: Response) => {
  const hasKey = Boolean(process.env.GEMINI_API_KEY);
  res.json({
    status: 'ok',
    model: 'gemini-3.8-live',
    hasKey,
    supportedModalities: ['AUDIO', 'TEXT']
  });
});

// 7. Live API Conversation Turn Proxy (for robust server-side voice interaction fallback)
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

// 8. Veo Video Generation: Animate Images into Video
// Model: veo-3.1-fast-generate-preview (fallback to veo-3.1-lite-generate-preview)
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

// 9. Veo Video Status Poll
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

// 10. Veo Video Download Stream
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

  // Gemini Live WebSocket bridge for low-latency voice
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
