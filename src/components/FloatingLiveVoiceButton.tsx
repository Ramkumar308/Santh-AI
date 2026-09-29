import React, { useState } from 'react';
import { Radio, Mic, X, Sparkles, Volume2 } from 'lucide-react';
import { Language } from '../types';
import { LiveVoiceAssistant } from './LiveVoiceAssistant';
import { SoundEffects } from '../utils/audioHaptics';

interface FloatingLiveVoiceButtonProps {
  lang: Language;
}

export const FloatingLiveVoiceButton: React.FC<FloatingLiveVoiceButtonProps> = ({ lang }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Floating Action Button */}
      <aside aria-label="Live Voice Assistant" className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-40">
        <button
          onClick={() => {
            SoundEffects.playClick();
            setIsOpen((prev) => !prev);
          }}
          className="group relative flex items-center gap-2.5 px-4 py-3 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-600 text-white rounded-full shadow-[0_8px_25px_-4px_rgba(16,185,129,0.5),0_0_0_1px_rgba(255,255,255,0.2)] hover:shadow-[0_12px_32px_-4px_rgba(16,185,129,0.7)] transition-all duration-300 hover:scale-105 cursor-pointer"
          title={lang === 'ta' ? 'Gemini 3.8 லைவ் குரல் உரையாடல்' : 'Gemini 3.8 Live Voice Conversation'}
        >
          {/* Subtle breathing aura */}
          <span className="absolute -inset-1 rounded-full bg-emerald-400/40 blur-xs animate-pulse pointer-events-none" />

          <div className="relative w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">
            <Radio className="w-4 h-4 text-emerald-100 animate-pulse" />
          </div>

          <div className="relative text-left">
            <div className="text-[11px] font-black uppercase tracking-wider text-emerald-100 flex items-center gap-1">
              <span>{lang === 'ta' ? 'நேரலை குரல்' : 'Live Voice'}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-ping" />
            </div>
            <div className="text-[10px] text-white/80 font-mono font-bold leading-none">
              gemini-3.8-live
            </div>
          </div>
        </button>
      </aside>

      {/* Floating Live Voice Drawer Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Top Close Bar */}
            <div className="flex items-center justify-between px-5 py-3.5 bg-slate-900 text-white border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
                  <Radio className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                    {lang === 'ta' ? 'Gemini 3.8 நேரலை குரல் உரையாடல்' : 'Gemini 3.8 Live Voice Assistant'}
                    <span className="text-[9px] uppercase font-mono px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      Live API
                    </span>
                  </h3>
                </div>
              </div>

              <button
                onClick={() => {
                  SoundEffects.playClick();
                  setIsOpen(false);
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-5 max-h-[82vh] overflow-y-auto">
              <LiveVoiceAssistant lang={lang} />
            </div>
          </div>
        </div>
      )}
    </>
  );
};
