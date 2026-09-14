import React, { useState } from 'react';
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
  Printer
} from 'lucide-react';
import { ThermalReceiptModal } from './ThermalReceiptModal';
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

  // Thermal Slip & Receipt Modal state (for non-WhatsApp / elderly / cash customers)
  const [receiptCustomer, setReceiptCustomer] = useState<KhataCustomer | null>(null);
  const [receiptBillAmount, setReceiptBillAmount] = useState<number>(0);
  const [receiptPaymentAmount, setReceiptPaymentAmount] = useState<number>(0);

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
          <button
            onClick={() => setIsNewCustomerModalOpen(true)}
            className="p-2.5 rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition-colors"
            title="Add Customer"
          >
            <UserPlus className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Ledger Split Screen */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Customer List (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="font-extrabold text-sm sm:text-base text-slate-900">
              {lang === 'ta' ? 'கடன் வாடிக்கையாளர்கள்' : 'Khata Customers'}
            </h3>
            <button
              onClick={() => setIsNewCustomerModalOpen(true)}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>{t(lang, 'addCustomer')}</span>
            </button>
          </div>

          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
            {customers.map(cust => {
              const isSelected = cust.id === selectedCustomer?.id;
              const nameDisplay = lang === 'ta' && cust.nameTa ? cust.nameTa : cust.name;

              return (
                <button
                  key={cust.id}
                  onClick={() => setSelectedCustomerId(cust.id)}
                  className={`w-full text-left p-3.5 rounded-2xl border transition-all flex items-center justify-between ${
                    isSelected
                      ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                      : 'bg-slate-50/70 border-slate-200 text-slate-800 hover:bg-slate-100'
                  }`}
                >
                  <div>
                    <div className="font-bold text-sm leading-tight flex items-center gap-1.5">
                      <span>{nameDisplay}</span>
                    </div>
                    <div className={`text-xs mt-0.5 ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                      {cust.phone} • Limit: ₹{cust.creditLimit}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className={`text-base font-black ${isSelected ? 'text-emerald-300' : 'text-slate-900'}`}>
                      ₹{cust.totalDue}
                    </div>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase inline-block mt-0.5 ${
                        cust.riskLevel === 'Low'
                          ? 'bg-emerald-100 text-emerald-800'
                          : cust.riskLevel === 'Medium'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {cust.riskLevel} Risk
                    </span>
                  </div>
                </button>
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

              {/* Transaction History */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-slate-700">
                  Transaction History (கடன் மற்றும் வரவு பதிவுகள்)
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

            {/* Action Bar: WhatsApp Reminder & Physical Thermal Slip / UPI QR */}
            <div className="pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
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
                  {lang === 'ta' ? 'அச்சு ரசீது / UPI QR' : 'Thermal Slip / UPI QR'}
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
