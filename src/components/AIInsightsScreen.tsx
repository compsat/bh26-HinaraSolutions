import React, { useEffect, useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, PieChart, Pie, Legend,
} from 'recharts';
import {
  Sparkles, Trophy, Leaf, Award, Zap, Clock, Sun,
  MessageSquare, Share2, X, Send, Loader2, RefreshCw,
  Thermometer, TrendingUp, TrendingDown, DollarSign, BarChart3,
  AlertTriangle, FileText, Target, Check, Upload
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '@/src/lib/supabase';
import * as api from '@/src/lib/api';
import { formatPeso } from '@/src/lib/energy-calculator';
import type { AiInsight, Achievement, ChatMessage, BadgeType, MonthlyEstimate, MeralcoBill, BillAccuracy } from '@/src/lib/types';

const BADGE_INFO: Record<BadgeType, { icon: any; label: string }> = {
  first_week_under_budget: { icon: Trophy, label: 'First Week' },
  seven_day_streak: { icon: Sparkles, label: '7 Day Streak' },
  thirty_day_streak: { icon: Sparkles, label: '30 Day Streak' },
  off_peak_hero: { icon: Zap, label: 'Off-Peak Hero' },
  carbon_neutral: { icon: Leaf, label: 'Carbon Neutral' },
  master_saver: { icon: Award, label: 'Master Saver' },
  '500kwh_saved': { icon: Zap, label: '500kWh Saved' },
  community_champion: { icon: Trophy, label: 'Champion' },
};
const PIE_COLORS = ['#705d00', '#ffd700', '#4d4732', '#d0c6ab', '#9a8c5c'];

export function AIInsightsScreen() {
  const [userId, setUserId] = useState<string>();
  const [insights, setInsights] = useState<AiInsight[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [forecastData, setForecastData] = useState<any[]>([]);
  const [monthlyEstimate, setMonthlyEstimate] = useState<MonthlyEstimate | null>(null);
  const [billAccuracy, setBillAccuracy] = useState<BillAccuracy | null>(null);
  const [showChat, setShowChat] = useState(false);
  const [showBillInput, setShowBillInput] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dashData, setDashData] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => { if (user) setUserId(user.id); });
  }, []);

  const loadData = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const [ins, ach, dash, weekly, enhanced, accuracy] = await Promise.all([
        api.getUserInsights(userId),
        api.getUserAchievements(userId),
        api.getDashboardData(userId),
        api.getWeeklyData(userId),
        api.getEnhancedInsights(userId),
        api.getBillAccuracy(userId),
      ]);
      setInsights(ins);
      setAchievements(ach);
      setDashData(dash);
      if (enhanced?.monthlyEstimate) setMonthlyEstimate(enhanced.monthlyEstimate);
      if (accuracy) setBillAccuracy(accuracy);

      // Build forecast
      const dayNames = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
      if (enhanced?.prediction?.dailyForecast) {
        const actual = weekly.map((d: any) => ({ name: d.name?.toUpperCase(), actual: d.value || 0 }));
        const predicted = enhanced.prediction.dailyForecast.slice(0, 7);
        setForecastData(dayNames.map((name, i) => ({
          name, actual: actual[i]?.actual || 0,
          predicted: predicted[i]?.predictedKwh || Math.round((actual[i]?.actual || 0) * 0.95 * 100) / 100,
        })));
      } else {
        setForecastData(weekly.map((d: any, i: number) => ({
          name: dayNames[i] || d.name?.toUpperCase(),
          actual: d.value || 0,
          predicted: Math.round((d.value || 0) * 0.95 * 100) / 100,
        })));
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, [userId]);

  const handleGenerateInsights = async () => {
    if (!userId) return;
    setInsightsLoading(true);
    try { const n = await api.generateInsights(userId); if (n.length > 0) setInsights(n); }
    catch (err) { console.error(err); }
    finally { setInsightsLoading(false); }
  };

  const handleSendChat = async () => {
    if (!chatInput.trim() || !userId || chatLoading) return;
    const msg = chatInput.trim();
    setChatInput('');
    setChatMessages(prev => [...prev, { role: 'user', content: msg }]);
    setChatLoading(true);
    try {
      const response = await api.chatWithAI(userId, msg, chatMessages);
      setChatMessages(prev => [...prev, { role: 'assistant', content: response }]);
    } catch { setChatMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, may error. Try again! ⚡' }]); }
    finally { setChatLoading(false); }
  };

  const optimizations = insights.filter(i => i.insight_type === 'optimization');
  const earnedBadges = new Set(achievements.map(a => a.badge_type));
  const allBadges: { type: BadgeType; active: boolean }[] = [
    { type: 'seven_day_streak', active: earnedBadges.has('seven_day_streak') },
    { type: 'off_peak_hero', active: earnedBadges.has('off_peak_hero') },
    { type: 'carbon_neutral', active: earnedBadges.has('carbon_neutral') },
    { type: 'master_saver', active: earnedBadges.has('master_saver') },
  ];

  const breakdownData = monthlyEstimate?.breakdown ? [
    { name: 'Generation', value: monthlyEstimate.breakdown.generation, pct: '56.9%' },
    { name: 'Transmission', value: monthlyEstimate.breakdown.transmission, pct: '9.6%' },
    { name: 'Distribution', value: monthlyEstimate.breakdown.distribution, pct: '13.0%' },
    { name: 'Gov\'t Taxes', value: monthlyEstimate.breakdown.governmentTaxes, pct: '18.2%' },
    { name: 'Subsidies', value: monthlyEstimate.breakdown.subsidies, pct: '2.3%' },
  ] : [];

  const temp = monthlyEstimate?.temperatureImpact;
  const comparison = monthlyEstimate?.comparisonVsLastMonth;

  // Build bill comparison chart data (WattZup estimate vs actual Meralco bill)
  const billComparisonData = (billAccuracy?.history || []).slice(0, 6).reverse().map((b: MeralcoBill) => {
    const monthLabel = new Date(b.billing_month + '-01').toLocaleDateString('en-PH', { month: 'short' });
    return {
      month: monthLabel,
      estimated: b.our_estimated_amount,
      actual: b.actual_amount,
      accuracy: b.accuracy_percent,
    };
  });

  // Add current month estimate if not yet submitted
  if (billAccuracy?.currentMonth) {
    const currentSubmitted = billAccuracy.history?.find(
      (b: MeralcoBill) => b.billing_month === billAccuracy.currentMonth.billingMonth
    );
    if (!currentSubmitted) {
      const label = new Date(billAccuracy.currentMonth.billingMonth + '-01').toLocaleDateString('en-PH', { month: 'short' });
      billComparisonData.push({
        month: label + ' (est)',
        estimated: billAccuracy.currentMonth.estimated,
        actual: 0,
        accuracy: 0,
      });
    }
  }

  if (loading) {
    return <div className="p-8 flex items-center justify-center min-h-[60vh]"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="p-10 max-w-7xl mx-auto space-y-10">
      {/* Hero: Monthly Estimate */}
      <section className="flex flex-col md:flex-row items-end gap-8 relative pb-4">

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="flex-grow pb-4">
          <div className="relative bg-surface-container-lowest p-8 rounded-[2rem] rounded-bl-none shadow-xl border-l-8 border-primary-container max-w-2xl">
            <p className="text-[10px] uppercase tracking-widest text-primary font-black mb-2 font-headline">Monthly Usage Estimate</p>
            <h3 className="text-3xl md:text-4xl font-black font-headline leading-tight text-on-surface">
              Estimated bill: <span className="text-primary">{formatPeso(monthlyEstimate?.estimatedBill || dashData?.projectedBill || 0)}</span>
            </h3>
            {monthlyEstimate && (
              <div className="mt-3 flex flex-wrap gap-3 text-sm text-on-surface-variant">
                <span className="font-semibold">~{monthlyEstimate.estimatedKwh} kWh</span>
                <span>•</span>
                <span>Range: {formatPeso(monthlyEstimate.confidenceLow)} – {formatPeso(monthlyEstimate.confidenceHigh)}</span>
                <span>•</span>
                <span>{monthlyEstimate.daysRemaining} days left</span>
              </div>
            )}
            {billAccuracy && billAccuracy.avgAccuracy > 0 && (
              <div className="mt-3 inline-flex items-center gap-2 text-sm font-bold px-3 py-1 rounded-full bg-primary-container/20 text-primary">
                <Target className="w-4 h-4" />
                {billAccuracy.avgAccuracy}% avg accuracy
                {billAccuracy.trend === 'improving' && <span className="text-green-600 text-xs">(improving!)</span>}
              </div>
            )}
            {comparison && comparison.direction !== 'same' && (
              <div className={`mt-2 inline-flex items-center gap-2 text-sm font-bold px-3 py-1 rounded-full ml-2 ${
                comparison.direction === 'down' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}>
                {comparison.direction === 'down' ? <TrendingDown className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
                {comparison.direction === 'down' ? 'Down' : 'Up'} {formatPeso(Math.abs(comparison.costChange))} vs last month
              </div>
            )}
          </div>
        </motion.div>
      </section>

      {/* Stats Row */}
      {monthlyEstimate && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard icon={Zap} label="Daily Avg" value={`${monthlyEstimate.dailyAvgKwh} kWh`} sub={`${formatPeso(monthlyEstimate.dailyAvgCost)}/day`} />
          <StatCard icon={DollarSign} label="Budget Used" value={formatPeso(dashData?.totalCost || 0)} sub={`of ${formatPeso(dashData?.monthlyBudget || 4000)}`} />
          <StatCard icon={BarChart3} label="Est. Total kWh" value={`${monthlyEstimate.estimatedKwh}`} sub={`${monthlyEstimate.daysRemaining} days left`} />
          <StatCard icon={Thermometer} label="Temperature" value={temp ? `${temp.currentTemp}°C` : '—'} sub={temp ? temp.heatIndex : 'No data'} highlight={!!(temp && temp.currentTemp >= 32)} />
        </div>
      )}

      {/* Bill Accuracy Comparison — THE KEY NEW FEATURE */}
      <div className="bg-surface-container-lowest rounded-3xl p-8 shadow-sm border border-outline-variant/10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h4 className="text-xl font-bold font-headline">WattZup Estimate vs Actual Meralco Bill</h4>
            <p className="text-sm text-on-surface-variant">Input your real Meralco bill to see how accurate our predictions are</p>
          </div>
          <button onClick={() => setShowBillInput(true)}
            className="flex items-center gap-2 px-5 py-3 bg-primary text-white rounded-full font-bold text-sm hover:shadow-lg active:scale-95 transition-all">
            <Upload className="w-4 h-4" /> Input Meralco Bill
          </button>
        </div>

        {billComparisonData.length > 0 ? (
          <div className="space-y-6">
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={billComparisonData} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e2e2" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 600, fill: '#4d4732' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#4d4732' }} tickFormatter={(v) => `₱${v.toLocaleString()}`} />
                  <Tooltip formatter={(v: number, name: string) => [formatPeso(v), name === 'estimated' ? 'WattZup Estimate' : 'Actual Meralco Bill']} />
                  <Bar dataKey="estimated" name="WattZup Estimate" fill="#ffd700" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="actual" name="Actual Meralco Bill" fill="#705d00" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex gap-6 text-sm">
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-primary-container"></div><span className="font-semibold">WattZup Estimate</span></div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-primary"></div><span className="font-semibold">Actual Meralco Bill</span></div>
            </div>
            {/* Accuracy badges per month */}
            <div className="flex flex-wrap gap-3">
              {(billAccuracy?.history || []).slice(0, 6).reverse().map((b: MeralcoBill, i: number) => (
                <div key={i} className={`px-3 py-2 rounded-xl text-xs font-bold ${
                  b.accuracy_percent >= 90 ? 'bg-green-100 text-green-700' :
                  b.accuracy_percent >= 75 ? 'bg-amber-100 text-amber-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {new Date(b.billing_month + '-01').toLocaleDateString('en-PH', { month: 'short' })}: {b.accuracy_percent}% accurate
                  {b.amount_difference > 0 ? ` (over by ${formatPeso(b.amount_difference)})` : ` (under by ${formatPeso(Math.abs(b.amount_difference))})`}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 mx-auto text-on-surface-variant/20 mb-4" />
            <p className="text-lg font-bold text-on-surface mb-2">No bills submitted yet</p>
            <p className="text-sm text-on-surface-variant mb-6">Input your actual Meralco bill to see how accurate WattZup's predictions are. The more bills you add, the smarter we get!</p>
            <button onClick={() => setShowBillInput(true)}
              className="px-6 py-3 bg-primary-container text-on-primary-container rounded-full font-bold text-sm hover:shadow-lg transition-all">
              Input Your First Bill
            </button>
          </div>
        )}
      </div>

      {/* Forecast + Temperature */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-surface-container-lowest rounded-3xl p-8 shadow-sm flex flex-col gap-6 border border-outline-variant/10">
          <div className="flex justify-between items-start">
            <div>
              <h4 className="text-xl font-bold font-headline">7-Day Energy Forecast</h4>
              <p className="text-sm text-on-surface-variant">Predicted vs. Actual Daily Consumption (kWh)</p>
            </div>
          </div>
          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={forecastData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e2e2" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 600, fill: '#4d4732' }} dy={10} />
                <Tooltip formatter={(v: number) => [`${v} kWh`, '']} />
                <Line type="monotone" dataKey="predicted" stroke="#ffd700" strokeWidth={4} dot={false} activeDot={{ r: 6 }} name="Predicted" />
                <Line type="monotone" dataKey="actual" stroke="#4d4732" strokeWidth={3} strokeDasharray="8 4" strokeOpacity={0.3} dot={false} name="Logged" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Temperature Card */}
        <div className={`rounded-3xl p-8 shadow-sm flex flex-col justify-between ${
          temp && temp.currentTemp >= 32 ? 'bg-gradient-to-br from-amber-500 to-red-500 text-white' : 'bg-surface-container-lowest border border-outline-variant/10'
        }`}>
          <div className="flex items-center gap-2 mb-3">
            <Thermometer className="w-5 h-5" />
            <h4 className="text-lg font-bold font-headline">Temperature Impact</h4>
          </div>
          {temp ? (
            <>
              <div className="flex items-baseline gap-2 mb-3">
                <span className="text-5xl font-black font-headline">{temp.currentTemp}°</span>
                <span className="text-sm font-medium opacity-80">avg: {temp.avgTemp}°C</span>
              </div>
              <div className={`inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider mb-3 ${
                temp.currentTemp >= 32 ? 'bg-white/20' : 'bg-primary-container/20 text-primary'
              }`}>{temp.heatIndex}</div>
              <p className="text-sm leading-relaxed opacity-90 mb-3">{temp.recommendation}</p>
              {temp.acImpactPercent !== 0 && (
                <div className={`p-3 rounded-xl text-sm font-semibold ${temp.currentTemp >= 32 ? 'bg-white/15' : 'bg-surface-container-low'}`}>
                  AC: {temp.acImpactPercent > 0 ? '+' : ''}{temp.acImpactPercent}% usage
                  {temp.acExtraCost > 0 && <> • ~{formatPeso(temp.acExtraCost)} extra</>}
                </div>
              )}
            </>
          ) : <p className="text-sm text-on-surface-variant">Temperature data unavailable.</p>}
        </div>
      </div>

      {/* Bill Breakdown + Top Consumers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-surface-container-lowest rounded-3xl p-8 shadow-sm border border-outline-variant/10">
          <h4 className="text-xl font-bold font-headline mb-2">Meralco Bill Breakdown</h4>
          <p className="text-sm text-on-surface-variant mb-6">Where your {formatPeso(monthlyEstimate?.breakdown?.totalBill || 0)} goes</p>
          {breakdownData.length > 0 ? (
            <div className="flex gap-6 items-center">
              <div className="w-36 h-36 flex-shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart><Pie data={breakdownData} dataKey="value" cx="50%" cy="50%" innerRadius={30} outerRadius={60} paddingAngle={2}>
                    {breakdownData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                  </Pie></PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 space-y-2">
                {breakdownData.map((item, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: PIE_COLORS[i] }}></div>
                      <span className="text-xs font-semibold">{item.name} <span className="text-on-surface-variant">({item.pct})</span></span>
                    </div>
                    <span className="text-xs font-bold">{formatPeso(item.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : <p className="text-sm text-on-surface-variant text-center py-8">Log usage to see breakdown.</p>}
          <p className="text-[10px] text-on-surface-variant mt-4">Generation (power plants) = 57% of bill. Distribution unchanged since 2022.</p>
        </div>

        <div className="bg-surface-container-lowest rounded-3xl p-8 shadow-sm border border-outline-variant/10">
          <h4 className="text-xl font-bold font-headline mb-2">Top Energy Consumers</h4>
          <p className="text-sm text-on-surface-variant mb-6">Your biggest cost drivers</p>
          {monthlyEstimate?.topConsumers?.length ? (
            <div className="space-y-4">
              {monthlyEstimate.topConsumers.map((c, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-sm font-black text-primary w-6">{i + 1}</span>
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-bold">{c.name}</span>
                      <span className="text-xs font-bold text-primary">{formatPeso(c.monthlyCost)}/mo</span>
                    </div>
                    <div className="h-2 w-full bg-surface-container-low rounded-full overflow-hidden">
                      <div className="h-full bg-primary-container rounded-full" style={{ width: `${c.kwhPercent}%` }}></div>
                    </div>
                    <span className="text-[10px] text-on-surface-variant">{c.kwhPercent}% of total</span>
                  </div>
                </div>
              ))}
            </div>
          ) : <p className="text-sm text-on-surface-variant text-center py-8">Add appliances to see top consumers.</p>}
        </div>
      </div>

      {/* Achievements + Tips */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="bg-primary p-8 rounded-3xl text-white flex flex-col justify-between shadow-lg">
          <div>
            <h4 className="text-xl font-bold font-headline mb-1">Achievements</h4>
            <p className="text-primary-container text-sm mb-6">Energy milestones</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {allBadges.map((badge, i) => {
              const info = BADGE_INFO[badge.type]; const IconComp = info.icon;
              return (
                <div key={i} className="flex flex-col items-center gap-2 group">
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center border-4 shadow-lg group-hover:scale-110 transition-transform ${
                    badge.active ? 'bg-primary-container border-primary text-primary' : 'bg-white/10 border-white/10 text-white/40'
                  }`}><IconComp className="w-7 h-7" fill={badge.active ? "currentColor" : "none"} /></div>
                  <p className={`text-[10px] font-black uppercase tracking-tighter text-center ${badge.active ? '' : 'opacity-60'}`}>{info.label}</p>
                </div>
              );
            })}
          </div>
        </div>
        <div className="lg:col-span-2 space-y-4">
          <div className="flex justify-between items-end">
            <h4 className="text-xl font-black font-headline">AI Optimization Tips</h4>
            <button onClick={handleGenerateInsights} disabled={insightsLoading}
              className="text-primary font-bold text-sm border-b-2 border-primary pb-1 hover:opacity-70 flex items-center gap-2">
              {insightsLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</> : <><RefreshCw className="w-4 h-4" /> Generate AI Tips</>}
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {optimizations.length > 0 ? optimizations.slice(0, 4).map((opt) => (
              <SuggestionCard key={opt.id} icon={Clock} title={opt.title}
                description={<>{opt.description}{opt.potential_savings && <> — Save <span className="font-bold text-primary">{formatPeso(opt.potential_savings)}</span></>}</>} />
            )) : (
              <>
                <SuggestionCard icon={Clock} title="Peak Hour Alert" description="Shift heavy loads to off-peak hours. Log usage to get personalized tips!" />
                <SuggestionCard icon={Thermometer} title="Weather Tips" description="Click 'Generate AI Tips' for weather-adjusted recommendations." />
              </>
            )}
          </div>
        </div>
      </div>

      {/* Floating: Ask AI */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-white/70 backdrop-blur-md border border-white p-2 rounded-full shadow-2xl flex items-center gap-2 z-50">
        <button onClick={() => setShowChat(true)} className="flex items-center gap-3 px-6 py-3 bg-primary text-white rounded-full font-bold text-sm hover:scale-105 active:scale-95 transition-all">
          <MessageSquare className="w-4 h-4" /> Ask Energy AI
        </button>
      </div>

      {/* Bill Input Modal */}
      <AnimatePresence>
        {showBillInput && userId && (
          <BillInputModal userId={userId} onClose={() => setShowBillInput(false)} onSubmitted={() => { setShowBillInput(false); loadData(); }} />
        )}
      </AnimatePresence>

      {/* Chat Modal */}
      <AnimatePresence>
        {showChat && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-end justify-center p-4" onClick={() => setShowChat(false)}>
            <motion.div initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-surface-container-lowest rounded-t-3xl rounded-b-xl w-full max-w-lg shadow-2xl border border-outline-variant/10 max-h-[70vh] flex flex-col">
              <div className="flex items-center justify-between p-6 border-b border-outline-variant/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary-container rounded-full flex items-center justify-center"><Zap className="w-5 h-5 text-primary" /></div>
                  <div><h3 className="font-headline font-bold">Zippy — Energy AI</h3><p className="text-[10px] text-on-surface-variant">Your Taglish energy assistant ⚡</p></div>
                </div>
                <button onClick={() => setShowChat(false)} className="p-2 hover:bg-surface-container-low rounded-full"><X className="w-5 h-5" /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-4 min-h-[200px]">
                {chatMessages.length === 0 && (
                  <div className="text-center py-8 text-on-surface-variant text-sm">
                    <p className="mb-2">Kumusta! I'm Zippy ⚡</p>
                    <p>Ask about your bill breakdown, temperature impact, usage estimates, or tips para makatipid!</p>
                  </div>
                )}
                {chatMessages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] rounded-2xl p-4 text-sm whitespace-pre-wrap ${
                      msg.role === 'user' ? 'bg-primary text-white rounded-br-none' : 'bg-surface-container-low text-on-surface rounded-bl-none'
                    }`}>{msg.content}</div>
                  </div>
                ))}
                {chatLoading && <div className="flex justify-start"><div className="bg-surface-container-low rounded-2xl rounded-bl-none p-4"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div></div>}
              </div>
              <div className="p-4 border-t border-outline-variant/10 flex gap-2">
                <input type="text" value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSendChat()}
                  placeholder="Ask about your bill, temperature impact..." className="flex-1 bg-surface-container-low border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-primary-container" />
                <button onClick={handleSendChat} disabled={chatLoading || !chatInput.trim()} className="p-3 bg-primary text-white rounded-xl disabled:opacity-50 hover:shadow-lg transition-all"><Send className="w-5 h-5" /></button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Bill Input Modal ──
function BillInputModal({ userId, onClose, onSubmitted }: { userId: string; onClose: () => void; onSubmitted: () => void }) {
  const now = new Date();
  const [billingMonth, setBillingMonth] = useState(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);
  const [actualAmount, setActualAmount] = useState('');
  const [actualKwh, setActualKwh] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actualAmount) return;
    setSubmitting(true);
    try {
      const res = await api.submitMeralcoBill(userId, billingMonth, parseFloat(actualKwh || '0'), parseFloat(actualAmount));
      setResult(res);
    } catch (err) { console.error(err); }
    finally { setSubmitting(false); }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={onClose}>
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        onClick={e => e.stopPropagation()}
        className="bg-surface-container-lowest rounded-3xl p-8 w-full max-w-md shadow-2xl border border-outline-variant/10">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-headline font-bold text-xl">Input Meralco Bill</h3>
          <button onClick={onClose} className="p-2 hover:bg-surface-container-low rounded-full"><X className="w-5 h-5" /></button>
        </div>

        {!result ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-sm text-on-surface-variant">Enter your actual Meralco bill so we can compare it against WattZup's estimate and improve our predictions.</p>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Billing Month</label>
              <input type="month" value={billingMonth} onChange={e => setBillingMonth(e.target.value)}
                className="w-full bg-surface-container-low border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-primary-container" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Total Bill Amount (₱) *</label>
              <input type="number" value={actualAmount} onChange={e => setActualAmount(e.target.value)} required
                placeholder="e.g. 3500" min="0" step="0.01"
                className="w-full bg-surface-container-low border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-primary-container" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Total kWh (optional — from your bill)</label>
              <input type="number" value={actualKwh} onChange={e => setActualKwh(e.target.value)}
                placeholder="e.g. 250" min="0" step="0.01"
                className="w-full bg-surface-container-low border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-primary-container" />
              <p className="text-[10px] text-on-surface-variant">Found on your Meralco bill under "Total kWh Consumption"</p>
            </div>
            <button type="submit" disabled={submitting || !actualAmount}
              className="w-full py-4 bg-primary text-white rounded-xl font-bold transition-all hover:shadow-lg disabled:opacity-50">
              {submitting ? 'Comparing...' : 'Compare with WattZup Estimate'}
            </button>
          </form>
        ) : (
          <div className="space-y-6 text-center">
            <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center ${
              result.accuracy_percent >= 90 ? 'bg-green-100' : result.accuracy_percent >= 75 ? 'bg-amber-100' : 'bg-red-100'
            }`}>
              <Target className={`w-10 h-10 ${
                result.accuracy_percent >= 90 ? 'text-green-600' : result.accuracy_percent >= 75 ? 'text-amber-600' : 'text-red-600'
              }`} />
            </div>
            <div>
              <p className="text-4xl font-black font-headline text-primary">{result.accuracy_percent}%</p>
              <p className="text-sm text-on-surface-variant font-medium">Prediction Accuracy</p>
            </div>
            <div className="grid grid-cols-2 gap-4 text-left">
              <div className="bg-surface-container-low p-4 rounded-xl">
                <p className="text-[10px] font-bold uppercase text-on-surface-variant mb-1">WattZup Estimated</p>
                <p className="text-lg font-bold">{formatPeso(result.our_estimated_amount)}</p>
              </div>
              <div className="bg-surface-container-low p-4 rounded-xl">
                <p className="text-[10px] font-bold uppercase text-on-surface-variant mb-1">Actual Meralco Bill</p>
                <p className="text-lg font-bold">{formatPeso(result.actual_amount)}</p>
              </div>
            </div>
            <div className={`p-4 rounded-xl text-sm font-medium ${
              result.amount_difference > 0 ? 'bg-amber-50 text-amber-800' : 'bg-green-50 text-green-800'
            }`}>
              {result.amount_difference > 0
                ? `We overestimated by ${formatPeso(result.amount_difference)}`
                : `We underestimated by ${formatPeso(Math.abs(result.amount_difference))}`}
            </div>
            <p className="text-sm text-on-surface-variant">{result.message}</p>
            <button onClick={onSubmitted}
              className="w-full py-3 bg-primary text-white rounded-xl font-bold hover:shadow-lg transition-all">
              Done
            </button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

function StatCard({ icon: Icon, label, value, sub, highlight }: any) {
  return (
    <div className={`rounded-2xl p-5 shadow-sm border ${highlight ? 'bg-amber-50 border-amber-200' : 'bg-surface-container-lowest border-outline-variant/10'}`}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`w-4 h-4 ${highlight ? 'text-amber-600' : 'text-primary'}`} />
        <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">{label}</span>
      </div>
      <p className="text-xl font-black font-headline">{value}</p>
      <p className="text-[10px] text-on-surface-variant mt-1">{sub}</p>
    </div>
  );
}

function SuggestionCard({ icon: Icon, title, description }: any) {
  return (
    <motion.div whileHover={{ scale: 1.01 }}
      className="bg-surface-container-low p-5 rounded-2xl hover:bg-surface-container-lowest transition-all cursor-pointer group shadow-sm border border-outline-variant/5">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary-container flex items-center justify-center flex-shrink-0 group-hover:rotate-6 transition-transform">
          <Icon className="text-primary w-5 h-5" />
        </div>
        <div>
          <h5 className="text-sm font-bold font-headline mb-1">{title}</h5>
          <p className="text-xs text-on-surface-variant leading-relaxed">{description}</p>
        </div>
      </div>
    </motion.div>
  );
}
