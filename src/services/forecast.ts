import { CommodityType, DailyStockLog, DemandForecast, BulkOrderBoardItem } from '../types';

/**
 * ForecastEngine: Time-series predictive inventory modeling engine for informal produce merchants.
 *
 * Implements:
 * 1. Single Exponential Smoothing (Brown's SES Model):
 *    F_{t+1} = \alpha Y_t + (1 - \alpha) F_t
 *    where \alpha \in [0, 1] is the smoothing constant (default: 0.45),
 *    Y_t is realized retail walk-in demand, and F_t is prior forecast.
 * 2. Pre-committed Institutional Demand Aggregation: Separates volatile retail footfall
 *    from deterministic recurring B2B mess/canteen/hostel commitments.
 * 3. Error Margin & Trend Vector Analysis: Computes Mean Absolute Deviation (MAD) to estimate buffer stock.
 */
export class ForecastEngine {
  /**
   * Generates next-day recommended procurement quantity for a specific commodity.
   *
   * @param commodity Produce item being evaluated (e.g. Tomato, Onion)
   * @param logs Historical daily stock and sales logs recorded by vendor
   * @param bulkOrders Pre-arranged bulk institutional contract orders
   * @param alpha Smoothing parameter (0.0 to 1.0; 0.45 balances responsiveness with noise reduction)
   * @returns Comprehensive DemandForecast model including walk-in projection, bulk orders, margin of error, and bilingual advice
   */
  public static calculateForecast(
    commodity: CommodityType,
    logs: DailyStockLog[],
    bulkOrders: BulkOrderBoardItem[],
    alpha: number = 0.45
  ): DemandForecast {
    // Filter and sort logs chronologically
    const commodityLogs = logs
      .filter(l => l.commodity === commodity)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Calculate pre-committed recurring bulk orders from institutions claimed by the vendor
    const precommittedBulkKg = bulkOrders
      .filter(o => o.commodity === commodity && o.claimedByVendor)
      .reduce((sum, o) => sum + o.dailyRequirementKg, 0);

    if (commodityLogs.length === 0) {
      // Baseline defaults if no history yet
      const fallbackWalkIn = 30;
      return {
        commodity,
        walkInForecastKg: fallbackWalkIn,
        precommittedBulkKg,
        totalForecastKg: fallbackWalkIn + precommittedBulkKg,
        alpha,
        method: 'exponential_smoothing',
        historyDays: 0,
        errorMarginKg: 4,
        lastActualKg: 30,
        trend: 'steady',
        simpleAdviceEn: `Order around ${fallbackWalkIn + precommittedBulkKg} kg tomorrow (${fallbackWalkIn} kg walk-in + ${precommittedBulkKg} kg bulk orders).`,
        simpleAdviceTa: `நாளை ${fallbackWalkIn + precommittedBulkKg} கிலோ வாங்கவும் (${fallbackWalkIn} கிலோ சில்லறை + ${precommittedBulkKg} கிலோ மொத்த ஆர்டர்).`,
        mathFormula: 'F_{t+1} = \\alpha Y_t + (1-\\alpha) F_t',
        calculationBreakdown: [{ label: 'Baseline (No logs)', value: `${fallbackWalkIn} kg` }]
      };
    }

    // Effective daily walk-in demand = soldKg
    const actualDemands = commodityLogs.map(l => l.soldKg);
    const lastActual = actualDemands[actualDemands.length - 1];

    // Compute Exponential Smoothing iteratively across logged days
    let forecast = actualDemands[0];
    const forecastHistory: number[] = [forecast];
    const errors: number[] = [];

    for (let i = 1; i < actualDemands.length; i++) {
      const prevActual = actualDemands[i - 1];
      forecast = alpha * prevActual + (1 - alpha) * forecast;
      forecastHistory.push(forecast);
      errors.push(Math.abs(actualDemands[i] - forecast));
    }

    // Next day walk-in forecast
    const nextDayWalkInRaw = alpha * lastActual + (1 - alpha) * forecast;
    const walkInForecastKg = Math.max(5, Math.round(nextDayWalkInRaw));

    // Calculate Mean Absolute Deviation (MAD) for error margin
    const mad = errors.length > 0
      ? errors.reduce((s, e) => s + e, 0) / errors.length
      : 2.5;
    const errorMarginKg = Math.max(1, Math.round(mad * 1.25)); // 80% confidence interval

    const totalForecastKg = walkInForecastKg + precommittedBulkKg;

    // Trend determination
    const trend: 'up' | 'down' | 'steady' =
      walkInForecastKg > lastActual + 2 ? 'up' : walkInForecastKg < lastActual - 2 ? 'down' : 'steady';

    // Simple advice text
    const simpleAdviceEn = precommittedBulkKg > 0
      ? `Buy ${totalForecastKg} kg tomorrow: ${walkInForecastKg} kg for walk-in buyers + ${precommittedBulkKg} kg committed for institutional orders.`
      : `Buy ${walkInForecastKg} kg tomorrow for regular walk-in buyers (safe margin ±${errorMarginKg} kg).`;

    const simpleAdviceTa = precommittedBulkKg > 0
      ? `நாளை ${totalForecastKg} கிலோ வாங்கவும்: ${walkInForecastKg} கிலோ சில்லறை விற்பனைக்கு + ${precommittedBulkKg} கிலோ முன்கூட்டிய மொத்த ஆர்டருக்கு.`
      : `நாளை ${walkInForecastKg} கிலோ வாங்க பரிந்துரைக்கப்படுகிறது (மாறுபடும் அளவு ±${errorMarginKg} கிலோ).`;

    // Mathematical breakdown for Technical View
    const calculationBreakdown = [
      { label: 'Smoothing Constant (α)', value: alpha.toFixed(2) },
      { label: "Yesterday's Actual Sold (Y_t)", value: `${lastActual} kg` },
      { label: "Previous Forecast (F_t)", value: `${Math.round(forecast)} kg` },
      {
        label: 'Walk-in Demand F_{t+1}',
        value: `${(alpha * lastActual).toFixed(1)} + ${( (1 - alpha) * forecast ).toFixed(1)} = ${walkInForecastKg} kg`
      },
      { label: 'Mean Absolute Deviation (MAD)', value: `±${mad.toFixed(1)} kg` },
      { label: 'Pre-committed Bulk Orders (ResQ)', value: `+${precommittedBulkKg} kg` },
      { label: 'Total Recommended Order Quantity', value: `${totalForecastKg} kg` }
    ];

    return {
      commodity,
      walkInForecastKg,
      precommittedBulkKg,
      totalForecastKg,
      alpha,
      method: 'exponential_smoothing',
      historyDays: commodityLogs.length,
      errorMarginKg,
      lastActualKg: lastActual,
      trend,
      simpleAdviceEn,
      simpleAdviceTa,
      mathFormula: `F_{t+1} = ${alpha} \\cdot Y_t + ${(1 - alpha).toFixed(2)} \\cdot F_t + \\text{Bulk}`,
      calculationBreakdown
    };
  }

  /**
   * Optional 4-day Weighted Moving Average
   * WMA = (w1*Y_t + w2*Y_{t-1} + w3*Y_{t-2} + w4*Y_{t-3}) / sum(w)
   */
  public static calculateWMA(logs: DailyStockLog[], weights: number[] = [0.4, 0.3, 0.2, 0.1]): number {
    const actuals = logs.map(l => l.soldKg);
    if (actuals.length === 0) return 30;
    const recent = actuals.slice(-weights.length).reverse();
    let weightSum = 0;
    let valSum = 0;
    for (let i = 0; i < recent.length; i++) {
      const w = weights[i] || 0.1;
      valSum += recent[i] * w;
      weightSum += w;
    }
    return Math.round(valSum / (weightSum || 1));
  }
}
