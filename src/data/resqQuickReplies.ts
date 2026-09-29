export type QuickReplyLang = 'ta' | 'mr' | 'en';

export interface QuickReplyPreset {
  id: string;
  emoji: string;
  category: 'stock' | 'price' | 'contact' | 'logistics' | 'payment';
  targetRole: 'vendor' | 'buyer' | 'both';
  text: {
    ta: string; // Tamil
    mr: string; // Marathi
    en: string; // English
  };
  shortLabel: {
    ta: string;
    mr: string;
    en: string;
  };
}

export const VENDOR_QUICK_REPLIES: QuickReplyPreset[] = [
  {
    id: 'stock_available',
    emoji: '📦',
    category: 'stock',
    targetRole: 'vendor',
    shortLabel: {
      ta: 'சரக்கு உண்டு',
      mr: 'माल उपलब्ध',
      en: 'Stock available'
    },
    text: {
      ta: 'சரக்கு கைவசம் தயாராக உள்ளது, நீங்கள் தாராளமாக எடுத்துக்கொள்ளலாம்.',
      mr: 'माल दुकानात उपलब्ध आणि तयार आहे, आपण घेऊ शकता.',
      en: 'Stock is currently available and ready for pickup.'
    }
  },
  {
    id: 'price_firm',
    emoji: '🔒',
    category: 'price',
    targetRole: 'vendor',
    shortLabel: {
      ta: 'விலை இறுதியானது',
      mr: 'किंमत निश्चित',
      en: 'Price firm'
    },
    text: {
      ta: 'விலை மிகவும் நியாயமானது மற்றும் இறுதியானது. மேலும் குறைக்க முடியாது.',
      mr: 'किंमत अगदी योग्य आणि निश्चित आहे. आणखी कमी करणे शक्य नाही.',
      en: 'This clearance price is firm and non-negotiable.'
    }
  },
  {
    id: 'please_call',
    emoji: '📞',
    category: 'contact',
    targetRole: 'vendor',
    shortLabel: {
      ta: 'போனில் அழைக்கவும்',
      mr: 'कृपया फोन करा',
      en: 'Please call'
    },
    text: {
      ta: 'தயவுசெய்து என்னை போனில் நேரடியாக அழைக்கவும்.',
      mr: 'कृपया माझ्याशी थेट फोनवर संपर्क साधा.',
      en: 'Please call me directly on phone to discuss.'
    }
  },
  {
    id: 'ready_pickup',
    emoji: '⚡',
    category: 'logistics',
    targetRole: 'vendor',
    shortLabel: {
      ta: 'உடனே எடுக்கலாம்',
      mr: 'उचलण्यास तयार',
      en: 'Ready for pickup'
    },
    text: {
      ta: 'சரக்கு பேக் செய்யப்பட்டு உடனே எடுத்துச் செல்ல தயாராக உள்ளது.',
      mr: 'माल पॅक करून त्वरित उचलण्यासाठी तयार ठेवला आहे.',
      en: 'Produce is packed and ready for immediate pickup.'
    }
  },
  {
    id: 'fresh_quality',
    emoji: '✨',
    category: 'stock',
    targetRole: 'vendor',
    shortLabel: {
      ta: 'முதல் தரம்',
      mr: 'उत्तम दर्जा',
      en: 'Fresh quality'
    },
    text: {
      ta: 'இன்று காலையில் வந்த புதிய முதல் தரமான காய்கறிகள்.',
      mr: 'आज सकाळी आलेला ताजा आणि उत्तम दर्जाचा शेतमाल आहे.',
      en: 'Fresh top-quality harvest arrived earlier today.'
    }
  },
  {
    id: 'cash_discount',
    emoji: '💵',
    category: 'price',
    targetRole: 'vendor',
    shortLabel: {
      ta: 'ரொக்க தள்ளுபடி ₹2',
      mr: 'रोख ₹२ सूट',
      en: '₹2 cash discount'
    },
    text: {
      ta: 'ரொக்கமாக செலுத்தினால் கிலோவுக்கு ₹2 கூடுதல் தள்ளுபடி தருகிறேன்.',
      mr: 'रोख पैसे दिल्यास प्रति किलो ₹२ अतिरिक्त सूट दिली जाईल.',
      en: 'Can provide an extra Rs 2/kg discount if paid in cash.'
    }
  },
  {
    id: 'hold_30m',
    emoji: '⏳',
    category: 'logistics',
    targetRole: 'vendor',
    shortLabel: {
      ta: '30 நிமிடம் ஒதுக்கு',
      mr: '३० मिनिटे राखून',
      en: 'Hold 30 mins'
    },
    text: {
      ta: 'உங்களுக்காக அடுத்த 30 நிமிடங்களுக்கு இந்த சரக்கை ஒதுக்கி வைக்கிறேன்.',
      mr: 'तुमच्यासाठी पुढील ३० मिनिटे हा माल राखून ठेवतो.',
      en: 'Holding this surplus batch for you for the next 30 minutes.'
    }
  }
];

