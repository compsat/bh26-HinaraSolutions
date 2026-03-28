import { Router } from 'express';
import { supabaseAdmin } from '../lib/supabase-admin';

const router = Router();

// GET /api/rates/current
router.get('/current', async (_req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('energy_rates')
      .select('*')
      .order('effective_date', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      return res.json({ rate_per_kwh: 11.8569, provider: 'Meralco', effective_date: '2025-01-01' });
    }

    res.json(data);
  } catch (err: any) {
    console.error('rates error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/rates/update (admin-only in production)
router.post('/update', async (req, res) => {
  try {
    const { rate_per_kwh, provider, effective_date } = req.body;

    if (!rate_per_kwh) {
      return res.status(400).json({ error: 'rate_per_kwh required' });
    }

    const { data, error } = await supabaseAdmin
      .from('energy_rates')
      .insert({
        rate_per_kwh,
        provider: provider || 'Meralco',
        effective_date: effective_date || new Date().toISOString().split('T')[0],
      })
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err: any) {
    console.error('rate update error:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
