import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/src/lib/supabase';
import * as api from '@/src/lib/api';
import type { DashboardData, WeeklyDataPoint, UsageLog, AiInsight } from '@/src/lib/types';

// This function was created using Generative AI
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
      const [dash, weekly, today, ins] = await Promise.all([
        api.getDashboardData(userId),
        api.getWeeklyData(userId),
        api.getTodaysUsage(userId),
        api.getUserInsights(userId),
      ]);
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

  // Realtime subscription for usage_logs changes
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
          // Refresh dashboard when usage logs change
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
