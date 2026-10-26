import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import {
  KhataCustomer,
  KhataTransaction,
  VendorProfile,
  Language,
  ViewMode
} from '../types';
import { KhataService } from '../services/khata';
import { t, speakText } from '../utils/i18n';
import {
  ShieldCheck,
  AlertCircle,
  Phone,
  Send,
  PlusCircle,
  CheckCircle2,
  Clock,
  ExternalLink,
  Volume2,
  Info,
  DollarSign,
  UserPlus,
  Printer,
  QrCode,
  Copy,
  Check,
  Download,
  Share2,
  Search,
  Maximize2
} from 'lucide-react';
import { ThermalReceiptModal } from './ThermalReceiptModal';
import { KhataUpiQrModal } from './KhataUpiQrModal';
import { KhataAllQrModal } from './KhataAllQrModal';
import { SoundEffects } from '../utils/audioHaptics';
import confetti from 'canvas-confetti';

interface KhataModuleProps {
  customers: KhataCustomer[];
  onAddTransaction: (customerId: string, tx: Omit<KhataTransaction, 'id'>) => void;
  onAddCustomer: (customer: Omit<KhataCustomer, 'id' | 'transactions' | 'riskScore' | 'riskLevel' | 'onTimePaymentRatio'>) => void;
  vendorProfile: VendorProfile;
  lang: Language;
  viewMode: ViewMode;
}

