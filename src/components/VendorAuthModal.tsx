import React, { useState } from 'react';
import { VendorProfile, Language } from '../types';
import { AuthService } from '../services/auth';
import { FirebaseService, auth } from '../services/firebase';
import { t } from '../utils/i18n';
import {
  Store,
  User,
  Phone,
  MapPin,
  CreditCard,
  LogOut,
  CheckCircle,
  ShieldCheck,
  Cloud,
  RefreshCw,
  Sparkles
} from 'lucide-react';

interface VendorAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  vendorProfile: VendorProfile;
  onUpdateProfile: (profile: VendorProfile) => void;
  lang: Language;
  onManualCloudSync?: () => Promise<void>;
  isCloudSyncing?: boolean;
}

export const VendorAuthModal: React.FC<VendorAuthModalProps> = ({
  isOpen,
  onClose,
  vendorProfile,
  onUpdateProfile,
  lang,
  onManualCloudSync,
  isCloudSyncing = false
}) => {
  const [name, setName] = useState(vendorProfile.name);
  const [phone, setPhone] = useState(vendorProfile.phone);
  const [marketName, setMarketName] = useState(vendorProfile.marketName);
  const [stallNumber, setStallNumber] = useState(vendorProfile.stallNumber);
  const [upiId, setUpiId] = useState(vendorProfile.upiId);
  const [closingTimeStr, setClosingTimeStr] = useState(vendorProfile.closingTimeStr);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentUser = auth.currentUser;
  const isGoogleConnected = Boolean(currentUser || vendorProfile.email);

  const handleGoogleSignIn = async () => {
    setIsSigningIn(true);
    setAuthError(null);
    const res = await AuthService.signInWithGoogle();
    setIsSigningIn(false);
    if (res.success) {
      const updated = AuthService.getCurrentProfile();
      onUpdateProfile(updated);
      if (onManualCloudSync) {
        await onManualCloudSync();
      }
      onClose();
    } else if (res.error && !res.error.includes('popup-closed-by-user')) {
      setAuthError(res.error);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const closingHour = parseInt(closingTimeStr.split(':')[0] || '19', 10);
    const updated: VendorProfile = {
      ...vendorProfile,
      name,
      phone,
      marketName,
      stallNumber,
      upiId,
      closingTimeStr,
      marketClosingHour: closingHour
    };
    AuthService.saveProfile(updated);
    if (currentUser) {
      await FirebaseService.saveVendorProfile(currentUser.uid, updated);
    }
    onUpdateProfile(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-xl border border-slate-200 animate-in fade-in max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-sm">
              🌱
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                {lang === 'ta' ? 'விற்பனையாளர் கணக்கு & கிளவுட் சேமிப்பு' : 'Vendor Account & Cloud Sync'}
              </h3>
              <p className="text-[11px] text-slate-500">Google Firebase Auth & Firestore Persistence</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600 hover:bg-slate-200 cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Authenticated State Banner */}
        {isGoogleConnected ? (
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 p-3.5 rounded-2xl border border-emerald-200/80 my-4 text-xs space-y-2">
            <div className="flex items-center gap-3">
              {currentUser?.photoURL || vendorProfile.photoURL || vendorProfile.photoUrl ? (
                <img
                  src={currentUser?.photoURL || vendorProfile.photoURL || vendorProfile.photoUrl}
                  alt="Avatar"
                  className="w-10 h-10 rounded-full border border-emerald-300 object-cover shadow-2xs"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-sm shadow-2xs">
                  {(vendorProfile.name || 'V')[0]}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-slate-900 truncate">
                    {currentUser?.displayName || vendorProfile.name}
                  </span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded-md border border-emerald-200">
                    Google Connected
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 truncate">
                  {currentUser?.email || vendorProfile.email}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-emerald-200/60 text-[11px] text-emerald-900">
              <span className="flex items-center gap-1">
                <Cloud className="w-3.5 h-3.5 text-emerald-600" />
                <span>Cloud Firestore: <strong>ai-studio-santhai</strong></span>
              </span>
              {onManualCloudSync && (
                <button
                  type="button"
                  onClick={onManualCloudSync}
                  disabled={isCloudSyncing}
                  className="flex items-center gap-1 text-emerald-700 hover:text-emerald-900 font-bold hover:underline cursor-pointer"
                >
                  <RefreshCw className={`w-3 h-3 ${isCloudSyncing ? 'animate-spin' : ''}`} />
                  <span>{isCloudSyncing ? 'Syncing...' : 'Sync Now'}</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          /* Google Sign In Callout */
          <div className="my-4 space-y-3">
            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/80 text-xs text-slate-600 space-y-1">
              <p className="font-semibold text-slate-800 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>{lang === 'ta' ? 'Google கணக்கில் இணைக்க' : 'Connect with Google'}</span>
              </p>
              <p className="text-[11px] text-slate-500 leading-normal">
                {lang === 'ta'
                  ? 'உங்கள் தினசரி சரக்கு விவரங்கள், விலைப்பட்டியல் மற்றும் வாடிக்கையாளர் கடன் கணக்குகளை கிளவுட் ஃபயர்ஸ்டோரில் பாதுகாப்பாக சேமிக்கவும்.'
                  : 'Securely sync your daily arrivals, prices, and Khata credit ledger to Google Cloud Firestore with automatic offline backup.'}
              </p>
            </div>

            {authError && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs">
                {authError}
              </div>
            )}

            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isSigningIn}
              className="w-full py-2.5 px-4 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{isSigningIn ? 'Connecting...' : lang === 'ta' ? 'Google வழியாக உள்நுழையவும்' : 'Sign in with Google'}</span>
            </button>
          </div>
        )}

        {/* Vendor Stall Configuration Form */}
        <form onSubmit={handleSaveProfile} className="space-y-3 text-xs border-t border-slate-100 pt-3">
          <div className="font-bold text-slate-800 text-[11px] uppercase tracking-wider flex items-center gap-1">
            <Store className="w-3.5 h-3.5 text-emerald-600" />
            <span>{lang === 'ta' ? 'கடை விவரங்கள்' : 'Stall Information'}</span>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              {lang === 'ta' ? 'விற்பனையாளர் பெயர்' : 'Vendor / Owner Name'}
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full py-2 px-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                {lang === 'ta' ? 'கடை எண்' : 'Stall Number'}
              </label>
              <input
                type="text"
                value={stallNumber}
                onChange={e => setStallNumber(e.target.value)}
                className="w-full py-2 px-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white"
                required
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                {lang === 'ta' ? 'சந்தை முடியும் நேரம்' : 'Market Closing Time'}
              </label>
              <input
                type="time"
                value={closingTimeStr}
                onChange={e => setClosingTimeStr(e.target.value)}
                className="w-full py-2 px-3 border border-slate-200 rounded-xl font-mono bg-slate-50 focus:bg-white"
                required
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              {lang === 'ta' ? 'சந்தை அமைவிடம்' : 'Market Location / Name'}
            </label>
            <input
              type="text"
              value={marketName}
              onChange={e => setMarketName(e.target.value)}
              className="w-full py-2 px-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                {lang === 'ta' ? 'வாட்ஸ்அப் எண்' : 'Phone (WhatsApp)'}
              </label>
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="w-full py-2 px-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white"
                required
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                {lang === 'ta' ? 'UPI ஐடி' : 'UPI ID (Payments)'}
              </label>
              <input
                type="text"
                value={upiId}
                onChange={e => setUpiId(e.target.value)}
                className="w-full py-2 px-3 border border-slate-200 rounded-xl font-mono bg-slate-50 focus:bg-white"
                required
              />
            </div>
          </div>

          <div className="flex justify-between items-center pt-3 border-t border-slate-100">
            {isGoogleConnected ? (
              <button
                type="button"
                onClick={async () => {
                  await AuthService.signOut();
                  onUpdateProfile(AuthService.getCurrentProfile());
                  onClose();
                }}
                className="text-rose-600 hover:text-rose-700 text-xs font-semibold flex items-center gap-1 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>{lang === 'ta' ? 'வெளியேறு' : 'Sign out'}</span>
              </button>
            ) : (
              <div />
            )}

            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl font-bold bg-emerald-600 text-white shadow-xs hover:bg-emerald-700 cursor-pointer"
            >
              {lang === 'ta' ? 'சேமிக்கவும்' : 'Save Details'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
