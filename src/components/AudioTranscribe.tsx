import React, { useState, useRef } from 'react';
import { Mic, Square, RefreshCw, Volume2, CheckCircle2, AlertCircle, FileText, ArrowRight } from 'lucide-react';
import { Language } from '../types';

interface AudioTranscribeProps {
  lang: Language;
  onTranscriptionResult?: (text: string) => void;
}

export const AudioTranscribe: React.FC<AudioTranscribeProps> = ({ lang, onTranscriptionResult }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [loading, setLoading] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    setError(null);
    setTranscript('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mediaRecorder.mimeType || 'audio/webm' });
        // Stop audio tracks
        stream.getTracks().forEach((track) => track.stop());

        // Convert blob to base64
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64Data = reader.result as string;
          await sendAudioToTranscribe(base64Data, audioBlob.type || 'audio/webm');
        };
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err: any) {
      setError(
        lang === 'ta'
          ? 'மைக்ரோஃபோன் அணுகல் மறுக்கப்பட்டது அல்லது ஆதரிக்கப்படவில்லை.'
          : 'Microphone permission denied or device not supported.'
      );
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const sendAudioToTranscribe = async (audioBase64: string, mimeType: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/gemini/transcribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ audioBase64, mimeType })
      });

      const data = await response.json();
      if (!response.ok || data.error) {
        throw new Error(data.error || 'Transcription failed');
      }

      const text = data.transcript || '';
      setTranscript(text);
      if (onTranscriptionResult) {
        onTranscriptionResult(text);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to transcribe audio with Gemini 3.5 Transcribe');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-600 border border-purple-500/20">
            <Mic className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              {lang === 'ta' ? 'குரல் ஆடியோ உரைபெயர்ப்பு (Audio Transcribe)' : 'Microphone Voice Transcription'}
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 font-bold">
                gemini-3.5-transcribe
              </span>
            </h3>
            <p className="text-xs text-slate-500">
              {lang === 'ta'
                ? 'மைக் மூலம் உங்கள் குரலை பதிவு செய்யுங்கள். ஜெமினி 3.5 தமிழ் மற்றும் ஆங்கில பேச்சை துல்லியமான எழுத்தாக மாற்றும்.'
                : 'Speak produce counts, credit repayments, or mandi notes to transcribe them directly with Gemini 3.5 Transcribe.'}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-5 flex flex-col sm:flex-row items-center gap-5">
        <div className="flex flex-col items-center justify-center">
          <button
            id="gemini-transcribe-record-btn"
            type="button"
            onClick={isRecording ? stopRecording : startRecording}
            disabled={loading}
            className={`w-20 h-20 rounded-full flex flex-col items-center justify-center transition-all shadow-md ${
              isRecording
                ? 'bg-rose-600 text-white animate-pulse ring-4 ring-rose-200'
                : 'bg-purple-600 hover:bg-purple-700 text-white hover:scale-105'
            }`}
          >
            {isRecording ? <Square className="w-7 h-7" /> : <Mic className="w-7 h-7" />}
            <span className="text-[10px] font-bold mt-1">
              {isRecording
                ? (lang === 'ta' ? 'நிறுத்து' : 'Stop')
                : (lang === 'ta' ? 'பேசுங்கள்' : 'Record')}
            </span>
          </button>
        </div>

        <div className="flex-1 w-full space-y-2">
          <div className="text-xs text-slate-600 font-medium">
            {isRecording ? (
              <div className="flex items-center gap-2 text-rose-600 font-bold">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-ping" />
                <span>{lang === 'ta' ? 'குரல் பதிவு செய்யப்படுகிறது... பேசி முடித்ததும் நிறுத்து பொத்தானை அழுத்தவும்' : 'Recording audio... Click stop when finished speaking.'}</span>
              </div>
            ) : loading ? (
              <div className="flex items-center gap-2 text-purple-700 font-semibold">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>{lang === 'ta' ? 'gemini-3.5-transcribe குரலை எழுத்தாக மாற்றுகிறது...' : 'Transcribing voice with gemini-3.5-transcribe...'}</span>
              </div>
            ) : (
              <p className="text-slate-500">
                {lang === 'ta'
                  ? 'எ.கா: "இன்று காலை 50 கிலோ தக்காளி வரவு, 30 விற்று விட்டது, 20 கிலோ மீதி உள்ளது..."'
                  : 'Speak naturally in Tamil or English (e.g., "Received 50kg tomato, sold 35kg, remaining 15kg").'}
              </p>
            )}
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {transcript && (
            <div className="p-3.5 rounded-xl bg-purple-50/60 border border-purple-200">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-bold uppercase text-purple-900 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-purple-700" />
                  {lang === 'ta' ? 'எழுத்து வடிவம் (Transcript):' : 'Transcription Result:'}
                </span>
                <span className="text-[10px] text-purple-600 font-mono">gemini-3.5-transcribe</span>
              </div>
              <p className="text-sm font-medium text-slate-900 bg-white p-2.5 rounded-lg border border-purple-100">
                "{transcript}"
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
