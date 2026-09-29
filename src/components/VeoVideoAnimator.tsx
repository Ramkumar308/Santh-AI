import React, { useState, useEffect, useRef } from 'react';
import {
  Film,
  Upload,
  Play,
  Download,
  RefreshCw,
  AlertCircle,
  Sparkles,
  Smartphone,
  Monitor,
  CheckCircle2,
  Sliders,
  Image as ImageIcon
} from 'lucide-react';
import { Language } from '../types';
import { SoundEffects } from '../utils/audioHaptics';

interface VeoVideoAnimatorProps {
  lang: Language;
}

export const VeoVideoAnimator: React.FC<VeoVideoAnimatorProps> = ({ lang }) => {
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');
  const [prompt, setPrompt] = useState('');
  const [operationName, setOperationName] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState<string>('');
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [videoBlobUrl, setVideoBlobUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const progressTimerRef = useRef<NodeJS.Timeout | null>(null);

  const sampleImages = [
    {
      name: lang === 'ta' ? 'நாட்டுத் தக்காளி கூடை' : 'Fresh Tomato Basket',
      url: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=800&auto=format&fit=crop&q=80',
      presetPrompt: lang === 'ta'
        ? 'பளபளக்கும் புதிய தக்காளி கூடையில் காலை சூரிய ஒளியில் மெதுவான சினிமா கேமரா அசைவு'
        : 'Slow cinematic motion zooming gently into fresh ripe red tomatoes with soft morning sunlight'
    },
    {
      name: lang === 'ta' ? 'நீலகிரி மலை உருளை & கேரட்' : 'Ooty Hills Carrot & Potato',
      url: 'https://images.unsplash.com/photo-1447175008436-054170c2e979?w=800&auto=format&fit=crop&q=80',
      presetPrompt: lang === 'ta'
        ? 'மலைத்தோட்ட புத்தம் புதிய கேரட் மற்றும் காய்கறிகளின் மீது பனித்துளிகள் மின்னுவது போன்ற காட்சி'
        : 'Atmospheric panning shot over freshly harvested farm vegetables with mist and subtle lens flare'
    },
    {
      name: lang === 'ta' ? 'கோயம்பேடு மாலை சந்தை' : 'Mandi Evening Market Stall',
      url: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&auto=format&fit=crop&q=80',
      presetPrompt: lang === 'ta'
        ? 'மாலை நேர சந்தை பரபரப்பில் காய்கறி கடையின் விளக்கு வெளிச்சம் மெதுவாக நகரும் காட்சி'
        : 'Gentle vibrant motion through a bustling Indian produce market stall with warm twilight lamps'
    }
  ];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    SoundEffects.playClick();
    const reader = new FileReader();
    reader.onload = () => {
      setImageBase64(reader.result as string);
      setVideoBlobUrl(null);
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const handleSelectSample = async (sample: typeof sampleImages[0]) => {
    SoundEffects.playClick();
    setPrompt(sample.presetPrompt);
    try {
      const resp = await fetch(sample.url);
      const blob = await resp.blob();
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageBase64(reader.result as string);
        setVideoBlobUrl(null);
        setError(null);
      };
      reader.readAsDataURL(blob);
    } catch {
      setError('Could not load sample image. Please upload a photo from your device.');
    }
  };

  const handleGenerateVideo = async () => {
    if (!imageBase64) {
      setError(lang === 'ta' ? 'தயவுசெய்து ஒரு புகைப்படத்தை பதிவேற்றவும்' : 'Please upload or select a photo first');
      return;
    }

    SoundEffects.playClick();
    setIsGenerating(true);
    setError(null);
    setVideoBlobUrl(null);
    setProgressPercent(10);
    setGenerationStep(lang === 'ta' ? '1/4: Veo வீடியோ இயந்திரத்திற்கு அனுப்பப்படுகிறது...' : '1/4: Submitting image to Veo neural video engine...');

    // Smooth simulated progress while polling
    if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    progressTimerRef.current = setInterval(() => {
      setProgressPercent((prev) => {
        if (prev < 30) return prev + 3;
        if (prev < 65) return prev + 1.5;
        if (prev < 90) return prev + 0.8;
        return prev;
      });
    }, 1000);

    try {
      const resp = await fetch('/api/generate-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt.trim() || 'Cinematic slow camera pan and vibrant market motion over fresh produce',
          imageBase64,
          aspectRatio
        })
      });

      const data = await resp.json();
      if (!resp.ok || data.error) {
        throw new Error(data.error || 'Failed to start Veo video generation');
      }

      setOperationName(data.operationName);
      setGenerationStep(lang === 'ta' ? '2/4: கேமரா அசைவு மற்றும் இயக்க பகுப்பாய்வு...' : '2/4: Synthesizing camera kinematics and lighting...');

      // Start polling for video status
      startPolling(data.operationName);
    } catch (err: any) {
      setIsGenerating(false);
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
      setError(err?.message || 'Error initiating Veo video animation');
    }
  };

  const startPolling = (opName: string) => {
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);

    pollIntervalRef.current = setInterval(async () => {
      try {
        const pollResp = await fetch('/api/video-status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ operationName: opName })
        });
        const pollData = await pollResp.json();

        if (pollData.error) {
          throw new Error(pollData.error.message || 'Veo video rendering failed');
        }

        if (pollData.done) {
          clearInterval(pollIntervalRef.current!);
          if (progressTimerRef.current) clearInterval(progressTimerRef.current);
          setProgressPercent(95);
          setGenerationStep(lang === 'ta' ? '4/4: வீடியோ பதிவிறக்கம் செய்யப்படுகிறது...' : '4/4: Downloading finalized MP4 video...');

          // Download video
          const dlResp = await fetch('/api/video-download', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ operationName: opName })
          });

          if (!dlResp.ok) {
            throw new Error('Failed to stream video bytes');
          }

          const blob = await dlResp.blob();
          const objectUrl = URL.createObjectURL(blob);
          setVideoBlobUrl(objectUrl);
          setIsGenerating(false);
          setProgressPercent(100);
          setGenerationStep(lang === 'ta' ? 'முடிந்தது! வீடியோ தயார்.' : 'Done! Video generated successfully.');
          SoundEffects.playSuccess();
        } else {
          setGenerationStep(lang === 'ta' ? '3/4: வீடியோ பிரேம்கள் உருவாக்கப்படுகின்றன...' : '3/4: Neural rendering 720p frames...');
        }
      } catch (err: any) {
        if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
        if (progressTimerRef.current) clearInterval(progressTimerRef.current);
        setIsGenerating(false);
        setError(err?.message || 'Error generating video');
      }
    }, 4000);
  };

  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    };
  }, []);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-600 border border-purple-500/20 shadow-xs">
            <Film className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              {lang === 'ta' ? 'Veo புகைப்பட அசைவு வீடியோ ஸ்டுடியோ' : 'Veo Photo-to-Video Animation'}
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 font-bold">
                veo-3.1-fast-generate-preview
              </span>
            </h3>
            <p className="text-xs text-slate-500">
              {lang === 'ta'
                ? 'காய்கறி புகைப்படத்தை பதிவேற்றி வாட்ஸ்அப் ஸ்டேட்டஸ் அல்லது திரைக்கு சினிமா வீடியோவாக மாற்றவும்.'
                : 'Upload stall or produce photos and generate cinematic promo videos using Google Veo.'}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-5">
        {/* Left Column: Image upload & Controls */}
        <div className="lg:col-span-7 space-y-4">
          {/* Photo Selection / Dropzone */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2 flex items-center justify-between">
              <span>{lang === 'ta' ? '1. புகைப்படத்தை தேர்ந்தெடுக்கவும்' : '1. Upload or Select Produce Photo'}</span>
              {imageBase64 && (
                <button
                  onClick={() => setImageBase64(null)}
                  className="text-emerald-700 hover:underline text-[11px] font-semibold"
                >
                  {lang === 'ta' ? 'புகைப்படத்தை மாற்று' : 'Change Photo'}
                </button>
              )}
            </label>

            {imageBase64 ? (
              <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-950 flex items-center justify-center aspect-video max-h-64 group">
                <img
                  src={imageBase64}
                  alt="Upload preview"
                  className="w-full h-full object-contain"
                />
                <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <label className="cursor-pointer bg-white/90 hover:bg-white text-slate-900 px-3.5 py-1.5 rounded-lg text-xs font-bold shadow-md flex items-center gap-1.5">
                    <Upload className="w-3.5 h-3.5 text-slate-700" />
                    {lang === 'ta' ? 'வேறு படம் பதிவேற்று' : 'Upload Another'}
                    <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                  </label>
                </div>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-200 hover:border-purple-400 rounded-xl cursor-pointer bg-slate-50/50 hover:bg-purple-50/20 transition-colors">
                <Upload className="w-8 h-8 text-purple-600 mb-2" />
                <span className="text-xs font-bold text-slate-800">
                  {lang === 'ta' ? 'புகைப்படத்தை பதிவேற்ற தட்டவும்' : 'Tap to upload produce or stall photo'}
                </span>
                <span className="text-[11px] text-slate-400 mt-1">PNG, JPG, WebP (Max 15MB)</span>
                <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
              </label>
            )}

            {/* Quick Presets */}
            <div className="mt-3">
              <span className="text-[11px] font-semibold text-slate-500 mb-1.5 block">
                {lang === 'ta' ? 'அல்லது மாதிரி படங்களை முயற்சிக்கவும்:' : 'Or choose a sample photo:'}
              </span>
              <div className="grid grid-cols-3 gap-2">
                {sampleImages.map((s, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectSample(s)}
                    className="flex flex-col items-start p-1.5 rounded-lg border border-slate-200 hover:border-purple-400 bg-white hover:bg-purple-50/30 transition-all text-left group"
                  >
                    <img src={s.url} alt={s.name} className="w-full h-12 object-cover rounded-md mb-1" />
                    <span className="text-[10px] font-semibold text-slate-700 truncate w-full group-hover:text-purple-700">
                      {s.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Aspect Ratio Selector (Mandatory 16:9 or 9:16) */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
              {lang === 'ta' ? '2. வீடியோ வடிவம் (Aspect Ratio)' : '2. Aspect Ratio (16:9 or 9:16)'}
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  SoundEffects.playClick();
                  setAspectRatio('16:9');
                }}
                className={`p-3 rounded-xl border flex items-center gap-3 transition-all text-left ${
                  aspectRatio === '16:9'
                    ? 'border-purple-500 bg-purple-50/70 text-purple-900 shadow-xs'
                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className={`p-2 rounded-lg ${aspectRatio === '16:9' ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                  <Monitor className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold flex items-center gap-1.5">
                    16:9 Landscape
                    {aspectRatio === '16:9' && <CheckCircle2 className="w-3.5 h-3.5 text-purple-600" />}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {lang === 'ta' ? 'டிவி & கடை திரைகள்' : 'Stall display & YouTube'}
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  SoundEffects.playClick();
                  setAspectRatio('9:16');
                }}
                className={`p-3 rounded-xl border flex items-center gap-3 transition-all text-left ${
                  aspectRatio === '9:16'
                    ? 'border-purple-500 bg-purple-50/70 text-purple-900 shadow-xs'
                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className={`p-2 rounded-lg ${aspectRatio === '9:16' ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                  <Smartphone className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold flex items-center gap-1.5">
                    9:16 Portrait
                    {aspectRatio === '9:16' && <CheckCircle2 className="w-3.5 h-3.5 text-purple-600" />}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {lang === 'ta' ? 'வாட்ஸ்அப் ஸ்டேட்டஸ்' : 'WhatsApp Status / Reel'}
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Motion Prompt */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              {lang === 'ta' ? '3. அசைவு விபரம் (Motion Prompt)' : '3. Motion Direction (Optional)'}
            </label>
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={
                lang === 'ta'
                  ? 'எ.கா: காலை பனித்துளியில் பளபளக்கும் காய்கறிகள் மீது மெதுவான கேமரா அசைவு...'
                  : 'e.g. Smooth cinematic slow zoom into fresh produce with warm atmospheric lighting...'
              }
              className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none text-slate-800"
            />
          </div>

          {/* Generate Button */}
          <button
            onClick={handleGenerateVideo}
            disabled={isGenerating || !imageBase64}
            className={`w-full py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all ${
              isGenerating || !imageBase64
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                : 'bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-700 hover:to-indigo-800 text-white shadow-purple-500/20 hover:shadow-md'
            }`}
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-purple-200" />
                <span>{lang === 'ta' ? 'வீடியோ உருவாக்கப்படுகிறது...' : 'Generating Veo Video...'}</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-purple-200" />
                <span>{lang === 'ta' ? 'Veo கொண்டு அனிமேஷன் செய்க' : 'Animate into Video with Veo'}</span>
              </>
            )}
          </button>

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Right Column: Output Video Player / Live Progress */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center bg-slate-900 rounded-2xl p-4 text-white relative min-h-[300px] border border-slate-800">
          {videoBlobUrl ? (
            <div className="w-full flex flex-col items-center gap-3">
              <div className={`relative rounded-xl overflow-hidden bg-black border border-slate-700 shadow-2xl ${
                aspectRatio === '9:16' ? 'w-48 aspect-[9/16]' : 'w-full aspect-video'
              }`}>
                <video
                  src={videoBlobUrl}
                  controls
                  autoPlay
                  loop
                  playsInline
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="w-full flex items-center justify-between gap-2 mt-2 pt-2 border-t border-slate-800">
                <span className="text-[11px] text-emerald-400 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Veo 720p ({aspectRatio})
                </span>
                <a
                  href={videoBlobUrl}
                  download={`santhai_veo_${Date.now()}.mp4`}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  {lang === 'ta' ? 'MP4 பதிவிறக்கு' : 'Download MP4'}
                </a>
              </div>
            </div>
          ) : isGenerating ? (
            <div className="w-full px-4 text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center justify-center mx-auto animate-pulse">
                <Film className="w-7 h-7" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-white">
                  {lang === 'ta' ? 'Veo AI அனிமேஷன் இயங்குகிறது' : 'Veo Generative Video Processing'}
                </h4>
                <p className="text-xs text-purple-300 mt-1 font-mono tracking-tight">
                  {generationStep}
                </p>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden border border-slate-700">
                <div
                  className="bg-gradient-to-r from-purple-500 to-indigo-400 h-full transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              <div className="text-[11px] text-slate-400">
                {lang === 'ta'
                  ? 'வீடியோ உருவாக்கம் சில வினாடிகள் எடுக்கும். தயவுசெய்து காத்திருக்கவும்.'
                  : 'Veo takes a few moments to synthesize fluid temporal motion.'}
              </div>
            </div>
          ) : (
            <div className="text-center p-6 text-slate-400 space-y-2">
              <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center mx-auto text-slate-500">
                <Film className="w-6 h-6" />
              </div>
              <p className="text-xs font-medium">
                {lang === 'ta'
                  ? 'புகைப்படத்தை பதிவேற்றி அனிமேஷன் பொத்தானை அழுத்தவும்'
                  : 'Upload an image and click Animate into Video'}
              </p>
              <p className="text-[11px] text-slate-500">
                {lang === 'ta' ? 'உருவாக்கப்பட்ட MP4 வீடியோ இங்கு காண்பிக்கப்படும்' : 'Your generated Veo video will preview here'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
