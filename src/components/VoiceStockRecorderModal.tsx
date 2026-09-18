import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Sparkles,
  HelpCircle,
  Save,
  Radio
} from 'lucide-react';
import { CommodityType, DailyStockLog, Language } from '../types';
import { COMMODITIES } from '../data/commodities';
import { parseSpokenStockEntry, ParsedStockVoiceInput } from '../services/voiceStockParser';
import { SoundEffects } from '../utils/audioHaptics';
import { speakText } from '../utils/i18n';
import confetti from 'canvas-confetti';

interface VoiceStockRecorderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveLog: (log: Omit<DailyStockLog, 'id'>) => void;
  currentCommodity: CommodityType;
  onSelectCommodity?: (comm: CommodityType) => void;
  lang: Language;
}

// Browser Web Speech API interfaces
interface IWindow extends Window {
  SpeechRecognition?: any;
  webkitSpeechRecognition?: any;
}

export const VoiceStockRecorderModal: React.FC<VoiceStockRecorderModalProps> = ({
  isOpen,
  onClose,
  onSaveLog,
  currentCommodity,
  onSelectCommodity,
  lang
}) => {
  const [isListening, setIsListening] = useState<boolean>(false);
  const [transcript, setTranscript] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [speechSupported, setSpeechSupported] = useState<boolean>(true);
  const [parsedData, setParsedData] = useState<ParsedStockVoiceInput | null>(null);

  // Editable parsed values for quick fine-tuning
  const [receivedKg, setReceivedKg] = useState<number>(50);
  const [wasteKg, setWasteKg] = useState<number>(2);
  const [soldKg, setSoldKg] = useState<number>(44);
  const [unsoldKg, setUnsoldKg] = useState<number>(4);
  const [selectedCommodity, setSelectedCommodity] = useState<CommodityType>(currentCommodity);

  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (isOpen) {
      setSelectedCommodity(currentCommodity);
      setTranscript('');
      setParsedData(null);
      setErrorMsg(null);
      checkSpeechSupport();
    } else {
      stopListening();
    }
  }, [isOpen, currentCommodity]);

  const checkSpeechSupport = () => {
    const win = window as unknown as IWindow;
    const SpeechRec = win.SpeechRecognition || win.webkitSpeechRecognition;
    if (!SpeechRec) {
      setSpeechSupported(false);
    } else {
      setSpeechSupported(true);
    }
  };

  const startListening = () => {
    setErrorMsg(null);
    SoundEffects.playClick();

    const win = window as unknown as IWindow;
    const SpeechRec = win.SpeechRecognition || win.webkitSpeechRecognition;

    if (!SpeechRec) {
      setSpeechSupported(false);
      setErrorMsg(
        lang === 'ta'
          ? 'உங்கள் உலாவியில் குரல் அறிதல் ஆதரிக்கப்படவில்லை. கீழே உள்ள மாதிரி உதாரணங்களை பயன்படுத்தலாம்.'
          : 'Speech recognition is not natively supported in this browser. You can use the quick sample voice buttons below.'
      );
      return;
    }

    try {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }

      const recognition = new SpeechRec();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = lang === 'ta' ? 'ta-IN' : 'en-IN';

      recognition.onstart = () => {
        setIsListening(true);
        setTranscript('');
        setErrorMsg(null);
      };

      recognition.onresult = (event: any) => {
        let interim = '';
        let final = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            final += event.results[i][0].transcript;
          } else {
            interim += event.results[i][0].transcript;
          }
        }

        const currentText = final || interim;
        setTranscript(currentText);

        if (final) {
          processSpokenTranscript(final);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        setIsListening(false);
        if (event.error === 'not-allowed') {
          setErrorMsg(
            lang === 'ta'
              ? 'மைக்ரோஃபோன் அனுமதி மறுக்கப்பட்டுள்ளது. உலாவியில் மைக் அனுமதியை இயக்கி மீண்டும் முயற்சிக்கவும்.'
              : 'Microphone access was denied. Please allow microphone permissions in browser settings.'
          );
        } else if (event.error === 'no-speech') {
          setErrorMsg(
            lang === 'ta'
              ? 'குரல் கேட்கவில்லை. மைக் அருகே மீண்டும் தெளிவாக பேசவும்.'
              : 'No speech detected. Please speak closer to the microphone.'
          );
        } else {
          setErrorMsg(
            lang === 'ta'
              ? 'குரல் பதிவில் பிழை ஏற்பட்டது. மீண்டும் முயற்சிக்கவும்.'
              : `Speech recognition error: ${event.error}`
          );
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      setIsListening(false);
      setErrorMsg(err?.message || 'Could not start microphone');
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // Ignore stop errors
      }
      setIsListening(false);
    }
  };

  const processSpokenTranscript = (spokenText: string) => {
    const result = parseSpokenStockEntry(spokenText, selectedCommodity);
    setParsedData(result);

    if (result.detectedCommodity) {
      setSelectedCommodity(result.detectedCommodity);
      onSelectCommodity?.(result.detectedCommodity);
    }

    if (result.receivedKg !== undefined) setReceivedKg(result.receivedKg);
    if (result.wasteKg !== undefined) setWasteKg(result.wasteKg);
    if (result.soldKg !== undefined) setSoldKg(result.soldKg);
    if (result.unsoldKg !== undefined) setUnsoldKg(result.unsoldKg);

    SoundEffects.playSuccess();

    // Voice Readback Confirmation for low-literacy clarity
    const readback = lang === 'ta' ? result.summaryTa : result.summaryEn;
    speakText(readback, lang);
  };

  // Quick simulate demo phrase for quick testing & zero-microphone environments
  const handleSimulateVoice = (phrase: string) => {
    setTranscript(phrase);
    processSpokenTranscript(phrase);
  };

  const handleConfirmAndSave = () => {
    SoundEffects.playSuccess();
    confetti({ particleCount: 50, spread: 70, origin: { y: 0.6 } });

    const today = new Date().toISOString().split('T')[0];
    onSaveLog({
      date: today,
      commodity: selectedCommodity,
      receivedKg,
      soldKg,
      unsoldKg,
      wasteKg,
      vendorNotes: `Voice Logged: "${transcript || 'Spoken entry'}"`
    });

    onClose();
  };

  if (!isOpen) return null;

  const currentMeta = COMMODITIES[selectedCommodity];

  const samplePhrases = lang === 'ta'
    ? [
        { label: '🍅 தக்காளி 50 வரவு 2 கழிவு', text: 'தக்காளி வரவு 50 கிலோ கழிவு 2 கிலோ' },
        { label: '🧅 வெங்காயம் 60 வரவு 3 வேஸ்ட்', text: 'வெங்காயம் வரவு 60 கிலோ 3 கிலோ வேஸ்ட்' },
        { label: '🥔 உருளைக்கிழங்கு 40 வரவு 1 கழிவு', text: 'உருளைக்கிழங்கு வரவு 40 கிலோ விற்பனை 35 கழிவு 1 கிலோ' },
        { label: '🥕 கேரட் 30 வரவு 1 கழிவு', text: 'கேரட் வரவு 30 கிலோ கழிவு 1 கிலோ' }
      ]
    : [
        { label: '🍅 Tomato 50 arrival 2 waste', text: 'Tomato arrival 50 kg waste 2 kg' },
        { label: '🧅 Onion 60 arrival 3 waste', text: 'Onion arrival 60 kg waste 3 kg' },
        { label: '🥔 Potato 40 arrival 1 waste', text: 'Potato arrival 40 kg sold 35 kg waste 1 kg' },
        { label: '🥕 Carrot 30 arrival 1 waste', text: 'Carrot arrival 30 kg waste 1 kg' }
      ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-7 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 my-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 border border-emerald-200 flex items-center justify-center shadow-inner">
              <Mic className="w-5 h-5 text-emerald-700" />
            </div>
            <div>
              <h3 className="font-black text-lg text-slate-900 leading-tight">
                {lang === 'ta' ? 'குரல் மூலம் வரவு / கழிவு பதிவு' : 'Voice Stock & Wastage Logger'}
              </h3>
              <p className="text-[11px] text-slate-500">
                {lang === 'ta' ? 'பேசி உடனே வரவு மற்றும் கழிவை கணக்கிடலாம்' : 'Speak to record daily arrivals and spoilage'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 font-bold flex items-center justify-center transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Primary Audio Microphone Action Box */}
        <div className="py-6 text-center">
          <div className="relative inline-block mb-3">
            {/* Glowing rings when listening */}
            {isListening && (
              <>
                <span className="absolute -inset-3 rounded-full bg-rose-400/30 animate-ping pointer-events-none" />
                <span className="absolute -inset-6 rounded-full bg-rose-400/15 animate-pulse pointer-events-none" />
              </>
            )}

            <button
              id="voice-mic-main-btn"
              onClick={isListening ? stopListening : startListening}
              className={`relative z-10 w-24 h-24 rounded-full flex flex-col items-center justify-center transition-all shadow-xl active:scale-95 ${
                isListening
                  ? 'bg-rose-600 text-white ring-4 ring-rose-200 shadow-rose-200'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white ring-4 ring-emerald-100 shadow-emerald-100'
              }`}
            >
              {isListening ? (
                <>
                  <MicOff className="w-9 h-9 animate-bounce" />
                  <span className="text-[10px] font-black uppercase mt-1 tracking-wider">
                    {lang === 'ta' ? 'நிறுத்து' : 'Stop'}
                  </span>
                </>
              ) : (
                <>
                  <Mic className="w-9 h-9" />
                  <span className="text-[10px] font-black uppercase mt-1 tracking-wider">
                    {lang === 'ta' ? 'பேசுக' : 'Speak'}
                  </span>
                </>
              )}
            </button>
          </div>

          <div className="space-y-1">
            <p className="font-bold text-slate-800 text-sm flex items-center justify-center gap-1.5">
              {isListening ? (
                <>
                  <Radio className="w-4 h-4 text-rose-600 animate-pulse" />
                  <span className="text-rose-600 font-black">
                    {lang === 'ta' ? 'கேட்கிறது... தெளிவாக பேசவும்' : 'Listening... Speak clearly now'}
                  </span>
                </>
              ) : (
                <span>
                  {lang === 'ta' ? 'பொத்தானைத் தொட்டு பேசத் தொடங்கவும்' : 'Tap the microphone to begin speaking'}
                </span>
              )}
            </p>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              {lang === 'ta'
                ? 'உதாரணம்: "தக்காளி வரவு 50 கிலோ கழிவு 2 கிலோ"'
                : 'Example: "Tomato arrival 50 kg waste 2 kg"'}
            </p>
          </div>
        </div>

        {/* Live Transcript Display */}
        {transcript && (
          <div className="mb-4 p-3 bg-slate-50 rounded-2xl border border-slate-200 text-left">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 mb-1">
              <span className="flex items-center gap-1">
                <Volume2 className="w-3.5 h-3.5 text-emerald-600" />
                {lang === 'ta' ? 'நீங்கள் பேசியது (Transcript):' : 'Spoken Voice:'}
              </span>
              {parsedData && (
                <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                  {lang === 'ta' ? 'புரிந்துகொள்ளப்பட்டது' : 'Detected'}
                </span>
              )}
            </div>
            <p className="font-medium text-slate-800 text-sm italic">
              "{transcript}"
            </p>
          </div>
        )}

        {/* Error Notification */}
        {errorMsg && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
            <div className="flex-1 leading-relaxed">{errorMsg}</div>
          </div>
        )}

        {/* Parsed Produce Quantities Card (High Visual Clarity for Low-Literacy) */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 mb-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <span className="text-3xl">{currentMeta.iconEmoji}</span>
              <div>
                <div className="font-black text-slate-900 text-base">
                  {lang === 'ta' ? currentMeta.nameTa : currentMeta.nameEn}
                </div>
                <div className="text-[11px] text-slate-500">
                  {lang === 'ta' ? currentMeta.nameEn : currentMeta.nameTa}
                </div>
              </div>
            </div>

            <span className="text-xs px-2.5 py-1 rounded-full bg-slate-200 text-slate-700 font-bold">
              {lang === 'ta' ? 'அளவுகள் சரிபார்ப்பு' : 'Parsed Values'}
            </span>
          </div>

          {/* Large Quantity Meters */}
          <div className="grid grid-cols-2 gap-3 pt-3">
            {/* Arrival / Received */}
            <div className="bg-white p-3 rounded-xl border border-emerald-200 shadow-xs">
              <div className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider mb-1 flex items-center justify-between">
                <span>{lang === 'ta' ? 'வரவு (Arrival)' : 'Arrival (Inflow)'}</span>
                <span>📥</span>
              </div>
              <div className="flex items-baseline gap-1">
                <input
                  type="number"
                  value={receivedKg}
                  onChange={e => setReceivedKg(Math.max(0, Number(e.target.value)))}
                  className="w-20 font-black text-2xl text-emerald-700 bg-transparent focus:outline-none"
                />
                <span className="text-xs font-bold text-slate-500">kg</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">
                {lang === 'ta' ? 'இன்று வந்த மொத்த சரக்கு' : 'Total procured today'}
              </p>
            </div>

            {/* Waste / Spoilage */}
            <div className="bg-white p-3 rounded-xl border border-rose-200 shadow-xs">
              <div className="text-[11px] font-bold text-rose-800 uppercase tracking-wider mb-1 flex items-center justify-between">
                <span>{lang === 'ta' ? 'கழிவு (Wastage)' : 'Waste / Spoil'}</span>
                <span>🗑️</span>
              </div>
              <div className="flex items-baseline gap-1">
                <input
                  type="number"
                  value={wasteKg}
                  onChange={e => setWasteKg(Math.max(0, Number(e.target.value)))}
                  className="w-20 font-black text-2xl text-rose-700 bg-transparent focus:outline-none"
                />
                <span className="text-xs font-bold text-slate-500">kg</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">
                {lang === 'ta' ? 'சேதம் மற்றும் அழுகல்' : 'Damaged / rotten produce'}
              </p>
            </div>

            {/* Sold */}
            <div className="bg-white p-3 rounded-xl border border-slate-200">
              <div className="text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1 flex items-center justify-between">
                <span>{lang === 'ta' ? 'விற்பனை (Sold)' : 'Sold to Buyers'}</span>
                <span>🛒</span>
              </div>
              <div className="flex items-baseline gap-1">
                <input
                  type="number"
                  value={soldKg}
                  onChange={e => setSoldKg(Math.max(0, Number(e.target.value)))}
                  className="w-20 font-black text-xl text-slate-800 bg-transparent focus:outline-none"
                />
                <span className="text-xs font-bold text-slate-500">kg</span>
              </div>
            </div>

            {/* Unsold / Remaining */}
            <div className="bg-white p-3 rounded-xl border border-amber-200">
              <div className="text-[11px] font-bold text-amber-800 uppercase tracking-wider mb-1 flex items-center justify-between">
                <span>{lang === 'ta' ? 'மீதம் (Unsold)' : 'Unsold Stock'}</span>
                <span>⏳</span>
              </div>
              <div className="flex items-baseline gap-1">
                <input
                  type="number"
                  value={unsoldKg}
                  onChange={e => setUnsoldKg(Math.max(0, Number(e.target.value)))}
                  className="w-20 font-black text-xl text-amber-700 bg-transparent focus:outline-none"
                />
                <span className="text-xs font-bold text-slate-500">kg</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Voice Simulation Chips (Extremely handy for noisy mandis or blocked microphone browsers) */}
        <div className="mb-5">
          <div className="text-[11px] font-bold text-slate-500 mb-1.5 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>{lang === 'ta' ? 'விரைவு மாதிரி குரல் (Quick Tap Samples):' : 'Quick Voice Simulation Prompts:'}</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {samplePhrases.map((sample, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSimulateVoice(sample.text)}
                className="text-xs px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors text-left"
              >
                {sample.label}
              </button>
            ))}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all"
          >
            {lang === 'ta' ? 'ரத்து செய்' : 'Cancel'}
          </button>

          <button
            id="confirm-voice-stock-btn"
            type="button"
            onClick={handleConfirmAndSave}
            className="flex-2 py-3 px-5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-black text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{lang === 'ta' ? 'உறுதி செய்து பதிவு செய்க' : 'Confirm & Save Daily Log'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
