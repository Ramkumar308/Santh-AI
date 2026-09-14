import React, { useState, useRef } from 'react';
import { KhataCustomer, DailyStockLog, VendorProfile, Language } from '../types';
import { DataBackupService } from '../services/dataBackup';
import { SoundEffects } from '../utils/audioHaptics';
import {
  ShieldCheck,
  Download,
  Upload,
  FileSpreadsheet,
  FileText,
  AlertCircle,
  CheckCircle2,
  X,
  HardDrive,
  RefreshCw,
  Lock
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface DataVaultModalProps {
  isOpen?: boolean;
  vendorProfile: VendorProfile;
  customers: KhataCustomer[];
  logs: DailyStockLog[];
  vendorPrices: Record<string, number>;
  onRestore: (
    profile: VendorProfile,
    customers: KhataCustomer[],
    logs: DailyStockLog[],
    prices: Record<string, number>
  ) => void;
  lang: Language;
  onClose: () => void;
}

export const DataVaultModal: React.FC<DataVaultModalProps> = ({
  isOpen = true,
  vendorProfile,
  customers: khataCustomers,
  logs: stockLogs,
  vendorPrices,
  onRestore: onRestoreBackup,
  lang,
  onClose
}) => {
  if (!isOpen) return null;

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const storageInfo = DataBackupService.getStorageHealth();

  const handleExportJSON = () => {
    try {
      SoundEffects.playSuccess();
      DataBackupService.exportCompleteBackup(vendorProfile, khataCustomers, stockLogs, vendorPrices);
      confetti({ particleCount: 40, spread: 60, origin: { y: 0.7 } });
      setSuccessMessage(
        lang === 'ta'
          ? 'முழு தரவு கோப்பு வெற்றிகரமாக பதிவிறக்கம் செய்யப்பட்டது!'
          : 'Full stall backup JSON successfully downloaded to your device!'
      );
      setErrorMessage(null);
    } catch {
      setErrorMessage('Export failed. Please check browser permissions.');
    }
  };

  const handleExportKhataCSV = () => {
    SoundEffects.playClick();
    DataBackupService.exportKhataCSV(khataCustomers);
    setSuccessMessage(
      lang === 'ta'
        ? 'கடன் கணக்கு CSV கோப்பு பதிவிறக்கம் செய்யப்பட்டது (Excel இல் திறக்கலாம்).'
        : 'Khata ledger exported as CSV (Ready for Excel / Sheets).'
    );
  };

  const handleExportStockCSV = () => {
    SoundEffects.playClick();
    DataBackupService.exportStockCSV(stockLogs);
    setSuccessMessage(
      lang === 'ta'
        ? 'சரக்கு இருப்பு அறிக்கை CSV கோப்பாக சேமிக்கப்பட்டது.'
        : 'Stock history logs exported as CSV.'
    );
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const backup = DataBackupService.parseBackupJSON(content);
        
        // Execute restore
        onRestoreBackup(
          backup.vendorProfile || vendorProfile,
          backup.khataCustomers,
          backup.stockLogs,
          backup.vendorPrices || vendorPrices
        );

        SoundEffects.playSuccess();
        confetti({ particleCount: 70, spread: 80, origin: { y: 0.6 } });
        setSuccessMessage(
          lang === 'ta'
            ? `வெற்றிகரமாக மீட்கப்பட்டது! (${backup.khataCustomers.length} வாடிக்கையாளர்கள், ${backup.stockLogs.length} சரக்கு பதிவுகள்)`
            : `Backup restored successfully! (${backup.khataCustomers.length} customers, ${backup.stockLogs.length} logs restored)`
        );
        setErrorMessage(null);
      } catch (err: unknown) {
        const error = err as Error;
        SoundEffects.playWarning();
        setErrorMessage(error.message || 'Invalid backup file');
        setSuccessMessage(null);
      }
    };
    reader.readAsText(file);
    // reset input
    e.target.value = '';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full border border-slate-200 overflow-hidden my-auto">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold font-heading">
                {lang === 'ta' ? 'பாதுகாப்பு & தரவு காப்பு மையம்' : 'Data Vault & Storage Protection'}
              </h2>
              <p className="text-xs text-slate-400">
                {lang === 'ta' ? 'உள்ளூர் பதிவுகளை பதிவிறக்கம் & மீட்டெடுப்பு' : 'Prevent browser data loss with offline backups'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 text-sm text-slate-700 max-h-[80vh] overflow-y-auto">
          {/* Storage Health Pill */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                <HardDrive className="w-5 h-5" />
              </div>
              <div>
                <div className="font-bold text-slate-900 text-xs">
                  {lang === 'ta' ? 'உள்ளூர் சாதன சேமிப்பு நிலை' : 'Device Storage Status'}
                </div>
                <div className="text-[11px] text-slate-500">
                  {khataCustomers.length} {lang === 'ta' ? 'கடன் கணக்குகள்' : 'Khata accounts'} • {stockLogs.length} {lang === 'ta' ? 'சரக்கு பதிவுகள்' : 'Stock logs'}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {lang === 'ta' ? 'பாதுகாப்பானது' : 'Secure & Active'}
              </span>
            </div>
          </div>

          {/* Feedback Banners */}
          {successMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-xs flex items-center gap-2 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-900 rounded-xl text-xs flex items-center gap-2 animate-fadeIn">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Section 1: Complete Backup Download & Restore */}
          <div className="space-y-3">
            <div className="font-bold text-slate-900 text-xs uppercase tracking-wider">
              {lang === 'ta' ? '1. முழுமையான காப்புப் பிரதி (JSON கோப்பு)' : '1. Complete Stall Backup (JSON)'}
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              {lang === 'ta'
                ? 'உங்கள் மொபைல் பிரவுசர் வரலாறு அல்லது குக்கீகள் அழிக்கப்பட்டாலும் உங்கள் கணக்குகள் அழியாமல் இருக்க, இந்த கோப்பை சேமித்து வையுங்கள்.'
                : 'Protects your records against accidental browser cache clears, phone resets, or browser updates.'}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <button
                onClick={handleExportJSON}
                className="p-3.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold rounded-2xl flex items-center justify-center gap-2 shadow-xs transition-colors text-xs"
              >
                <Download className="w-4 h-4" />
                <span>{lang === 'ta' ? 'முழு காப்பு பிரதி பதிவிறக்கு' : 'Download Full Backup'}</span>
              </button>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-3.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-2xl flex items-center justify-center gap-2 transition-colors text-xs border border-slate-200"
              >
                <Upload className="w-4 h-4 text-indigo-600" />
                <span>{lang === 'ta' ? 'காப்பு கோப்பிலிருந்து மீட்டெடு' : 'Restore from Backup'}</span>
              </button>
              <input
                type="file"
                ref={fileInputRef}
                accept=".json"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
          </div>

          {/* Section 2: CSV Exports for Excel / Accounting */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <div className="font-bold text-slate-900 text-xs uppercase tracking-wider">
              {lang === 'ta' ? '2. கணக்கு அறிக்கை ஏற்றுமதி (Excel / CSV)' : '2. Accounting & Tax Exports (CSV)'}
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              {lang === 'ta'
                ? 'உங்கள் கடன் கணக்கு மற்றும் சரக்கு விபரங்களை எக்செல் அல்லது கணக்காளர் தாளில் திறந்து பார்க்க பதிவிறக்கவும்.'
                : 'Export clean spreadsheets for audits, personal accounts, or sharing with an accountant.'}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <button
                onClick={handleExportKhataCSV}
                className="p-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-2xl flex items-center gap-2.5 text-slate-800 font-semibold text-xs transition-colors"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" />
                <div className="text-left">
                  <div className="font-bold">{lang === 'ta' ? 'கடன் கணக்கு CSV' : 'Khata Ledger CSV'}</div>
                  <div className="text-[10px] text-slate-400">{khataCustomers.length} accounts</div>
                </div>
              </button>

              <button
                onClick={handleExportStockCSV}
                className="p-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-2xl flex items-center gap-2.5 text-slate-800 font-semibold text-xs transition-colors"
              >
                <FileText className="w-4 h-4 text-indigo-600 shrink-0" />
                <div className="text-left">
                  <div className="font-bold">{lang === 'ta' ? 'சரக்கு இருப்பு CSV' : 'Stock Activity CSV'}</div>
                  <div className="text-[10px] text-slate-400">{stockLogs.length} logs recorded</div>
                </div>
              </button>
            </div>
          </div>

          {/* Privacy Guarantee Note */}
          <div className="bg-emerald-50/70 border border-emerald-200/60 rounded-2xl p-3.5 flex items-center gap-2.5 text-xs text-emerald-900">
            <Lock className="w-4 h-4 text-emerald-600 shrink-0" />
            <p className="text-[11px] leading-relaxed">
              {lang === 'ta'
                ? 'உங்கள் வணிகத் தரவு முற்றிலும் உங்கள் சாதனத்தில் மட்டுமே சேமிக்கப்படுகிறது. வெளி நபர்களுக்கோ விளம்பர நிறுவனங்களுக்கோ இது பகிரப்படாது.'
                : 'Zero-cloud snooping: All records are strictly stored on your own physical device under your absolute ownership.'}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 text-white rounded-xl font-bold text-xs hover:bg-slate-800 transition-colors"
          >
            {lang === 'ta' ? 'மூடுக' : 'Done'}
          </button>
        </div>
      </div>
    </div>
  );
};
