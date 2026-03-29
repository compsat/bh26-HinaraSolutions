import { Router } from 'express';
import { supabaseAdmin } from '../lib/supabase-admin';
import * as gemini from '../lib/gemini';
import { predictMonthlyBill } from '../lib/ml-predictor';
import type { AuthRequest } from '../middleware/auth';
import { ConsumptionEngine } from '../lib/ConsumptionEngine';

const router = Router();

// ============================================================
// INSIGHTS & CHAT
// ============================================================

// POST /api/ai/generate-insights
// This function was created using Generative AI
router.post('/generate-insights', async (req: AuthRequest, res) => {
  try {
    const userId = req.userId || req.body.userId;
    if (!userId) return res.status(400).json({ error: 'userId required' });

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

    const totalKwh = usageLogs.reduce((s: number, l: any) => s + Number(l.estimated_kwh || 0), 0);
    const totalCostSoFar = totalKwh * ratePerKwh;

    const now = new Date();
    const daysElapsed = now.getDate();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const dailyAvg = daysElapsed > 0 ? totalCostSoFar / daysElapsed : 0;
    const projectedBill = dailyAvg * daysInMonth;

    const insights = await gemini.generateInsights({
      appliances,
      usageLogs,
      ratePerKwh,
      monthlyBudget,
      totalCostSoFar,
      projectedBill,
    });

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
// This function was created using Generative AI
router.post('/chat', async (req: AuthRequest, res) => {
  try {
    const userId = req.userId || req.body.userId;
    const { message, history } = req.body;

    if (!userId || !message) {
      return res.status(400).json({ error: 'userId and message required' });
    }

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

// ============================================================
// ENHANCED ESTIMATOR & BILL ACCURACY
// ============================================================

// GET /api/ai/enhanced-insights — full monthly estimate + logic for toggles
// This function was created using Generative AI
router.get('/enhanced-insights', async (req: AuthRequest, res) => {
  try {
    const userId = (req.userId || req.query.userId) as string;
    const isPreview = req.query.preview === 'true'; 

    if (!userId) return res.status(400).json({ error: 'userId required' });

    // 1. Get calibrated estimate from Consumption Engine
    const estimate = await ConsumptionEngine.getEnhancedEstimate(userId, isPreview);

    // 2. Fetch context data for supplementary UI info
    const now = new Date();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const daysElapsed = now.getDate();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0];
    const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0];

    const [appRes, logRes, prevLogRes, rateRes, profileRes] = await Promise.all([
      supabaseAdmin.from('appliances').select('*').eq('user_id', userId),
      supabaseAdmin.from('usage_logs').select('*').eq('user_id', userId).gte('date', monthStart),
      supabaseAdmin.from('usage_logs').select('*').eq('user_id', userId).gte('date', prevMonthStart).lte('date', prevMonthEnd),
      supabaseAdmin.from('energy_rates').select('*').order('effective_date', { ascending: false }).limit(1),
      supabaseAdmin.from('profiles').select('monthly_budget, location').eq('id', userId).single(),
    ]);

    const appliances = appRes.data || [];
    const usageLogs = logRes.data || [];
    const prevLogs = prevLogRes.data || [];
    const ratePerKwh = rateRes.data?.[0]?.rate_per_kwh || 13.8161;
    const monthlyBudget = profileRes.data?.monthly_budget || 4000;

    const estimatedBill = estimate.estimatedKwh * ratePerKwh;

    // ── MERALCO BILL BREAKDOWN ──
    const generationRate = 7.8607;
    const transmissionRate = 1.3248;
    const distributionRate = 1.7937;
    const subsidiesRate = 0.3228;
    const govTaxesRate = 2.5141;

    const billBreakdown = {
      generation: Math.round(estimate.estimatedKwh * generationRate * 100) / 100,
      transmission: Math.round(estimate.estimatedKwh * transmissionRate * 100) / 100,
      distribution: Math.round(estimate.estimatedKwh * distributionRate * 100) / 100,
      subsidies: Math.round(estimate.estimatedKwh * subsidiesRate * 100) / 100,
      governmentTaxes: Math.round(estimate.estimatedKwh * govTaxesRate * 100) / 100,
      totalRate: ratePerKwh,
      totalBill: Math.round(estimatedBill * 100) / 100,
      totalKwh: Math.round(estimate.estimatedKwh * 100) / 100,
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
        monthlyCost: Math.round((a.kwh / (daysElapsed || 1)) * daysInMonth * ratePerKwh * 100) / 100,
      }));

    // ── TEMPERATURE INSIGHT ──
    let temperatureInsight = null;
    try {
      const weatherRes = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=14.5995&longitude=120.9842&current=temperature_2m&daily=temperature_2m_max&timezone=Asia/Manila&forecast_days=1`
      );
      if (weatherRes.ok) {
        const weather = await weatherRes.json();
        const currentTemp = weather.current?.temperature_2m || 32;
        const hasAC = appliances.some((a: any) => a.appliance_type === 'ac' && a.is_active);
        
        let heatIndex = currentTemp >= 35 ? 'Extreme Heat' : currentTemp >= 32 ? 'Hot' : 'Warm';
        let recommendation = hasAC ? 'Set AC to 25°C to save.' : 'Use fans and stay hydrated.';

        temperatureInsight = {
          currentTemp,
          avgTemp: weather.daily?.temperature_2m_max?.[0] || 33,
          heatIndex,
          acImpactPercent: hasAC ? (currentTemp >= 35 ? 25 : 15) : 0,
          acExtraCost: 0,
          recommendation,
        };
      }
    } catch (e) { console.log('Weather fetch fail'); }

    // ── COMPARISON VS LAST MONTH ──
    const prevMonthKwh = prevLogs.reduce((s: number, l: any) => s + Number(l.estimated_kwh || 0), 0);
    const prevMonthCost = prevMonthKwh * ratePerKwh;

    // ── CONFIDENCE INTERVAL ──
    const confidenceWidth = usageLogs.length < 7 ? 0.20 : 0.10;

    res.json({
      monthlyEstimate: {
        estimatedKwh: estimate.estimatedKwh,
        estimatedBill: estimatedBill,
        confidenceLow: Math.round(estimatedBill * (1 - confidenceWidth)),
        confidenceHigh: Math.round(estimatedBill * (1 + confidenceWidth)),
        breakdown: billBreakdown,
        topConsumers,
        temperatureImpact: temperatureInsight,
        comparisonVsLastMonth: {
          kwhChange: Math.round(estimate.estimatedKwh - prevMonthKwh),
          costChange: Math.round(estimatedBill - prevMonthCost),
          direction: estimate.estimatedKwh > prevMonthKwh ? 'up' : 'down',
        },
        dailyAvgKwh: estimate.dailyAvgKwh,
        dailyAvgCost: estimate.dailyAvgKwh * ratePerKwh,
        daysRemaining: estimate.daysRemaining,
        isCalibrated: estimate.isCalibrated
      }
    });
  } catch (err: any) {
    console.error('enhanced-insights error:', err);
    res.status(500).json({ error: err.message || 'Failed to get enhanced insights' });
  }
});

// POST /api/ai/submit-bill — handles calibration logic
// This function was created using Generative AI
router.post('/submit-bill', async (req: AuthRequest, res) => {
  try {
    const userId = req.userId || req.body.userId;
    const { billingMonth, actualKwh, actualAmount } = req.body;

    if (!userId || !billingMonth || actualAmount === undefined) {
      return res.status(400).json({ error: 'userId, billingMonth, and actualAmount required' });
    }

    // 1. Get calibrated estimate from Consumption Engine
    const estimate = await ConsumptionEngine.getEnhancedEstimate(userId);
    const { data: rateData } = await supabaseAdmin.from('energy_rates')
      .select('rate_per_kwh').order('effective_date', { ascending: false }).limit(1).single();
    const rate = rateData?.rate_per_kwh || 13.8161;

    const ourEstimatedAmount = estimate.estimatedKwh * rate;
    const actualAmt = Number(actualAmount);
    const amountDiff = ourEstimatedAmount - actualAmt;
    
    // Accuracy Calculation
    const accuracyPercent = actualAmt > 0
      ? Math.round(Math.max(0, (1 - Math.abs(amountDiff) / actualAmt)) * 100)
      : 0;

    // 2. Upsert into meralco_bills for Ground Truth
    const { data, error } = await supabaseAdmin
      .from('meralco_bills')
      .upsert({
        user_id: userId,
        billing_month: billingMonth,
        actual_kwh: actualKwh || (actualAmt / rate),
        actual_amount: actualAmt,
        our_estimated_kwh: estimate.estimatedKwh,
        our_estimated_amount: ourEstimatedAmount,
        accuracy_percent: accuracyPercent,
        amount_difference: amountDiff,
      }, { onConflict: 'user_id,billing_month' })
      .select()
      .single();

    if (error) throw error;

    res.json({
      ...data,
      message: accuracyPercent >= 90
        ? `Great news! Our estimate was ${accuracyPercent}% accurate! 🎯`
        : `Our estimate was ${accuracyPercent}% accurate. Calibrating for next month! ⚡`,
    });
  } catch (err: any) {
    console.error('submit-bill error:', err);
    res.status(500).json({ error: err.message || 'Failed to submit bill' });
  }
});

// GET /api/ai/bill-accuracy
// This function was created using Generative AI
router.get('/bill-accuracy', async (req: AuthRequest, res) => {
  try {
    const userId = (req.userId || req.query.userId) as string;
    if (!userId) return res.status(400).json({ error: 'userId required' });

    const { data: history } = await supabaseAdmin
      .from('meralco_bills')
      .select('*')
      .eq('user_id', userId)
      .order('billing_month', { ascending: false })
      .limit(12);

    const estimate = await ConsumptionEngine.getEnhancedEstimate(userId);
    const { data: rateData } = await supabaseAdmin.from('energy_rates')
      .select('rate_per_kwh').order('effective_date', { ascending: false }).limit(1).single();
    const rate = rateData?.rate_per_kwh || 13.8161;

    res.json({
      currentMonth: {
        estimated: estimate.estimatedKwh * rate,
        estimatedKwh: estimate.estimatedKwh,
        billingMonth: new Date().toISOString().slice(0, 7),
      },
      history: history || [],
      avgAccuracy: history?.length ? history.reduce((s, b) => s + b.accuracy_percent, 0) / history.length : 0,
      trend: 'stable'
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to get accuracy history' });
  }
});

export default router;