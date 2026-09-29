import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User,
  NextOrObserver
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  onSnapshot,
  Unsubscribe
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { VendorProfile, DailyStockLog, KhataCustomer, CommodityType } from '../types';

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Authentication
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Firestore instance
export const db = firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)'
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

export interface UserCloudData {
  profile?: VendorProfile;
  stockLogs?: DailyStockLog[];
  khataCustomers?: KhataCustomer[];
  vendorPrices?: Record<CommodityType, number>;
  updatedAt?: string;
  lastSyncedAt?: string;
}

export class FirebaseService {
  /**
   * Subscribe to Firebase Auth state changes
   */
  public static onAuthStateChanged(observer: NextOrObserver<User>): Unsubscribe {
    return onAuthStateChanged(auth, observer);
  }

  /**
   * Google Sign-in via Firebase popup
   */
  public static async signInWithGoogle(): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      return { success: true, user: result.user };
    } catch (err: any) {
      console.warn('[SanthAI Firebase Auth] Sign-in error:', err);
      return {
        success: false,
        error: err?.message || 'Google Sign-in failed. Please try again.'
      };
    }
  }

  /**
   * Log out vendor
   */
  public static async signOutVendor(): Promise<void> {
    try {
      await signOut(auth);
    } catch (err) {
      console.warn('[SanthAI Firebase Auth] Sign-out error:', err);
    }
  }

  /**
   * Sync vendor profile to Firestore
   */
  public static async saveVendorProfile(userId: string, profile: VendorProfile): Promise<void> {
    try {
      const userRef = doc(db, 'users', userId);
      await setDoc(userRef, { profile, updatedAt: new Date().toISOString() }, { merge: true });
    } catch (err) {
      console.warn('[SanthAI Firestore] Failed to save profile:', err);
    }
  }

  /**
   * Sync daily stock logs to Firestore
   */
  public static async syncStockLogs(userId: string, logs: DailyStockLog[]): Promise<void> {
    try {
      const userRef = doc(db, 'users', userId);
      await setDoc(userRef, { stockLogs: logs, lastStockSync: new Date().toISOString() }, { merge: true });
    } catch (err) {
      console.warn('[SanthAI Firestore] Failed to sync stock logs:', err);
    }
  }

  /**
   * Sync customer khata records to Firestore
   */
  public static async syncKhataCustomers(userId: string, customers: KhataCustomer[]): Promise<void> {
    try {
      const userRef = doc(db, 'users', userId);
      await setDoc(userRef, { khataCustomers: customers, lastKhataSync: new Date().toISOString() }, { merge: true });
    } catch (err) {
      console.warn('[SanthAI Firestore] Failed to sync khata customers:', err);
    }
  }

  /**
   * Sync vendor retail prices to Firestore
   */
  public static async syncVendorPrices(userId: string, prices: Record<CommodityType, number>): Promise<void> {
    try {
      const userRef = doc(db, 'users', userId);
      await setDoc(userRef, { vendorPrices: prices, lastPriceSync: new Date().toISOString() }, { merge: true });
    } catch (err) {
      console.warn('[SanthAI Firestore] Failed to sync vendor prices:', err);
    }
  }

  /**
   * Load entire cloud state for logged-in vendor
   */
  public static async loadUserData(userId: string): Promise<UserCloudData | null> {
    try {
      const userRef = doc(db, 'users', userId);
      const snapshot = await getDoc(userRef);
      if (snapshot.exists()) {
        return snapshot.data() as UserCloudData;
      }
      return null;
    } catch (err) {
      console.warn('[SanthAI Firestore] Failed to load user data:', err);
      return null;
    }
  }

  /**
   * Intelligently merges offline browser records into Cloud Firestore.
   * Ensures no duplicates are created while preserving the most recent edits.
   */
  public static async mergeOfflineDataToCloud(
    userId: string,
    localLogs: DailyStockLog[],
    localKhata: KhataCustomer[],
    localProfile: VendorProfile,
    localVendorPrices?: Record<CommodityType, number>
  ): Promise<UserCloudData> {
    try {
      const cloudData = await this.loadUserData(userId);

      // 1. Merge Stock Logs (keyed by id or commodity+date)
      const stockMap = new Map<string, DailyStockLog>();
      if (cloudData?.stockLogs && Array.isArray(cloudData.stockLogs)) {
        for (const log of cloudData.stockLogs) {
          const key = log.id || `${log.commodity}_${log.date}`;
          stockMap.set(key, log);
        }
      }
      for (const log of localLogs) {
        const key = log.id || `${log.commodity}_${log.date}`;
        stockMap.set(key, log);
      }
      const mergedLogs = Array.from(stockMap.values());

      // 2. Merge Khata Customers (keyed by phone or id)
      const customerMap = new Map<string, KhataCustomer>();
      if (cloudData?.khataCustomers && Array.isArray(cloudData.khataCustomers)) {
        for (const cust of cloudData.khataCustomers) {
          const key = cust.phone ? cust.phone.replace(/\D/g, '') : cust.id;
          customerMap.set(key, cust);
        }
      }
      for (const cust of localKhata) {
        const key = cust.phone ? cust.phone.replace(/\D/g, '') : cust.id;
        const existing = customerMap.get(key);
        if (existing) {
          // Merge transactions
          const txIds = new Set(existing.transactions?.map(t => t.id) || []);
          const mergedTx = [...(existing.transactions || [])];
          for (const tx of cust.transactions || []) {
            if (!txIds.has(tx.id)) {
              mergedTx.push(tx);
              txIds.add(tx.id);
            }
          }
          customerMap.set(key, {
            ...existing,
            totalDue: cust.totalDue,
            creditLimit: Math.max(existing.creditLimit, cust.creditLimit),
            transactions: mergedTx
          });
        } else {
          customerMap.set(key, cust);
        }
      }
      const mergedKhata = Array.from(customerMap.values());

      // 3. Merge Vendor Profile
      const mergedProfile: VendorProfile = {
        ...localProfile,
        ...(cloudData?.profile || {}),
        id: userId,
        name: auth.currentUser?.displayName || cloudData?.profile?.name || localProfile.name,
        email: auth.currentUser?.email || cloudData?.profile?.email || localProfile.email,
        photoURL: auth.currentUser?.photoURL || cloudData?.profile?.photoURL,
        isSimulatedAuth: false
      };

      // 4. Merge Vendor Retail Prices
      const mergedPrices = {
        ...(cloudData?.vendorPrices || {}),
        ...(localVendorPrices || {})
      } as Record<CommodityType, number>;

      const now = new Date().toISOString();
      const finalData: UserCloudData = {
        profile: mergedProfile,
        stockLogs: mergedLogs,
        khataCustomers: mergedKhata,
        vendorPrices: mergedPrices,
        updatedAt: now,
        lastSyncedAt: now
      };

      // Persist merged record back to Firestore
      const userRef = doc(db, 'users', userId);
      await setDoc(userRef, finalData, { merge: true });

      return finalData;
    } catch (err) {
      console.warn('[SanthAI Firestore] Error during offline merge:', err);
      return {
        profile: localProfile,
        stockLogs: localLogs,
        khataCustomers: localKhata,
        vendorPrices: localVendorPrices,
        lastSyncedAt: new Date().toISOString()
      };
    }
  }

  /**
   * Subscribe to real-time changes on the user's Firestore document
   */
  public static subscribeToUserCloudData(
    userId: string,
    onUpdate: (data: UserCloudData) => void
  ): Unsubscribe {
    const userRef = doc(db, 'users', userId);
    return onSnapshot(
      userRef,
      (snapshot) => {
        if (snapshot.exists()) {
          onUpdate(snapshot.data() as UserCloudData);
        }
      },
      (error) => {
        console.warn('[SanthAI Firestore] Cloud subscription error:', error);
      }
    );
  }
}
