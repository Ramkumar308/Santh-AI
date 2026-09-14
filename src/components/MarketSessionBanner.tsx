import React from 'react';
import { Language } from '../types';
import { SoundEffects } from '../utils/audioHaptics';
import { Sunrise, Sun, Sunset, Clock, Sparkles } from 'lucide-react';

export type MarketSession = 'morning' | 'day' | 'evening';

interface MarketSessionBannerProps {
  currentSession: MarketSession;
  onSelectSession: (session: MarketSession) => void;
  lang: Language;
}

export const MarketSessionBanner: React.FC<MarketSessionBannerProps> = ({
  currentSession,
  onSelectSession,
  lang
}) => {
  const sessions = [
    {
      id: 'morning' as MarketSession,
      labelEn: '04:00 - 08:30 • Mandi Inflow',
      labelTa: '04:00 - 08:30 • லாரி வருகை & இருப்பு',
      titleEn: 'Wholesale Inflow',
      titleTa: 'மொத்த விலை & இருப்பு',
      icon: Sunrise,
      badge: 'Arrivals',
      color: 'from-amber-500/10 to-orange-500/10 border-amber-300 text-amber-900',
      activeColor: 'bg-amber-600 text-white shadow-sm'
    },
    {
      id: 'day' as MarketSession,
      labelEn: '08:30 - 17:30 • Retail Bazaar',
      labelTa: '08:30 - 17:30 • சில்லறை வணிகம்',
      titleEn: 'Active Trading',
      titleTa: 'விற்பனை & கடன் கணக்கு',
      icon: Sun,
      badge: 'Peak Sales',
      color: 'from-emerald-500/10 to-teal-500/10 border-emerald-300 text-emerald-900',
      activeColor: 'bg-emerald-700 text-white shadow-sm'
    },
    {
      id: 'evening' as MarketSession,
      labelEn: '17:30 - 20:30 • Evening ResQ',
      labelTa: '17:30 - 20:30 • மாலை மீட்பு & தள்ளுபடி',
      titleEn: 'Zero-Waste ResQ',
      titleTa: 'மீதி விற்பனை & வாட்ஸ்அப்',
      icon: Sunset,
      badge: 'Flash Sale',
      color: 'from-rose-500/10 to-amber-500/10 border-rose-300 text-rose-900',
      activeColor: 'bg-rose-600 text-white shadow-sm'
    }
  ];

  return (
    <div className="bg-slate-100/80 border-b border-slate-200/90 py-1.5 px-3 sm:px-6">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-2">
        {/* Current phase descriptor */}
        <div className="flex items-center gap-2 text-xs text-slate-600">
          <Clock className="w-3.5 h-3.5 text-slate-500" />
          <span className="font-semibold text-slate-800">
            {lang === 'ta' ? 'சந்தை வர்த்தக நேரம்:' : 'Market Trading Phase:'}
          </span>
          <span className="hidden sm:inline text-slate-500 text-[11px]">
            {lang === 'ta'
              ? '(நேரத்தை மாற்றி AI செயல்பாடுகளை சோதிக்கவும்)'
              : '(Switch session to test contextual AI actions)'}
          </span>
        </div>

        {/* 3-Session Segmented Controller */}
        <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto pb-0.5 sm:pb-0">
          {sessions.map((s) => {
            const Icon = s.icon;
            const isActive = currentSession === s.id;

            return (
              <button
                key={s.id}
                onClick={() => {
                  SoundEffects.playClick();
                  onSelectSession(s.id);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer ${
                  isActive
                    ? `${s.activeColor} font-bold ring-1 ring-black/10`
                    : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-2xs'
                }`}
                title={lang === 'ta' ? s.labelTa : s.labelEn}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                <span className="truncate">{lang === 'ta' ? s.titleTa : s.titleEn}</span>
                {isActive && (
                  <span className="text-[9px] uppercase px-1.5 py-0.2 rounded-full bg-white/20 text-white font-mono font-bold ml-0.5">
                    {s.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
