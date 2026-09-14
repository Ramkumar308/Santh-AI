import { CommodityType, MandiPriceRecord, VendorPricing, TrustScoreBreakdown, DailyStockLog, KhataCustomer } from '../types';

export class PricingEngine {
  /**
   * Computes statistics (Mean, StdDev, Min, Max, Modal) for a commodity across mandis
   */
  public static getMandiStats(records: MandiPriceRecord[], commodity: CommodityType) {
    const relevant = records.filter(r => r.commodity === commodity);
    if (relevant.length === 0) {
      return { mean: 30, stdDev: 4, min: 24, max: 36, modal: 28, count: 0 };
    }

    const prices = relevant.map(r => r.modalPricePerKg);
    const sum = prices.reduce((a, b) => a + b, 0);
    const mean = sum / prices.length;

    // Variance & Standard Deviation
    const variance = prices.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / (prices.length > 1 ? prices.length - 1 : 1);
    const stdDev = Math.max(1.5, Math.sqrt(variance)); // prevent zero div

    const min = Math.min(...relevant.map(r => r.minPricePerKg));
    const max = Math.max(...relevant.map(r => r.maxPricePerKg));

    // Frequency modal
    const freq: Record<number, number> = {};
    let modal = prices[0];
    let maxFreq = 0;
    prices.forEach(p => {
      freq[p] = (freq[p] || 0) + 1;
      if (freq[p] > maxFreq) {
        maxFreq = freq[p];
        modal = p;
      }
    });

    return {
      mean: Math.round(mean * 10) / 10,
      stdDev: Math.round(stdDev * 10) / 10,
      min,
      max,
      modal,
      count: relevant.length
    };
  }

  /**
   * Evaluates vendor's price against mandi distribution using Z-Score
   */
  public static evaluateVendorPrice(
    vendorPrice: number,
    commodity: CommodityType,
    mandiRecords: MandiPriceRecord[]
  ): VendorPricing {
    const stats = this.getMandiStats(mandiRecords, commodity);
    const zScore = (vendorPrice - stats.mean) / stats.stdDev;
    const roundedZ = Math.round(zScore * 100) / 100;

    let isOutlier = false;
    let outlierType: 'none' | 'gouging' | 'undercutting' = 'none';

    // Outlier threshold > +1.8 standard deviations or < -1.8
    if (zScore > 1.8) {
      isOutlier = true;
      outlierType = 'gouging';
    } else if (zScore < -1.8) {
      isOutlier = true;
      outlierType = 'undercutting';
    }

    const fairLow = Math.max(10, Math.round(stats.mean - 1.2 * stats.stdDev));
    const fairHigh = Math.round(stats.mean + 1.4 * stats.stdDev);

    return {
      commodity,
      currentSellingPrice: vendorPrice,
      mandiModalPrice: stats.modal,
      mandiMinPrice: stats.min,
      mandiMaxPrice: stats.max,
      zScore: roundedZ,
      isOutlier,
      outlierType,
      fairPriceRange: [fairLow, fairHigh]
    };
  }

