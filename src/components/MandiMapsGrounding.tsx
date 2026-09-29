import React, { useState } from 'react';
import { MapPin, Navigation, ExternalLink, RefreshCw, AlertCircle, Compass, Truck } from 'lucide-react';
import { Language } from '../types';

interface MandiMapsGroundingProps {
  lang: Language;
}

export const MandiMapsGrounding: React.FC<MandiMapsGroundingProps> = ({ lang }) => {
  const [query, setQuery] = useState('');
  const [resultText, setResultText] = useState('');
  const [places, setPlaces] = useState<{ title: string; uri: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const presetQueriesEn = [
    'Major wholesale vegetable mandis and market committees near Chennai',
    'Cold storage warehouses for tomatoes and potatoes near Oddanchatram & Dindigul',
    'Uzhavar Sandhai farmers markets around Madurai & Coimbatore',
    'Agricultural transport hubs and lorry booking centers near Koyambedu market'
  ];

  const presetQueriesTa = [
    'சென்னை கோயம்பேடு சுற்றியுள்ள மொத்த காய்கறி மண்டிகள்',
    'திண்டுக்கல் மற்றும் ஒட்டன்சத்திரம் குளிர்பதன கிடங்குகள் (Cold Storage)',
    'மதுரை மற்றும் கோயம்புத்தூர் உழவர் சந்தைகள் இருப்பிடம்',
    'காய்கறி லாரி டிரான்ஸ்போர்ட் புக்கிங் அலுவலகங்கள்'
  ];

  const presets = lang === 'ta' ? presetQueriesTa : presetQueriesEn;

  const handleSearchPlaces = async (customQuery?: string) => {
    const q = customQuery || query;
    if (!q.trim()) return;

    setLoading(true);
    setError(null);

    try {
      let userLat: number | undefined = undefined;
      let userLng: number | undefined = undefined;

      // Try reading user's geo if allowed
      if (navigator.geolocation) {
        try {
          const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 3000 });
          });
          userLat = pos.coords.latitude;
          userLng = pos.coords.longitude;
        } catch {
          // Geolocation optional, fallback to textual lookup
        }
      }

      const response = await fetch('/api/gemini/maps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: q,
          lat: userLat,
          lng: userLng
        })
      });

      const data = await response.json();
      if (!response.ok || data.error) {
        throw new Error(data.error || 'Maps grounding query failed');
      }

      setResultText(data.content || '');
      setPlaces(data.places || []);
    } catch (err: any) {
      setError(err?.message || 'Failed to locate mandi hubs on Google Maps');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 border border-emerald-500/20">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              {lang === 'ta' ? 'Google Maps நேரலை மண்டி & தளவாடங்கள் வழிகாட்டி' : 'Mandi Logistics & Market Locator'}
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold">
                gemini-3.5-flash + googleMaps
              </span>
            </h3>
            <p className="text-xs text-slate-500">
              {lang === 'ta'
                ? 'அருகிலுள்ள காய்கறி சந்தைகள், உழவர் சந்தைகள், குளிர்பதன கிடங்குகள் மற்றும் லாரி மையங்களை கண்டறியுங்கள்.'
                : 'Locate wholesale yards, farmer markets, cold chains, and transport hubs with Google Maps grounding.'}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-4 space-y-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Compass className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              id="gemini-maps-grounding-input"
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearchPlaces()}
              placeholder={
                lang === 'ta'
                  ? 'மண்டி அல்லது குளிர்பதன கிடங்கு இருப்பிடம் கேட்கவும்...'
                  : 'Search mandi locations, cold storages, transport stands...'
              }
              className="w-full text-sm pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-slate-900"
            />
          </div>
          <button
            type="button"
            onClick={() => handleSearchPlaces()}
            disabled={loading || !query.trim()}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-1.5 transition-colors shadow-2xs shrink-0"
          >
            {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Navigation className="w-3.5 h-3.5" />}
            <span>{lang === 'ta' ? 'வரைபடம் தேடு' : 'Find Mandis'}</span>
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
                handleSearchPlaces(p);
              }}
              className="text-xs px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-emerald-50 border border-slate-200 text-slate-700 hover:text-emerald-900 transition-colors"
            >
              📍 {p}
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
            <RefreshCw className="w-6 h-6 text-emerald-600 animate-spin mx-auto" />
            <p className="text-xs font-bold text-slate-700">
              {lang === 'ta' ? 'Google Maps மூலம் மண்டி இருப்பிடங்கள் ஆய்வு செய்யப்படுகின்றன...' : 'Querying Google Maps grounding for market coordinates...'}
            </p>
          </div>
        )}

        {resultText && !loading && (
          <div className="space-y-4 rounded-xl bg-slate-50/80 border border-slate-200 p-4">
            <div className="prose prose-sm max-w-none text-slate-800 text-xs sm:text-sm whitespace-pre-wrap leading-relaxed">
              {resultText}
            </div>

            {places.length > 0 && (
              <div className="pt-3 border-t border-slate-200">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5 mb-2">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                  {lang === 'ta' ? 'வரைபட இடங்கள் (Google Maps Places):' : 'Identified Google Maps Hubs:'}
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {places.map((place, i) => (
                    <a
                      key={i}
                      href={place.uri || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.title)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-slate-200 text-slate-800 hover:border-emerald-400 hover:shadow-2xs transition-all"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <Truck className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span className="text-xs font-bold truncate">{place.title}</span>
                      </div>
                      <ExternalLink className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-2" />
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
