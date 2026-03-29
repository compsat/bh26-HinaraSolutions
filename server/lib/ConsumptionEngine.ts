import { supabaseAdmin } from './supabase-admin';
import { getDaysInMonth, getDaysRemainingInMonth } from './energy-calculator';

// This class was created using Generative AI
export class ConsumptionEngine {
  // This function was created using Generative AI
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

  // This function was created using Generative AI
  static async getCalibrationFactor(userId: string): Promise<number> {
  const { data: lastBill } = await supabaseAdmin
    .from('meralco_bills')
    .select('accuracy_percent, amount_difference, actual_amount')
    .eq('user_id', userId)
    .order('billing_month', { ascending: false })
    .limit(1)
    .single();

  // If accuracy was low , we calculate a boost
  if (lastBill && lastBill.accuracy_percent < 90) {
    // If we were under-estimating (amount_difference < 0 is not possible in your current logic, 
    // but a positive difference means the bill was higher than our guess)
    if (lastBill.amount_difference > 0) {
      // Return a multiplier to bridge the gap
      // Example: 2600 / 386 = 6.7x boost
      return lastBill.actual_amount / (lastBill.actual_amount - lastBill.amount_difference);
    }
  }
  return 1.0; // no change if accurate or no history
}

    // server/lib/ConsumptionEngine.ts
// This function was created using Generative AI
static async getEnhancedEstimate(userId: string, isPreview: boolean = false) {
  const calibrationFactor = await this.getCalibrationFactor(userId);
  const { data: appliances } = await supabaseAdmin.from('appliances')
    .select('*').eq('user_id', userId).eq('is_active', true);
  
  const daysInMonth = 30;
  const daysRemaining = isPreview ? 30 : getDaysRemainingInMonth();
  const multipliers = this.getMultipliers();

  let actualKwh = 0;
  if (!isPreview) {
    // Current Month logic: Only use actual logged data
    const { data: logs } = await supabaseAdmin.from('usage_logs')
      .select('*').eq('user_id', userId)
      .gte('date', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);
    actualKwh = logs?.reduce((sum, log) => sum + Number(log.estimated_kwh), 0) || 0;
  }

  let dailyPredictedKwh = 0;
  appliances?.forEach(app => {
    let dailyKwh = (app.wattage * (app.default_daily_hours || 0)) / 1000;
    
    // 🎯 THE FIX: Calibration ONLY applies to the "Next Month" preview
    if (isPreview) {
      dailyKwh *= calibrationFactor; 
    }

    if (['ac', 'electric_fan'].includes(app.appliance_type)) {
      dailyKwh *= multipliers.cooling;
    }
    dailyPredictedKwh += dailyKwh;
  });

  // Add Ghost Load (5% baseline for standby power)
  dailyPredictedKwh *= 1.05;

  const totalEstKwh = actualKwh + (dailyPredictedKwh * daysRemaining);
  

  return {
    estimatedKwh: Math.round(totalEstKwh),
    daysRemaining,
    dailyAvgKwh: Math.round((totalEstKwh / daysInMonth) * 100) / 100,
    isCalibrated: isPreview && calibrationFactor !== 1.0 // Only show as calibrated in preview
  };
}

}