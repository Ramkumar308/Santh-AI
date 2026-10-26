import React, { useState } from 'react';
import { Language, CommodityType } from '../types';
import {
  GOVERNMENT_PRICE_SOURCES,
  DCA_RETAIL_BENCHMARKS,
  UZHAVAR_SANDHAI_BENCHMARKS,
  FIELD_COLLECTED_VENDOR_SURVEYS,
  VENDOR_NOTEBOOK_14_DAY_SALES,
  CHALKBOARD_PHOTO_RECORDS,
  WHOLESALE_TO_RETAIL_GAP_FINDINGS,
  DATA_FEASIBILITY_PILLARS,
  STARTUP_STORY_FLYWHEEL
} from '../data/marketIntelligence';
import { ProduceBadge } from './ProduceBadge';
import { SoundEffects } from '../utils/audioHaptics';
import confetti from 'canvas-confetti';
import {
  Building2,
  Scale,
  BookOpen,
  Camera,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Info,
  ExternalLink,
  Copy,
  Check,
  Download,
  X,
  Layers,
  Sparkles,
  Zap,
  ArrowRight,
  Eye,
  FileText,
  Printer,
  ChevronRight
} from 'lucide-react';

interface MarketDataFeasibilityCenterProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
}

type FeasibilityTab = 'gov_sources' | 'field_data' | 'gap_analysis' | 'startup_flywheel';