  /**
   * Computes the vendor's composite Trust Score (0-100)
   * Combining:
   * 1. Pricing Fairness (40%)
   * 2. Stock Reliability (30%)
   * 3. Credit Repayment History (30%)
   */
  public static computeTrustScore(
    vendorPrices: Record<CommodityType, number>,
    mandiRecords: MandiPriceRecord[],
    stockLogs: DailyStockLog[],
    khataCustomers: KhataCustomer[]
  ): TrustScoreBreakdown {
    const flags: { textEn: string; textTa: string; type: 'positive' | 'warning' | 'neutral' }[] = [];

    // 1. Pricing Fairness Score (Max 40 points)
    let totalZ = 0;
    let priceItemCount = 0;
    let gougingCount = 0;

    const commodities: CommodityType[] = ['Tomato', 'Onion', 'Potato', 'Brinjal', 'Cabbage', 'Carrot'];

    commodities.forEach(comm => {
      const price = vendorPrices[comm];
      if (price) {
        const evalResult = this.evaluateVendorPrice(price, comm, mandiRecords);
        totalZ += Math.abs(evalResult.zScore);
        priceItemCount++;
        if (evalResult.outlierType === 'gouging') {
          gougingCount++;
        }
      }
    });

    const avgZ = priceItemCount > 0 ? totalZ / priceItemCount : 0.5;
    // Perfect fairness score when avgZ <= 0.8; degrades as z exceeds 1.5
    let pricingFairnessScore = Math.max(10, Math.min(40, Math.round(40 - Math.max(0, avgZ - 0.8) * 18)));

    if (gougingCount > 0) {
      pricingFairnessScore = Math.max(10, pricingFairnessScore - gougingCount * 6);
      flags.push({
        textEn: `${gougingCount} commodity priced significantly above mandi spread (Z > 1.8)`,
        textTa: `${gougingCount} காய்கறி மண்டி விலையை விட மிக அதிகமாக உள்ளது (Z > 1.8)`,
        type: 'warning'
      });
    } else {
      flags.push({
        textEn: 'Fair transparent prices within Tamil Nadu mandi corridor',
        textTa: 'மண்டி விலை அளவுக்குள் நியாயமான விலையிடல்',
        type: 'positive'
      });
    }

    // 2. Stock Reliability Score (Max 30 points)
    // Low waste ratio + low stockout frequency
    const totalReceived = stockLogs.reduce((acc, l) => acc + l.receivedKg, 0);
    const totalWaste = stockLogs.reduce((acc, l) => acc + l.wasteKg, 0);
    const wasteRatio = totalReceived > 0 ? totalWaste / totalReceived : 0.03;

    // Stockout check: days where soldKg reached 100% of receivedKg with zero unsoldKg
    const stockouts = stockLogs.filter(l => l.unsoldKg === 0 && l.wasteKg === 0).length;
    const stockoutRate = stockLogs.length > 0 ? stockouts / stockLogs.length : 0.1;

    let stockReliabilityScore = 30;
    if (wasteRatio > 0.08) stockReliabilityScore -= 8;
    else if (wasteRatio > 0.04) stockReliabilityScore -= 4;

    if (stockoutRate > 0.3) stockReliabilityScore -= 5;

    stockReliabilityScore = Math.max(8, Math.min(30, stockReliabilityScore));

    if (wasteRatio < 0.05) {
      flags.push({
        textEn: `High produce freshness: Only ${(wasteRatio * 100).toFixed(1)}% waste recorded`,
        textTa: `குறைந்த சேதாரம்: வெறும் ${(wasteRatio * 100).toFixed(1)}% காய்கறிகள் மட்டுமே வீண்`,
        type: 'positive'
      });
    }

    // 3. Credit Repayment History (Max 30 points)
    // Measured from customer repayment discipline in Khata
    const totalCustomers = khataCustomers.length;
    const onTimeSum = khataCustomers.reduce((acc, c) => acc + c.onTimePaymentRatio, 0);
    const avgOnTimeRatio = totalCustomers > 0 ? onTimeSum / totalCustomers : 0.8;

    const highRiskCustomers = khataCustomers.filter(c => c.riskLevel === 'High').length;

    let creditRepaymentScore = Math.round(avgOnTimeRatio * 30);
    if (highRiskCustomers > 2) creditRepaymentScore = Math.max(6, creditRepaymentScore - 6);

    if (avgOnTimeRatio >= 0.8) {
      flags.push({
        textEn: `Disciplined credit book: ${(avgOnTimeRatio * 100).toFixed(0)}% prompt customer clearing`,
        textTa: `ஒழுங்கான கடன் வசூல்: ${(avgOnTimeRatio * 100).toFixed(0)}% சரியான நேரத்தில் வசூலாகிறது`,
        type: 'positive'
      });
    }

    const totalScore = Math.min(100, Math.max(20, pricingFairnessScore + stockReliabilityScore + creditRepaymentScore));

    let tier: 'Gold' | 'Silver' | 'Bronze' | 'Needs Review' = 'Silver';
    if (totalScore >= 85) tier = 'Gold';
    else if (totalScore >= 70) tier = 'Silver';
    else if (totalScore >= 55) tier = 'Bronze';
    else tier = 'Needs Review';

    return {
      totalScore,
      tier,
      pricingFairnessScore,
      stockReliabilityScore,
      creditRepaymentScore,
      flags,
      zScoreAvg: Math.round(avgZ * 100) / 100,
      stockoutRatePct: Math.round(stockoutRate * 100),
      onTimeRepaymentPct: Math.round(avgOnTimeRatio * 100)
    };
  }

  /**
   * Computes the wholesale mandi-to-retail pricing bridge, factoring in freight, shrinkage/wastage, and target vendor margin
   */
  public static computeWholesaleToRetailBridge(
    mandiWholesalePerKg: number,
    freightPerKg: number = 2.0,
    shrinkagePct: number = 8.0,
    desiredMarginPct: number = 20.0
  ): {
    mandiWholesalePerKg: number;
    freightPerKg: number;
    shrinkagePct: number;
    desiredMarginPct: number;
    landedBreakEvenPerKg: number;
    suggestedRetailPerKg: number;
    grossMarginPerKg: number;
    profitPer100KgLot: number;
  } {
    // 100kg purchased -> usable kg after shrinkage
    const shrinkageDecimal = Math.max(0, Math.min(0.4, shrinkagePct / 100));
    const usableWeightMultiplier = 1 - shrinkageDecimal;
    
    // Total landed cost for 1kg purchased = Mandi price + Freight
    // True cost per usable sellable kg = (Mandi + Freight) / usableWeightMultiplier
    const landedBreakEvenPerKg = Math.round(((mandiWholesalePerKg + freightPerKg) / (usableWeightMultiplier || 0.9)) * 10) / 10;
    
    // Suggested retail with margin
    const marginDecimal = desiredMarginPct / 100;
    const suggestedRetailPerKg = Math.round(landedBreakEvenPerKg * (1 + marginDecimal));
    const grossMarginPerKg = Math.round((suggestedRetailPerKg - landedBreakEvenPerKg) * 10) / 10;
    
    // Profit per 100kg lot: (100 * usableWeightMultiplier * suggestedRetail) - (100 * (mandiWholesale + freight))
    const totalOutlay = 100 * (mandiWholesalePerKg + freightPerKg);
    const totalRevenue = 100 * usableWeightMultiplier * suggestedRetailPerKg;
    const profitPer100KgLot = Math.round(totalRevenue - totalOutlay);

    return {
      mandiWholesalePerKg,
      freightPerKg,
      shrinkagePct,
      desiredMarginPct,
      landedBreakEvenPerKg,
      suggestedRetailPerKg,
      grossMarginPerKg,
      profitPer100KgLot
    };
  }
}

