import React, { useState, useMemo } from 'react';
import {
  CommodityType,
  MandiPriceRecord,
  DailyStockLog,
  Language,
  ViewMode,
  DailyProfitEstimate
} from '../types';
import { COMMODITIES } from '../data/commodities';
import { PricingEngine } from '../services/pricing';
import { t, speakText } from '../utils/i18n';
import { SoundEffects } from '../utils/audioHaptics';
import {
  Coins,
  TrendingUp,
  Package,
  ArrowUpRight,
  ArrowDownRight,
  AlertTriangle,
  Volume2,
  RefreshCw,
  Calculator,
  Percent,
  Truck,
  CheckCircle2,
  Sparkles,
  Layers,
  ChevronDown,
  ChevronUp,
  Plus,
  Minus
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface DailyProfitCalculatorProps {
  mandiRecords: MandiPriceRecord[];
  vendorPrices: Record<CommodityType, number>;
  stockLogs: DailyStockLog[];
  onUpdateVendorPrice: (commodity: CommodityType, newPrice: number) => void;
  lang: Language;
  viewMode: ViewMode;
}

export const DailyProfitCalculator: React.FC<DailyProfitCalculatorProps> = ({
  mandiRecords,
  vendorPrices,
  stockLogs,
  onUpdateVendorPrice,
  lang,
  viewMode
}) => {
  const [calculationBasis, setCalculationBasis] = useState<'daily_arrival' | 'remaining_unsold'>('daily_arrival');
  const [includeWastage, setIncludeWastage] = useState<boolean>(true);
  const [customStock, setCustomStock] = useState<Partial<Record<CommodityType, number>>>({});
  const [freightPerKg, setFreightPerKg] = useState<number>(0);
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  // Calculate profit estimates reactively
  const profitEstimate: DailyProfitEstimate = useMemo(() => {
    return PricingEngine.calculateDailyProfitEstimate({
      vendorPrices,
      mandiRecords,
      stockLogs,
      calculationBasis,
      customStockOverrides: customStock,
      includeWastageAdjustment: includeWastage,
      freightPerKg
    });
  }, [vendorPrices, mandiRecords, stockLogs, calculationBasis, customStock, includeWastage, freightPerKg]);

  const hasCustomOverrides = Object.keys(customStock).length > 0;

  const handleStockChange = (commodity: CommodityType, delta: number) => {
    SoundEffects.playClick();
    const currentVal =
      customStock[commodity] !== undefined
        ? customStock[commodity]!
        : profitEstimate.items.find(i => i.commodity === commodity)?.stockKg || 0;

    const newVal = Math.max(0, currentVal + delta);
    setCustomStock(prev => ({ ...prev, [commodity]: newVal }));
  };

  const handleResetStock = () => {
    SoundEffects.playClick();
    setCustomStock({});
  };

  const handleApplyScenario = (multiplier: number) => {
    SoundEffects.playSuccess();
    confetti({ particleCount: 35, spread: 60, origin: { y: 0.7 } });
    const newOverrides: Partial<Record<CommodityType, number>> = {};
    profitEstimate.items.forEach(it => {
      newOverrides[it.commodity] = Math.round(it.stockKg * multiplier);
    });
    setCustomStock(newOverrides);
  };

  const handleVoiceProfitReport = () => {
    SoundEffects.playClick();
    const topItem = profitEstimate.items.find(i => i.commodity === profitEstimate.topProfitCommodity);
    const topName = lang === 'ta'
      ? (COMMODITIES[profitEstimate.topProfitCommodity]?.nameTa || profitEstimate.topProfitCommodity)
      : profitEstimate.topProfitCommodity;

    const lossCount = profitEstimate.lossRiskCommodities.length;

    let textEn = `Your estimated daily potential profit is Rs ${profitEstimate.totalPotentialProfit.toLocaleString()} across ${profitEstimate.totalStockKg} kg of produce. Return on investment is ${profitEstimate.overallRoiPercent}%. Top earning produce is ${topName} with Rs ${topItem?.potentialProfit.toLocaleString()} profit.`;
    let textTa = `இன்றைய மொத்த உத்தேச தினசரி லாபம் ரூபாய் ${profitEstimate.totalPotentialProfit.toLocaleString()}. மொத்த சரக்கு ${profitEstimate.totalStockKg} கிலோ. முதலீட்டு லாப விகிதம் ${profitEstimate.overallRoiPercent} சதவீதம். அதிக லாபம் தரும் காய்: ${topName}, ரூபாய் ${topItem?.potentialProfit.toLocaleString()}.`;

    if (lossCount > 0) {
      textEn += ` Warning: ${lossCount} vegetable is priced below wholesale mandi cost.`;
      textTa += ` எச்சரிக்கை: ${lossCount} காய்கறி மண்டி அடக்க விலையை விட குறைவாக விற்கப்படுகிறது.`;
    }

    speakText(lang === 'ta' ? textTa : textEn, lang);
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden transition-all">
      {/* Header Bar */}
      <div className="p-5 sm:p-6 bg-gradient-to-r from-emerald-900 via-slate-900 to-slate-950 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0 shadow-inner">
            <Coins className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-black text-white text-base sm:text-lg font-heading tracking-tight">
                {lang === 'ta'
                  ? 'தினசரி உத்தேச லாபக் கணிப்பான்'
                  : 'Potential Daily Profit Estimator'}
              </h3>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300 border border-emerald-400/30">
                LIVE ARBITRAGE
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5 max-w-xl">
              {lang === 'ta'
                ? 'தற்போதைய மண்டி மொத்த விலைக்கு எதிராக உங்கள் கடை விற்பனை விலை மற்றும் இருப்பு எடையை ஒப்பிட்டு உத்தேச லாபத்தை கணக்கிடுகிறது.'
                : 'Projects daily net revenue & profit by evaluating wholesale auction rates against your stall prices and active stock.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto justify-end flex-wrap">
          <button
            onClick={handleVoiceProfitReport}
            className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold border border-white/10 transition-colors shadow-xs"
            title="Readout Profit Briefing"
          >
            <Volume2 className="w-4 h-4 text-emerald-400" />
            <span>{lang === 'ta' ? 'குரல் வழிகாட்டி' : 'Voice Report'}</span>
          </button>

          <button
            onClick={() => {
              SoundEffects.playClick();
              setIsExpanded(!isExpanded);
            }}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/15 text-slate-300 hover:text-white border border-white/10 transition-colors"
            aria-label="Toggle section"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="p-5 sm:p-6 space-y-6">
          {/* Top Control Strip & Simulation Presets */}
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 p-4 bg-slate-50/80 rounded-2xl border border-slate-200/70">
            {/* Calculation Basis Switcher */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-slate-700">
                {lang === 'ta' ? 'கணிப்பு அடிப்படை:' : 'Basis:'}
              </span>
              <div className="inline-flex rounded-xl bg-slate-200/80 p-1 text-xs">
                <button
                  onClick={() => {
                    SoundEffects.playClick();
                    setCalculationBasis('daily_arrival');
                  }}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                    calculationBasis === 'daily_arrival'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Truck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{lang === 'ta' ? 'முழு வரவு சரக்கு (Arrival)' : 'Full Procured Arrival'}</span>
                </button>
                <button
                  onClick={() => {
                    SoundEffects.playClick();
                    setCalculationBasis('remaining_unsold');
                  }}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                    calculationBasis === 'remaining_unsold'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Package className="w-3.5 h-3.5 text-indigo-600" />
                  <span>{lang === 'ta' ? 'மீதமுள்ள இருப்பு (Unsold)' : 'Remaining Stock On Hand'}</span>
                </button>
              </div>
            </div>

            {/* Quick Adjustments & Wastage Factor */}
            <div className="flex items-center gap-3 flex-wrap">
              <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={includeWastage}
                  onChange={e => {
                    SoundEffects.playClick();
                    setIncludeWastage(e.target.checked);
                  }}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                />
                <span>{lang === 'ta' ? 'சேதாரம்/கழிவு கழிப்பு (~3-5%)' : 'Deduct Spoilage / Shrinkage'}</span>
              </label>

              {hasCustomOverrides && (
                <button
                  onClick={handleResetStock}
                  className="text-xs font-bold text-slate-500 hover:text-rose-600 underline flex items-center gap-1 transition-colors"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>{lang === 'ta' ? 'அசல் அளவுக்கு மாற்று' : 'Reset to Logs'}</span>
                </button>
              )}
            </div>
          </div>

          {/* KPI BENTO SUMMARY CARDS */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
            {/* KPI 1: Total Daily Profit */}
            <div
              className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                profitEstimate.totalPotentialProfit >= 0
                  ? 'bg-gradient-to-br from-emerald-50/80 to-teal-50/40 border-emerald-200/80'
                  : 'bg-gradient-to-br from-rose-50/80 to-amber-50/40 border-rose-200/80'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  {lang === 'ta' ? 'உத்தேச நிகர லாபம்' : 'Projected Daily Profit'}
                </span>
                <span
                  className={`p-1.5 rounded-lg ${
                    profitEstimate.totalPotentialProfit >= 0
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-rose-100 text-rose-700'
                  }`}
                >
                  {profitEstimate.totalPotentialProfit >= 0 ? (
                    <ArrowUpRight className="w-4 h-4" />
                  ) : (
                    <ArrowDownRight className="w-4 h-4" />
                  )}
                </span>
              </div>
              <div
                className={`text-2xl sm:text-3xl font-black mt-2 font-mono ${
                  profitEstimate.totalPotentialProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'
                }`}
              >
                {profitEstimate.totalPotentialProfit >= 0 ? '+' : ''}₹
                {profitEstimate.totalPotentialProfit.toLocaleString()}
              </div>
              <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                <span>
                  {calculationBasis === 'daily_arrival'
                    ? (lang === 'ta' ? 'இன்றைய வரவு அடிப்படையில்' : 'Across full daily lot')
                    : (lang === 'ta' ? 'இருப்பு விற்றால் கிடைக்கும்' : 'If remaining stock sells')}
                </span>
              </div>
            </div>

            {/* KPI 2: Overall Return on Investment */}
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-indigo-50/80 to-blue-50/40 border border-indigo-200/80">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  {lang === 'ta' ? 'முதலீட்டு லாப விகிதம் (ROI)' : 'Overall Profit Margin'}
                </span>
                <span className="p-1.5 rounded-lg bg-indigo-100 text-indigo-700">
                  <Percent className="w-4 h-4" />
                </span>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-indigo-800 mt-2 font-mono">
                {profitEstimate.overallRoiPercent >= 0 ? '+' : ''}
                {profitEstimate.overallRoiPercent}%
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                {lang === 'ta' ? 'மண்டி அடக்கத்தின் மீதான லாபம்' : 'Markup over Mandi wholesale'}
              </div>
            </div>

            {/* KPI 3: Stock Volume in Play */}
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-amber-50/80 to-orange-50/40 border border-amber-200/80">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  {lang === 'ta' ? 'சரக்கு எடை' : 'Total Stock in Play'}
                </span>
                <span className="p-1.5 rounded-lg bg-amber-100 text-amber-700">
                  <Package className="w-4 h-4" />
                </span>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-amber-900 mt-2 font-mono">
                {profitEstimate.totalStockKg}{' '}
                <span className="text-base font-bold text-amber-700">kg</span>
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                {hasCustomOverrides ? (
                  <span className="text-amber-700 font-semibold">
                    {lang === 'ta' ? 'மாற்றியமைக்கப்பட்ட எடை' : 'Custom simulation weight'}
                  </span>
                ) : (
                  <span>{lang === 'ta' ? 'பதிவேட்டில் உள்ள எடை' : 'Pulled from verified logs'}</span>
                )}
              </div>
            </div>

            {/* KPI 4: Top Profit Commodity */}
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-slate-50 to-emerald-50/40 border border-slate-200">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  {lang === 'ta' ? 'அதிக லாபம் தரும் காய்' : 'Top Earning Produce'}
                </span>
                <span className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700">
                  <Sparkles className="w-4 h-4" />
                </span>
              </div>
              <div className="text-xl sm:text-2xl font-black text-slate-900 mt-2 flex items-center gap-1.5 truncate">
                <span className="text-2xl">
                  {COMMODITIES[profitEstimate.topProfitCommodity]?.iconEmoji}
                </span>
                <span className="truncate">
                  {lang === 'ta'
                    ? COMMODITIES[profitEstimate.topProfitCommodity]?.nameTa
                    : profitEstimate.topProfitCommodity}
                </span>
              </div>
              <div className="text-[11px] text-emerald-700 font-bold mt-1 font-mono">
                +₹
                {profitEstimate.items
                  .find(i => i.commodity === profitEstimate.topProfitCommodity)
                  ?.potentialProfit.toLocaleString()}{' '}
                profit
              </div>
            </div>
          </div>

          {/* Loss Warning Banner if Any Produce is Underpriced */}
          {profitEstimate.lossRiskCommodities.length > 0 && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-xs">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-black text-rose-900 uppercase tracking-wider">
                  {lang === 'ta' ? 'நஷ்ட அபாய எச்சரிக்கை!' : 'Cost Deficit Warning!'}
                </span>
                <p className="text-rose-800 mt-0.5">
                  {lang === 'ta'
                    ? `பின்வரும் காய்கறிகள் மண்டி மொத்த கொள்முதல் விலையை விட குறைவாக விற்கப்படுகின்றன: ${profitEstimate.lossRiskCommodities
                        .map(c => COMMODITIES[c]?.nameTa || c)
                        .join(', ')}. உடனடியாக விலையை உயர்த்தவும்.`
                    : `The following produce is currently priced at or below prevailing wholesale Mandi benchmark: ${profitEstimate.lossRiskCommodities.join(
                        ', '
                      )}. Consider adjusting stall retail prices upward.`}
                </p>
              </div>
            </div>
          )}

          {/* Visual Profit Contribution Stacked Bar */}
          {profitEstimate.totalPotentialProfit > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span className="font-bold flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-slate-600" />
                  {lang === 'ta' ? 'காய்கறி வாரியாக லாபப் பங்களிப்பு' : 'Profit Share by Commodity'}
                </span>
                <span className="font-mono text-[11px]">
                  Total: ₹{profitEstimate.totalPotentialProfit.toLocaleString()}
                </span>
              </div>

              <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
                {profitEstimate.items
                  .filter(it => it.potentialProfit > 0)
                  .map(it => {
                    const pct = Math.max(
                      3,
                      Math.round((it.potentialProfit / profitEstimate.totalPotentialProfit) * 100)
                    );
                    return (
                      <div
                        key={it.commodity}
                        style={{ width: `${pct}%` }}
                        className={`h-full transition-all relative group cursor-pointer ${
                          it.commodity === 'Tomato'
                            ? 'bg-rose-500'
                            : it.commodity === 'Onion'
                              ? 'bg-purple-500'
                              : it.commodity === 'Potato'
                                ? 'bg-amber-600'
                                : it.commodity === 'Brinjal'
                                  ? 'bg-indigo-500'
                                  : it.commodity === 'Cabbage'
                                    ? 'bg-emerald-500'
                                    : 'bg-orange-500'
                        }`}
                        title={`${it.commodity}: ₹${it.potentialProfit} (${pct}%)`}
                      />
                    );
                  })}
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-slate-600">
                {profitEstimate.items
                  .filter(it => it.potentialProfit > 0)
                  .map(it => (
                    <div key={it.commodity} className="flex items-center gap-1.5">
                      <span
                        className={`w-2.5 h-2.5 rounded-full ${
                          it.commodity === 'Tomato'
                            ? 'bg-rose-500'
                            : it.commodity === 'Onion'
                              ? 'bg-purple-500'
                              : it.commodity === 'Potato'
                                ? 'bg-amber-600'
                                : it.commodity === 'Brinjal'
                                  ? 'bg-indigo-500'
                                  : it.commodity === 'Cabbage'
                                    ? 'bg-emerald-500'
                                    : 'bg-orange-500'
                        }`}
                      />
                      <span>
                        {COMMODITIES[it.commodity]?.iconEmoji}{' '}
                        {lang === 'ta' ? COMMODITIES[it.commodity]?.nameTa : it.commodity}:
                      </span>
                      <span className="font-mono font-bold text-slate-900">
                        ₹{it.potentialProfit.toLocaleString()}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* DETAILED INTERACTIVE COMMODITY TABLE */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px]">
                  <th className="py-2.5 px-3">Produce</th>
                  <th className="py-2.5 px-3">
                    {calculationBasis === 'daily_arrival' ? 'Arrival (வரவு)' : 'Unsold (இருப்பு)'}
                  </th>
                  <th className="py-2.5 px-3">Mandi Buy (மொத்தம்)</th>
                  <th className="py-2.5 px-3">Stall Sell (சில்லறை)</th>
                  <th className="py-2.5 px-3">Margin / kg</th>
                  <th className="py-2.5 px-3 text-slate-600">Cost Outlay</th>
                  <th className="py-2.5 px-3 bg-emerald-50 text-emerald-900 font-bold">Est. Daily Profit</th>
                  <th className="py-2.5 px-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {profitEstimate.items.map(it => {
                  const cMeta = COMMODITIES[it.commodity];
                  const isModified = customStock[it.commodity] !== undefined;

                  return (
                    <tr key={it.commodity} className="hover:bg-slate-50/80 transition-colors">
                      {/* 1. Produce Name */}
                      <td className="py-3 px-3 font-semibold text-slate-900 flex items-center gap-2">
                        <span className="text-xl">{cMeta?.iconEmoji}</span>
                        <div>
                          <div className="font-bold">{lang === 'ta' ? cMeta?.nameTa : cMeta?.nameEn}</div>
                          <span className="text-[10px] text-slate-400 font-normal">{it.commodity}</span>
                        </div>
                      </td>

                      {/* 2. Stock Level (with interactive adjusters) */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleStockChange(it.commodity, -5)}
                            className="p-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                            title="-5 kg"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span
                            className={`font-mono font-bold text-xs min-w-[3rem] text-center ${
                              isModified ? 'text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded' : 'text-slate-800'
                            }`}
                          >
                            {it.stockKg} kg
                          </span>
                          <button
                            onClick={() => handleStockChange(it.commodity, +5)}
                            className="p-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                            title="+5 kg"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {calculationBasis === 'daily_arrival'
                            ? `Log: ${it.receivedKg}kg`
                            : `Log: ${it.unsoldKg}kg`}
                        </div>
                      </td>

                      {/* 3. Mandi Wholesale Buy Rate */}
                      <td className="py-3 px-3 font-mono text-slate-600 font-medium">
                        ₹{it.mandiWholesalePrice}/kg
                      </td>

                      {/* 4. Stall Selling Rate (with quick +/- price tweaks) */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => {
                              SoundEffects.playClick();
                              onUpdateVendorPrice(it.commodity, Math.max(1, it.vendorSellingPrice - 1));
                            }}
                            className="p-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                            title="-₹1"
                          >
                            <Minus className="w-2.5 h-2.5" />
                          </button>
                          <span className="font-mono font-bold text-slate-900 text-xs min-w-[2.5rem] text-center">
                            ₹{it.vendorSellingPrice}
                          </span>
                          <button
                            onClick={() => {
                              SoundEffects.playClick();
                              onUpdateVendorPrice(it.commodity, it.vendorSellingPrice + 1);
                            }}
                            className="p-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                            title="+₹1"
                          >
                            <Plus className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      </td>

                      {/* 5. Margin per kg */}
                      <td className="py-3 px-3 font-mono">
                        <div
                          className={`font-bold ${
                            it.grossMarginPerKg >= 0 ? 'text-emerald-700' : 'text-rose-600'
                          }`}
                        >
                          {it.grossMarginPerKg >= 0 ? '+' : ''}₹{it.grossMarginPerKg}/kg
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {it.grossMarginPercent >= 0 ? '+' : ''}
                          {it.grossMarginPercent}%
                        </div>
                      </td>

                      {/* 6. Total Wholesale Cost Outlay */}
                      <td className="py-3 px-3 font-mono text-slate-600">
                        ₹{it.wholesaleCost.toLocaleString()}
                      </td>

                      {/* 7. Estimated Daily Profit */}
                      <td className="py-3 px-3 bg-emerald-50/70 font-mono font-black text-sm">
                        <span
                          className={it.potentialProfit >= 0 ? 'text-emerald-800' : 'text-rose-700'}
                        >
                          {it.potentialProfit >= 0 ? '+' : ''}₹{it.potentialProfit.toLocaleString()}
                        </span>
                        <div className="text-[10px] font-normal text-emerald-900">
                          ROI: {it.roiPercent}%
                        </div>
                      </td>

                      {/* 8. Status Badge */}
                      <td className="py-3 px-3 text-right">
                        <span
                          className={`inline-block text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                            it.status === 'highly_profitable'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : it.status === 'moderate'
                                ? 'bg-teal-100 text-teal-800 border border-teal-200'
                                : it.status === 'thin_margin'
                                  ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                  : 'bg-rose-100 text-rose-800 border border-rose-200'
                          }`}
                        >
                          {it.status === 'highly_profitable'
                            ? (lang === 'ta' ? 'அதிக லாபம்' : 'High Margin')
                            : it.status === 'moderate'
                              ? (lang === 'ta' ? 'மிதமானது' : 'Moderate')
                              : it.status === 'thin_margin'
                                ? (lang === 'ta' ? 'மெலிதான லாபம்' : 'Thin Margin')
                                : (lang === 'ta' ? 'நஷ்ட அபாயம்' : 'Loss Risk')}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-slate-50 font-bold border-t-2 border-slate-200 text-slate-800">
                  <td className="py-3 px-3">{lang === 'ta' ? 'மொத்தம் (Total)' : 'Total Lot Summary'}</td>
                  <td className="py-3 px-3 font-mono">{profitEstimate.totalStockKg} kg</td>
                  <td className="py-3 px-3">—</td>
                  <td className="py-3 px-3">—</td>
                  <td className="py-3 px-3">—</td>
                  <td className="py-3 px-3 font-mono text-slate-700">
                    ₹{profitEstimate.totalWholesaleCost.toLocaleString()}
                  </td>
                  <td className="py-3 px-3 bg-emerald-100/70 font-mono font-black text-emerald-900 text-sm">
                    +₹{profitEstimate.totalPotentialProfit.toLocaleString()}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-emerald-800">
                    {profitEstimate.overallRoiPercent}% ROI
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Quick Simulation Presets */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs text-slate-500">
            <span className="font-semibold flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              {lang === 'ta' ? 'விரைவு சோதனை மாதிரிகள்:' : 'Simulate Scenarios:'}
            </span>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => handleApplyScenario(1.2)}
                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 font-bold text-slate-700 transition-colors"
              >
                +20% {lang === 'ta' ? 'வார இறுதி கூட்ட நெரிசல்' : 'Weekend Demand Surge'}
              </button>
              <button
                onClick={() => handleApplyScenario(1.5)}
                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 font-bold text-slate-700 transition-colors"
              >
                +50% {lang === 'ta' ? 'பண்டிகை கால வரவு' : 'Festival Lot (+50%)'}
              </button>
              <button
                onClick={() => handleApplyScenario(0.7)}
                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 font-bold text-slate-700 transition-colors"
              >
                -30% {lang === 'ta' ? 'மழைக்கால மந்தம்' : 'Rainy Day Lull'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
