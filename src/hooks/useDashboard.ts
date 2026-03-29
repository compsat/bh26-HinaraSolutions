import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/src/lib/supabase';
import * as api from '@/src/lib/api';
import type { DashboardData, WeeklyDataPoint, UsageLog, AiInsight } from '@/src/lib/types';

export function useDashboard(userId: string | undefined) {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [weeklyData, setWeeklyData] = useState<WeeklyDataPoint[]>([]);
  const [todaysUsage, setTodaysUsage] = useState<UsageLog[]>([]);
  const [insights, setInsights] = useState<AiInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!userId) return;
    try {
      setLoading(true);
      setError(null);

      // 1. Add getEnhancedInsights to your Promise.all
      const [dash, weekly, today, ins, enhanced] = await Promise.all([
        api.getDashboardData(userId),
        api.getWeeklyData(userId),
        api.getTodaysUsage(userId),
        api.getUserInsights(userId),
        api.getEnhancedInsights(userId, false), // false = Current Month mode
      ]);

      // 2. Override the old Dashboard math with the new AI Engine math
      if (dash && enhanced?.monthlyEstimate) {
        dash.projectedBill = enhanced.monthlyEstimate.estimatedBill;
        dash.burnRate = enhanced.monthlyEstimate.dailyAvgCost;

        // 3. Recalculate the budget status so the Gauge colors match the new estimate
        if (dash.monthlyBudget > 0) {
          const ratio = dash.projectedBill / dash.monthlyBudget;
          dash.budgetStatus = ratio >= 1 ? 'over' : ratio >= 0.85 ? 'warning' : 'under';
        }
      }

      setDashboardData(dash);
      setWeeklyData(weekly);
      setTodaysUsage(today);
      setInsights(ins);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard data');
      console.error('useDashboard error:', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
        .channel('usage_logs_changes')
        .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'usage_logs',
              filter: `user_id=eq.${userId}`,
            },
            () => {
              refresh();
            }
        )
        .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, refresh]);

  return { dashboardData, weeklyData, todaysUsage, insights, loading, error, refresh };
}