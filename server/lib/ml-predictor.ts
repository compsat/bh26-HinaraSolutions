/**
 * WattZup — ML Bill Prediction Engine (Server-Side)
 *
 * Simplified but effective prediction model:
 * 1. BASELINE: Sum of (wattage × hours × quantity × remaining_days × rate)
 * 2. HISTORICAL ADJUSTMENT: actual vs predicted ratio (exponential moving avg)
 * 3. WEATHER ADJUSTMENT: temperature-based AC multiplier
 * 4. TREND DETECTION: 7-day moving average comparison
 */

interface PredictionParams {
  appliances: any[];
  usageLogs: any[];
  ratePerKwh: number;
  currentDayOfMonth: number;
  daysInMonth: number;
  temperature?: number;
}

interface PredictionResult {
  predictedBill: number;
  confidence: { low: number; high: number };
  adjustmentFactors: { historical: number; weather: number; trend: number };
  dailyForecast: { date: string; predictedKwh: number }[];
}

export function predictMonthlyBill(params: PredictionParams): PredictionResult {
  const { appliances, usageLogs, ratePerKwh, currentDayOfMonth, daysInMonth, temperature } = params;
  const daysRemaining = daysInMonth - currentDayOfMonth;

  // 1. BASELINE: expected daily kWh from all active appliances
  let baselineDailyKwh = 0;
  for (const app of appliances) {
    if (!app.is_active) continue;
    const dailyKwh = (app.wattage * app.default_daily_hours * (app.quantity || 1)) / 1000;
    baselineDailyKwh += dailyKwh;
  }

  // 2. HISTORICAL ADJUSTMENT
  let historicalFactor = 1.0;
  if (usageLogs.length >= 7) {
    // Calculate actual daily average from logs
    const logsByDate = new Map<string, number>();
    for (const log of usageLogs) {
      const current = logsByDate.get(log.date) || 0;
      logsByDate.set(log.date, current + Number(log.estimated_kwh || 0));
    }

    const dailyTotals = Array.from(logsByDate.values());
    if (dailyTotals.length > 0) {
      const actualDailyAvg = dailyTotals.reduce((a, b) => a + b, 0) / dailyTotals.length;
      if (baselineDailyKwh > 0) {
        // Exponential moving average: weight recent data more
        const ratio = actualDailyAvg / baselineDailyKwh;
        historicalFactor = 0.7 * ratio + 0.3; // Blend towards 1.0
      }
    }
  }

  // 3. WEATHER ADJUSTMENT (for AC)
  let weatherFactor = 1.0;
  if (temperature !== undefined) {
    const hasAC = appliances.some(a => a.appliance_type === 'ac' && a.is_active);
    if (hasAC) {
      if (temperature > 35) weatherFactor = 1.25;
      else if (temperature > 32) weatherFactor = 1.15;
      else if (temperature > 30) weatherFactor = 1.05;
      else if (temperature < 25) weatherFactor = 0.9;
    }
  }

  // 4. TREND DETECTION
  let trendFactor = 1.0;
  if (usageLogs.length >= 14) {
    const sorted = [...usageLogs].sort((a, b) => a.date.localeCompare(b.date));
    const recent7 = sorted.slice(-7);
    const previous7 = sorted.slice(-14, -7);

    const recentAvg = recent7.reduce((s, l) => s + Number(l.estimated_kwh || 0), 0) / Math.max(recent7.length, 1);
    const previousAvg = previous7.reduce((s, l) => s + Number(l.estimated_kwh || 0), 0) / Math.max(previous7.length, 1);

    if (previousAvg > 0) {
      const trendRatio = recentAvg / previousAvg;
      // Dampen the trend factor to avoid overreaction
      trendFactor = 0.8 + 0.2 * trendRatio;
      trendFactor = Math.max(0.8, Math.min(1.3, trendFactor)); // Clamp
    }
  }

  // Calculate actual kWh used so far this month
  const monthStart = new Date();
  monthStart.setDate(1);
  const monthStartStr = monthStart.toISOString().split('T')[0];

  const thisMonthLogs = usageLogs.filter(l => l.date >= monthStartStr);
  const actualKwhSoFar = thisMonthLogs.reduce((s, l) => s + Number(l.estimated_kwh || 0), 0);

  // Predicted remaining kWh
  const adjustedDailyKwh = baselineDailyKwh * historicalFactor * weatherFactor * trendFactor;
  const predictedRemainingKwh = adjustedDailyKwh * daysRemaining;
  const totalPredictedKwh = actualKwhSoFar + predictedRemainingKwh;
  const predictedBill = totalPredictedKwh * ratePerKwh;

  // Confidence interval (wider with less data)
  const confidenceWidth = usageLogs.length < 7 ? 0.25 : usageLogs.length < 14 ? 0.15 : 0.1;

  // Daily forecast
  const dailyForecast: { date: string; predictedKwh: number }[] = [];
  const today = new Date();
  for (let i = 1; i <= daysRemaining; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    dailyForecast.push({
      date: d.toISOString().split('T')[0],
      predictedKwh: Math.round(adjustedDailyKwh * 100) / 100,
    });
  }

  return {
    predictedBill: Math.round(predictedBill * 100) / 100,
    confidence: {
      low: Math.round(predictedBill * (1 - confidenceWidth) * 100) / 100,
      high: Math.round(predictedBill * (1 + confidenceWidth) * 100) / 100,
    },
    adjustmentFactors: {
      historical: Math.round(historicalFactor * 1000) / 1000,
      weather: Math.round(weatherFactor * 1000) / 1000,
      trend: Math.round(trendFactor * 1000) / 1000,
    },
    dailyForecast,
  };
}
