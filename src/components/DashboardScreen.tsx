import React, { useEffect, useState } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import { 
  AlertTriangle, 
  Lightbulb, 
  TrendingUp,
  Loader2
} from 'lucide-react';
import { motion } from 'motion/react';
import { supabase } from '@/src/lib/supabase';
import { useDashboard } from '@/src/hooks/useDashboard';
import { useAppliances } from '@/src/hooks/useAppliances';
import * as api from '@/src/lib/api';
import { formatPeso } from '@/src/lib/energy-calculator';

export function DashboardScreen() {
  const [userId, setUserId] = useState<string | undefined>();
  const [selectedApplianceId, setSelectedApplianceId] = useState('');
  const [hoursUsed, setHoursUsed] = useState('');
  const [logLoading, setLogLoading] = useState(false);
  const [logSuccess, setLogSuccess] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUserId(user.id);
    });
  }, []);

  const { dashboardData, weeklyData, insights, loading, refresh } = useDashboard(userId);
  const { appliances } = useAppliances(userId);

  useEffect(() => {
    if (appliances.length > 0 && !selectedApplianceId) {
      setSelectedApplianceId(appliances[0].id);
    }
  }, [appliances, selectedApplianceId]);

  const handleQuickLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !selectedApplianceId || !hoursUsed) return;
    setLogLoading(true);
    setLogSuccess(false);
    try {
      await api.logUsage({
        user_id: userId,
        appliance_id: selectedApplianceId,
        hours_used: parseFloat(hoursUsed),
        source: 'manual',
      });
      setLogSuccess(true);
      setHoursUsed('');
      setTimeout(() => setLogSuccess(false), 3000);
      refresh();
    } catch (err) {
      console.error('Quick log error:', err);
    } finally {
      setLogLoading(false);
    }
  };

  const burnRate = dashboardData?.burnRate ?? 0;
  const projectedBill = dashboardData?.projectedBill ?? 0;
  const budgetStatus = dashboardData?.budgetStatus ?? 'under';
  const percentUsed = dashboardData?.percentUsed ?? 0;
  const monthlyBudget = dashboardData?.monthlyBudget ?? 4000;

  const statusLabel = budgetStatus === 'over' ? 'Over Budget' : budgetStatus === 'warning' ? 'Near Budget' : 'Under Budget';
  const statusColor = budgetStatus === 'over' ? 'text-red-600' : budgetStatus === 'warning' ? 'text-amber-600' : 'text-primary';

  const latestOptimization = insights.find(i => i.insight_type === 'optimization');
  const mascotTip = latestOptimization
    ? latestOptimization.description
    : `Great job! Keep tracking your usage to save more. Your projected bill is ${formatPeso(projectedBill)}.`;

  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  useEffect(() => {
    api.getLeaderboard(3).then(setLeaderboard).catch(() => {});
  }, []);

  const chartData = weeklyData.length > 0
    ? weeklyData.map(d => ({ name: d.name, value: d.value || 0 }))
    : [
        { name: 'Mon', value: 0 }, { name: 'Tue', value: 0 }, { name: 'Wed', value: 0 },
        { name: 'Thu', value: 0 }, { name: 'Fri', value: 0 }, { name: 'Sat', value: 0 }, { name: 'Sun', value: 0 },
      ];
  const maxChartVal = Math.max(...chartData.map(d => d.value), 1);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      <div className="grid grid-cols-12 gap-8">
        {/* Left Column */}
        <div className="col-span-12 lg:col-span-8 space-y-8">
          {/* Main Gauge Card */}
          <section className="bg-surface-container-lowest rounded-3xl p-10 shadow-sm relative overflow-hidden border border-outline-variant/10">
            <div className="flex justify-between items-start mb-8">
              <h3 className="font-headline font-bold text-xl">Energy Consumption Gallery</h3>
              <span className="bg-primary-container/20 text-primary px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide">Live Updates</span>
            </div>

            <div className="flex flex-col items-center py-10 relative">
              <div className="relative w-[320px] h-[160px] overflow-hidden">
                <div className="absolute top-0 left-0 w-[320px] h-[320px] rounded-full border-[28px] border-surface-container-low"></div>
                <div 
                  className={`absolute top-0 left-0 w-[320px] h-[320px] rounded-full border-[28px] border-transparent ${
                    budgetStatus === 'over' ? 'border-t-red-500 border-r-red-500' :
                    budgetStatus === 'warning' ? 'border-t-amber-500 border-r-amber-500' :
                    'border-t-primary border-r-primary'
                  } rotate-[45deg]`}
                  style={{ transition: 'transform 1s ease-out' }}
                ></div>
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-center pb-2">
                  <p className="font-headline font-extrabold text-4xl text-on-surface">{formatPeso(burnRate)}</p>
                  <p className="font-label text-xs uppercase text-on-surface-variant font-bold">per day</p>
                </div>
              </div>

              <div className="mt-8 text-center">
                <h4 className="font-headline font-bold text-lg">Predicted Bill: <span className={`font-extrabold tracking-tight ${statusColor}`}>{formatPeso(projectedBill)}</span></h4>
                <p className="text-on-surface-variant font-semibold text-sm mt-1">
                  Status: <span className={`underline decoration-4 underline-offset-4 ${
                    budgetStatus === 'over' ? 'decoration-red-500' : budgetStatus === 'warning' ? 'decoration-amber-500' : 'decoration-primary-container'
                  }`}>{statusLabel}</span>
                </p>
              </div>
            </div>

            <div className={`mt-6 border-2 rounded-2xl p-4 flex items-center gap-4 ${
              budgetStatus === 'over' ? 'border-red-300 bg-red-50' : budgetStatus === 'warning' ? 'border-amber-300 bg-amber-50' : 'border-primary-container/30 bg-primary-container/5'
            }`}>
              <AlertTriangle className={`w-5 h-5 ${budgetStatus === 'over' ? 'text-red-600' : budgetStatus === 'warning' ? 'text-amber-600' : 'text-primary'} fill-current/20`} />
              <p className="text-on-surface-variant text-sm font-medium italic">
                {budgetStatus === 'over'
                  ? `"Warning! Projected bill exceeds your ${formatPeso(monthlyBudget)} budget. Reduce usage now!"`
                  : budgetStatus === 'warning'
                  ? `"You are close to exceeding your ${formatPeso(monthlyBudget)} target if usage continues!"`
                  : `"Looking good! You're on track to stay within your ${formatPeso(monthlyBudget)} budget."`}
              </p>
            </div>

            <div className="absolute -top-20 -right-20 w-64 h-64 bg-primary-container/10 blur-[80px] rounded-full pointer-events-none"></div>
          </section>

          {/* Mascot & Bento Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-surface-container-low rounded-3xl p-8 flex items-center gap-6 relative transition-all duration-300 hover:scale-[1.01] border border-outline-variant/5">
              <div className="w-32 h-32 flex-shrink-0 bg-white rounded-full p-2 shadow-inner">
                <img 
                  src="/zapperBird.png" 
                  alt="Zapper Bird" 
                  className="w-full h-full object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="relative bg-white p-5 rounded-2xl rounded-tl-none shadow-sm">
                <p className="text-sm text-on-surface leading-relaxed font-medium">"{mascotTip}"</p>
                <div className="absolute top-0 -left-3 w-4 h-4 bg-white" style={{ clipPath: 'polygon(100% 0, 0 0, 100% 100%)' }}></div>
              </div>
            </div>

            <div className="bg-surface-container-lowest rounded-3xl p-8 shadow-sm border border-outline-variant/10">
              <h3 className="font-headline font-bold text-lg mb-6 flex justify-between items-center">
                Weekly Usage Trends
                <TrendingUp className="text-on-surface-variant w-4 h-4" />
              </h3>
              <div className="h-32 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {chartData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={entry.value > maxChartVal * 0.8 ? '#705d00' : '#ffd700'} 
                          fillOpacity={entry.value > maxChartVal * 0.8 ? 1 : 0.4}
                          className="hover:fill-primary transition-all duration-300"
                        />
                      ))}
                    </Bar>
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#4d4732', opacity: 0.5 }} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="col-span-12 lg:col-span-4 space-y-8">
          {/* Quick Log */}
          <section className="bg-surface-container-lowest rounded-3xl p-8 shadow-sm border border-outline-variant/10">
            <h3 className="font-headline font-bold text-lg mb-6">Quick Log</h3>
            <form className="space-y-5" onSubmit={handleQuickLog}>
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-wider text-on-surface-variant font-bold">Appliance Type</label>
                <select
                  className="w-full bg-surface-container-low border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-primary-container"
                  value={selectedApplianceId}
                  onChange={e => setSelectedApplianceId(e.target.value)}
                >
                  {appliances.map(app => (
                    <option key={app.id} value={app.id}>{app.custom_name || app.appliance_type}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-wider text-on-surface-variant font-bold">Hours Used</label>
                <input type="number" className="w-full bg-surface-container-low border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-primary-container" placeholder="0"
                  value={hoursUsed} onChange={e => setHoursUsed(e.target.value)} min="0" max="24" step="0.5" required />
              </div>
              <button type="submit" disabled={logLoading}
                className={`w-full py-4 rounded-xl font-bold transition-all hover:shadow-lg hover:translate-y-[-2px] active:translate-y-0 disabled:opacity-50 ${logSuccess ? 'bg-green-600 text-white' : 'bg-primary text-white'}`}>
                {logLoading ? 'Logging...' : logSuccess ? '✓ Logged!' : 'Log Usage'}
              </button>
            </form>
          </section>

          {/* AI Insights List */}
          <section className="bg-surface-container-lowest rounded-3xl p-8 shadow-sm border border-outline-variant/10">
            <div className="flex items-center gap-2 mb-6">
              <Lightbulb className="text-primary w-5 h-5 fill-primary/20" />
              <h3 className="font-headline font-bold text-lg">AI Insights</h3>
            </div>
            <ul className="space-y-6">
              {insights.length > 0 ? insights.slice(0, 4).map((insight) => (
                <li key={insight.id} className="flex gap-4 group cursor-pointer" onClick={() => api.markInsightRead(insight.id)}>
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                    insight.insight_type === 'alert' ? 'bg-red-100 text-red-600 group-hover:bg-red-600 group-hover:text-white' : 'bg-primary-container/20 text-primary group-hover:bg-primary-container group-hover:text-white'
                  }`}>
                    {insight.insight_type === 'alert' ? <AlertTriangle className="w-4 h-4" /> : <Lightbulb className="w-4 h-4" />}
                  </div>
                  <div>
                    <h4 className={`text-[10px] font-bold uppercase tracking-tight mb-1 ${insight.insight_type === 'alert' ? 'text-red-600' : 'text-on-surface'}`}>{insight.title}</h4>
                    <p className="text-sm text-on-surface-variant leading-tight">{insight.description}</p>
                  </div>
                </li>
              )) : (
                <li className="flex gap-4 group cursor-pointer">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-container/20 flex items-center justify-center text-primary">
                    <Lightbulb className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-[10px] font-bold uppercase tracking-tight text-on-surface mb-1">Getting Started</h4>
                    <p className="text-sm text-on-surface-variant leading-tight">Log your daily appliance usage to get personalized AI insights!</p>
                  </div>
                </li>
              )}
            </ul>
          </section>

          {/* Community Savings */}
          <section className="bg-surface-container-lowest rounded-3xl p-8 shadow-sm border border-outline-variant/10 overflow-hidden relative">
            <h3 className="font-headline font-bold text-lg mb-6">Community Savings</h3>
            <div className="space-y-6">
              {leaderboard.length > 0 ? leaderboard.map((entry) => (
                <div key={entry.user_id} className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-surface-container-high border-2 border-primary-container overflow-hidden">
                    <img src={entry.avatar_url || `https://picsum.photos/seed/${entry.user_id?.slice(0,8)}/100/100`} alt={entry.full_name} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-grow">
                    <div className="flex justify-between text-[10px] font-bold mb-1">
                      <span>{entry.full_name || 'User'}</span>
                      <span>{entry.savings_percent}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-surface-container-low rounded-full overflow-hidden">
                      <div className="h-full bg-primary-container" style={{ width: `${Math.min(entry.savings_percent, 100)}%` }}></div>
                    </div>
                  </div>
                </div>
              )) : (
                <p className="text-sm text-on-surface-variant text-center py-4">Log usage to appear on the leaderboard!</p>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
