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
  BgTheme,
  ResQUserRole,
  BuyerProfile,
  ActiveTab
} from './types';
import { DEFAULT_BUYER_PROFILES, ResQSyncService } from './services/resqSync';
import {
  INITIAL_STOCK_LOGS,
  INITIAL_BULK_ORDERS,
  INITIAL_KHATA_CUSTOMERS,
  CACHED_TN_MANDI_PRICES
} from './data/commodities';
import { AgmarknetService } from './services/agmarknet';
import { AuthService } from './services/auth';
import { FirebaseService, auth } from './services/firebase';
import { User } from 'firebase/auth';
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
import { AiMarketStudio } from './components/AiMarketStudio';
import { FloatingLiveVoiceButton } from './components/FloatingLiveVoiceButton';
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
  const [activeTab, setActiveTab] = useState<ActiveTab>('stock');
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

  // Multi-user ResQ Role state: 'vendor' vs 'buyer' (Mess / Hostel)
  const [resqUserRole, setResqUserRole] = useState<ResQUserRole>('vendor');
  const [activeBuyerProfile, setActiveBuyerProfile] = useState<BuyerProfile>(DEFAULT_BUYER_PROFILES[0]);

  const handleRoleChange = (role: ResQUserRole) => {
    setResqUserRole(role);
    if (role === 'buyer' && activeTab !== 'resq') {
      setActiveTab('resq');
    }
  };

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

  // Google Firebase Auth & Cloud Firestore sync state
  const [currentUser, setCurrentUser] = useState<User | null>(() => auth.currentUser);
  const [cloudSyncStatus, setCloudSyncStatus] = useState<'idle' | 'syncing' | 'synced' | 'error'>('idle');
  const [isCloudSyncing, setIsCloudSyncing] = useState<boolean>(false);

  // Manual cloud merge trigger
  const handleManualCloudSync = async () => {
    const user = auth.currentUser;
    if (!user) return;
    setIsCloudSyncing(true);
    setCloudSyncStatus('syncing');
    try {
      const merged = await FirebaseService.mergeOfflineDataToCloud(
        user.uid,
        stockLogs,
        khataCustomers,
        vendorProfile,
        vendorPrices
      );
      if (merged.profile) setVendorProfile(merged.profile);
      if (merged.stockLogs && merged.stockLogs.length > 0) setStockLogs(merged.stockLogs);
      if (merged.khataCustomers && merged.khataCustomers.length > 0) setKhataCustomers(merged.khataCustomers);
      if (merged.vendorPrices) setVendorPrices(merged.vendorPrices);
      setCloudSyncStatus('synced');
    } catch (err) {
      console.warn('Manual cloud sync failed:', err);
      setCloudSyncStatus('error');
    } finally {
      setIsCloudSyncing(false);
    }
  };

  // Firebase Auth listener and automatic offline-to-cloud merge
  useEffect(() => {
    const unsubscribeAuth = FirebaseService.onAuthStateChanged(async (user) => {
      setCurrentUser(user);
      if (user) {
        setCloudSyncStatus('syncing');
        try {
          const merged = await FirebaseService.mergeOfflineDataToCloud(
            user.uid,
            stockLogs,
            khataCustomers,
            vendorProfile,
            vendorPrices
          );
          if (merged.profile) setVendorProfile(merged.profile);
          if (merged.stockLogs && merged.stockLogs.length > 0) setStockLogs(merged.stockLogs);
          if (merged.khataCustomers && merged.khataCustomers.length > 0) setKhataCustomers(merged.khataCustomers);
          if (merged.vendorPrices) setVendorPrices(merged.vendorPrices);
          setCloudSyncStatus('synced');
        } catch (err) {
          console.warn('Initial cloud merge error:', err);
          setCloudSyncStatus('error');
        }

        // Real-time listener for cloud changes
        const unsubscribeCloud = FirebaseService.subscribeToUserCloudData(user.uid, (cloudData) => {
          if (cloudData.profile) setVendorProfile(cloudData.profile);
          if (cloudData.stockLogs && cloudData.stockLogs.length > 0) setStockLogs(cloudData.stockLogs);
          if (cloudData.khataCustomers && cloudData.khataCustomers.length > 0) setKhataCustomers(cloudData.khataCustomers);
          if (cloudData.vendorPrices) setVendorPrices(cloudData.vendorPrices);
          setCloudSyncStatus('synced');
        });

        return () => {
          unsubscribeCloud();
        };
      } else {
        setCloudSyncStatus('idle');
      }
    });

    return () => {
      unsubscribeAuth();
    };
  }, []);

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

  // Real-time listener for unread alerts, buyer inquiries, or pending tasks from ResQ lots
  const [unreadAlertsCount, setUnreadAlertsCount] = useState<number>(0);

  useEffect(() => {
    const unsubscribe = ResQSyncService.subscribeToLots((lots) => {
      const totalUnread = lots.reduce((acc, lot) => {
        const lotUnread = lot.unreadCountVendor || 0;
        const pendingReservation = (lot.status === 'reserved' && lot.paymentStatus === 'pending') ? 1 : 0;
        return acc + lotUnread + pendingReservation;
      }, 0);
      setUnreadAlertsCount(totalUnread);
    });

    return () => {
      unsubscribe();
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

  // Save changes to localStorage and Cloud Firestore
  useEffect(() => {
    try {
      localStorage.setItem('santhai_stock_logs', JSON.stringify(stockLogs));
      if (auth.currentUser) {
        FirebaseService.syncStockLogs(auth.currentUser.uid, stockLogs);
      }
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
      if (auth.currentUser) {
        FirebaseService.syncKhataCustomers(auth.currentUser.uid, khataCustomers);
      }
    } catch (e) {
      console.warn(e);
    }
  }, [khataCustomers]);

  useEffect(() => {
    try {
      localStorage.setItem('santhai_vendor_prices', JSON.stringify(vendorPrices));
      if (auth.currentUser) {
        FirebaseService.syncVendorPrices(auth.currentUser.uid, vendorPrices);
      }
    } catch (e) {
      console.warn(e);
    }
  }, [vendorPrices]);

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
  const pendingSurplusTasks = surplusAlerts.length;
  const hasAlertsOrPendingTasks = pendingSurplusTasks > 0 || unreadAlertsCount > 0;

  // Executive summary numbers
  const trustScore = PricingEngine.computeTrustScore(vendorPrices, mandiRecords, stockLogs, khataCustomers);
  const totalKhataOutstanding = khataCustomers.reduce((acc, c) => acc + c.totalDue, 0);

  const handleTabSwitch = (tab: ActiveTab) => {
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
    <div className={`min-h-screen ${getThemeClass()} transition-colors duration-300 text-slate-900 font-sans antialiased selection:bg-emerald-200 selection:text-emerald-950 flex flex-col md:flex-row relative`}>
      {/* Ambient Canvas Lighting Spheres (Fixed, Non-blocking Atmospheric Glow) */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 select-none" aria-hidden="true">
        <div
          className={`absolute -top-40 -right-40 w-[36rem] h-[36rem] rounded-full blur-3xl opacity-60 transition-all duration-700 ${
            bgTheme === 'golden'
              ? 'bg-amber-400/25'
              : bgTheme === 'ocean'
              ? 'bg-sky-400/25'
              : bgTheme === 'sunset'
              ? 'bg-rose-400/25'
              : bgTheme === 'amethyst'
              ? 'bg-purple-400/25'
              : bgTheme === 'midnight'
              ? 'bg-emerald-500/10'
              : 'bg-emerald-400/25'
          }`}
        />
        <div
          className={`absolute top-1/3 -left-40 w-[32rem] h-[32rem] rounded-full blur-3xl opacity-50 transition-all duration-700 ${
            bgTheme === 'golden'
              ? 'bg-orange-400/20'
              : bgTheme === 'ocean'
              ? 'bg-teal-400/20'
              : bgTheme === 'sunset'
              ? 'bg-amber-400/20'
              : bgTheme === 'amethyst'
              ? 'bg-indigo-400/20'
              : bgTheme === 'midnight'
              ? 'bg-indigo-500/10'
              : 'bg-teal-400/20'
          }`}
        />
        <div
          className={`absolute bottom-0 right-1/4 w-[40rem] h-[40rem] rounded-full blur-3xl opacity-40 transition-all duration-700 ${
            bgTheme === 'golden'
              ? 'bg-yellow-300/25'
              : bgTheme === 'ocean'
              ? 'bg-cyan-300/25'
              : bgTheme === 'sunset'
              ? 'bg-rose-300/25'
              : bgTheme === 'amethyst'
              ? 'bg-fuchsia-300/25'
              : bgTheme === 'midnight'
              ? 'bg-sky-500/10'
              : 'bg-emerald-300/25'
          }`}
        />
      </div>

      {/* Desktop & Tablet Left Sidebar (Matches Reference UI) */}
      <div className="hidden md:block shrink-0 sticky top-0 h-screen overflow-y-auto z-10">
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
          <div className="w-72 bg-white/95 backdrop-blur-2xl h-full shadow-2xl overflow-y-auto">
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
      <div className="flex-1 flex flex-col min-w-0 justify-between relative z-10">
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
            resqUserRole={resqUserRole}
            onChangeResqUserRole={handleRoleChange}
            activeBuyer={activeBuyerProfile}
            onChangeActiveBuyer={setActiveBuyerProfile}
            isGoogleConnected={Boolean(currentUser || vendorProfile.email)}
            cloudSyncStatus={cloudSyncStatus}
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
          <div className="border-b border-black/[0.05] bg-white/40 backdrop-blur-md px-4 sm:px-8 py-4">
            <div className="max-w-7xl mx-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {/* Stall Location & Info - Enhanced Active Stall Card with Glowing Ring & Tactile Depth */}
                <div 
                  onClick={() => {
                    SoundEffects.playClick();
                    setIsAuthModalOpen(true);
                  }}
                  className="relative overflow-hidden bg-gradient-to-br from-emerald-950 via-emerald-900 to-teal-950 text-white transition-all duration-300 p-4 rounded-2xl border border-emerald-500/40 shadow-[0_12px_28px_-6px_rgba(6,78,59,0.45),0_0_0_1px_rgba(16,185,129,0.25)] hover:shadow-[0_18px_38px_-6px_rgba(6,78,59,0.6),0_0_0_1.5px_rgba(52,211,153,0.45)] hover-lift cursor-pointer group"
                >
                  {/* Ambient emerald radial glow aura */}
                  <div className="absolute -top-12 -right-12 w-32 h-32 bg-emerald-400/25 rounded-full blur-2xl pointer-events-none group-hover:bg-emerald-300/35 transition-all duration-500" />
                  <div className="absolute -bottom-10 -left-10 w-28 h-28 bg-teal-400/20 rounded-full blur-xl pointer-events-none" />

                  <div className="relative flex items-center justify-between text-[11px] mb-2.5">
                    {/* Glowing ring and thick tactile icon badge */}
                    <div className="flex items-center gap-2.5">
                      <div className="relative flex items-center justify-center">
                        {/* Outer glowing ring with subtle breathing animation when vendor has unread alerts or pending surplus tasks */}
                        {hasAlertsOrPendingTasks ? (
                          <>
                            {/* Layer 1: Ambient soft breathing aura */}
                            <div 
                              className="absolute -inset-2 rounded-2xl bg-gradient-to-r from-emerald-400/80 via-teal-300/80 to-emerald-500/80 blur-md animate-ring-breathe pointer-events-none" 
                            />
                            {/* Layer 2: Focused luminous breathing ring */}
                            <div 
                              className="absolute -inset-1 rounded-xl bg-gradient-to-r from-emerald-300 via-teal-200 to-emerald-400 blur-xs animate-ring-breathe pointer-events-none"
                              style={{ animationDelay: '0.15s' }}
                            />
                          </>
                        ) : (
                          /* Resting calm ambient glow when all tasks cleared */
                          <div className="absolute -inset-1 rounded-xl bg-gradient-to-r from-emerald-400/50 via-teal-400/40 to-emerald-500/50 opacity-60 blur-xs group-hover:opacity-90 transition-opacity pointer-events-none" />
                        )}

                        {/* Thick tactile inner container with subtle scale breath when attention needed */}
                        <div className={`relative w-8 h-8 rounded-xl bg-gradient-to-b from-emerald-600 via-emerald-800 to-emerald-950 flex items-center justify-center border transition-all ${
                          hasAlertsOrPendingTasks 
                            ? 'border-emerald-200/90 shadow-[inset_0_1.5px_2px_rgba(255,255,255,0.7),0_0_14px_rgba(52,211,153,0.55)] animate-inner-breathe' 
                            : 'border-emerald-300/50 shadow-[inset_0_1.5px_2px_rgba(255,255,255,0.45),0_3px_6px_rgba(0,0,0,0.5)]'
                        }`}>
                          <Store className="w-4 h-4 text-emerald-100 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]" />
                          {/* Alert attention pip beacon */}
                          {hasAlertsOrPendingTasks && (
                            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-400 border border-emerald-950 shadow-xs"></span>
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col">
                        <div className="flex items-center gap-1.5">
                          <span className="font-extrabold tracking-wider text-emerald-200 uppercase text-[10px] drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
                            {lang === 'ta' ? 'வணிகக் கடை' : 'Active Stall'}
                          </span>
                          {hasAlertsOrPendingTasks && (
                            <span 
                              className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-amber-400/25 text-amber-200 border border-amber-400/40 animate-pulse tracking-tight shadow-xs"
                              title={lang === 'ta' ? `${pendingSurplusTasks} உபரி எச்சரிக்கை, ${unreadAlertsCount} அறிவிப்பு` : `${pendingSurplusTasks} surplus task(s), ${unreadAlertsCount} unread alert(s)`}
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                              {pendingSurplusTasks > 0
                                ? `${pendingSurplusTasks} ${lang === 'ta' ? 'உபரி' : 'surplus'}`
                                : `${unreadAlertsCount} ${lang === 'ta' ? 'செய்தி' : 'alert'}`}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <span className="text-[11px] font-semibold text-emerald-200 group-hover:text-white flex items-center gap-1 transition-colors bg-white/15 backdrop-blur-xs px-2.5 py-0.5 rounded-full border border-white/20 shadow-xs">
                      <Pencil className="w-3 h-3 text-emerald-300" />
                      {lang === 'ta' ? 'விவரங்கள்' : 'Edit'}
                    </span>
                  </div>

                  <div className="relative font-black text-white text-base tracking-tight truncate drop-shadow-sm">
                    {vendorProfile.marketComplex}
                  </div>
                  <div className="relative flex items-center gap-1.5 text-xs text-emerald-100/90 mt-1 truncate font-medium">
                    <span className="font-bold text-emerald-200 bg-emerald-900/80 px-2 py-0.5 rounded-md border border-emerald-400/30 shadow-xs">
                      {vendorProfile.stallNumber}
                    </span>
                    <span className="text-emerald-400/60">•</span>
                    <span className="truncate text-emerald-50">{vendorProfile.name}</span>
                  </div>

                  <div className="relative mt-3 pt-2.5 border-t border-emerald-800/70 flex items-center justify-between text-[10px]">
                    <span className="flex items-center gap-1.5 text-emerald-300 font-bold">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400 shadow-[0_0_8px_#34d399]"></span>
                      </span>
                      {hasAlertsOrPendingTasks
                        ? (lang === 'ta' ? 'கவனம் தேவை' : 'Action Pending')
                        : (lang === 'ta' ? 'சரிபார்க்கப்பட்ட கடை' : 'Verified Stall')}
                    </span>
                    <span className="font-mono text-emerald-200 font-bold bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/30">
                      {vendorProfile.closingTimeStr}
                    </span>
                  </div>
                </div>

                {/* Vendor Trust Score */}
                <div 
                  onClick={() => handleTabSwitch('prices')}
                  className="bg-white/95 backdrop-blur-sm hover:bg-white transition-all p-4 rounded-2xl border border-slate-200/80 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)] hover:shadow-[0_12px_28px_-6px_rgba(0,0,0,0.08)] hover-lift card-sheen cursor-pointer group"
                >
                  <div className="flex items-center justify-between text-[11px] mb-2">
                    <span className="font-semibold uppercase tracking-wider text-slate-500 text-[10px] flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                      {lang === 'ta' ? 'நம்பிக்கை மதிப்பீடு' : 'Trust Rating'}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-900 border border-amber-200/80">
                      {trustScore.tier} Tier
                    </span>
                  </div>
                  <div className="flex items-baseline gap-1.5 mt-0.5">
                    <span className="font-black text-slate-900 text-3xl font-display tracking-tight tabular-nums">
                      {trustScore.totalScore}
                    </span>
                    <span className="text-xs text-slate-400 font-semibold">/ 100</span>
                    <span className="ml-auto text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/80 flex items-center gap-1">
                      <Check className="w-2.5 h-2.5 text-emerald-600 stroke-[3]" />
                      {lang === 'ta' ? 'நேர்மையான வணிகர்' : 'Fair Trader'}
                    </span>
                  </div>
                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                    <span className="font-medium text-slate-600">{lang === 'ta' ? 'விலை நியாயம்' : 'Pricing Fairness'}: {trustScore.pricingFairnessScore}/40</span>
                    <span className="text-emerald-700 font-semibold">{lang === 'ta' ? '0 முறையீடுகள்' : '0 disputes'}</span>
                  </div>
                </div>

                {/* Khata Outstanding */}
                <div 
                  onClick={() => handleTabSwitch('khata')}
                  className="bg-white/95 backdrop-blur-sm hover:bg-white transition-all p-4 rounded-2xl border border-slate-200/80 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)] hover:shadow-[0_12px_28px_-6px_rgba(0,0,0,0.08)] hover-lift card-sheen cursor-pointer group"
                >
                  <div className="flex items-center justify-between text-[11px] mb-2">
                    <span className="font-semibold uppercase tracking-wider text-slate-500 text-[10px] flex items-center gap-1.5">
                      <Coins className="w-3.5 h-3.5 text-indigo-600" />
                      {lang === 'ta' ? 'கடன் பாக்கி (KHATA)' : 'Khata Ledger'}
                    </span>
                    <span className="text-[10px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200/80">
                      {khataCustomers.length} {lang === 'ta' ? 'கணக்குகள்' : 'accounts'}
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between mt-0.5">
                    <span className="font-black text-slate-900 text-3xl font-mono tracking-tight tabular-nums">
                      ₹{totalKhataOutstanding.toLocaleString()}
                    </span>
                  </div>
                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                    <span className="font-medium text-slate-600">{lang === 'ta' ? '84% குறித்த நேர வசூல்' : '84% on-time repayment'}</span>
                    <span className="text-emerald-700 font-bold group-hover:underline">{lang === 'ta' ? 'கணக்குகள் →' : 'View Ledger →'}</span>
                  </div>
                </div>

                {/* Surplus Produce Status */}
                <div 
                  onClick={() => handleTabSwitch('resq')}
                  className={`p-4 rounded-2xl border transition-all shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)] hover:shadow-[0_12px_28px_-6px_rgba(0,0,0,0.08)] hover-lift card-sheen cursor-pointer group ${
                    surplusAlerts.length > 0
                      ? 'bg-amber-50/70 hover:bg-amber-50/90 border-amber-200/90'
                      : 'bg-white/95 backdrop-blur-sm hover:bg-white border-slate-200/80'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] mb-2">
                    <span className="font-semibold uppercase tracking-wider text-slate-500 text-[10px] flex items-center gap-1.5">
                      <AlertCircle className={`w-3.5 h-3.5 ${surplusAlerts.length > 0 ? 'text-amber-600' : 'text-slate-400'}`} />
                      {lang === 'ta' ? 'மீதி சரக்கு' : 'Surplus Inventory'}
                    </span>
                    {surplusAlerts.length > 0 ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-300/80 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-ping" />
                        {lang === 'ta' ? 'விலை திருத்தம் தேவை' : 'Action Recommended'}
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/80">
                        {lang === 'ta' ? 'இயல்பு நிலை' : 'Cleared'}
                      </span>
                    )}
                  </div>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <span className={`font-black text-3xl font-display tracking-tight tabular-nums ${
                      surplusAlerts.length > 0 ? 'text-amber-950' : 'text-slate-900'
                    }`}>
                      {surplusAlerts.length} {lang === 'ta' ? 'பொருட்கள்' : 'items'}
                    </span>
                  </div>
                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                    {surplusAlerts.length > 0 ? (
                      <>
                        <span className="text-amber-800 font-semibold truncate">
                          {lang === 'ta' ? 'மீட்கக்கூடிய மதிப்பு' : 'Salvage'}: ₹{surplusAlerts.reduce((acc, a) => acc + a.potentialSavedRupees, 0)}
                        </span>
                        <span className="text-amber-900 font-black group-hover:underline">
                          {lang === 'ta' ? 'தீர்வு காண்க →' : 'Review →'}
                        </span>
                      </>
                    ) : (
                      <span className="text-slate-500 font-medium">{lang === 'ta' ? 'பூஜ்ஜிய விரயம் • உபரி இல்லை' : 'Zero waste • No unsold surplus'}</span>
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
                userRole={resqUserRole}
                onChangeUserRole={handleRoleChange}
                activeBuyer={activeBuyerProfile}
                onChangeActiveBuyer={setActiveBuyerProfile}
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

            {activeTab === 'aistudio' && (
              <AiMarketStudio lang={lang} />
            )}
          </main>
        </div>

        {/* Institutional Agri-Tech Footer */}
        <footer className="bg-white/50 backdrop-blur-md border-t border-black/[0.05] text-slate-600 text-xs mt-8">
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
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/85 backdrop-blur-xl border-t border-black/[0.06] px-2 py-2 flex items-center justify-around shadow-lg">
        {[
          { id: 'stock' as const, label: lang === 'ta' ? 'சரக்கு' : 'Stock', icon: Package },
          { id: 'prices' as const, label: lang === 'ta' ? 'விலை' : 'Prices', icon: IndianRupee },
          { id: 'resq' as const, label: 'ResQ', icon: Boxes, badge: surplusAlerts.length },
          { id: 'khata' as const, label: lang === 'ta' ? 'கடன்' : 'Khata', icon: BookOpen },
          { id: 'aistudio' as const, label: 'AI', icon: Sparkles }
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
              className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl transition-colors relative cursor-pointer ${
                isActive ? 'text-[#183a27] font-black' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="text-[10px]">{item.label}</span>
              {item.badge && item.badge > 0 ? (
                <span className="absolute top-1 right-2 w-2 h-2 bg-amber-500 rounded-full" />
              ) : null}
            </button>
          );
        })}
      </div>

      {/* Floating Gemini 3.8 Live Voice Assistant Button & Drawer */}
      <FloatingLiveVoiceButton lang={lang} />

      {/* Vendor & Google Firebase Auth Modal */}
      <VendorAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        vendorProfile={vendorProfile}
        onUpdateProfile={setVendorProfile}
        lang={lang}
        onManualCloudSync={handleManualCloudSync}
        isCloudSyncing={isCloudSyncing}
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
