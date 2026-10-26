import React from 'react';
import {
  Package,
  IndianRupee,
  Boxes,
  BookOpen,
  MessageCircle,
  Leaf,
  Store,
  ChevronRight,
  Sparkles,
  ShieldCheck,
  Sun,
  HardDrive,
  Scale
} from 'lucide-react';
import { Language, VendorProfile, BgTheme, ActiveTab } from '../types';
import { SoundEffects } from '../utils/audioHaptics';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  lang: Language;
  vendorProfile: VendorProfile;
  surplusAlertCount: number;
  onOpenAuth: () => void;
  onOpenFeasibility?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  lang,
  vendorProfile,
  surplusAlertCount,
  onOpenAuth,
  onOpenFeasibility
}) => {
  const navItems: {
    id: ActiveTab;
    nameEn: string;
    nameTa: string;
    subEn: string;
    subTa: string;
    icon: React.ComponentType<{ className?: string }>;
    badgeCount?: number;
    isAiBadge?: boolean;
  }[] = [
    {
      id: 'stock',
      nameEn: 'Stock',
      nameTa: 'சரக்கு',
      subEn: 'Plan tomorrow',
      subTa: 'நாளை தேவை திட்டம்',
      icon: Package
    },
    {
      id: 'prices',
      nameEn: 'Prices',
      nameTa: 'விலைகள்',
      subEn: 'Mandi rates',
      subTa: 'மண்டி நேரடி விலை',
      icon: IndianRupee
    },
    {
      id: 'resq',
      nameEn: 'ResQ',
      nameTa: 'ResQ மீட்பு',
      subEn: 'Save surplus',
      subTa: 'மீதத்தை விற்க',
      icon: Boxes,
      badgeCount: surplusAlertCount
    },
    {
      id: 'khata',
      nameEn: 'Khata',
      nameTa: 'கடன் ஏடு',
      subEn: 'Track credit',
      subTa: 'கடன் & வசூல்',
      icon: BookOpen
    },
    {
      id: 'aistudio',
      nameEn: 'AI Studio',
      nameTa: 'AI ஸ்டுடியோ',
      subEn: 'Veo, Live, Search',
      subTa: 'வீடியோ & நேரலை AI',
      icon: Sparkles,
      isAiBadge: true
    }
  ];

  return (
    <aside className="w-64 shrink-0 bg-white/60 backdrop-blur-2xl border-r border-black/[0.06] flex flex-col justify-between p-4 sm:p-5 min-h-screen select-none shadow-[2px_0_16px_rgba(0,0,0,0.02)]">
      <div className="space-y-6">
        {/* Brand Header */}
        <div className="flex items-center gap-3 px-1 py-1">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#183a27] to-[#122c1d] flex items-center justify-center text-white shadow-sm shrink-0 ring-2 ring-emerald-500/20">
            <Leaf className="w-5 h-5 fill-white/20 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-1">
              <span className="text-xl font-black tracking-tight text-slate-900 font-display">
                Santh<span className="text-[#16a34a]">AI</span>
              </span>
            </div>
            <div className="text-[10px] font-bold tracking-widest text-slate-400 uppercase font-mono">
              SMART MARKET साथी
            </div>
          </div>
        </div>

        {/* Primary Vertical Navigation Cards */}
        <nav className="space-y-2">
          {navItems.map(item => {
            const isActive = activeTab === item.id;
            const Icon = item.icon;

            return (
              <button
                key={item.id}
                id={`sidebar-nav-${item.id}`}
                onClick={() => {
                  SoundEffects.playClick();
                  setActiveTab(item.id);
                }}
                className={`w-full text-left flex items-center justify-between p-3 rounded-2xl transition-all duration-200 btn-press cursor-pointer ${
                  isActive
                    ? 'bg-[#183a27] text-white shadow-md ring-1 ring-emerald-500/30'
                    : 'text-slate-700 hover:bg-slate-200/60 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                      isActive
                        ? 'bg-[#254d35] text-white shadow-2xs'
                        : 'bg-white border border-slate-200/80 text-slate-600 shadow-2xs'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-sm leading-snug">
                      {lang === 'ta' ? item.nameTa : item.nameEn}
                    </div>
                    <div
                      className={`text-xs ${
                        isActive ? 'text-[#a7f3d0] font-medium' : 'text-slate-400'
                      }`}
                    >
                      {lang === 'ta' ? item.subTa : item.subEn}
                    </div>
                  </div>
                </div>

                {item.badgeCount && item.badgeCount > 0 ? (
                  <span
                    className={`px-2 py-0.5 rounded-lg text-xs font-bold ${
                      isActive
                        ? 'bg-amber-400 text-amber-950 font-black shadow-xs'
                        : 'bg-amber-100 text-amber-900 border border-amber-300/80'
                    }`}
                  >
                    {item.badgeCount}
                  </span>
                ) : item.isAiBadge ? (
                  <span
                    className={`px-1.5 py-0.5 rounded-md text-[10px] font-mono font-bold tracking-tight uppercase ${
                      isActive
                        ? 'bg-purple-400 text-purple-950'
                        : 'bg-purple-100 text-purple-800 border border-purple-200'
                    }`}
                  >
                    Veo+Live
                  </span>
                ) : null}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="space-y-4 pt-4 border-t border-[#e3ece2]">
        {/* Market Data & Feasibility Intelligence Button */}
        {onOpenFeasibility && (
          <button
            onClick={() => {
              SoundEffects.playClick();
              onOpenFeasibility();
            }}
            className="w-full flex items-center justify-between p-2.5 rounded-2xl bg-gradient-to-r from-emerald-500/10 to-teal-500/10 hover:from-emerald-500/20 hover:to-teal-500/20 border border-emerald-500/25 text-left transition-all group shadow-2xs cursor-pointer"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                <Scale className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-black text-emerald-950 truncate">
                  {lang === 'ta' ? 'அரசு & கள ஆய்வு மையம்' : 'Govt & Field Intel'}
                </div>
                <div className="text-[10px] text-emerald-700 font-medium truncate">
                  {lang === 'ta' ? 'கள கணக்கெடுப்பு & விலை இடைவெளி' : 'Counted surveys & spread'}
                </div>
              </div>
            </div>
            <span className="text-[9px] font-black uppercase tracking-wider bg-emerald-600 text-white px-1.5 py-0.5 rounded-md">
              Real
            </span>
          </button>
        )}

        {/* WhatsApp-First Info Card as in reference screenshot */}
        <div className="bg-[#eaf4ec] border border-[#d6ebd9] rounded-2xl p-4 text-left relative overflow-hidden shadow-2xs">
          <div className="flex items-center gap-2 text-emerald-800 mb-1.5">
            <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-2xs">
              <MessageCircle className="w-3.5 h-3.5 fill-white/20" />
            </div>
            <span className="text-xs font-black uppercase tracking-wider font-heading">
              {lang === 'ta' ? 'வாட்ஸ்அப் முதன்மை' : 'WhatsApp-first'}
            </span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed font-normal">
            {lang === 'ta'
              ? 'தினசரி நினைவூட்டல்களும் வாங்குபவர் ஆர்டர்களும் வியாபாரிகள் இருக்கும் வாட்ஸ்அப்பில் நேரடியாக வரும்.'
              : 'Daily reminders and buyer messages go where vendors already are.'}
          </p>
        </div>

        {/* User / Vendor Profile Card at Bottom */}
        <button
          onClick={() => {
            SoundEffects.playClick();
            onOpenAuth();
          }}
          className="w-full flex items-center justify-between p-2.5 rounded-2xl bg-white hover:bg-slate-100/80 transition-all text-left group border border-slate-200/80 hover:border-slate-300 shadow-2xs btn-press cursor-pointer"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-amber-400 to-orange-300 text-amber-950 font-bold flex items-center justify-center shrink-0 border border-amber-300 text-sm shadow-2xs font-display">
              {vendorProfile.name ? vendorProfile.name.charAt(0).toUpperCase() : 'S'}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-slate-900 truncate">
                {vendorProfile.name || (lang === 'ta' ? 'செல்வி ஸ்டோர்ஸ்' : 'Selvi Stores')}
              </div>
              <div className="text-[11px] text-slate-400 truncate">
                {vendorProfile.marketComplex || vendorProfile.marketName || 'Koyambedu, Chennai'}
              </div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-transform group-hover:translate-x-0.5 shrink-0" />
        </button>
      </div>
    </aside>
  );
};
