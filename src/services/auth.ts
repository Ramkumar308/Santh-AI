import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { VendorProfile } from '../types';
import { DEFAULT_VENDOR } from '../data/commodities';

const supabaseUrl = typeof import.meta !== 'undefined' ? import.meta.env?.VITE_SUPABASE_URL : '';
const supabaseAnonKey = typeof import.meta !== 'undefined' ? import.meta.env?.VITE_SUPABASE_ANON_KEY : '';

export let supabase: SupabaseClient | null = null;

if (supabaseUrl && supabaseAnonKey && supabaseUrl.startsWith('http')) {
  try {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
  } catch (err) {
    console.warn('[SanthAI Supabase] Failed to initialize Supabase client:', err);
    supabase = null;
  }
}

export class AuthService {
  private static STORAGE_KEY = 'santhai_active_vendor_profile';

  public static isSupabaseConfigured(): boolean {
    return Boolean(supabase);
  }

  public static getCurrentProfile(): VendorProfile {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Failed to parse stored vendor profile', e);
    }
    return DEFAULT_VENDOR;
  }

  public static saveProfile(profile: VendorProfile): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(profile));
    } catch (e) {
      console.warn('Failed to store vendor profile', e);
    }
  }

  public static async signInWithGoogle(): Promise<{ success: boolean; error?: string }> {
    if (supabase) {
      try {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: window.location.origin
          }
        });
        if (error) throw error;
        return { success: true };
      } catch (err: any) {
        console.warn('[SanthAI Auth] Supabase Google Auth error:', err);
        return { success: false, error: err?.message || 'Google Auth Error' };
      }
    } else {
      // Prototype Instant Login mode: Simulate signed in state with Google user metadata
      const simulatedGoogleVendor: VendorProfile = {
        id: 'google_vendor_01',
        name: 'Ramkumar K. S. (Market Vendor)',
        phone: '9840123456',
        marketName: 'Koyambedu Wholesale Market, Chennai',
        stallNumber: 'Shop B-42',
        upiId: 'ramkumar.veg@okaxis',
        closingTimeStr: '19:30',
        marketClosingHour: 19,
        email: 'ksramkumar2148@gmail.com',
        isSimulatedAuth: true
      };
      this.saveProfile(simulatedGoogleVendor);
      return { success: true };
    }
  }

  public static async signOut(): Promise<void> {
    if (supabase) {
      try {
        await supabase.auth.signOut();
      } catch (e) {
        console.warn(e);
      }
    }
    // Revert to default vendor profile
    this.saveProfile(DEFAULT_VENDOR);
  }
}
