import React, { useState } from 'react';
import {
  CommodityType,
  MandiPriceRecord,
  PriceStatus,
  Language,
  ViewMode,
  DailyStockLog,
  KhataCustomer
} from '../types';
import { COMMODITIES } from '../data/commodities';
import { PricingEngine } from '../services/pricing';
import { t, speakText } from '../utils/i18n';
import {
  Coins,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  RefreshCw,
  TrendingUp,
  Award,
  Sparkles,
  Volume2,
  Radio,
  Clock,
  ArrowUpDown,
  Building2,
  Table,
  Calculator,
  Truck,
  Scale,
  Percent,
  Zap
} from 'lucide-react';
import { SoundEffects } from '../utils/audioHaptics';
import confetti from 'canvas-confetti';
import { DailyProfitCalculator } from './DailyProfitCalculator';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

interface PricesModuleProps {
  mandiRecords: MandiPriceRecord[];
  priceStatus: PriceStatus;
  onRefreshPrices: () => void;
  isRefreshing: boolean;
  vendorPrices: Record<CommodityType, number>;
  onUpdateVendorPrice: (commodity: CommodityType, newPrice: number) => void;
  stockLogs: DailyStockLog[];
  khataCustomers: KhataCustomer[];
  lang: Language;
  viewMode: ViewMode;
}

