import React, { useState } from 'react';
import {
  Languages,
  UserCheck,
  LogIn,
  Sun,
  HardDrive,
  Sparkles,
  RefreshCw,
  Palette,
  Volume2,
  VolumeX,
  Menu,
  X
} from 'lucide-react';
import { Language, ViewMode, VendorProfile, BgTheme } from '../types';
import { SoundEffects } from '../utils/audioHaptics';

interface TopHeaderProps {
  lang: Language;
  setLang: (lang: Language) => void;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  vendorProfile: VendorProfile;
  onOpenAuth: () => void;
  isOutdoorMode: boolean;
  onToggleOutdoorMode: () => void;
  onOpenDataVault: () => void;
  onRefreshPrices: () => void;
  isRefreshing: boolean;
  bgTheme: BgTheme;
  onChangeBgTheme: (theme: BgTheme) => void;
  onToggleMobileMenu?: () => void;
  isMobileMenuOpen?: boolean;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  lang,
  setLang,
  viewMode,
  setViewMode,
  vendorProfile,
  onOpenAuth,
  isOutdoorMode,
  onToggleOutdoorMode,
  onOpenDataVault,
  onRefreshPrices,
  isRefreshing,
  bgTheme,
  onChangeBgTheme,
  onToggleMobileMenu,
  isMobileMenuOpen
}) => {
  const [isThemeOpen, setIsThemeOpen] = useState(false);

  // Time-aware greeting
  const hour = new Date().getHours();
  const greetingEn = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const greetingTa = hour < 12 ? 'காலை வணக்கம்' : hour < 17 ? 'மதிய வணக்கம்' : 'மாலை வணக்கம்';

  const vendorDisplayName = vendorProfile.name ? vendorProfile.name.split(' ')[0] : 'Selvi';

  return (
    <header className="bg-transparent border-b border-[#e3ece2]/70 px-4 sm:px-8 py-3.5 sm:py-4 transition-all">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Left: Greeting & Market Status (matches screenshot) */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Mobile Hamburger toggle */}
            {onToggleMobileMenu && (
              <button
                onClick={onToggleMobileMenu}
                className="md:hidden p-2 rounded-xl bg-white border border-slate-200 text-slate-700"
                aria-label="Toggle menu"
              >
                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            )}

            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 font-display tracking-tight">
                {lang === 'ta'
                  ? `${greetingTa}, ${vendorDisplayName}`
                  : `${greetingEn}, ${vendorDisplayName}`}
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 font-medium">
                {lang === 'ta'
                  ? 'உங்கள் சந்தை இன்று நல்ல நிலையில் செயல்படுகிறது.'
                  : 'Your market is looking healthy today.'}
              </p>
            </div>
          </div>
        </div>

        {/* Right: Controls Strip matching reference screenshot */}
        <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
          {/* Segmented Pill: [Simple | Technical] */}
          <div className="bg-white/95 border border-slate-200/90 rounded-2xl p-1 flex items-center shadow-2xs">
            <button
              onClick={() => {
                SoundEffects.playClick();
                setViewMode('simple');
              }}
              className={`px-3 sm:px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                viewMode === 'simple'
                  ? 'bg-[#183a27] text-white shadow-2xs font-black'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              {lang === 'ta' ? 'எளிய பார்வை' : 'Simple'}
            </button>
            <button
              onClick={() => {
                SoundEffects.playClick();
                setViewMode('technical');
              }}
              className={`px-3 sm:px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                viewMode === 'technical'
                  ? 'bg-[#183a27] text-white shadow-2xs font-black'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              {lang === 'ta' ? 'புள்ளிவிவரம்' : 'Technical'}
            </button>
          </div>

          {/* Language Switcher Pill: [文A தமிழ்] */}
          <button
            onClick={() => {
              SoundEffects.playClick();
              setLang(lang === 'ta' ? 'en' : 'ta');
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-white/95 border border-slate-200/90 hover:bg-slate-50 text-slate-700 text-xs font-bold shadow-2xs transition-colors"
            title="Toggle English / Tamil"
          >
            <span className="font-mono text-sm font-black text-emerald-700">文A</span>
            <span>{lang === 'ta' ? 'English' : 'தமிழ்'}</span>
          </button>

          {/* Google Sign-in / Profile Pill button */}
          <button
            onClick={() => {
              SoundEffects.playClick();
              onOpenAuth();
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-white/95 border border-slate-200/90 hover:bg-slate-50 text-slate-800 text-xs font-bold shadow-2xs transition-colors"
          >
            {vendorProfile.isSimulatedAuth ? (
              <>
                <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span className="max-w-[110px] truncate">{vendorProfile.name || 'Account'}</span>
              </>
            ) : (
              <>
                <LogIn className="w-3.5 h-3.5 text-slate-500" />
                <span>Google sign-in</span>
              </>
            )}
          </button>

          {/* Outdoor Sunlight Mode Toggle */}
          <button
            onClick={() => {
              SoundEffects.playClick();
              onToggleOutdoorMode();
            }}
            className={`p-2 rounded-2xl border transition-all ${
              isOutdoorMode
                ? 'bg-amber-400 border-amber-500 text-amber-950 shadow-xs'
                : 'bg-white/95 border-slate-200/90 text-slate-600 hover:bg-slate-50'
            }`}
            title={lang === 'ta' ? 'வெயில் பார்வை முறை' : 'Outdoor high contrast mode'}
          >
            <Sun className="w-4 h-4" />
          </button>

          {/* Local Data Vault Backup */}
          <button
            onClick={() => {
              SoundEffects.playClick();
              onOpenDataVault();
            }}
            className="p-2 rounded-2xl bg-white/95 border border-slate-200/90 text-slate-600 hover:bg-slate-50 transition-colors"
            title={lang === 'ta' ? 'தரவு பெட்டகம்' : 'Data Vault'}
          >
            <HardDrive className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
