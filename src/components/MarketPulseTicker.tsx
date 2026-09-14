import React from 'react';
import { CommodityType, MandiPriceRecord, Language } from '../types';
import { COMMODITIES } from '../data/commodities';
import { SoundEffects } from '../utils/audioHaptics';
import { TrendingUp, TrendingDown, Minus, Radio, ArrowRight } from 'lucide-react';

interface MarketPulseTickerProps {
  mandiRecords: MandiPriceRecord[];
  lang: Language;
  onSelectCommodity?: (comm: CommodityType) => void;
  selectedCommodity?: CommodityType;
}

export const MarketPulseTicker: React.FC<MarketPulseTickerProps> = ({
  mandiRecords,
  lang,
  onSelectCommodity,
  selectedCommodity
}) => {
  // Select top highlight records across prominent TN Mandis
  const highlightRecords = mandiRecords.slice(0, 8);

  const getPriceTrend = (record: MandiPriceRecord) => {
    // Simulated modal trend against midpoint
    const mid = (record.minPricePerKg + record.maxPricePerKg) / 2;
    if (record.modalPricePerKg > mid + 1) {
      return { dir: 'up', delta: `+₹${Math.round(record.modalPricePerKg - mid)}`, color: 'text-rose-600 bg-rose-50 border-rose-200' };
    } else if (record.modalPricePerKg < mid - 1) {
      return { dir: 'down', delta: `-₹${Math.round(mid - record.modalPricePerKg)}`, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' };
    }
    return { dir: 'steady', delta: 'Steady', color: 'text-slate-600 bg-slate-100 border-slate-200' };
  };

  return (
    <div className="bg-slate-900 text-white border-b border-slate-800 text-xs overflow-hidden select-none">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2 flex items-center gap-3">
        {/* Mandi Pulse Live Label */}
        <div className="flex items-center gap-2 shrink-0 pr-2 border-r border-slate-800">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="font-heading font-bold uppercase tracking-wider text-[11px] text-emerald-400 flex items-center gap-1">
            <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
            <span className="hidden sm:inline">Mandi Pulse</span>
            <span className="sm:hidden">Pulse</span>
          </span>
        </div>

        {/* Scrollable / Interactive Commodity Ticker Chips */}
        <div className="flex items-center gap-2.5 overflow-x-auto scrollbar-none py-0.5">
          {highlightRecords.map((rec) => {
            const meta = COMMODITIES[rec.commodity];
            if (!meta) return null;
            const trend = getPriceTrend(rec);
            const isSelected = selectedCommodity === rec.commodity;

            return (
              <button
                key={rec.id}
                onClick={() => {
                  SoundEffects.playClick();
                  if (onSelectCommodity) onSelectCommodity(rec.commodity);
                }}
                className={`flex items-center gap-2 px-2.5 py-1 rounded-lg border text-left transition-all shrink-0 cursor-pointer ${
                  isSelected
                    ? 'bg-emerald-950/80 border-emerald-500/80 text-white ring-1 ring-emerald-500/50'
                    : 'bg-slate-800/80 hover:bg-slate-800 border-slate-700/70 text-slate-200 hover:border-slate-600'
                }`}
                title={`Click to inspect ${meta.nameEn} pricing and stock details`}
              >
                <span className="text-sm shrink-0">{meta.iconEmoji}</span>
                <div className="flex items-baseline gap-1.5 leading-tight">
                  <span className="font-semibold text-white">
                    {lang === 'ta' ? meta.nameTa : meta.nameEn}
                  </span>
                  <span className="text-slate-400 text-[10px] hidden md:inline truncate max-w-[90px]">
                    {rec.market.replace(' Wholesale', '').replace(' Market', '')}
                  </span>
                  <span className="font-mono font-bold text-emerald-400 text-xs">
                    ₹{rec.modalPricePerKg}
                  </span>
                  <span className="text-[10px] text-slate-400">/kg</span>
                </div>

                <span
                  className={`text-[9px] font-bold px-1.5 py-0.5 rounded border leading-none flex items-center gap-0.5 ${trend.color}`}
                >
                  {trend.dir === 'up' && <TrendingUp className="w-2.5 h-2.5" />}
                  {trend.dir === 'down' && <TrendingDown className="w-2.5 h-2.5" />}
                  {trend.dir === 'steady' && <Minus className="w-2.5 h-2.5" />}
                  <span>{trend.delta}</span>
                </span>
              </button>
            );
          })}
        </div>

        {/* Quick hint tag on large screens */}
        <div className="hidden xl:flex items-center gap-1 text-[10px] text-slate-400 shrink-0 ml-auto pl-2 border-l border-slate-800">
          <span>Koyambedu • Madurai • Oddanchatram</span>
        </div>
      </div>
    </div>
  );
};
