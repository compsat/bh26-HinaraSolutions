/**
 * WattZup — Supabase API Layer
 * All CRUD operations for the app.
 */
import { supabase } from './supabase';
import type {
  Profile, Appliance, NewAppliance, UsageLog, NewUsageLog,
  AiInsight, Achievement, LeaderboardEntry, CommunityTeam,
  Challenge, DashboardData, WeeklyDataPoint, ChatMessage,
  VoiceParseResult, PredictionResult,
} from './types';
import {
  calculateBurnRate, calculateBudgetStatus,
  getDaysInMonth, getDaysElapsedInMonth, getDaysRemainingInMonth,
} from './energy-calculator';
import { DEFAULT_RATE_PER_KWH } from './constants';

// ============================================================
// PROFILES
// ============================================================

export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  if (error) {
    console.error('getProfile error:', error);
    return null;
  }
  return data as Profile;
}

export async function updateProfile(userId: string, updates: Partial<Profile>): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as Profile;
}

// ============================================================
// APPLIANCES
// ============================================================

export async function getUserAppliances(userId: string): Promise<Appliance[]> {
  const { data, error } = await supabase
    .from('appliances')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });
  if (error) throw new Error(error.message);
  return (data || []) as Appliance[];
}

export async function addAppliance(userId: string, appliance: NewAppliance): Promise<Appliance> {
  const { data, error } = await supabase
    .from('appliances')
    .insert({ user_id: userId, ...appliance })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as Appliance;
}

export async function updateAppliance(id: string, updates: Partial<Appliance>): Promise<Appliance> {
  const { data, error } = await supabase
    .from('appliances')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as Appliance;
}

export async function deleteAppliance(id: string): Promise<void> {
  const { error } = await supabase
    .from('appliances')
    .delete()
    .eq('id', id);
  if (error) throw new Error(error.message);
}

// ============================================================
// USAGE LOGS
// ============================================================

export async function logUsage(log: NewUsageLog): Promise<UsageLog> {
  const { data, error } = await supabase
    .from('usage_logs')
    .upsert(
      {
        user_id: log.user_id,
        appliance_id: log.appliance_id,
        date: log.date || new Date().toISOString().split('T')[0],
        hours_used: log.hours_used,
        source: log.source || 'manual',
      },
      { onConflict: 'appliance_id,date' }
    )
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as UsageLog;
}

export async function getUserUsageLogs(
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<UsageLog[]> {
  const { data, error } = await supabase
    .from('usage_logs')
    .select('*')
    .eq('user_id', userId)
    .gte('date', startDate.toISOString().split('T')[0])
    .lte('date', endDate.toISOString().split('T')[0])
    .order('date', { ascending: true });
  if (error) throw new Error(error.message);
  return (data || []) as UsageLog[];
}

export async function getTodaysUsage(userId: string): Promise<UsageLog[]> {
  const today = new Date().toISOString().split('T')[0];
  const { data, error } = await supabase
    .from('usage_logs')
    .select('*, appliance:appliances(*)')
    .eq('user_id', userId)
    .eq('date', today);
  if (error) throw new Error(error.message);
  return (data || []) as UsageLog[];
}

// ============================================================
// ENERGY RATES
// ============================================================

export async function getCurrentRate(): Promise<number> {
  const { data, error } = await supabase
    .from('energy_rates')
    .select('rate_per_kwh')
    .order('effective_date', { ascending: false })
    .limit(1)
    .single();
  if (error || !data) return DEFAULT_RATE_PER_KWH;
  return data.rate_per_kwh;
}

// ============================================================
// DASHBOARD AGGREGATES
// ============================================================

export async function getDashboardData(userId: string): Promise<DashboardData> {
  // Get profile for budget
  const profile = await getProfile(userId);
  const budget = profile?.monthly_budget || 4000;

  // Get current rate
  const rate = await getCurrentRate();

  // Call the RPC function
  const { data: summary, error } = await supabase.rpc('get_user_monthly_summary', {
    p_user_id: userId,
    p_month: new Date().toISOString().split('T')[0],
  });

  if (error) {
    console.error('getDashboardData RPC error:', error);
    // Return defaults
    return {
      totalKwh: 0, totalCost: 0, projectedBill: 0,
      burnRate: 0, budgetRemaining: budget, budgetStatus: 'under',
      dailyAvgCost: 0, daysLeft: getDaysRemainingInMonth(),
      percentUsed: 0, monthlyBudget: budget,
    };
  }

  const row = Array.isArray(summary) ? summary[0] : summary;
  const totalCost = Number(row?.total_cost || 0);
  const projectedBill = Number(row?.projected_bill || 0);
  const dailyAvgCost = Number(row?.daily_avg_cost || 0);
  const daysElapsed = getDaysElapsedInMonth();

  return {
    totalKwh: Number(row?.total_kwh || 0),
    totalCost,
    projectedBill,
    burnRate: dailyAvgCost,
    budgetRemaining: budget - totalCost,
    budgetStatus: calculateBudgetStatus(projectedBill, budget),
    dailyAvgCost,
    daysLeft: getDaysRemainingInMonth(),
    percentUsed: budget > 0 ? Math.round((projectedBill / budget) * 100) : 0,
    monthlyBudget: budget,
  };
}

export async function getWeeklyData(userId: string): Promise<WeeklyDataPoint[]> {
  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - 6);

  const logs = await getUserUsageLogs(userId, startOfWeek, today);

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const result: WeeklyDataPoint[] = [];

  for (let i = 0; i < 7; i++) {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];
    const dayLogs = logs.filter(l => l.date === dateStr);
    const totalKwh = dayLogs.reduce((sum, l) => sum + Number(l.estimated_kwh || 0), 0);
    result.push({
      name: dayNames[d.getDay()],
      value: Math.round(totalKwh * 100) / 100,
      date: dateStr,
    });
  }

  return result;
}