export const MarketDataFeasibilityCenter: React.FC<MarketDataFeasibilityCenterProps> = ({
  isOpen,
  onClose,
  lang
}) => {
  const [activeTab, setActiveTab] = useState<FeasibilityTab>('gap_analysis');
  const [selectedCommodity, setSelectedCommodity] = useState<CommodityType>('Tomato');
  const [copiedSlide, setCopiedSlide] = useState(false);
  const [selectedSurveyDay, setSelectedSurveyDay] = useState<'All' | 'Day 1' | 'Day 2' | 'Day 3'>('All');

  if (!isOpen) return null;

  const currentGapFinding = WHOLESALE_TO_RETAIL_GAP_FINDINGS.find(
    f => f.commodity === selectedCommodity
  ) || WHOLESALE_TO_RETAIL_GAP_FINDINGS[0];

  const handleCopySlideSummary = () => {
    SoundEffects.playClick();
    const text = `SANTHAI RESEARCH FINDING: WHOLESALE-TO-RETAIL PRICE SPREAD ANALYSIS
Commodity: ${currentGapFinding.commodity}
1. Wholesale Baseline (Agmarknet Mandi Modal): ₹${currentGapFinding.agmarknetMandiWholesaleModal}/kg
2. Direct Farmer Ceiling (Uzhavar Sandhai): ₹${currentGapFinding.uzhavarSandhaiFarmerDirect}/kg
3. Official Retail Reference (DCA Price Monitoring): ₹${currentGapFinding.dcaRetailMonitoringAvg}/kg
4. Actual Field Count (Street Vendors Reality): ₹${currentGapFinding.fieldSurveyStallRetailAvg}/kg

SPREAD DECONSTRUCTION (Total Gap: ₹${currentGapFinding.gapRsPerKg}/kg or ${currentGapFinding.gapPercentage}%):
- Freight & Cartage from Mandi to Stall: ₹${currentGapFinding.breakdown.freightAndCartagePerKg.toFixed(2)}/kg
- Shrinkage, Moisture Loss & Sorting Loss: ₹${currentGapFinding.breakdown.shrinkageAndMoistureLossPerKg.toFixed(2)}/kg
- Net Vendor Living Take-Home Margin: ₹${currentGapFinding.breakdown.vendorLivingMarginPerKg.toFixed(2)}/kg

KEY TAKEAWAY:
${currentGapFinding.keyTakeawayEn}

DATA GROUNDING:
- Real Data: Agmarknet live API, 6 vendor field counts across 3 days, 14-day vendor sales diary.
- Simulated & Labeled: Khata credit ledger repayments, ResQ institutional partner matching.`;

    navigator.clipboard.writeText(text).then(() => {
      setCopiedSlide(true);
      confetti({ particleCount: 30, spread: 50, origin: { y: 0.7 } });
      setTimeout(() => setCopiedSlide(false), 2500);
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl max-w-5xl w-full border border-slate-200 overflow-hidden my-auto flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 bg-slate-900 text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base sm:text-lg leading-tight">
                  {lang === 'ta'
                    ? 'சந்தை விலை ஆதாரங்கள் & கள ஆய்வு மையம்'
                    : 'Market Data Sources & Feasibility Intelligence'}
                </h3>
                <span className="hidden sm:inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  COUNTED, NOT SOURCED
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {lang === 'ta'
                  ? 'அரசு மண்டித் தரவு + உழவர் சந்தை + 6 வியாபாரிகள் கள ஆய்வு + 14-நாள் நோட்டுப் புத்தக விற்பனை வரலாறு'
                  : 'Govt Wholesale Baselines + DCA + Uzhavar Sandhai + 6-Vendor Field Surveys + 14-Day Sales Diary'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopySlideSummary}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
              title="Copy Summary for Presentation Slide"
            >
              {copiedSlide ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied Slide Text</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                  <span>Copy Slide Summary</span>
                </>
              )}
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-5 sm:px-6 bg-slate-50 border-b border-slate-200 flex items-center gap-2 overflow-x-auto py-2.5 shrink-0">
          <button
            onClick={() => {
              SoundEffects.playClick();
              setActiveTab('gap_analysis');
            }}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'gap_analysis'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            <span>{lang === 'ta' ? 'விலை இடைவெளி ஆய்வு (Analysis Slide)' : 'Wholesale-to-Retail Gap Analysis'}</span>
          </button>

          <button
            onClick={() => {
              SoundEffects.playClick();
              setActiveTab('field_data');
            }}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'field_data'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            <Camera className="w-3.5 h-3.5 text-indigo-400" />
            <span>{lang === 'ta' ? 'நேரடி களத் தரவு (Field Counts & Diary)' : 'Field Surveys & 14-Day Diary'}</span>
          </button>

          <button
            onClick={() => {
              SoundEffects.playClick();
              setActiveTab('gov_sources');
            }}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'gov_sources'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            <Building2 className="w-3.5 h-3.5 text-amber-500" />
            <span>{lang === 'ta' ? 'அரசு மண்டி & உழவர் சந்தை' : 'Government & Farmer Sources'}</span>
          </button>

          <button
            onClick={() => {
              SoundEffects.playClick();
              setActiveTab('startup_flywheel');
            }}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'startup_flywheel'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>{lang === 'ta' ? 'தொடக்கப் புள்ளி & தரவு சக்கரம் (Flywheel)' : 'Feasibility & Startup Flywheel'}</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1">
          {/* ========================================================================= */}
          {/* TAB 1: WHOLESALE-TO-RETAIL GAP ANALYSIS (THE ANALYSIS SLIDE FINDING) */}
          {/* ========================================================================= */}
          {activeTab === 'gap_analysis' && (
            <div className="space-y-6">
              {/* Highlight Banner */}
              <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-900 text-white p-5 rounded-2xl border border-emerald-800/50 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                      CORE RESEARCH FINDING
                    </span>
                    <span className="text-xs text-slate-400">
                      {lang === 'ta' ? 'அரசு மண்டி vs கள சில்லறை ஒப்பீடு' : 'Govt Wholesale vs Ground Retail Gap'}
                    </span>
                  </div>
                  <h4 className="text-base sm:text-lg font-black mt-1">
                    {lang === 'ta'
                      ? 'ஏன் அரசு மண்டி மொத்த விலை கடை சில்லறை விலையை விட குறைவாக உள்ளது?'
                      : 'Why Government Mandi Wholesale Rates Differ from Street Retail Reality'}
                  </h4>
                  <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                    {lang === 'ta'
                      ? 'அரசு அக்மார்க்நெட் மண்டி ஏல விலைகள் (Wholesale) மட்டுமே. வியாபாரிகள் லாரி வாடகை, எடை சேதாரம் மற்றும் வாழ்வாதார லாபத்தைச் சேர்த்தே சில்லறையில் விற்கின்றனர். களக் கணக்கெடுப்பு இந்த இடைவெளியை நிரூபிக்கிறது.'
                      : 'Government Agmarknet rates represent bulk auction lots (truckload scale). Informal street vendors bear transit freight (₹2-3/kg), moisture loss and sorting shrinkage (8-12%), plus daily living margins. Sourcing both together reveals the true economic spread.'}
                  </p>
                </div>

                {/* Commodity Filter Chips */}
                <div className="flex items-center gap-1.5 bg-slate-800/80 p-1.5 rounded-xl border border-slate-700/80 shrink-0 overflow-x-auto">
                  {(['Tomato', 'Onion', 'Potato', 'Brinjal', 'Carrot'] as CommodityType[]).map(comm => (
                    <button
                      key={comm}
                      onClick={() => {
                        SoundEffects.playClick();
                        setSelectedCommodity(comm);
                      }}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                        selectedCommodity === comm
                          ? 'bg-emerald-500 text-slate-950 shadow-xs'
                          : 'text-slate-300 hover:text-white hover:bg-slate-700'
                      }`}
                    >
                      <span>{comm}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 4-Stage Benchmark Comparison Grid for Selected Commodity */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                {/* 1. Mandi Wholesale */}
                <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between">
                    <span>1. Mandi Auction</span>
                    <span className="text-[9px] bg-slate-200 px-1.5 py-0.2 rounded font-mono">Agmarknet</span>
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-1 font-mono">
                    ₹{currentGapFinding.agmarknetMandiWholesaleModal}
                    <span className="text-xs text-slate-500 font-normal"> / kg</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Koyambedu / MGR Mandi wholesale floor modal rate.
                  </p>
                </div>

                {/* 2. Uzhavar Sandhai */}
                <div className="bg-amber-50/60 border border-amber-200 p-4 rounded-2xl">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-amber-800 flex items-center justify-between">
                    <span>2. Uzhavar Sandhai</span>
                    <span className="text-[9px] bg-amber-200/80 text-amber-900 px-1.5 py-0.2 rounded font-mono">Farmer</span>
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-amber-900 mt-1 font-mono">
                    ₹{currentGapFinding.uzhavarSandhaiFarmerDirect}
                    <span className="text-xs text-amber-700 font-normal"> / kg</span>
                  </div>
                  <p className="text-[11px] text-amber-700 mt-1">
                    Direct farmer-to-consumer ceiling (R.S. Puram, CBE).
                  </p>
                </div>

                {/* 3. DCA Retail Monitoring */}
                <div className="bg-indigo-50/60 border border-indigo-200 p-4 rounded-2xl">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-800 flex items-center justify-between">
                    <span>3. Govt DCA Retail</span>
                    <span className="text-[9px] bg-indigo-200/80 text-indigo-900 px-1.5 py-0.2 rounded font-mono">Ministry</span>
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-indigo-900 mt-1 font-mono">
                    ₹{currentGapFinding.dcaRetailMonitoringAvg}
                    <span className="text-xs text-indigo-700 font-normal"> / kg</span>
                  </div>
                  <p className="text-[11px] text-indigo-700 mt-1">
                    Department of Consumer Affairs city retail bulletin.
                  </p>
                </div>

                {/* 4. Field Survey Stall Retail */}
                <div className="bg-emerald-50 border-2 border-emerald-400 p-4 rounded-2xl shadow-xs">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 flex items-center justify-between">
                    <span>4. Field Counted</span>
                    <span className="text-[9px] bg-emerald-200 text-emerald-900 px-1.5 py-0.2 rounded font-mono font-bold">
                      COUNTED
                    </span>
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-emerald-800 mt-1 font-mono">
                    ₹{currentGapFinding.fieldSurveyStallRetailAvg}
                    <span className="text-xs text-emerald-700 font-normal"> / kg</span>
                  </div>
                  <p className="text-[11px] text-emerald-700 mt-1 font-medium">
                    Actual street vendor retail price across 6 stalls.
                  </p>
                </div>
              </div>

              {/* Economic Gap Deconstruction & Presentation Slide Box */}
              <div className="bg-white rounded-2xl border-2 border-slate-200 p-5 space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-slate-100">
                  <h4 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                    <Scale className="w-4 h-4 text-emerald-600" />
                    <span>
                      {currentGapFinding.commodity} Price Spread Breakdown: Mandi Wholesale (₹{currentGapFinding.agmarknetMandiWholesaleModal}) ➔ Street Retail (₹{currentGapFinding.fieldSurveyStallRetailAvg})
                    </span>
                  </h4>
                  <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-rose-50 text-rose-800 border border-rose-200">
                    Gross Spread: +₹{currentGapFinding.gapRsPerKg} / kg ({currentGapFinding.gapPercentage}%)
                  </span>
                </div>

                {/* Stacked Cost Decomposition Bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs text-slate-500 font-mono">
                    <span>Mandi Cost (₹{currentGapFinding.agmarknetMandiWholesaleModal})</span>
                    <span>Freight (+₹{currentGapFinding.breakdown.freightAndCartagePerKg})</span>
                    <span>Shrinkage (+₹{currentGapFinding.breakdown.shrinkageAndMoistureLossPerKg})</span>
                    <span>Vendor Margin (+₹{currentGapFinding.breakdown.vendorLivingMarginPerKg})</span>
                  </div>

                  <div className="w-full h-7 rounded-xl overflow-hidden flex font-mono text-[11px] font-bold text-white shadow-2xs">
                    <div
                      className="bg-slate-700 flex items-center justify-center"
                      style={{ width: `${(currentGapFinding.agmarknetMandiWholesaleModal / currentGapFinding.fieldSurveyStallRetailAvg) * 100}%` }}
                      title={`Wholesale Procurement: ₹${currentGapFinding.agmarknetMandiWholesaleModal}`}
                    >
                      Mandi {Math.round((currentGapFinding.agmarknetMandiWholesaleModal / currentGapFinding.fieldSurveyStallRetailAvg) * 100)}%
                    </div>
                    <div
                      className="bg-emerald-600 flex items-center justify-center"
                      style={{ width: `${(currentGapFinding.breakdown.freightAndCartagePerKg / currentGapFinding.fieldSurveyStallRetailAvg) * 100}%` }}
                      title={`Freight/Cartage: ₹${currentGapFinding.breakdown.freightAndCartagePerKg}`}
                    >
                      Freight
                    </div>
                    <div
                      className="bg-amber-500 flex items-center justify-center text-slate-950"
                      style={{ width: `${(currentGapFinding.breakdown.shrinkageAndMoistureLossPerKg / currentGapFinding.fieldSurveyStallRetailAvg) * 100}%` }}
                      title={`Shrinkage/Moisture: ₹${currentGapFinding.breakdown.shrinkageAndMoistureLossPerKg}`}
                    >
                      Loss
                    </div>
                    <div
                      className="bg-indigo-600 flex items-center justify-center"
                      style={{ width: `${(currentGapFinding.breakdown.vendorLivingMarginPerKg / currentGapFinding.fieldSurveyStallRetailAvg) * 100}%` }}
                      title={`Vendor Margin: ₹${currentGapFinding.breakdown.vendorLivingMarginPerKg}`}
                    >
                      Margin
                    </div>
                  </div>
                </div>

                {/* Presentation Callout Box */}
                <div className="bg-slate-900 text-slate-100 rounded-xl p-4 space-y-2 font-mono text-xs">
                  <div className="flex items-center justify-between text-emerald-400 font-bold">
                    <span>💡 Presentation / Analysis Slide Takeaway:</span>
                    <button
                      onClick={handleCopySlideSummary}
                      className="text-xs text-slate-300 hover:text-white flex items-center gap-1 cursor-pointer font-sans"
                    >
                      {copiedSlide ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedSlide ? 'Copied!' : 'Copy for Slide'}</span>
                    </button>
                  </div>
                  <p className="font-sans text-xs text-slate-300 leading-relaxed">
                    {lang === 'ta' ? currentGapFinding.keyTakeawayTa : currentGapFinding.keyTakeawayEn}
                  </p>
                </div>
              </div>

              {/* Full Comparison Table Across All 5 Core Commodities */}
              <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs overflow-x-auto">
                <h4 className="font-extrabold text-sm text-slate-900 mb-3">
                  {lang === 'ta'
                    ? 'அனைத்து காய்கறிகளுக்கான விலை ஒப்பீட்டு அட்டவணை'
                    : 'Comprehensive Wholesale-to-Retail Matrix (All 5 Survey Commodities)'}
                </h4>

                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px]">
                      <th className="py-2.5 px-3">Commodity</th>
                      <th className="py-2.5 px-3 bg-slate-50">1. Mandi Wholesale</th>
                      <th className="py-2.5 px-3 bg-amber-50/60">2. Uzhavar Sandhai</th>
                      <th className="py-2.5 px-3 bg-indigo-50/60">3. DCA Retail Avg</th>
                      <th className="py-2.5 px-3 bg-emerald-50 text-emerald-800 font-bold">4. Field Counted Avg</th>
                      <th className="py-2.5 px-3 font-bold text-rose-700">Spread (Gap)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    {WHOLESALE_TO_RETAIL_GAP_FINDINGS.map(item => (
                      <tr
                        key={item.commodity}
                        onClick={() => setSelectedCommodity(item.commodity)}
                        className={`hover:bg-slate-50 cursor-pointer transition-colors ${
                          selectedCommodity === item.commodity ? 'bg-slate-50/80 font-bold' : ''
                        }`}
                      >
                        <td className="py-3 px-3 font-sans font-bold text-slate-800 flex items-center gap-2">
                          <ProduceBadge commodity={item.commodity} size="xs" />
                          <span>{item.commodity}</span>
                        </td>
                        <td className="py-3 px-3 bg-slate-50 text-slate-700">₹{item.agmarknetMandiWholesaleModal}/kg</td>
                        <td className="py-3 px-3 bg-amber-50/40 text-amber-900">₹{item.uzhavarSandhaiFarmerDirect}/kg</td>
                        <td className="py-3 px-3 bg-indigo-50/40 text-indigo-900">₹{item.dcaRetailMonitoringAvg}/kg</td>
                        <td className="py-3 px-3 bg-emerald-50/60 text-emerald-900 font-black">
                          ₹{item.fieldSurveyStallRetailAvg}/kg
                        </td>
                        <td className="py-3 px-3 text-rose-700 font-bold">
                          +₹{item.gapRsPerKg}/kg ({item.gapPercentage}%)
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: YOUR OWN FIELD DATA ("COUNTED, NOT SOURCED" — DEFENSIBLE TRUTH) */}
          {/* ========================================================================= */}
          {activeTab === 'field_data' && (
            <div className="space-y-6">
              {/* Field Data Methodology Banner */}
              <div className="bg-indigo-950 text-white p-5 rounded-2xl border border-indigo-800/60 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/30 text-indigo-300 border border-indigo-400/30">
                      RUBRIC DEFENSE
                    </span>
                    <span className="text-xs text-indigo-300 font-semibold">
                      Counted on the ground, not copied from APIs
                    </span>
                  </div>
                  <h4 className="text-base sm:text-lg font-black mt-1">
                    Direct Field Evidence: 6 Stalls Surveyed across 3 Days + 14-Day Sales Diary
                  </h4>
                  <p className="text-xs text-indigo-200 mt-1 max-w-2xl leading-relaxed">
                    While APIs provide historical regional aggregates, our field-counted datasets capture real micro-variations across pushcarts, market stalls, and neighborhood corners in Coimbatore and Chennai.
                  </p>
                </div>

                <div className="text-right shrink-0 bg-white/10 px-4 py-2.5 rounded-xl border border-white/10">
                  <span className="text-[10px] uppercase text-indigo-300 block">Survey Coverage</span>
                  <span className="text-xl font-black text-white">6 Vendors • 3 Days</span>
                </div>
              </div>

              {/* 1. 6 Vendors Survey Grid */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-slate-100">
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-900">
                      1. Field-Recorded Street Vendor Survey (Coimbatore & Chennai)
                    </h4>
                    <p className="text-xs text-slate-500">
                      Walk-in observations recording actual chalkboard and oral prices for 5 produce items.
                    </p>
                  </div>

                  {/* Day filter pills */}
                  <div className="flex items-center gap-1 text-xs">
                    {(['All', 'Day 1', 'Day 2', 'Day 3'] as const).map(day => (
                      <button
                        key={day}
                        onClick={() => setSelectedSurveyDay(day)}
                        className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                          selectedSurveyDay === day
                            ? 'bg-slate-900 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px]">
                        <th className="py-2 px-3">Vendor / Location</th>
                        <th className="py-2 px-3">Stall Type</th>
                        <th className="py-2 px-3">Day / Date</th>
                        <th className="py-2 px-3 text-right">Tomato</th>
                        <th className="py-2 px-3 text-right">Onion</th>
                        <th className="py-2 px-3 text-right">Potato</th>
                        <th className="py-2 px-3 text-right">Brinjal</th>
                        <th className="py-2 px-3 text-right">Carrot</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono">
                      {FIELD_COLLECTED_VENDOR_SURVEYS.filter(s => {
                        if (selectedSurveyDay === 'Day 1') return s.surveyDay.includes('Day 1');
                        if (selectedSurveyDay === 'Day 2') return s.surveyDay.includes('Day 2');
                        if (selectedSurveyDay === 'Day 3') return s.surveyDay.includes('Day 3');
                        return true;
                      }).map(s => (
                        <tr key={s.vendorId} className="hover:bg-slate-50 transition-colors">
                          <td className="py-2.5 px-3 font-sans">
                            <div className="font-bold text-slate-800">{s.vendorName}</div>
                            <span className="text-[10px] text-slate-400 font-normal">{s.location}</span>
                          </td>
                          <td className="py-2.5 px-3 font-sans">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700">
                              {s.stallType}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 font-sans text-slate-500 text-[11px]">
                            {s.surveyDay}
                          </td>
                          <td className="py-2.5 px-3 text-right font-bold text-slate-800">₹{s.prices.Tomato}</td>
                          <td className="py-2.5 px-3 text-right font-bold text-slate-800">₹{s.prices.Onion}</td>
                          <td className="py-2.5 px-3 text-right font-bold text-slate-800">₹{s.prices.Potato}</td>
                          <td className="py-2.5 px-3 text-right font-bold text-slate-800">₹{s.prices.Brinjal}</td>
                          <td className="py-2.5 px-3 text-right font-bold text-slate-800">₹{s.prices.Carrot}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 2. 14-Day Real Vendor Notebook Diary */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-emerald-600" />
                      <span>2. Vendor Murugan's 14-Day Sales Diary (Ground Truth for Forecast Engine)</span>
                    </h4>
                    <p className="text-xs text-slate-500">
                      Actual notebook logs tracking daily received kg, sold kg, leftover surplus, and waste over two full trading cycles.
                    </p>
                  </div>

                  <span className="text-xs font-mono bg-emerald-50 text-emerald-800 px-2.5 py-1 rounded-lg border border-emerald-200 font-bold">
                    14 Days Recorded
                  </span>
                </div>

                <div className="overflow-x-auto max-h-60 overflow-y-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="sticky top-0 bg-white">
                      <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px]">
                        <th className="py-2 px-3">Day</th>
                        <th className="py-2 px-3">Date / Day</th>
                        <th className="py-2 px-3 text-right">Received (Arrival)</th>
                        <th className="py-2 px-3 text-right">Sold</th>
                        <th className="py-2 px-3 text-right">Leftover</th>
                        <th className="py-2 px-3 text-right">Waste</th>
                        <th className="py-2 px-3 text-right">Mandi Buy</th>
                        <th className="py-2 px-3 text-right">Stall Sell</th>
                        <th className="py-2 px-3">Notebook Observations</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono">
                      {VENDOR_NOTEBOOK_14_DAY_SALES.map(log => (
                        <tr key={log.dayNumber} className="hover:bg-slate-50 transition-colors">
                          <td className="py-2 px-3 font-bold text-slate-600">Day {log.dayNumber}</td>
                          <td className="py-2 px-3 font-sans text-slate-800">
                            {log.date} <span className="text-slate-400 text-[10px]">({log.dayOfWeek})</span>
                          </td>
                          <td className="py-2 px-3 text-right font-bold text-slate-900">{log.receivedKg} kg</td>
                          <td className="py-2 px-3 text-right font-bold text-emerald-700">{log.soldKg} kg</td>
                          <td className="py-2 px-3 text-right text-slate-600">{log.unsoldKg} kg</td>
                          <td className="py-2 px-3 text-right text-rose-600">{log.wasteKg} kg</td>
                          <td className="py-2 px-3 text-right text-slate-500">₹{log.mandiBuyPrice}</td>
                          <td className="py-2 px-3 text-right font-bold text-emerald-800">₹{log.stallSellPrice}</td>
                          <td className="py-2 px-3 font-sans text-slate-500 text-[11px] truncate max-w-xs">
                            {log.notebookNotes}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 3. Photographed Price Boards & Chalkboards */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                      <Camera className="w-4 h-4 text-indigo-600" />
                      <span>3. Photographed Chalkboards & Price Slate Records</span>
                    </h4>
                    <p className="text-xs text-slate-500">
                      Captured on-site with vendor consent. Strictly privacy-compliant (zero faces photographed).
                    </p>
                  </div>

                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" />
                    Consent & Privacy Verified
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {CHALKBOARD_PHOTO_RECORDS.map(cb => (
                    <div
                      key={cb.id}
                      className="bg-slate-900 text-slate-100 p-4 rounded-xl border border-slate-800 font-mono text-xs space-y-2 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between text-[10px] text-slate-400 pb-1.5 border-b border-slate-800">
                          <span>{cb.marketName}</span>
                          <span className="text-emerald-400">Consent OK</span>
                        </div>
                        <div className="text-xs text-slate-300 font-sans font-semibold mt-1.5">
                          {cb.stallIdentifier}
                        </div>
                        <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 text-emerald-300 text-[11px] font-mono my-2 italic">
                          "{cb.photoChalkboardText}"
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-800 space-y-1 text-[11px]">
                        {cb.itemRates.map((r, i) => (
                          <div key={i} className="flex justify-between text-slate-300">
                            <span>{r.item}</span>
                            <span className="font-bold text-white">₹{r.ratePerKg}/kg</span>
                          </div>
                        ))}
                        <div className="text-[10px] text-slate-500 pt-1 font-sans">
                          Recorded: {cb.recordedDate}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: GOVERNMENT & FARMER-DIRECT DATA SOURCES */}
          {/* ========================================================================= */}
          {activeTab === 'gov_sources' && (
            <div className="space-y-6">
              {/* Introduction to Gov Sources */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {GOVERNMENT_PRICE_SOURCES.map((source, idx) => (
                  <div
                    key={idx}
                    className="bg-white rounded-2xl border-2 border-slate-200 p-5 shadow-xs flex flex-col justify-between space-y-3"
                  >
                    <div>
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                        <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                          {source.sourceType}
                        </span>
                        <span className="text-[11px] text-slate-400 font-medium">
                          {source.cadence}
                        </span>
                      </div>

                      <h4 className="font-black text-slate-900 text-sm mt-2">
                        {source.sourceName}
                      </h4>
                      <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                        {source.governingBody}
                      </p>

                      <div className="space-y-2 mt-3 text-xs">
                        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                          <span className="text-[10px] font-bold text-slate-600 uppercase block mb-0.5">
                            Coverage:
                          </span>
                          <p className="text-slate-700 text-[11px] leading-relaxed">
                            {source.coverage}
                          </p>
                        </div>

                        <div className="bg-emerald-50/60 p-2.5 rounded-xl border border-emerald-100">
                          <span className="text-[10px] font-bold text-emerald-800 uppercase block mb-0.5">
                            Role in SanthAI:
                          </span>
                          <p className="text-emerald-900 text-[11px] leading-relaxed">
                            {source.keyRoleInSanthai}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className="text-[10px] text-slate-400 font-mono">
                        {source.apiAvailability}
                      </span>
                      <a
                        href={source.citationUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-emerald-700 font-bold hover:underline flex items-center gap-1"
                      >
                        <span>Portal</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>

              {/* Department of Consumer Affairs (DCA) City Retail Benchmarks Table */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-indigo-600" />
                      <span>Department of Consumer Affairs (DCA) — City Retail Monitoring (Tamil Nadu)</span>
                    </h4>
                    <p className="text-xs text-slate-500">
                      Official price monitoring bulletins representing actual city retail prices paid by consumers.
                    </p>
                  </div>
                  <span className="text-xs font-mono text-slate-400 bg-slate-100 px-2 py-1 rounded">
                    Daily PMC Extract
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px]">
                        <th className="py-2.5 px-3">Commodity</th>
                        <th className="py-2.5 px-3">Chennai Retail</th>
                        <th className="py-2.5 px-3 bg-indigo-50/60 font-bold text-indigo-900">Coimbatore Retail</th>
                        <th className="py-2.5 px-3">Madurai Retail</th>
                        <th className="py-2.5 px-3 font-bold text-slate-800">TN State Average</th>
                        <th className="py-2.5 px-3">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono">
                      {DCA_RETAIL_BENCHMARKS.map(dca => (
                        <tr key={dca.commodity} className="hover:bg-slate-50 transition-colors">
                          <td className="py-2.5 px-3 font-sans font-semibold text-slate-900 flex items-center gap-2">
                            <ProduceBadge commodity={dca.commodity} size="xs" />
                            <span>{dca.commodity}</span>
                          </td>
                          <td className="py-2.5 px-3 text-slate-700">₹{dca.chennaiRetail}/kg</td>
                          <td className="py-2.5 px-3 bg-indigo-50/40 font-bold text-indigo-900">
                            ₹{dca.coimbatoreRetail}/kg
                          </td>
                          <td className="py-2.5 px-3 text-slate-700">₹{dca.maduraiRetail}/kg</td>
                          <td className="py-2.5 px-3 font-bold text-slate-900">₹{dca.tnStateAverage.toFixed(1)}/kg</td>
                          <td className="py-2.5 px-3 text-slate-400 text-[10px]">{dca.date}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Uzhavar Sandhai (Farmers Market) Direct Rates Table */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                      <Scale className="w-4 h-4 text-emerald-600" />
                      <span>Uzhavar Sandhai (Tamil Nadu Farmers’ Markets) — Coimbatore & Nilgiris Direct</span>
                    </h4>
                    <p className="text-xs text-slate-500">
                      Published daily at 6:00 AM by the Agricultural Marketing Board. Direct farmer prices without intermediary markups.
                    </p>
                  </div>
                  <span className="text-xs font-mono text-emerald-700 bg-emerald-50 px-2 py-1 rounded font-bold">
                    Zero Commission
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px]">
                        <th className="py-2.5 px-3">Commodity</th>
                        <th className="py-2.5 px-3">Uzhavar Sandhai Center</th>
                        <th className="py-2.5 px-3 font-bold text-emerald-800">Farmer-Direct Rate</th>
                        <th className="py-2.5 px-3">Grading Standard</th>
                        <th className="py-2.5 px-3">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono">
                      {UZHAVAR_SANDHAI_BENCHMARKS.map((uzh, i) => (
                        <tr key={i} className="hover:bg-slate-50 transition-colors">
                          <td className="py-2.5 px-3 font-sans font-semibold text-slate-900 flex items-center gap-2">
                            <ProduceBadge commodity={uzh.commodity} size="xs" />
                            <span>{uzh.commodity}</span>
                          </td>
                          <td className="py-2.5 px-3 font-sans text-slate-700">{uzh.marketLocation}</td>
                          <td className="py-2.5 px-3 font-black text-emerald-800 text-sm">
                            ₹{uzh.farmerDirectPricePerKg}/kg
                          </td>
                          <td className="py-2.5 px-3 font-sans text-slate-500 text-[11px]">{uzh.grading}</td>
                          <td className="py-2.5 px-3 text-slate-400 text-[10px]">{uzh.date}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 4: STARTUP FEASIBILITY & THE DATA FLYWHEEL */}
          {/* ========================================================================= */}
          {activeTab === 'startup_flywheel' && (
            <div className="space-y-6">
              {/* Core Startup Flywheel Card */}
              <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 text-white p-6 sm:p-7 rounded-3xl border border-slate-700 shadow-md space-y-5">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                      STRATEGIC DEFENSIBILITY
                    </span>
                    <span className="text-xs text-slate-400">
                      The Long-Term Data Flywheel
                    </span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-white">
                    {lang === 'ta' ? STARTUP_STORY_FLYWHEEL.headlineTa : STARTUP_STORY_FLYWHEEL.headlineEn}
                  </h3>
                  <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                    {lang === 'ta' ? STARTUP_STORY_FLYWHEEL.coreThesisTa : STARTUP_STORY_FLYWHEEL.coreThesisEn}
                  </p>
                </div>

                {/* 4-Step Flywheel Pipeline */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2">
                  {STARTUP_STORY_FLYWHEEL.steps.map(step => (
                    <div
                      key={step.stepNumber}
                      className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col justify-between space-y-2 hover:bg-white/10 transition-colors"
                    >
                      <div className="flex items-center justify-between text-emerald-400 font-mono text-xs font-bold">
                        <span>Step 0{step.stepNumber}</span>
                        <ArrowRight className="w-3.5 h-3.5 opacity-60" />
                      </div>
                      <h4 className="font-bold text-white text-xs leading-tight">
                        {lang === 'ta' ? step.titleTa : step.titleEn}
                      </h4>
                      <p className="text-[11px] text-slate-300 leading-relaxed">
                        {lang === 'ta' ? step.descTa : step.descEn}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Data Authenticity & Feasibility Matrix Table */}
              <div className="bg-white rounded-2xl border-2 border-slate-200 p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div>
                    <h4 className="font-extrabold text-sm sm:text-base text-slate-900 flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-emerald-600" />
                      <span>Data Authenticity & Feasibility Matrix (Real vs Simulated)</span>
                    </h4>
                    <p className="text-xs text-slate-500">
                      Transparent accounting of what is field-counted/government-sourced vs what is simulated for prototype demonstration.
                    </p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px]">
                        <th className="py-2.5 px-3">Pillar / Item</th>
                        <th className="py-2.5 px-3">Classification</th>
                        <th className="py-2.5 px-3">Source & Collection Method</th>
                        <th className="py-2.5 px-3">Academic & Investor Defensibility</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {DATA_FEASIBILITY_PILLARS.map((p, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3 px-3 font-bold text-slate-900">
                            {p.item}
                          </td>
                          <td className="py-3 px-3">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                p.statusBadge === 'REAL'
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                  : 'bg-amber-100 text-amber-900 border border-amber-300'
                              }`}
                            >
                              {p.statusBadge}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-slate-600 font-medium">
                            <div>{p.sourceType}</div>
                            <span className="text-[11px] text-slate-500 block mt-0.5">
                              {p.howObtained}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-slate-600 text-[11px] leading-relaxed">
                            {p.whyDefensible}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 sm:px-6 py-3 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 shrink-0">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>
              {lang === 'ta'
                ? 'அரசு மண்டித் தரவு ஆரம்பத்தைத் தருகிறது; உங்கள் சொந்த வியாபாரித் தரவே நீண்டகால பலத்தைத் தருகிறது.'
                : 'Government data gets you started, but your own vendor-logged data is the long-term advantage.'}
            </span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition-colors shadow-xs"
          >
            {lang === 'ta' ? 'மூடு' : 'Done & Return to Stall'}
          </button>
        </div>
      </div>
    </div>
  );
};
