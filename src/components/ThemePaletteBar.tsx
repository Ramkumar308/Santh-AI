import React from 'react';
import { BgTheme, Language } from '../types';
import { Palette, Sparkles, Check } from 'lucide-react';
import { SoundEffects } from '../utils/audioHaptics';

interface ThemePaletteBarProps {
  currentTheme: BgTheme;
  onChangeTheme: (theme: BgTheme) => void;
  lang: Language;
}

export const ThemePaletteBar: React.FC<ThemePaletteBarProps> = ({
  currentTheme,
  onChangeTheme,
  lang
}) => {
  const themes: {
    id: BgTheme;
    emoji: string;
    nameEn: string;
    nameTa: string;
    gradient: string;
    accentBorder: string;
    tagEn: string;
    tagTa: string;
  }[] = [
    {
      id: 'emerald',
      emoji: '🌱',
      nameEn: 'Fresh Emerald',
      nameTa: 'வளமான பச்சை',
      gradient: 'from-emerald-500 via-teal-500 to-lime-500',
      accentBorder: 'border-emerald-400 text-emerald-950 bg-emerald-50/90 ring-2 ring-emerald-500/30',
      tagEn: 'Agri Green',
      tagTa: 'இயற்கை'
    },
    {
      id: 'golden',
      emoji: '🌅',
      nameEn: 'Golden Harvest',
      nameTa: 'தங்க அறுவடை',
      gradient: 'from-amber-500 via-orange-500 to-yellow-400',
      accentBorder: 'border-amber-400 text-amber-950 bg-amber-50/90 ring-2 ring-amber-500/30',
      tagEn: 'Warm Sun',
      tagTa: 'பொன் கதிர்'
    },
    {
      id: 'ocean',
      emoji: '🌊',
      nameEn: 'Nilgiri Ocean',
      nameTa: 'நீலகிரி தென்றல்',
      gradient: 'from-sky-500 via-cyan-500 to-teal-400',
      accentBorder: 'border-sky-400 text-sky-950 bg-sky-50/90 ring-2 ring-sky-500/30',
      tagEn: 'Breeze Mist',
      tagTa: 'தென்றல்'
    },
    {
      id: 'sunset',
      emoji: '🌺',
      nameEn: 'Sunset Coral',
      nameTa: 'மாலை செவ்வானம்',
      gradient: 'from-rose-500 via-pink-500 to-amber-500',
      accentBorder: 'border-rose-400 text-rose-950 bg-rose-50/90 ring-2 ring-rose-500/30',
      tagEn: 'Coral Dusk',
      tagTa: 'செவ்வானம்'
    },
    {
      id: 'amethyst',
      emoji: '🔮',
      nameEn: 'Royal Amethyst',
      nameTa: 'ராஜ ஊதா',
      gradient: 'from-purple-600 via-violet-500 to-fuchsia-500',
      accentBorder: 'border-purple-400 text-purple-950 bg-purple-50/90 ring-2 ring-purple-500/30',
      tagEn: 'Velvet Violet',
      tagTa: 'ராஜ ஊதா'
    },
    {
      id: 'midnight',
      emoji: '🌙',
      nameEn: 'Midnight Bazaar',
      nameTa: 'இரவுச் சந்தை',
      gradient: 'from-slate-900 via-indigo-950 to-slate-900',
      accentBorder: 'border-slate-700 text-slate-100 bg-slate-900 ring-2 ring-emerald-400/40',
      tagEn: 'Neon Night',
      tagTa: 'இரவு சந்தை'
    }
  ];

  return (
    <div className="bg-white/85 backdrop-blur-md border-b border-slate-200/80 px-3 sm:px-6 py-2.5 transition-all">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-emerald-500 to-amber-500 flex items-center justify-center text-white shadow-2xs">
            <Palette className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1 font-heading">
            <span>{lang === 'ta' ? 'கவர்ச்சியான வண்ணப் பின்னணி' : 'Attractive Background Themes'}</span>
            <Sparkles className="w-3 h-3 text-amber-500 animate-pulse" />
          </span>
        </div>

        {/* Horizontal Theme Swatches Strip */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {themes.map(t => {
            const isSelected = currentTheme === t.id;
            return (
              <button
                key={t.id}
                onClick={() => {
                  SoundEffects.playClick();
                  onChangeTheme(t.id);
                }}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 border ${
                  isSelected
                    ? `${t.accentBorder} shadow-xs font-extrabold scale-[1.02]`
                    : 'border-slate-200/90 bg-white/90 hover:bg-slate-50 text-slate-700 hover:border-slate-300'
                }`}
                title={`${t.nameEn} - ${t.tagEn}`}
              >
                {/* Visual Color Orb */}
                <div
                  className={`w-3.5 h-3.5 rounded-full bg-gradient-to-tr ${t.gradient} shadow-2xs flex items-center justify-center shrink-0 ring-1 ring-black/10`}
                >
                  {isSelected && <Check className="w-2.5 h-2.5 text-white stroke-[3]" />}
                </div>

                <span>{t.emoji}</span>
                <span className="whitespace-nowrap">
                  {lang === 'ta' ? t.nameTa : t.nameEn}
                </span>

                <span
                  className={`text-[9px] px-1.5 py-0.2 rounded-md uppercase tracking-wider font-mono hidden md:inline-block ${
                    isSelected
                      ? 'bg-black/10 text-slate-900 font-bold'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {lang === 'ta' ? t.tagTa : t.tagEn}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