export const KhataModule: React.FC<KhataModuleProps> = ({
  customers,
  onAddTransaction,
  onAddCustomer,
  vendorProfile,
  lang,
  viewMode
}) => {
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(customers[0]?.id || '');
  const [isNewTxModalOpen, setIsNewTxModalOpen] = useState<boolean>(false);
  const [isNewCustomerModalOpen, setIsNewCustomerModalOpen] = useState<boolean>(false);
  const [isUpiQrModalOpen, setIsUpiQrModalOpen] = useState<boolean>(false);
  const [isAllQrModalOpen, setIsAllQrModalOpen] = useState<boolean>(false);
  const [qrModalCustomer, setQrModalCustomer] = useState<KhataCustomer | null>(null);

  // Search & Filter state for customer list
  const [customerSearch, setCustomerSearch] = useState<string>('');
  const [customerFilter, setCustomerFilter] = useState<'all' | 'due' | 'high_risk'>('all');

  // Inline dynamic QR state for selected customer
  const [inlineQrSvg, setInlineQrSvg] = useState<string>('');
  const [inlineQrDataUrl, setInlineQrDataUrl] = useState<string>('');
  const [copiedInlineLink, setCopiedInlineLink] = useState<boolean>(false);
  const [copiedInlineVpa, setCopiedInlineVpa] = useState<boolean>(false);

  // Thermal Slip & Receipt Modal state (for non-WhatsApp / elderly / cash customers)
  const [receiptCustomer, setReceiptCustomer] = useState<KhataCustomer | null>(null);
  const [receiptBillAmount, setReceiptBillAmount] = useState<number>(0);
  const [receiptPaymentAmount, setReceiptPaymentAmount] = useState<number>(0);

  const handleUpiSettle = (customerId: string, amount: number) => {
    const today = new Date().toISOString().split('T')[0];
    onAddTransaction(customerId, {
      date: today,
      type: 'PAYMENT',
      amount: amount,
      itemsDescription: 'UPI Instant Scan Settlement',
      daysDelayed: 0
    });
  };

  // New Transaction form state
  const [txType, setTxType] = useState<'CREDIT' | 'PAYMENT'>('PAYMENT');
  const [txAmount, setTxAmount] = useState<number>(300);
  const [txItems, setTxItems] = useState<string>('Tomato & Onion');
  const [txDaysDelay, setTxDaysDelay] = useState<number>(0);

  // New Customer form state
  const [newCustName, setNewCustName] = useState<string>('');
  const [newCustPhone, setNewCustPhone] = useState<string>('');
  const [newCustLimit, setNewCustLimit] = useState<number>(2000);
  const [newCustInitialDue, setNewCustInitialDue] = useState<number>(0);

  const selectedCustomer = customers.find(c => c.id === selectedCustomerId) || customers[0];

  const totalOutstandingDue = customers.reduce((sum, c) => sum + c.totalDue, 0);
  const highRiskCount = customers.filter(c => c.riskLevel === 'High').length;

  const merchantVpa = vendorProfile.upiId && vendorProfile.upiId.trim().length > 3
    ? vendorProfile.upiId.trim()
    : 'santhai.traders@okaxis';
  const merchantName = vendorProfile.name || 'SanthAI Wholesaler';

  // Generate QR code whenever selected customer or their totalDue balance changes
  useEffect(() => {
    let isCancelled = false;
    if (!selectedCustomer) return;

    const amount = selectedCustomer.totalDue > 0 ? selectedCustomer.totalDue : 0;
    const upiUrl = KhataService.generateUpiUrl(selectedCustomer, vendorProfile, amount);

    const generate = async () => {
      try {
        const svg = await QRCode.toString(upiUrl, {
          type: 'svg',
          margin: 1,
          color: {
            dark: '#0f172a',
            light: '#ffffff'
          }
        });
        const png = await QRCode.toDataURL(upiUrl, {
          margin: 1,
          width: 320,
          color: {
            dark: '#0f172a',
            light: '#ffffff'
          }
        });

        if (!isCancelled) {
          setInlineQrSvg(svg);
          setInlineQrDataUrl(png);
        }
      } catch (err) {
        console.error('Error generating inline QR:', err);
      }
    };

    generate();
    return () => {
      isCancelled = true;
    };
  }, [selectedCustomer?.id, selectedCustomer?.totalDue, vendorProfile]);

  const handleCopyInlineLink = () => {
    if (!selectedCustomer) return;
    const upiUrl = KhataService.generateUpiUrl(selectedCustomer, vendorProfile, selectedCustomer.totalDue);
    SoundEffects.playClick();
    navigator.clipboard.writeText(upiUrl).then(() => {
      setCopiedInlineLink(true);
      setTimeout(() => setCopiedInlineLink(false), 2000);
    });
  };

  const handleCopyInlineVpa = () => {
    SoundEffects.playClick();
    navigator.clipboard.writeText(merchantVpa).then(() => {
      setCopiedInlineVpa(true);
      setTimeout(() => setCopiedInlineVpa(false), 2000);
    });
  };

  const handleDownloadInlineQr = () => {
    if (!selectedCustomer || !inlineQrDataUrl) return;
    SoundEffects.playClick();
    const a = document.createElement('a');
    a.href = inlineQrDataUrl;
    a.download = `UPI-QR-${selectedCustomer.name.replace(/\s+/g, '_')}-₹${selectedCustomer.totalDue}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleWhatsAppInlineShare = () => {
    if (!selectedCustomer) return;
    SoundEffects.playClick();
    const cleanPhone = selectedCustomer.phone.replace(/[^0-9]/g, '');
    const upiUrl = KhataService.generateUpiUrl(selectedCustomer, vendorProfile, selectedCustomer.totalDue);
    const customerDisplayName = lang === 'ta' && selectedCustomer.nameTa ? selectedCustomer.nameTa : selectedCustomer.name;

    const message = lang === 'ta'
      ? `வணக்கம் ${customerDisplayName} அவர்களே,

🏪 *${merchantName}* (${vendorProfile.stallNumber || 'SanthAI'})
உங்களின் நிலுவைத் தொகை: *₹${selectedCustomer.totalDue}*

📲 *UPI மூலம் உடனே செலுத்த (GPay/PhonePe/Paytm):*
${upiUrl}

UPI முகவரி: \`${merchantVpa}\`
செலுத்தியதும் தெரிவிக்கவும். நன்றி!`
      : `Hello ${selectedCustomer.name},

🏪 *${merchantName}* (Stall: ${vendorProfile.stallNumber || 'SanthAI'})
Outstanding Balance: *₹${selectedCustomer.totalDue}*

📲 *Click to pay directly via UPI (GPay/PhonePe/Paytm):*
${upiUrl}

Merchant UPI VPA: \`${merchantVpa}\`
Thank you for your business!`;

    const waUrl = `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  const handleAddTxSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) return;
    const today = new Date().toISOString().split('T')[0];
    onAddTransaction(selectedCustomer.id, {
      date: today,
      type: txType,
      amount: txAmount,
      itemsDescription: txType === 'CREDIT' ? txItems : undefined,
      daysDelayed: txType === 'PAYMENT' ? txDaysDelay : undefined
    });

    if (txType === 'PAYMENT') {
      SoundEffects.playSuccess();
      confetti({ particleCount: 50, spread: 70, origin: { y: 0.6 } });
    } else {
      SoundEffects.playClick();
    }

    // Auto-open thermal slip with the newly recorded transaction
    setReceiptCustomer(selectedCustomer);
    setReceiptBillAmount(txType === 'CREDIT' ? txAmount : 0);
    setReceiptPaymentAmount(txType === 'PAYMENT' ? txAmount : 0);

    setIsNewTxModalOpen(false);
  };

  const handleAddCustomerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName || !newCustPhone) return;
    onAddCustomer({
      name: newCustName,
      phone: newCustPhone,
      totalDue: newCustInitialDue,
      creditLimit: newCustLimit,
      lastPurchaseDate: new Date().toISOString().split('T')[0],
      notes: 'New informal credit ledger account'
    });
    setIsNewCustomerModalOpen(false);
    setNewCustName('');
    setNewCustPhone('');
  };

  const handleVoiceReminder = (customer: KhataCustomer) => {
    const textEn = `Khata reminder for ${customer.name}. Outstanding balance is Rs ${customer.totalDue}. Repayment risk level is ${customer.riskLevel}.`;
    const textTa = `${customer.nameTa || customer.name} கடன் கணக்கு. பாக்கி தொகை ₹${customer.totalDue}. திருப்பி தரும் அபாய நிலை: ${customer.riskLevel}.`;
    speakText(lang === 'ta' ? textTa : textEn, lang);
  };

  return (
    <div className="space-y-6">
      {/* REQUIRED BANNER: Simulated / Illustrative Data Notice */}
      <div
        id="simulated-data-notice"
        className="bg-amber-50 border-2 border-amber-300/80 rounded-2xl p-4 flex items-start gap-3 shadow-xs"
      >
        <span className="text-2xl mt-0.5">ℹ️</span>
        <div>
          <h4 className="font-bold text-amber-900 text-xs sm:text-sm">
            {lang === 'ta'
              ? 'பயிற்சி / மாதிரித் தரவு அறிவிப்பு (Simulated Data Notice)'
              : 'Simulated / Illustrative Data Notice'}
          </h4>
          <p className="text-xs text-amber-800 mt-0.5 leading-relaxed">
            {lang === 'ta'
              ? 'காய்கறி சந்தை சில்லறை வியாபாரிகளிடம் இதுவரை அதிகாரப்பூர்வ டிஜிட்டல் கடன் தரவுகள் இல்லாததால், இந்த பகுதியில் உள்ள வாடிக்கையாளர்கள், பாக்கி மற்றும் அபாயப் புள்ளிகள் விளக்கக் காட்சிக்காக உருவாக்கப்பட்ட மாதிரித் தரவுகள் (Simulated Data) மட்டுமே; உண்மையான நபர்களின் பதிவுகள் அல்ல.'
              : 'Since real customer repayment records do not exist for informal produce vendors today, all records and risk metrics in this Khata module are clearly simulated/illustrative data for testing and demonstration.'}
          </p>
        </div>
      </div>

      {/* Top Overview Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Total Khata Due
          </span>
          <div className="text-3xl font-black text-slate-900 mt-1">
            ₹{totalOutstandingDue}
          </div>
          <span className="text-[11px] text-slate-400">
            Across {customers.length} ledger accounts
          </span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            High Risk Accounts
          </span>
          <div className={`text-3xl font-black mt-1 ${highRiskCount > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
            {highRiskCount}
          </div>
          <span className="text-[11px] text-slate-400">
            {highRiskCount > 0 ? 'Overdue or repeated delays' : 'All accounts disciplined'}
          </span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              UPI Collection
            </span>
            <div className="text-sm font-bold text-slate-800 mt-1 font-mono">
              {vendorProfile.upiId}
            </div>
            <span className="text-[11px] text-emerald-600 font-medium">Linked to Stall</span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => {
                SoundEffects.playClick();
                setIsAllQrModalOpen(true);
              }}
              className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-colors"
              title="View All Customer UPI QR Codes"
            >
              <QrCode className="w-5 h-5" />
            </button>
            <button
              onClick={() => setIsNewCustomerModalOpen(true)}
              className="p-2.5 rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition-colors"
              title="Add Customer"
            >
              <UserPlus className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Ledger Split Screen */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Customer List (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-slate-900">
                {lang === 'ta' ? 'கடன் வாடிக்கையாளர்கள்' : 'Khata Customers'}
              </h3>
              <span className="text-[11px] text-slate-400">
                {customers.length} {lang === 'ta' ? 'பதிவேடுகள்' : 'accounts'}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  SoundEffects.playClick();
                  setIsAllQrModalOpen(true);
                }}
                className="text-xs font-bold text-slate-700 hover:text-emerald-700 bg-slate-100 hover:bg-emerald-50 px-2.5 py-1.5 rounded-xl border border-slate-200 hover:border-emerald-300 flex items-center gap-1.5 transition-all"
                title="View All Customer UPI QR Codes"
              >
                <QrCode className="w-3.5 h-3.5 text-emerald-600" />
                <span className="hidden sm:inline">{lang === 'ta' ? 'அனைத்து QR' : 'All QRs'}</span>
              </button>

              <button
                onClick={() => setIsNewCustomerModalOpen(true)}
                className="text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 px-2.5 py-1.5 rounded-xl border border-emerald-200 flex items-center gap-1"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>{t(lang, 'addCustomer')}</span>
              </button>
            </div>
          </div>

          {/* Quick Filter Pill Buttons */}
          <div className="flex items-center gap-1 text-[11px]">
            <button
              onClick={() => setCustomerFilter('all')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                customerFilter === 'all'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All ({customers.length})
            </button>
            <button
              onClick={() => setCustomerFilter('due')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                customerFilter === 'due'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Due ({customers.filter(c => c.totalDue > 0).length})
            </button>
            <button
              onClick={() => setCustomerFilter('high_risk')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                customerFilter === 'high_risk'
                  ? 'bg-rose-700 text-white'
                  : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
              }`}
            >
              Risk ({highRiskCount})
            </button>
          </div>

          {/* Search Field */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={customerSearch}
              onChange={(e) => setCustomerSearch(e.target.value)}
              placeholder={lang === 'ta' ? 'வாடிக்கையாளரைத் தேடு...' : 'Search customer...'}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
            />
          </div>

          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
            {customers
              .filter(cust => {
                const matchesSearch = cust.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
                  cust.phone.includes(customerSearch) ||
                  (cust.nameTa && cust.nameTa.toLowerCase().includes(customerSearch.toLowerCase()));

                if (!matchesSearch) return false;
                if (customerFilter === 'due') return cust.totalDue > 0;
                if (customerFilter === 'high_risk') return cust.riskLevel === 'High';
                return true;
              })
              .map(cust => {
                const isSelected = cust.id === selectedCustomer?.id;
                const nameDisplay = lang === 'ta' && cust.nameTa ? cust.nameTa : cust.name;

                return (
                  <div
                    key={cust.id}
                    onClick={() => setSelectedCustomerId(cust.id)}
                    className={`w-full text-left p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-2 group ${
                      isSelected
                        ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                        : 'bg-slate-50/70 border-slate-200 text-slate-800 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex-1 min-w-0 pr-1">
                      <div className="font-bold text-sm leading-tight flex items-center gap-1.5 truncate">
                        <span>{nameDisplay}</span>
                      </div>
                      <div className={`text-xs mt-0.5 ${isSelected ? 'text-slate-300' : 'text-slate-500'} truncate`}>
                        {cust.phone} • Limit: ₹{cust.creditLimit}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <div className="text-right">
                        <div className={`text-base font-black font-mono tabular-nums ${isSelected ? 'text-emerald-300' : 'text-slate-900'}`}>
                          ₹{cust.totalDue}
                        </div>
                        <span
                          className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold uppercase inline-block ${
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

                      {/* Dedicated 1-Click QR Code Button for this Customer */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedCustomerId(cust.id);
                          setQrModalCustomer(cust);
                          setIsUpiQrModalOpen(true);
                          SoundEffects.playClick();
                        }}
                        className={`p-2 rounded-xl border transition-all flex items-center justify-center ${
                          isSelected
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40 hover:bg-emerald-500/30'
                            : 'bg-white text-slate-700 border-slate-200 hover:border-emerald-500 hover:text-emerald-700 hover:bg-emerald-50 shadow-2xs'
                        }`}
                        title={`Generate UPI QR for ${cust.name} (₹${cust.totalDue})`}
                        aria-label={`Generate UPI QR for ${cust.name}`}
                      >
                        <QrCode className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Right: Selected Customer Account Detail (7 cols) */}
        {selectedCustomer && (
          <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-xs flex flex-col justify-between space-y-5">
            <div>
              {/* Account Header */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-black text-xl text-slate-900">
                      {lang === 'ta' && selectedCustomer.nameTa
                        ? selectedCustomer.nameTa
                        : selectedCustomer.name}
                    </h3>
                    <span
                      className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase ${
                        selectedCustomer.riskLevel === 'Low'
                          ? 'bg-emerald-100 text-emerald-800'
                          : selectedCustomer.riskLevel === 'Medium'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {selectedCustomer.riskLevel} Risk Score: {selectedCustomer.riskScore}/100
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Phone: {selectedCustomer.phone} • {selectedCustomer.notes}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleVoiceReminder(selectedCustomer)}
                    className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600"
                    title="Read status aloud"
                  >
                    <Volume2 className="w-4 h-4 text-emerald-600" />
                  </button>

                  <button
                    onClick={() => {
                      SoundEffects.playClick();
                      setIsUpiQrModalOpen(true);
                    }}
                    className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors"
                    title="Instant UPI Payment QR"
                  >
                    <QrCode className="w-4 h-4 text-emerald-400" />
                    <span>{lang === 'ta' ? 'UPI ஸ்கேன்' : 'Scan to Pay'}</span>
                  </button>

                  <button
                    onClick={() => {
                      SoundEffects.playClick();
                      setReceiptCustomer(selectedCustomer);
                      setReceiptBillAmount(0);
                      setReceiptPaymentAmount(0);
                    }}
                    className="p-2 sm:px-3 sm:py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors"
                    title="Print Thermal Slip / Show UPI QR"
                  >
                    <Printer className="w-4 h-4 text-indigo-600" />
                    <span className="hidden sm:inline">{lang === 'ta' ? 'அச்சு ரசீது' : 'Print Slip'}</span>
                  </button>

                  <button
                    onClick={() => setIsNewTxModalOpen(true)}
                    className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Update Balance</span>
                  </button>
                </div>
              </div>

              {/* Outstanding Balance Banner */}
              <div className="grid grid-cols-2 gap-3 my-4">
                <div className="bg-rose-50 border border-rose-200 p-4 rounded-2xl">
                  <span className="text-[11px] font-semibold text-rose-700 uppercase tracking-wider block">
                    {t(lang, 'amountDue')}
                  </span>
                  <div className="text-3xl font-black text-rose-800 mt-1">
                    ₹{selectedCustomer.totalDue}
                  </div>
                  <span className="text-[10px] text-rose-600">
                    Credit Limit: ₹{selectedCustomer.creditLimit}
                  </span>
                </div>

                <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                    Repayment Discipline
                  </span>
                  <div className="text-3xl font-black text-slate-900 mt-1">
                    {Math.round(selectedCustomer.onTimePaymentRatio * 100)}%
                  </div>
                  <span className="text-[10px] text-slate-500">
                    On-time settlement ratio
                  </span>
                </div>
              </div>

              {/* Dedicated Customer UPI QR Code Feature Card (Generated based on totalDue balance) */}
              <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white rounded-2xl p-4 sm:p-5 shadow-md border border-slate-700/80 mb-4 relative overflow-hidden">
                <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-5">
                  {/* Optical QR Code Display Container */}
                  <div className="relative shrink-0 bg-white p-2.5 rounded-2xl border-2 border-emerald-400/40 shadow-md flex flex-col items-center justify-center">
                    <div className="w-36 h-36 sm:w-40 sm:h-40 bg-white flex items-center justify-center relative">
                      {inlineQrSvg ? (
                        <div
                          className="w-full h-full [&>svg]:w-full [&>svg]:h-full"
                          dangerouslySetInnerHTML={{ __html: inlineQrSvg }}
                        />
                      ) : (
                        <div className="text-slate-400 text-xs">Generating QR...</div>
                      )}

                      {/* Center UPI Badge Overlay */}
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <span className="bg-white px-1.5 py-0.5 rounded-md text-[10px] font-black tracking-wider text-slate-900 border border-slate-300 shadow-2xs flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          UPI
                        </span>
                      </div>
                    </div>

                    <div className="text-[10px] text-slate-600 font-mono mt-1 text-center truncate max-w-[150px] font-semibold">
                      {merchantVpa}
                    </div>
                  </div>

                  {/* QR Details and Quick Payment Controls */}
                  <div className="flex-1 min-w-0 space-y-2.5 text-center sm:text-left w-full">
                    <div>
                      <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                        <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-400/30 uppercase tracking-wider flex items-center gap-1">
                          <QrCode className="w-3 h-3" />
                          {lang === 'ta' ? 'வாடிக்கையாளர் நேரடி UPI QR' : 'Customer UPI QR Code'}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {selectedCustomer.totalDue > 0
                            ? (lang === 'ta' ? 'நிலுவைத் தொகைக்கு ஏற்ற QR' : 'Generated for totalDue balance')
                            : (lang === 'ta' ? 'நிலுவை இல்லை' : 'All Dues Cleared')}
                        </span>
                      </div>

                      <div className="mt-1 flex items-baseline justify-center sm:justify-start gap-2">
                        <span className={`text-3xl font-black font-mono tabular-nums ${selectedCustomer.totalDue > 0 ? 'text-emerald-400' : 'text-slate-400'}`}>
                          ₹{selectedCustomer.totalDue.toLocaleString('en-IN')}
                        </span>
                        <span className="text-xs text-slate-300 font-medium">
                          {selectedCustomer.totalDue > 0
                            ? (lang === 'ta' ? 'செலுத்த வேண்டிய பாக்கி' : 'Instant Scan to Settle')
                            : (lang === 'ta' ? 'கடன் பாக்கி இல்லை (₹0)' : 'Zero balance due')}
                        </span>
                      </div>

                      <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                        {selectedCustomer.totalDue > 0
                          ? (lang === 'ta'
                            ? `${selectedCustomer.nameTa || selectedCustomer.name} அவர்களின் ₹${selectedCustomer.totalDue} பாக்கிக்கான துல்லியமான QR. Google Pay, PhonePe, Paytm, BHIM மூலம் ஸ்கேன் செய்யலாம்.`
                            : `Dynamic QR encoded with ${selectedCustomer.name}'s balance of ₹${selectedCustomer.totalDue}. Scannable by any UPI app on customer's phone.`)
                          : (lang === 'ta'
                            ? 'இந்த வாடிக்கையாளரிடம் கடன் பாக்கி ஏதும் இல்லை. கூடுதல் முன்பணம் செலுத்த கீழேயுள்ள பொத்தானைப் பயன்படுத்தலாம்.'
                            : 'This customer has zero outstanding balance. You can generate custom advance payments using the button below.')}
                      </p>
                    </div>

                    {/* Action Buttons Row */}
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1 text-xs">
                      {selectedCustomer.totalDue > 0 ? (
                        <button
                          type="button"
                          onClick={() => {
                            handleUpiSettle(selectedCustomer.id, selectedCustomer.totalDue);
                            SoundEffects.playSuccess();
                            confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
                          }}
                          className="px-3.5 py-2 rounded-xl font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex items-center gap-1.5 transition-all shadow-xs"
                          title="Mark Full Due Received in 1-click"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>
                            {lang === 'ta'
                              ? `₹${selectedCustomer.totalDue} பெற்றது (வரவு வை)`
                              : `Mark ₹${selectedCustomer.totalDue} Received`}
                          </span>
                        </button>
                      ) : null}

                      <button
                        type="button"
                        onClick={handleWhatsAppInlineShare}
                        className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold flex items-center gap-1.5 border border-slate-700 transition-colors"
                        title="Send UPI Link via WhatsApp"
                      >
                        <Share2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{lang === 'ta' ? 'வாட்ஸ்அப் QR' : 'WhatsApp QR'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleCopyInlineLink}
                        className="px-2.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold flex items-center gap-1 border border-slate-700 transition-colors"
                        title="Copy UPI payment link"
                      >
                        {copiedInlineLink ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-emerald-400">{lang === 'ta' ? 'நகலானது' : 'Copied'}</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-slate-400" />
                            <span>{lang === 'ta' ? 'இணைப்பு' : 'Copy Link'}</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={handleDownloadInlineQr}
                        className="px-2.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold flex items-center gap-1 border border-slate-700 transition-colors"
                        title="Download QR code image PNG"
                      >
                        <Download className="w-3.5 h-3.5 text-slate-400" />
                        <span>{lang === 'ta' ? 'பதிவிறக்கு' : 'Save QR'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setQrModalCustomer(selectedCustomer);
                          setIsUpiQrModalOpen(true);
                          SoundEffects.playClick();
                        }}
                        className="px-2.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold flex items-center gap-1 border border-slate-700 transition-colors"
                        title="Custom amount & full screen display"
                      >
                        <Maximize2 className="w-3.5 h-3.5 text-slate-400" />
                        <span>{lang === 'ta' ? 'தனிப்பயன் / பெரிதாக்கு' : 'Custom / Fullscreen'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Technical vs Simple View on Risk Score */}
              {viewMode === 'technical' ? (
                <div className="bg-slate-900 text-slate-200 p-3.5 rounded-xl font-mono text-xs space-y-1 mb-4">
                  <div className="text-emerald-400 font-bold">
                    Repayment Risk Formula: Late-payment ratio weighted by recency
                  </div>
                  <div className="text-slate-300">
                    Risk = (Σ w_i × Delay_days_i) / Σ w_i = {selectedCustomer.riskScore}
                  </div>
                  <div className="text-slate-400 text-[11px]">
                    w_i assigns up to 1.5x penalty to recent delays vs 0.5x to historical transactions.
                  </div>
                </div>
              ) : null}

              {/* Transaction History (Simulated Data) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between flex-wrap gap-1.5 text-xs font-bold text-slate-700">
                  <span>Transaction History (கடன் மற்றும் வரவு பதிவுகள்)</span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200">
                    {lang === 'ta' ? 'மாதிரி கடன் வரலாறு (Simulated Model Data)' : 'Simulated Repayment History'}
                  </span>
                </div>
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {selectedCustomer.transactions.map(tx => (
                    <div
                      key={tx.id}
                      className="p-2.5 rounded-xl border border-slate-100 bg-slate-50/70 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              tx.type === 'CREDIT' ? 'bg-rose-500' : 'bg-emerald-500'
                            }`}
                          />
                          <span>{tx.type === 'CREDIT' ? 'Credit Purchase' : 'Payment Received'}</span>
                          {tx.itemsDescription && (
                            <span className="text-slate-500 font-normal">({tx.itemsDescription})</span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {tx.date}{' '}
                          {tx.daysDelayed && tx.daysDelayed > 0
                            ? `• Settled with ${tx.daysDelayed} days delay`
                            : ''}
                        </div>
                      </div>

                      <div
                        className={`font-black text-sm ${
                          tx.type === 'CREDIT' ? 'text-rose-700' : 'text-emerald-700'
                        }`}
                      >
                        {tx.type === 'CREDIT' ? `+ ₹${tx.amount}` : `- ₹${tx.amount}`}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Action Bar: Instant UPI Scan, WhatsApp Reminder & Physical Thermal Slip */}
            <div className="pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => {
                  SoundEffects.playClick();
                  setIsUpiQrModalOpen(true);
                }}
                className="py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs transition-colors"
              >
                <QrCode className="w-4 h-4 text-emerald-400" />
                <span>
                  {lang === 'ta' ? 'ஸ்கேன் செய்து செலுத்து (UPI)' : 'Scan to Pay (UPI QR)'}
                </span>
              </button>

              <a
                href={KhataService.createReminderWhatsAppUrl(selectedCustomer, vendorProfile, lang)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => SoundEffects.playSuccess()}
                className="py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs transition-colors"
              >
                <Send className="w-4 h-4" />
                <span>
                  {t(lang, 'sendReminder')} (WhatsApp)
                </span>
                <ExternalLink className="w-3.5 h-3.5 opacity-75" />
              </a>

              <button
                type="button"
                onClick={() => {
                  SoundEffects.playClick();
                  setReceiptCustomer(selectedCustomer);
                  setReceiptBillAmount(0);
                  setReceiptPaymentAmount(0);
                }}
                className="py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors border border-slate-200"
              >
                <Printer className="w-4 h-4 text-indigo-600" />
                <span>
                  {lang === 'ta' ? 'அச்சு ரசீது (58/80mm)' : 'Thermal Slip (58/80mm)'}
                </span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add Transaction Modal */}
      {isNewTxModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900">
                Record Transaction for {selectedCustomer?.name}
              </h3>
              <button
                onClick={() => setIsNewTxModalOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddTxSubmit} className="space-y-4 pt-4 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setTxType('PAYMENT')}
                  className={`py-2 rounded-xl font-bold border transition-colors ${
                    txType === 'PAYMENT'
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-white text-slate-700 border-slate-200'
                  }`}
                >
                  Payment Received (பணம் வரவு)
                </button>
                <button
                  type="button"
                  onClick={() => setTxType('CREDIT')}
                  className={`py-2 rounded-xl font-bold border transition-colors ${
                    txType === 'CREDIT'
                      ? 'bg-rose-600 text-white border-rose-600'
                      : 'bg-white text-slate-700 border-slate-200'
                  }`}
                >
                  New Credit (கடன் கொடுத்தது)
                </button>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Amount (₹)</label>
                <input
                  type="number"
                  value={txAmount}
                  onChange={e => setTxAmount(Number(e.target.value))}
                  className="w-full py-2 px-3 border border-slate-200 rounded-xl text-base font-bold"
                  required
                />
              </div>

              {txType === 'CREDIT' ? (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Items Bought</label>
                  <input
                    type="text"
                    value={txItems}
                    onChange={e => setTxItems(e.target.value)}
                    className="w-full py-2 px-3 border border-slate-200 rounded-xl text-xs"
                    placeholder="e.g. Tomato 10kg, Potato 5kg"
                  />
                </div>
              ) : (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Days Delayed (if any)
                  </label>
                  <input
                    type="number"
                    value={txDaysDelay}
                    onChange={e => setTxDaysDelay(Number(e.target.value))}
                    className="w-full py-2 px-3 border border-slate-200 rounded-xl text-xs"
                    min="0"
                  />
                  <span className="text-[10px] text-slate-400">
                    Used to compute dynamic repayment risk score
                  </span>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewTxModalOpen(false)}
                  className="px-4 py-2 rounded-xl font-semibold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl font-bold bg-emerald-600 text-white shadow-xs"
                >
                  Save Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Customer Modal */}
      {isNewCustomerModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900">{t(lang, 'addCustomer')}</h3>
              <button
                onClick={() => setIsNewCustomerModalOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddCustomerSubmit} className="space-y-4 pt-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Customer Name</label>
                <input
                  type="text"
                  value={newCustName}
                  onChange={e => setNewCustName(e.target.value)}
                  className="w-full py-2 px-3 border border-slate-200 rounded-xl text-sm"
                  placeholder="e.g. Ramesh (Tea Stall)"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={newCustPhone}
                  onChange={e => setNewCustPhone(e.target.value)}
                  className="w-full py-2 px-3 border border-slate-200 rounded-xl text-sm"
                  placeholder="e.g. 9840123456"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Initial Due (₹)</label>
                  <input
                    type="number"
                    value={newCustInitialDue}
                    onChange={e => setNewCustInitialDue(Number(e.target.value))}
                    className="w-full py-2 px-3 border border-slate-200 rounded-xl text-sm font-bold"
                    min="0"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Credit Limit (₹)</label>
                  <input
                    type="number"
                    value={newCustLimit}
                    onChange={e => setNewCustLimit(Number(e.target.value))}
                    className="w-full py-2 px-3 border border-slate-200 rounded-xl text-sm"
                    min="500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewCustomerModalOpen(false)}
                  className="px-4 py-2 rounded-xl font-semibold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl font-bold bg-emerald-600 text-white shadow-xs"
                >
                  Add Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Instant UPI QR Scan to Pay Modal */}
      {isUpiQrModalOpen && (qrModalCustomer || selectedCustomer) && (
        <KhataUpiQrModal
          customer={qrModalCustomer || selectedCustomer}
          vendorProfile={vendorProfile}
          lang={lang}
          onClose={() => {
            setIsUpiQrModalOpen(false);
            setQrModalCustomer(null);
          }}
          onSettlePayment={handleUpiSettle}
        />
      )}

      {/* All Customers UPI QR Directory / Print Modal */}
      {isAllQrModalOpen && (
        <KhataAllQrModal
          customers={customers}
          vendorProfile={vendorProfile}
          lang={lang}
          onClose={() => setIsAllQrModalOpen(false)}
          onSettlePayment={handleUpiSettle}
          onOpenSingleQr={(cust) => {
            setIsAllQrModalOpen(false);
            setSelectedCustomerId(cust.id);
            setQrModalCustomer(cust);
            setIsUpiQrModalOpen(true);
          }}
        />
      )}

      {/* Physical Thermal Receipt / Cash Slip / UPI QR Modal */}
      {receiptCustomer && (
        <ThermalReceiptModal
          customer={receiptCustomer}
          vendorProfile={vendorProfile}
          lang={lang}
          billAmount={receiptBillAmount}
          paymentAmount={receiptPaymentAmount}
          onClose={() => setReceiptCustomer(null)}
        />
      )}
    </div>
  );
};
