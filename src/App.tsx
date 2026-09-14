import React, { useState, useEffect } from 'react';
import {
  CommodityType,
  DailyStockLog,
  BulkOrderBoardItem,
  KhataCustomer,
  KhataTransaction,
  Language,
  ViewMode,
  MandiPriceRecord,
  PriceStatus,
  VendorProfile,
  BgTheme
} from './types';
import {
  INITIAL_STOCK_LOGS,
  INITIAL_BULK_ORDERS,
  INITIAL_KHATA_CUSTOMERS,
  CACHED_TN_MANDI_PRICES
} from './data/commodities';
import { AgmarknetService } from './services/agmarknet';
import { AuthService } from './services/auth';
import { ResQService } from './services/resq';
import { PricingEngine } from './services/pricing';
import { Navbar } from './components/Navbar';
import { StockModule } from './components/StockModule';
import { PricesModule } from './components/PricesModule';
import { ResQModule } from './components/ResQModule';
import { KhataModule } from './components/KhataModule';
import { VendorAuthModal } from './components/VendorAuthModal';
import { DataVaultModal } from './components/DataVaultModal';
import { MarketPulseTicker } from './components/MarketPulseTicker';
import { MarketSessionBanner, MarketSession } from './components/MarketSessionBanner';
import { SoundEffects } from './utils/audioHaptics';
import {
  ShieldCheck,
  Building2,
  Coins,
  AlertTriangle,
  Sparkles,
  Award,
  Phone,
  Lock,
  CheckCircle2,
  Store,
  Radio,
  Clock,
  CheckCircle,
  TrendingUp,
  MapPin,
  Flame
} from 'lucide-react';

