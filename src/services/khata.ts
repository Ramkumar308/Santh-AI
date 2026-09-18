import { KhataCustomer, KhataTransaction, VendorProfile, Language } from '../types';

/**
 * KhataService: Ledger bookkeeping and quantitative credit risk assessment engine.
 *
 * Implements:
 * 1. Customer Credit Risk Scoring (0 to 100):
 *    Calculates recency-weighted penalty functions based on days overdue:
 *    \text{Penalty} = \min(100, d \times 12)
 *    where d is days delayed. Recent transactions carry up to 3x higher analytical weight.
 * 2. Risk Tier Classification:
 *    - Risk <= 30 => 'Low' (Healthy customer, eligible for higher credit line)
 *    - 30 < Risk <= 60 => 'Medium' (Watchlist, limit expansion frozen)
 *    - Risk > 60 => 'High' (Delinquency alert, cash-on-delivery suggested)
 * 3. Bilingual WhatsApp Reminder Generator: Generates pre-formatted payment reconciliation links.
 */
export class KhataService {
  /**
   * Evaluates historical payment transactions to establish dynamic repayment risk.
   *
   * @param transactions Array of customer credit and payment transactions
   * @returns Risk evaluation summary with numerical score, risk level, on-time ratio, and qualitative reason
   */
  public static computeRiskScore(transactions: KhataTransaction[]): {
    riskScore: number;
    riskLevel: 'Low' | 'Medium' | 'High';
    onTimeRatio: number;
    explanation: string;
  } {
    const paymentTxs = transactions.filter(t => t.type === 'PAYMENT');
    if (paymentTxs.length === 0) {
      // Default initial score
      return {
        riskScore: 25,
        riskLevel: 'Low',
        onTimeRatio: 0.85,
        explanation: 'New customer or insufficient payment cycles recorded.'
      };
    }

    let weightedDelayPoints = 0;
    let totalWeights = 0;
    let onTimeCount = 0;

    // Evaluate in chronological order
    paymentTxs.forEach((tx, idx) => {
      // Linear recency weight: recent transactions get weight up to 1.5, older down to 0.5
      const recencyWeight = 0.5 + (idx / paymentTxs.length);
      const delayDays = tx.daysDelayed || 0;

      if (delayDays === 0) {
        onTimeCount++;
      } else {
        // Penalty scales with delay days: 1-3 days = mild, >7 days = severe
        const delayPenalty = Math.min(100, delayDays * 12);
        weightedDelayPoints += delayPenalty * recencyWeight;
      }
      totalWeights += recencyWeight;
    });

    const calculatedRisk = totalWeights > 0 ? Math.round(weightedDelayPoints / totalWeights) : 15;
    const boundedRisk = Math.min(100, Math.max(5, calculatedRisk));
    const onTimeRatio = Math.round((onTimeCount / paymentTxs.length) * 100) / 100;

    let riskLevel: 'Low' | 'Medium' | 'High' = 'Low';
    if (boundedRisk > 60) riskLevel = 'High';
    else if (boundedRisk > 30) riskLevel = 'Medium';

    const explanation = `Late-payment penalty weighted by recency: ${(1 - onTimeRatio) * 100}% delayed settlement rate.`;

    return {
      riskScore: boundedRisk,
      riskLevel,
      onTimeRatio,
      explanation
    };
  }

  /**
   * Generates wa.me payment reminder link with polite wording in Tamil or English
   */
  public static createReminderWhatsAppUrl(
    customer: KhataCustomer,
    vendor: VendorProfile,
    lang: Language = 'ta'
  ): string {
    const cleanPhone = customer.phone.startsWith('91') ? customer.phone : `91${customer.phone}`;
    const nameToUse = lang === 'ta' && customer.nameTa ? customer.nameTa : customer.name;

    const message = lang === 'ta'
      ? `வணக்கம் ${nameToUse} அவர்களே! ${vendor.name} (${vendor.stallNumber}, ${vendor.marketName}) கடை SanthAI கணக்கிலிருந்து அன்பான நினைவூட்டல்.\n\n` +
        `தங்களின் தற்போதைய காய்கறி பாக்கி தொகை: ₹${customer.totalDue}.\n` +
        `• கூகுள் பே / ஃபோன்பே UPI: ${vendor.upiId}\n` +
        `• கடைக்கு வரும்போதும் நேரடியாக செலுத்தலாம்.\n\n` +
        `சரியான நேரத்தில் செலுத்தி தொடர்ந்து ஆதரவு தருமாறு கேட்டுக்கொள்கிறோம். மிக்க நன்றி!`
      : `Hello ${customer.name}! Friendly payment reminder from ${vendor.name} (${vendor.stallNumber}, ${vendor.marketName}) via SanthAI.\n\n` +
        `Your outstanding produce balance is: Rs ${customer.totalDue}.\n` +
        `• GPay / PhonePe UPI: ${vendor.upiId}\n` +
        `• Or cash payment at the stall.\n\n` +
        `Thank you for your prompt clearing and regular support!`;

    const encoded = encodeURIComponent(message);
    return `https://wa.me/${cleanPhone}?text=${encoded}`;
  }
}
