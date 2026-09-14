import React, { useState } from 'react';
import { VendorProfile, Language } from '../types';
import { AuthService } from '../services/auth';
import { t } from '../utils/i18n';
import { Store, User, Phone, MapPin, CreditCard, LogOut, CheckCircle, ShieldCheck } from 'lucide-react';

interface VendorAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  vendorProfile: VendorProfile;
  onUpdateProfile: (profile: VendorProfile) => void;
  lang: Language;
}

export const VendorAuthModal: React.FC<VendorAuthModalProps> = ({
  isOpen,
  onClose,
  vendorProfile,
  onUpdateProfile,
  lang
}) => {
  const [name, setName] = useState(vendorProfile.name);
  const [phone, setPhone] = useState(vendorProfile.phone);
  const [marketName, setMarketName] = useState(vendorProfile.marketName);
  const [stallNumber, setStallNumber] = useState(vendorProfile.stallNumber);
  const [upiId, setUpiId] = useState(vendorProfile.upiId);
  const [closingTimeStr, setClosingTimeStr] = useState(vendorProfile.closingTimeStr);
  const [isSigningIn, setIsSigningIn] = useState(false);

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    setIsSigningIn(true);
    const res = await AuthService.signInWithGoogle();
    setIsSigningIn(false);
    if (res.success) {
      const updated = AuthService.getCurrentProfile();
      onUpdateProfile(updated);
      onClose();
    }
  };

  const handleSaveProfile = (e: React.FormEvent) => {
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
    onUpdateProfile(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-xl border border-slate-200 animate-in fade-in">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-sm">
              🌱
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                {t(lang, 'vendorPortal')}
              </h3>
              <p className="text-[11px] text-slate-500">Stall Identity & Prototype Auth</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600"
          >
            ✕
          </button>
        </div>

        {/* Prototype Notice */}
        <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/80 my-4 text-xs text-slate-600 space-y-1">
          <p className="font-semibold text-slate-800 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Prototype Google Sign-In & Supabase Auth</span>
          </p>
          <p className="text-[11px] text-slate-500 leading-normal">
            {t(lang, 'whatsappBotNotice')}
          </p>
        </div>

        {/* Google Sign In Button */}
        <button
          onClick={handleGoogleSignIn}
          disabled={isSigningIn}
          className="w-full py-2.5 px-4 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-colors mb-4"
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
          <span>{isSigningIn ? 'Connecting...' : `${t(lang, 'loginGoogle')} (Supabase)`}</span>
        </button>

        {/* Vendor Stall Configuration Form */}
        <form onSubmit={handleSaveProfile} className="space-y-3 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Vendor / Owner Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full py-2 px-3 border border-slate-200 rounded-xl"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Stall Number</label>
              <input
                type="text"
                value={stallNumber}
                onChange={e => setStallNumber(e.target.value)}
                className="w-full py-2 px-3 border border-slate-200 rounded-xl"
                required
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Market Closing Time</label>
              <input
                type="time"
                value={closingTimeStr}
                onChange={e => setClosingTimeStr(e.target.value)}
                className="w-full py-2 px-3 border border-slate-200 rounded-xl font-mono"
                required
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Market Location / Name</label>
            <input
              type="text"
              value={marketName}
              onChange={e => setMarketName(e.target.value)}
              className="w-full py-2 px-3 border border-slate-200 rounded-xl"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Phone (WhatsApp)</label>
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="w-full py-2 px-3 border border-slate-200 rounded-xl"
                required
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">UPI ID (Khata Collections)</label>
              <input
                type="text"
                value={upiId}
                onChange={e => setUpiId(e.target.value)}
                className="w-full py-2 px-3 border border-slate-200 rounded-xl font-mono"
                required
              />
            </div>
          </div>

          <div className="flex justify-between items-center pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={async () => {
                await AuthService.signOut();
                onUpdateProfile(AuthService.getCurrentProfile());
                onClose();
              }}
              className="text-slate-500 hover:text-slate-700 text-xs font-semibold flex items-center gap-1"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{t(lang, 'logout')}</span>
            </button>

            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl font-bold bg-emerald-600 text-white shadow-xs hover:bg-emerald-700"
            >
              Save Details
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
