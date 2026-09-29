import React, { useState } from 'react';
import { Sparkles, Image as ImageIcon, Wand2, Download, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';
import { Language } from '../types';

interface AiProduceStudioProps {
  lang: Language;
}

export const AiProduceStudio: React.FC<AiProduceStudioProps> = ({ lang }) => {
  const [prompt, setPrompt] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [inputImagePreview, setInputImagePreview] = useState<string | null>(null);
  const [outputImage, setOutputImage] = useState<string | null>(null);
  const [outputDesc, setOutputDesc] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const samplePromptsEn = [
    'Fresh bright red Salem tomatoes piled in a traditional south Indian market stall banner with Tamil price tag "₹28/Kg"',
    'Wholesale Ooty crisp carrots and Nilgiri potatoes fresh morning dew background banner for market promo',
    'Discount evening markdown produce banner with big bold green badge "Fresh Evening Stock Clearance 30% OFF"',
    'A professional clean vegetable vendor shop sign for Shop B-42 Koyambedu with organic tomatoes and onions'
  ];

  const samplePromptsTa = [
    'சேலம் நாட்டுத் தக்காளி கூடையில் புதியதாக இருக்கும் சந்தை விளம்பரப் படம், விலை ₹28/கிலோ',
    'காய்கறி கடைக்கான காலை நேர பளபளப்பான உருளைக்கிழங்கு மற்றும் கேரட் சுவரொட்டி',
    'மாலை நேர தள்ளுபடி சலுகை: 30% தள்ளுபடி புத்தம் புதிய காய்கறிகள்',
    'கோயம்பேடு அங்காடி B-42 கடைக்கான அழகிய வண்ண காய்கறி விளம்பர பதாகை'
  ];

  const prompts = lang === 'ta' ? samplePromptsTa : samplePromptsEn;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = () => {
        setInputImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async (customPrompt?: string) => {
    const finalPrompt = customPrompt || prompt;
    if (!finalPrompt.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/gemini/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: finalPrompt,
          base64InputImage: inputImagePreview || undefined
        })
      });

      const data = await response.json();
      if (!response.ok || data.error) {
        throw new Error(data.error || 'Image creation failed');
      }

      setOutputImage(data.imageDataUrl);
      setOutputDesc(data.description || '');
    } catch (err: any) {
      setError(err?.message || 'Error generating image');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!outputImage) return;
    const a = document.createElement('a');
    a.href = outputImage;
    a.download = `santhai-produce-banner-${Date.now()}.png`;
    a.click();
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600 border border-amber-500/20">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              {lang === 'ta' ? 'AI சந்தை பதாகை & பட உருவாக்கம்' : 'AI Produce Image Studio'}
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold">
                gemini-3.1-flash-image-preview
              </span>
            </h3>
            <p className="text-xs text-slate-500">
              {lang === 'ta'
                ? 'உங்கள் கடை மற்றும் வாட்ஸ்அப் விளம்பரங்களுக்கான புதிய காய்கறி படங்களை உருவாக்குங்கள் அல்லது திருத்துங்கள்.'
                : 'Create high-res promotional banners or edit stall photos with natural language prompts.'}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-5">
        {/* Left Column: Prompt & Image Input */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              {lang === 'ta' ? 'விளக்கத்தை உள்ளிடவும் (Prompt)' : 'Enter Image Prompt or Edit Instructions'}
            </label>
            <textarea
              id="gemini-image-prompt-input"
              rows={3}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={
                lang === 'ta'
                  ? 'எ.கா: சிவப்பு தக்காளி கூடை விளம்பரம், இன்றைய விலை ₹28/கிலோ...'
                  : 'E.g., Fresh vibrant pile of Coimbatore tomatoes with morning gloss and Tamil price badge...'
              }
              className="w-full text-sm p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-slate-900"
            />
          </div>

          {/* Quick Prompt Suggestions */}
          <div>
            <span className="text-[11px] font-semibold text-slate-500 block mb-1.5">
              {lang === 'ta' ? 'பரிந்துரைக்கப்பட்ட பதாகைகள்:' : 'Quick Presets:'}
            </span>
            <div className="flex flex-wrap gap-1.5">
              {prompts.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setPrompt(p);
                    handleGenerate(p);
                  }}
                  className="text-left text-xs px-2.5 py-1.5 rounded-lg bg-slate-50 hover:bg-emerald-50 border border-slate-200 text-slate-700 hover:text-emerald-900 transition-colors"
                >
                  ✨ {p.slice(0, 48)}...
                </button>
              ))}
            </div>
          </div>

          {/* Optional Base Image to Edit */}
          <div className="p-3.5 rounded-xl border border-dashed border-slate-300 bg-slate-50/50">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-800 block">
                  {lang === 'ta' ? 'ஏற்கனவே உள்ள படத்தை திருத்த (விருப்பத்தேர்வு)' : 'Edit an Existing Produce Photo (Optional)'}
                </span>
                <span className="text-[11px] text-slate-500">
                  {lang === 'ta' ? 'உங்கள் கடை புகைப்படத்தை பதிவேற்றி திருத்துங்கள்' : 'Upload stall produce picture to enhance with AI'}
                </span>
              </div>
              <label className="cursor-pointer px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100 shadow-2xs">
                <ImageIcon className="w-3.5 h-3.5 inline mr-1 text-slate-500" />
                {lang === 'ta' ? 'படம் பதிவேற்று' : 'Upload'}
                <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
              </label>
            </div>

            {inputImagePreview && (
              <div className="mt-3 flex items-center gap-3">
                <img
                  src={inputImagePreview}
                  alt="Input preview"
                  className="w-16 h-16 object-cover rounded-lg border border-slate-200"
                />
                <div className="text-xs">
                  <span className="font-semibold text-slate-800 block">{selectedFile?.name}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setInputImagePreview(null);
                      setSelectedFile(null);
                    }}
                    className="text-rose-600 hover:underline mt-0.5"
                  >
                    {lang === 'ta' ? 'நீக்கு' : 'Remove'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          <button
            id="gemini-generate-image-btn"
            type="button"
            onClick={() => handleGenerate()}
            disabled={loading || !prompt.trim()}
            className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-xs transition-colors"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>{lang === 'ta' ? 'AI படம் உருவாக்குகிறது...' : 'Generating Image with Gemini...'}</span>
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4" />
                <span>
                  {inputImagePreview
                    ? (lang === 'ta' ? 'படத்தை திருத்து' : 'Edit Image with Gemini')
                    : (lang === 'ta' ? 'புதிய பதாகை உருவாக்கு' : 'Create Produce Banner')}
                </span>
              </>
            )}
          </button>
        </div>

        {/* Right Column: Output Preview */}
        <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-slate-50 border border-slate-200/80 min-h-[300px]">
          {loading ? (
            <div className="text-center py-12 space-y-3">
              <div className="w-12 h-12 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin mx-auto" />
              <p className="text-xs font-bold text-slate-700">
                {lang === 'ta' ? 'AI படம் தயாராகிறது (gemini-3.1-flash-image-preview)...' : 'Gemini is generating your produce visual...'}
              </p>
              <p className="text-[11px] text-slate-500">
                {lang === 'ta' ? 'சந்தை தரத்தில் வண்ணங்கள் சரிசெய்யப்படுகின்றன' : 'Rendering realistic textures, price badges, and ambient lighting'}
              </p>
            </div>
          ) : outputImage ? (
            <div className="w-full space-y-3">
              <div className="relative rounded-xl overflow-hidden border border-slate-200 shadow-sm bg-black/5">
                <img
                  src={outputImage}
                  alt="Generated produce banner"
                  className="w-full h-auto max-h-[360px] object-contain mx-auto"
                />
              </div>
              {outputDesc && (
                <p className="text-xs text-slate-600 italic bg-white p-2.5 rounded-lg border border-slate-200">
                  {outputDesc}
                </p>
              )}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDownload}
                  className="flex-1 py-2 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{lang === 'ta' ? 'பதிவிறக்கம் செய்' : 'Download Banner'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleGenerate()}
                  className="py-2 px-3 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                  <span>{lang === 'ta' ? 'மீண்டும் செய்' : 'Regenerate'}</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-slate-400 space-y-2">
              <ImageIcon className="w-12 h-12 mx-auto stroke-1 text-slate-300" />
              <p className="text-xs font-medium text-slate-500">
                {lang === 'ta' ? 'உருவாக்கப்பட்ட படம் இங்கே தோன்றும்' : 'Your generated produce visual will appear here'}
              </p>
              <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                {lang === 'ta'
                  ? 'விளம்பர வாசகம் தட்டச்சு செய்து "புதிய பதாகை உருவாக்கு" அழுத்தவும்.'
                  : 'Type a description or choose a preset above to create ready-to-share posters.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
