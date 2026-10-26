/**
 * Supabase Service for SanthAI
 * 
 * Provides:
 * 1. Supabase Client initialization using VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
 * 2. Google OAuth via Supabase Authentication (prototype-only convenience)
 * 3. PostgreSQL persistence for Stock, Khata, and ResQ modules
 * 4. Graceful offline-first fallback with localStorage when credentials are not yet set
 * 
 * PostgreSQL Schema (Run in Supabase SQL Editor):
 * -------------------------------------------------------------
 * -- 1. Vendor Profiles Table
 * CREATE TABLE IF NOT EXISTS vendor_profiles (
 *   id TEXT PRIMARY KEY,
 *   name TEXT NOT NULL,
 *   phone TEXT,
 *   email TEXT,
 *   market_name TEXT,
 *   stall_number TEXT,
 *   closing_time_str TEXT,
 *   market_closing_hour NUMERIC,
 *   upi_id TEXT,
 *   updated_at TIMESTAMPTZ DEFAULT NOW()
 * );
 * 
 * -- 2. Daily Stock, Sales & Wastage Logs
 * CREATE TABLE IF NOT EXISTS stock_logs (
 *   id TEXT PRIMARY KEY,
 *   vendor_id TEXT NOT NULL REFERENCES vendor_profiles(id) ON DELETE CASCADE,
 *   date DATE NOT NULL,
 *   commodity TEXT NOT NULL,
 *   received_kg NUMERIC NOT NULL,
 *   sold_kg NUMERIC NOT NULL,
 *   unsold_kg NUMERIC NOT NULL,
 *   waste_kg NUMERIC NOT NULL,
 *   vendor_notes TEXT,
 *   created_at TIMESTAMPTZ DEFAULT NOW()
 * );
 * 
 * -- 3. Digital Khata Customer Ledger Accounts
 * CREATE TABLE IF NOT EXISTS khata_customers (
 *   id TEXT PRIMARY KEY,
 *   vendor_id TEXT NOT NULL REFERENCES vendor_profiles(id) ON DELETE CASCADE,
 *   name TEXT NOT NULL,
 *   name_ta TEXT,
 *   phone TEXT NOT NULL,
 *   total_due NUMERIC DEFAULT 0,
 *   credit_limit NUMERIC DEFAULT 3000,
 *   risk_score NUMERIC DEFAULT 25,
 *   risk_level TEXT DEFAULT 'Low',
 *   on_time_ratio NUMERIC DEFAULT 0.85,
 *   notes TEXT,
 *   transactions JSONB DEFAULT '[]'::jsonb,
 *   updated_at TIMESTAMPTZ DEFAULT NOW()
 * );
 * 
 * -- 4. ResQ Zero-Waste Surplus Clearance Listings
 * CREATE TABLE IF NOT EXISTS resq_listings (
 *   id TEXT PRIMARY KEY,
 *   vendor_id TEXT NOT NULL REFERENCES vendor_profiles(id) ON DELETE CASCADE,
 *   commodity TEXT NOT NULL,
 *   lot_code TEXT,
 *   initial_kg NUMERIC NOT NULL,
 *   remaining_kg NUMERIC NOT NULL,
 *   original_price NUMERIC NOT NULL,
 *   discounted_price NUMERIC NOT NULL,
 *   status TEXT DEFAULT 'active',
 *   expires_at TIMESTAMPTZ,
 *   created_at TIMESTAMPTZ DEFAULT NOW()
 * );
 * 
 * -- 5. Mandi Wholesale Arrival & Modal Rates Cache
 * CREATE TABLE IF NOT EXISTS mandi_price_records (
 *   id TEXT PRIMARY KEY,
 *   date DATE NOT NULL,
 *   state TEXT NOT NULL DEFAULT 'Tamil Nadu',
 *   district TEXT NOT NULL,
 *   market TEXT NOT NULL,
 *   commodity TEXT NOT NULL,
 *   min_price_per_kg NUMERIC NOT NULL CHECK (min_price_per_kg >= 0),
 *   max_price_per_kg NUMERIC NOT NULL CHECK (max_price_per_kg >= min_price_per_kg),
 *   modal_price_per_kg NUMERIC NOT NULL CHECK (modal_price_per_kg >= 0),
 *   arrival_tons NUMERIC DEFAULT 0,
 *   created_at TIMESTAMPTZ DEFAULT NOW()
 * );
 * 
 * -- 6. Bulk Institutional Order Board (B2B Recurring Demand)
 * CREATE TABLE IF NOT EXISTS bulk_order_board (
 *   id TEXT PRIMARY KEY,
 *   vendor_id TEXT REFERENCES vendor_profiles(id) ON DELETE SET NULL,
 *   institution_name TEXT NOT NULL,
 *   institution_type TEXT NOT NULL,
 *   commodity TEXT NOT NULL,
 *   daily_requirement_kg NUMERIC NOT NULL CHECK (daily_requirement_kg > 0),
 *   weekly_schedule TEXT DEFAULT 'Daily',
 *   target_price_per_kg NUMERIC NOT NULL,
 *   contact_person TEXT,
 *   contact_phone TEXT NOT NULL,
 *   location TEXT,
 *   claimed_by_vendor BOOLEAN DEFAULT FALSE,
 *   notes TEXT,
 *   created_at TIMESTAMPTZ DEFAULT NOW()
 * );
 * 
 * -- 7. Empirical Field-Collected Vendor Surveys ("Counted, Not Sourced")
 * CREATE TABLE IF NOT EXISTS field_vendor_surveys (
 *   id TEXT PRIMARY KEY,
 *   vendor_name TEXT NOT NULL,
 *   stall_type TEXT NOT NULL,
 *   location TEXT NOT NULL,
 *   survey_date DATE NOT NULL,
 *   commodity TEXT NOT NULL,
 *   retail_price_per_kg NUMERIC NOT NULL,
 *   notes TEXT,
 *   created_at TIMESTAMPTZ DEFAULT NOW()
 * );
 * 
 * -- Row Level Security (RLS) Policies
 * ALTER TABLE vendor_profiles ENABLE ROW LEVEL SECURITY;
 * ALTER TABLE stock_logs ENABLE ROW LEVEL SECURITY;
 * ALTER TABLE khata_customers ENABLE ROW LEVEL SECURITY;
 * ALTER TABLE resq_listings ENABLE ROW LEVEL SECURITY;
 * ALTER TABLE bulk_order_board ENABLE ROW LEVEL SECURITY;
 * -------------------------------------------------------------
 */

