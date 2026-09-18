import React, { useState } from 'react';
import {
  CommodityType,
  DailyStockLog,
  SurplusRescueMatch,
  BulkOrderBoardItem,
  VendorProfile,
  Language,
  ViewMode
} from '../types';
import { COMMODITIES } from '../data/commodities';
import { ResQService } from '../services/resq';
import { t, speakText } from '../utils/i18n';
import {
  Sparkles,
  AlertTriangle,
  Clock,
  Send,
  Building2,
  CheckCircle,
  ExternalLink,
  PhoneCall,
  Volume2,
  ArrowRight,
  TrendingDown,
  Info,
  Zap,
  Tag,
  CheckCircle2,
  PackageCheck
} from 'lucide-react';

interface ResQModuleProps {
  logs: DailyStockLog[];
  vendorPrices: Record<CommodityType, number>;
  vendorProfile: VendorProfile;
  bulkOrders: BulkOrderBoardItem[];
  onToggleClaimBulkOrder: (orderId: string) => void;
  lang: Language;
  viewMode: ViewMode;
  currentTimeHour?: number;
}

export const ResQModule: React.FC<ResQModuleProps> = ({
  logs,
  vendorPrices,
  vendorProfile,
  bulkOrders,
  onToggleClaimBulkOrder,
  lang,
  viewMode,
  currentTimeHour: propTimeHour
}) => {
  const [activeSubMode, setActiveSubMode] = useState<'surplus' | 'bulk'>('surplus');
  const [localTimeHour, setLocalTimeHour] = useState<number>(17.5); // 5:30 PM default
  const currentTimeHour = propTimeHour !== undefined ? propTimeHour : localTimeHour;

  // Filter latest daily logs per commodity
  const latestLogsMap: Record<CommodityType, DailyStockLog> = {} as any;
  logs.forEach(log => {
    if (!latestLogsMap[log.commodity] || new Date(log.date) > new Date(latestLogsMap[log.commodity].date)) {
      latestLogsMap[log.commodity] = log;
    }
  });

  const latestLogsList = Object.values(latestLogsMap);
  const surplusMatches: SurplusRescueMatch[] = ResQService.detectSurplusAlerts(
    latestLogsList,
    vendorPrices,
    vendorProfile,
    currentTimeHour
  );

  const handleVoiceSurplus = (match: SurplusRescueMatch) => {
    const meta = COMMODITIES[match.commodity];
    const name = lang === 'ta' ? meta.nameTa : meta.nameEn;
    const textEn = `Surplus alert for ${name}: ${match.unsoldKg} kg unsold. Suggested clearance price is Rs ${match.suggestedMarkdownPrice}/kg, saving Rs ${match.potentialSavedRupees}. Matched buyer: ${match.buyerName}.`;
    const textTa = `${name} மீதி எச்சரிக்கை: ${match.unsoldKg} கிலோ மீதம் உள்ளது. பரிந்துரைக்கப்படும் தள்ளுபடி விலை ₹${match.suggestedMarkdownPrice}/கிலோ. சேமிக்கக்கூடிய தொகை ₹${match.potentialSavedRupees}. வாங்குபவர்: ${match.buyerName}.`;
    speakText(lang === 'ta' ? textTa : textEn, lang);
  };

  return (
    <div className="space-y-6">
      {/* ResQ Hero Banner with Mode Selector */}
      <div className="bg-gradient-to-r from-amber-700 via-amber-800 to-amber-900 text-white rounded-3xl p-6 sm:p-7 shadow-md">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-white/15">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur flex items-center justify-center border border-white/15">
              <Zap className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
                  ResQ — {lang === 'ta' ? 'மீதி காய்கறி மீட்பு' : 'Surplus Produce Rescue'}
                </h2>
                <span className="text-[10px] font-semibold uppercase tracking-wider bg-white/15 px-2.5 py-0.5 rounded-md border border-white/20">
                  Zero Waste
                </span>
              </div>
              <p className="text-xs text-amber-200/90 mt-0.5">
                {lang === 'ta'
                  ? 'கடை அடைக்கும் முன் மீதி காய்கறிகளை தள்ளுபடியில் விற்று நஷ்டத்தை தவிருங்கள்'
                  : 'Clear surplus produce before closing to prevent spoilage and secure bulk buyers'}
              </p>
            </div>
          </div>

          {/* Time to close adjustment */}
          <div className="bg-black/25 px-3 py-2 rounded-xl border border-white/10 flex items-center gap-2 text-xs text-amber-100">
            <Clock className="w-4 h-4 text-amber-300" />
            <span>Market Closes: {vendorProfile.closingTimeStr}</span>
          </div>
        </div>

        {/* 2 Sub-Modes Tab Toggle */}
        <div className="grid grid-cols-2 gap-2 mt-5">
          <button
            onClick={() => setActiveSubMode('surplus')}
            className={`py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeSubMode === 'surplus'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'bg-white/10 text-white hover:bg-white/15'
            }`}
          >
            <Tag className="w-4 h-4 text-amber-600" />
            <span>{t(lang, 'clearanceSale')}</span>
            {surplusMatches.length > 0 && (
              <span className="bg-amber-100 text-amber-900 text-[10px] px-2 py-0.5 rounded-md font-semibold border border-amber-300">
                {surplusMatches.length} {lang === 'ta' ? 'சரக்குகள்' : 'Alerts'}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveSubMode('bulk')}
            className={`py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeSubMode === 'bulk'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'bg-white/10 text-white hover:bg-white/15'
            }`}
          >
            <Building2 className="w-4 h-4 text-emerald-600" />
            <span>{t(lang, 'bulkBoard')}</span>
            <span className="bg-emerald-100 text-emerald-900 text-[10px] px-2 py-0.5 rounded-md font-semibold border border-emerald-300">
              {bulkOrders.filter(o => o.claimedByVendor).length} Active
            </span>
          </button>
        </div>
      </div>

      {/* MODE (A): SURPLUS CLEARANCE SALE */}
      {activeSubMode === 'surplus' && (
        <div className="space-y-4">
          {surplusMatches.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-800 text-base">
                {lang === 'ta' ? 'அனைத்து சரக்கும் சீராக உள்ளது!' : 'No Surplus Excess Above 5kg!'}
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                {lang === 'ta'
                  ? 'உங்கள் தினசரி பதிவுகளில் 5 கிலோவுக்கு மேல் மீதி காய்கறி எதுவும் இல்லை. விற்பனை சிறப்பாக உள்ளது!'
                  : 'None of your logged commodities currently have unsold stock exceeding the 5kg threshold. All produce moving smoothly.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-rose-700 font-bold text-sm">
                  <AlertTriangle className="w-4 h-4" />
                  <span>
                    {surplusMatches.length} {lang === 'ta' ? 'காய்கறிகளில் மீதி எச்சரிக்கை (≥5 கிலோ)' : 'Surplus Alerts Detected (≥5kg)'}
                  </span>
                </div>
                <span className="text-xs text-slate-500">
                  {lang === 'ta' ? 'உடனடி வாட்ஸ்அப் இணைப்பு' : 'Direct WhatsApp pre-filled links'}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {surplusMatches.map(match => {
                  const meta = COMMODITIES[match.commodity];
                  const whatsappUrl = ResQService.createWhatsAppUrl(match, vendorProfile, lang);

                  return (
                    <div
                      key={match.id}
                      className="bg-white rounded-3xl border border-rose-200 p-5 shadow-xs flex flex-col justify-between relative overflow-hidden"
                    >
                      <div className="absolute top-0 right-0 w-24 h-24 bg-rose-50 rounded-full blur-2xl -z-10" />

                      <div>
                        {/* Header */}
                        <div className="flex items-start justify-between pb-3 border-b border-slate-100">
                          <div className="flex items-center gap-2.5">
                            <span className="text-3xl">{meta.iconEmoji}</span>
                            <div>
                              <h4 className="font-extrabold text-slate-900 text-base">
                                {lang === 'ta' ? meta.nameTa : meta.nameEn}
                              </h4>
                              <span className="text-xs text-rose-600 font-bold">
                                {match.unsoldKg} kg {lang === 'ta' ? 'விற்பனையாகாமல் உள்ளது' : 'unsold surplus'}
                              </span>
                            </div>
                          </div>

                          <button
                            onClick={() => handleVoiceSurplus(match)}
                            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600"
                            title="Listen"
                          >
                            <Volume2 className="w-4 h-4 text-emerald-600" />
                          </button>
                        </div>

                        {/* Price & Markdown details */}
                        <div className="grid grid-cols-2 gap-2 my-4">
                          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                            <span className="text-[10px] text-slate-500 font-semibold block">
                              Regular Stall Price
                            </span>
                            <span className="text-lg font-bold text-slate-500 line-through">
                              ₹{match.normalPricePerKg}/kg
                            </span>
                          </div>

                          <div className="bg-emerald-50 p-3 rounded-2xl border border-emerald-200">
                            <span className="text-[10px] text-emerald-800 font-bold block">
                              {t(lang, 'markdownSuggested')}
                            </span>
                            <div className="text-xl font-black text-emerald-700">
                              ₹{match.suggestedMarkdownPrice}
                              <span className="text-xs font-normal text-emerald-600">/kg</span>
                              <span className="text-[10px] ml-1.5 px-1.5 py-0.5 rounded-md bg-emerald-200/80 text-emerald-900 font-bold">
                                -{match.discountPercent}%
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Matched Nearby Buyer (Illustrative) */}
                        <div className="bg-amber-50/60 border border-amber-200/80 p-3.5 rounded-2xl mb-4 text-xs space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-amber-900 flex items-center gap-1.5">
                              <Building2 className="w-3.5 h-3.5 text-amber-700" />
                              {match.buyerName}
                            </span>
                            <span className="text-[10px] font-semibold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-md">
                              {match.distanceKm} km away
                            </span>
                          </div>
                          <p className="text-slate-600 text-[11px]">
                            {lang === 'ta'
                              ? `வகையறா: ${match.buyerType} • தேவை: ~${match.requiresKg} கிலோ • மாலைக்குள் பிக்கப்`
                              : `Category: ${match.buyerType} • Can absorb ~${match.requiresKg} kg before close`}
                          </p>
                          <div className="text-emerald-800 font-bold text-[11px] pt-1">
                            💰 {lang === 'ta' ? 'பாதுகாக்கப்படும் தொகை:' : 'Potential Saved Revenue:'} ₹{match.potentialSavedRupees}
                          </div>
                        </div>

                        {/* Technical view math */}
                        {viewMode === 'technical' && (
                          <div className="bg-slate-900 text-slate-200 p-3 rounded-xl font-mono text-[11px] mb-3 space-y-0.5">
                            <div className="text-emerald-400 font-bold">Dynamic Markdown Algorithm:</div>
                            <div className="text-slate-300">
                              Discount% = 15% + (4 - {match.timeToCloseHours}h)×5% + ({match.unsoldKg}kg/5)×4% = {match.discountPercent}%
                            </div>
                            <div className="text-slate-400">
                              P_markdown = ₹{match.normalPricePerKg} × (1 - {match.discountPercent / 100}) = ₹{match.suggestedMarkdownPrice}/kg
                            </div>
                          </div>
                        )}
                      </div>

                      {/* WhatsApp 1-tap Button */}
                      <a
                        href={whatsappUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs transition-colors"
                      >
                        <Send className="w-4 h-4" />
                        <span>{t(lang, 'sendWhatsApp')}</span>
                        <ExternalLink className="w-3.5 h-3.5 opacity-75" />
                      </a>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODE (B): BULK ORDERS BOARD */}
      {activeSubMode === 'bulk' && (
        <div className="space-y-4">
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-emerald-600" />
              <p className="text-xs text-slate-700 font-medium">
                {lang === 'ta'
                  ? 'இந்த ஆர்டர்களை நீங்கள் எடுக்கும் போது, அவை தானாகவே உங்கள் "சரக்கு (Stock)" தேவை கணிப்பில் சேர்க்கப்படும்!'
                  : 'When you claim recurring bulk orders, their daily quantity is automatically factored into your Stock forecast as pre-committed demand.'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {bulkOrders.map(order => {
              const meta = COMMODITIES[order.commodity];
              const isClaimed = order.claimedByVendor;
              const claimUrl = ResQService.createBulkClaimWhatsAppUrl(order, vendorProfile, lang);

              return (
                <div
                  key={order.id}
                  className={`bg-white rounded-3xl border p-5 shadow-xs flex flex-col justify-between transition-all ${
                    isClaimed
                      ? 'border-emerald-300 ring-2 ring-emerald-100 bg-emerald-50/20'
                      : 'border-slate-200'
                  }`}
                >
                  <div>
                    {/* Header */}
                    <div className="flex items-start justify-between pb-3 border-b border-slate-100">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-extrabold text-slate-900 text-base">
                            {order.institutionName}
                          </h4>
                        </div>
                        <span className="text-[11px] text-slate-500 font-medium">
                          {order.institutionType} • {order.location}
                        </span>
                      </div>

                      <span
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                          isClaimed
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {isClaimed ? '✓ Claimed by You' : 'Open Demand'}
                      </span>
                    </div>

                    {/* Commodity Requirement */}
                    <div className="flex items-center justify-between py-3.5">
                      <div className="flex items-center gap-2.5">
                        <span className="text-3xl">{meta.iconEmoji}</span>
                        <div>
                          <div className="font-bold text-sm text-slate-900">
                            {order.dailyRequirementKg} kg / day
                          </div>
                          <div className="text-xs text-slate-500">
                            {lang === 'ta' ? meta.nameTa : meta.nameEn} ({order.weeklySchedule})
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block font-medium">Target Price</span>
                        <span className="text-base font-black text-slate-900">
                          ₹{order.targetPricePerKg}/kg
                        </span>
                      </div>
                    </div>

                    <div className="bg-slate-50 p-2.5 rounded-xl text-xs text-slate-600 mb-4">
                      <span className="font-semibold text-slate-700">Notes:</span> {order.notes}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <button
                      onClick={() => onToggleClaimBulkOrder(order.id)}
                      className={`w-full py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-colors ${
                        isClaimed
                          ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                          : 'bg-slate-900 text-white hover:bg-slate-800'
                      }`}
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>
                        {isClaimed
                          ? lang === 'ta' ? 'ஆர்டர் சேர்க்கப்பட்டுள்ளது (நீக்க தட்டவும்)' : 'Order Added to Forecast (Tap to Unclaim)'
                          : t(lang, 'claimOrder')}
                      </span>
                    </button>

                    <a
                      href={claimUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2 px-3 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold text-xs flex items-center justify-center gap-1.5"
                    >
                      <PhoneCall className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Contact {order.contactPerson.split(' ')[0]} via WhatsApp</span>
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
