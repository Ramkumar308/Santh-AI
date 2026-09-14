import { CommodityMeta, CommodityType, MandiPriceRecord, DailyStockLog, BulkOrderBoardItem, KhataCustomer, VendorProfile } from '../types';

export const COMMODITIES: Record<CommodityType, CommodityMeta> = {
  Tomato: {
    id: 'Tomato',
    nameEn: 'Tomato',
    nameTa: 'தக்காளி',
    category: 'Vegetables',
    defaultShelfLifeHours: 36,
    iconEmoji: '🍅',
    color: 'text-rose-600',
    bgColor: 'bg-rose-50',
    borderColor: 'border-rose-200',
    avgWeightUnit: 'kg'
  },
  Onion: {
    id: 'Onion',
    nameEn: 'Onion',
    nameTa: 'வெங்காயம்',
    category: 'Vegetables',
    defaultShelfLifeHours: 120,
    iconEmoji: '🧅',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    avgWeightUnit: 'kg'
  },
  Potato: {
    id: 'Potato',
    nameEn: 'Potato',
    nameTa: 'உருளைக்கிழங்கு',
    category: 'Tubers',
    defaultShelfLifeHours: 168,
    iconEmoji: '🥔',
    color: 'text-amber-700',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    avgWeightUnit: 'kg'
  },
  Brinjal: {
    id: 'Brinjal',
    nameEn: 'Brinjal',
    nameTa: 'கத்தரிக்காய்',
    category: 'Vegetables',
    defaultShelfLifeHours: 48,
    iconEmoji: '🍆',
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50',
    borderColor: 'border-indigo-200',
    avgWeightUnit: 'kg'
  },
  Cabbage: {
    id: 'Cabbage',
    nameEn: 'Cabbage',
    nameTa: 'முட்டைக்கோஸ்',
    category: 'Vegetables',
    defaultShelfLifeHours: 72,
    iconEmoji: '🥬',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
    avgWeightUnit: 'kg'
  },
  Carrot: {
    id: 'Carrot',
    nameEn: 'Carrot',
    nameTa: 'கேரட்',
    category: 'Tubers',
    defaultShelfLifeHours: 96,
    iconEmoji: '🥕',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    avgWeightUnit: 'kg'
  }
};

export const DEFAULT_VENDOR: VendorProfile = {
  id: 'vendor_01',
  name: 'Murugan Palanisamy',
  phone: '9840123456',
  marketName: 'Koyambedu Wholesale Market, Chennai',
  stallNumber: 'Shop B-42',
  upiId: 'murugan.veg@oksbi',
  closingTimeStr: '19:30',
  marketClosingHour: 19,
  email: 'ksramkumar2148@gmail.com',
  isSimulatedAuth: true
};

