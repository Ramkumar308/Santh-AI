import React, { useState, useEffect, useRef } from 'react';
import {
  ResQLotItem,
  ResQChatMessage,
  ResQUserRole,
  BuyerProfile,
  VendorProfile,
  Language
} from '../types';
import { COMMODITIES } from '../data/commodities';
import { ProduceBadge } from './ProduceBadge';
import { ResQSyncService } from '../services/resqSync';
import {
  VENDOR_QUICK_REPLIES,
  BUYER_QUICK_REPLIES,
  QuickReplyLang,
  QuickReplyPreset
} from '../data/resqQuickReplies';
import { SoundEffects } from '../utils/audioHaptics';
import QRCode from 'qrcode';
import confetti from 'canvas-confetti';
import {
  X,
  Send,
  Building2,
  Store,
  Clock,
  Tag,
  CheckCircle2,
  XCircle,
  IndianRupee,
  Sparkles,
  QrCode,
  ShieldCheck,
  ArrowRight,
  TrendingDown,
  Phone,
  MessageSquare,
  AlertCircle,
  Copy,
  Check,
  CheckCheck
} from 'lucide-react';

interface ResQChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  lot: ResQLotItem;
  userRole: ResQUserRole;
  activeBuyer: BuyerProfile;
  vendorProfile: VendorProfile;
  lang: Language;
  onLotUpdated?: (lot: ResQLotItem) => void;
}

