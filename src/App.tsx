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
import { Sidebar } from './components/Sidebar';
import { TopHeader } from './components/TopHeader';
import { StockModule } from './components/StockModule';
import { PricesModule } from './components/PricesModule';
import { ResQModule } from './components/ResQModule';
import { KhataModule } from './components/KhataModule';
import { VendorAuthModal } from './components/VendorAuthModal';
import { DataVaultModal } from './components/DataVaultModal';
import { MarketPulseTicker } from './components/MarketPulseTicker';
import { MarketSessionBanner, MarketSession } from './components/MarketSessionBanner';
import { ThemePaletteBar } from './components/ThemePaletteBar';
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
  Flame,
  Package,
  IndianRupee,
  Boxes,
  BookOpen,
  Pencil,
  AlertCircle,
  Check
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
      return (saved === 'golden' || saved === 'ocean' || saved === 'sunset' || saved === 'amethyst' || saved === 'midnight') ? (saved as BgTheme) : 'emerald';
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
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

  // Synchronize dynamic background themes with document body
  useEffect(() => {
    const themeClasses = ['theme-emerald', 'theme-golden', 'theme-ocean', 'theme-sunset', 'theme-amethyst', 'theme-midnight', 'outdoor-mode'];
    document.body.classList.remove(...themeClasses);
    if (isOutdoorMode) {
      document.body.classList.add('outdoor-mode');
    } else {
      document.body.classList.add(`theme-${bgTheme}`);
    }
  }, [bgTheme, isOutdoorMode]);

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
      case 'sunset': return 'theme-sunset';
      case 'amethyst': return 'theme-amethyst';
      case 'midnight': return 'theme-midnight';
      case 'emerald':
      default:
        return 'theme-emerald';
    }
  };

  return (
    <div className={`min-h-screen ${getThemeClass()} transition-colors duration-300 text-slate-900 font-sans antialiased selection:bg-emerald-200 selection:text-emerald-950 flex flex-col md:flex-row`}>
      {/* Desktop & Tablet Left Sidebar (Matches Reference UI) */}
      <div className="hidden md:block shrink-0 sticky top-0 h-screen overflow-y-auto">
        <Sidebar
          activeTab={activeTab}
          setActiveTab={handleTabSwitch}
          lang={lang}
          vendorProfile={vendorProfile}
          surplusAlertCount={surplusAlerts.length}
          onOpenAuth={() => setIsAuthModalOpen(true)}
        />
      </div>

      {/* Mobile Slideout Navigation Drawer */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden bg-slate-900/60 backdrop-blur-xs flex animate-in fade-in duration-200">
          <div className="w-72 bg-[#f8faf7] h-full shadow-2xl overflow-y-auto">
            <Sidebar
              activeTab={activeTab}
              setActiveTab={(tab) => {
                handleTabSwitch(tab);
                setIsMobileMenuOpen(false);
              }}
              lang={lang}
              vendorProfile={vendorProfile}
              surplusAlertCount={surplusAlerts.length}
              onOpenAuth={() => {
                setIsAuthModalOpen(true);
                setIsMobileMenuOpen(false);
              }}
            />
          </div>
          <div className="flex-1" onClick={() => setIsMobileMenuOpen(false)} />
        </div>
      )}

      {/* Right Column: TopHeader, Pulse, & Active Module Content */}
      <div className="flex-1 flex flex-col min-w-0 justify-between">
        <div>
          {/* Top Header Matching Reference Screenshot */}
          <TopHeader
            lang={lang}
            setLang={setLang}
            viewMode={viewMode}
            setViewMode={setViewMode}
            vendorProfile={vendorProfile}
            onOpenAuth={() => setIsAuthModalOpen(true)}
            isOutdoorMode={isOutdoorMode}
            onToggleOutdoorMode={handleToggleOutdoorMode}
            onOpenDataVault={() => setIsDataVaultOpen(true)}
            onRefreshPrices={() => fetchMandiRates(true)}
            isRefreshing={isRefreshingPrices}
            bgTheme={bgTheme}
            onChangeBgTheme={handleChangeBgTheme}
            onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            isMobileMenuOpen={isMobileMenuOpen}
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

          {/* Executive Stall KPI Summary Strip */}
          <div className="border-b border-[#e3ece2]/80 bg-white/70 backdrop-blur-md px-4 sm:px-8 py-3.5">
            <div className="max-w-7xl mx-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {/* Stall Location & Info */}
                <div 
                  onClick={() => {
                    SoundEffects.playClick();
                    setIsAuthModalOpen(true);
                  }}
                  className="bg-white hover:bg-slate-50/80 transition-all p-3.5 rounded-xl border border-slate-200/90 shadow-2xs cursor-pointer group"
                >
                  <div className="flex items-center justify-between text-[11px] mb-1.5">
                    <span className="font-semibold uppercase tracking-wider text-slate-500 text-[10px] flex items-center gap-1.5">
                      <Store className="w-3.5 h-3.5 text-slate-400" />
                      {lang === 'ta' ? 'வணிகக் கடை' : 'Active Stall'}
                    </span>
                    <span className="text-[11px] font-medium text-slate-500 group-hover:text-emerald-700 flex items-center gap-1 transition-colors">
                      <Pencil className="w-3 h-3 text-slate-400 group-hover:text-emerald-600" />
                      {lang === 'ta' ? 'விவரங்கள்' : 'Edit'}
                    </span>
                  </div>
                  <div className="font-bold text-slate-900 text-sm tracking-tight truncate">
                    {vendorProfile.marketComplex}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1 truncate">
                    <span className="font-semibold text-slate-700">{vendorProfile.stallNumber}</span>
                    <span className="text-slate-300">•</span>
                    <span className="truncate">{vendorProfile.name}</span>
                  </div>
                  <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                    <span className="flex items-center gap-1 text-emerald-700 font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                      {lang === 'ta' ? 'சரிபார்க்கப்பட்ட கடை' : 'Verified Stall'}
                    </span>
                    <span className="font-mono text-slate-400">{vendorProfile.closingTimeStr}</span>
                  </div>
                </div>

                {/* Vendor Trust Score */}
                <div 
                  onClick={() => handleTabSwitch('prices')}
                  className="bg-white hover:bg-slate-50/80 transition-all p-3.5 rounded-xl border border-slate-200/90 shadow-2xs cursor-pointer group"
                >
                  <div className="flex items-center justify-between text-[11px] mb-1.5">
                    <span className="font-semibold uppercase tracking-wider text-slate-500 text-[10px] flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
                      {lang === 'ta' ? 'நம்பிக்கை மதிப்பீடு' : 'Trust Rating'}
                    </span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-amber-50 text-amber-900 border border-amber-200/80">
                      {trustScore.tier} Tier
                    </span>
                  </div>
                  <div className="flex items-baseline gap-1.5 mt-0.5">
                    <span className="font-bold text-slate-900 text-2xl font-sans tracking-tight tabular-nums">
                      {trustScore.totalScore}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">/ 100</span>
                    <span className="ml-auto text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/80 flex items-center gap-1">
                      <Check className="w-2.5 h-2.5 text-emerald-600" />
                      {lang === 'ta' ? 'நேர்மையான வணிகர்' : 'Fair Trader'}
                    </span>
                  </div>
                  <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                    <span>{lang === 'ta' ? 'விலை நியாயம்' : 'Pricing Fairness'}: {trustScore.pricingFairnessScore}/40</span>
                    <span className="text-emerald-700 font-medium">{lang === 'ta' ? '0 முறையீடுகள்' : '0 disputes'}</span>
                  </div>
                </div>

                {/* Khata Outstanding */}
                <div 
                  onClick={() => handleTabSwitch('khata')}
                  className="bg-white hover:bg-slate-50/80 transition-all p-3.5 rounded-xl border border-slate-200/90 shadow-2xs cursor-pointer group"
                >
                  <div className="flex items-center justify-between text-[11px] mb-1.5">
                    <span className="font-semibold uppercase tracking-wider text-slate-500 text-[10px] flex items-center gap-1.5">
                      <Coins className="w-3.5 h-3.5 text-slate-400" />
                      {lang === 'ta' ? 'கடன் பாக்கி (KHATA)' : 'Khata Ledger'}
                    </span>
                    <span className="text-[10px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200/80">
                      {khataCustomers.length} {lang === 'ta' ? 'கணக்குகள்' : 'accounts'}
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between mt-0.5">
                    <span className="font-bold text-slate-900 text-2xl font-sans tracking-tight tabular-nums">
                      ₹{totalKhataOutstanding.toLocaleString()}
                    </span>
                  </div>
                  <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                    <span>{lang === 'ta' ? '84% குறித்த நேர வசூல்' : '84% on-time repayment'}</span>
                    <span className="text-emerald-700 font-medium group-hover:underline">{lang === 'ta' ? 'கணக்குகள் →' : 'View Ledger →'}</span>
                  </div>
                </div>

                {/* Surplus Produce Status */}
                <div 
                  onClick={() => handleTabSwitch('resq')}
                  className={`p-3.5 rounded-xl border transition-all shadow-2xs cursor-pointer group ${
                    surplusAlerts.length > 0
                      ? 'bg-amber-50/40 hover:bg-amber-50/70 border-amber-200/90'
                      : 'bg-white hover:bg-slate-50/80 border-slate-200/90'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] mb-1.5">
                    <span className="font-semibold uppercase tracking-wider text-slate-500 text-[10px] flex items-center gap-1.5">
                      <AlertCircle className={`w-3.5 h-3.5 ${surplusAlerts.length > 0 ? 'text-amber-600' : 'text-slate-400'}`} />
                      {lang === 'ta' ? 'மீதி சரக்கு' : 'Surplus Inventory'}
                    </span>
                    {surplusAlerts.length > 0 ? (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-300/80 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
                        {lang === 'ta' ? 'விலை திருத்தம் தேவை' : 'Action Recommended'}
                      </span>
                    ) : (
                      <span className="text-[10px] font-medium text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/80">
                        {lang === 'ta' ? 'இயல்பு நிலை' : 'Cleared'}
                      </span>
                    )}
                  </div>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <span className={`font-bold text-2xl font-sans tracking-tight tabular-nums ${
                      surplusAlerts.length > 0 ? 'text-amber-950' : 'text-slate-900'
                    }`}>
                      {surplusAlerts.length} {lang === 'ta' ? 'பொருட்கள்' : 'items'}
                    </span>
                  </div>
                  <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                    {surplusAlerts.length > 0 ? (
                      <>
                        <span className="text-amber-800 font-medium truncate">
                          {lang === 'ta' ? 'மீட்கக்கூடிய மதிப்பு' : 'Salvage value'}: ₹{surplusAlerts.reduce((acc, a) => acc + a.potentialSavedRupees, 0)}
                        </span>
                        <span className="text-amber-900 font-semibold group-hover:underline">
                          {lang === 'ta' ? 'தீர்வு காண்க →' : 'Review →'}
                        </span>
                      </>
                    ) : (
                      <span className="text-slate-500">{lang === 'ta' ? 'பூஜ்ஜிய விரயம் • உபரி இல்லை' : 'Zero waste • No unsold surplus'}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <main className="max-w-7xl mx-auto px-4 sm:px-8 py-6 pb-24 md:pb-12">
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

        {/* Institutional Agri-Tech Footer */}
        <footer className="bg-white border-t border-[#e3ece2] text-slate-600 text-xs mt-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-8 py-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-400">
              <div>
                © 2026 SanthAI Produce Market Intelligence System. All rights reserved.
              </div>
              <div className="flex items-center gap-4">
                <span>Local Storage Sovereign</span>
                <span>•</span>
                <span>Agmarknet Direct Data</span>
                <span>•</span>
                <span className="text-emerald-700 font-semibold">Status: Online</span>
              </div>
            </div>
          </div>
        </footer>
      </div>

      {/* Mobile Bottom Navigation Bar (Thumb Reach on Small Screens) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#e3ece2] px-3 py-2 flex items-center justify-around shadow-lg">
        {[
          { id: 'stock' as const, label: lang === 'ta' ? 'சரக்கு' : 'Stock', icon: Package },
          { id: 'prices' as const, label: lang === 'ta' ? 'விலை' : 'Prices', icon: IndianRupee },
          { id: 'resq' as const, label: 'ResQ', icon: Boxes, badge: surplusAlerts.length },
          { id: 'khata' as const, label: lang === 'ta' ? 'கடன்' : 'Khata', icon: BookOpen }
        ].map(item => {
          const isActive = activeTab === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => {
                SoundEffects.playClick();
                handleTabSwitch(item.id);
              }}
              className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-colors relative ${
                isActive ? 'text-[#183a27] font-black' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[11px]">{item.label}</span>
              {item.badge && item.badge > 0 ? (
                <span className="absolute top-1 right-2 w-2 h-2 bg-amber-500 rounded-full" />
              ) : null}
            </button>
          );
        })}
      </div>

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
