import { supabaseAdmin } from './supabase-admin';
import { getDaysInMonth, getDaysRemainingInMonth } from './energy-calculator';

export class ConsumptionEngine {
  // Multipliers for Philippines context (March-May is Summer)
  private static getMultipliers() {
    const now = new Date();
    const month = now.getMonth() + 1; 
    const isSummer = month >= 3 && month <= 5;
    const isWeekend = now.getDay() === 0 || now.getDay() === 6;

    return {
      cooling: isSummer ? 1.30 : 1.0, // +30% for AC/Fans in Summer
      weekend: isWeekend ? 1.15 : 1.0, // +15% general surge on weekends
      ghostLoad: 1.07, // 7% constant for always-on devices
    };
  }

  static async getEnhancedEstimate(userId: string) {
    const { data: appliances } = await supabaseAdmin
    .from('appliances')
    .select('*') //
    .eq('user_id', userId)
    .eq('is_active', true);

    // 2. Add .select() before the date filters
    const { data: logs } = await supabaseAdmin
    .from('usage_logs')
    .select('*')
    .eq('user_id', userId)
    .gte('date', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);

    const multipliers = this.getMultipliers();
    const daysInMonth = getDaysInMonth();
    const daysRemaining = getDaysRemainingInMonth();

    // 1. Calculate Actuals (Bucket A)
    const actualKwh = logs?.reduce((sum, log) => sum + Number(log.estimated_kwh), 0) || 0;

    // 2. Calculate Predicted Baseline (Bucket B)
    let dailyPredictedKwh = 0;
    appliances?.forEach(app => {
      let dailyKwh = (app.wattage * (app.default_daily_hours || 0)) / 1000;
      
      // Apply behavioral multipliers
      if (['ac', 'electric_fan'].includes(app.appliance_type)) {
        dailyKwh *= multipliers.cooling;
      }
      dailyPredictedKwh += dailyKwh;
    });

    // Add Ghost Load (Bucket C)
    dailyPredictedKwh *= multipliers.ghostLoad;

    const remainingKwh = dailyPredictedKwh * daysRemaining;
    const totalEstKwh = actualKwh + remainingKwh;

    return {
      estimatedKwh: Math.round(totalEstKwh),
      daysRemaining,
      dailyAvgKwh: Math.round((totalEstKwh / daysInMonth) * 100) / 100,
      confidenceScore: logs && logs.length > 10 ? 'High' : 'Medium',
    };
  }
}