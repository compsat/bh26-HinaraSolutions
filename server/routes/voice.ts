import { Router } from 'express';
import { supabaseAdmin } from '../lib/supabase-admin';
import { parseVoiceInput } from '../lib/gemini';
import type { AuthRequest } from '../middleware/auth';

const router = Router();

// POST /api/voice/parse
router.post('/parse', async (req: AuthRequest, res) => {
  try {
    const userId = req.userId || req.body.userId;
    const { transcript } = req.body;

    if (!userId || !transcript) {
      return res.status(400).json({ error: 'userId and transcript required' });
    }

    // Fetch user's appliances for matching
   const { data: appliances, error: dbError } = await supabaseAdmin
      .from('appliances')
      .select('*')
      .eq('user_id', userId);

    if (dbError) {
      console.error('DATABASE ERROR:', dbError);
      return res.status(500).json({ error: 'Database fetch failed' });
    }

    console.log('Appliances found count:', appliances?.length || 0);

    if (!appliances || appliances.length === 0) {
      console.log('Stopping: User has no appliances.');
      return res.json({
        parsed_entries: [],
        confirmation_text: 'No appliances found. Please add appliances first! ⚡',
      });
    }


    // Parse with Gemini
    const result = await parseVoiceInput(transcript, appliances);

    // Create/upsert usage logs for each parsed entry
    const loggedEntries = [];
    for (const entry of result.entries) {
      // Find matching appliance
      let applianceId = entry.appliance_id;
      if (!applianceId) {
        const match = appliances.find(
          a => a.appliance_type === entry.appliance_type
        );
        if (match) applianceId = match.id;
      }

      if (applianceId) {
        const { data, error } = await supabaseAdmin
          .from('usage_logs')
          .upsert(
            {
              user_id: userId,
              appliance_id: applianceId,
              date: entry.date || new Date().toISOString().split('T')[0],
              hours_used: entry.hours,
              source: 'voice',
            },
            { onConflict: 'appliance_id,date' }
          )
          .select()
          .single();

        if (!error && data) {
          loggedEntries.push(data);
        }
      }
    }

    res.json({
      parsed_entries: loggedEntries,
      confirmation_text: result.confirmation || `Logged ${loggedEntries.length} entries via voice! ⚡`,
    });
  } catch (err: any) {
    console.error('voice parse error:', err);
    res.status(500).json({ error: err.message || 'Voice parsing failed' });
  }
});

export default router;
