import React, { useState } from 'react';
import {
  Sparkles,
  Search,
  Image as ImageIcon,
  Film,
  Radio,
  Bot,
  Zap,
  Globe,
  Camera,
  Play
} from 'lucide-react';
import { Language } from '../types';
import { MandiSearchGrounding } from './MandiSearchGrounding';
import { AiProduceStudio } from './AiProduceStudio';
import { VeoVideoAnimator } from './VeoVideoAnimator';
import { LiveVoiceAssistant } from './LiveVoiceAssistant';
import { SoundEffects } from '../utils/audioHaptics';

interface AiMarketStudioProps {
  lang: Language;
  initialSubTab?: 'search' | 'image' | 'video' | 'voice';
}

export const AiMarketStudio: React.FC<AiMarketStudioProps> = ({
  lang,
  initialSubTab = 'video'
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'search' | 'image' | 'video' | 'voice'>(initialSubTab);

  const subTabs = [
    {
      id: 'video' as const,
      labelEn: 'Veo Video Animation',
      labelTa: 'Veo வீடியோ அனிமேஷன்',
      modelTag: 'veo-3.1-fast-generate-preview',
      icon: Film,
      color: 'from-purple-600 to-indigo-600',
      badgeColor: 'bg-purple-100 text-purple-800'
    },
    {
      id: 'image' as const,
      labelEn: 'Create & Edit Images',
      labelTa: 'படங்கள் உருவாக்கம் & திருத்தம்',
      modelTag: 'gemini-3.1-flash-image-preview',
      icon: ImageIcon,
      color: 'from-emerald-600 to-teal-600',
      badgeColor: 'bg-emerald-100 text-emerald-800'
    },
    {
      id: 'voice' as const,
      labelEn: 'Live Voice Conversation',
      labelTa: 'நேரலை குரல் உரையாடல்',
      modelTag: 'gemini-3.8-live',
      icon: Radio,
      color: 'from-rose-600 to-amber-600',
      badgeColor: 'bg-rose-100 text-rose-800'
    },
    {
      id: 'search' as const,
      labelEn: 'Live Google Search Intel',
      labelTa: 'கூகுள் தேடல் சந்தை ஆய்வு',
      modelTag: 'gemini-3.5-flash + search',
      icon: Search,
      color: 'from-blue-600 to-cyan-600',
      badgeColor: 'bg-blue-100 text-blue-800'
    }
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Hero Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-700/60">
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-purple-300 text-xs font-bold tracking-wide">
              <Sparkles className="w-3.5 h-3.5 text-purple-300 animate-spin-slow" />
              <span>{lang === 'ta' ? 'அறிவார்ந்த AI மல்டிமீடியா & சந்தை கருவிகள்' : 'Next-Gen Gemini & Veo Market Intelligence'}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white font-display tracking-tight">
              {lang === 'ta' ? 'SanthAI அதிநவீன AI ஸ்டுடியோ' : 'SanthAI Advanced AI & Media Studio'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-medium">
              {lang === 'ta'
                ? 'கூகுள் தேடல் நேரலை தகவல், வீயோ புகைப்பட அனிமேஷன், பட உருவாக்கம் மற்றும் ஜெமினி 3.8 லைவ் குரல் வழி உரையாடல்கள்.'
                : 'Ground your mandi operations with Google Search real-time data, animate stall photos with Veo, create marketing flyers, and converse via Gemini 3.8 Live API.'}
            </p>
          </div>

          {/* Quick Stats or Pill */}
          <div className="grid grid-cols-2 gap-2 text-center shrink-0">
            <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-3">
              <div className="text-lg font-black text-emerald-300 font-mono">Veo 3.1</div>
              <div className="text-[10px] text-slate-300 font-bold uppercase">{lang === 'ta' ? 'வீடியோ அனிமேஷன்' : 'Video Motion'}</div>
            </div>
            <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-3">
              <div className="text-lg font-black text-purple-300 font-mono">Live 3.8</div>
              <div className="text-[10px] text-slate-300 font-bold uppercase">{lang === 'ta' ? 'நேரலை குரல்' : 'Real-time Voice'}</div>
            </div>
          </div>
        </div>

        {/* Sub-Tabs Navigation */}
        <div className="relative z-10 grid grid-cols-2 md:grid-cols-4 gap-2 mt-6 pt-5 border-t border-white/10">
          {subTabs.map((tab) => {
            const Icon = tab.icon;
            const isSelected = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  SoundEffects.playClick();
                  setActiveSubTab(tab.id);
                }}
                className={`flex items-center gap-3 p-3 rounded-2xl border transition-all text-left cursor-pointer ${
                  isSelected
                    ? 'bg-white text-slate-900 border-white shadow-lg shadow-black/20 font-bold scale-[1.02]'
                    : 'bg-white/5 hover:bg-white/10 text-white/80 border-white/10 hover:border-white/20'
                }`}
              >
                <div className={`p-2 rounded-xl ${isSelected ? `bg-gradient-to-br ${tab.color} text-white` : 'bg-white/10 text-white'}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold truncate">
                    {lang === 'ta' ? tab.labelTa : tab.labelEn}
                  </div>
                  <div className={`text-[10px] font-mono truncate ${isSelected ? 'text-slate-500' : 'text-slate-400'}`}>
                    {tab.modelTag}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Feature Container */}
      <div className="transition-all duration-300">
        {activeSubTab === 'video' && <VeoVideoAnimator lang={lang} />}
        {activeSubTab === 'image' && <AiProduceStudio lang={lang} />}
        {activeSubTab === 'voice' && <LiveVoiceAssistant lang={lang} />}
        {activeSubTab === 'search' && <MandiSearchGrounding lang={lang} />}
      </div>
    </div>
  );
};
