export type CommodityType = 'Tomato' | 'Onion' | 'Potato' | 'Brinjal' | 'Cabbage' | 'Carrot';

export type Language = 'en' | 'ta';
export type ViewMode = 'simple' | 'technical';

export interface CommodityMeta {
  id: CommodityType;
  nameEn: string;
  nameTa: string;
  category: 'Vegetables' | 'Tubers';
  defaultShelfLifeHours: number;
  iconEmoji: string;
  color: string;
  bgColor: string;
  borderColor: string;
  avgWeightUnit: string;
}

export interface DailyStockLog {
  id: string;
  date: string; // YYYY-MM-DD
  commodity: CommodityType;
  receivedKg: number;
  soldKg: number;
  unsoldKg: number;
  wasteKg: number;
  vendorNotes?: string;
}

export interface DemandForecast {
  commodity: CommodityType;
  walkInForecastKg: number;
  precommittedBulkKg: number;
  totalForecastKg: number;
  alpha: number;
  method: 'exponential_smoothing' | 'weighted_moving_avg';
  historyDays: number;
  errorMarginKg: number;
  lastActualKg: number;
  trend: 'up' | 'down' | 'steady';
  simpleAdviceEn: string;
  simpleAdviceTa: string;
  mathFormula: string;
  calculationBreakdown: {
    label: string;
    value: string | number;
  }[];
}

export interface MandiPriceRecord {
  id: string;
  commodity: CommodityType;
  state: string;
  district: string;
  market: string;
  minPricePerKg: number;
  maxPricePerKg: number;
  modalPricePerKg: number;
  date: string;
  arrivalTons: number;
}

export interface PriceStatus {
  isLive: boolean;
  lastUpdated: string; // formatted e.g. "Just now", "2 hours ago"
  lastUpdatedTimestamp: number;
  source: string;
  apiLatencyMs?: number;
  error?: string;
}

export interface VendorPricing {
  commodity: CommodityType;
  currentSellingPrice: number;
  mandiModalPrice: number;
  mandiMinPrice: number;
  mandiMaxPrice: number;
  zScore: number;
  isOutlier: boolean;
  outlierType: 'none' | 'gouging' | 'undercutting';
  fairPriceRange: [number, number];
}

export interface TrustScoreBreakdown {
  totalScore: number; // 0 - 100
  tier: 'Gold' | 'Silver' | 'Bronze' | 'Needs Review';
  pricingFairnessScore: number; // out of 40
  stockReliabilityScore: number; // out of 30
  creditRepaymentScore: number; // out of 30
  flags: {
    textEn: string;
    textTa: string;
    type: 'positive' | 'warning' | 'neutral';
  }[];
  zScoreAvg: number;
  stockoutRatePct: number;
  onTimeRepaymentPct: number;
}

export interface SurplusRescueMatch {
  id: string;
  commodity: CommodityType;
  unsoldKg: number;
  normalPricePerKg: number;
  suggestedMarkdownPrice: number;
  discountPercent: number;
  buyerName: string;
  buyerType: 'Mess' | 'Hostel' | 'Charity' | 'Canteen';
  distanceKm: number;
  buyerPhone: string;
  requiresKg: number;
  recurring: boolean;
  timeToCloseHours: number;
  potentialSavedRupees: number;
  urgency: 'high' | 'medium' | 'low';
}

export interface BulkOrderBoardItem {
  id: string;
  institutionName: string;
  institutionType: 'Hostel' | 'Hotel/Mess' | 'Charity Kitchen' | 'Hospital Canteen';
  commodity: CommodityType;
  dailyRequirementKg: number;
  weeklySchedule: string;
  targetPricePerKg: number;
  contactPerson: string;
  contactPhone: string;
  location: string;
  claimedByVendor: boolean;
  notes: string;
}

export interface KhataTransaction {
  id: string;
  date: string;
  type: 'CREDIT' | 'PAYMENT';
  amount: number;
  itemsDescription?: string;
  dueDate?: string;
  daysDelayed?: number;
}

export interface KhataCustomer {
  id: string;
  name: string;
  nameTa?: string;
  phone: string;
  totalDue: number;
  creditLimit: number;
  lastPurchaseDate: string;
  transactions: KhataTransaction[];
  riskScore: number; // 0-100 (higher = riskier)
  riskLevel: 'Low' | 'Medium' | 'High';
  onTimePaymentRatio: number;
  notes: string;
}

export interface VendorProfile {
  id: string;
  name: string;
  phone: string;
  marketName: string;
  stallNumber: string;
  upiId: string;
  closingTimeStr: string; // e.g. "19:00"
  marketClosingHour: number; // 19 (7 PM)
  email?: string;
  photoUrl?: string;
  isSimulatedAuth?: boolean;
}

export type BgTheme = 'emerald' | 'golden' | 'ocean' | 'midnight';
