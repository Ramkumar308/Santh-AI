import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { KhataCustomer, VendorProfile, Language, KhataTransaction } from '../types';
import {
  Printer,
  Copy,
  Check,
  X,
  Volume2,
  Phone,
  FileText,
  Download,
  Smartphone,
  SlidersHorizontal
} from 'lucide-react';
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
  const [downloaded, setDownloaded] = useState(false);
  const [paperWidth, setPaperWidth] = useState<'58mm' | '80mm'>('58mm');
  const [qrSvg, setQrSvg] = useState<string>('');
  const printAreaRef = useRef<HTMLDivElement>(null);

  const dateStr = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const billNumber = `SAN-${Math.floor(100000 + Math.random() * 900000)}`;
  const netDue = customer.totalDue;
  const upiId = vendorProfile.upiId && vendorProfile.upiId.trim().length > 3
    ? vendorProfile.upiId.trim()
    : `${vendorProfile.phone.replace(/[^0-9]/g, '')}@upi` || 'santhai.traders@okaxis';

  const upiUrl = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(vendorProfile.name)}&am=${encodeURIComponent(netDue.toFixed(2))}&cu=INR&tn=${encodeURIComponent(`Khata Summary - ${customer.name}`)}`;

  // Last 5 transactions ordered chronologically (newest at bottom)
  const recentTransactions: KhataTransaction[] = [...customer.transactions].slice(-5);

  // Compute lifetime/ledger totals for summary
  const totalCreditPurchases = customer.transactions
    .filter(t => t.type === 'CREDIT')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalPaymentsReceived = customer.transactions
    .filter(t => t.type === 'PAYMENT')
    .reduce((sum, t) => sum + t.amount, 0);

  const customerName = lang === 'ta' && customer.nameTa ? customer.nameTa : customer.name;

  useEffect(() => {
    QRCode.toString(upiUrl, {
      type: 'svg',
      margin: 1,
      width: paperWidth === '58mm' ? 120 : 150,
      color: { dark: '#000000', light: '#ffffff' }
    })
      .then(setQrSvg)
      .catch(console.error);
  }, [upiUrl, paperWidth]);

  const handlePrint = () => {
    SoundEffects.playClick();
    window.print();
  };

  // Generate ESC/POS formatted plain text for low-cost Bluetooth thermal printer apps (RawBT, POS-Printer)
  const generateEscPosText = (): string => {
    const width = paperWidth === '58mm' ? 32 : 48;
    const pad = (str: string, len: number) => (str + ' '.repeat(len)).slice(0, len);
    const rpad = (str: string, len: number) => (' '.repeat(len) + str).slice(-len);
    const center = (str: string, len: number) => {
      const left = Math.max(0, Math.floor((len - str.length) / 2));
      return ' '.repeat(left) + str;
    };
    const sepDouble = '='.repeat(width);
    const sepSingle = '-'.repeat(width);

    const lines: string[] = [];
    lines.push(center(vendorProfile.marketComplex || 'SANTHAI MANDI', width));
    lines.push(center(`${vendorProfile.stallNumber} - ${vendorProfile.name}`, width));
    lines.push(center(`Ph: +91 ${vendorProfile.phone}`, width));
    lines.push(sepDouble);
    lines.push(center(lang === 'ta' ? 'கடன் கணக்கு ரசீது (KHATA SLIP)' : 'KHATA LEDGER SUMMARY', width));
    lines.push(`${pad('Bill No: ' + billNumber, width - 18)}${rpad(dateStr.slice(0, 16), 18)}`);
    lines.push(sepSingle);
    lines.push(`Customer: ${customerName}`);
    lines.push(`Phone   : ${customer.phone}`);
    lines.push(`Limit   : Rs.${customer.creditLimit} | Risk: ${customer.riskLevel}`);
    lines.push(sepSingle);

    if (billAmount > 0 || paymentAmount > 0) {
      lines.push(center('TODAY TRANSACTION', width));
      if (billAmount > 0) lines.push(`${pad('Produce Billed (Cr)', width - 10)}${rpad('Rs.' + billAmount, 10)}`);
      if (paymentAmount > 0) lines.push(`${pad('Cash Paid (Py)', width - 10)}${rpad('-Rs.' + paymentAmount, 10)}`);
      lines.push(sepSingle);
    }

    lines.push(center('RECENT LEDGER (LAST 5)', width));
    if (paperWidth === '58mm') {
      // 32-col layout
      lines.push(pad('DATE       TYPE      AMOUNT', width));
      recentTransactions.forEach(tx => {
        const sign = tx.type === 'CREDIT' ? '+' : '-';
        const typeStr = tx.type === 'CREDIT' ? 'CR' : 'PY';
        const dateShort = tx.date.slice(5); // MM-DD
        const amtStr = `${sign}Rs.${tx.amount}`;
        lines.push(`${pad(dateShort, 10)}${pad(typeStr, 10)}${rpad(amtStr, width - 20)}`);
        if (tx.itemsDescription) {
          lines.push(` * ${tx.itemsDescription.slice(0, width - 4)}`);
        }
      });
    } else {
      // 48-col layout
      lines.push(`${pad('DATE', 12)}${pad('TYPE', 8)}${pad('PARTICULARS', 16)}${rpad('AMOUNT', 12)}`);
      recentTransactions.forEach(tx => {
        const sign = tx.type === 'CREDIT' ? '+' : '-';
        const typeStr = tx.type === 'CREDIT' ? 'CREDIT' : 'PAYMENT';
        const desc = (tx.itemsDescription || (tx.type === 'CREDIT' ? 'Produce' : 'Cash')).slice(0, 15);
        const amtStr = `${sign}Rs.${tx.amount}`;
        lines.push(`${pad(tx.date, 12)}${pad(typeStr, 8)}${pad(desc, 16)}${rpad(amtStr, 12)}`);
      });
    }

    lines.push(sepSingle);
    lines.push(`${pad('Total Credit Purchases:', width - 12)}${rpad('Rs.' + totalCreditPurchases, 12)}`);
    lines.push(`${pad('Total Payments Settled:', width - 12)}${rpad('Rs.' + totalPaymentsReceived, 12)}`);
    lines.push(sepDouble);
    lines.push(center('NET BALANCE DUE / நிகர பாக்கி', width));
    lines.push(center(`Rs. ${netDue}`, width));
    lines.push(sepDouble);
    lines.push(center('SCAN TO PAY VIA UPI', width));
    lines.push(center(`UPI ID: ${upiId}`, width));
    lines.push(center(`Link: ${upiUrl}`, width));
    lines.push(sepSingle);
    lines.push(center(lang === 'ta' ? 'நன்றி! மீண்டும் வருக!' : 'THANK YOU! VISIT AGAIN!', width));
    lines.push(center('SanthAI Verified Ledger', width));
    lines.push(sepDouble);
    lines.push('\n\n\n'); // ESC/POS paper feed & cut margin

    return lines.join('\n');
  };

  const handleCopyText = () => {
    SoundEffects.playClick();
    const slipText = generateEscPosText();
    navigator.clipboard.writeText(slipText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleDownloadTxt = () => {
    SoundEffects.playClick();
    const slipText = generateEscPosText();
    const blob = new Blob([slipText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Khata_Slip_${customer.name.replace(/\s+/g, '_')}_${billNumber}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 2000);
  };

  const handleSpeakReceipt = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const text = lang === 'ta'
        ? `${customerName} அவர்களின் கடன் கணக்கு விவரம். கடை ${vendorProfile.stallNumber}. கடைசி ஐந்து பரிவர்த்தனைகள் சேர்க்கப்பட்டுள்ளது. தற்போதைய நிகர பாக்கி தொகை ரூபாய் ${netDue}.`
        : `Khata ledger summary for ${customerName}. Stall ${vendorProfile.stallNumber}. Last 5 transactions included. Net balance due is rupees ${netDue}.`;
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang === 'ta' ? 'ta-IN' : 'en-IN';
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-xs overflow-y-auto print:p-0 print:bg-white print:static">
      {/* Dynamic print-optimized style tag for precise 58mm/80mm roll sizing */}
      <style>{`
        @media print {
          @page {
            margin: 0mm;
            size: ${paperWidth === '58mm' ? '58mm auto' : '80mm auto'};
          }
          body {
            margin: 0;
            background: #ffffff !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      `}</style>

      <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full border border-slate-200 overflow-hidden my-auto print:shadow-none print:border-none print:max-w-none print:w-full">
        {/* Top Control Bar (Hidden when printing) */}
        <div className="px-4 py-3 bg-slate-900 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 print:hidden border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Printer className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-sm leading-tight flex items-center gap-2">
                <span>{lang === 'ta' ? 'கடன் ரசீது அச்சு முன்னோட்டம்' : 'Khata Thermal Summary View'}</span>
                <span className="text-[10px] font-mono uppercase bg-slate-800 text-emerald-400 px-1.5 py-0.5 rounded border border-slate-700">
                  {paperWidth}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                {lang === 'ta' ? '58mm பாக்கெட் / 80mm கவுண்டர் பிரிண்டர்' : 'Optimized for Handheld & Counter POS'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            {/* Dual Mode 58mm / 80mm Switcher */}
            <div className="flex items-center p-1 bg-slate-800 rounded-xl border border-slate-700">
              <button
                type="button"
                onClick={() => {
                  SoundEffects.playClick();
                  setPaperWidth('58mm');
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                  paperWidth === '58mm'
                    ? 'bg-emerald-500 text-slate-950 shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="58mm Pocket Bluetooth Printers (2-inch roll)"
              >
                <Smartphone className="w-3 h-3" />
                <span>58mm</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  SoundEffects.playClick();
                  setPaperWidth('80mm');
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                  paperWidth === '80mm'
                    ? 'bg-emerald-500 text-slate-950 shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="80mm Counter POS Printers (3-inch roll)"
              >
                <SlidersHorizontal className="w-3 h-3" />
                <span>80mm</span>
              </button>
            </div>

            <button
              onClick={handleSpeakReceipt}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
              title="Voice Readout"
            >
              <Volume2 className="w-4 h-4 text-emerald-400" />
            </button>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
              title="Close Preview"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Thermal Paper Simulation Area */}
        <div className="p-4 sm:p-6 bg-slate-100/80 flex justify-center items-center overflow-x-auto max-h-[72vh] print:max-h-none print:p-0 print:bg-white">
          <div
            ref={printAreaRef}
            className={`bg-white font-mono text-black transition-all shadow-md border border-slate-300 print:shadow-none print:border-none print:m-0 ${
              paperWidth === '58mm'
                ? 'w-[290px] max-w-[290px] p-3 text-[10px] leading-tight print:w-[58mm] print:max-w-[58mm] print:p-1.5'
                : 'w-[390px] max-w-[390px] p-4 text-[12px] leading-normal print:w-[80mm] print:max-w-[80mm] print:p-2.5'
            }`}
            style={{
              fontFamily: '"Courier New", Courier, monospace',
              color: '#000000',
              backgroundColor: '#ffffff'
            }}
          >
            {/* Header: Stall & Market Identity */}
            <div className="text-center pb-2 border-b-2 border-dashed border-black space-y-0.5">
              <div className="font-black text-sm tracking-wider uppercase">
                {vendorProfile.marketComplex || 'SANTHAI VEGETABLE MANDI'}
              </div>
              <div className="font-extrabold text-xs">
                {vendorProfile.stallNumber} - {vendorProfile.name}
              </div>
              <div className="text-[10px] flex items-center justify-center gap-1 font-bold">
                <Phone className="w-2.5 h-2.5 inline print:hidden" />
                <span>PH: +91 {vendorProfile.phone}</span>
              </div>
              <div className="text-[9px] font-semibold">
                GST/Mandi ID: VPA-{vendorProfile.phone.slice(-4)}
              </div>
            </div>

            {/* Bill Details */}
            <div className="py-1.5 border-b border-dashed border-black flex justify-between text-[10px]">
              <div>
                <span className="font-bold">{lang === 'ta' ? 'ரசீது' : 'SLIP'}: </span>
                <span>{billNumber}</span>
              </div>
              <div className="text-right">
                <span>{dateStr}</span>
              </div>
            </div>

            {/* Customer Ledger Profile */}
            <div className="py-2 border-b border-dashed border-black space-y-0.5">
              <div className="flex justify-between font-bold">
                <span>{lang === 'ta' ? 'வாடிக்கையாளர் / CUST:' : 'CUSTOMER:'}</span>
                <span className="text-right truncate max-w-[170px]">{customerName}</span>
              </div>
              <div className="flex justify-between text-[10px]">
                <span>{lang === 'ta' ? 'அலைபேசி / PHONE:' : 'PHONE:'}</span>
                <span>+91 {customer.phone}</span>
              </div>
              <div className="flex justify-between text-[10px]">
                <span>{lang === 'ta' ? 'கடன் வரம்பு / LIMIT:' : 'CREDIT LIMIT:'}</span>
                <span>₹{customer.creditLimit}</span>
              </div>
              <div className="flex justify-between text-[10px]">
                <span>{lang === 'ta' ? 'ஒழுங்கு / REPAYMENT:' : 'DISCIPLINE:'}</span>
                <span>{Math.round(customer.onTimePaymentRatio * 100)}% ({customer.riskLevel} Risk)</span>
              </div>
            </div>

            {/* Current Session Bill Event (If triggered after adding credit/payment) */}
            {(billAmount > 0 || paymentAmount > 0) && (
              <div className="py-2 border-b-2 border-dashed border-black space-y-1 bg-slate-50 print:bg-transparent">
                <div className="text-center font-black text-[10px] uppercase tracking-wider">
                  {lang === 'ta' ? 'இன்றைய கொள்முதல் / வரவு' : 'TODAY TRANSACTION ENTRY'}
                </div>
                {billAmount > 0 && (
                  <div className="flex justify-between font-bold">
                    <span>(+) {lang === 'ta' ? 'புதிய கடன்' : 'Produce Credit'}:</span>
                    <span>₹{billAmount}</span>
                  </div>
                )}
                {paymentAmount > 0 && (
                  <div className="flex justify-between font-bold">
                    <span>(-) {lang === 'ta' ? 'செலுத்திய ரொக்கம்' : 'Cash Received'}:</span>
                    <span>-₹{paymentAmount}</span>
                  </div>
                )}
              </div>
            )}

            {/* Recent Transaction Ledger Table (Last 5) */}
            <div className="py-2 border-b border-dashed border-black">
              <div className="text-center font-black text-[10px] uppercase tracking-wider mb-1.5">
                {lang === 'ta' ? 'சமீபத்திய கணக்கு பதிவுகள் (கடைசி 5)' : 'RECENT TRANSACTIONS (LAST 5)'}
              </div>

              {/* Table Column Header */}
              {paperWidth === '58mm' ? (
                // 58mm compact layout
                <div className="space-y-1">
                  <div className="flex justify-between font-black text-[9px] border-b border-black pb-0.5">
                    <span>DATE / TYPE</span>
                    <span>AMOUNT (₹)</span>
                  </div>
                  {recentTransactions.map((tx, idx) => {
                    const isCredit = tx.type === 'CREDIT';
                    return (
                      <div key={tx.id || idx} className="py-0.5 text-[9px]">
                        <div className="flex justify-between font-bold">
                          <span>
                            {tx.date.slice(5)}{' '}
                            <span className="font-extrabold">{isCredit ? '[CR]' : '[PY]'}</span>
                          </span>
                          <span>{isCredit ? `+₹${tx.amount}` : `-₹${tx.amount}`}</span>
                        </div>
                        {tx.itemsDescription && (
                          <div className="text-[8px] italic text-slate-700 print:text-black pl-1 truncate">
                            * {tx.itemsDescription}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                // 80mm spacious layout
                <div>
                  <div className="grid grid-cols-12 font-black text-[10px] border-b border-black pb-0.5">
                    <span className="col-span-3">DATE</span>
                    <span className="col-span-2">TYPE</span>
                    <span className="col-span-4">ITEMS</span>
                    <span className="col-span-3 text-right">AMOUNT</span>
                  </div>
                  <div className="divide-y divide-dashed divide-slate-300 print:divide-black text-[10px]">
                    {recentTransactions.map((tx, idx) => {
                      const isCredit = tx.type === 'CREDIT';
                      return (
                        <div key={tx.id || idx} className="grid grid-cols-12 py-1 items-center">
                          <span className="col-span-3 text-[9px]">{tx.date}</span>
                          <span className="col-span-2 font-bold">{isCredit ? 'CR' : 'PY'}</span>
                          <span className="col-span-4 truncate text-[9px]">
                            {tx.itemsDescription || (isCredit ? 'Vegetables' : 'Cash')}
                          </span>
                          <span className="col-span-3 text-right font-black">
                            {isCredit ? `+₹${tx.amount}` : `-₹${tx.amount}`}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Ledger Totals & Outstanding Net Balance Due */}
            <div className="py-2 border-b-2 border-black space-y-1">
              <div className="flex justify-between text-[10px]">
                <span>{lang === 'ta' ? 'மொத்த கடன் கொள்முதல்' : 'Total Credit Billed'}:</span>
                <span className="font-bold">₹{totalCreditPurchases}</span>
              </div>
              <div className="flex justify-between text-[10px]">
                <span>{lang === 'ta' ? 'மொத்த வரவு செலுத்தியது' : 'Total Payments Made'}:</span>
                <span className="font-bold">₹{totalPaymentsReceived}</span>
              </div>
              <div className="pt-1.5 mt-1 border-t-2 border-black flex justify-between items-center">
                <span className="font-black text-xs uppercase">
                  {lang === 'ta' ? 'நிலுவை பாக்கி / TOTAL DUE:' : 'NET BALANCE DUE:'}
                </span>
                <span className="font-black text-base tracking-tight">
                  ₹{netDue}
                </span>
              </div>
            </div>

            {/* Scannable UPI QR Code Block for Handheld Thermal Roll */}
            <div className="py-2.5 text-center border-b-2 border-dashed border-black">
              <div className="font-black text-[10px] uppercase tracking-wider mb-1">
                {lang === 'ta' ? 'UPI ஸ்கேன் செய்து செலுத்த' : 'SCAN TO PAY VIA UPI'}
              </div>

              {/* High-Contrast Thermal Pure B&W Vector QR */}
              <div className="inline-block p-1 bg-white border-2 border-black rounded-lg">
                <div
                  className={`mx-auto flex items-center justify-center bg-white ${
                    paperWidth === '58mm' ? 'w-28 h-28' : 'w-36 h-36'
                  }`}
                >
                  {qrSvg ? (
                    <div
                      className="w-full h-full [&>svg]:w-full [&>svg]:h-full"
                      dangerouslySetInnerHTML={{ __html: qrSvg }}
                    />
                  ) : (
                    <div className="text-[10px]">Generating QR...</div>
                  )}
                </div>
              </div>

              <div className="mt-1 font-mono font-bold text-[10px] break-all">
                {upiId}
              </div>
              <div className="text-[8px] font-semibold text-slate-700 print:text-black">
                {lang === 'ta' ? 'GPay · PhonePe · Paytm · BHIM ஏற்றுக் கொள்ளப்படும்' : 'Accepts GPay · PhonePe · Paytm · BHIM'}
              </div>
            </div>

            {/* Footer Blessing & Verification */}
            <div className="pt-2 text-center space-y-0.5 text-[9px] font-semibold">
              <div>
                {lang === 'ta'
                  ? 'நன்றி! மீண்டும் வருக! வாழ்க வளமுடன்!'
                  : 'THANK YOU! VISIT AGAIN!'}
              </div>
              <div className="text-[8px] text-slate-600 print:text-black">
                SanthAI Micro-Ledger Engine • v2.6.4
              </div>
              <div className="text-[7px] text-slate-500 print:text-black">
                *** COMPUTER GENERATED KHATA SLIP ***
              </div>
            </div>
          </div>
        </div>

        {/* Action Controls (Hidden on Print) */}
        <div className="p-3 sm:p-4 bg-white border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 print:hidden">
          <div className="flex items-center gap-1.5">
            {/* Plaintext ESC/POS Copy for RawBT Bluetooth Printer App */}
            <button
              type="button"
              onClick={handleCopyText}
              className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-800 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors border border-slate-200"
              title="Copy plain-text ESC/POS formatted slip for Bluetooth printer apps like RawBT"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-600" />}
              <span>{copied ? (lang === 'ta' ? 'நகலெடுக்கப்பட்டது' : 'Copied!') : (lang === 'ta' ? 'RawBT உரை' : 'Copy (RawBT)')}</span>
            </button>

            {/* Download TXT Slip */}
            <button
              type="button"
              onClick={handleDownloadTxt}
              className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-800 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors border border-slate-200"
              title="Download text file of this receipt"
            >
              {downloaded ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Download className="w-3.5 h-3.5 text-slate-600" />}
              <span className="hidden sm:inline">{downloaded ? 'Saved!' : 'Save .TXT'}</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-3.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs transition-colors"
            >
              {lang === 'ta' ? 'மூடு' : 'Close'}
            </button>

            {/* Trigger Browser / USB / Bluetooth Thermal Print */}
            <button
              type="button"
              onClick={handlePrint}
              className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-black rounded-xl text-xs sm:text-sm flex items-center gap-2 shadow-sm transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>{lang === 'ta' ? 'ரசீதை அச்சிடு (Print)' : 'Print Thermal Slip'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
