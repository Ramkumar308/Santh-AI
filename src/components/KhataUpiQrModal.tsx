import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { KhataCustomer, VendorProfile, Language } from '../types';
import {
  QrCode,
  CheckCircle2,
  Copy,
  Check,
  X,
  Share2,
  Download,
  IndianRupee,
  Volume2,
  ExternalLink,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { SoundEffects } from '../utils/audioHaptics';
import confetti from 'canvas-confetti';

interface KhataUpiQrModalProps {
  customer: KhataCustomer;
  vendorProfile: VendorProfile;
  lang: Language;
  onClose: () => void;
  onSettlePayment: (customerId: string, amount: number) => void;
}

export const KhataUpiQrModal: React.FC<KhataUpiQrModalProps> = ({
  customer,
  vendorProfile,
  lang,
  onClose,
  onSettlePayment
}) => {
  const initialDue = customer.totalDue > 0 ? customer.totalDue : 500;
  const [amount, setAmount] = useState<number>(initialDue);
  const [preset, setPreset] = useState<'full' | 'half' | 'custom'>('full');
  const [customInput, setCustomInput] = useState<string>(initialDue.toString());
  const [qrSvg, setQrSvg] = useState<string>('');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [copiedVpa, setCopiedVpa] = useState<boolean>(false);
  const [isSettled, setIsSettled] = useState<boolean>(false);

  // Fallback demo VPA if merchant hasn't configured a custom VPA yet
  const merchantVpa = vendorProfile.upiId && vendorProfile.upiId.trim().length > 3
    ? vendorProfile.upiId.trim()
    : 'santhai.traders@okaxis';

  const merchantName = vendorProfile.name || 'SanthAI Wholesaler';
  const customerDisplayName = lang === 'ta' && customer.nameTa ? customer.nameTa : customer.name;

  // Standard NPCI UPI URI Scheme
  const upiUrl = `upi://pay?pa=${encodeURIComponent(merchantVpa)}&pn=${encodeURIComponent(merchantName)}&am=${amount.toFixed(2)}&cu=INR&tn=${encodeURIComponent(`Khata - ${customer.name}`)}`;

  // Re-generate QR code whenever amount or merchant details change
  useEffect(() => {
    let isMounted = true;
    const generateCodes = async () => {
      try {
        const svgString = await QRCode.toString(upiUrl, {
          type: 'svg',
          margin: 1,
          color: {
            dark: '#0f172a', // Deep slate for maximal optical camera contrast
            light: '#ffffff'
          }
        });

        const pngUrl = await QRCode.toDataURL(upiUrl, {
          margin: 1,
          width: 320,
          color: {
            dark: '#0f172a',
            light: '#ffffff'
          }
        });

        if (isMounted) {
          setQrSvg(svgString);
          setQrDataUrl(pngUrl);
        }
      } catch (err) {
        console.error('Failed to generate UPI QR code:', err);
      }
    };

    generateCodes();
    return () => {
      isMounted = false;
    };
  }, [upiUrl]);

  const handleSelectPreset = (mode: 'full' | 'half' | 'custom') => {
    SoundEffects.playClick();
    setPreset(mode);
    if (mode === 'full') {
      const val = customer.totalDue > 0 ? customer.totalDue : 500;
      setAmount(val);
      setCustomInput(val.toString());
    } else if (mode === 'half') {
      const val = customer.totalDue > 0 ? Math.round(customer.totalDue / 2) : 250;
      setAmount(val);
      setCustomInput(val.toString());
    }
  };

  const handleCustomInputChange = (valStr: string) => {
    setCustomInput(valStr);
    const parsed = parseFloat(valStr);
    if (!isNaN(parsed) && parsed > 0) {
      setAmount(Math.round(parsed));
      setPreset('custom');
    }
  };

  const handleCopyLink = () => {
    SoundEffects.playClick();
    navigator.clipboard.writeText(upiUrl).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    });
  };

  const handleCopyVpa = () => {
    SoundEffects.playClick();
    navigator.clipboard.writeText(merchantVpa).then(() => {
      setCopiedVpa(true);
      setTimeout(() => setCopiedVpa(false), 2000);
    });
  };

  const handleDownloadQr = () => {
    SoundEffects.playClick();
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `UPI-QR-${customer.name.replace(/\s+/g, '_')}-₹${amount}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleSpeakAmount = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const text = lang === 'ta'
        ? `${customerDisplayName} அவர்களுக்கான UPI கட்டணம் ரூபாய் ${amount}. ஸ்கேன் செய்து செலுத்தவும்.`
        : `UPI scan to pay for ${customer.name}. Amount is rupees ${amount}. Ready to scan.`;
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang === 'ta' ? 'ta-IN' : 'en-IN';
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleMarkAsSettled = () => {
    if (isSettled || amount <= 0) return;
    setIsSettled(true);
    SoundEffects.playSuccess();
    confetti({
      particleCount: 70,
      spread: 80,
      origin: { y: 0.6 }
    });

    onSettlePayment(customer.id, amount);

    // Give visual confirmation feedback before auto-closing
    setTimeout(() => {
      onClose();
    }, 1200);
  };

  const handleWhatsAppShare = () => {
    SoundEffects.playClick();
    const cleanPhone = customer.phone.replace(/[^0-9]/g, '');
    const message = lang === 'ta'
      ? `வணக்கம் ${customerDisplayName} அவர்களே,

🏪 *${merchantName}* (கடை: ${vendorProfile.stallNumber || 'SanthAI'})
உங்களின் நிலுவைத் தொகை: *₹${customer.totalDue}*
தற்போது செலுத்த வேண்டிய தொகை: *₹${amount}*

📲 *UPI கட்டணம் செலுத்த கீழுள்ள இணைப்பை அழுத்தவும்:*
${upiUrl}

UPI முகவரி: \`${merchantVpa}\`
செலுத்தியவுடன் எங்களுக்கு தெரிவிக்கவும். நன்றி!`
      : `Hello ${customer.name},

🏪 *${merchantName}* (Stall: ${vendorProfile.stallNumber || 'SanthAI Mandi'})
Current Khata Balance: *₹${customer.totalDue}*
Payment Amount Requested: *₹${amount}*

📲 *Click below to pay directly via UPI (GPay/PhonePe/Paytm):*
${upiUrl}

Merchant UPI VPA: \`${merchantVpa}\`
Thank you for your business!`;

    const waUrl = `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden my-auto flex flex-col">
        {/* Top Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 bg-slate-900 text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">
                {lang === 'ta' ? 'நேரடி UPI QR கட்டணம்' : 'Instant Scan to Pay (UPI QR)'}
              </h3>
              <div className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                <span>{customerDisplayName}</span>
                <span aria-hidden="true">·</span>
                <span>{customer.phone}</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono tabular-nums text-slate-300">
                  {lang === 'ta' ? 'பாக்கி' : 'Due'}: ₹{customer.totalDue}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleSpeakAmount}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Voice announcement"
            >
              <Volume2 className="w-4 h-4" />
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

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-5 bg-white">
          {/* Amount Presets & Custom Input */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                {lang === 'ta' ? 'செலுத்தும் தொகை' : 'Payment Amount'}
              </span>
              <span className="text-xs text-slate-500 font-mono tabular-nums">
                {lang === 'ta' ? 'மொத்த பாக்கி' : 'Total Outstanding'}: ₹{customer.totalDue}
              </span>
            </div>

            {/* Segmented Preset Buttons */}
            <div className="grid grid-cols-3 gap-2 p-1 bg-slate-100 rounded-xl mb-3">
              <button
                type="button"
                onClick={() => handleSelectPreset('full')}
                className={`py-2 px-2 text-xs font-bold rounded-lg transition-all flex flex-col items-center justify-center ${
                  preset === 'full'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>{lang === 'ta' ? 'முழுத் தொகை' : 'Full Due'}</span>
                <span className="font-mono tabular-nums text-[11px] text-emerald-600">
                  ₹{customer.totalDue}
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectPreset('half')}
                className={`py-2 px-2 text-xs font-bold rounded-lg transition-all flex flex-col items-center justify-center ${
                  preset === 'half'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>{lang === 'ta' ? 'பாதி (50%)' : 'Half (50%)'}</span>
                <span className="font-mono tabular-nums text-[11px] text-indigo-600">
                  ₹{Math.round(customer.totalDue / 2)}
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectPreset('custom')}
                className={`py-2 px-2 text-xs font-bold rounded-lg transition-all flex flex-col items-center justify-center ${
                  preset === 'custom'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>{lang === 'ta' ? 'தனிப்பயன்' : 'Custom'}</span>
                <span className="font-mono tabular-nums text-[11px] text-slate-500">
                  ₹{amount}
                </span>
              </button>
            </div>

            {/* Custom Amount Field */}
            {preset === 'custom' && (
              <div className="relative mt-2">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">
                  ₹
                </span>
                <input
                  type="number"
                  min="1"
                  max={Math.max(customer.totalDue, 50000)}
                  value={customInput}
                  onChange={(e) => handleCustomInputChange(e.target.value)}
                  placeholder="Enter custom settlement amount"
                  className="w-full pl-8 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold font-mono tabular-nums text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                />
              </div>
            )}
          </div>

          {/* QR Display Card with Optical Scanner Corner Markers */}
          <div className="relative p-5 bg-gradient-to-b from-slate-50 to-white rounded-2xl border border-slate-200 flex flex-col items-center justify-center">
            {/* Corner Alignment Targets */}
            <div className="absolute top-3 left-3 w-4 h-4 border-t-2 border-l-2 border-slate-400 rounded-tl-sm pointer-events-none" />
            <div className="absolute top-3 right-3 w-4 h-4 border-t-2 border-r-2 border-slate-400 rounded-tr-sm pointer-events-none" />
            <div className="absolute bottom-3 left-3 w-4 h-4 border-b-2 border-l-2 border-slate-400 rounded-bl-sm pointer-events-none" />
            <div className="absolute bottom-3 right-3 w-4 h-4 border-b-2 border-r-2 border-slate-400 rounded-br-sm pointer-events-none" />

            {/* QR Canvas Container */}
            <div className="w-56 h-56 sm:w-60 sm:h-60 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-center relative">
              {qrSvg ? (
                <div
                  className="w-full h-full [&>svg]:w-full [&>svg]:h-full"
                  dangerouslySetInnerHTML={{ __html: qrSvg }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">
                  Generating QR...
                </div>
              )}

              {/* Center UPI Badge Overlay */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className="bg-white px-2 py-0.5 rounded-md text-[10px] font-black tracking-wider text-slate-900 border border-slate-300 shadow-xs flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  UPI
                </span>
              </div>
            </div>

            {/* Embedded Payment Value Indicator */}
            <div className="mt-3.5 text-center">
              <div className="text-2xl font-black text-slate-900 font-mono tabular-nums tracking-tight">
                ₹{amount.toLocaleString('en-IN')}
              </div>
              <div className="text-xs text-slate-500 flex items-center justify-center gap-1.5 mt-0.5">
                <span>VPA:</span>
                <span className="font-mono text-slate-700 font-semibold">{merchantVpa}</span>
                <button
                  onClick={handleCopyVpa}
                  className="text-slate-400 hover:text-slate-700 transition-colors ml-0.5"
                  title="Copy VPA"
                >
                  {copiedVpa ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
              <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Compatible with Google Pay, PhonePe, Paytm, BHIM & Navi</span>
              </div>
            </div>
          </div>

          {/* Quick Utility Actions (Copy Link & Download Image) */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={handleCopyLink}
              className="py-2.5 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 font-semibold text-slate-700 flex items-center justify-center gap-1.5 transition-colors"
            >
              {copiedLink ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700">{lang === 'ta' ? 'நகலெடுக்கப்பட்டது' : 'Link Copied'}</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-500" />
                  <span>{lang === 'ta' ? 'UPI இணைப்பை நகலெடு' : 'Copy UPI Link'}</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleDownloadQr}
              className="py-2.5 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 font-semibold text-slate-700 flex items-center justify-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>{lang === 'ta' ? 'QR படத்தைப் பதிவிறக்கு' : 'Download QR Image'}</span>
            </button>
          </div>

          {/* Primary Action Buttons: Mark Paid & WhatsApp Share */}
          <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row gap-2.5">
            <button
              type="button"
              onClick={handleWhatsAppShare}
              className="flex-1 py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors shadow-xs"
            >
              <Share2 className="w-4 h-4 text-emerald-400" />
              <span>{lang === 'ta' ? 'வாட்ஸ்அப்பில் அனுப்பு' : 'Send via WhatsApp'}</span>
            </button>

            <button
              type="button"
              onClick={handleMarkAsSettled}
              disabled={isSettled || amount <= 0}
              className={`flex-1 py-3 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-xs ${
                isSettled
                  ? 'bg-emerald-700 text-white'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              }`}
            >
              {isSettled ? (
                <>
                  <CheckCircle2 className="w-4.5 h-4.5 animate-bounce" />
                  <span>{lang === 'ta' ? 'கணக்கில் வரவு வைக்கப்பட்டது!' : 'Recorded & Settled!'}</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4.5 h-4.5" />
                  <span>
                    {lang === 'ta'
                      ? `பெற்றது (₹${amount}) வரவு வை`
                      : `Mark Received & Settle (₹${amount})`}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
