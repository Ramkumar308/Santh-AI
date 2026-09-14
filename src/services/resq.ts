import { CommodityType, DailyStockLog, SurplusRescueMatch, BulkOrderBoardItem, VendorProfile, Language } from '../types';
import { COMMODITIES } from '../data/commodities';

export class ResQService {
  /**
   * Evaluates unsold stock from recent logs and generates clearance recommendations
   * Threshold default: >= 5kg
   */
  public static detectSurplusAlerts(
    latestLogs: DailyStockLog[],
    vendorPrices: Record<CommodityType, number>,
    vendorProfile: VendorProfile,
    currentTimeHour: number = 17.5 // 5:30 PM default if not current time
  ): SurplusRescueMatch[] {
    const alerts: SurplusRescueMatch[] = [];
    const thresholdKg = 5;

    // Calculate hours remaining until vendor's market closing hour
    const hoursLeft = Math.max(0.5, Math.min(8, vendorProfile.marketClosingHour - currentTimeHour));

    // Sample illustrative buyer directory (generic, illustrative names only)
    const ILLUSTRATIVE_BUYERS = [
      { name: 'Kovai Annapoorna Mess', type: 'Mess' as const, phone: '919841234567', dist: 1.2 },
      { name: 'Sri Krishna Student Hostel', type: 'Hostel' as const, phone: '919840987654', dist: 2.5 },
      { name: 'City Care NGO Community Kitchen', type: 'Charity' as const, phone: '919842112233', dist: 0.8 },
      { name: 'Shanti Bhavan Hospital Canteen', type: 'Canteen' as const, phone: '919843334455', dist: 1.9 },
      { name: 'Murugan Daily Tiffin Center', type: 'Mess' as const, phone: '919844556677', dist: 0.6 }
    ];

    latestLogs.forEach((log, index) => {
      if (log.unsoldKg >= thresholdKg) {
        const basePrice = vendorPrices[log.commodity] || 30;

        // Dynamic markdown factor based on remaining stock and time-to-close
        // Urgency factor rises as closing time nears (fewer hours left)
        const timeFactor = Math.max(0, (4 - hoursLeft) * 5); // 0% to 20%
        const volumeFactor = Math.min(15, (log.unsoldKg / thresholdKg) * 4); // 4% to 15%
        const discountPercent = Math.min(45, Math.max(15, Math.round(15 + timeFactor + volumeFactor)));

        const suggestedMarkdownPrice = Math.max(8, Math.round(basePrice * (1 - discountPercent / 100)));
        const potentialSavedRupees = suggestedMarkdownPrice * log.unsoldKg;

        const buyer = ILLUSTRATIVE_BUYERS[index % ILLUSTRATIVE_BUYERS.length];
        const urgency: 'high' | 'medium' | 'low' = hoursLeft <= 2 ? 'high' : hoursLeft <= 3.5 ? 'medium' : 'low';

        alerts.push({
          id: `surplus_${log.commodity}_${index}`,
          commodity: log.commodity,
          unsoldKg: log.unsoldKg,
          normalPricePerKg: basePrice,
          suggestedMarkdownPrice,
          discountPercent,
          buyerName: buyer.name,
          buyerType: buyer.type,
          distanceKm: buyer.dist,
          buyerPhone: buyer.phone,
          requiresKg: Math.min(log.unsoldKg, Math.round(log.unsoldKg * 0.9)),
          recurring: false,
          timeToCloseHours: Math.round(hoursLeft * 10) / 10,
          potentialSavedRupees,
          urgency
        });
      }
    });

    return alerts;
  }

  /**
   * Generates wa.me pre-filled message URL
   */
  public static createWhatsAppUrl(
    match: SurplusRescueMatch,
    vendor: VendorProfile,
    lang: Language = 'ta'
  ): string {
    const meta = COMMODITIES[match.commodity];
    const commName = lang === 'ta' ? meta.nameTa : meta.nameEn;

    const message = lang === 'ta'
      ? `வணக்கம் ஐயா! ${vendor.name} (${vendor.stallNumber}, ${vendor.marketName}) SanthAI மூலம் தொடர்பு கொள்கிறேன்.\n\n` +
        `எங்களிடம் இன்று நல்ல தரமான ${commName} ${match.unsoldKg} கிலோ மீதம் உள்ளது.\n` +
        `• வழக்கமான விலை: ₹${match.normalPricePerKg}/கிலோ\n` +
        `• உடனடி மீட்பு தள்ளுபடி விலை: ₹${match.suggestedMarkdownPrice}/கிலோ (${match.discountPercent}% சேமிப்பு!)\n` +
        `• பிக்கப் நேரம்: இன்று மாலை ${vendor.closingTimeStr} மணிக்குள்.\n\n` +
        `உங்களுக்கு தேவைப்பட்டால் தயவுசெய்து உடனே தெரிவிக்கவும். நன்றி!`
      : `Vanakkam! Reaching out from SanthAI on behalf of ${vendor.name} (${vendor.stallNumber}, ${vendor.marketName}).\n\n` +
        `We have fresh unsold ${commName} (${match.unsoldKg} kg) available today before market closing.\n` +
        `• Normal Price: Rs ${match.normalPricePerKg}/kg\n` +
        `• Clearance Markdown Price: Rs ${match.suggestedMarkdownPrice}/kg (${match.discountPercent}% Off!)\n` +
        `• Pickup Window: Before ${vendor.closingTimeStr} today.\n\n` +
        `Please reply here if you can take this surplus batch. Thank you!`;

    const encoded = encodeURIComponent(message);
    return `https://wa.me/${match.buyerPhone}?text=${encoded}`;
  }

  /**
   * Generates wa.me URL for claiming a recurring institutional bulk order
   */
  public static createBulkClaimWhatsAppUrl(
    order: BulkOrderBoardItem,
    vendor: VendorProfile,
    lang: Language = 'ta'
  ): string {
    const meta = COMMODITIES[order.commodity];
    const commName = lang === 'ta' ? meta.nameTa : meta.nameEn;

    const message = lang === 'ta'
      ? `வணக்கம் ${order.contactPerson} ஐயா! ${vendor.name} (${vendor.stallNumber}, ${vendor.marketName}) SanthAI போர்டில் உங்கள் தேவையைப் பார்த்தேன்.\n\n` +
        `நீங்கள் கேட்ட ${commName} தினசரி ${order.dailyRequirementKg} கிலோவை ₹${order.targetPricePerKg}/கிலோ வீதம் தடையின்றி தினமும் காலை சப்ளை செய்ய தயாராக உள்ளேன்.\n` +
        `நாளை முதல் விநியோகத்தை தொடங்கலாமா? தயவுசெய்து உறுதிப்படுத்தவும். நன்றி!`
      : `Hello ${order.contactPerson}! I am ${vendor.name} from ${vendor.stallNumber}, ${vendor.marketName}.\n\n` +
        `I saw your recurring requirement on the SanthAI board for ${commName} (${order.dailyRequirementKg} kg/day at Rs ${order.targetPricePerKg}/kg).\n` +
        `I can guarantee fresh daily supply as per your schedule (${order.weeklySchedule}).\n` +
        `Please let me know if we can start from tomorrow. Thank you!`;

    const encoded = encodeURIComponent(message);
    return `https://wa.me/${order.contactPhone}?text=${encoded}`;
  }
}
