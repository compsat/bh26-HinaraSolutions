import { Router } from 'express';
import { supabaseAdmin } from '../lib/supabase-admin';
import * as gemini from '../lib/gemini';
import { predictMonthlyBill } from '../lib/ml-predictor';
import type { AuthRequest } from '../middleware/auth';
import { ConsumptionEngine } from '../lib/consumptionEngine';

const router = Router();

// POST /api/ai/generate-insights
router.post('/generate-insights', async (req: AuthRequest, res) => {
  try {
    const userId = req.userId || req.body.userId;
    if (!userId) return res.status(400).json({ error: 'userId required' });

    // Fetch user data
    const [appRes, logRes, rateRes, profileRes] = await Promise.all([
      supabaseAdmin.from('appliances').select('*').eq('user_id', userId),
      supabaseAdmin.from('usage_logs').select('*').eq('user_id', userId)
        .gte('date', new Date(new Date().setDate(1)).toISOString().split('T')[0])
        .order('date', { ascending: false }).limit(50),
      supabaseAdmin.from('energy_rates').select('rate_per_kwh').order('effective_date', { ascending: false }).limit(1),
      supabaseAdmin.from('profiles').select('monthly_budget').eq('id', userId).single(),
    ]);

    const appliances = appRes.data || [];
    const usageLogs = logRes.data || [];
    const ratePerKwh = rateRes.data?.[0]?.rate_per_kwh || 13.8161;
    const monthlyBudget = profileRes.data?.monthly_budget || 4000;

    // Calculate costs
    const totalKwh = usageLogs.reduce((s: number, l: any) => s + Number(l.estimated_kwh || 0), 0);
    const totalCostSoFar = totalKwh * ratePerKwh;

    const now = new Date();
    const daysElapsed = now.getDate();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const dailyAvg = daysElapsed > 0 ? totalCostSoFar / daysElapsed : 0;
    const projectedBill = dailyAvg * daysInMonth;

    // Generate insights via Gemini
    const insights = await gemini.generateInsights({
      appliances,
      usageLogs,
      ratePerKwh,
      monthlyBudget,
      totalCostSoFar,
      projectedBill,
    });

    // Store insights in database
    const insightRows = insights.map((ins: any) => ({
      user_id: userId,
      insight_type: ins.insight_type || 'optimization',
      title: ins.title || 'Energy Tip',
      description: ins.description || '',
      potential_savings: ins.potential_savings || null,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    }));

    if (insightRows.length > 0) {
      await supabaseAdmin.from('ai_insights').insert(insightRows);
    }

    // Return the stored insights
    const { data: stored } = await supabaseAdmin
      .from('ai_insights')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);

    res.json(stored || insightRows);
  } catch (err: any) {
    console.error('generate-insights error:', err);
    res.status(500).json({ error: err.message || 'Failed to generate insights' });
  }
});

// POST /api/ai/chat
router.post('/chat', async (req: AuthRequest, res) => {
  try {
    const userId = req.userId || req.body.userId;
    const { message, history } = req.body;

    if (!userId || !message) {
      return res.status(400).json({ error: 'userId and message required' });
    }

    // Fetch context
    const [appRes, rateRes, profileRes] = await Promise.all([
      supabaseAdmin.from('appliances').select('*').eq('user_id', userId),
      supabaseAdmin.from('energy_rates').select('rate_per_kwh').order('effective_date', { ascending: false }).limit(1),
      supabaseAdmin.from('profiles').select('monthly_budget').eq('id', userId).single(),
    ]);

    const logRes = await supabaseAdmin.from('usage_logs').select('*').eq('user_id', userId)
      .gte('date', new Date(new Date().setDate(1)).toISOString().split('T')[0]);

    const appliances = appRes.data || [];
    const usageLogs = logRes.data || [];
    const ratePerKwh = rateRes.data?.[0]?.rate_per_kwh || 13.8161;
    const monthlyBudget = profileRes.data?.monthly_budget || 4000;

    const totalKwh = usageLogs.reduce((s: number, l: any) => s + Number(l.estimated_kwh || 0), 0);
    const totalCostSoFar = totalKwh * ratePerKwh;
    const now = new Date();
    const daysElapsed = now.getDate();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const projectedBill = daysElapsed > 0 ? (totalCostSoFar / daysElapsed) * daysInMonth : 0;

    const response = await gemini.chatWithAI(message, {
      appliances,
      usageLogs,
      ratePerKwh,
      monthlyBudget,
      totalCostSoFar,
      projectedBill,
    }, history || []);

    res.json({ response });
  } catch (err: any) {
    console.error('chat error:', err);
    res.status(500).json({ error: err.message || 'Chat failed' });
  }
});

