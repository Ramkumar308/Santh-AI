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
  X,
  Store,
  Building2
} from 'lucide-react';
import { Language, ViewMode, VendorProfile, BgTheme, ResQUserRole, BuyerProfile } from '../types';
import { DEFAULT_BUYER_PROFILES } from '../services/resqSync';
import { SoundEffects } from '../utils/audioHaptics';
import { ThemePaletteBar } from './ThemePaletteBar';

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
  resqUserRole?: ResQUserRole;
  onChangeResqUserRole?: (role: ResQUserRole) => void;
  activeBuyer?: BuyerProfile;
  onChangeActiveBuyer?: (buyer: BuyerProfile) => void;
  isGoogleConnected?: boolean;
  cloudSyncStatus?: 'idle' | 'syncing' | 'synced' | 'error';
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
  isMobileMenuOpen,
  resqUserRole = 'vendor',
  onChangeResqUserRole,
  activeBuyer = DEFAULT_BUYER_PROFILES[0],
  onChangeActiveBuyer,
  isGoogleConnected = false,
  cloudSyncStatus = 'idle'
}) => {
  const [isThemeOpen, setIsThemeOpen] = useState(false);

  // Time-aware greeting
  const hour = new Date().getHours();
  const greetingEn = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const greetingTa = hour < 12 ? 'காலை வணக்கம்' : hour < 17 ? 'மதிய வணக்கம்' : 'மாலை வணக்கம்';

  const vendorDisplayName = vendorProfile.name ? vendorProfile.name.split(' ')[0] : 'Selvi';

  return (
    <header className="bg-white/50 backdrop-blur-xl border-b border-black/[0.05] px-4 sm:px-8 py-3.5 sm:py-4 transition-all sticky top-0 z-30 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
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
          {/* Switchable Role Toggle: [ 🏪 Vendor | 🏢 Buyer/Mess ] */}
          {onChangeResqUserRole && (
            <div className="bg-white/95 border border-slate-200/90 rounded-2xl p-1 flex items-center shadow-2xs">
              <button
                onClick={() => {
                  SoundEffects.playClick();
                  onChangeResqUserRole('vendor');
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  resqUserRole === 'vendor'
                    ? 'bg-emerald-700 text-white shadow-2xs font-black'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
                title={lang === 'ta' ? 'கடை விற்பனையாளர் பார்வை' : 'Vendor Stall View'}
              >
                <Store className="w-3.5 h-3.5" />
                <span>{lang === 'ta' ? 'விற்பனையாளர்' : 'Vendor'}</span>
              </button>

              <button
                onClick={() => {
                  SoundEffects.playClick();
                  onChangeResqUserRole('buyer');
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  resqUserRole === 'buyer'
                    ? 'bg-indigo-700 text-white shadow-2xs font-black'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
                title={lang === 'ta' ? 'வாங்குபவர் / விடுதி மெஸ் பார்வை' : 'Buyer / Hostel Mess View'}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>{lang === 'ta' ? 'வாங்குபவர் (Mess)' : 'Buyer / Mess'}</span>
              </button>

              {/* If in Buyer Mode, show buyer persona selector dropdown */}
              {resqUserRole === 'buyer' && onChangeActiveBuyer && (
                <select
                  value={activeBuyer.id}
                  onChange={(e) => {
                    const found = DEFAULT_BUYER_PROFILES.find(b => b.id === e.target.value);
                    if (found) {
                      onChangeActiveBuyer(found);
                      SoundEffects.playClick();
                    }
                  }}
                  className="ml-1 text-[11px] font-bold bg-indigo-50 text-indigo-900 border border-indigo-200 rounded-lg px-2 py-1 focus:outline-none cursor-pointer"
                  title="Select Buyer Persona"
                >
                  {DEFAULT_BUYER_PROFILES.map(b => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.type})
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

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
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-white/95 border border-slate-200/90 hover:bg-slate-50 text-slate-800 text-xs font-bold shadow-2xs transition-colors cursor-pointer"
            title={isGoogleConnected ? 'Google Account & Cloud Sync Settings' : 'Sign in with Google'}
          >
            {isGoogleConnected ? (
              <>
                {vendorProfile.photoURL || vendorProfile.photoUrl ? (
                  <img
                    src={vendorProfile.photoURL || vendorProfile.photoUrl}
                    alt="avatar"
                    className="w-5 h-5 rounded-full object-cover border border-emerald-300 shadow-2xs"
                  />
                ) : (
                  <UserCheck className="w-4 h-4 text-emerald-600" />
                )}
                <span className="max-w-[100px] truncate">{vendorProfile.name || 'Account'}</span>
                {cloudSyncStatus === 'syncing' ? (
                  <span className="flex items-center gap-1 text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-full border border-amber-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                    <span>Syncing</span>
                  </span>
                ) : cloudSyncStatus === 'synced' ? (
                  <span className="flex items-center gap-1 text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-full border border-emerald-200" title="Firestore Connected">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span>Cloud</span>
                  </span>
                ) : null}
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>Google sign-in</span>
              </>
            )}
          </button>

          {/* Theme Palette Switcher */}
          <button
            onClick={() => {
              SoundEffects.playClick();
              setIsThemeOpen(prev => !prev);
            }}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-2xl border transition-all shadow-2xs btn-press ${
              isThemeOpen
                ? 'bg-slate-900 text-white border-slate-900 ring-2 ring-emerald-500/30'
                : 'bg-white/95 border-slate-200/90 text-slate-700 hover:bg-slate-50'
            }`}
            title={lang === 'ta' ? 'வண்ண தீம்கள்' : 'Theme Palettes'}
          >
            <Palette className="w-3.5 h-3.5 text-emerald-600" />
            <span className="text-xs font-bold hidden sm:inline">
              {lang === 'ta' ? 'தீம்கள்' : 'Themes'}
            </span>
          </button>

          {/* Outdoor Sunlight Mode Toggle */}
          <button
            onClick={() => {
              SoundEffects.playClick();
              onToggleOutdoorMode();
            }}
            className={`p-2 rounded-2xl border transition-all btn-press ${
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
            className="p-2 rounded-2xl bg-white/95 border border-slate-200/90 text-slate-600 hover:bg-slate-50 transition-colors btn-press"
            title={lang === 'ta' ? 'தரவு பெட்டகம்' : 'Data Vault'}
          >
            <HardDrive className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Expandable Theme Palette Bar */}
      {isThemeOpen && (
        <div className="mt-3.5 pt-3.5 border-t border-slate-200/70 animate-in fade-in slide-in-from-top-2 duration-200">
          <ThemePaletteBar
            currentTheme={bgTheme}
            onChangeTheme={onChangeBgTheme}
            lang={lang}
          />
        </div>
      )}
    </header>
  );
};
