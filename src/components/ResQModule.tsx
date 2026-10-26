import React, { useState, useEffect } from 'react';
import {
  CommodityType,
  DailyStockLog,
  SurplusRescueMatch,
  BulkOrderBoardItem,
  VendorProfile,
  Language,
  ViewMode,
  ResQUserRole,
  BuyerProfile,
  ResQLotItem
} from '../types';
import { COMMODITIES } from '../data/commodities';
import { ProduceBadge, ProduceIcon } from './ProduceBadge';
import { ResQService } from '../services/resq';
import { ResQSyncService, DEFAULT_BUYER_PROFILES } from '../services/resqSync';
import { ResQChatDrawer } from './ResQChatDrawer';
import { t, speakText } from '../utils/i18n';
import { SoundEffects } from '../utils/audioHaptics';
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
  PackageCheck,
  MessageSquare,
  Store,
  QrCode,
  PlusCircle,
  Radio,
  Users,
  Check
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
  userRole?: ResQUserRole;
  onChangeUserRole?: (role: ResQUserRole) => void;
  activeBuyer?: BuyerProfile;
  onChangeActiveBuyer?: (buyer: BuyerProfile) => void;
}

export const ResQModule: React.FC<ResQModuleProps> = ({
  logs,
  vendorPrices,
  vendorProfile,
  bulkOrders,
  onToggleClaimBulkOrder,
  lang,
  viewMode,
  currentTimeHour: propTimeHour,
  userRole = 'vendor',
  onChangeUserRole,
  activeBuyer = DEFAULT_BUYER_PROFILES[0],
  onChangeActiveBuyer
}) => {
  const [activeSubMode, setActiveSubMode] = useState<'surplus' | 'bulk'>('surplus');
  const [localTimeHour, setLocalTimeHour] = useState<number>(17.5); // 5:30 PM default
  const currentTimeHour = propTimeHour !== undefined ? propTimeHour : localTimeHour;

  // Real-time ResQ lots state
  const [lots, setLots] = useState<ResQLotItem[]>([]);
  const [activeChatLot, setActiveChatLot] = useState<ResQLotItem | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);

  // New surplus lot quick-creation modal state
  const [isNewLotModalOpen, setIsNewLotModalOpen] = useState(false);
  const [newLotCommodity, setNewLotCommodity] = useState<CommodityType>('Tomato');
  const [newLotKg, setNewLotKg] = useState<number>(15);
  const [newLotDiscount, setNewLotDiscount] = useState<number>(30);

  // Subscribe to real-time Firestore & multi-tab BroadcastChannel
  useEffect(() => {
    // Seed initial lots if cache is empty
    ResQSyncService.seedInitialLots(vendorProfile, logs, vendorPrices).then(initial => {
      if (initial && initial.length > 0) {
        setLots(initial);
      }
    });

    const unsubscribe = ResQSyncService.subscribeToLots((updatedLots) => {
      setLots(updatedLots);
      // Keep active chat lot updated in sync
      if (activeChatLot) {
        const found = updatedLots.find(l => l.id === activeChatLot.id);
        if (found) setActiveChatLot(found);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [vendorProfile, logs, vendorPrices]);

  const handleOpenChat = (lot: ResQLotItem) => {
    SoundEffects.playClick();
    setActiveChatLot(lot);
    setIsChatOpen(true);
  };

  const handleVoiceSurplus = (lot: ResQLotItem) => {
    const meta = COMMODITIES[lot.commodity];
    const name = lang === 'ta' ? meta.nameTa : meta.nameEn;
    const textEn = `Surplus lot for ${name}: ${lot.unsoldKg} kg available. Clearance markdown price is Rs ${lot.suggestedMarkdownPrice}/kg, save ${lot.discountPercent} percent. Matched vendor: ${lot.vendorName}.`;
    const textTa = `${name} மீதி எச்சரிக்கை: ${lot.unsoldKg} கிலோ மீதம் உள்ளது. தள்ளுபடி விலை ₹${lot.suggestedMarkdownPrice}/கிலோ (${lot.discountPercent}% தள்ளுபடி). கடை: ${lot.vendorName}.`;
    speakText(lang === 'ta' ? textTa : textEn, lang);
  };

  const handleCreateNewLot = async (e: React.FormEvent) => {
    e.preventDefault();
    const basePrice = vendorPrices[newLotCommodity] || 30;
    const suggestedMarkdownPrice = Math.max(8, Math.round(basePrice * (1 - newLotDiscount / 100)));
    const potentialSavedRupees = suggestedMarkdownPrice * newLotKg;

    const newLot: ResQLotItem = {
      id: `lot_${newLotCommodity.toLowerCase()}_${Date.now()}`,
      commodity: newLotCommodity,
      vendorName: vendorProfile.name,
      vendorStall: vendorProfile.stallNumber,
      vendorPhone: vendorProfile.phone,
      vendorVpa: `${vendorProfile.phone.slice(-10)}@okaxis`,
      unsoldKg: newLotKg,
      normalPricePerKg: basePrice,
      suggestedMarkdownPrice,
      discountPercent: newLotDiscount,
      status: 'available',
      createdAt: Date.now(),
      marketClosesAt: vendorProfile.closingTimeStr,
      potentialSavedRupees,
      lastMessagePreview: 'Fresh surplus clearance batch posted to market.'
    };

    await ResQSyncService.createLot(newLot);
    SoundEffects.playSuccess();
    setIsNewLotModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* ResQ Hero Banner with Role Switcher & Mode Selector */}
      <div className="bg-gradient-to-r from-amber-700 via-amber-800 to-amber-900 text-white rounded-3xl p-6 sm:p-7 shadow-md">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-white/15">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur flex items-center justify-center border border-white/15">
              <Zap className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
                  ResQ — {lang === 'ta' ? 'நேரலை மீதி காய்கறி மீட்பு & அரட்டை' : 'Surplus Rescue & Live Negotiation'}
                </h2>
                <span className="text-[10px] font-semibold uppercase tracking-wider bg-white/15 px-2.5 py-0.5 rounded-md border border-white/20">
                  Real-time
                </span>
              </div>
              <p className="text-xs text-amber-200/90 mt-0.5">
                {lang === 'ta'
                  ? 'விற்பனையாளர்கள் மற்றும் மொத்த வாங்குபவர்கள் (Hostel/Mess) இடையே நேரலை விலை பேரம், முன்பதிவு மற்றும் UPI பரிவர்த்தனை'
                  : 'Multi-user real-time negotiation, counter-offers, lot reservation, and payment settlement synced live'}
              </p>
            </div>
          </div>

          {/* Live Firestore Sync Status */}
          <div className="flex items-center gap-2">
            <div className="bg-black/30 px-3 py-1.5 rounded-xl border border-white/15 flex items-center gap-2 text-xs text-amber-100">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Live Sync Active</span>
            </div>

            <div className="bg-black/25 px-3 py-1.5 rounded-xl border border-white/10 flex items-center gap-2 text-xs text-amber-100">
              <Clock className="w-4 h-4 text-amber-300" />
              <span>Closes: {vendorProfile.closingTimeStr}</span>
            </div>
          </div>
        </div>

        {/* Multi-User Role Context Strip inside ResQ */}
        <div className="mt-4 p-3 rounded-2xl bg-black/20 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-amber-200 font-semibold flex items-center gap-1.5">
              <Users className="w-4 h-4 text-amber-300" />
              {lang === 'ta' ? 'உங்கள் பங்கு (Role):' : 'Active User View:'}
            </span>

            {/* Switchable Role Buttons */}
            <div className="bg-black/30 p-1 rounded-xl flex items-center gap-1 border border-white/10">
              <button
                onClick={() => {
                  SoundEffects.playClick();
                  onChangeUserRole && onChangeUserRole('vendor');
                }}
                className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  userRole === 'vendor'
                    ? 'bg-emerald-500 text-white shadow-xs'
                    : 'text-amber-200/80 hover:text-white'
                }`}
              >
                <Store className="w-3.5 h-3.5" />
                <span>{lang === 'ta' ? 'கடை விற்பனையாளர் (Vendor)' : 'Vendor (Stall)'}</span>
              </button>

              <button
                onClick={() => {
                  SoundEffects.playClick();
                  onChangeUserRole && onChangeUserRole('buyer');
                }}
                className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  userRole === 'buyer'
                    ? 'bg-indigo-500 text-white shadow-xs'
                    : 'text-amber-200/80 hover:text-white'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>{lang === 'ta' ? 'வாங்குபவர் (Buyer / Mess)' : 'Buyer (Mess/Hostel)'}</span>
              </button>
            </div>
          </div>

          {/* If Buyer view, show persona selector */}
          {userRole === 'buyer' && onChangeActiveBuyer && (
            <div className="flex items-center gap-2">
              <span className="text-amber-200 text-[11px]">Buyer Persona:</span>
              <select
                value={activeBuyer.id}
                onChange={(e) => {
                  const b = DEFAULT_BUYER_PROFILES.find(p => p.id === e.target.value);
                  if (b) {
                    onChangeActiveBuyer(b);
                    SoundEffects.playClick();
                  }
                }}
                className="bg-black/40 text-white text-xs rounded-xl px-2.5 py-1 border border-white/20 focus:outline-none cursor-pointer"
              >
                {DEFAULT_BUYER_PROFILES.map(b => (
                  <option key={b.id} value={b.id} className="bg-slate-900 text-white">
                    {b.name} ({b.type} • {b.distanceKm}km)
                  </option>
                ))}
              </select>
            </div>
          )}

          {userRole === 'vendor' && (
            <button
              onClick={() => setIsNewLotModalOpen(true)}
              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>{lang === 'ta' ? '+ புதிய மீதி சரக்கு சேர்' : '+ Post Surplus Batch'}</span>
            </button>
          )}
        </div>

        {/* 2 Sub-Modes Tab Toggle */}
        <div className="grid grid-cols-2 gap-2 mt-4">
          <button
            onClick={() => setActiveSubMode('surplus')}
            className={`py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeSubMode === 'surplus'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'bg-white/10 text-white hover:bg-white/15'
            }`}
          >
            <Tag className="w-4 h-4 text-amber-600" />
            <span>{t(lang, 'clearanceSale')} ({lots.length})</span>
            {lots.some(l => l.status === 'reserved') && (
              <span className="bg-amber-100 text-amber-900 text-[10px] px-2 py-0.5 rounded-md font-semibold border border-amber-300 animate-pulse">
                Reserved Active
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

      {/* MODE (A): SURPLUS CLEARANCE SALE & REAL-TIME NEGOTIATION */}
      {activeSubMode === 'surplus' && (
        <div className="space-y-4">
          {lots.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-800 text-base">
                {lang === 'ta' ? 'அனைத்து சரக்கும் சீராக உள்ளது!' : 'No Active Surplus Lots'}
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                {lang === 'ta'
                  ? 'தற்போது மீதி சரக்கு எதுவும் விற்பனைக்கு இல்லை. புதிய சரக்கை பதிவிட மேலே உள்ள பொத்தானை பயன்படுத்தவும்.'
                  : 'No surplus clearance produce is currently listed. Post a batch using the "+ Post Surplus Batch" button.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-rose-700 font-bold text-sm">
                  <AlertTriangle className="w-4 h-4" />
                  <span>
                    {lots.length} {lang === 'ta' ? 'மீதி சரக்கு நேரலை சலுகைகள்' : 'Live Surplus Clearance Lots (Multi-User Synced)'}
                  </span>
                </div>
                <span className="text-xs text-slate-500">
                  {userRole === 'vendor'
                    ? lang === 'ta' ? 'வாங்குபவர் பதில் அனுப்பினால் உடனடியாக அரட்டையில் தோன்றும்' : 'Chat replies from buyers sync here in real time'
                    : lang === 'ta' ? 'விலை பேரம் பேச அல்லது முன்பதிவு செய்ய தட்டவும்' : 'Tap any lot to negotiate price or reserve'}
                </span>
              </div>

              {/* Grid of Surplus Rescue Lots */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {lots.map((lot) => {
                  const meta = COMMODITIES[lot.commodity];
                  const isReserved = lot.status === 'reserved';
                  const isSold = lot.status === 'sold';

                  // Generate whatsapp fallback url
                  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(
                    `ResQ Surplus: ${lot.unsoldKg}kg ${meta.nameEn} offered at Rs ${lot.suggestedMarkdownPrice}/kg (-${lot.discountPercent}%) by ${lot.vendorName}. Pickup before ${lot.marketClosesAt}.`
                  )}`;

                  return (
                    <div
                      key={lot.id}
                      className={`bg-white rounded-3xl border p-5 shadow-xs flex flex-col justify-between relative overflow-hidden transition-all ${
                        isSold
                          ? 'border-purple-200 bg-purple-50/20'
                          : isReserved
                          ? 'border-amber-300 ring-2 ring-amber-200/50 bg-amber-50/15'
                          : 'border-rose-200 hover:border-rose-300'
                      }`}
                    >
                      <div className="absolute top-0 right-0 w-24 h-24 bg-rose-50/60 rounded-full blur-2xl -z-10" />

                      <div>
                        {/* Lot Header */}
                        <div className="flex items-start justify-between pb-3 border-b border-slate-100">
                          <div className="flex items-center gap-2.5">
                            <ProduceBadge commodity={lot.commodity} size="md" />
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-extrabold text-slate-900 text-base">
                                  {lang === 'ta' ? meta.nameTa : meta.nameEn}
                                </h4>
                                <span
                                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                    isSold
                                      ? 'bg-purple-100 text-purple-800 border border-purple-200'
                                      : isReserved
                                      ? 'bg-amber-100 text-amber-800 border border-amber-200 animate-pulse'
                                      : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                  }`}
                                >
                                  {isSold
                                    ? '✓ Sold & Paid'
                                    : isReserved
                                    ? `Reserved: ${lot.reservedBuyerName || 'Buyer'}`
                                    : 'Available'}
                                </span>
                              </div>
                              <span className="text-xs text-rose-600 font-bold">
                                {lot.unsoldKg} kg {lang === 'ta' ? 'மீதம் உள்ளது' : 'unsold batch'}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleVoiceSurplus(lot)}
                              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 cursor-pointer"
                              title="Listen"
                            >
                              <Volume2 className="w-4 h-4 text-emerald-600" />
                            </button>
                          </div>
                        </div>

                        {/* Price & Markdown details */}
                        <div className="grid grid-cols-2 gap-2 my-3">
                          <div className="bg-slate-50 p-2.5 rounded-2xl border border-slate-100">
                            <span className="text-[10px] text-slate-500 font-semibold block">
                              Regular Stall Price
                            </span>
                            <span className="text-base font-bold text-slate-400 line-through">
                              ₹{lot.normalPricePerKg}/kg
                            </span>
                          </div>

                          <div className="bg-emerald-50 p-2.5 rounded-2xl border border-emerald-200">
                            <span className="text-[10px] text-emerald-800 font-bold block">
                              Clearance Markdown
                            </span>
                            <div className="text-lg font-black text-emerald-700">
                              ₹{lot.suggestedMarkdownPrice}
                              <span className="text-xs font-normal text-emerald-600">/kg</span>
                              <span className="text-[10px] ml-1 px-1.5 py-0.2 rounded-md bg-emerald-200/80 text-emerald-900 font-bold">
                                -{lot.discountPercent}%
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Reservation / Deal State Banner */}
                        {isReserved && (
                          <div className="bg-amber-100/70 border border-amber-300 p-2.5 rounded-2xl text-xs text-amber-950 mb-3 flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <CheckCircle2 className="w-4 h-4 text-amber-700" />
                              <span>
                                <strong>Reserved for {lot.reservedBuyerName}</strong> @ ₹{lot.agreedPricePerKg || lot.suggestedMarkdownPrice}/kg
                              </span>
                            </div>
                            <span className="font-extrabold text-amber-900 text-xs">
                              ₹{(lot.agreedPricePerKg || lot.suggestedMarkdownPrice) * lot.unsoldKg}
                            </span>
                          </div>
                        )}

                        {isSold && (
                          <div className="bg-purple-100/70 border border-purple-300 p-2.5 rounded-2xl text-xs text-purple-950 mb-3 flex items-center justify-between">
                            <span className="font-bold flex items-center gap-1.5">
                              <Sparkles className="w-4 h-4 text-purple-700" />
                              Produce Cleared & Settled
                            </span>
                            <span className="font-extrabold text-purple-900 text-xs">
                              PAID ₹{lot.settledAmount}
                            </span>
                          </div>
                        )}

                        {/* Real-time Last Message / Negotiation Snapshot */}
                        {lot.lastMessagePreview && (
                          <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-xl mb-3 text-xs text-slate-700 flex items-start gap-2">
                            <MessageSquare className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                            <div className="flex-1 truncate">
                              <span className="text-[10px] text-slate-400 font-semibold block">
                                Latest Negotiation Message:
                              </span>
                              <span className="text-slate-800 font-medium truncate block">
                                "{lot.lastMessagePreview}"
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Technical view math */}
                        {viewMode === 'technical' && (
                          <div className="bg-slate-900 text-slate-200 p-2.5 rounded-xl font-mono text-[10px] mb-3 space-y-0.5">
                            <div className="text-emerald-400 font-bold">Dynamic Markdown Algorithm:</div>
                            <div className="text-slate-300">
                              Discount = {lot.discountPercent}% • Value saved = ₹{lot.potentialSavedRupees}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Action Bar */}
                      <div className="space-y-2 pt-2 border-t border-slate-100">
                        {/* Primary Action: Open Real-time Chat Drawer */}
                        <button
                          onClick={() => handleOpenChat(lot)}
                          className={`w-full py-3 px-4 rounded-xl text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer ${
                            userRole === 'vendor'
                              ? 'bg-emerald-600 hover:bg-emerald-700'
                              : 'bg-indigo-600 hover:bg-indigo-700'
                          }`}
                        >
                          <MessageSquare className="w-4 h-4" />
                          <span>
                            {userRole === 'vendor'
                              ? lang === 'ta' ? 'நேரலை அரட்டை & பேரம் (Open Chat)' : 'Open Negotiation & Live Chat'
                              : lang === 'ta' ? 'விலை பேரம் & முன்பதிவு செய்க' : 'Negotiate, Reserve & Pay'}
                          </span>
                          <ArrowRight className="w-4 h-4" />
                        </button>

                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => handleOpenChat(lot)}
                            className="py-2 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <TrendingDown className="w-3.5 h-3.5 text-amber-600" />
                            <span>Counter-Offer</span>
                          </button>

                          <a
                            href={whatsappUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="py-2 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs flex items-center justify-center gap-1.5"
                          >
                            <Send className="w-3.5 h-3.5 text-emerald-600" />
                            <span>WhatsApp Link</span>
                          </a>
                        </div>
                      </div>
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
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <p className="text-xs text-slate-700 font-medium">
                {lang === 'ta'
                  ? 'இந்த ஆர்டர்களை நீங்கள் எடுக்கும் போது, அவை தானாகவே உங்கள் "சரக்கு (Stock)" தேவை கணிப்பில் சேர்க்கப்படும்!'
                  : 'When you claim recurring bulk orders, their daily quantity is automatically factored into your Stock forecast as pre-committed demand.'}
              </p>
            </div>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-800 border border-indigo-200 shrink-0">
              {lang === 'ta' ? 'மாதிரி பார்ட்னர் பட்டியல்கள் (Simulated Partner Listings)' : 'Simulated Partner Listings'}
            </span>
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
                        <ProduceBadge commodity={order.commodity} size="md" />
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
                      className={`w-full py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
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

      {/* Real-time Multi-User Chat & Negotiation Drawer */}
      {activeChatLot && (
        <ResQChatDrawer
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
          lot={activeChatLot}
          userRole={userRole}
          activeBuyer={activeBuyer}
          vendorProfile={vendorProfile}
          lang={lang}
          onLotUpdated={(updated) => {
            setActiveChatLot(updated);
          }}
        />
      )}

      {/* Post New Surplus Batch Modal */}
      {isNewLotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-900 text-base">
                {lang === 'ta' ? 'புதிய மீதி காய்கறி சலுகை வெளியிடுக' : 'Post New Surplus Produce Batch'}
              </h3>
              <button
                onClick={() => setIsNewLotModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateNewLot} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1.5">Select Commodity</label>
                <select
                  value={newLotCommodity}
                  onChange={(e) => setNewLotCommodity(e.target.value as CommodityType)}
                  className="w-full py-2.5 px-3 rounded-xl border border-slate-200 font-semibold text-slate-800 bg-slate-50 focus:outline-none"
                >
                  {Object.entries(COMMODITIES).map(([key, item]) => (
                    <option key={key} value={key}>
                      {item.iconEmoji} {lang === 'ta' ? item.nameTa : item.nameEn}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Unsold Stock (kg)</label>
                  <input
                    type="number"
                    min={2}
                    value={newLotKg}
                    onChange={(e) => setNewLotKg(Number(e.target.value))}
                    className="w-full py-2 px-3 rounded-xl border border-slate-200 font-bold text-slate-900 bg-slate-50"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Clearance Discount (%)</label>
                  <input
                    type="number"
                    min={10}
                    max={60}
                    value={newLotDiscount}
                    onChange={(e) => setNewLotDiscount(Number(e.target.value))}
                    className="w-full py-2 px-3 rounded-xl border border-slate-200 font-bold text-slate-900 bg-slate-50"
                  />
                </div>
              </div>

              <div className="bg-amber-50 p-3 rounded-2xl border border-amber-200 text-amber-900 space-y-1">
                <div className="flex justify-between">
                  <span>Regular Price:</span>
                  <span className="font-bold">₹{vendorPrices[newLotCommodity] || 30}/kg</span>
                </div>
                <div className="flex justify-between text-emerald-700 font-bold">
                  <span>Clearance Price:</span>
                  <span>
                    ₹{Math.max(8, Math.round((vendorPrices[newLotCommodity] || 30) * (1 - newLotDiscount / 100)))}/kg
                  </span>
                </div>
                <div className="flex justify-between font-extrabold pt-1 border-t border-amber-200 text-slate-800">
                  <span>Potential Saved Value:</span>
                  <span>
                    ₹{Math.max(8, Math.round((vendorPrices[newLotCommodity] || 30) * (1 - newLotDiscount / 100))) * newLotKg}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewLotModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-xs"
                >
                  Broadcast Lot
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