// GET /api/ai/predict
router.get('/predict', async (req: AuthRequest, res) => {
  try {
    const userId = (req.userId || req.query.userId) as string;
    if (!userId) return res.status(400).json({ error: 'userId required' });

    const [appRes, logRes, rateRes] = await Promise.all([
      supabaseAdmin.from('appliances').select('*').eq('user_id', userId),
      supabaseAdmin.from('usage_logs').select('*').eq('user_id', userId)
        .gte('date', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0])
        .order('date'),
      supabaseAdmin.from('energy_rates').select('rate_per_kwh').order('effective_date', { ascending: false }).limit(1),
    ]);

    const now = new Date();
    const prediction = predictMonthlyBill({
      appliances: appRes.data || [],
      usageLogs: logRes.data || [],
      ratePerKwh: rateRes.data?.[0]?.rate_per_kwh || 13.8161,
      currentDayOfMonth: now.getDate(),
      daysInMonth: new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate(),
    });

    res.json(prediction);
  } catch (err: any) {
    console.error('predict error:', err);
    res.status(500).json({ error: err.message || 'Prediction failed' });
  }
});

// GET /api/ai/enhanced-insights — full monthly estimate + bill breakdown + temperature + analytics
router.get('/enhanced-insights', async (req: AuthRequest, res) => {
  try {
    const userId = (req.userId || req.query.userId) as string;
    if (!userId) return res.status(400).json({ error: 'userId required' });

    const now = new Date();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const daysElapsed = now.getDate();
    const daysRemaining = daysInMonth - daysElapsed;
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0];
    const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0];

    // Fetch all data
    const [appRes, logRes, prevLogRes, rateRes, rateHistRes, profileRes] = await Promise.all([
      supabaseAdmin.from('appliances').select('*').eq('user_id', userId),
      supabaseAdmin.from('usage_logs').select('*').eq('user_id', userId)
        .gte('date', monthStart).order('date'),
      supabaseAdmin.from('usage_logs').select('*').eq('user_id', userId)
        .gte('date', prevMonthStart).lte('date', prevMonthEnd),
      supabaseAdmin.from('energy_rates').select('*').order('effective_date', { ascending: false }).limit(1),
      supabaseAdmin.from('energy_rates').select('*').order('effective_date', { ascending: false }).limit(6),
      supabaseAdmin.from('profiles').select('monthly_budget, location').eq('id', userId).single(),
    ]);

    const appliances = appRes.data || [];
    const usageLogs = logRes.data || [];
    const prevLogs = prevLogRes.data || [];
    const ratePerKwh = rateRes.data?.[0]?.rate_per_kwh || 13.8161;
    const monthlyBudget = profileRes.data?.monthly_budget || 4000;
    const location = profileRes.data?.location || 'Metro Manila';

    // ── MONTHLY ESTIMATE ──
    const actualKwhSoFar = usageLogs.reduce((s: number, l: any) => s + Number(l.estimated_kwh || 0), 0);
    const dailyAvgKwh = daysElapsed > 0 ? actualKwhSoFar / daysElapsed : 0;
    const estimatedKwh = dailyAvgKwh * daysInMonth;
    const estimatedBill = estimatedKwh * ratePerKwh;

    // ── PREDICTION WITH ML ──
    const prediction = predictMonthlyBill({
      appliances,
      usageLogs,
      ratePerKwh,
      currentDayOfMonth: daysElapsed,
      daysInMonth,
    });

    // ── MERALCO BILL BREAKDOWN ──
    // Based on actual Meralco March 2026 rate structure
    const generationRate = 7.8607;       // ~56.9% of total
    const transmissionRate = 1.3248;     // ~9.6%
    const distributionRate = 1.7937;     // ~13.0%
    const subsidiesRate = 0.3228;        // ~2.3% (RE, missionary electrification, lifeline)
    const govTaxesRate = 2.5141;         // ~18.2% (system loss, VAT, UC, FIT-All)
    const totalRateComposed = generationRate + transmissionRate + distributionRate + subsidiesRate + govTaxesRate;

    const billBreakdown = {
      generation: Math.round(estimatedKwh * generationRate * 100) / 100,
      transmission: Math.round(estimatedKwh * transmissionRate * 100) / 100,
      distribution: Math.round(estimatedKwh * distributionRate * 100) / 100,
      subsidies: Math.round(estimatedKwh * subsidiesRate * 100) / 100,
      governmentTaxes: Math.round(estimatedKwh * govTaxesRate * 100) / 100,
      totalRate: ratePerKwh,
      totalBill: Math.round(estimatedBill * 100) / 100,
      totalKwh: Math.round(estimatedKwh * 100) / 100,
    };

    // ── TOP CONSUMERS ──
    const applianceUsage: Record<string, { name: string; type: string; kwh: number }> = {};
    for (const app of appliances) {
      if (!app.is_active) continue;
      const appLogs = usageLogs.filter((l: any) => l.appliance_id === app.id);
      const appKwh = appLogs.length > 0
        ? appLogs.reduce((s: number, l: any) => s + Number(l.estimated_kwh || 0), 0)
        : (app.wattage * app.default_daily_hours * (app.quantity || 1) * daysElapsed) / 1000;
      
      applianceUsage[app.id] = {
        name: app.custom_name || app.appliance_type,
        type: app.appliance_type,
        kwh: appKwh,
      };
    }

    const totalAppKwh = Object.values(applianceUsage).reduce((s, a) => s + a.kwh, 0) || 1;
    const topConsumers = Object.values(applianceUsage)
      .sort((a, b) => b.kwh - a.kwh)
      .slice(0, 5)
      .map(a => ({
        name: a.name,
        type: a.type,
        kwhPercent: Math.round((a.kwh / totalAppKwh) * 100),
        monthlyCost: Math.round((a.kwh / daysElapsed) * daysInMonth * ratePerKwh * 100) / 100,
      }));

    // ── TEMPERATURE INSIGHT ──
    let temperatureInsight = null;
    try {
      // Fetch current temperature for the user's location (Philippines)
      const weatherRes = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=14.5995&longitude=120.9842&current=temperature_2m,apparent_temperature&daily=temperature_2m_max,temperature_2m_min&timezone=Asia/Manila&forecast_days=7`
      );
      if (weatherRes.ok) {
        const weather = await weatherRes.json();
        const currentTemp = weather.current?.temperature_2m || 32;
        const avgMax = weather.daily?.temperature_2m_max
          ? weather.daily.temperature_2m_max.reduce((s: number, t: number) => s + t, 0) / weather.daily.temperature_2m_max.length
          : 33;

        const hasAC = appliances.some((a: any) => a.appliance_type === 'ac' && a.is_active);
        let acImpactPercent = 0;
        let acExtraCost = 0;
        let heatIndex = 'Moderate';
        let recommendation = 'Normal usage expected.';

        if (currentTemp >= 35) {
          heatIndex = 'Extreme Heat';
          acImpactPercent = hasAC ? 25 : 0;
          recommendation = hasAC
            ? 'Extreme heat detected! AC usage will spike 20-30%. Set to 25°C and use fans to circulate cool air. Expect higher bills this period.'
            : 'Extreme heat — consider using electric fans on high settings during peak hours. Stay hydrated!';
        } else if (currentTemp >= 32) {
          heatIndex = 'Hot';
          acImpactPercent = hasAC ? 15 : 0;
          recommendation = hasAC
            ? 'Hot weather ahead. Your AC will use ~15% more than usual. Pre-cool rooms before peak heat (12-3PM) then switch to fan mode.'
            : 'Hot days ahead — electric fan usage may increase. Use ventilation and close curtains during peak sun.';
        } else if (currentTemp >= 28) {
          heatIndex = 'Warm';
          acImpactPercent = hasAC ? 5 : 0;
          recommendation = 'Comfortable weather. Good time to reduce AC hours and rely on fans where possible.';
        } else {
          heatIndex = 'Cool';
          acImpactPercent = hasAC ? -10 : 0;
          recommendation = 'Cool weather — great opportunity to save! Reduce or turn off AC completely and open windows.';
        }

        if (hasAC) {
          const acApp = appliances.find((a: any) => a.appliance_type === 'ac');
          const acDailyKwh = acApp ? (acApp.wattage * acApp.default_daily_hours * (acApp.quantity || 1)) / 1000 : 8.952;
          acExtraCost = Math.round(acDailyKwh * (acImpactPercent / 100) * daysRemaining * ratePerKwh * 100) / 100;
        }

        temperatureInsight = {
          currentTemp: Math.round(currentTemp * 10) / 10,
          avgTemp: Math.round(avgMax * 10) / 10,
          heatIndex,
          acImpactPercent,
          acExtraCost: Math.abs(acExtraCost),
          recommendation,
        };
      }
    } catch (err) {
      console.log('Temperature fetch failed:', (err as Error).message);
    }

    // ── COMPARISON VS LAST MONTH ──
    const prevMonthKwh = prevLogs.reduce((s: number, l: any) => s + Number(l.estimated_kwh || 0), 0);
    const prevMonthCost = prevMonthKwh * ratePerKwh;
    const kwhChange = estimatedKwh - prevMonthKwh;
    const costChange = estimatedBill - prevMonthCost;

    // ── SAVINGS POTENTIAL ──
    const savingsPotential = Math.max(0, estimatedBill - monthlyBudget);

    // ── CONFIDENCE INTERVAL ──
    const confidenceWidth = usageLogs.length < 7 ? 0.25 : usageLogs.length < 14 ? 0.15 : 0.1;

    const monthlyEstimate = {
      estimatedKwh: Math.round(estimatedKwh * 100) / 100,
      estimatedBill: Math.round(estimatedBill * 100) / 100,
      confidenceLow: Math.round(estimatedBill * (1 - confidenceWidth) * 100) / 100,
      confidenceHigh: Math.round(estimatedBill * (1 + confidenceWidth) * 100) / 100,
      breakdown: billBreakdown,
      topConsumers,
      temperatureImpact: temperatureInsight,
      comparisonVsLastMonth: {
        kwhChange: Math.round(kwhChange * 100) / 100,
        costChange: Math.round(costChange * 100) / 100,
        direction: kwhChange > 5 ? 'up' : kwhChange < -5 ? 'down' : 'same' as 'up' | 'down' | 'same',
      },
      dailyAvgKwh: Math.round(dailyAvgKwh * 100) / 100,
      dailyAvgCost: Math.round(dailyAvgKwh * ratePerKwh * 100) / 100,
      daysRemaining,
      savingsPotential: Math.round(savingsPotential * 100) / 100,
    };

    res.json({ monthlyEstimate, prediction });
  } catch (err: any) {
    console.error('enhanced-insights error:', err);
    res.status(500).json({ error: err.message || 'Failed to get enhanced insights' });
  }
});

// POST /api/ai/submit-bill — user inputs their actual Meralco bill for comparison
router.post('/submit-bill', async (req: AuthRequest, res) => {
  try {
    const userId = req.userId || req.body.userId;
    const { billingMonth, actualKwh, actualAmount } = req.body;

    if (!userId || !billingMonth || actualAmount === undefined) {
      return res.status(400).json({ error: 'userId, billingMonth (YYYY-MM), and actualAmount required' });
    }

    // Get what WattZup estimated for that month
    const monthStart = `${billingMonth}-01`;
    const monthEndDate = new Date(parseInt(billingMonth.split('-')[0]), parseInt(billingMonth.split('-')[1]), 0);
    const monthEnd = monthEndDate.toISOString().split('T')[0];
    const daysInMonth = monthEndDate.getDate();

    const [logRes, rateRes] = await Promise.all([
      supabaseAdmin.from('usage_logs').select('estimated_kwh').eq('user_id', userId)
        .gte('date', monthStart).lte('date', monthEnd),
      supabaseAdmin.from('energy_rates').select('rate_per_kwh').order('effective_date', { ascending: false }).limit(1),
    ]);

    const ratePerKwh = rateRes.data?.[0]?.rate_per_kwh || 13.8161;
    const loggedKwh = (logRes.data || []).reduce((s: number, l: any) => s + Number(l.estimated_kwh || 0), 0);

    // If user didn't log much, estimate from appliances
    let ourEstimatedKwh = loggedKwh;
    if (loggedKwh < 1) {
      const { data: appliances } = await supabaseAdmin.from('appliances').select('*').eq('user_id', userId);
      ourEstimatedKwh = (appliances || []).reduce((s: number, a: any) => {
        if (!a.is_active) return s;
        return s + (a.wattage * a.default_daily_hours * (a.quantity || 1) * daysInMonth) / 1000;
      }, 0);
    }

    const ourEstimatedAmount = ourEstimatedKwh * ratePerKwh;

    // Calculate accuracy
    const actualAmt = Number(actualAmount);
    const amountDiff = ourEstimatedAmount - actualAmt;
    const accuracyPercent = actualAmt > 0
      ? Math.round(Math.max(0, (1 - Math.abs(amountDiff) / actualAmt)) * 1000) / 10
      : 0;

    const actualKwhVal = actualKwh ? Number(actualKwh) : (actualAmt / ratePerKwh);
    const kwhDiff = ourEstimatedKwh - actualKwhVal;

    // Upsert into meralco_bills
    const { data, error } = await supabaseAdmin
      .from('meralco_bills')
      .upsert({
        user_id: userId,
        billing_month: billingMonth,
        actual_kwh: Math.round(actualKwhVal * 100) / 100,
        actual_amount: Math.round(actualAmt * 100) / 100,
        our_estimated_kwh: Math.round(ourEstimatedKwh * 100) / 100,
        our_estimated_amount: Math.round(ourEstimatedAmount * 100) / 100,
        accuracy_percent: accuracyPercent,
        kwh_difference: Math.round(kwhDiff * 100) / 100,
        amount_difference: Math.round(amountDiff * 100) / 100,
      }, { onConflict: 'user_id,billing_month' })
      .select()
      .single();

    if (error) throw error;

    res.json({
      ...data,
      message: accuracyPercent >= 90
        ? `Great news! Our estimate was ${accuracyPercent}% accurate! 🎯`
        : accuracyPercent >= 75
        ? `Our estimate was ${accuracyPercent}% accurate. We're learning from your data to improve! ⚡`
        : `Our estimate was ${accuracyPercent}% accurate. Keep logging daily usage for better predictions! 📊`,
    });
  } catch (err: any) {
    console.error('submit-bill error:', err);
    res.status(500).json({ error: err.message || 'Failed to submit bill' });
  }
});

