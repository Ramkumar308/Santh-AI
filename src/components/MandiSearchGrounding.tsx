import React, { useState } from 'react';
import { Search, Globe, ExternalLink, RefreshCw, AlertCircle, TrendingUp, HelpCircle } from 'lucide-react';
import { Language } from '../types';

interface MandiSearchGroundingProps {
  lang: Language;
}

export const MandiSearchGrounding: React.FC<MandiSearchGroundingProps> = ({ lang }) => {
  const [query, setQuery] = useState('');
  const [resultText, setResultText] = useState('');
  const [sources, setSources] = useState<{ title: string; url: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const presetQueriesEn = [
    'Today Koyambedu wholesale tomato and onion arrivals and price trend',
    'Tamil Nadu agricultural export subsidy schemes and mandi cess update 2026',
    'Oddanchatram vegetable market current auction rates for brinjal and drumstick',
    'Weather impact on Nilgiri potato harvest this week'
  ];

  const presetQueriesTa = [
    'இன்றைய கோயம்பேடு தக்காளி மற்றும் வெங்காயம் வரத்து மற்றும் விலை நிலவரம்',
    'தமிழ்நாடு உழவர் சந்தை காய்கறி விலை நிலவரம் மற்றும் அரசு மானியங்கள்',
    'ஒட்டன்சத்திரம் சந்தை இன்றைய கத்தரிக்காய் மற்றும் முருங்கைக்காய் விலை',
    'நீலகிரி மற்றும் திண்டுக்கல் காய்கறி சந்தை சமீபத்திய செய்திகள்'
  ];

  const presets = lang === 'ta' ? presetQueriesTa : presetQueriesEn;

  const handleSearch = async (customQuery?: string) => {
    const q = customQuery || query;
    if (!q.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/gemini/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q, language: lang })
      });

      const data = await response.json();
      if (!response.ok || data.error) {
        throw new Error(data.error || 'Search grounding request failed');
      }

      setResultText(data.content || '');
      setSources(data.sources || []);
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch search-grounded market intel');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600 border border-blue-500/20">
            <Search className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              {lang === 'ta' ? 'Google தேடல் அடிப்படையிலான நேரலை சந்தை ஆய்வு' : 'Live Mandi Web Intelligence'}
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 font-bold">
                gemini-3.5-flash + googleSearch
              </span>
            </h3>
            <p className="text-xs text-slate-500">
              {lang === 'ta'
                ? 'அரசு இணையதளங்கள், தற்போதைய சந்தை அறிவிப்புகள் மற்றும் செய்திகளை கூகுள் மூலம் நேரலையாக தேடுங்கள்.'
                : 'Ground your wholesale decisions with real-time web search for mandi arrivals, tenders, and weather trends.'}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-4 space-y-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              id="gemini-search-grounding-input"
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder={
                lang === 'ta'
                  ? 'சந்தை வினவலை உள்ளிடவும் (எ.கா: இன்றைய கோயம்பேடு வரத்து...)'
                  : 'Ask any real-time market question (e.g. today\'s Koyambedu arrivals, Dindigul auction rates)...'
              }
              className="w-full text-sm pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-slate-900"
            />
          </div>
          <button
            type="button"
            onClick={() => handleSearch()}
            disabled={loading || !query.trim()}
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-1.5 transition-colors shadow-2xs shrink-0"
          >
            {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
            <span>{lang === 'ta' ? 'தேடு' : 'Search Mandi'}</span>
          </button>
        </div>

        {/* Quick Presets */}
        <div className="flex flex-wrap gap-1.5">
          {presets.map((p, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setQuery(p);
                handleSearch(p);
              }}
              className="text-xs px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-blue-50 border border-slate-200 text-slate-700 hover:text-blue-900 transition-colors"
            >
              🔍 {p}
            </button>
          ))}
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {loading && (
          <div className="p-6 text-center space-y-2 rounded-xl bg-slate-50 border border-slate-200/80">
            <RefreshCw className="w-6 h-6 text-blue-600 animate-spin mx-auto" />
            <p className="text-xs font-bold text-slate-700">
              {lang === 'ta' ? 'கூகுள் தேடல் மூலம் நேரலை சந்தைத் தகவல் சேகரிக்கப்படுகிறது...' : 'Searching live agricultural sources with Gemini 3.5 Flash...'}
            </p>
          </div>
        )}

        {resultText && !loading && (
          <div className="space-y-4 rounded-xl bg-slate-50/80 border border-slate-200 p-4">
            <div className="prose prose-sm max-w-none text-slate-800 text-xs sm:text-sm whitespace-pre-wrap leading-relaxed">
              {resultText}
            </div>

            {sources.length > 0 && (
              <div className="pt-3 border-t border-slate-200">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5 mb-2">
                  <Globe className="w-3.5 h-3.5 text-blue-600" />
                  {lang === 'ta' ? 'உறுதிப்படுத்தப்பட்ட ஆதாரங்கள் (Google Search Sources):' : 'Verified Google Grounding Sources:'}
                </span>
                <div className="flex flex-wrap gap-2">
                  {sources.map((s, i) => (
                    <a
                      key={i}
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-blue-700 hover:text-blue-900 hover:border-blue-300 shadow-2xs"
                    >
                      <span className="truncate max-w-[220px]">{s.title || s.url}</span>
                      <ExternalLink className="w-3 h-3 shrink-0 text-slate-400" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
