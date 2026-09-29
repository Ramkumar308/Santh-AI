import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { VendorProfile } from '../types';
import { DEFAULT_VENDOR } from '../data/commodities';
import { FirebaseService, auth } from './firebase';
import { User, NextOrObserver, Unsubscribe } from 'firebase/auth';

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

  public static isFirebaseAuthenticated(): boolean {
    return Boolean(auth.currentUser);
  }

  public static getFirebaseUser(): User | null {
    return auth.currentUser;
  }

  public static onAuthStateChanged(observer: NextOrObserver<User>): Unsubscribe {
    return FirebaseService.onAuthStateChanged(observer);
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
      if (auth.currentUser) {
        FirebaseService.saveVendorProfile(auth.currentUser.uid, profile);
      }
    } catch (e) {
      console.warn('Failed to store vendor profile', e);
    }
  }

  public static async signInWithGoogle(): Promise<{ success: boolean; user?: User; error?: string }> {
    // 1. Firebase Google Auth
    try {
      const result = await FirebaseService.signInWithGoogle();
      if (result.success && result.user) {
        const user = result.user;
        const currentProfile = this.getCurrentProfile();
        const updatedProfile: VendorProfile = {
          ...currentProfile,
          id: user.uid,
          name: user.displayName || currentProfile.name,
          email: user.email || currentProfile.email,
          photoUrl: user.photoURL || undefined,
          photoURL: user.photoURL || undefined,
          isSimulatedAuth: false
        };
        this.saveProfile(updatedProfile);
        return { success: true, user };
      }
      if (result.error) {
        return { success: false, error: result.error };
      }
    } catch (err: any) {
      console.warn('[SanthAI Auth] Firebase Google Auth error:', err);
      return { success: false, error: err?.message || 'Google Auth Error' };
    }

    return { success: false, error: 'Sign-in incomplete' };
  }

  public static async signOut(): Promise<void> {
    await FirebaseService.signOutVendor();
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