// GET /api/ai/bill-accuracy — get accuracy history and current month estimate
router.get('/bill-accuracy', async (req: AuthRequest, res) => {
  try {
    const userId = (req.userId || req.query.userId) as string;
    if (!userId) return res.status(400).json({ error: 'userId required' });

    // Get bill history
    const { data: bills } = await supabaseAdmin
      .from('meralco_bills')
      .select('*')
      .eq('user_id', userId)
      .order('billing_month', { ascending: false })
      .limit(12);

    const history = bills || [];

    // Calculate average accuracy
    const withAccuracy = history.filter((b: any) => b.accuracy_percent > 0);
    const avgAccuracy = withAccuracy.length > 0
      ? Math.round(withAccuracy.reduce((s: number, b: any) => s + b.accuracy_percent, 0) / withAccuracy.length * 10) / 10
      : 0;

    // Determine trend
    let trend: 'improving' | 'declining' | 'stable' | 'no_data' = 'no_data';
    if (withAccuracy.length >= 2) {
      const recent = withAccuracy.slice(0, Math.ceil(withAccuracy.length / 2));
      const older = withAccuracy.slice(Math.ceil(withAccuracy.length / 2));
      const recentAvg = recent.reduce((s: number, b: any) => s + b.accuracy_percent, 0) / recent.length;
      const olderAvg = older.reduce((s: number, b: any) => s + b.accuracy_percent, 0) / older.length;
      if (recentAvg > olderAvg + 2) trend = 'improving';
      else if (recentAvg < olderAvg - 2) trend = 'declining';
      else trend = 'stable';
    }

    // Current month estimate
    const now = new Date();
    const currentBillingMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const daysElapsed = now.getDate();
    const monthStart = `${currentBillingMonth}-01`;

    const [logRes, rateRes, appRes] = await Promise.all([
      supabaseAdmin.from('usage_logs').select('estimated_kwh').eq('user_id', userId).gte('date', monthStart),
      supabaseAdmin.from('energy_rates').select('rate_per_kwh').order('effective_date', { ascending: false }).limit(1),
      supabaseAdmin.from('appliances').select('*').eq('user_id', userId),
    ]);

    const ratePerKwh = rateRes.data?.[0]?.rate_per_kwh || 13.8161;
    const loggedKwh = (logRes.data || []).reduce((s: number, l: any) => s + Number(l.estimated_kwh || 0), 0);

    let estimatedKwh = loggedKwh;
    if (daysElapsed > 0 && loggedKwh > 0) {
      estimatedKwh = (loggedKwh / daysElapsed) * daysInMonth;
    } else {
      estimatedKwh = (appRes.data || []).reduce((s: number, a: any) => {
        if (!a.is_active) return s;
        return s + (a.wattage * a.default_daily_hours * (a.quantity || 1) * daysInMonth) / 1000;
      }, 0);
    }

    res.json({
      currentMonth: {
        estimated: Math.round(estimatedKwh * ratePerKwh * 100) / 100,
        estimatedKwh: Math.round(estimatedKwh * 100) / 100,
        billingMonth: currentBillingMonth,
      },
      history,
      avgAccuracy,
      trend,
    });
  } catch (err: any) {
    console.error('bill-accuracy error:', err);
    res.status(500).json({ error: err.message || 'Failed to get accuracy' });
  }
});