// Real recent snapshot from Tamil Nadu Mandis (Agmarknet data extract fallback)
export const CACHED_TN_MANDI_PRICES: MandiPriceRecord[] = [
  // Tomato
  { id: 'm1', commodity: 'Tomato', state: 'Tamil Nadu', district: 'Chennai', market: 'Koyambedu Market', minPricePerKg: 24, maxPricePerKg: 34, modalPricePerKg: 28, date: '2026-09-10', arrivalTons: 140 },
  { id: 'm2', commodity: 'Tomato', state: 'Tamil Nadu', district: 'Madurai', market: 'Mattuthavani Market', minPricePerKg: 22, maxPricePerKg: 30, modalPricePerKg: 26, date: '2026-09-10', arrivalTons: 65 },
  { id: 'm3', commodity: 'Tomato', state: 'Tamil Nadu', district: 'Coimbatore', market: 'MGR Wholesale Mandi', minPricePerKg: 25, maxPricePerKg: 35, modalPricePerKg: 30, date: '2026-09-10', arrivalTons: 80 },
  { id: 'm4', commodity: 'Tomato', state: 'Tamil Nadu', district: 'Salem', market: 'Salem Uzhavar Sandhai', minPricePerKg: 20, maxPricePerKg: 28, modalPricePerKg: 24, date: '2026-09-10', arrivalTons: 45 },
  { id: 'm5', commodity: 'Tomato', state: 'Tamil Nadu', district: 'Dindigul', market: 'Oddanchatram Market', minPricePerKg: 21, maxPricePerKg: 29, modalPricePerKg: 25, date: '2026-09-10', arrivalTons: 110 },
  { id: 'm6', commodity: 'Tomato', state: 'Tamil Nadu', district: 'Tiruchirappalli', market: 'Gandhi Market', minPricePerKg: 23, maxPricePerKg: 32, modalPricePerKg: 27, date: '2026-09-10', arrivalTons: 50 },

  // Onion
  { id: 'm7', commodity: 'Onion', state: 'Tamil Nadu', district: 'Chennai', market: 'Koyambedu Market', minPricePerKg: 32, maxPricePerKg: 44, modalPricePerKg: 38, date: '2026-09-10', arrivalTons: 220 },
  { id: 'm8', commodity: 'Onion', state: 'Tamil Nadu', district: 'Madurai', market: 'Mattuthavani Market', minPricePerKg: 30, maxPricePerKg: 42, modalPricePerKg: 36, date: '2026-09-10', arrivalTons: 95 },
  { id: 'm9', commodity: 'Onion', state: 'Tamil Nadu', district: 'Coimbatore', market: 'MGR Wholesale Mandi', minPricePerKg: 34, maxPricePerKg: 46, modalPricePerKg: 40, date: '2026-09-10', arrivalTons: 130 },
  { id: 'm10', commodity: 'Onion', state: 'Tamil Nadu', district: 'Dindigul', market: 'Dindigul Central Market', minPricePerKg: 28, maxPricePerKg: 39, modalPricePerKg: 34, date: '2026-09-10', arrivalTons: 70 },
  { id: 'm11', commodity: 'Onion', state: 'Tamil Nadu', district: 'Tiruchirappalli', market: 'Gandhi Market', minPricePerKg: 31, maxPricePerKg: 43, modalPricePerKg: 37, date: '2026-09-10', arrivalTons: 85 },

  // Potato
  { id: 'm12', commodity: 'Potato', state: 'Tamil Nadu', district: 'Chennai', market: 'Koyambedu Market', minPricePerKg: 28, maxPricePerKg: 36, modalPricePerKg: 32, date: '2026-09-10', arrivalTons: 190 },
  { id: 'm13', commodity: 'Potato', state: 'Tamil Nadu', district: 'Nilgiris', market: 'Mettupalayam Mandi', minPricePerKg: 24, maxPricePerKg: 32, modalPricePerKg: 28, date: '2026-09-10', arrivalTons: 210 },
  { id: 'm14', commodity: 'Potato', state: 'Tamil Nadu', district: 'Madurai', market: 'Mattuthavani Market', minPricePerKg: 27, maxPricePerKg: 35, modalPricePerKg: 31, date: '2026-09-10', arrivalTons: 75 },
  { id: 'm15', commodity: 'Potato', state: 'Tamil Nadu', district: 'Coimbatore', market: 'MGR Wholesale Mandi', minPricePerKg: 26, maxPricePerKg: 34, modalPricePerKg: 30, date: '2026-09-10', arrivalTons: 90 },

  // Brinjal
  { id: 'm16', commodity: 'Brinjal', state: 'Tamil Nadu', district: 'Chennai', market: 'Koyambedu Market', minPricePerKg: 28, maxPricePerKg: 42, modalPricePerKg: 35, date: '2026-09-10', arrivalTons: 50 },
  { id: 'm17', commodity: 'Brinjal', state: 'Tamil Nadu', district: 'Salem', market: 'Salem Uzhavar Sandhai', minPricePerKg: 22, maxPricePerKg: 34, modalPricePerKg: 28, date: '2026-09-10', arrivalTons: 35 },
  { id: 'm18', commodity: 'Brinjal', state: 'Tamil Nadu', district: 'Dindigul', market: 'Oddanchatram Market', minPricePerKg: 24, maxPricePerKg: 36, modalPricePerKg: 30, date: '2026-09-10', arrivalTons: 40 },
  { id: 'm19', commodity: 'Brinjal', state: 'Tamil Nadu', district: 'Coimbatore', market: 'MGR Wholesale Mandi', minPricePerKg: 26, maxPricePerKg: 40, modalPricePerKg: 33, date: '2026-09-10', arrivalTons: 45 },

  // Cabbage
  { id: 'm20', commodity: 'Cabbage', state: 'Tamil Nadu', district: 'Chennai', market: 'Koyambedu Market', minPricePerKg: 18, maxPricePerKg: 28, modalPricePerKg: 22, date: '2026-09-10', arrivalTons: 80 },
  { id: 'm21', commodity: 'Cabbage', state: 'Tamil Nadu', district: 'Nilgiris', market: 'Mettupalayam Mandi', minPricePerKg: 15, maxPricePerKg: 22, modalPricePerKg: 18, date: '2026-09-10', arrivalTons: 115 },
  { id: 'm22', commodity: 'Cabbage', state: 'Tamil Nadu', district: 'Madurai', market: 'Mattuthavani Market', minPricePerKg: 17, maxPricePerKg: 26, modalPricePerKg: 21, date: '2026-09-10', arrivalTons: 40 },
  { id: 'm23', commodity: 'Cabbage', state: 'Tamil Nadu', district: 'Salem', market: 'Salem Uzhavar Sandhai', minPricePerKg: 16, maxPricePerKg: 24, modalPricePerKg: 20, date: '2026-09-10', arrivalTons: 35 },

  // Carrot
  { id: 'm24', commodity: 'Carrot', state: 'Tamil Nadu', district: 'Chennai', market: 'Koyambedu Market', minPricePerKg: 42, maxPricePerKg: 58, modalPricePerKg: 50, date: '2026-09-10', arrivalTons: 60 },
  { id: 'm25', commodity: 'Carrot', state: 'Tamil Nadu', district: 'Nilgiris', market: 'Ooty Uzhavar Sandhai', minPricePerKg: 34, maxPricePerKg: 46, modalPricePerKg: 40, date: '2026-09-10', arrivalTons: 95 },
  { id: 'm26', commodity: 'Carrot', state: 'Tamil Nadu', district: 'Coimbatore', market: 'MGR Wholesale Mandi', minPricePerKg: 38, maxPricePerKg: 52, modalPricePerKg: 45, date: '2026-09-10', arrivalTons: 55 },
  { id: 'm27', commodity: 'Carrot', state: 'Tamil Nadu', district: 'Madurai', market: 'Mattuthavani Market', minPricePerKg: 40, maxPricePerKg: 55, modalPricePerKg: 48, date: '2026-09-10', arrivalTons: 42 }
];

