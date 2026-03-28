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
}

// Helper to get the correct YYYY-MM-DD in Philippine Time
const getPHDate = () => {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' });
};

export async function generateInsights(context: UserEnergyContext): Promise<any[]> {
  const prompt = `You are an expert Filipino energy advisor for the WattZup app. Analyze this household's energy data and return ONLY a JSON array of 3-5 insights.

User Data:
- Appliances: ${JSON.stringify(context.appliances.map(a => ({ type: a.appliance_type, name: a.custom_name, wattage: a.wattage, qty: a.quantity, hours: a.default_daily_hours, active: a.is_active })))}
- Current Meralco rate: ₱${context.ratePerKwh}/kWh
- Monthly budget: ₱${context.monthlyBudget}
- Spent so far: ₱${context.totalCostSoFar.toFixed(2)}
- Projected bill: ₱${context.projectedBill.toFixed(2)}
- Recent usage logs: ${JSON.stringify(context.usageLogs.slice(0, 20).map(l => ({ appliance: l.appliance_id, hours: l.hours_used, kwh: l.estimated_kwh, date: l.date })))}

Return a JSON array where each object has:
- insight_type: "optimization" | "alert" | "achievement" | "forecast"
- title: short title (max 50 chars)
- description: actionable advice referencing specific appliances and ₱ amounts (max 200 chars)
- potential_savings: number in PHP, or null

Focus on Filipino household context (Meralco, tropical climate, common Filipino appliance usage patterns). Be specific with peso amounts.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      // UPGRADE: Forces Gemini to return pure JSON, no markdown formatting!
      config: { responseMimeType: 'application/json' },
    });

    return JSON.parse(response.text || '[]');
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
      model: 'gemini-2.5-flash',
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

Today's date is ${getPHDate()}.
If the user says "today", use today's date. If they say "yesterday", use yesterday's date.
Match appliance names to the registered appliances above. If no match, use the closest appliance_type.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      // UPGRADE: Bulletproof JSON parsing
      config: { responseMimeType: 'application/json' },
    });

    return JSON.parse(response.text || '{"entries": [], "confirmation": "Sorry, hindi ko na-gets. Try again! ⚡"}');
  } catch (err) {
    console.error('Gemini parseVoice error:', err);
    return { entries: [], confirmation: 'May error sa parsing. Please try again! ⚡' };
  }
}