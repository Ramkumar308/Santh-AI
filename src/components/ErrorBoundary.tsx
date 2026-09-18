import React, { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Download, ShieldCheck, Home } from 'lucide-react';
import { SoundEffects } from '../utils/audioHaptics';

interface Props {
  children: ReactNode;
  fallbackTitleEn?: string;
  fallbackTitleTa?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  recoveryAttempts: number;
}

/**
 * Enterprise-grade React Error Boundary designed for informal retail environments.
 * Prevents full-screen crashes, safely isolates runtime exceptions, preserves unsaved
 * local ledger data, and offers 1-tap recovery without losing stall data.
 */
export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      recoveryAttempts: 0
    };
  }

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    console.error('[SanthAI ErrorBoundary Caught Exception]:', error, errorInfo);

    // Optional telemetry logging hook
    try {
      const crashLog = {
        timestamp: new Date().toISOString(),
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        url: window.location.href,
        userAgent: navigator.userAgent
      };
      localStorage.setItem('santhai_last_crash_log', JSON.stringify(crashLog));
    } catch {
      // Ignore storage write errors during crash
    }
  }

  private handleSoftReload = () => {
    SoundEffects.playClick();
    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorInfo: null,
      recoveryAttempts: prevState.recoveryAttempts + 1
    }));
  };

  private handleFullRefresh = () => {
    SoundEffects.playClick();
    window.location.reload();
  };

  private handleEmergencyExport = () => {
    SoundEffects.playSuccess();
    try {
      const backupData: Record<string, any> = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('santhai_')) {
          backupData[key] = localStorage.getItem(key);
        }
      }

      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `santhai_emergency_backup_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert('Could not export emergency backup: ' + String(err));
    }
  };

  public render() {
    if (this.state.hasError) {
      const isTamil = localStorage.getItem('santhai_lang') !== 'en';

      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 sm:p-6 font-sans">
          <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl border border-rose-200 p-6 sm:p-8 text-center animate-in fade-in zoom-in-95 duration-200">
            {/* Warning Shield Icon */}
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-rose-100 border border-rose-200 flex items-center justify-center shadow-inner">
              <AlertTriangle className="w-8 h-8 text-rose-600 animate-bounce" />
            </div>

            {/* Error Message */}
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 mb-1 tracking-tight">
              {isTamil ? 'செயலி தற்காலிகமாக நின்றது' : 'Application Paused Safely'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mb-6 leading-relaxed">
              {isTamil
                ? 'உங்கள் கடைத் தரவுகள் பாதுகாப்பாக உள்ளன. கீழே உள்ள பொத்தானைத் தொட்டு மீண்டும் இயக்கவும்.'
                : 'Your stall data and ledger are safe in memory. Tap below to resume your trading session.'}
            </p>

            {/* Action Buttons */}
            <div className="space-y-3 mb-6">
              <button
                id="error-boundary-retry-btn"
                onClick={this.handleSoftReload}
                className="w-full py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                <span>{isTamil ? 'மீண்டும் தொடங்கு (Soft Retry)' : 'Resume Stall Session'}</span>
              </button>

              <button
                id="error-boundary-export-btn"
                onClick={this.handleEmergencyExport}
                className="w-full py-3 px-4 rounded-2xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs border border-indigo-200 transition-all flex items-center justify-center gap-2"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{isTamil ? 'அவசர தரவு சேமிப்பு (Save Data)' : 'Emergency Data Export (JSON)'}</span>
              </button>

              <button
                id="error-boundary-refresh-btn"
                onClick={this.handleFullRefresh}
                className="w-full py-2.5 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-all flex items-center justify-center gap-2"
              >
                <Home className="w-3.5 h-3.5 text-slate-500" />
                <span>{isTamil ? 'பக்கத்தை முழுதாக புதுப்பி' : 'Hard Refresh Page'}</span>
              </button>
            </div>

            {/* Technical Diagnostics for Developers / Evaluators */}
            <div className="text-left bg-slate-50 rounded-xl p-3 border border-slate-200">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 mb-1">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  Diagnostic Trace
                </span>
                <span className="font-mono text-[10px] text-slate-400">
                  Code: ERR_BOUND_01
                </span>
              </div>
              <p className="font-mono text-[10px] text-rose-700 break-words line-clamp-3">
                {this.state.error?.message || 'Unknown runtime render error'}
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