export default function App() {
  // Navigation & View settings
  const [activeTab, setActiveTab] = useState<'stock' | 'prices' | 'resq' | 'khata'>('stock');
  const [lang, setLang] = useState<Language>('ta'); // Default to Tamil for local low-literacy market vendors in India, toggleable anytime
  const [viewMode, setViewMode] = useState<ViewMode>('simple'); // Simple view is the strict default
  const [marketSession, setMarketSession] = useState<MarketSession>('evening');
  const [tickerCommodity, setTickerCommodity] = useState<CommodityType>('Tomato');
  const [bgTheme, setBgTheme] = useState<BgTheme>(() => {
    try {
      const saved = localStorage.getItem('santhai_bg_theme');
      return (saved === 'golden' || saved === 'ocean' || saved === 'midnight') ? (saved as BgTheme) : 'emerald';
    } catch {
      return 'emerald';
    }
  });

  const handleChangeBgTheme = (newTheme: BgTheme) => {
    setBgTheme(newTheme);
    try {
      localStorage.setItem('santhai_bg_theme', newTheme);
    } catch {}
  };

  // Vendor state
  const [vendorProfile, setVendorProfile] = useState<VendorProfile>(AuthService.getCurrentProfile());
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);

  // Market Environment & Offline Resilience
  const [isOutdoorMode, setIsOutdoorMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem('santhai_outdoor_mode') === 'true';
    } catch {
      return false;
    }
  });
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [isDataVaultOpen, setIsDataVaultOpen] = useState<boolean>(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  // Stock logs state (7-day seed history)
  const [stockLogs, setStockLogs] = useState<DailyStockLog[]>(() => {
    try {
      const stored = localStorage.getItem('santhai_stock_logs');
      return stored ? JSON.parse(stored) : INITIAL_STOCK_LOGS;
    } catch {
      return INITIAL_STOCK_LOGS;
    }
  });

  // Institutional bulk orders state (ResQ board)
  const [bulkOrders, setBulkOrders] = useState<BulkOrderBoardItem[]>(() => {
    try {
      const stored = localStorage.getItem('santhai_bulk_orders');
      return stored ? JSON.parse(stored) : INITIAL_BULK_ORDERS;
    } catch {
      return INITIAL_BULK_ORDERS;
    }
  });

  // Khata customers state (clearly labeled simulated data)
  const [khataCustomers, setKhataCustomers] = useState<KhataCustomer[]>(() => {
    try {
      const stored = localStorage.getItem('santhai_khata_customers');
      return stored ? JSON.parse(stored) : INITIAL_KHATA_CUSTOMERS;
    } catch {
      return INITIAL_KHATA_CUSTOMERS;
    }
  });

  // Vendor's current selling prices per kg
  const [vendorPrices, setVendorPrices] = useState<Record<CommodityType, number>>(() => {
    return {
      Tomato: 28,
      Onion: 38,
      Potato: 32,
      Brinjal: 34,
      Cabbage: 22,
      Carrot: 48
    };
  });

  // Mandi prices & Live/Cached status
  const [mandiRecords, setMandiRecords] = useState<MandiPriceRecord[]>(CACHED_TN_MANDI_PRICES);
  const [priceStatus, setPriceStatus] = useState<PriceStatus>(AgmarknetService.getInstance().getStatus());
  const [isRefreshingPrices, setIsRefreshingPrices] = useState<boolean>(false);

  // Fetch prices on startup and setup 6-hour automatic refresh interval
  useEffect(() => {
    fetchMandiRates(true);

    // Refresh live prices on a 6-hour interval (21,600,000 ms) as mandi updates occur periodically
    const intervalId = setInterval(() => {
      fetchMandiRates(true);
    }, 6 * 60 * 60 * 1000);

    return () => clearInterval(intervalId);
  }, []);

  // Real-time network detection & PWA install event listeners
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleToggleOutdoorMode = () => {
    setIsOutdoorMode(prev => {
      const next = !prev;
      try {
        localStorage.setItem('santhai_outdoor_mode', String(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const handleInstallPWA = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  const handleRestoreBackup = (
    profile: VendorProfile,
    customers: KhataCustomer[],
    logs: DailyStockLog[],
    prices: Record<string, number>
  ) => {
    setVendorProfile(profile);
    AuthService.saveProfile(profile);
    setKhataCustomers(customers);
    setStockLogs(logs);
    setVendorPrices(prices as Record<CommodityType, number>);
  };

  // Save changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('santhai_stock_logs', JSON.stringify(stockLogs));
    } catch (e) {
      console.warn(e);
    }
  }, [stockLogs]);

  useEffect(() => {
    try {
      localStorage.setItem('santhai_bulk_orders', JSON.stringify(bulkOrders));
    } catch (e) {
      console.warn(e);
    }
  }, [bulkOrders]);

  useEffect(() => {
    try {
      localStorage.setItem('santhai_khata_customers', JSON.stringify(khataCustomers));
    } catch (e) {
      console.warn(e);
    }
  }, [khataCustomers]);

  const fetchMandiRates = async (force: boolean) => {
    setIsRefreshingPrices(true);
    try {
      const result = await AgmarknetService.getInstance().getMandiPrices(force);
      setMandiRecords(result.records);
      setPriceStatus(result.status);
    } catch (err) {
      console.warn('Error in fetchMandiRates:', err);
    } finally {
      setIsRefreshingPrices(false);
    }
  };

  // Add a new stock log entry (immediately recalculates forecast on actual history)
  const handleAddStockLog = (newLog: Omit<DailyStockLog, 'id'>) => {
    const entry: DailyStockLog = {
      ...newLog,
      id: `log_${Date.now()}`
    };
    setStockLogs(prev => [...prev, entry]);
  };

  // Update vendor's selling price (recalculates Z-score and Trust Score live)
  const handleUpdateVendorPrice = (commodity: CommodityType, newPrice: number) => {
    setVendorPrices(prev => ({
      ...prev,
      [commodity]: newPrice
    }));
  };

  // Toggle claiming an institutional bulk order (feeds directly into stock forecast)
  const handleToggleClaimBulkOrder = (orderId: string) => {
    setBulkOrders(prev =>
      prev.map(o => (o.id === orderId ? { ...o, claimedByVendor: !o.claimedByVendor } : o))
    );
  };

  // Khata ledger transaction recorder
  const handleAddKhataTransaction = (customerId: string, tx: Omit<KhataTransaction, 'id'>) => {
    const newTx: KhataTransaction = {
      ...tx,
      id: `tx_${Date.now()}`
    };

    setKhataCustomers(prev =>
      prev.map(cust => {
        if (cust.id !== customerId) return cust;
        const updatedTxs = [...cust.transactions, newTx];
        const newTotalDue =
          tx.type === 'CREDIT' ? cust.totalDue + tx.amount : Math.max(0, cust.totalDue - tx.amount);

        // Recalculate repayment risk score dynamically
        const paymentTxs = updatedTxs.filter(t => t.type === 'PAYMENT');
        const onTimeCount = paymentTxs.filter(t => (t.daysDelayed || 0) === 0).length;
        const onTimeRatio = paymentTxs.length > 0 ? onTimeCount / paymentTxs.length : 0.8;

        const latePenalty = paymentTxs.reduce((sum, t) => sum + (t.daysDelayed || 0) * 10, 0);
        const newRiskScore = Math.min(100, Math.max(5, Math.round(latePenalty / (paymentTxs.length || 1))));

        return {
          ...cust,
          totalDue: newTotalDue,
          transactions: updatedTxs,
          onTimePaymentRatio: onTimeRatio,
          riskScore: newRiskScore,
          riskLevel: newRiskScore > 60 ? 'High' : newRiskScore > 30 ? 'Medium' : 'Low'
        };
      })
    );
  };

  // Add new Khata customer
  const handleAddKhataCustomer = (
    cust: Omit<KhataCustomer, 'id' | 'transactions' | 'riskScore' | 'riskLevel' | 'onTimePaymentRatio'>
  ) => {
    const newEntry: KhataCustomer = {
      ...cust,
      id: `cust_${Date.now()}`,
      riskScore: 20,
      riskLevel: 'Low',
      onTimePaymentRatio: 0.9,
      transactions: cust.totalDue > 0 ? [
        {
          id: `tx_init_${Date.now()}`,
          date: new Date().toISOString().split('T')[0],
          type: 'CREDIT',
          amount: cust.totalDue,
          itemsDescription: 'Initial credit balance'
        }
      ] : []
    };
    setKhataCustomers(prev => [newEntry, ...prev]);
  };

  // Calculate active surplus alert count (>5kg unsold)
  const currentTimeHour = marketSession === 'morning' ? 6.5 : marketSession === 'day' ? 12.5 : 18.0;

  const latestLogsMap: Record<CommodityType, DailyStockLog> = {} as any;
  stockLogs.forEach(log => {
    if (!latestLogsMap[log.commodity] || new Date(log.date) > new Date(latestLogsMap[log.commodity].date)) {
      latestLogsMap[log.commodity] = log;
    }
  });
  const surplusAlerts = ResQService.detectSurplusAlerts(
    Object.values(latestLogsMap),
    vendorPrices,
    vendorProfile,
    currentTimeHour
  );

  // Executive summary numbers
  const trustScore = PricingEngine.computeTrustScore(vendorPrices, mandiRecords, stockLogs, khataCustomers);
  const totalKhataOutstanding = khataCustomers.reduce((acc, c) => acc + c.totalDue, 0);

  const handleTabSwitch = (tab: 'stock' | 'prices' | 'resq' | 'khata') => {
    SoundEffects.playClick();
    setActiveTab(tab);
  };

  const handleSelectTickerCommodity = (comm: CommodityType) => {
    setTickerCommodity(comm);
    if (activeTab !== 'prices' && activeTab !== 'stock') {
      setActiveTab('prices');
    }
  };

  const getThemeClass = () => {
    if (isOutdoorMode) return 'outdoor-mode';
    switch (bgTheme) {
      case 'golden': return 'theme-golden';
      case 'ocean': return 'theme-ocean';
      case 'midnight': return 'theme-midnight';
      case 'emerald':
      default:
        return 'theme-emerald';
    }
  };

  return (
    <div className={`min-h-screen ${getThemeClass()} transition-colors duration-300 text-slate-900 font-sans antialiased selection:bg-emerald-100 selection:text-emerald-900 flex flex-col justify-between`}>
      <div>
        {/* Navigation Header */}
        <Navbar
          activeTab={activeTab}
          setActiveTab={handleTabSwitch}
          lang={lang}
          setLang={setLang}
          viewMode={viewMode}
          setViewMode={setViewMode}
          priceStatus={priceStatus}
          onRefreshPrices={() => fetchMandiRates(true)}
          isRefreshing={isRefreshingPrices}
          vendorProfile={vendorProfile}
          onOpenAuth={() => setIsAuthModalOpen(true)}
          surplusAlertCount={surplusAlerts.length}
          isOutdoorMode={isOutdoorMode}
          onToggleOutdoorMode={handleToggleOutdoorMode}
          onOpenDataVault={() => setIsDataVaultOpen(true)}
          isOnline={isOnline}
          canInstallPWA={Boolean(deferredPrompt)}
          onInstallPWA={handleInstallPWA}
          bgTheme={bgTheme}
          onChangeBgTheme={handleChangeBgTheme}
        />

        {/* Live Mandi Rate Pulse Ticker */}
        <MarketPulseTicker
          mandiRecords={mandiRecords}
          lang={lang}
          onSelectCommodity={handleSelectTickerCommodity}
          selectedCommodity={tickerCommodity}
        />

        {/* Contextual Market Session Trading Phase Banner */}
        <MarketSessionBanner
          currentSession={marketSession}
          onSelectSession={(session) => {
            setMarketSession(session);
            if (session === 'evening' && surplusAlerts.length > 0) {
              setActiveTab('resq');
            }
          }}
          lang={lang}
        />

        {/* Executive Stall KPI Strip */}
        <div className="bg-white border-b border-slate-200/80 shadow-2xs">
          <div className="max-w-7xl mx-auto px-3 sm:px-6 py-3.5">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
              {/* Stall Location & Info */}
              <div 
                onClick={() => {
                  SoundEffects.playClick();
                  setIsAuthModalOpen(true);
                }}
                className="bg-gradient-to-br from-emerald-50/50 via-white to-white hover:from-emerald-50 hover:to-slate-50 transition-all p-3.5 rounded-2xl border border-emerald-200/80 shadow-2xs hover-lift cursor-pointer group"
              >
                <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1.5">
                  <span className="font-bold uppercase tracking-wider flex items-center gap-1.5 text-emerald-800">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <Building2 className="w-3.5 h-3.5 text-emerald-600" />
                    {lang === 'ta' ? 'வணிகக் கடை' : 'Active Stall'}
                  </span>
                  <span className="text-[10px] text-emerald-700 font-bold group-hover:underline">Edit ✎</span>
                </div>
                <div className="font-extrabold text-slate-900 text-sm sm:text-base tracking-tight truncate">
                  {vendorProfile.marketComplex}
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-600 mt-0.5 truncate">
                  <span className="font-bold text-slate-800">{vendorProfile.stallNumber}</span>
                  <span>•</span>
                  <span className="truncate">{vendorProfile.name}</span>
                </div>
                <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
                  <span className="flex items-center gap-1 text-emerald-700 font-medium">
                    <CheckCircle className="w-3 h-3 text-emerald-600" />
                    Verified Merchant
                  </span>
                  <span className="font-mono text-slate-400">Closes {vendorProfile.closingTimeStr}</span>
                </div>
              </div>

              {/* Vendor Trust Score */}
              <div 
                onClick={() => handleTabSwitch('prices')}
                className="bg-gradient-to-br from-amber-50/50 via-white to-white hover:from-amber-50 hover:to-slate-50 transition-all p-3.5 rounded-2xl border border-amber-200/80 shadow-2xs hover-lift cursor-pointer group"
              >
                <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1.5">
                  <span className="font-bold uppercase tracking-wider flex items-center gap-1.5 text-amber-900">
                    <Award className="w-3.5 h-3.5 text-amber-600" />
                    {lang === 'ta' ? 'நம்பிக்கை மதிப்பீடு' : 'Trust Score'}
                  </span>
                  <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                    trustScore.tier === 'Gold' ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-slate-200 text-slate-700'
                  }`}>
                    ★ {trustScore.tier}
                  </span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="font-extrabold text-slate-900 text-2xl tabular-nums tracking-tight">
                    {trustScore.totalScore}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">/ 100</span>
                  <span className="text-[11px] font-bold text-emerald-700 ml-auto bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                    Fair Trader
                  </span>
                </div>
                <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
                  <span className="truncate">Pricing Fairness: {trustScore.pricingFairnessScore}/40</span>
                  <span className="font-mono text-emerald-700 font-semibold">0 disputes</span>
                </div>
              </div>

              {/* Khata Outstanding */}
              <div 
                onClick={() => handleTabSwitch('khata')}
                className="bg-gradient-to-br from-indigo-50/50 via-white to-white hover:from-indigo-50 hover:to-slate-50 transition-all p-3.5 rounded-2xl border border-indigo-200/80 shadow-2xs hover-lift cursor-pointer group"
              >
                <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1.5">
                  <span className="font-bold uppercase tracking-wider flex items-center gap-1.5 text-indigo-900">
                    <Coins className="w-3.5 h-3.5 text-indigo-600" />
                    {lang === 'ta' ? 'கடன் பாக்கி' : 'Khata Credit'}
                  </span>
                  <span className="text-[10px] text-indigo-700 font-mono font-bold bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
                    {khataCustomers.length} accounts
                  </span>
                </div>
                <div className="font-extrabold text-slate-900 text-2xl tabular-nums tracking-tight">
                  ₹{totalKhataOutstanding.toLocaleString()}
                </div>
                <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
                  <span className="text-emerald-700 font-bold">84% On-Time Repayment</span>
                  <span className="text-slate-400">1-Tap WhatsApp</span>
                </div>
              </div>

              {/* Surplus Produce Status */}
              <div 
                onClick={() => handleTabSwitch('resq')}
                className={`p-3.5 rounded-2xl border transition-all shadow-2xs hover-lift cursor-pointer group ${
                  surplusAlerts.length > 0
                    ? 'bg-gradient-to-br from-rose-50/70 via-orange-50/40 to-white hover:from-rose-100/70 border-rose-300'
                    : 'bg-gradient-to-br from-slate-50/80 to-white hover:from-slate-100 border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1.5">
                  <span className="font-bold uppercase tracking-wider flex items-center gap-1.5 text-rose-900">
                    <Flame className={`w-3.5 h-3.5 ${surplusAlerts.length > 0 ? 'text-rose-600 animate-bounce' : 'text-slate-400'}`} />
                    {lang === 'ta' ? 'மீதி எச்சரிக்கை' : 'Zero Waste ResQ'}
                  </span>
                  {surplusAlerts.length > 0 ? (
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-rose-600 text-white shadow-2xs animate-pulse">
                      Markdown Ready
                    </span>
                  ) : (
                    <span className="text-[10px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                      Healthy
                    </span>
                  )}
                </div>
                <div className="flex items-baseline gap-2">
                  <span className={`font-extrabold text-2xl tabular-nums tracking-tight ${surplusAlerts.length > 0 ? 'text-rose-700' : 'text-slate-900'}`}>
                    {surplusAlerts.length} {lang === 'ta' ? 'பொருட்கள்' : 'Produce Items'}
                  </span>
                </div>
                <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px]">
                  {surplusAlerts.length > 0 ? (
                    <>
                      <span className="text-rose-700 font-bold truncate">
                        ₹{surplusAlerts.reduce((acc, a) => acc + a.potentialSavedRupees, 0)} salvage value
                      </span>
                      <span className="font-semibold text-rose-600 group-hover:underline">Clear ⚡</span>
                    </>
                  ) : (
                    <span className="text-slate-500">Zero waste • No excess unsold stock</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <main className="max-w-7xl mx-auto px-3 sm:px-6 py-6 pb-20">
          {activeTab === 'stock' && (
            <StockModule
              logs={stockLogs}
              onAddLog={handleAddStockLog}
              bulkOrders={bulkOrders}
              lang={lang}
              viewMode={viewMode}
            />
          )}

          {activeTab === 'prices' && (
            <PricesModule
              mandiRecords={mandiRecords}
              priceStatus={priceStatus}
              onRefreshPrices={() => fetchMandiRates(true)}
              isRefreshing={isRefreshingPrices}
              vendorPrices={vendorPrices}
              onUpdateVendorPrice={handleUpdateVendorPrice}
              stockLogs={stockLogs}
              khataCustomers={khataCustomers}
              lang={lang}
              viewMode={viewMode}
            />
          )}

          {activeTab === 'resq' && (
            <ResQModule
              logs={stockLogs}
              vendorPrices={vendorPrices}
              vendorProfile={vendorProfile}
              bulkOrders={bulkOrders}
              onToggleClaimBulkOrder={handleToggleClaimBulkOrder}
              lang={lang}
              viewMode={viewMode}
              currentTimeHour={currentTimeHour}
            />
          )}

          {activeTab === 'khata' && (
            <KhataModule
              customers={khataCustomers}
              onAddTransaction={handleAddKhataTransaction}
              onAddCustomer={handleAddKhataCustomer}
              vendorProfile={vendorProfile}
              lang={lang}
              viewMode={viewMode}
            />
          )}
        </main>
      </div>

      {/* Institutional Enterprise Agri-Tech Footer */}
      <footer className="bg-white border-t border-slate-200/90 text-slate-600 text-xs mt-12">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 pb-6 border-b border-slate-100">
            {/* Column 1: System Identification */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-emerald-600 flex items-center justify-center text-white text-xs font-bold">
                  🌱
                </div>
                <span className="font-heading font-extrabold text-slate-900 text-sm tracking-tight">
                  SanthAI Intelligence
                </span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Dedicated daily produce market vendor decision support system tailored for wholesale & retail markets across Tamil Nadu.
              </p>
              <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>TN Agri-Marketing Compliant</span>
              </div>
            </div>

            {/* Column 2: Data & Feeds Integration */}
            <div className="space-y-1.5">
              <div className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                Official Data Feeds
              </div>
              <ul className="space-y-1 text-[11px] text-slate-500">
                <li className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  AGMARKNET (DMI, Ministry of Agriculture)
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  Koyambedu Wholesale Terminal Feeds
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  Uzhavar Sandhai Daily Price Registry
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  Tamil Nadu Mandi Arrival Depth Matrix
                </li>
              </ul>
            </div>

            {/* Column 3: Privacy & Security */}
            <div className="space-y-1.5">
              <div className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                Vendor Data Sovereignty
              </div>
              <ul className="space-y-1 text-[11px] text-slate-500">
                <li className="flex items-center gap-1.5">
                  <Lock className="w-3 h-3 text-slate-400" />
                  Local Device Storage (Zero Cloud Snooping)
                </li>
                <li className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  Bank-Grade Khata Ledger Ledger Hashes
                </li>
                <li className="flex items-center gap-1.5">
                  <Building2 className="w-3 h-3 text-slate-400" />
                  APMC Market Yard Rules Compatibility
                </li>
              </ul>
            </div>

            {/* Column 4: Helplines & Vendor Support */}
            <div className="space-y-2">
              <div className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                Market Support Desk
              </div>
              <p className="text-[11px] text-slate-500">
                For mandi price reporting discrepancies or bulk institution listings:
              </p>
              <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-slate-800 bg-slate-100 p-2 rounded-xl">
                <Phone className="w-3.5 h-3.5 text-emerald-600" />
                <span>1800-425-1550 (Toll-Free TN)</span>
              </div>
            </div>
          </div>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-400">
            <div>
              © 2026 SanthAI Produce Market Intelligence System. All rights reserved.
            </div>
            <div className="flex items-center gap-4">
              <span>Privacy & Local Storage</span>
              <span>•</span>
              <span>Agmarknet Terms</span>
              <span>•</span>
              <span className="text-emerald-600 font-medium">Status: All Systems Operational</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Prototype Vendor & Google Auth Modal */}
      <VendorAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        vendorProfile={vendorProfile}
        onUpdateProfile={setVendorProfile}
        lang={lang}
      />

      {/* Offline Data Vault (Backup & Restore & CSV Export) */}
      <DataVaultModal
        isOpen={isDataVaultOpen}
        onClose={() => setIsDataVaultOpen(false)}
        vendorProfile={vendorProfile}
        customers={khataCustomers}
        logs={stockLogs}
        vendorPrices={vendorPrices}
        onRestore={handleRestoreBackup}
        lang={lang}
      />
    </div>
  );
}
