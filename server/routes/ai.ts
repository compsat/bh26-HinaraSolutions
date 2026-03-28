import { Router } from 'express';
import { supabaseAdmin } from '../lib/supabase-admin';
import * as gemini from '../lib/gemini';
import { predictMonthlyBill } from '../lib/ml-predictor';
import type { AuthRequest } from '../middleware/auth';

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
    const ratePerKwh = rateRes.data?.[0]?.rate_per_kwh || 11.8569;
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
    const ratePerKwh = rateRes.data?.[0]?.rate_per_kwh || 11.8569;
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
      ratePerKwh: rateRes.data?.[0]?.rate_per_kwh || 11.8569,
      currentDayOfMonth: now.getDate(),
      daysInMonth: new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate(),
    });

    res.json(prediction);
  } catch (err: any) {
    console.error('predict error:', err);
    res.status(500).json({ error: err.message || 'Prediction failed' });
  }
});

export default router;
