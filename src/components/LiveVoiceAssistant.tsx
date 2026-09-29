import React, { useState, useRef, useEffect } from 'react';
import { Radio, Mic, MicOff, Volume2, Send, RefreshCw, AlertCircle, Bot, User, Sparkles } from 'lucide-react';
import { Language } from '../types';

interface LiveVoiceAssistantProps {
  lang: Language;
}

interface ChatTurn {
  role: 'user' | 'assistant';
  text: string;
  time: string;
}

export const LiveVoiceAssistant: React.FC<LiveVoiceAssistantProps> = ({ lang }) => {
  const [isActive, setIsActive] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [turns, setTurns] = useState<ChatTurn[]>([
    {
      role: 'assistant',
      text:
        lang === 'ta'
          ? 'வணக்கம்! நான் SanthAI நேரலை குரல் உதவியாளர் (gemini-3.8-live). இன்றைய சந்தை விலை, வரத்து, வாடிக்கையாளர் கடன் அல்லது மாலை நேர கழிவு மேலாண்மை குறித்து என்னிடம் பேசுங்கள்.'
          : 'Namaste! I am your SanthAI Live Assistant (gemini-3.8-live). Ask me anything in real-time regarding today\'s mandi prices, stock forecast, customer credit, or evening waste reduction.',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [turns, loading]);

  const speakReply = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang === 'ta' ? 'ta-IN' : 'en-IN';
      utterance.rate = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleSend = async (messageText?: string, audioBase64?: string) => {
    const textToSend = messageText !== undefined ? messageText : inputText;
    if (!textToSend.trim() && !audioBase64) return;

    setError(null);
    setInputText('');

    const newTurn: ChatTurn = {
      role: 'user',
      text: textToSend || (lang === 'ta' ? '🎤 [குரல் பதிவு]' : '🎤 [Voice Audio Query]'),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setTurns((prev) => [...prev, newTurn]);
    setLoading(true);

    try {
      // Build conversation history for context
      const history = turns.slice(-6).map((t) => ({
        role: t.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: t.text }]
      }));

      const response = await fetch('/api/gemini/live-conversation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend || undefined,
          audioBase64: audioBase64 || undefined,
          history,
          language: lang
        })
      });

      const data = await response.json();
      if (!response.ok || data.error) {
        throw new Error(data.error || 'Live conversation failed');
      }

      const replyText = data.reply || (lang === 'ta' ? 'பதில் பெறப்பட்டது.' : 'Received response.');
      const assistantTurn: ChatTurn = {
        role: 'assistant',
        text: replyText,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setTurns((prev) => [...prev, assistantTurn]);
      speakReply(replyText);
    } catch (err: any) {
      setError(err?.message || 'Error communicating with Live API');
    } finally {
      setLoading(false);
    }
  };

  const startVoiceTurn = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mr = new MediaRecorder(stream);
      mediaRecorderRef.current = mr;

      mr.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mr.onstop = async () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        stream.getTracks().forEach((t) => t.stop());
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = () => {
          const b64 = reader.result as string;
          handleSend('', b64);
        };
      };

      mr.start();
      setIsRecording(true);
    } catch {
      setError('Microphone access is required for real-time voice speaking.');
    }
  };

  const stopVoiceTurn = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col h-[520px]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-teal-500/10 flex items-center justify-center text-teal-600 border border-teal-500/20">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              {lang === 'ta' ? 'நேரலை குரல் உதவியாளர் (Live Voice Assistant)' : 'Live Voice Assistant'}
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-md bg-teal-100 text-teal-800 font-bold">
                gemini-3.8-live
              </span>
            </h3>
            <p className="text-xs text-slate-500">
              {lang === 'ta'
                ? 'நேரலையாக பேசி உடனடி குரல் மற்றும் உரை வழிகாட்டுதல் பெறுங்கள்.'
                : 'Interactive continuous conversation powered by Gemini Live API with automatic audio playback.'}
            </p>
          </div>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-3 mt-3">
        {turns.map((t, idx) => (
          <div
            key={idx}
            className={`flex items-start gap-2.5 ${t.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
          >
            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                t.role === 'user'
                  ? 'bg-slate-900 text-white'
                  : 'bg-teal-600 text-white'
              }`}
            >
              {t.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>
            <div
              className={`max-w-[82%] rounded-2xl p-3 text-xs sm:text-sm leading-relaxed ${
                t.role === 'user'
                  ? 'bg-slate-900 text-white rounded-tr-none'
                  : 'bg-slate-50 text-slate-800 border border-slate-200/80 rounded-tl-none'
              }`}
            >
              <p className="whitespace-pre-wrap">{t.text}</p>
              <div className="flex items-center justify-between mt-1 text-[10px] opacity-60">
                <span>{t.time}</span>
                {t.role === 'assistant' && (
                  <button
                    type="button"
                    onClick={() => speakReply(t.text)}
                    className="hover:underline flex items-center gap-0.5 ml-2"
                  >
                    <Volume2 className="w-3 h-3" />
                    <span>{lang === 'ta' ? 'மீண்டும் கேள்' : 'Replay Voice'}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-2 text-teal-700 text-xs p-2.5 rounded-xl bg-teal-50/60 w-fit">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            <span>{lang === 'ta' ? 'gemini-3.8-live பதிலளிக்கிறது...' : 'gemini-3.8-live is responding...'}</span>
          </div>
        )}
      </div>

      {error && (
        <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2 my-2 shrink-0">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Input Bar & Live Mic Button */}
      <div className="pt-3 border-t border-slate-100 flex items-center gap-2 shrink-0">
        <button
          id="gemini-live-mic-btn"
          type="button"
          onClick={isRecording ? stopVoiceTurn : startVoiceTurn}
          disabled={loading}
          className={`p-2.5 rounded-xl transition-all shrink-0 ${
            isRecording
              ? 'bg-rose-600 text-white animate-pulse ring-4 ring-rose-200'
              : 'bg-teal-600 hover:bg-teal-700 text-white shadow-2xs'
          }`}
          title={isRecording ? 'Stop Recording' : 'Press to Speak to Live API'}
        >
          {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </button>

        <input
          id="gemini-live-chat-input"
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder={
            isRecording
              ? (lang === 'ta' ? '🎤 பேசுகிறீர்கள்...' : '🎤 Listening...')
              : (lang === 'ta' ? 'என்னிடம் கேளுங்கள் அல்லது மைக் அழுத்தவும்...' : 'Ask a question or tap mic to speak live...')
          }
          className="flex-1 text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none text-slate-900"
        />

        <button
          type="button"
          onClick={() => handleSend()}
          disabled={loading || !inputText.trim()}
          className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white transition-colors shrink-0"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