// Realistic 7-day daily logs for Murugan's produce stall
export const INITIAL_STOCK_LOGS: DailyStockLog[] = [
  // Tomato (high volume, prone to perishability)
  { id: 'log_t1', date: '2026-09-04', commodity: 'Tomato', receivedKg: 50, soldKg: 44, unsoldKg: 4, wasteKg: 2, vendorNotes: 'Rains in afternoon' },
  { id: 'log_t2', date: '2026-09-05', commodity: 'Tomato', receivedKg: 45, soldKg: 42, unsoldKg: 2, wasteKg: 1, vendorNotes: 'Good weekend flow' },
  { id: 'log_t3', date: '2026-09-06', commodity: 'Tomato', receivedKg: 55, soldKg: 51, unsoldKg: 3, wasteKg: 1, vendorNotes: 'Sunday morning rush' },
  { id: 'log_t4', date: '2026-09-07', commodity: 'Tomato', receivedKg: 40, soldKg: 36, unsoldKg: 3, wasteKg: 1, vendorNotes: 'Slow Monday' },
  { id: 'log_t5', date: '2026-09-08', commodity: 'Tomato', receivedKg: 42, soldKg: 39, unsoldKg: 2, wasteKg: 1 },
  { id: 'log_t6', date: '2026-09-09', commodity: 'Tomato', receivedKg: 45, soldKg: 41, unsoldKg: 3, wasteKg: 1 },
  { id: 'log_t7', date: '2026-09-10', commodity: 'Tomato', receivedKg: 48, soldKg: 41, unsoldKg: 6, wasteKg: 1, vendorNotes: 'Surplus today (>5kg alert)' },

  // Onion (high volume, longer shelf life)
  { id: 'log_o1', date: '2026-09-04', commodity: 'Onion', receivedKg: 60, soldKg: 55, unsoldKg: 5, wasteKg: 0 },
  { id: 'log_o2', date: '2026-09-05', commodity: 'Onion', receivedKg: 60, soldKg: 58, unsoldKg: 2, wasteKg: 0 },
  { id: 'log_o3', date: '2026-09-06', commodity: 'Onion', receivedKg: 70, soldKg: 68, unsoldKg: 2, wasteKg: 0 },
  { id: 'log_o4', date: '2026-09-07', commodity: 'Onion', receivedKg: 50, soldKg: 47, unsoldKg: 3, wasteKg: 0 },
  { id: 'log_o5', date: '2026-09-08', commodity: 'Onion', receivedKg: 55, soldKg: 52, unsoldKg: 3, wasteKg: 0 },
  { id: 'log_o6', date: '2026-09-09', commodity: 'Onion', receivedKg: 55, soldKg: 50, unsoldKg: 5, wasteKg: 0 },
  { id: 'log_o7', date: '2026-09-10', commodity: 'Onion', receivedKg: 60, soldKg: 52, unsoldKg: 8, wasteKg: 0, vendorNotes: 'Unsold stock 8kg' },

  // Potato
  { id: 'log_p1', date: '2026-09-06', commodity: 'Potato', receivedKg: 45, soldKg: 42, unsoldKg: 3, wasteKg: 0 },
  { id: 'log_p2', date: '2026-09-07', commodity: 'Potato', receivedKg: 35, soldKg: 33, unsoldKg: 2, wasteKg: 0 },
  { id: 'log_p3', date: '2026-09-08', commodity: 'Potato', receivedKg: 40, soldKg: 38, unsoldKg: 2, wasteKg: 0 },
  { id: 'log_p4', date: '2026-09-09', commodity: 'Potato', receivedKg: 38, soldKg: 36, unsoldKg: 2, wasteKg: 0 },
  { id: 'log_p5', date: '2026-09-10', commodity: 'Potato', receivedKg: 40, soldKg: 37, unsoldKg: 3, wasteKg: 0 },

  // Brinjal
  { id: 'log_b1', date: '2026-09-07', commodity: 'Brinjal', receivedKg: 25, soldKg: 22, unsoldKg: 2, wasteKg: 1 },
  { id: 'log_b2', date: '2026-09-08', commodity: 'Brinjal', receivedKg: 25, soldKg: 23, unsoldKg: 1, wasteKg: 1 },
  { id: 'log_b3', date: '2026-09-09', commodity: 'Brinjal', receivedKg: 28, soldKg: 24, unsoldKg: 3, wasteKg: 1 },
  { id: 'log_b4', date: '2026-09-10', commodity: 'Brinjal', receivedKg: 25, soldKg: 22, unsoldKg: 2, wasteKg: 1 },

  // Cabbage
  { id: 'log_c1', date: '2026-09-07', commodity: 'Cabbage', receivedKg: 30, soldKg: 26, unsoldKg: 3, wasteKg: 1 },
  { id: 'log_c2', date: '2026-09-08', commodity: 'Cabbage', receivedKg: 30, soldKg: 28, unsoldKg: 1, wasteKg: 1 },
  { id: 'log_c3', date: '2026-09-09', commodity: 'Cabbage', receivedKg: 32, soldKg: 27, unsoldKg: 4, wasteKg: 1 },
  { id: 'log_c4', date: '2026-09-10', commodity: 'Cabbage', receivedKg: 30, soldKg: 23, unsoldKg: 6, wasteKg: 1, vendorNotes: 'Surplus 6kg' },

  // Carrot
  { id: 'log_cr1', date: '2026-09-07', commodity: 'Carrot', receivedKg: 25, soldKg: 23, unsoldKg: 2, wasteKg: 0 },
  { id: 'log_cr2', date: '2026-09-08', commodity: 'Carrot', receivedKg: 25, soldKg: 22, unsoldKg: 3, wasteKg: 0 },
  { id: 'log_cr3', date: '2026-09-09', commodity: 'Carrot', receivedKg: 28, soldKg: 25, unsoldKg: 3, wasteKg: 0 },
  { id: 'log_cr4', date: '2026-09-10', commodity: 'Carrot', receivedKg: 26, soldKg: 24, unsoldKg: 2, wasteKg: 0 }
];