export const ResQChatDrawer: React.FC<ResQChatDrawerProps> = ({
  isOpen,
  onClose,
  lot,
  userRole,
  activeBuyer,
  vendorProfile,
  lang,
  onLotUpdated
}) => {
  const [messages, setMessages] = useState<ResQChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isCounterFormOpen, setIsCounterFormOpen] = useState(false);
  const [counterPrice, setCounterPrice] = useState<number>(() => {
    return Math.max(5, Math.round(lot.suggestedMarkdownPrice * 0.9));
  });
  const [counterKg, setCounterKg] = useState<number>(lot.unsoldKg);
  const [counterNote, setCounterNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [quickReplyLang, setQuickReplyLang] = useState<QuickReplyLang>(lang === 'ta' ? 'ta' : 'en');
  const [justSentPresetId, setJustSentPresetId] = useState<string | null>(null);

  // Payment QR state
  const [showPaymentQr, setShowPaymentQr] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copiedVpa, setCopiedVpa] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const meta = COMMODITIES[lot.commodity];
  const commName = lang === 'ta' ? meta.nameTa : meta.nameEn;

  // Real-time Firestore & BroadcastChannel message subscription
  useEffect(() => {
    if (!isOpen || !lot.id) return;

    const unsubscribe = ResQSyncService.subscribeToMessages(lot.id, (newMsgs) => {
      setMessages(newMsgs);
      // Play a soft tactile click or message notification
      SoundEffects.playClick();
    });

    return () => {
      unsubscribe();
    };
  }, [isOpen, lot.id]);

  // Scroll to bottom when messages update
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isCounterFormOpen, showPaymentQr]);

  // Generate UPI QR when payment view is opened
  const agreedPrice = lot.agreedPricePerKg || lot.suggestedMarkdownPrice;
  const agreedKg = lot.reservedKg || lot.unsoldKg;
  const totalPayable = agreedPrice * agreedKg;
  const merchantVpa = lot.vendorVpa || `${vendorProfile.phone.slice(-10)}@okaxis`;

  useEffect(() => {
    if (showPaymentQr) {
      const upiUrl = `upi://pay?pa=${encodeURIComponent(merchantVpa)}&pn=${encodeURIComponent(lot.vendorName)}&am=${totalPayable.toFixed(2)}&cu=INR&tn=${encodeURIComponent(`ResQ-${lot.commodity}-${lot.id.slice(-6)}`)}`;
      QRCode.toDataURL(upiUrl, {
        width: 260,
        margin: 1,
        color: { dark: '#064e3b', light: '#ffffff' }
      }).then(url => {
        setQrDataUrl(url);
      }).catch(err => {
        console.error('QR generation error:', err);
      });
    }
  }, [showPaymentQr, merchantVpa, lot.vendorName, totalPayable, lot.commodity, lot.id]);

  if (!isOpen) return null;

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || isSubmitting) return;

    setIsSubmitting(true);
    const textToSend = inputText.trim();
    setInputText('');

    try {
      await ResQSyncService.sendMessage(lot.id, {
        lotId: lot.id,
        senderRole: userRole,
        senderName: userRole === 'vendor' ? vendorProfile.name : activeBuyer.name,
        senderId: userRole === 'vendor' ? 'vendor_primary' : activeBuyer.id,
        type: 'chat',
        text: textToSend
      });
      SoundEffects.playClick();
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInstantQuickReply = async (preset: QuickReplyPreset) => {
    if (isSubmitting || lot.status === 'sold') return;
    setIsSubmitting(true);
    const textToSend = preset.text[quickReplyLang];

    try {
      await ResQSyncService.sendMessage(lot.id, {
        lotId: lot.id,
        senderRole: userRole,
        senderName: userRole === 'vendor' ? vendorProfile.name : activeBuyer.name,
        senderId: userRole === 'vendor' ? 'vendor_primary' : activeBuyer.id,
        type: 'chat',
        text: textToSend
      });
      SoundEffects.playClick();
      setJustSentPresetId(preset.id);
      setTimeout(() => setJustSentPresetId(null), 1500);
    } catch (err) {
      console.error('Failed to send quick reply:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendQuickReply = (text: string) => {
    setInputText(text);
  };

  const handleSubmitCounterOffer = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await ResQSyncService.submitCounterOffer(
        lot,
        activeBuyer,
        counterPrice,
        counterKg,
        counterNote
      );
      setIsCounterFormOpen(false);
      setCounterNote('');
      SoundEffects.playSuccess();
    } catch (err) {
      console.error('Failed to submit counter offer:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRespondToOffer = async (msg: ResQChatMessage, accept: boolean) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await ResQSyncService.respondToCounterOffer(
        lot.id,
        msg.id,
        accept,
        vendorProfile,
        {
          proposedPricePerKg: msg.proposedPricePerKg || lot.suggestedMarkdownPrice,
          proposedKg: msg.proposedKg || lot.unsoldKg,
          buyerName: msg.senderName,
          buyerId: msg.senderId
        }
      );
      if (accept) {
        SoundEffects.playSuccess();
        confetti({
          particleCount: 40,
          spread: 60,
          origin: { y: 0.6 }
        });
      } else {
        SoundEffects.playClick();
      }
    } catch (err) {
      console.error('Error responding to counter offer:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDirectReserve = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await ResQSyncService.reserveLot(
        lot,
        activeBuyer,
        lot.unsoldKg,
        lot.suggestedMarkdownPrice
      );
      SoundEffects.playSuccess();
      confetti({
        particleCount: 50,
        spread: 70,
        origin: { y: 0.5 }
      });
    } catch (err) {
      console.error('Error reserving lot:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSettlePayment = async (method: 'UPI' | 'Cash') => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const settlerName = userRole === 'vendor' ? vendorProfile.name : activeBuyer.name;
      await ResQSyncService.settleLotPayment(
        lot.id,
        totalPayable,
        userRole,
        settlerName,
        method
      );
      setShowPaymentQr(false);
      SoundEffects.playSuccess();
      confetti({
        particleCount: 80,
        spread: 90,
        origin: { y: 0.4 }
      });
    } catch (err) {
      console.error('Error settling payment:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyVpa = () => {
    navigator.clipboard.writeText(merchantVpa);
    setCopiedVpa(true);
    SoundEffects.playClick();
    setTimeout(() => setCopiedVpa(false), 2000);
  };

  const isReserved = lot.status === 'reserved';
  const isSold = lot.status === 'sold';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-xl h-full bg-slate-50 flex flex-col shadow-2xl border-l border-slate-200 animate-in slide-in-from-right duration-300">
        
        {/* Drawer Header */}
        <div className="bg-white px-5 py-4 border-b border-slate-200 flex items-center justify-between shrink-0 shadow-2xs">
          <div className="flex items-center gap-3">
            <ProduceBadge commodity={lot.commodity} size="md" />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-slate-900 text-base sm:text-lg">
                  {commName} ({lot.unsoldKg} kg)
                </h3>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  isSold
                    ? 'bg-purple-100 text-purple-800 border border-purple-200'
                    : isReserved
                    ? 'bg-amber-100 text-amber-800 border border-amber-200'
                    : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                }`}>
                  {isSold ? '✓ Cleared & Paid' : isReserved ? '⏳ Reserved' : '🟢 Open Clearance'}
                </span>
              </div>
              <p className="text-xs text-slate-500 flex items-center gap-2">
                <span>Stall #{lot.vendorStall} ({lot.vendorName})</span>
                <span>•</span>
                <span className="text-emerald-700 font-bold">
                  ₹{lot.suggestedMarkdownPrice}/kg (-{lot.discountPercent}%)
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Live Firestore Sync Status Pill */}
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-bold border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Live Firestore Sync</span>
            </div>

            <button
              onClick={() => {
                SoundEffects.playClick();
                onClose();
              }}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Current Active Persona Banner */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 px-5 py-2.5 text-white flex items-center justify-between text-xs shrink-0">
          <div className="flex items-center gap-2">
            {userRole === 'vendor' ? (
              <Store className="w-4 h-4 text-emerald-400" />
            ) : (
              <Building2 className="w-4 h-4 text-sky-400" />
            )}
            <span>
              {lang === 'ta' ? 'தற்போது நீங்கள்:' : 'Viewing and replying as:'}{' '}
              <strong className={userRole === 'vendor' ? 'text-emerald-300' : 'text-sky-300'}>
                {userRole === 'vendor'
                  ? `${vendorProfile.name} (Stall Vendor)`
                  : `${activeBuyer.name} (${activeBuyer.type})`}
              </strong>
            </span>
          </div>
          <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded-md border border-white/10">
            {userRole === 'vendor' ? 'Stall Mode' : 'Institutional Buyer'}
          </span>
        </div>

        {/* Lot Quick Stats Strip */}
        <div className="bg-amber-50/80 border-b border-amber-200/60 px-5 py-2.5 flex items-center justify-between text-xs text-amber-900 shrink-0">
          <div className="flex items-center gap-4">
            <div>
              <span className="text-[10px] text-amber-700 block">Stall Price</span>
              <span className="font-bold line-through text-slate-400">₹{lot.normalPricePerKg}/kg</span>
            </div>
            <div>
              <span className="text-[10px] text-emerald-800 font-bold block">Markdown Offer</span>
              <span className="font-extrabold text-emerald-700 text-sm">₹{lot.suggestedMarkdownPrice}/kg</span>
            </div>
            <div>
              <span className="text-[10px] text-amber-700 block">Total Lot Value</span>
              <span className="font-extrabold text-slate-800 text-sm">
                ₹{lot.suggestedMarkdownPrice * lot.unsoldKg}
              </span>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-amber-700 block">Market Closes</span>
            <span className="font-bold text-rose-700 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {lot.marketClosesAt}
            </span>
          </div>
        </div>

        {/* Real-time Message Thread */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5">
          {/* Produce Intro System Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-2xs text-xs space-y-2">
            <div className="flex items-center justify-between text-slate-500 text-[11px]">
              <span className="font-semibold text-slate-700">Produce Clearance Lot Initialized</span>
              <span>{new Date(lot.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            <p className="text-slate-600">
              {lang === 'ta'
                ? `விற்பனையாளர் ${lot.vendorName} தனது ${lot.unsoldKg} கிலோ மீதி ${commName} சரக்கை ₹${lot.suggestedMarkdownPrice}/கிலோ விலையில் (சாதாரண விலை ₹${lot.normalPricePerKg}) மீட்பு சலுகையாக பதிவிட்டுள்ளார்.`
                : `Vendor ${lot.vendorName} listed ${lot.unsoldKg} kg of fresh unsold ${commName} at ₹${lot.suggestedMarkdownPrice}/kg (standard price ₹${lot.normalPricePerKg}/kg) for immediate clearance.`}
            </p>
          </div>

          {messages.map((msg) => {
            const isMe =
              (userRole === 'vendor' && msg.senderRole === 'vendor') ||
              (userRole === 'buyer' && msg.senderRole === 'buyer');

            // System notifications
            if (msg.type === 'system') {
              return (
                <div key={msg.id} className="text-center my-2">
                  <span className="inline-block bg-slate-200 text-slate-700 text-[11px] px-3 py-1 rounded-full font-medium">
                    {msg.text}
                  </span>
                </div>
              );
            }

            // Counter Offer Card
            if (msg.type === 'counter_offer') {
              const proposedTotal = (msg.proposedPricePerKg || 0) * (msg.proposedKg || lot.unsoldKg);
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} my-2`}
                >
                  <div className="text-[10px] text-slate-400 mb-1 px-1">
                    {msg.senderName} ({msg.senderRole === 'vendor' ? 'Vendor' : 'Buyer'}) •{' '}
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>

                  <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-300 rounded-3xl p-4 max-w-sm sm:max-w-md shadow-sm space-y-3">
                    <div className="flex items-center justify-between gap-2 border-b border-amber-200/80 pb-2">
                      <div className="flex items-center gap-1.5 font-bold text-amber-900 text-xs sm:text-sm">
                        <TrendingDown className="w-4 h-4 text-amber-600" />
                        <span>Counter-Offer Proposal</span>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        msg.status === 'accepted'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : msg.status === 'rejected'
                          ? 'bg-rose-100 text-rose-800 border border-rose-200'
                          : 'bg-amber-100 text-amber-800 animate-pulse'
                      }`}>
                        {msg.status === 'accepted' ? 'Accepted ✓' : msg.status === 'rejected' ? 'Declined ✕' : 'Pending Review'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-center">
                      <div className="bg-white/80 p-2 rounded-xl border border-amber-200">
                        <span className="text-[10px] text-slate-500 font-semibold block">Proposed Price</span>
                        <span className="text-lg font-black text-amber-900">₹{msg.proposedPricePerKg}/kg</span>
                      </div>
                      <div className="bg-white/80 p-2 rounded-xl border border-amber-200">
                        <span className="text-[10px] text-slate-500 font-semibold block">Proposed Quantity</span>
                        <span className="text-lg font-black text-slate-800">{msg.proposedKg} kg</span>
                      </div>
                    </div>

                    <div className="text-xs text-slate-700 bg-white/60 p-2 rounded-xl">
                      <strong>Total Payout:</strong> ₹{proposedTotal}
                      {msg.text && <p className="mt-1 italic text-slate-600">"{msg.text}"</p>}
                    </div>

                    {/* Action buttons for Vendor if pending */}
                    {userRole === 'vendor' && msg.status === 'pending' && (
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          onClick={() => handleRespondToOffer(msg, true)}
                          disabled={isSubmitting}
                          className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Accept & Reserve</span>
                        </button>
                        <button
                          onClick={() => handleRespondToOffer(msg, false)}
                          disabled={isSubmitting}
                          className="py-2 px-3 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
                        >
                          Decline
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            }

            // Accept offer banner
            if (msg.type === 'accept_offer') {
              return (
                <div key={msg.id} className="my-2 p-3 bg-emerald-50 border border-emerald-300 rounded-2xl flex items-start gap-2.5 text-xs text-emerald-900">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block text-sm">Deal Accepted!</span>
                    <span>{msg.text}</span>
                  </div>
                </div>
              );
            }

            // Reserve confirmation
            if (msg.type === 'reserve') {
              return (
                <div key={msg.id} className="my-2 p-3 bg-sky-50 border border-sky-300 rounded-2xl flex items-start gap-2.5 text-xs text-sky-900">
                  <Building2 className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block text-sm">Produce Reserved</span>
                    <span>{msg.text}</span>
                  </div>
                </div>
              );
            }

            // Payment settled receipt card
            if (msg.type === 'payment_settled') {
              return (
                <div key={msg.id} className="my-3 p-4 bg-gradient-to-r from-emerald-600 to-teal-700 text-white rounded-3xl shadow-md space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 font-bold text-sm">
                      <Sparkles className="w-4 h-4 text-emerald-300" />
                      Payment & Settlement Completed
                    </span>
                    <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-semibold">
                      PAID ₹{msg.settlementAmount || totalPayable}
                    </span>
                  </div>
                  <p className="text-xs text-emerald-100">{msg.text}</p>
                </div>
              );
            }

            // Standard Chat Bubble
            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
              >
                <div className="text-[10px] text-slate-400 mb-0.5 px-1.5">
                  {msg.senderName} • {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>

                <div
                  className={`max-w-[85%] sm:max-w-[75%] px-4 py-2.5 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-2xs ${
                    isMe
                      ? userRole === 'vendor'
                        ? 'bg-emerald-700 text-white rounded-br-xs'
                        : 'bg-indigo-700 text-white rounded-br-xs'
                      : 'bg-white text-slate-800 border border-slate-200 rounded-bl-xs'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Counter Offer Form (Modal Section inside drawer) */}
        {isCounterFormOpen && (
          <div className="bg-amber-50/95 border-t border-amber-300 p-4 space-y-3 shrink-0 animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between">
              <span className="font-bold text-amber-900 text-xs sm:text-sm flex items-center gap-1.5">
                <TrendingDown className="w-4 h-4 text-amber-600" />
                Submit Counter-Offer (விலை பேரம் பேசுதல்)
              </span>
              <button
                onClick={() => setIsCounterFormOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-slate-600 block mb-1">
                  Proposed Price / kg (₹)
                </label>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setCounterPrice(p => Math.max(5, p - 2))}
                    className="w-8 h-8 rounded-lg bg-white border border-slate-200 font-bold text-sm text-slate-700"
                  >
                    -2
                  </button>
                  <input
                    type="number"
                    value={counterPrice}
                    onChange={(e) => setCounterPrice(Number(e.target.value))}
                    className="w-full text-center py-1.5 rounded-lg border border-slate-300 font-bold text-slate-900 text-sm bg-white"
                  />
                  <button
                    onClick={() => setCounterPrice(p => p + 2)}
                    className="w-8 h-8 rounded-lg bg-white border border-slate-200 font-bold text-sm text-slate-700"
                  >
                    +2
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-600 block mb-1">
                  Quantity Required (kg)
                </label>
                <input
                  type="number"
                  max={lot.unsoldKg}
                  min={1}
                  value={counterKg}
                  onChange={(e) => setCounterKg(Number(e.target.value))}
                  className="w-full text-center py-1.5 rounded-lg border border-slate-300 font-bold text-slate-900 text-sm bg-white"
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-amber-900 font-medium px-1">
              <span>Total Offer Value: <strong>₹{counterPrice * counterKg}</strong></span>
              <span className="text-emerald-700 font-bold">
                Save: ₹{(lot.normalPricePerKg - counterPrice) * counterKg}
              </span>
            </div>

            <input
              type="text"
              placeholder="Add optional note (e.g. Can pick up in 30 mins, need in crates)..."
              value={counterNote}
              onChange={(e) => setCounterNote(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 bg-white"
            />

            <button
              onClick={handleSubmitCounterOffer}
              disabled={isSubmitting || counterPrice <= 0 || counterKg <= 0}
              className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send Counter-Offer to Vendor</span>
            </button>
          </div>
        )}

        {/* UPI Payment Modal Section */}
        {showPaymentQr && (
          <div className="bg-white border-t border-emerald-300 p-4 space-y-3 shrink-0 animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between">
              <span className="font-bold text-emerald-950 text-sm flex items-center gap-1.5">
                <QrCode className="w-4 h-4 text-emerald-600" />
                Scan to Pay & Settle Lot (₹{totalPayable})
              </span>
              <button
                onClick={() => setShowPaymentQr(false)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4 bg-emerald-50/50 p-3.5 rounded-2xl border border-emerald-100">
              <div className="bg-white p-2 rounded-xl shadow-xs border border-emerald-200 flex items-center justify-center">
                {qrDataUrl ? (
                  <img src={qrDataUrl} alt="UPI QR Code" className="w-36 h-36 object-contain" />
                ) : (
                  <div className="w-36 h-36 flex items-center justify-center text-xs text-slate-400">
                    Generating QR...
                  </div>
                )}
              </div>

              <div className="flex-1 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Payable to:</span>
                  <span className="font-bold text-slate-800">{lot.vendorName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">UPI ID (VPA):</span>
                  <button
                    onClick={handleCopyVpa}
                    className="font-mono text-emerald-700 font-bold flex items-center gap-1 hover:underline"
                  >
                    <span>{merchantVpa}</span>
                    {copiedVpa ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Agreed Price:</span>
                  <span className="font-bold text-slate-800">₹{agreedPrice}/kg × {agreedKg}kg</span>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-emerald-200">
                  <span className="font-bold text-emerald-950">Net Amount:</span>
                  <span className="text-base font-extrabold text-emerald-700">₹{totalPayable}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleSettlePayment('UPI')}
                disabled={isSubmitting}
                className="py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Mark Paid via UPI</span>
              </button>
              <button
                onClick={() => handleSettlePayment('Cash')}
                disabled={isSubmitting}
                className="py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Paid via Cash</span>
              </button>
            </div>
          </div>
        )}

        {/* Drawer Action Bar & Fast Triggers */}
        {!isCounterFormOpen && !showPaymentQr && !isSold && (
          <div className="bg-slate-100/90 border-t border-slate-200 px-4 py-2 shrink-0 flex items-center gap-2 overflow-x-auto">
            {userRole === 'buyer' && !isReserved && (
              <>
                <button
                  onClick={() => setIsCounterFormOpen(true)}
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-2xs shrink-0 cursor-pointer"
                >
                  <TrendingDown className="w-3.5 h-3.5" />
                  <span>{lang === 'ta' ? 'விலை பேரம் பேசுக' : 'Negotiate / Counter-Offer'}</span>
                </button>

                <button
                  onClick={handleDirectReserve}
                  disabled={isSubmitting}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-2xs shrink-0 cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{lang === 'ta' ? 'உடனே ஒதுக்குக (₹' + lot.suggestedMarkdownPrice + ')' : `Reserve Now (₹${lot.suggestedMarkdownPrice}/kg)`}</span>
                </button>
              </>
            )}

            {(isReserved || userRole === 'vendor') && (
              <button
                onClick={() => setShowPaymentQr(true)}
                className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-2xs shrink-0 cursor-pointer"
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>{lang === 'ta' ? 'UPI பணம் / ரசீது' : 'Pay / Settle (UPI QR)'}</span>
              </button>
            )}
          </div>
        )}

        {/* Trilingual Quick Reply Bar (Tamil | Marathi | English) */}
        {!isSold && (
          <div className="bg-slate-50 border-t border-slate-200/80 px-3.5 py-2 shrink-0 space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-600">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>
                  {quickReplyLang === 'ta'
                    ? '1-தட்டு உடனடி பதில்கள் (Quick Reply):'
                    : quickReplyLang === 'mr'
                    ? '१-टॅप त्वरित उत्तरे (Quick Reply):'
                    : '1-Tap Quick Replies:'}
                </span>
              </div>

              {/* Trilingual Toggle Pill */}
              <div className="flex items-center bg-white border border-slate-200 rounded-xl p-0.5 shadow-2xs">
                <button
                  type="button"
                  onClick={() => {
                    setQuickReplyLang('ta');
                    SoundEffects.playClick();
                  }}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                    quickReplyLang === 'ta'
                      ? 'bg-emerald-700 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="தமிழ் (Tamil)"
                >
                  தமிழ்
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setQuickReplyLang('mr');
                    SoundEffects.playClick();
                  }}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                    quickReplyLang === 'mr'
                      ? 'bg-orange-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="मराठी (Marathi)"
                >
                  मराठी
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setQuickReplyLang('en');
                    SoundEffects.playClick();
                  }}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                    quickReplyLang === 'en'
                      ? 'bg-slate-800 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="English"
                >
                  EN
                </button>
              </div>
            </div>

            {/* Horizontally Scrollable Chips Carousel */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar scroll-smooth py-0.5">
              {(userRole === 'vendor' ? VENDOR_QUICK_REPLIES : BUYER_QUICK_REPLIES).map((preset) => {
                const isJustSent = justSentPresetId === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleInstantQuickReply(preset)}
                    disabled={isSubmitting || isSold}
                    title={preset.text[quickReplyLang]}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap flex items-center gap-1.5 border transition-all cursor-pointer shrink-0 shadow-2xs ${
                      isJustSent
                        ? 'bg-emerald-600 text-white border-emerald-600 scale-95'
                        : 'bg-white hover:bg-emerald-50 active:scale-95 text-slate-800 hover:text-emerald-950 border-slate-200/90 hover:border-emerald-400'
                    }`}
                  >
                    <span>{preset.emoji}</span>
                    <span>{preset.shortLabel[quickReplyLang]}</span>
                    {isJustSent ? (
                      <Check className="w-3.5 h-3.5 text-white" />
                    ) : (
                      <Send className="w-3 h-3 text-slate-400 opacity-60 ml-0.5" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Input Bar */}
        <form onSubmit={handleSendMessage} className="bg-white p-3 border-t border-slate-200 flex items-center gap-2 shrink-0">
          <input
            type="text"
            placeholder={
              userRole === 'vendor'
                ? lang === 'ta'
                  ? 'வாங்குபவருக்கு பதில் அனுப்புக...'
                  : 'Reply to buyer as vendor...'
                : lang === 'ta'
                ? 'விற்பனையாளரிடம் கேட்க...'
                : 'Send message to vendor...'
            }
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={isSold}
            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-slate-50 disabled:opacity-50"
          />

          <button
            type="submit"
            disabled={!inputText.trim() || isSubmitting || isSold}
            className="p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-40 transition-colors shadow-xs cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>

      </div>
    </div>
  );
};
