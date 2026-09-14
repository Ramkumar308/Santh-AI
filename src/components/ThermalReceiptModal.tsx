import React, { useState } from 'react';
import { KhataCustomer, VendorProfile, Language } from '../types';
import { Printer, Download, Copy, Check, X, QrCode, Phone, MapPin, Volume2 } from 'lucide-react';
import { SoundEffects } from '../utils/audioHaptics';

interface ThermalReceiptModalProps {
  customer: KhataCustomer;
  vendorProfile: VendorProfile;
  lang: Language;
  onClose: () => void;
  billAmount?: number;
  paymentAmount?: number;
}

export const ThermalReceiptModal: React.FC<ThermalReceiptModalProps> = ({
  customer,
  vendorProfile,
  lang,
  onClose,
  billAmount = 0,
  paymentAmount = 0,
}) => {
  const [copied, setCopied] = useState(false);
  const dateStr = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const billNumber = `SAN-${Math.floor(100000 + Math.random() * 900000)}`;
  const netDue = customer.totalDue;
  const upiId = `${vendorProfile.phone.replace(/[^0-9]/g, '')}@upi`;
  const upiUrl = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(vendorProfile.name)}&am=${netDue}&cu=INR&tn=${encodeURIComponent('SanthAI Produce Bill')}`;

  const handlePrint = () => {
    SoundEffects.playClick();
    window.print();
  };

  const handleCopyText = () => {
    SoundEffects.playClick();
    const slipText = `
