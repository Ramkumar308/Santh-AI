import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { KhataCustomer, VendorProfile, Language } from '../types';
import {
  QrCode,
  CheckCircle2,
  X,
  Share2,
  Download,
  Printer,
  Search,
  Filter,
  Volume2,
  ExternalLink,
  ShieldCheck,
  Check,
  Copy
} from 'lucide-react';
import { SoundEffects } from '../utils/audioHaptics';
import confetti from 'canvas-confetti';
import { KhataService } from '../services/khata';

interface KhataAllQrModalProps {
  customers: KhataCustomer[];
  vendorProfile: VendorProfile;
  lang: Language;
  onClose: () => void;
  onSettlePayment: (customerId: string, amount: number) => void;
  onOpenSingleQr: (customer: KhataCustomer) => void;
}

interface CustomerQrItem {
  customer: KhataCustomer;
  upiUrl: string;
  qrSvg: string;
  qrDataUrl: string;
}

export const KhataAllQrModal: React.FC<KhataAllQrModalProps> = ({
  customers,
  vendorProfile,
  lang,
  onClose,
  onSettlePayment,
  onOpenSingleQr
}) => {
  const [filterType, setFilterType] = useState<'all' | 'due' | 'high_risk'>('due');
  const [searchQuery, setSearchQuery] = useState('');
  const [qrItems, setQrItems] = useState<Record<string, CustomerQrItem>>({});
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [settledMap, setSettledMap] = useState<Record<string, boolean>>({});

  const merchantVpa = vendorProfile.upiId && vendorProfile.upiId.trim().length > 3
    ? vendorProfile.upiId.trim()
    : 'santhai.traders@okaxis';
  const merchantName = vendorProfile.name || 'SanthAI Wholesaler';

  // Generate QR codes for all customers based on their totalDue balance
  useEffect(() => {
    let isCancelled = false;

    const generateAll = async () => {
      setLoading(true);
      const results: Record<string, CustomerQrItem> = {};

      for (const cust of customers) {
        const amount = cust.totalDue > 0 ? cust.totalDue : 0;
        const upiUrl = KhataService.generateUpiUrl(cust, vendorProfile, amount);

        try {
          const qrSvg = await QRCode.toString(upiUrl, {
            type: 'svg',
            margin: 1,
            color: {
              dark: '#0f172a',
              light: '#ffffff'
            }
          });

          const qrDataUrl = await QRCode.toDataURL(upiUrl, {
            margin: 1,
            width: 280,
            color: {
              dark: '#0f172a',
              light: '#ffffff'
            }
          });

          results[cust.id] = {
            customer: cust,
            upiUrl,
            qrSvg,
            qrDataUrl
          };
        } catch (e) {
          console.error(`Failed to generate QR for customer ${cust.name}:`, e);
        }
      }

      if (!isCancelled) {
        setQrItems(results);
        setLoading(false);
      }
    };

    generateAll();

    return () => {
      isCancelled = true;
    };
  }, [customers, vendorProfile]);

  const filteredCustomers = customers.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery) ||
      (c.nameTa && c.nameTa.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    if (filterType === 'due') {
      return c.totalDue > 0;
    }
    if (filterType === 'high_risk') {
      return c.riskLevel === 'High';
    }
    return true;
  });

  const handleCopyLink = (customerId: string, upiUrl: string) => {
    SoundEffects.playClick();
    navigator.clipboard.writeText(upiUrl).then(() => {
      setCopiedId(customerId);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const handleDownloadQr = (cust: KhataCustomer, dataUrl: string) => {
    SoundEffects.playClick();
    if (!dataUrl) return;
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `UPI-QR-${cust.name.replace(/\s+/g, '_')}-₹${cust.totalDue}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleQuickSettle = (cust: KhataCustomer) => {
    if (cust.totalDue <= 0 || settledMap[cust.id]) return;

    SoundEffects.playSuccess();
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.6 }
    });

    setSettledMap(prev => ({ ...prev, [cust.id]: true }));
    onSettlePayment(cust.id, cust.totalDue);
  };

  const handlePrint = () => {
    SoundEffects.playClick();
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/75 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl max-w-5xl w-full border border-slate-200 overflow-hidden my-auto flex flex-col max-h-[92vh]">
        {/* Top Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 bg-slate-900 text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg leading-tight flex items-center gap-2">
                <span>{lang === 'ta' ? 'அனைத்து வாடிக்கையாளர் UPI QR குறியீடுகள்' : 'Customer UPI QR Directory'}</span>
                <span className="text-xs font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-2 py-0.5 rounded-full">
                  {customers.length} {lang === 'ta' ? 'கணக்குகள்' : 'Ledgers'}
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {lang === 'ta'
                  ? 'ஒவ்வொரு வாடிக்கையாளரின் மொத்த பாக்கித் தொகைக்கு (totalDue) ஏற்ப உருவாக்கப்பட்ட நேரடி QR குறியீடுகள்'
                  : 'QR codes generated dynamically from each customer\'s totalDue balance for instant counter payments'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors border border-slate-700"
              title="Print Customer QR Book"
            >
              <Printer className="w-4 h-4 text-indigo-400" />
              <span>{lang === 'ta' ? 'அச்சு செய்' : 'Print QR Book'}</span>
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

        {/* Filter and Search Bar */}
        <div className="p-4 sm:px-6 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            <button
              onClick={() => {
                SoundEffects.playClick();
                setFilterType('due');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                filterType === 'due'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              {lang === 'ta' ? 'பாக்கி உள்ளவர்கள் மட்டும்' : 'Pending Dues Only'} (
              {customers.filter(c => c.totalDue > 0).length})
            </button>

            <button
              onClick={() => {
                SoundEffects.playClick();
                setFilterType('all');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                filterType === 'all'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              {lang === 'ta' ? 'அனைத்து வாடிக்கையாளர்கள்' : 'All Customers'} ({customers.length})
            </button>

            <button
              onClick={() => {
                SoundEffects.playClick();
                setFilterType('high_risk');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                filterType === 'high_risk'
                  ? 'bg-rose-700 text-white shadow-xs'
                  : 'bg-white text-rose-700 border border-rose-200 hover:bg-rose-50'
              }`}
            >
              {lang === 'ta' ? 'அதிக அபாயம்' : 'High Risk'} (
              {customers.filter(c => c.riskLevel === 'High').length})
            </button>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={lang === 'ta' ? 'பெயர் / எண் மூலம் தேடு...' : 'Search by name or phone...'}
              className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* QR Grid Container */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {loading ? (
            <div className="py-16 text-center text-slate-400 space-y-2">
              <QrCode className="w-8 h-8 mx-auto animate-pulse text-emerald-500" />
              <p className="text-xs font-semibold">
                {lang === 'ta' ? 'UPI QR குறியீடுகள் உருவாக்கப்படுகின்றன...' : 'Generating UPI QR codes for customers...'}
              </p>
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="py-16 text-center text-slate-400 space-y-2">
              <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500" />
              <p className="text-sm font-bold text-slate-700">
                {lang === 'ta' ? 'வாடிக்கையாளர்கள் எதுவும் கிடைக்கவில்லை' : 'No matching customers found'}
              </p>
              <p className="text-xs text-slate-400">
                {filterType === 'due'
                  ? 'Great news! All customers in this filter have zero pending dues.'
                  : 'Try modifying your search or filter criteria.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCustomers.map(cust => {
                const item = qrItems[cust.id];
                const displayName = lang === 'ta' && cust.nameTa ? cust.nameTa : cust.name;
                const isSettled = settledMap[cust.id];
                const isCopied = copiedId === cust.id;

                return (
                  <div
                    key={cust.id}
                    className="bg-white rounded-2xl border-2 border-slate-200 hover:border-slate-300 p-4 shadow-xs flex flex-col justify-between transition-all group"
                  >
                    <div>
                      {/* Customer Card Header */}
                      <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-slate-100">
                        <div>
                          <h4 className="font-bold text-sm text-slate-900 leading-tight">
                            {displayName}
                          </h4>
                          <span className="text-xs text-slate-500 font-mono mt-0.5 block">
                            {cust.phone}
                          </span>
                        </div>

                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                            cust.riskLevel === 'Low'
                              ? 'bg-emerald-100 text-emerald-800'
                              : cust.riskLevel === 'Medium'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {cust.riskLevel}
                        </span>
                      </div>

                      {/* Balance Due Highlight */}
                      <div className="my-2.5 flex items-baseline justify-between bg-slate-50 px-3 py-2 rounded-xl border border-slate-100">
                        <span className="text-xs text-slate-500 font-medium">
                          {lang === 'ta' ? 'பாக்கி தொகை' : 'Balance Due'}:
                        </span>
                        <div className="text-lg font-black font-mono tabular-nums text-rose-700">
                          ₹{cust.totalDue.toLocaleString('en-IN')}
                        </div>
                      </div>

                      {/* QR Display */}
                      <div className="relative p-2 bg-slate-50 rounded-xl border border-slate-200 flex flex-col items-center justify-center mb-3">
                        <div className="w-36 h-36 bg-white p-2 rounded-lg border border-slate-200 shadow-2xs flex items-center justify-center relative">
                          {item?.qrSvg ? (
                            <div
                              className="w-full h-full [&>svg]:w-full [&>svg]:h-full"
                              dangerouslySetInnerHTML={{ __html: item.qrSvg }}
                            />
                          ) : (
                            <div className="text-xs text-slate-400">Loading...</div>
                          )}

                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <span className="bg-white px-1.5 py-0.2 rounded text-[9px] font-black text-slate-900 border border-slate-300 shadow-2xs">
                              UPI
                            </span>
                          </div>
                        </div>

                        <div className="text-[10px] text-slate-500 font-mono mt-1.5 text-center truncate w-full">
                          {merchantVpa}
                        </div>
                      </div>
                    </div>

                    {/* Quick Action Buttons */}
                    <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs">
                      <div className="grid grid-cols-2 gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleCopyLink(cust.id, item?.upiUrl || '')}
                          className="py-1.5 px-2 rounded-lg border border-slate-200 hover:bg-slate-50 font-medium text-slate-700 flex items-center justify-center gap-1 transition-colors text-[11px]"
                          title="Copy UPI Payment Link"
                        >
                          {isCopied ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-600" />
                              <span className="text-emerald-700">{lang === 'ta' ? 'நகலானது' : 'Copied'}</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3 text-slate-500" />
                              <span>{lang === 'ta' ? 'இணைப்பு' : 'Copy Link'}</span>
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDownloadQr(cust, item?.qrDataUrl || '')}
                          className="py-1.5 px-2 rounded-lg border border-slate-200 hover:bg-slate-50 font-medium text-slate-700 flex items-center justify-center gap-1 transition-colors text-[11px]"
                          title="Download QR Image PNG"
                        >
                          <Download className="w-3 h-3 text-slate-500" />
                          <span>{lang === 'ta' ? 'படத்தை எடு' : 'Save QR'}</span>
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            SoundEffects.playClick();
                            onOpenSingleQr(cust);
                          }}
                          className="py-2 px-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold flex items-center justify-center gap-1 transition-colors text-[11px]"
                        >
                          <QrCode className="w-3.5 h-3.5 text-emerald-400" />
                          <span>{lang === 'ta' ? 'விரிவாக்கு' : 'Open QR'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleQuickSettle(cust)}
                          disabled={cust.totalDue <= 0 || isSettled}
                          className={`py-2 px-2 rounded-xl font-bold flex items-center justify-center gap-1 transition-colors text-[11px] ${
                            isSettled
                              ? 'bg-emerald-700 text-white'
                              : cust.totalDue <= 0
                                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs'
                          }`}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{isSettled ? 'Settled' : 'Quick Settle'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500 shrink-0">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>
              {lang === 'ta'
                ? 'NPCI UPI தரநிலை: Google Pay, PhonePe, Paytm, BHIM செயலிகளில் உடனே வேலை செய்யும்'
                : 'Standard NPCI UPI Scheme: Instantly scannable using Google Pay, PhonePe, Paytm, and BHIM'}
            </span>
          </div>

          <div className="text-[11px] font-mono text-slate-400">
            {lang === 'ta' ? 'கடை UPI' : 'Merchant UPI'}: <span className="text-slate-700 font-semibold">{merchantVpa}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
