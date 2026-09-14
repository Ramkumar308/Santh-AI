import React, { useState } from 'react';
import {
  Store,
  TrendingUp,
  Coins,
  ShieldCheck,
  RefreshCw,
  Volume2,
  VolumeX,
  Languages,
  Code2,
  Sparkles,
  UserCheck,
  Building2,
  Activity,
  CheckCircle2,
  Sun,
  HardDrive,
  WifiOff,
  DownloadCloud,
  Palette
} from 'lucide-react';
import { Language, ViewMode, PriceStatus, VendorProfile, BgTheme } from '../types';
import { t, speakText, stopSpeaking } from '../utils/i18n';
import { SoundEffects } from '../utils/audioHaptics';

interface NavbarProps {
  activeTab: 'stock' | 'prices' | 'resq' | 'khata';
  setActiveTab: (tab: 'stock' | 'prices' | 'resq' | 'khata') => void;
  lang: Language;
  setLang: (lang: Language) => void;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  priceStatus: PriceStatus;
  onRefreshPrices: () => void;
  isRefreshing: boolean;
  vendorProfile: VendorProfile;
  onOpenAuth: () => void;
  surplusAlertCount: number;
  isOutdoorMode: boolean;
  onToggleOutdoorMode: () => void;
  onOpenDataVault: () => void;
  isOnline: boolean;
  canInstallPWA?: boolean;
  onInstallPWA?: () => void;
  bgTheme: BgTheme;
  onChangeBgTheme: (theme: BgTheme) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  lang,
  setLang,
  viewMode,
  setViewMode,
  priceStatus,
  onRefreshPrices,
  isRefreshing,
  vendorProfile,
  onOpenAuth,
  surplusAlertCount,
  isOutdoorMode,
  onToggleOutdoorMode,
  onOpenDataVault,
  isOnline,
  canInstallPWA,
  onInstallPWA,
  bgTheme,
  onChangeBgTheme
}) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);

  const bgThemesList: { id: BgTheme; emoji: string; nameEn: string; nameTa: string; dot: string; bgTone: string }[] = [
    { id: 'emerald', emoji: '🌱', nameEn: 'Fresh Emerald', nameTa: 'வளமான பச்சை', dot: 'bg-emerald-500', bgTone: 'border-emerald-300 bg-emerald-50 text-emerald-800' },
    { id: 'golden', emoji: '🌅', nameEn: 'Golden Harvest', nameTa: 'தங்க அறுவடை', dot: 'bg-amber-500', bgTone: 'border-amber-300 bg-amber-50 text-amber-900' },
    { id: 'ocean', emoji: '🌊', nameEn: 'Nilgiri Ocean', nameTa: 'நீலகிரி தென்றல்', dot: 'bg-sky-500', bgTone: 'border-sky-300 bg-sky-50 text-sky-900' },
    { id: 'midnight', emoji: '🌙', nameEn: 'Midnight Bazaar', nameTa: 'இரவுச் சந்தை', dot: 'bg-slate-900', bgTone: 'border-slate-700 bg-slate-900 text-slate-100' },
  ];

  const currentThemeMeta = bgThemesList.find(t => t.id === bgTheme) || bgThemesList[0];

  const handleToggleAudio = () => {
    SoundEffects.playClick();
    if (isSpeaking) {
      stopSpeaking();
      setIsSpeaking(false);
    } else {
      setIsSpeaking(true);
      const readoutEn = `SanthAI Produce Intelligence. Active stall: ${vendorProfile.name}, ${vendorProfile.stallNumber}. Prices are ${priceStatus.isLive ? 'Live Agmarknet feed' : 'Cached, updated ' + priceStatus.lastUpdated}. You have ${surplusAlertCount} surplus produce items.`;
      const readoutTa = `சந்தை AI வணிக நுண்ணறிவு தளம். கடை: ${vendorProfile.name}, ${vendorProfile.stallNumber}. விலை நிலவரம்: ${priceStatus.isLive ? 'நேரலை அக்மார்க்நெட்' : 'சேமிக்கப்பட்ட தரவு'}. ${surplusAlertCount > 0 ? surplusAlertCount + ' காய்கறிகளில் மீதி எச்சரிக்கை உள்ளது.' : 'சரக்கு சீராக உள்ளது.'}`;
      speakText(lang === 'ta' ? readoutTa : readoutEn, lang);
      setTimeout(() => setIsSpeaking(false), 8000);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      {/* Top Professional Utility & Telemetry Bar */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 flex items-center justify-between gap-3 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-800 flex items-center justify-center text-white shadow-xs font-bold text-xl border border-emerald-500/30">
            🌱
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-heading font-extrabold text-slate-900 tracking-tight text-xl sm:text-2xl">
                Santh<span className="text-emerald-600">AI</span>
              </span>
              <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200/80">
                TN AGRI-TECH
              </span>
              <span className="hidden lg:inline text-[11px] text-slate-400 font-medium">
                | Tamil Nadu Produce Vendor Intelligence
              </span>
            </div>
            <p className="text-[11px] text-slate-500 hidden sm:block font-normal">
              {t(lang, 'appSubtitle')}
            </p>
          </div>
        </div>

        {/* Live System Status & Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Live / Cached Feed Status Pill */}
          <div
            id="mandi-price-status-badge"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
              priceStatus.isLive
                ? 'bg-emerald-50/80 text-emerald-800 border-emerald-200/90'
                : 'bg-amber-50/80 text-amber-800 border-amber-200/90'
            }`}
            title={priceStatus.source}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                priceStatus.isLive ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
              }`}
            />
            <span className="font-bold tracking-wide">
              {priceStatus.isLive ? 'LIVE MANDI' : 'CACHED'}
            </span>
            <span className="text-[10px] text-slate-500 hidden md:inline font-mono">
              • {priceStatus.lastUpdated}
            </span>
            {priceStatus.apiLatencyMs && (
              <span className="text-[10px] font-mono font-semibold text-emerald-700 hidden lg:inline">
                ({priceStatus.apiLatencyMs}ms)
              </span>
            )}
            <button
              id="refresh-prices-btn"
              onClick={onRefreshPrices}
              disabled={isRefreshing}
              className="ml-1 p-0.5 text-slate-500 hover:text-emerald-700 focus:outline-hidden disabled:opacity-50 transition-colors"
              title="Refresh Mandi Rates"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-emerald-600' : ''}`} />
            </button>
          </div>

          {/* View Mode Toggle: Simple (Vendor-friendly) vs Technical */}
          <div className="inline-flex rounded-xl border border-slate-200 p-0.5 bg-slate-100/90 text-xs font-semibold">
            <button
              id="view-mode-simple"
              onClick={() => setViewMode('simple')}
              className={`px-3 py-1 rounded-lg transition-all ${
                viewMode === 'simple'
                  ? 'bg-white text-emerald-800 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t(lang, 'simpleView')}
            </button>
            <button
              id="view-mode-technical"
              onClick={() => setViewMode('technical')}
              className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1.5 ${
                viewMode === 'technical'
                  ? 'bg-white text-indigo-700 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t(lang, 'technicalView')}</span>
              <span className="sm:hidden">Tech</span>
            </button>
          </div>

          {/* Bilingual Tamil / English Language Switch */}
          <button
            id="language-toggle-btn"
            onClick={() => setLang(lang === 'en' ? 'ta' : 'en')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 transition-colors shadow-2xs"
            title="Switch Language / மொழி மாற்றம்"
          >
            <Languages className="w-3.5 h-3.5 text-emerald-600" />
            <span>{lang === 'en' ? 'தமிழ்' : 'English'}</span>
          </button>

          {/* Low-Literacy Audio Assistant with Waveform Animation */}
          <button
            id="voice-readout-btn"
            onClick={handleToggleAudio}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border transition-all text-xs font-semibold ${
              isSpeaking
                ? 'bg-rose-50 text-rose-700 border-rose-200 ring-2 ring-rose-200 animate-pulse'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
            title={isSpeaking ? t(lang, 'voiceStop') : t(lang, 'voiceReadout')}
          >
            {isSpeaking ? (
              <>
                <VolumeX className="w-4 h-4 text-rose-600" />
                <span className="hidden sm:inline font-mono">Speaking...</span>
              </>
            ) : (
              <>
                <Volume2 className="w-4 h-4 text-emerald-600" />
                <span className="hidden sm:inline">{lang === 'ta' ? 'குரல்' : 'Voice'}</span>
              </>
            )}
          </button>

          {/* Outdoor High-Contrast Sunlight Mode */}
          <button
            id="outdoor-market-mode-btn"
            onClick={() => {
              SoundEffects.playClick();
              onToggleOutdoorMode();
            }}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-bold rounded-xl border transition-all shadow-2xs ${
              isOutdoorMode
                ? 'bg-amber-400 text-slate-950 border-amber-500 font-extrabold ring-2 ring-amber-300'
                : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
            }`}
            title="Toggle Outdoor Sunlight High-Contrast Mode"
          >
            <Sun className={`w-3.5 h-3.5 ${isOutdoorMode ? 'text-slate-950' : 'text-amber-500'}`} />
            <span className="hidden sm:inline">
              {isOutdoorMode ? (lang === 'ta' ? 'சூரிய ஒளி ON' : 'Sunlight ON') : (lang === 'ta' ? 'சூரிய ஒளி' : 'Sunlight')}
            </span>
          </button>

          {/* Attractive Theme & Background Color Switcher */}
          <div className="relative">
            <button
              id="theme-palette-btn"
              onClick={() => {
                SoundEffects.playClick();
                setIsThemeMenuOpen(!isThemeMenuOpen);
              }}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 transition-all shadow-2xs group"
              title="Change Background Theme / பின்னணி நிறம்"
            >
              <span className={`w-2.5 h-2.5 rounded-full ${currentThemeMeta.dot} ring-1 ring-black/10`} />
              <Palette className="w-3.5 h-3.5 text-emerald-600 group-hover:rotate-12 transition-transform" />
              <span className="hidden md:inline">
                {lang === 'ta' ? 'நிறம்' : 'Theme'}
              </span>
            </button>

            {/* Dropdown Menu for Attractive Background Colors */}
            {isThemeMenuOpen && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setIsThemeMenuOpen(false)} 
                />
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-2.5 py-1.5 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                    <span>{lang === 'ta' ? 'பின்னணி நிறம்' : 'Background Theme'}</span>
                    <span className="text-[10px] text-emerald-600 font-mono font-bold">Attractive</span>
                  </div>
                  <div className="space-y-1 mt-1.5">
                    {bgThemesList.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => {
                          SoundEffects.playSuccess();
                          onChangeBgTheme(t.id);
                          setIsThemeMenuOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-semibold transition-all text-left ${
                          bgTheme === t.id
                            ? `${t.bgTone} ring-1 ring-black/5 font-bold`
                            : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{t.emoji}</span>
                          <div>
                            <div className="text-slate-900 leading-tight">
                              {lang === 'ta' ? t.nameTa : t.nameEn}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              {t.id === 'emerald' && (lang === 'ta' ? 'இயற்கை பசுமை & ஒளி' : 'Lush Agri & Sunlit')}
                              {t.id === 'golden' && (lang === 'ta' ? 'பாரம்பரிய சந்தை' : 'Warm Amber Harvest')}
                              {t.id === 'ocean' && (lang === 'ta' ? 'குளிர்ந்த மலைத் தென்றல்' : 'Cool Nilgiri Mist')}
                              {t.id === 'midnight' && (lang === 'ta' ? 'இரவு ஆடம்பர கருமை' : 'Dark Luxury Bazaar')}
                            </div>
                          </div>
                        </div>
                        <span className={`w-2.5 h-2.5 rounded-full ${t.dot}`} />
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Data Vault & Storage Protection Hub */}
          <button
            id="data-vault-btn"
            onClick={() => {
              SoundEffects.playClick();
              onOpenDataVault();
            }}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 transition-colors shadow-2xs"
            title="Backup and Restore Stall Data"
          >
            <HardDrive className="w-3.5 h-3.5 text-indigo-600" />
            <span className="hidden md:inline">{lang === 'ta' ? 'காப்பகம்' : 'Vault'}</span>
          </button>

          {/* Optional PWA Install Action */}
          {canInstallPWA && onInstallPWA && (
            <button
              id="pwa-install-btn"
              onClick={() => {
                SoundEffects.playClick();
                onInstallPWA();
              }}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-2xs animate-pulse"
              title="Install SanthAI App to Home Screen"
            >
              <DownloadCloud className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{lang === 'ta' ? 'நிறுவு' : 'Install'}</span>
            </button>
          )}

          {/* Vendor Profile & Verified Stall Badge */}
          <button
            id="vendor-profile-btn"
            onClick={onOpenAuth}
            className="flex items-center gap-2 pl-2 pr-3 py-1 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs text-slate-800 transition-colors shadow-2xs"
            title="Manage Vendor Profile"
          >
            <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white font-bold flex items-center justify-center text-xs shadow-xs">
              {vendorProfile.name.charAt(0)}
            </div>
            <div className="text-left hidden sm:block">
              <div className="font-bold text-slate-900 leading-tight">
                {vendorProfile.name.split(' ')[0]}
              </div>
              <div className="text-[10px] text-slate-500 leading-tight">
                {vendorProfile.stallNumber}
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Main Four-Module Navigation Tabs */}
      <nav className="max-w-7xl mx-auto px-2 sm:px-6">
        <div className="grid grid-cols-4 gap-1.5 sm:gap-3 py-2">
          {/* Tab 1: Stock (Demand forecasting) */}
          <button
            id="nav-tab-stock"
            onClick={() => setActiveTab('stock')}
            className={`flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-2.5 py-2.5 px-3 rounded-xl transition-all min-h-[54px] ${
              activeTab === 'stock'
                ? 'bg-slate-900 text-white font-bold shadow-sm'
                : 'bg-slate-50/80 text-slate-700 hover:bg-slate-100 hover:text-slate-900 font-semibold border border-slate-200/60'
            }`}
          >
            <Store className={`w-5 h-5 shrink-0 ${activeTab === 'stock' ? 'text-emerald-400' : 'text-slate-500'}`} />
            <div className="text-center sm:text-left leading-tight">
              <span className="text-xs sm:text-sm block">{t(lang, 'navStock')}</span>
              <span className={`text-[10px] hidden sm:block ${activeTab === 'stock' ? 'text-slate-300' : 'text-slate-500'}`}>
                {t(lang, 'navStockSub')}
              </span>
            </div>
          </button>

          {/* Tab 2: Prices (Agmarknet Mandi & Trust Score) */}
          <button
            id="nav-tab-prices"
            onClick={() => setActiveTab('prices')}
            className={`flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-2.5 py-2.5 px-3 rounded-xl transition-all min-h-[54px] ${
              activeTab === 'prices'
                ? 'bg-slate-900 text-white font-bold shadow-sm'
                : 'bg-slate-50/80 text-slate-700 hover:bg-slate-100 hover:text-slate-900 font-semibold border border-slate-200/60'
            }`}
          >
            <Coins className={`w-5 h-5 shrink-0 ${activeTab === 'prices' ? 'text-emerald-400' : 'text-slate-500'}`} />
            <div className="text-center sm:text-left leading-tight">
              <span className="text-xs sm:text-sm block">{t(lang, 'navPrices')}</span>
              <span className={`text-[10px] hidden sm:block ${activeTab === 'prices' ? 'text-slate-300' : 'text-slate-500'}`}>
                {t(lang, 'navPricesSub')}
              </span>
            </div>
          </button>

          {/* Tab 3: ResQ (Surplus Rescue) with alert badge */}
          <button
            id="nav-tab-resq"
            onClick={() => setActiveTab('resq')}
            className={`relative flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-2.5 py-2.5 px-3 rounded-xl transition-all min-h-[54px] ${
              activeTab === 'resq'
                ? 'bg-amber-600 text-white font-bold shadow-sm'
                : 'bg-slate-50/80 text-slate-700 hover:bg-slate-100 hover:text-slate-900 font-semibold border border-slate-200/60'
            }`}
          >
            <Sparkles className={`w-5 h-5 shrink-0 ${activeTab === 'resq' ? 'text-amber-200' : 'text-slate-500'}`} />
            <div className="text-center sm:text-left leading-tight">
              <span className="text-xs sm:text-sm block">{t(lang, 'navResQ')}</span>
              <span className={`text-[10px] hidden sm:block ${activeTab === 'resq' ? 'text-amber-100' : 'text-slate-500'}`}>
                {t(lang, 'navResQSub')}
              </span>
            </div>
            {surplusAlertCount > 0 && (
              <span className="absolute -top-1 -right-1 sm:top-1 sm:right-2 bg-rose-600 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center ring-2 ring-white animate-bounce">
                {surplusAlertCount}
              </span>
            )}
          </button>

          {/* Tab 4: Khata (Digital Credit Ledger) */}
          <button
            id="nav-tab-khata"
            onClick={() => setActiveTab('khata')}
            className={`flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-2.5 py-2.5 px-3 rounded-xl transition-all min-h-[54px] ${
              activeTab === 'khata'
                ? 'bg-slate-900 text-white font-bold shadow-sm'
                : 'bg-slate-50/80 text-slate-700 hover:bg-slate-100 hover:text-slate-900 font-semibold border border-slate-200/60'
            }`}
          >
            <ShieldCheck className={`w-5 h-5 shrink-0 ${activeTab === 'khata' ? 'text-emerald-400' : 'text-slate-500'}`} />
            <div className="text-center sm:text-left leading-tight">
              <span className="text-xs sm:text-sm block">{t(lang, 'navKhata')}</span>
              <span className={`text-[10px] hidden sm:block ${activeTab === 'khata' ? 'text-slate-300' : 'text-slate-500'}`}>
                {t(lang, 'navKhataSub')}
              </span>
            </div>
          </button>
        </div>
      </nav>

      {/* Offline Resilience Market Banner */}
      {!isOnline && (
        <div className="bg-amber-500 text-slate-950 px-4 py-1.5 text-xs font-bold flex items-center justify-center gap-2 border-t border-amber-600 shadow-inner">
          <WifiOff className="w-4 h-4 shrink-0 animate-pulse" />
          <span>
            {lang === 'ta'
              ? 'இணையம் இல்லை (ஆஃப்லைன்) — உள்ளூர் சேமிப்பகம் செயல்படுகிறது. அனைத்து மாற்றங்களும் உங்கள் சாதனத்தில் உடனடியாகப் பாதுகாக்கப்படுகின்றன.'
              : 'Offline Mode Active — Using local device storage. All prices, stock, and khata entries are securely saved offline.'}
          </span>
        </div>
      )}
    </header>
  );
};