// ============================================================
// AI INSIGHTS
// ============================================================

export async function getUserInsights(userId: string): Promise<AiInsight[]> {
  const { data, error } = await supabase
    .from('ai_insights')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(20);
  if (error) throw new Error(error.message);
  return (data || []) as AiInsight[];
}

export async function getUnreadInsightCount(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from('ai_insights')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_read', false);
  if (error) return 0;
  return count || 0;
}

export async function markInsightRead(insightId: string): Promise<void> {
  const { error } = await supabase
    .from('ai_insights')
    .update({ is_read: true })
    .eq('id', insightId);
  if (error) throw new Error(error.message);
}

// ============================================================
// ACHIEVEMENTS
// ============================================================

export async function getUserAchievements(userId: string): Promise<Achievement[]> {
  const { data, error } = await supabase
    .from('achievements')
    .select('*')
    .eq('user_id', userId);
  if (error) throw new Error(error.message);
  return (data || []) as Achievement[];
}

// ============================================================
// COMMUNITY
// ============================================================

export async function getLeaderboard(limit: number = 10): Promise<LeaderboardEntry[]> {
  const { data, error } = await supabase.rpc('get_leaderboard', { p_limit: limit });
  if (error) {
    console.error('getLeaderboard error:', error);
    return [];
  }
  return (data || []) as LeaderboardEntry[];
}

export async function getTeams(): Promise<CommunityTeam[]> {
  const { data, error } = await supabase
    .from('community_teams')
    .select('*, team_members(count)')
    .order('name');
  if (error) throw new Error(error.message);
  return (data || []).map((t: any) => ({
    ...t,
    member_count: t.team_members?.[0]?.count || 0,
  })) as CommunityTeam[];
}

export async function joinTeam(userId: string, teamId: string): Promise<void> {
  const { error } = await supabase
    .from('team_members')
    .upsert({ team_id: teamId, user_id: userId });
  if (error) throw new Error(error.message);
}

export async function leaveTeam(userId: string, teamId: string): Promise<void> {
  const { error } = await supabase
    .from('team_members')
    .delete()
    .match({ team_id: teamId, user_id: userId });
  if (error) throw new Error(error.message);
}

export async function getUserTeams(userId: string): Promise<CommunityTeam[]> {
  const { data, error } = await supabase
    .from('team_members')
    .select('team_id, community_teams(*)')
    .eq('user_id', userId);
  if (error) return [];
  return (data || []).map((tm: any) => tm.community_teams).filter(Boolean) as CommunityTeam[];
}

export async function getActiveChallenges(): Promise<Challenge[]> {
  const { data, error } = await supabase
    .from('challenges')
    .select('*, team_a:community_teams!team_a_id(*), team_b:community_teams!team_b_id(*)')
    .eq('is_active', true)
    .order('created_at', { ascending: false });
  if (error) {
    console.error('getActiveChallenges error:', error);
    return [];
  }
  return (data || []) as Challenge[];
}

export async function getRecentActivity(): Promise<any[]> {
  const { data, error } = await supabase
    .from('achievements')
    .select('*, profile:profiles(full_name, avatar_url)')
    .order('earned_at', { ascending: false })
    .limit(5);
  if (error) return [];
  return data || [];
}

// ============================================================
// SERVER API HELPERS (for Express backend)
// ============================================================

export async function generateInsights(userId: string): Promise<AiInsight[]> {
  try {
    const res = await fetch('/api/ai/generate-insights', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });
    if (!res.ok) throw new Error('Failed to generate insights');
    return await res.json();
  } catch (err) {
    console.error('generateInsights error:', err);
    return [];
  }
}

export async function chatWithAI(userId: string, message: string, history: ChatMessage[] = []): Promise<string> {
  try {
    const res = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, message, history }),
    });
    if (!res.ok) throw new Error('Failed to chat with AI');
    const data = await res.json();
    return data.response;
  } catch (err) {
    console.error('chatWithAI error:', err);
    return 'Sorry, I could not process your request right now. Please try again! ⚡';
  }
}

export async function parseVoiceTranscript(userId: string, transcript: string): Promise<VoiceParseResult> {
  try {
    const res = await fetch('/api/voice/parse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, transcript }),
    });
    if (!res.ok) throw new Error('Failed to parse voice input');
    return await res.json();
  } catch (err) {
    console.error('parseVoiceTranscript error:', err);
    return { parsed_entries: [], confirmation_text: 'Sorry, could not understand that. Please try again.' };
  }
}

export async function getPrediction(userId: string): Promise<PredictionResult | null> {
  try {
    const res = await fetch(`/api/ai/predict?userId=${userId}`);
    if (!res.ok) throw new Error('Failed to get prediction');
    return await res.json();
  } catch (err) {
    console.error('getPrediction error:', err);
    return null;
  }
}