export const BUYER_QUICK_REPLIES: QuickReplyPreset[] = [
  {
    id: 'pickup_30m',
    emoji: '⏱️',
    category: 'logistics',
    targetRole: 'buyer',
    shortLabel: {
      ta: '30 நிமிடத்தில் பிக்கப்',
      mr: '३० मिनिटांत येतो',
      en: 'Pickup in 30m'
    },
    text: {
      ta: 'நாங்கள் அடுத்த 30 நிமிடத்திற்குள் கடைக்கு வந்து நேரில் எடுத்துக்கொள்கிறோம்.',
      mr: 'आम्ही पुढील ३० मिनिटांत दुकानात येऊन माल उचलून घेऊ.',
      en: 'We will arrive at your stall within 30 minutes to pick up.'
    }
  },
  {
    id: 'take_entire',
    emoji: '📦',
    category: 'stock',
    targetRole: 'buyer',
    shortLabel: {
      ta: 'முழு சரக்கும் தேவை',
      mr: 'संपूर्ण माल पाहिजे',
      en: 'Need whole lot'
    },
    text: {
      ta: 'முழு சரக்கையும் எடுக்க தயாராக உள்ளோம். மொத்தமாக தள்ளுபடி கொடுங்கள்.',
      mr: 'आम्ही संपूर्ण माल उचलण्यास तयार आहोत. योग्य सवलत द्या.',
      en: 'Ready to absorb the entire surplus batch at once.'
    }
  },
  {
    id: 'any_discount',
    emoji: '🏷️',
    category: 'price',
    targetRole: 'buyer',
    shortLabel: {
      ta: 'தள்ளுபடி உண்டா?',
      mr: 'सवलत मिळेल का?',
      en: 'Any discount?'
    },
    text: {
      ta: 'தொடர்ந்து வாங்குபவர் நாங்கள், இதில் மேலும் சிறு தள்ளுபடி தர முடியுமா?',
      mr: 'आम्ही नियमित ग्राहक आहोत, आणखी थोडी सवलत मिळू शकेल का?',
      en: 'We are regular institutional buyers, can you offer any further markdown?'
    }
  },
  {
    id: 'pack_crates',
    emoji: '🧺',
    category: 'logistics',
    targetRole: 'buyer',
    shortLabel: {
      ta: 'கூடையில் வைக்கவும்',
      mr: 'क्रेटमध्ये भरा',
      en: 'Pack in crates'
    },
    text: {
      ta: 'சரக்கை பிளாஸ்டிக் கூடைகளில் எடுத்து வைக்கவும், ஆள் அனுப்பி எடுக்கிறோம்.',
      mr: 'कृपया माल क्रेटमध्ये भरून ठेवा, आम्ही गाडी पाठवून उचलतो.',
      en: 'Please pack in crates, vehicle is on the way.'
    }
  },
  {
    id: 'sending_upi',
    emoji: '📱',
    category: 'payment',
    targetRole: 'buyer',
    shortLabel: {
      ta: 'UPI பணம் அனுப்புகிறேன்',
      mr: 'UPI पाठवत आहे',
      en: 'Sending UPI'
    },
    text: {
      ta: 'உங்கள் QR கோடுக்கு இப்போது UPI பணம் அனுப்புகிறேன்.',
      mr: 'मी आता तुमच्या QR कोडवर UPI पेमेंट पाठवत आहे.',
      en: 'Sending UPI payment to your QR code right now.'
    }
  }
];
