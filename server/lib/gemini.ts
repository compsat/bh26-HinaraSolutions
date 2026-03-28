import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

interface UserEnergyContext {
  appliances: any[];
  usageLogs: any[];
  ratePerKwh: number;
  monthlyBudget: number;
  totalCostSoFar: number;
  projectedBill: number;
  temperature?: number;
  billBreakdown?: any;
}

export async function generateInsights(context: UserEnergyContext): Promise<any[]> {
  const prompt = `You are an expert Filipino energy advisor for the WattZup app. Analyze this household's energy data and provide actionable insights. Return ONLY a JSON array of 5-7 insights.

User Data:
- Appliances: ${JSON.stringify(context.appliances.map(a => ({ type: a.appliance_type, name: a.custom_name, wattage: a.wattage, qty: a.quantity, hours: a.default_daily_hours, active: a.is_active })))}
- Current Meralco rate: ₱${context.ratePerKwh}/kWh (March 2026)
- Monthly budget: ₱${context.monthlyBudget}
- Spent so far: ₱${context.totalCostSoFar.toFixed(2)}
- Projected bill: ₱${context.projectedBill.toFixed(2)}
- Recent usage logs: ${JSON.stringify(context.usageLogs.slice(0, 20).map(l => ({ appliance: l.appliance_id, hours: l.hours_used, kwh: l.estimated_kwh, date: l.date })))}
${context.temperature ? `- Current temperature: ${context.temperature}°C (affects AC usage significantly)` : ''}

Meralco Bill Breakdown Context (March 2026):
- Generation charge: ₱7.8607/kWh (56.9% of bill) — this is the biggest portion
- Transmission: ₱1.3248/kWh (9.6%) — NGCP ancillary charges spiked 70% this month
- Distribution: ₱1.7937/kWh (13.0%) — unchanged since Aug 2022
- Government taxes/fees: ₱2.5141/kWh (18.2%) — includes VAT, system loss, UC
- Subsidies (RE, lifeline): ₱0.3228/kWh (2.3%)

Return a JSON array where each object has:
- insight_type: "optimization" | "alert" | "achievement" | "forecast"
- title: short title (max 50 chars)
- description: actionable advice referencing specific appliances and ₱ amounts (max 250 chars). Include temperature impact if relevant.
- potential_savings: number in PHP, or null
- category: "usage" | "billing" | "temperature" | "appliance" | "schedule"

Include at least:
1. One "forecast" type with monthly usage estimate and projected bill range
2. One "billing" category explaining which part of their Meralco bill is highest and why
3. One "temperature" category (if temp data available) on how weather affects their AC/fan costs
4. Specific appliance optimization tips with ₱ savings amounts

Focus on Filipino household context: Meralco rates, tropical climate (hot dry season March-May), typical Filipino usage patterns (rice cooker mornings, AC at night). Be specific with peso amounts.
Return ONLY the JSON array, no other text.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt,
      config: { responseMimeType: 'application/json' },

    });

    const text = response.text || '';
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return [];
  } catch (err) {
    console.error('Gemini generateInsights error:', err);
    return [];
  }
}

export async function chatWithAI(
  message: string,
  context: UserEnergyContext,
  history: { role: string; content: string }[] = []
): Promise<string> {
  const systemPrompt = `You are Zippy, the WattZup energy assistant. You're a friendly Filipino energy advisor.
You speak in a mix of English and light Filipino (Taglish). You give practical, specific advice about electricity savings based on the user's actual appliance data and usage patterns.
Always reference their specific appliances and ₱ amounts. Be encouraging and use ⚡ emoji.

User's appliances: ${JSON.stringify(context.appliances.map(a => ({ type: a.appliance_type, name: a.custom_name, wattage: a.wattage, qty: a.quantity, hours: a.default_daily_hours })))}
Meralco rate: ₱${context.ratePerKwh}/kWh
Monthly budget: ₱${context.monthlyBudget}
Current spend: ₱${context.totalCostSoFar.toFixed(2)}
Projected bill: ₱${context.projectedBill.toFixed(2)}

Keep responses concise (under 300 words). Be warm and helpful.`;

  const contents = [
    { role: 'user' as const, parts: [{ text: systemPrompt }] },
    { role: 'model' as const, parts: [{ text: 'Understood! I\'m Zippy, ready to help with energy savings! ⚡' }] },
    ...history.map(h => ({
      role: (h.role === 'user' ? 'user' : 'model') as 'user' | 'model',
      parts: [{ text: h.content }],
    })),
    { role: 'user' as const, parts: [{ text: message }] },
  ];

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents,
    });
    return response.text || 'Hindi ko ma-process ang request mo ngayon. Try again! ⚡';
  } catch (err) {
    console.error('Gemini chat error:', err);
    return 'Ay, may error! Please try again in a moment. ⚡';
  }
}

export async function parseVoiceInput(
  transcript: string,
  userAppliances: any[]
): Promise<{ entries: any[]; confirmation: string }> {
  const prompt = `You are parsing a voice input for an energy tracking app. The user said: "${transcript}"

Their registered appliances are:
${userAppliances.map(a => `- ${a.custom_name || a.appliance_type} (type: ${a.appliance_type}, id: ${a.id})`).join('\n')}

Parse their speech into structured usage log entries. Return ONLY a JSON object with:
{
  "entries": [
    { "appliance_type": "ac", "appliance_id": "uuid-if-matched", "hours": 6, "date": "YYYY-MM-DD" }
  ],
  "confirmation": "A friendly Taglish confirmation message with ⚡ emoji"
}

Today's date is ${new Date().toISOString().split('T')[0]}.
If the user says "today", use today's date. If they say "yesterday", use yesterday's date.
Match appliance names to the registered appliances above. If no match, use the closest appliance_type.
Return ONLY the JSON, no other text.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt,
    });

    const text = response.text || '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return { entries: [], confirmation: 'Sorry, hindi ko na-gets. Try again! ⚡' };
  } catch (err) {
    console.error('Gemini parseVoice error:', err);
    return { entries: [], confirmation: 'May error sa parsing. Please try again! ⚡' };
  }
}