import { createClient, SupabaseClient, User as SupabaseUser } from '@supabase/supabase-js';
import {
  VendorProfile,
  DailyStockLog,
  KhataCustomer,
  ResQLotItem
} from '../types';

const supabaseUrl = typeof import.meta !== 'undefined' ? import.meta.env?.VITE_SUPABASE_URL : '';
const supabaseAnonKey = typeof import.meta !== 'undefined' ? import.meta.env?.VITE_SUPABASE_ANON_KEY : '';

export let supabase: SupabaseClient | null = null;

if (supabaseUrl && supabaseAnonKey && supabaseUrl.startsWith('http')) {
  try {
    supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      }
    });
  } catch (err) {
    console.warn('[SanthAI Supabase] Could not initialize client:', err);
    supabase = null;
  }
}

export class SupabaseService {
  /**
   * Check if Supabase environment variables are configured in the hosting environment
   */
  public static isConfigured(): boolean {
    return Boolean(supabase);
  }

  /**
   * Google OAuth Sign-in via Supabase
   */
  public static async signInWithGoogle(): Promise<{ success: boolean; error?: string }> {
    if (!supabase) {
      return { success: false, error: 'Supabase credentials not configured in environment settings' };
    }
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: typeof window !== 'undefined' ? window.location.origin : undefined
        }
      });
      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Supabase Google OAuth failed' };
    }
  }

  /**
   * Sign out of Supabase Auth
   */
  public static async signOut(): Promise<void> {
    if (supabase) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.warn('Supabase sign-out error:', err);
      }
    }
  }

  /**
   * Current Supabase user if logged in
   */
  public static async getCurrentUser(): Promise<SupabaseUser | null> {
    if (!supabase) return null;
    try {
      const { data } = await supabase.auth.getUser();
      return data?.user || null;
    } catch {
      return null;
    }
  }

  // ==========================================
  // STOCK MODULE PERSISTENCE (PostgreSQL)
  // ==========================================

  public static async saveStockLogs(vendorId: string, logs: DailyStockLog[]): Promise<boolean> {
    if (!supabase || !vendorId) return false;
    try {
      const records = logs.map(l => ({
        id: l.id,
        vendor_id: vendorId,
        date: l.date,
        commodity: l.commodity,
        received_kg: l.receivedKg,
        sold_kg: l.soldKg,
        unsold_kg: l.unsoldKg,
        waste_kg: l.wasteKg,
        vendor_notes: l.vendorNotes || ''
      }));

      const { error } = await supabase
        .from('stock_logs')
        .upsert(records, { onConflict: 'id' });

      if (error) {
        console.warn('[Supabase saveStockLogs Error]:', error.message);
        return false;
      }
      return true;
    } catch (err) {
      console.warn('[Supabase saveStockLogs Exception]:', err);
      return false;
    }
  }

  public static async fetchStockLogs(vendorId: string): Promise<DailyStockLog[] | null> {
    if (!supabase || !vendorId) return null;
    try {
      const { data, error } = await supabase
        .from('stock_logs')
        .select('*')
        .eq('vendor_id', vendorId)
        .order('date', { ascending: false });

      if (error || !data) return null;

      return data.map((row: any) => ({
        id: row.id,
        date: row.date,
        commodity: row.commodity,
        receivedKg: Number(row.received_kg),
        soldKg: Number(row.sold_kg),
        unsoldKg: Number(row.unsold_kg),
        wasteKg: Number(row.waste_kg),
        vendorNotes: row.vendor_notes
      }));
    } catch {
      return null;
    }
  }

  // ==========================================
  // KHATA MODULE PERSISTENCE (PostgreSQL)
  // ==========================================

  public static async saveKhataCustomers(vendorId: string, customers: KhataCustomer[]): Promise<boolean> {
    if (!supabase || !vendorId) return false;
    try {
      const records = customers.map(c => ({
        id: c.id,
        vendor_id: vendorId,
        name: c.name,
        name_ta: c.nameTa || '',
        phone: c.phone,
        total_due: c.totalDue,
        credit_limit: c.creditLimit,
        risk_score: c.riskScore,
        risk_level: c.riskLevel,
        on_time_ratio: c.onTimePaymentRatio,
        notes: c.notes || '',
        transactions: c.transactions,
        updated_at: new Date().toISOString()
      }));

      const { error } = await supabase
        .from('khata_customers')
        .upsert(records, { onConflict: 'id' });

      if (error) {
        console.warn('[Supabase saveKhataCustomers Error]:', error.message);
        return false;
      }
      return true;
    } catch (err) {
      console.warn('[Supabase saveKhataCustomers Exception]:', err);
      return false;
    }
  }

  public static async fetchKhataCustomers(vendorId: string): Promise<KhataCustomer[] | null> {
    if (!supabase || !vendorId) return null;
    try {
      const { data, error } = await supabase
        .from('khata_customers')
        .select('*')
        .eq('vendor_id', vendorId);

      if (error || !data) return null;

      return data.map((row: any) => ({
        id: row.id,
        name: row.name,
        nameTa: row.name_ta || undefined,
        phone: row.phone,
        totalDue: Number(row.total_due),
        creditLimit: Number(row.credit_limit),
        lastPurchaseDate: row.last_purchase_date || new Date().toISOString().split('T')[0],
        riskScore: Number(row.risk_score),
        riskLevel: row.risk_level,
        onTimePaymentRatio: Number(row.on_time_ratio),
        notes: row.notes,
        transactions: Array.isArray(row.transactions) ? row.transactions : []
      }));
    } catch {
      return null;
    }
  }

  // ==========================================
  // RESQ MODULE PERSISTENCE (PostgreSQL)
  // ==========================================

  public static async saveResqLots(vendorId: string, lots: ResQLotItem[]): Promise<boolean> {
    if (!supabase || !vendorId) return false;
    try {
      const records = lots.map(l => ({
        id: l.id,
        vendor_id: vendorId,
        commodity: l.commodity,
        vendor_name: l.vendorName,
        vendor_stall: l.vendorStall,
        vendor_phone: l.vendorPhone,
        vendor_vpa: l.vendorVpa,
        unsold_kg: l.unsoldKg,
        normal_price_per_kg: l.normalPricePerKg,
        suggested_markdown_price: l.suggestedMarkdownPrice,
        discount_percent: l.discountPercent,
        status: l.status,
        market_closes_at: l.marketClosesAt,
        potential_saved_rupees: l.potentialSavedRupees,
        created_at: new Date(l.createdAt || Date.now()).toISOString()
      }));

      const { error } = await supabase
        .from('resq_listings')
        .upsert(records, { onConflict: 'id' });

      if (error) {
        console.warn('[Supabase saveResqLots Error]:', error.message);
        return false;
      }
      return true;
    } catch (err) {
      console.warn('[Supabase saveResqLots Exception]:', err);
      return false;
    }
  }

  public static async fetchResqLots(vendorId: string): Promise<ResQLotItem[] | null> {
    if (!supabase || !vendorId) return null;
    try {
      const { data, error } = await supabase
        .from('resq_listings')
        .select('*')
        .eq('vendor_id', vendorId);

      if (error || !data) return null;

      return data.map((row: any) => ({
        id: row.id,
        commodity: row.commodity,
        vendorName: row.vendor_name || 'Stall Vendor',
        vendorStall: row.vendor_stall || '#1',
        vendorPhone: row.vendor_phone || '',
        vendorVpa: row.vendor_vpa || '',
        unsoldKg: Number(row.unsold_kg),
        normalPricePerKg: Number(row.normal_price_per_kg),
        suggestedMarkdownPrice: Number(row.suggested_markdown_price),
        discountPercent: Number(row.discount_percent),
        status: row.status || 'available',
        marketClosesAt: row.market_closes_at || '19:30',
        potentialSavedRupees: Number(row.potential_saved_rupees),
        createdAt: row.created_at ? new Date(row.created_at).getTime() : Date.now()
      }));
    } catch {
      return null;
    }
  }

  // ==========================================
  // FULL VENDOR DATA SYNC
  // ==========================================

  public static async syncAllVendorData(
    vendorId: string,
    data: {
      profile?: VendorProfile;
      stockLogs?: DailyStockLog[];
      khataCustomers?: KhataCustomer[];
      resqLots?: ResQLotItem[];
    }
  ): Promise<{ success: boolean; syncedItems: string[] }> {
    if (!supabase || !vendorId) {
      return { success: false, syncedItems: [] };
    }

    const synced: string[] = [];

    if (data.profile) {
      try {
        await supabase.from('vendor_profiles').upsert({
          id: vendorId,
          name: data.profile.name,
          phone: data.profile.phone,
          email: data.profile.email,
          market_name: data.profile.marketName,
          stall_number: data.profile.stallNumber,
          closing_time_str: data.profile.closingTimeStr,
          market_closing_hour: data.profile.marketClosingHour,
          upi_id: data.profile.upiId,
          updated_at: new Date().toISOString()
        }, { onConflict: 'id' });
        synced.push('profile');
      } catch (e) {
        console.warn('Profile sync error:', e);
      }
    }

    if (data.stockLogs && data.stockLogs.length > 0) {
      const ok = await this.saveStockLogs(vendorId, data.stockLogs);
      if (ok) synced.push('stock');
    }

    if (data.khataCustomers && data.khataCustomers.length > 0) {
      const ok = await this.saveKhataCustomers(vendorId, data.khataCustomers);
      if (ok) synced.push('khata');
    }

    if (data.resqLots && data.resqLots.length > 0) {
      const ok = await this.saveResqLots(vendorId, data.resqLots);
      if (ok) synced.push('resq');
    }

    return { success: synced.length > 0, syncedItems: synced };
  }
}
