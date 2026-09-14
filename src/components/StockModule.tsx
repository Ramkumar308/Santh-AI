import React, { useState } from 'react';
import {
  CommodityType,
  DailyStockLog,
  BulkOrderBoardItem,
  Language,
  ViewMode,
  DemandForecast
} from '../types';
import { COMMODITIES } from '../data/commodities';
import { ForecastEngine } from '../services/forecast';
import { t, speakText } from '../utils/i18n';
import {
  TrendingUp,
  PlusCircle,
  Clock,
  CheckCircle2,
  Sliders,
  ChevronRight,
  Info,
  Package,
  Layers,
  Volume2
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { SoundEffects } from '../utils/audioHaptics';
import confetti from 'canvas-confetti';

interface StockModuleProps {
  logs: DailyStockLog[];
  onAddLog: (log: Omit<DailyStockLog, 'id'>) => void;
  bulkOrders: BulkOrderBoardItem[];
  lang: Language;
  viewMode: ViewMode;
}

export const StockModule: React.FC<StockModuleProps> = ({
  logs,
  onAddLog,
  bulkOrders,
  lang,
  viewMode
}) => {
  const [selectedCommodity, setSelectedCommodity] = useState<CommodityType>('Tomato');
  const [alpha, setAlpha] = useState<number>(0.45);
  const [isLogModalOpen, setIsLogModalOpen] = useState<boolean>(false);

  // Quick logging form state
  const [receivedKg, setReceivedKg] = useState<number>(45);
  const [soldKg, setSoldKg] = useState<number>(40);
  const [unsoldKg, setUnsoldKg] = useState<number>(4);
  const [wasteKg, setWasteKg] = useState<number>(1);
  const [notes, setNotes] = useState<string>('');

  // Compute forecast on actual history
  const forecast: DemandForecast = ForecastEngine.calculateForecast(
    selectedCommodity,
    logs,
    bulkOrders,
    alpha
  );

  const meta = COMMODITIES[selectedCommodity];
  const commodityLogs = logs
    .filter(l => l.commodity === selectedCommodity)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Chart data for Technical View
  const chartData = commodityLogs.map(l => ({
    date: l.date.slice(5), // MM-DD
    actualSold: l.soldKg,
    received: l.receivedKg,
    unsold: l.unsoldKg
  }));

  // Append forecast day
  if (chartData.length > 0) {
    chartData.push({
      date: 'Tomorrow (F)',
      actualSold: forecast.totalForecastKg,
      received: forecast.totalForecastKg,
      unsold: 0
    });
  }

  const handleSaveLog = (e: React.FormEvent) => {
    e.preventDefault();
    const today = new Date().toISOString().split('T')[0];
    onAddLog({
      date: today,
      commodity: selectedCommodity,
      receivedKg,
      soldKg,
      unsoldKg,
      wasteKg,
      vendorNotes: notes.trim() || undefined
    });
    SoundEffects.playSuccess();
    confetti({ particleCount: 45, spread: 65, origin: { y: 0.65 } });
    setIsLogModalOpen(false);
  };

  const handleVoiceAdvice = () => {
    SoundEffects.playClick();
    const text = lang === 'ta' ? forecast.simpleAdviceTa : forecast.simpleAdviceEn;
    speakText(text, lang);
  };

  return (
    <div className="space-y-6">
      {/* Commodity Selector Chips (Large Tap Targets) */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
        {(Object.keys(COMMODITIES) as CommodityType[]).map(comm => {
          const cMeta = COMMODITIES[comm];
          const isSelected = selectedCommodity === comm;
          const commUnsold = logs
            .filter(l => l.commodity === comm)
            .slice(-1)[0]?.unsoldKg || 0;

          return (
            <button
              key={comm}
              id={`stock-chip-${comm.toLowerCase()}`}
              onClick={() => {
                SoundEffects.playClick();
                setSelectedCommodity(comm);
              }}
              className={`flex items-center gap-2.5 px-4 py-2.5 rounded-2xl border transition-all shrink-0 min-h-[50px] ${
                isSelected
                  ? 'bg-slate-900 text-white border-slate-900 shadow-md font-bold'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <span className="text-2xl">{cMeta.iconEmoji}</span>
              <div className="text-left">
                <div className="text-sm leading-tight">
                  {lang === 'ta' ? cMeta.nameTa : cMeta.nameEn}
                </div>
                <div className="text-[11px] opacity-75">
                  {lang === 'ta' ? cMeta.nameEn : cMeta.nameTa}
                </div>
              </div>
              {commUnsold >= 5 && (
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" title="Surplus stock" />
              )}
            </button>
          );
        })}
      </div>

      {/* Primary Forecast Card */}
      <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-7 shadow-xs relative overflow-hidden">
        {/* Background accent */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-50 rounded-full blur-3xl -z-10 pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="text-4xl p-2.5 rounded-2xl bg-emerald-50 border border-emerald-100">
              {meta.iconEmoji}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                  {lang === 'ta' ? meta.nameTa : meta.nameEn}
                </h2>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold">
                  {t(lang, 'buyTomorrow')}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {lang === 'ta'
                  ? `கடந்த ${forecast.historyDays} நாள் சந்தை விற்பனை அடிப்படையில் கணக்கிடப்பட்டது`
                  : `Computed from ${forecast.historyDays} days of actual logged market history`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Audio Speech Button */}
            <button
              onClick={handleVoiceAdvice}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700"
              title="Listen aloud"
            >
              <Volume2 className="w-4 h-4 text-emerald-600" />
              <span>{t(lang, 'voiceReadout')}</span>
            </button>

            {/* Quick Log Button */}
            <button
              id="open-log-modal-btn"
              onClick={() => setIsLogModalOpen(true)}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-xs transition-colors"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{t(lang, 'logTodayStock')}</span>
            </button>
          </div>
        </div>

        {/* View Mode Switcher: Simple vs Technical */}
        {viewMode === 'simple' ? (
          /* SIMPLE VIEW: Visual, Large Numbers, Low-literacy friendly */
          <div className="pt-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Total Order Recommendation */}
              <div className="bg-emerald-700 text-white p-6 rounded-2xl shadow-sm flex flex-col justify-between">
                <div>
                  <span className="text-xs uppercase tracking-wider font-semibold opacity-85">
                    {t(lang, 'buyTomorrow')}
                  </span>
                  <div className="text-4xl sm:text-5xl font-black tracking-tight mt-1">
                    {forecast.totalForecastKg}{' '}
                    <span className="text-xl sm:text-2xl font-normal opacity-90">kg</span>
                  </div>
                </div>
                <div className="text-xs opacity-90 mt-4 pt-3 border-t border-emerald-600">
                  ± {forecast.errorMarginKg} kg {lang === 'ta' ? 'மாறுபடும் அளவு' : 'safe margin'}
                </div>
              </div>

              {/* Walk-in Demand Portion */}
              <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      {t(lang, 'walkInDemand')}
                    </span>
                    <span className="text-base">🛒</span>
                  </div>
                  <div className="text-3xl font-extrabold text-slate-900 mt-2">
                    {forecast.walkInForecastKg} <span className="text-base font-normal text-slate-500">kg</span>
                  </div>
                </div>
                <p className="text-xs text-slate-500 mt-3">
                  {lang === 'ta'
                    ? 'தினசரி கடைக்கு வரும் சில்லறை வாங்குபவர்கள் தேவை'
                    : 'Estimated direct walk-in retail buyer demand'}
                </p>
              </div>

              {/* Pre-committed Institutional Demand (from ResQ bulk board) */}
              <div className="bg-indigo-50/70 border border-indigo-200 p-5 rounded-2xl flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-indigo-700 uppercase tracking-wider">
                      {t(lang, 'precommittedBulk')}
                    </span>
                    <span className="text-base">🏢</span>
                  </div>
                  <div className="text-3xl font-extrabold text-indigo-900 mt-2">
                    {forecast.precommittedBulkKg} <span className="text-base font-normal text-indigo-600">kg</span>
                  </div>
                </div>
                <p className="text-xs text-indigo-700 mt-3">
                  {forecast.precommittedBulkKg > 0
                    ? lang === 'ta'
                      ? 'ResQ பலகையில் நீங்கள் எடுத்த உறுதிப்படுத்தப்பட்ட ஹோட்டல் ஆர்டர்'
                      : 'Committed institutional bulk orders claimed on ResQ board'
                    : lang === 'ta'
                      ? 'இன்னும் மொத்த ஆர்டர்கள் எடுக்கப்படவில்லை (ResQ பலகையை பார்க்கவும்)'
                      : 'No bulk orders claimed yet. See ResQ module to add.'}
                </p>
              </div>
            </div>

            {/* Plain language guidance card */}
            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 flex items-start gap-3">
              <span className="text-2xl mt-0.5">💡</span>
              <div className="text-sm text-amber-950 font-medium leading-relaxed">
                {lang === 'ta' ? forecast.simpleAdviceTa : forecast.simpleAdviceEn}
              </div>
            </div>
          </div>
        ) : (
          /* TECHNICAL VIEW: Real Time-series Exponential Smoothing math & formula */
          <div className="pt-6 space-y-6">
            <div className="bg-slate-900 text-slate-100 p-5 rounded-2xl">
              <div className="flex items-center justify-between gap-4 pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono uppercase text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-md">
                    Method: Single Exponential Smoothing
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <Sliders className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-slate-300">α = {alpha.toFixed(2)}</span>
                </div>
              </div>

              {/* Formula rendering */}
              <div className="py-3 font-mono text-sm sm:text-base text-emerald-300 overflow-x-auto">
                {forecast.mathFormula}
              </div>

              {/* Alpha slider to adjust sensitivity interactively */}
              <div className="mt-3 pt-3 border-t border-slate-800 flex flex-col sm:flex-row items-start sm:items-center gap-3 text-xs text-slate-400">
                <span>Adjust Smoothing Parameter (α):</span>
                <input
                  type="range"
                  min="0.1"
                  max="0.9"
                  step="0.05"
                  value={alpha}
                  onChange={e => setAlpha(parseFloat(e.target.value))}
                  className="w-48 accent-emerald-500 cursor-pointer"
                />
                <span className="text-slate-400">
                  (Higher α = faster reaction to yesterday; Lower α = smoother average)
                </span>
              </div>
            </div>

            {/* Step-by-Step Breakdown Table */}
            <div className="border border-slate-200 rounded-2xl overflow-hidden">
              <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200 font-semibold text-xs text-slate-700">
                {t(lang, 'forecastBreakdown')}
              </div>
              <div className="divide-y divide-slate-100 text-xs">
                {forecast.calculationBreakdown.map((item, idx) => (
                  <div key={idx} className="flex justify-between px-4 py-2.5">
                    <span className="text-slate-600 font-medium">{item.label}</span>
                    <span className="font-mono font-bold text-slate-900">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Historical vs Forecast Chart */}
            <div className="border border-slate-200 rounded-2xl p-4 bg-white">
              <div className="text-xs font-semibold text-slate-700 mb-3 flex items-center justify-between">
                <span>Daily Sales vs Tomorrow Forecast (kg)</span>
                <span className="text-[11px] text-slate-400 font-normal">Recharts Visualizer</span>
              </div>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 5, right: 15, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip contentStyle={{ borderRadius: '12px', fontSize: '12px' }} />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                    <Line
                      type="monotone"
                      dataKey="actualSold"
                      name="Sold / Demand (kg)"
                      stroke="#059669"
                      strokeWidth={2.5}
                      dot={{ r: 4 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="received"
                      name="Received (kg)"
                      stroke="#64748b"
                      strokeDasharray="4 4"
                      strokeWidth={1.5}
                    />
                    <Line
                      type="monotone"
                      dataKey="unsold"
                      name="Unsold (kg)"
                      stroke="#f43f5e"
                      strokeWidth={1.5}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Recent Log History Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-500" />
            <h3 className="font-bold text-sm sm:text-base text-slate-900">
              {lang === 'ta'
                ? `${meta.nameTa} - கடந்த விற்பனை பதிவுகள்`
                : `${meta.nameEn} - Recent Daily Logs`}
            </h3>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            {commodityLogs.length} {lang === 'ta' ? 'நாட்கள் பதிவு' : 'days recorded'}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-semibold">
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">{t(lang, 'receivedKg')}</th>
                <th className="py-2.5 px-3">{t(lang, 'soldKg')}</th>
                <th className="py-2.5 px-3">{t(lang, 'unsoldKg')}</th>
                <th className="py-2.5 px-3">{t(lang, 'wasteKg')}</th>
                <th className="py-2.5 px-3">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {commodityLogs.slice(-6).reverse().map(log => (
                <tr key={log.id} className="hover:bg-slate-50/80">
                  <td className="py-2.5 px-3 font-medium text-slate-900">{log.date}</td>
                  <td className="py-2.5 px-3">{log.receivedKg} kg</td>
                  <td className="py-2.5 px-3 font-semibold text-emerald-700">{log.soldKg} kg</td>
                  <td className="py-2.5 px-3">
                    <span
                      className={`px-2 py-0.5 rounded-full font-medium ${
                        log.unsoldKg >= 5
                          ? 'bg-rose-100 text-rose-800'
                          : log.unsoldKg > 0
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {log.unsoldKg} kg
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-rose-600 font-medium">{log.wasteKg} kg</td>
                  <td className="py-2.5 px-3 text-slate-500 italic max-w-xs truncate">
                    {log.vendorNotes || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Log Modal */}
      {isLogModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{meta.iconEmoji}</span>
                <h3 className="font-bold text-lg text-slate-900">
                  {t(lang, 'logTodayStock')} — {lang === 'ta' ? meta.nameTa : meta.nameEn}
                </h3>
              </div>
              <button
                onClick={() => setIsLogModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveLog} className="space-y-4 pt-4">
              {/* Received */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t(lang, 'receivedKg')}
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setReceivedKg(Math.max(5, receivedKg - 5))}
                    className="w-10 h-10 rounded-xl bg-slate-100 text-slate-800 font-bold hover:bg-slate-200"
                  >
                    -5
                  </button>
                  <input
                    type="number"
                    value={receivedKg}
                    onChange={e => setReceivedKg(Number(e.target.value))}
                    className="w-full text-center py-2 px-3 border border-slate-200 rounded-xl font-bold text-base"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setReceivedKg(receivedKg + 5)}
                    className="w-10 h-10 rounded-xl bg-slate-100 text-slate-800 font-bold hover:bg-slate-200"
                  >
                    +5
                  </button>
                </div>
              </div>

              {/* Sold */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t(lang, 'soldKg')}
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSoldKg(Math.max(0, soldKg - 5))}
                    className="w-10 h-10 rounded-xl bg-slate-100 text-slate-800 font-bold hover:bg-slate-200"
                  >
                    -5
                  </button>
                  <input
                    type="number"
                    value={soldKg}
                    onChange={e => setSoldKg(Number(e.target.value))}
                    className="w-full text-center py-2 px-3 border border-slate-200 rounded-xl font-bold text-base text-emerald-700"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setSoldKg(soldKg + 5)}
                    className="w-10 h-10 rounded-xl bg-slate-100 text-slate-800 font-bold hover:bg-slate-200"
                  >
                    +5
                  </button>
                </div>
              </div>

              {/* Unsold */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t(lang, 'unsoldKg')}
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setUnsoldKg(Math.max(0, unsoldKg - 1))}
                    className="w-10 h-10 rounded-xl bg-slate-100 text-slate-800 font-bold hover:bg-slate-200"
                  >
                    -1
                  </button>
                  <input
                    type="number"
                    value={unsoldKg}
                    onChange={e => setUnsoldKg(Number(e.target.value))}
                    className="w-full text-center py-2 px-3 border border-slate-200 rounded-xl font-bold text-base text-amber-700"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setUnsoldKg(unsoldKg + 1)}
                    className="w-10 h-10 rounded-xl bg-slate-100 text-slate-800 font-bold hover:bg-slate-200"
                  >
                    +1
                  </button>
                </div>
                {unsoldKg >= 5 && (
                  <p className="text-[11px] text-rose-600 font-semibold mt-1">
                    ⚠️ {unsoldKg} kg {t(lang, 'unsoldAboveLimit')}
                  </p>
                )}
              </div>

              {/* Waste / Spoilage */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t(lang, 'wasteKg')}
                </label>
                <input
                  type="number"
                  value={wasteKg}
                  onChange={e => setWasteKg(Number(e.target.value))}
                  className="w-full py-2 px-3 border border-slate-200 rounded-xl text-sm"
                  min="0"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Market Condition Notes (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Afternoon rain, wedding season, festival rush"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="w-full py-2 px-3 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsLogModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                >
                  {t(lang, 'saveLog')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
