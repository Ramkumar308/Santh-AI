import { Language } from '../types';

export const TRANSLATIONS = {
  en: {
    appTitle: 'SanthAI',
    appSubtitle: 'Low-Literacy Smart Assistant for Produce Vendors',
    whatsappFirst: 'WhatsApp-First System',
    vendorPortal: 'Vendor Assistant',
    simpleView: 'Simple View',
    technicalView: 'Technical Math',
    voiceReadout: 'Listen Aloud',
    voiceStop: 'Stop Audio',
    navStock: 'Stock',
    navStockSub: 'Tomorrow Demand',
    navPrices: 'Prices',
    navPricesSub: 'Mandi Rates',
    navResQ: 'ResQ',
    navResQSub: 'Surplus Rescue',
    navKhata: 'Khata',
    navKhataSub: 'Credit Ledger',
    live: 'Live',
    cached: 'Cached',
    updated: 'Updated',
    justNow: 'Just now',
    hoursAgo: 'hours ago',
    minsAgo: 'mins ago',
    tamilNaduMandis: 'Tamil Nadu Mandis',
    trustScore: 'Trust Score',
    repaymentRisk: 'Credit Risk',
    surplusAlert: 'Surplus Stock Alert!',
    unsoldAboveLimit: 'unsold stock exceeds 5kg. Take action before market closes to avoid waste!',
    buyTomorrow: 'Order Tomorrow',
    walkInDemand: 'Walk-in Buyers',
    precommittedBulk: 'Pre-committed Bulk',
    forecastBreakdown: 'Demand Forecast Formula',
    logTodayStock: 'Log Today Stock',
    receivedKg: 'Received (kg)',
    soldKg: 'Sold (kg)',
    unsoldKg: 'Unsold (kg)',
    wasteKg: 'Spoiled/Waste (kg)',
    saveLog: 'Save Daily Log',
    todaySummary: "Today's Market Status",
    priceRange: 'Mandi Price Range',
    modalPrice: 'Modal (Common) Price',
    myPrice: 'My Stall Price',
    fairPrice: 'Fair Price',
    priceGouging: 'Potential Gouging (High)',
    priceUndercutting: 'Under-pricing (Loss risk)',
    zScore: 'Price Z-Score',
    clearanceSale: 'Quick Clearance Sale',
    bulkBoard: 'Institutional Bulk Board',
    claimOrder: 'Claim This Order',
    claimed: 'Committed to Your Forecast',
    sendWhatsApp: 'Send WhatsApp Message',
    contactBuyer: 'Contact Buyer on WhatsApp',
    markdownSuggested: 'Suggested Clearance Price',
    marketClosingIn: 'Market closing in',
    hours: 'hours',
    customerName: 'Customer Name',
    amountDue: 'Amount Due',
    creditLimit: 'Credit Limit',
    recordPayment: 'Record Payment',
    sendReminder: 'Send Payment Reminder',
    addCustomer: 'Add New Khata Customer',
    simulatedDataBanner: 'Simulated Data for Demo / Illustrative Purposes (informal produce vendor records)',
    loginGoogle: 'Sign in with Google',
    logout: 'Switch Vendor / Logout',
    activeVendor: 'Active Stall',
    whatsappBotNotice: 'In production, all these tools operate conversationally over WhatsApp (no app download needed).'
  },
  ta: {
    appTitle: 'சந்தை AI (SanthAI)',
    appSubtitle: 'காய்கறி வியாபாரிகளுக்கான எளிய வாட்ஸ்அப் உதவியாளர்',
    whatsappFirst: 'வாட்ஸ்அப் வழி சேவை',
    vendorPortal: 'வியாபாரி பக்கம்',
    simpleView: 'எளிய பார்வை',
    technicalView: 'கணித சூத்திரம்',
    voiceReadout: 'குரலில் கேட்க',
    voiceStop: 'நிறுத்து',
    navStock: 'சரக்கு',
    navStockSub: 'நாளை தேவை கணிப்பு',
    navPrices: 'விலை நிலவரம்',
    navPricesSub: 'மண்டி விலை',
    navResQ: 'மீட்பு (ResQ)',
    navResQSub: 'மீதி விற்பனை',
    navKhata: 'கடன் நோட்டு',
    navKhataSub: 'கடன் கணக்கு',
    live: 'நேரலை',
    cached: 'சேமிக்கப்பட்ட தரவு',
    updated: 'புதுப்பிக்கப்பட்டது',
    justNow: 'சற்று முன்',
    hoursAgo: 'மணி நேரம் முன்',
    minsAgo: 'நிமிடம் முன்',
    tamilNaduMandis: 'தமிழ்நாடு மண்டிகள்',
    trustScore: 'நம்பகத்தன்மை புள்ளி',
    repaymentRisk: 'கடன் திருப்பி தரும் அபாயம்',
    surplusAlert: 'மீதி காய்கறி எச்சரிக்கை!',
    unsoldAboveLimit: '5 கிலோவுக்கு மேல் மீதி உள்ளது. நஷ்டத்தை தவிர்க்க உடனே நடவடிக்கை எடுங்கள்!',
    buyTomorrow: 'நாளை வாங்க வேண்டியது',
    walkInDemand: 'சில்லறை வாடிக்கையாளர்',
    precommittedBulk: 'ஹோட்டல்/ஹாஸ்டல் முன்பதிவு',
    forecastBreakdown: 'தேவை கணிப்பு முறை',
    logTodayStock: 'இன்றைய விற்பனையை பதியுங்கள்',
    receivedKg: 'வாங்கியது (கிலோ)',
    soldKg: 'விற்றது (கிலோ)',
    unsoldKg: 'மீதி (கிலோ)',
    wasteKg: 'வீணானது (கிலோ)',
    saveLog: 'பதிவை சேமிக்கவும்',
    todaySummary: 'இன்றைய நிலை',
    priceRange: 'மண்டி விலை வரம்பு',
    modalPrice: 'சராசரி மண்டி விலை',
    myPrice: 'என் கடை விலை',
    fairPrice: 'நியாயமான விலை',
    priceGouging: 'அதிக விலை (வாடிக்கையாளர் சந்தேகம்)',
    priceUndercutting: 'மிகக் குறைந்த விலை (நஷ்டம்)',
    zScore: 'விலை வேறுபாடு (Z-Score)',
    clearanceSale: 'தள்ளுபடி விற்பனை',
    bulkBoard: 'மொத்த கொள்முதல் பலகை',
    claimOrder: 'இந்த ஆர்டரை எடுக்கவும்',
    claimed: 'உங்கள் சரக்கில் சேர்க்கப்பட்டது',
    sendWhatsApp: 'வாட்ஸ்அப் செய்தி அனுப்புக',
    contactBuyer: 'வாங்குபவரை வாட்ஸ்அப்பில் அழைக்க',
    markdownSuggested: 'பரிந்துரைக்கப்படும் தள்ளுபடி விலை',
    marketClosingIn: 'சந்தை முடிய இன்னும்',
    hours: 'மணி நேரம்',
    customerName: 'வாடிக்கையாளர் பெயர்',
    amountDue: 'பாக்கி தொகை',
    creditLimit: 'கடன் வரம்பு',
    recordPayment: 'பணம் வரவு வைக்க',
    sendReminder: 'கடன் நினைவூட்டல் அனுப்ப',
    addCustomer: 'புதிய கடன் வாடிக்கையாளர்',
    simulatedDataBanner: 'மாதிரி/பயிற்சித் தரவு மட்டுமே (உண்மையான கடன் விவரங்கள் அல்ல)',
    loginGoogle: 'கூகுள் மூலம் நுழைய',
    logout: 'வெளியேற / கடை மாற்ற',
    activeVendor: 'தற்போதைய கடை',
    whatsappBotNotice: 'நேரடி சந்தையில் இது ஆப் இல்லாமல் வாட்ஸ்அப் மெசேஜ் மூலமே இயங்கும்.'
  }
};

export function t(lang: Language, key: keyof typeof TRANSLATIONS['en']): string {
  return TRANSLATIONS[lang]?.[key] || TRANSLATIONS['en'][key] || key;
}

// Low-literacy Voice Readout Helper using browser Web Speech API
export function speakText(text: string, lang: Language): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return;
  }

  try {
    window.speechSynthesis.cancel(); // stop any ongoing speech
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95; // slightly slower for clear comprehension
    utterance.pitch = 1.0;

    if (lang === 'ta') {
      utterance.lang = 'ta-IN';
    } else {
      utterance.lang = 'en-IN';
    }

    // Attempt to pick matching voice if available
    const voices = window.speechSynthesis.getVoices();
    const matchedVoice = voices.find(v => (lang === 'ta' ? v.lang.includes('ta') : v.lang.includes('en-IN') || v.lang.includes('en-GB')));
    if (matchedVoice) {
      utterance.voice = matchedVoice;
    }

    window.speechSynthesis.speak(utterance);
  } catch (err) {
    console.warn('Speech synthesis not available or failed:', err);
  }
}

export function stopSpeaking(): void {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}