router.post('/submit-bill', async (req, res) => {
  const { userId, billingMonth, actualKwh, actualAmount } = req.body;

  try {
    // 1. Get our system's estimate for that specific month
    const estimate = await ConsumptionEngine.getEnhancedEstimate(userId);
    const { data: rateData } = await supabaseAdmin.from('energy_rates').select('rate_per_kwh').order('effective_date', { ascending: false }).limit(1).single();
    const rate = rateData?.rate_per_kwh || 12.0;

    const ourEstimatedAmount = estimate.estimatedKwh * rate;
    const diff = actualAmount - ourEstimatedAmount;
    const accuracy = Math.max(0, 100 - Math.abs((diff / actualAmount) * 100));

    // 2. Save to Calibration Table
    const { data, error } = await supabaseAdmin.from('meralco_bills').upsert({
      user_id: userId,
      billing_month: billingMonth,
      actual_kwh: actualKwh,
      actual_amount: actualAmount,
      our_estimated_amount: ourEstimatedAmount,
      accuracy_percent: Math.round(accuracy),
      amount_difference: Math.round(diff)
    }).select().single();

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to calibrate bill' });
  }
});

// GET /api/ai/enhanced-insights - For the UI Hero Section
router.get('/enhanced-insights', async (req, res) => {
  const userId = req.query.userId as string;
  const estimate = await ConsumptionEngine.getEnhancedEstimate(userId);
  const { data: rateData } = await supabaseAdmin.from('energy_rates').select('rate_per_kwh').order('effective_date', { ascending: false }).limit(1).single();
  
  const rate = rateData?.rate_per_kwh || 12.0;
  
  res.json({
    monthlyEstimate: {
      estimatedBill: estimate.estimatedKwh * rate,
      estimatedKwh: estimate.estimatedKwh,
      daysRemaining: estimate.daysRemaining,
      dailyAvgKwh: estimate.dailyAvgKwh,
      dailyAvgCost: estimate.dailyAvgKwh * rate
    }
  });
});

export default router;