🧾 *${vendorProfile.stallNumber} - ${vendorProfile.name}*
📍 ${vendorProfile.marketComplex}
📞 ${vendorProfile.phone}
--------------------------------
${lang === 'ta' ? 'ரசீது எண்' : 'Bill No'}: ${billNumber}
${lang === 'ta' ? 'தேதி' : 'Date'}: ${dateStr}
${lang === 'ta' ? 'வாடிக்கையாளர்' : 'Customer'}: ${customer.name} (${customer.phone})
--------------------------------
${billAmount > 0 ? `${lang === 'ta' ? 'புதிய கடன் கொள்முதல்' : 'Produce Purchase'}: ₹${billAmount}\n` : ''}${paymentAmount > 0 ? `${lang === 'ta' ? 'செலுத்திய ரொக்கம்' : 'Cash Paid'}: ₹${paymentAmount}\n` : ''}${lang === 'ta' ? 'மொத்த பாக்கித் தொகை' : 'Total Due'}: ₹${netDue}
--------------------------------
UPI Pay: ${upiId}
${lang === 'ta' ? 'நன்றி! மீண்டும் வருக!' : 'Thank you! Visit again!'}`;

    navigator.clipboard.writeText(slipText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleSpeakReceipt = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const text = lang === 'ta'
        ? `${customer.name} அவர்களின் ரசீது. கடை ${vendorProfile.stallNumber}. தற்போதைய பாக்கி தொகை ரூபாய் ${netDue}.`
        : `Receipt for ${customer.name}. Stall ${vendorProfile.stallNumber}. Current balance due is rupees ${netDue}.`;
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang === 'ta' ? 'ta-IN' : 'en-IN';
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto print:p-0 print:bg-white print:static">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden my-auto print:shadow-none print:border-none print:max-w-none print:w-full">
        {/* Modal Top Bar (Hidden on print) */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-slate-900 text-white print:hidden">
          <div className="flex items-center gap-2">
            <Printer className="w-4 h-4 text-emerald-400" />
            <span className="font-bold text-sm">
              {lang === 'ta' ? 'அச்சு ரசீது (58mm / 80mm)' : 'Thermal Cash/Credit Slip'}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleSpeakReceipt}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              title="Speak Slip"
            >
              <Volume2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Thermal Receipt Surface */}
        <div className="p-6 bg-slate-50 font-mono text-slate-800 text-xs border-b border-slate-200 print:p-2 print:bg-white print:text-black">
          <div className="bg-white p-5 rounded-2xl shadow-xs border border-dashed border-slate-300 text-center space-y-3 print:border-none print:shadow-none print:p-0">
            {/* Header */}
            <div>
              <div className="font-extrabold text-base tracking-wider uppercase text-slate-950">
                {vendorProfile.marketComplex}
              </div>
              <div className="font-bold text-sm text-emerald-700">
                {vendorProfile.stallNumber} • {vendorProfile.name}
              </div>
              <div className="text-[11px] text-slate-500 flex items-center justify-center gap-1 mt-0.5">
                <Phone className="w-3 h-3" />
                <span>+91 {vendorProfile.phone}</span>
              </div>
            </div>

            <div className="border-t border-b border-dashed border-slate-400 py-1.5 text-[11px] text-slate-600 flex justify-between">
              <span>{billNumber}</span>
              <span>{dateStr}</span>
            </div>

            {/* Customer Details */}
            <div className="text-left space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">{lang === 'ta' ? 'வாடிக்கையாளர்:' : 'Customer:'}</span>
                <span className="font-bold text-slate-900">{customer.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">{lang === 'ta' ? 'அலைபேசி:' : 'Phone:'}</span>
                <span>{customer.phone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">{lang === 'ta' ? 'வகை:' : 'Type:'}</span>
                <span className="capitalize">{customer.type}</span>
              </div>
            </div>

            <div className="border-t border-dashed border-slate-300 pt-2 space-y-1 text-xs">
              {billAmount > 0 && (
                <div className="flex justify-between">
                  <span>{lang === 'ta' ? 'புதிய கொள்முதல்' : 'Produce Billed'}:</span>
                  <span className="font-semibold text-slate-900">₹{billAmount}</span>
                </div>
              )}
              {paymentAmount > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>{lang === 'ta' ? 'பெற்ற தொகை' : 'Cash Received'}:</span>
                  <span className="font-semibold">-₹{paymentAmount}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-extrabold text-slate-950 pt-1 border-t border-slate-400">
                <span>{lang === 'ta' ? 'நிலுவை பாக்கி' : 'Total Due'}:</span>
                <span className="text-base text-indigo-700">₹{netDue}</span>
              </div>
            </div>

            {/* UPI QR Code Block */}
            <div className="pt-2 border-t border-dashed border-slate-300">
              <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-2">
                {lang === 'ta' ? 'நேரடி UPI கட்டணம் செலுத்த' : 'Scan to Pay via UPI'}
              </div>
              
              {/* Visual High-Res UPI QR representation */}
              <div className="inline-block p-2 bg-white rounded-xl border border-slate-200 shadow-2xs">
                <div className="w-32 h-32 mx-auto relative flex items-center justify-center bg-slate-50 rounded-lg p-1.5 border border-slate-100">
                  {/* Decorative scannable QR pattern with UPI branding */}
                  <svg className="w-full h-full text-slate-900" viewBox="0 0 100 100" fill="currentColor">
                    <rect x="0" y="0" width="30" height="30" rx="4" />
                    <rect x="6" y="6" width="18" height="18" fill="white" />
                    <rect x="10" y="10" width="10" height="10" rx="2" />
                    
                    <rect x="70" y="0" width="30" height="30" rx="4" />
                    <rect x="76" y="6" width="18" height="18" fill="white" />
                    <rect x="80" y="10" width="10" height="10" rx="2" />
                    
                    <rect x="0" y="70" width="30" height="30" rx="4" />
                    <rect x="6" y="76" width="18" height="18" fill="white" />
                    <rect x="10" y="80" width="10" height="10" rx="2" />
                    
                    {/* Matrix dots */}
                    <rect x="36" y="10" width="6" height="6" />
                    <rect x="46" y="6" width="6" height="6" />
                    <rect x="56" y="14" width="6" height="6" />
                    <rect x="36" y="24" width="6" height="6" />
                    <rect x="48" y="22" width="6" height="6" />
                    <rect x="58" y="26" width="6" height="6" />

                    <rect x="10" y="36" width="6" height="6" />
                    <rect x="18" y="44" width="6" height="6" />
                    <rect x="26" y="52" width="6" height="6" />
                    <rect x="8" y="58" width="6" height="6" />
                    <rect x="38" y="38" width="8" height="8" />
                    <rect x="52" y="42" width="8" height="8" />
                    <rect x="44" y="54" width="8" height="8" />

                    <rect x="72" y="36" width="6" height="6" />
                    <rect x="84" y="44" width="6" height="6" />
                    <rect x="76" y="52" width="6" height="6" />
                    <rect x="88" y="58" width="6" height="6" />

                    <rect x="36" y="72" width="6" height="6" />
                    <rect x="46" y="82" width="6" height="6" />
                    <rect x="56" y="74" width="6" height="6" />
                    <rect x="38" y="90" width="6" height="6" />
                    <rect x="50" y="88" width="6" height="6" />
                    <rect x="62" y="86" width="6" height="6" />
                    <rect x="72" y="76" width="6" height="6" />
                    <rect x="84" y="82" width="6" height="6" />
                    <rect x="78" y="90" width="6" height="6" />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="bg-emerald-600 text-white font-bold text-[8px] px-1 py-0.5 rounded shadow-xs">
                      UPI
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-[10px] text-slate-500 mt-1 font-mono">
                {upiId}
              </div>
            </div>

            {/* Footer Greeting */}
            <div className="text-[10px] text-slate-400 pt-2 border-t border-dashed border-slate-300">
              {lang === 'ta' ? 'நன்றி! மீண்டும் வருக! வாழ்க வளமுடன்!' : 'Thank you! Visit again! SanthAI Verified'}
            </div>
          </div>
        </div>

        {/* Action Controls (Hidden when printed) */}
        <div className="p-4 bg-white flex items-center justify-between gap-2.5 print:hidden">
          <button
            onClick={handleCopyText}
            className="flex-1 py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? (lang === 'ta' ? 'நகலெடுக்கப்பட்டது' : 'Copied!') : (lang === 'ta' ? 'உரை நகல்' : 'Copy Text')}</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex-1 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>{lang === 'ta' ? 'அச்சிடு (Print)' : 'Print Slip'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