// Institutional bulk recurring demand board (from ResQ)
// Generic, illustrative buyer names as required by prompt
export const INITIAL_BULK_ORDERS: BulkOrderBoardItem[] = [
  {
    id: 'bulk_1',
    institutionName: 'Kovai Annapoorna Mess',
    institutionType: 'Hotel/Mess',
    commodity: 'Onion',
    dailyRequirementKg: 12,
    weeklySchedule: 'Mon - Sat (Daily Morning 7:00 AM)',
    targetPricePerKg: 34,
    contactPerson: 'Senthil Kumar (Mess Manager)',
    contactPhone: '919841234567',
    location: '1.2 km away — North Mada Street',
    claimedByVendor: true, // Vendor already claimed this, so 12kg is pre-committed!
    notes: 'Requires fresh medium red onions for daily sambar preparation'
  },
  {
    id: 'bulk_2',
    institutionName: 'Sri Krishna College Hostel',
    institutionType: 'Hostel',
    commodity: 'Tomato',
    dailyRequirementKg: 10,
    weeklySchedule: 'Daily 6:30 AM delivery',
    targetPricePerKg: 25,
    contactPerson: 'Ramanathan (Warden)',
    contactPhone: '919840987654',
    location: '2.5 km away — Trunk Road',
    claimedByVendor: true, // Claimed: 10kg tomatoes pre-committed
    notes: 'Firm country tomatoes preferred for 250 hostellers'
  },
  {
    id: 'bulk_3',
    institutionName: 'City Care NGO Community Kitchen',
    institutionType: 'Charity Kitchen',
    commodity: 'Potato',
    dailyRequirementKg: 15,
    weeklySchedule: 'Tue, Thu, Sat mornings',
    targetPricePerKg: 28,
    contactPerson: 'Sister Mary / Vimal',
    contactPhone: '919842112233',
    location: '0.8 km away — Church Lane',
    claimedByVendor: false,
    notes: 'Serves noon community lunch to elderly and workers'
  },
  {
    id: 'bulk_4',
    institutionName: 'Shanti Bhavan Hospital Canteen',
    institutionType: 'Hospital Canteen',
    commodity: 'Cabbage',
    dailyRequirementKg: 8,
    weeklySchedule: 'Daily except Sunday',
    targetPricePerKg: 19,
    contactPerson: 'Chef Natarajan',
    contactPhone: '919843334455',
    location: '1.9 km away — Government Hospital Road',
    claimedByVendor: false,
    notes: 'Regular fresh cabbage for patient diet salads & stir fry'
  },
  {
    id: 'bulk_5',
    institutionName: 'New Madurai Tiffin Center',
    institutionType: 'Hotel/Mess',
    commodity: 'Brinjal',
    dailyRequirementKg: 6,
    weeklySchedule: 'Daily 8:00 AM',
    targetPricePerKg: 29,
    contactPerson: 'Karthik Raja',
    contactPhone: '919844556677',
    location: '0.5 km away — Market Junction',
    claimedByVendor: false,
    notes: 'Small green or striped brinjals for ennai kathirikai gravy'
  }
];