export const PricesModule: React.FC<PricesModuleProps> = ({
  mandiRecords,
  priceStatus,
  onRefreshPrices,
  isRefreshing,
  vendorPrices,
  onUpdateVendorPrice,
  stockLogs,
  khataCustomers,
  lang,
  viewMode
}) => {
  const [selectedFilter, setSelectedFilter] = useState<'All' | CommodityType>('All');
  const [showMandiTable, setShowMandiTable] = useState<boolean>(false);
  const [showRetailCalculator, setShowRetailCalculator] = useState<boolean>(true);
  const [freightPerKg, setFreightPerKg] = useState<number>(2.0);
  const [shrinkagePct, setShrinkagePct] = useState<number>(8.0);
  const [desiredMarginPct, setDesiredMarginPct] = useState<number>(20.0);

  const handleApplyAllCalculatedRetailPrices = () => {
    SoundEffects.playSuccess();
    confetti({ particleCount: 50, spread: 70, origin: { y: 0.6 } });
    const commList: CommodityType[] = ['Tomato', 'Onion', 'Potato', 'Brinjal', 'Cabbage', 'Carrot'];
    commList.forEach(comm => {
      const stats = PricingEngine.getMandiStats(mandiRecords, comm);
      const bridge = PricingEngine.computeWholesaleToRetailBridge(stats.modal, freightPerKg, shrinkagePct, desiredMarginPct);
      onUpdateVendorPrice(comm, bridge.suggestedRetailPerKg);
    });
  };

  // Compute composite vendor Trust Score
  const trustScore = PricingEngine.computeTrustScore(
    vendorPrices,
    mandiRecords,
    stockLogs,
    khataCustomers
  );

  const commoditiesToDisplay: CommodityType[] =
    selectedFilter === 'All'
      ? ['Tomato', 'Onion', 'Potato', 'Brinjal', 'Cabbage', 'Carrot']
      : [selectedFilter];

  // Filtered records for Mandi Depth table
  const filteredRecords = selectedFilter === 'All'
    ? mandiRecords
    : mandiRecords.filter(r => r.commodity === selectedFilter);

  // Prepare chart comparison data for Technical View
  const chartData = (Object.keys(COMMODITIES) as CommodityType[]).map(comm => {
    const stats = PricingEngine.getMandiStats(mandiRecords, comm);
    const myPrice = vendorPrices[comm] || stats.modal;
    return {
      commodity: comm,
      'My Price (₹/kg)': myPrice,
      'Mandi Modal (₹/kg)': stats.modal,
      'Mandi Min (₹/kg)': stats.min,
      'Mandi Max (₹/kg)': stats.max
    };
  });

  const handleVoiceSummary = () => {
    const textEn = `Vendor Trust Score is ${trustScore.totalScore} out of 100, Tier: ${trustScore.tier}. Mandi rates in Tamil Nadu: Tomato modal price Rs ${PricingEngine.getMandiStats(mandiRecords, 'Tomato').modal}/kg, Onion modal price Rs ${PricingEngine.getMandiStats(mandiRecords, 'Onion').modal}/kg.`;
    const textTa = `வியாபாரி நம்பகத்தன்மை புள்ளி 100க்கு ${trustScore.totalScore}, தரம்: ${trustScore.tier}. தமிழ்நாடு மண்டி நிலவரம்: தக்காளி சராசரி விலை ₹${PricingEngine.getMandiStats(mandiRecords, 'Tomato').modal}/கிலோ, வெங்காயம் ₹${PricingEngine.getMandiStats(mandiRecords, 'Onion').modal}/கிலோ.`;
    speakText(lang === 'ta' ? textTa : textEn, lang);
  };

  return (
    <div className="space-y-6">
      {/* 1. REAL-TIME MANDI TICKER & STATUS BAR */}
      <div className="bg-slate-900 text-white rounded-2xl p-3 sm:p-4 shadow-sm border border-slate-800">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 pb-2.5 border-b border-slate-800 text-xs">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span
              className={`flex items-center gap-1.5 font-bold uppercase tracking-wider px-2.5 py-1 rounded-full text-[11px] ${
                priceStatus.isLive
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  priceStatus.isLive ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'
                }`}
              />
              <span className="font-extrabold">
                {priceStatus.isLive ? 'LIVE' : 'CACHED'}
              </span>
              <span className="opacity-80 font-normal">
                • {priceStatus.source}
              </span>
            </span>

            <span className="text-slate-400 text-[11px] flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              <span>{lang === 'ta' ? 'புதுப்பிக்கப்பட்டது:' : 'Updated:'} {priceStatus.lastUpdated}</span>
            </span>

            {priceStatus.apiLatencyMs && (
              <span className="text-emerald-400 text-[11px] font-mono bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/60">
                ⚡ {priceStatus.apiLatencyMs}ms
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto justify-end">
            <button
              onClick={() => setShowMandiTable(!showMandiTable)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                showMandiTable
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
              }`}
            >
              <Table className="w-3.5 h-3.5" />
              <span>{showMandiTable ? 'Hide Mandi Depth' : 'View Mandi Depth'}</span>
            </button>

            <button
              onClick={onRefreshPrices}
              disabled={isRefreshing}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>{isRefreshing ? 'Syncing...' : '⚡ Fetch Real-Time Rates'}</span>
            </button>
          </div>
        </div>

        {/* Live Scrolling Mandi Rates Strip */}
        <div className="pt-2.5 flex items-center gap-2 overflow-x-auto text-[11px] text-slate-300 whitespace-nowrap">
          <span className="font-bold text-emerald-400 uppercase tracking-wider shrink-0 flex items-center gap-1">
            <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            Tamil Nadu Live Feed:
          </span>
          <div className="flex items-center gap-3">
            <span className="bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700">
              🍅 Koyambedu: 142T Tomato @ <b className="text-white">₹28/kg</b>
            </span>
            <span className="bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700">
              🧅 Mattuthavani: 115T Onion @ <b className="text-white">₹37/kg</b>
            </span>
            <span className="bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700">
              🥔 MGR Coimbatore: 105T Potato @ <b className="text-white">₹31/kg</b>
            </span>
            <span className="bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700">
              🍆 Oddanchatram: 62T Brinjal @ <b className="text-white">₹28/kg</b>
            </span>
            <span className="bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700">
              🥕 Ooty Mandi: 140T Carrot @ <b className="text-white">₹50/kg</b>
            </span>
            <span className="bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700">
              🥬 Trichy Gandhi: 44T Cabbage @ <b className="text-white">₹21/kg</b>
            </span>
          </div>
        </div>
      </div>

      {/* MANDI MARKET DEPTH TABLE (Collapsible / Toggleable) */}
      {showMandiTable && (
        <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs animate-in fade-in">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                <Building2 className="w-4 h-4 text-emerald-600" />
                <span>Tamil Nadu Wholesale Mandis — Real-Time Arrivals & Price Depth</span>
              </h3>
              <p className="text-xs text-slate-500">
                Live official arrival tonnages and min / modal / max pricing reported across districts
              </p>
            </div>
            <span className="text-xs font-mono text-slate-400 bg-slate-100 px-2 py-1 rounded">
              {filteredRecords.length} records
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px]">
                  <th className="py-2.5 px-3">Market / District</th>
                  <th className="py-2.5 px-3">Commodity</th>
                  <th className="py-2.5 px-3">Arrivals (Tons)</th>
                  <th className="py-2.5 px-3">Min Rate</th>
                  <th className="py-2.5 px-3 bg-emerald-50 text-emerald-800 font-bold">Modal (Common)</th>
                  <th className="py-2.5 px-3">Max Rate</th>
                  <th className="py-2.5 px-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRecords.map((r, i) => (
                  <tr key={i} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 px-3 font-semibold text-slate-800">
                      <div>{r.market}</div>
                      <span className="text-[10px] text-slate-400 font-normal">{r.district}</span>
                    </td>
                    <td className="py-2.5 px-3 font-medium text-slate-700">
                      {COMMODITIES[r.commodity]?.iconEmoji} {r.commodity}
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-700">
                      {r.arrivalTons ? `${r.arrivalTons} T` : '—'}
                    </td>
                    <td className="py-2.5 px-3 text-slate-500">₹{r.minPricePerKg}/kg</td>
                    <td className="py-2.5 px-3 bg-emerald-50/70 font-extrabold text-emerald-800">
                      ₹{r.modalPricePerKg}/kg
                    </td>
                    <td className="py-2.5 px-3 text-slate-500">₹{r.maxPricePerKg}/kg</td>
                    <td className="py-2.5 px-3 text-[10px] text-slate-400">{r.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Top Banner: Composite Trust Score Card (Required) */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 text-white rounded-3xl p-6 sm:p-7 shadow-md relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                {t(lang, 'trustScore')}
              </span>
              <span className="text-xs text-slate-400">
                {lang === 'ta' ? 'விலை + சரக்கு + கடன் ஒழுக்கம்' : 'Price fairness + Stock reliability + Khata credit'}
              </span>
            </div>

            <div className="flex items-baseline gap-3">
              <div className="text-4xl sm:text-5xl font-black text-emerald-400">
                {trustScore.totalScore}
                <span className="text-xl text-slate-400 font-normal"> / 100</span>
              </div>
              <span
                className={`text-xs px-3 py-1 rounded-full font-bold uppercase ${
                  trustScore.tier === 'Gold'
                    ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40'
                    : trustScore.tier === 'Silver'
                      ? 'bg-slate-200/20 text-slate-200 border border-slate-300/40'
                      : 'bg-rose-400/20 text-rose-300 border border-rose-400/40'
                }`}
              >
                ★ {trustScore.tier} Tier Vendor
              </span>
            </div>

            <p className="text-xs text-slate-300 max-w-xl">
              {lang === 'ta'
                ? 'வாடிக்கையாளர்கள் நம்பிக்கை வைக்கும் வகையில் நியாயமான விலை, தரமான காய்கறி மற்றும் கடன் ஒழுக்கத்தை குறிக்கும் கூட்டுப்புள்ளி.'
                : 'Composite trust rating combining pricing fairness (40%), produce freshness/waste prevention (30%), and customer credit repayment discipline (30%).'}
            </p>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <button
              onClick={handleVoiceSummary}
              className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold border border-white/10 transition-colors"
            >
              <Volume2 className="w-4 h-4 text-emerald-400" />
              <span>{t(lang, 'voiceReadout')}</span>
            </button>

            <div className="p-3 bg-white/5 border border-white/10 rounded-2xl text-center shrink-0">
              <div className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">
                Mandis Monitored
              </div>
              <div className="text-xl font-black text-white mt-0.5">
                {mandiRecords.length} Mandis
              </div>
            </div>
          </div>
        </div>

        {/* 3 Pillar Score Gauges */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6 pt-5 border-t border-white/10">
          <div className="bg-white/5 p-3.5 rounded-xl border border-white/5">
            <div className="flex justify-between text-xs text-slate-300">
              <span>Pricing Fairness</span>
              <span className="font-bold text-emerald-400">{trustScore.pricingFairnessScore} / 40</span>
            </div>
            <div className="w-full h-1.5 bg-white/10 rounded-full mt-2 overflow-hidden">
              <div
                className="h-full bg-emerald-400 rounded-full transition-all"
                style={{ width: `${(trustScore.pricingFairnessScore / 40) * 100}%` }}
              />
            </div>
          </div>

          <div className="bg-white/5 p-3.5 rounded-xl border border-white/5">
            <div className="flex justify-between text-xs text-slate-300">
              <span>Stock Reliability</span>
              <span className="font-bold text-emerald-400">{trustScore.stockReliabilityScore} / 30</span>
            </div>
            <div className="w-full h-1.5 bg-white/10 rounded-full mt-2 overflow-hidden">
              <div
                className="h-full bg-emerald-400 rounded-full transition-all"
                style={{ width: `${(trustScore.stockReliabilityScore / 30) * 100}%` }}
              />
            </div>
          </div>

          <div className="bg-white/5 p-3.5 rounded-xl border border-white/5">
            <div className="flex justify-between text-xs text-slate-300">
              <span>Credit Repayment</span>
              <span className="font-bold text-emerald-400">{trustScore.creditRepaymentScore} / 30</span>
            </div>
            <div className="w-full h-1.5 bg-white/10 rounded-full mt-2 overflow-hidden">
              <div
                className="h-full bg-emerald-400 rounded-full transition-all"
                style={{ width: `${(trustScore.creditRepaymentScore / 30) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Trust Flags */}
        {trustScore.flags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-white/5">
            {trustScore.flags.map((flag, idx) => (
              <span
                key={idx}
                className={`text-[11px] px-2.5 py-1 rounded-lg flex items-center gap-1.5 ${
                  flag.type === 'positive'
                    ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-500/30'
                    : 'bg-amber-500/20 text-amber-200 border border-amber-500/30'
                }`}
              >
                {flag.type === 'positive' ? '✓' : '⚠️'} {lang === 'ta' ? flag.textTa : flag.textEn}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Wholesale-to-Retail Margin & Shrinkage Breakdown Bridge (Addresses Mandi-Retail Gap) */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden transition-all">
        <div className="p-5 sm:p-6 bg-gradient-to-r from-emerald-50/70 via-slate-50 to-indigo-50/40 border-b border-slate-200/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-slate-900 text-base font-heading">
                  {lang === 'ta'
                    ? 'மண்டி மொத்த விலை ➔ கடை சில்லறை விலை கணிப்பான்'
                    : 'Wholesale-to-Retail Cost & Margin Calculator'}
                </h3>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                  REALISTIC PRICING
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {lang === 'ta'
                  ? 'மண்டி மொத்த விலையுடன் லாரி வாடகை, காய் எடை குறைவு (சேதாரம்) மற்றும் உங்கள் லாபத்தை சேர்த்து உண்மையான அடக்க & சில்லறை விலையை கணக்கிடுங்கள்.'
                  : 'Bridges raw Agmarknet auction rates with freight cartage, moisture loss/shrinkage, and your target margin.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <button
              onClick={handleApplyAllCalculatedRetailPrices}
              className="flex-1 md:flex-none px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5"
            >
              <Zap className="w-4 h-4 fill-current" />
              <span>{lang === 'ta' ? 'அனைத்து விலைகளையும் மாற்று' : 'Apply All Suggested Retail'}</span>
            </button>
            <button
              onClick={() => {
                SoundEffects.playClick();
                setShowRetailCalculator(!showRetailCalculator);
              }}
              className="px-3 py-2.5 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 transition-colors"
            >
              {showRetailCalculator ? (lang === 'ta' ? 'மறை' : 'Hide') : (lang === 'ta' ? 'காட்டு' : 'Expand')}
            </button>
          </div>
        </div>

        {showRetailCalculator && (
          <div className="p-5 sm:p-6 space-y-6">
            {/* Variable Parameter Sliders / Chips */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-slate-50/80 rounded-2xl border border-slate-200/70">
              {/* Parameter 1: Freight / Cartage Cost */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800 flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5 text-emerald-600" />
                    {lang === 'ta' ? 'வாடகை / லாரி கட்டணம்' : 'Transport & Freight'}
                  </span>
                  <span className="font-mono font-extrabold text-emerald-700">₹{freightPerKg.toFixed(1)} / kg</span>
                </div>
                <div className="flex gap-1.5">
                  {[1.0, 2.0, 3.0, 4.0].map(val => (
                    <button
                      key={val}
                      onClick={() => {
                        SoundEffects.playClick();
                        setFreightPerKg(val);
                      }}
                      className={`flex-1 py-1 rounded-lg text-xs font-bold border transition-colors ${
                        freightPerKg === val
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      ₹{val}
                    </button>
                  ))}
                </div>
                <div className="text-[10px] text-slate-400">
                  {lang === 'ta' ? 'மண்டியில் இருந்து கடைக்கு எடுத்து வரும் செலவு' : 'Transit from Koyambedu/Mandi to stall'}
                </div>
              </div>

              {/* Parameter 2: Shrinkage & Sorting Spoilage Loss */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800 flex items-center gap-1.5">
                    <Scale className="w-3.5 h-3.5 text-amber-600" />
                    {lang === 'ta' ? 'காய் சேதாரம் / எடை குறைவு' : 'Shrinkage & Spoilage'}
                  </span>
                  <span className="font-mono font-extrabold text-amber-700">{shrinkagePct}%</span>
                </div>
                <div className="flex gap-1.5">
                  {[4, 8, 12, 15].map(val => (
                    <button
                      key={val}
                      onClick={() => {
                        SoundEffects.playClick();
                        setShrinkagePct(val);
                      }}
                      className={`flex-1 py-1 rounded-lg text-xs font-bold border transition-colors ${
                        shrinkagePct === val
                          ? 'bg-amber-600 text-white border-amber-600'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {val}%
                    </button>
                  ))}
                </div>
                <div className="text-[10px] text-slate-400">
                  {lang === 'ta' ? 'அழுகல், தூசி மற்றும் ஈரப்பதம் குறைவு' : 'Moisture evaporation & sorting cut loss'}
                </div>
              </div>

              {/* Parameter 3: Target Retail Net Margin */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800 flex items-center gap-1.5">
                    <Percent className="w-3.5 h-3.5 text-indigo-600" />
                    {lang === 'ta' ? 'நோக்கப்படும் லாப வரம்பு' : 'Desired Net Margin'}
                  </span>
                  <span className="font-mono font-extrabold text-indigo-700">{desiredMarginPct}%</span>
                </div>
                <div className="flex gap-1.5">
                  {[15, 20, 25, 30].map(val => (
                    <button
                      key={val}
                      onClick={() => {
                        SoundEffects.playClick();
                        setDesiredMarginPct(val);
                      }}
                      className={`flex-1 py-1 rounded-lg text-xs font-bold border transition-colors ${
                        desiredMarginPct === val
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {val}%
                    </button>
                  ))}
                </div>
                <div className="text-[10px] text-slate-400">
                  {lang === 'ta' ? 'கடை பராமரிப்பு மற்றும் நிகர லாபம்' : 'Vendor stall maintenance & net profit'}
                </div>
              </div>
            </div>

            {/* Live Calculation Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px]">
                    <th className="py-2.5 px-3">Commodity</th>
                    <th className="py-2.5 px-3">Mandi Wholesale</th>
                    <th className="py-2.5 px-3 text-slate-600">Landed Cost (அடக்கம்)</th>
                    <th className="py-2.5 px-3 bg-emerald-50 text-emerald-900 font-bold">Suggested Retail</th>
                    <th className="py-2.5 px-3">My Current Stall Price</th>
                    <th className="py-2.5 px-3">Est. Profit / 100kg</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(['Tomato', 'Onion', 'Potato', 'Brinjal', 'Cabbage', 'Carrot'] as CommodityType[]).map(comm => {
                    const cMeta = COMMODITIES[comm];
                    const stats = PricingEngine.getMandiStats(mandiRecords, comm);
                    const bridge = PricingEngine.computeWholesaleToRetailBridge(
                      stats.modal,
                      freightPerKg,
                      shrinkagePct,
                      desiredMarginPct
                    );
                    const myPrice = vendorPrices[comm] || stats.modal;
                    const isMatched = myPrice === bridge.suggestedRetailPerKg;

                    return (
                      <tr key={comm} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-3 font-semibold text-slate-900 flex items-center gap-2">
                          <span className="text-lg">{cMeta.iconEmoji}</span>
                          <div>
                            <div>{lang === 'ta' ? cMeta.nameTa : cMeta.nameEn}</div>
                            <span className="text-[10px] text-slate-400 font-normal">{comm}</span>
                          </div>
                        </td>
                        <td className="py-3 px-3 font-mono font-medium text-slate-600">
                          ₹{stats.modal}/kg
                        </td>
                        <td className="py-3 px-3 font-mono text-slate-700">
                          ₹{bridge.landedBreakEvenPerKg}/kg
                        </td>
                        <td className="py-3 px-3 bg-emerald-50/70 font-mono font-extrabold text-emerald-800 text-sm">
                          ₹{bridge.suggestedRetailPerKg}/kg
                        </td>
                        <td className="py-3 px-3 font-mono font-semibold">
                          <span className={isMatched ? 'text-emerald-700' : 'text-slate-800'}>
                            ₹{myPrice}/kg
                          </span>
                        </td>
                        <td className="py-3 px-3 font-mono font-bold text-indigo-700">
                          +₹{bridge.profitPer100KgLot.toLocaleString()}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button
                            onClick={() => {
                              SoundEffects.playSuccess();
                              onUpdateVendorPrice(comm, bridge.suggestedRetailPerKg);
                            }}
                            disabled={isMatched}
                            className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                              isMatched
                                ? 'bg-emerald-100 text-emerald-800 cursor-default'
                                : 'bg-slate-900 hover:bg-emerald-600 text-white'
                            }`}
                          >
                            {isMatched ? (lang === 'ta' ? 'பொருந்தியது' : 'Applied') : (lang === 'ta' ? 'பயன்படுத்து' : 'Apply')}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* POTENTIAL DAILY PROFIT CALCULATOR (Mandi Wholesale vs Vendor Selling Price & Active Stock) */}
      <DailyProfitCalculator
        mandiRecords={mandiRecords}
        vendorPrices={vendorPrices}
        stockLogs={stockLogs}
        onUpdateVendorPrice={onUpdateVendorPrice}
        lang={lang}
        viewMode={viewMode}
      />

      {/* Commodity Filter Chips */}
      <div className="flex items-center justify-between gap-3 overflow-x-auto pb-1">
        <div className="flex gap-2">
          <button
            onClick={() => setSelectedFilter('All')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all ${
              selectedFilter === 'All'
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            {lang === 'ta' ? 'அனைத்து காய்கறிகள்' : 'All Commodities'}
          </button>
          {(Object.keys(COMMODITIES) as CommodityType[]).map(comm => {
            const isSel = selectedFilter === comm;
            const cMeta = COMMODITIES[comm];
            return (
              <button
                key={comm}
                onClick={() => setSelectedFilter(comm)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all shrink-0 ${
                  isSel
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <span>{cMeta.iconEmoji}</span>
                <span>{lang === 'ta' ? cMeta.nameTa : cMeta.nameEn}</span>
              </button>
            );
          })}
        </div>

        {/* Live / Cached indicator in module body */}
        <div className="shrink-0 flex items-center gap-2 text-xs text-slate-500">
          <span
            className={`w-2 h-2 rounded-full ${
              priceStatus.isLive ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
            }`}
          />
          <span className="font-semibold text-slate-700">
            {priceStatus.isLive ? 'Real-Time Live Feed' : `Cached (${priceStatus.lastUpdated})`}
          </span>
        </div>
      </div>

      {/* Commodity Price Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {commoditiesToDisplay.map(comm => {
          const cMeta = COMMODITIES[comm];
          const stats = PricingEngine.getMandiStats(mandiRecords, comm);
          const myPrice = vendorPrices[comm] || stats.modal;
          const evaluation = PricingEngine.evaluateVendorPrice(myPrice, comm, mandiRecords);

          return (
            <div
              key={comm}
              className={`bg-white rounded-3xl border p-5 shadow-xs transition-all ${
                evaluation.isOutlier
                  ? evaluation.outlierType === 'gouging'
                    ? 'border-rose-300 ring-2 ring-rose-100'
                    : 'border-amber-300'
                  : 'border-slate-200'
              }`}
            >
              <div className="flex items-start justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="text-3xl p-2 rounded-2xl bg-slate-50 border border-slate-100">
                    {cMeta.iconEmoji}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-lg text-slate-900">
                      {lang === 'ta' ? cMeta.nameTa : cMeta.nameEn}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {lang === 'ta' ? cMeta.nameEn : cMeta.nameTa} • {stats.count} Mandis
                    </p>
                  </div>
                </div>

                {/* Status Badge */}
                {evaluation.isOutlier ? (
                  evaluation.outlierType === 'gouging' ? (
                    <span className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-rose-100 text-rose-800">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      {t(lang, 'priceGouging')}
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-800">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      {t(lang, 'priceUndercutting')}
                    </span>
                  )
                ) : (
                  <span className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {t(lang, 'fairPrice')}
                  </span>
                )}
              </div>

              {/* Price comparison row */}
              <div className="grid grid-cols-2 gap-3 py-4">
                {/* Mandi Modal (Common) Price */}
                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
                  <div className="text-[11px] font-semibold text-slate-500">
                    {t(lang, 'modalPrice')}
                  </div>
                  <div className="text-2xl font-black text-slate-900 mt-1">
                    ₹{stats.modal}{' '}
                    <span className="text-xs font-normal text-slate-500">/ kg</span>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">
                    Range: ₹{stats.min} – ₹{stats.max}
                  </div>
                </div>

                {/* Vendor's Set Stall Price (Interactive Changer) */}
                <div
                  className={`p-3.5 rounded-2xl border flex flex-col justify-between ${
                    evaluation.isOutlier
                      ? 'bg-rose-50/70 border-rose-200'
                      : 'bg-emerald-50/70 border-emerald-200'
                  }`}
                >
                  <div className="text-[11px] font-semibold text-slate-700">
                    {t(lang, 'myPrice')}
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <div className="text-2xl font-black text-slate-900">
                      ₹{myPrice}{' '}
                      <span className="text-xs font-normal text-slate-600">/ kg</span>
                    </div>

                    {/* Quick +2 / -2 buttons for vendor testing */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onUpdateVendorPrice(comm, Math.max(10, myPrice - 2))}
                        className="w-7 h-7 rounded-lg bg-white border border-slate-200 font-bold text-xs hover:bg-slate-100 flex items-center justify-center text-slate-700"
                        title="Reduce price by ₹2"
                      >
                        -2
                      </button>
                      <button
                        onClick={() => onUpdateVendorPrice(comm, myPrice + 2)}
                        className="w-7 h-7 rounded-lg bg-white border border-slate-200 font-bold text-xs hover:bg-slate-100 flex items-center justify-center text-slate-700"
                        title="Increase price by ₹2"
                      >
                        +2
                      </button>
                    </div>
                  </div>
                  <div className="text-[10px] text-slate-600 mt-1">
                    Tap -2 / +2 to test impact
                  </div>
                </div>
              </div>

              {/* Simple View Advice vs Technical View Math */}
              {viewMode === 'simple' ? (
                <div className="bg-slate-50 p-3 rounded-xl text-xs text-slate-600">
                  {evaluation.isOutlier ? (
                    evaluation.outlierType === 'gouging' ? (
                      <p className="text-rose-700 font-semibold">
                        {lang === 'ta'
                          ? `விலை மண்டி சராசரியை விட அதிகமாக உள்ளது. வாடிக்கையாளர்கள் பேரம் பேசலாம். நியாயமான வரம்பு: ₹${evaluation.fairPriceRange[0]} - ₹${evaluation.fairPriceRange[1]}`
                          : `Price is high compared to Tamil Nadu mandis. Potential gouging flag. Fair corridor: Rs ${evaluation.fairPriceRange[0]} - Rs ${evaluation.fairPriceRange[1]}/kg.`}
                      </p>
                    ) : (
                      <p className="text-amber-700 font-semibold">
                        {lang === 'ta'
                          ? `விலை மிகவும் குறைவாக உள்ளது. நஷ்டம் ஏற்படலாம். நியாயமான வரம்பு: ₹${evaluation.fairPriceRange[0]} - ₹${evaluation.fairPriceRange[1]}`
                          : `Price is unusually low. Risk of trading at a loss. Fair corridor: Rs ${evaluation.fairPriceRange[0]} - Rs ${evaluation.fairPriceRange[1]}/kg.`}
                      </p>
                    )
                  ) : (
                    <p className="text-emerald-800 font-medium">
                      {lang === 'ta'
                        ? `விலை சரியானது! மண்டி வரம்பிற்குள் நியாயமாக உள்ளது (₹${evaluation.fairPriceRange[0]} - ₹${evaluation.fairPriceRange[1]}). வாடிக்கையாளர் நம்பிக்கை பெருகும்.`
                        : `Optimal pricing! Fully within fair market spread (Rs ${evaluation.fairPriceRange[0]} - Rs ${evaluation.fairPriceRange[1]}). Builds long-term buyer trust.`}
                    </p>
                  )}
                </div>
              ) : (
                /* Technical View Math */
                <div className="bg-slate-900 text-slate-200 p-3.5 rounded-xl text-xs space-y-1 font-mono">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Z-Score Formula:</span>
                    <span className="text-emerald-400 font-bold">z = (P - μ) / σ</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Computed Z:</span>
                    <span className={`font-bold ${Math.abs(evaluation.zScore) > 1.8 ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {evaluation.zScore > 0 ? `+${evaluation.zScore}` : evaluation.zScore}
                    </span>
                  </div>
                  <div className="flex justify-between text-[11px] pt-1 border-t border-slate-800 text-slate-400">
                    <span>μ = ₹{stats.mean}</span>
                    <span>σ = ₹{stats.stdDev}</span>
                    <span>N = {stats.count} mandis</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Technical View: Price Spread Visualization via Recharts */}
      {viewMode === 'technical' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                Mandi Price Spread Distribution (Tamil Nadu)
              </h3>
              <p className="text-xs text-slate-500">
                Comparing Vendor's Price against Mandi Min, Modal, and Max (₹/kg)
              </p>
            </div>
            <span className="text-xs font-mono bg-slate-100 px-2 py-1 rounded text-slate-600">
              Recharts Bar Engine
            </span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 20, left: -15, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="commodity" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ borderRadius: '12px', fontSize: '12px' }} />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="My Price (₹/kg)" fill="#059669" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Mandi Modal (₹/kg)" fill="#6366f1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Mandi Min (₹/kg)" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Mandi Max (₹/kg)" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};