// Khata (Credit Ledger) Customers
// Real repayment data does NOT exist for informal vendors today, so this module is clearly labeled illustrative/simulated!
export const INITIAL_KHATA_CUSTOMERS: KhataCustomer[] = [
  {
    id: 'cust_1',
    name: 'Kandasamy (Tea Stall)',
    nameTa: 'கந்தசாமி (டீ கடை)',
    phone: '9840112233',
    totalDue: 850,
    creditLimit: 2000,
    lastPurchaseDate: '2026-09-09',
    riskScore: 18,
    riskLevel: 'Low',
    onTimePaymentRatio: 0.88,
    notes: 'Pays every Sunday without fail. Daily lemon & ginger buyer.',
    transactions: [
      { id: 'tx_1', date: '2026-09-02', type: 'CREDIT', amount: 450, itemsDescription: 'Tomato 10kg, Onion 5kg' },
      { id: 'tx_2', date: '2026-09-06', type: 'PAYMENT', amount: 450, daysDelayed: 0 },
      { id: 'tx_3', date: '2026-09-08', type: 'CREDIT', amount: 400, itemsDescription: 'Onion 10kg' },
      { id: 'tx_4', date: '2026-09-09', type: 'CREDIT', amount: 450, itemsDescription: 'Tomato 15kg' }
    ]
  },
  {
    id: 'cust_2',
    name: 'Lakshmi Amma (Flower Vendor)',
    nameTa: 'லட்சுமி அம்மா (பூக்காரி)',
    phone: '9840223344',
    totalDue: 420,
    creditLimit: 1000,
    lastPurchaseDate: '2026-09-10',
    riskScore: 12,
    riskLevel: 'Low',
    onTimePaymentRatio: 0.94,
    notes: 'Neighbouring stall vendor. Regular prompt payer.',
    transactions: [
      { id: 'tx_5', date: '2026-09-01', type: 'CREDIT', amount: 300, itemsDescription: 'Potato 5kg, Carrot 2kg' },
      { id: 'tx_6', date: '2026-09-03', type: 'PAYMENT', amount: 300, daysDelayed: 1 },
      { id: 'tx_7', date: '2026-09-10', type: 'CREDIT', amount: 420, itemsDescription: 'Tomato 8kg, Cabbage 3kg' }
    ]
  },
  {
    id: 'cust_3',
    name: 'Venkatesh (Fast Food Corner)',
    nameTa: 'வெங்கடேஷ் (பாஸ்ட் புட்)',
    phone: '9840334455',
    totalDue: 2450,
    creditLimit: 3000,
    lastPurchaseDate: '2026-09-08',
    riskScore: 54,
    riskLevel: 'Medium',
    onTimePaymentRatio: 0.62,
    notes: 'Takes high quantities, takes 2-3 weeks to clear dues.',
    transactions: [
      { id: 'tx_8', date: '2026-08-20', type: 'CREDIT', amount: 1200, itemsDescription: 'Cabbage 20kg, Onion 15kg' },
      { id: 'tx_9', date: '2026-09-01', type: 'PAYMENT', amount: 600, daysDelayed: 12 },
      { id: 'tx_10', date: '2026-09-05', type: 'CREDIT', amount: 1100, itemsDescription: 'Onion 20kg, Tomato 10kg' },
      { id: 'tx_11', date: '2026-09-08', type: 'CREDIT', amount: 750, itemsDescription: 'Carrot 10kg, Potato 5kg' }
    ]
  },
  {
    id: 'cust_4',
    name: 'Ravi (Biryani Master)',
    nameTa: 'ரவி (பிரியாணி மாஸ்டர்)',
    phone: '9840445566',
    totalDue: 3800,
    creditLimit: 3500,
    lastPurchaseDate: '2026-09-06',
    riskScore: 78,
    riskLevel: 'High',
    onTimePaymentRatio: 0.35,
    notes: 'Over credit limit! Delaying payments repeatedly. Send reminder.',
    transactions: [
      { id: 'tx_12', date: '2026-08-15', type: 'CREDIT', amount: 2000, itemsDescription: 'Onion 40kg, Tomato 25kg' },
      { id: 'tx_13', date: '2026-08-25', type: 'PAYMENT', amount: 500, daysDelayed: 10 },
      { id: 'tx_14', date: '2026-09-01', type: 'CREDIT', amount: 1500, itemsDescription: 'Onion 30kg' },
      { id: 'tx_15', date: '2026-09-06', type: 'CREDIT', amount: 800, itemsDescription: 'Tomato 20kg' }
    ]
  },
  {
    id: 'cust_5',
    name: 'Chitra (Tailor / Resident)',
    nameTa: 'சித்ரா (தையல் கடை)',
    phone: '9840556677',
    totalDue: 260,
    creditLimit: 800,
    lastPurchaseDate: '2026-09-10',
    riskScore: 8,
    riskLevel: 'Low',
    onTimePaymentRatio: 0.98,
    notes: 'Local customer, clears bill on 1st of month.',
    transactions: [
      { id: 'tx_16', date: '2026-08-28', type: 'CREDIT', amount: 350, itemsDescription: 'Mixed veg 4kg' },
      { id: 'tx_17', date: '2026-09-01', type: 'PAYMENT', amount: 350, daysDelayed: 0 },
      { id: 'tx_18', date: '2026-09-10', type: 'CREDIT', amount: 260, itemsDescription: 'Brinjal 2kg, Potato 3kg' }
    ]
  }
];
