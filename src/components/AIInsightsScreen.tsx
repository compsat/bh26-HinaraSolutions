import React, { useEffect, useState } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { 
  Sparkles, Trophy, Leaf, Award, ArrowRight, Zap, Clock, Sun,
  MessageSquare, Share2, X, Send, Loader2, RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '@/src/lib/supabase';
import * as api from '@/src/lib/api';
import { formatPeso } from '@/src/lib/energy-calculator';
import type { AiInsight, Achievement, ChatMessage, BadgeType } from '@/src/lib/types';

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

export function AIInsightsScreen() {
  const [userId, setUserId] = useState<string>();
  const [insights, setInsights] = useState<AiInsight[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [forecastData, setForecastData] = useState<any[]>([]);
  const [showChat, setShowChat] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dashData, setDashData] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUserId(user.id);
    });
  }, []);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    Promise.all([
      api.getUserInsights(userId),
      api.getUserAchievements(userId),
      api.getDashboardData(userId),
      api.getWeeklyData(userId),
    ]).then(([ins, ach, dash, weekly]) => {
      setInsights(ins);
      setAchievements(ach);
      setDashData(dash);
      // Build forecast data from weekly
      const dayNames = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
      const forecast = weekly.map((d, i) => ({
        name: dayNames[i] || d.name?.toUpperCase(),
        actual: d.value || 0,
        predicted: Math.round((d.value || 0) * (0.9 + Math.random() * 0.2) * 100) / 100,
      }));
      setForecastData(forecast);
    }).catch(console.error).finally(() => setLoading(false));
  }, [userId]);

  const handleGenerateInsights = async () => {
    if (!userId) return;
    setInsightsLoading(true);
    try {
      const newInsights = await api.generateInsights(userId);
      if (newInsights.length > 0) setInsights(newInsights);
    } catch (err) {
      console.error(err);
    } finally {
      setInsightsLoading(false);
    }
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
    } catch (err) {
      setChatMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, may error. Try again! ⚡' }]);
    } finally {
      setChatLoading(false);
    }
  };

  const savingsAmount = dashData ? Math.max(0, dashData.monthlyBudget - dashData.projectedBill) : 0;
  const optimizations = insights.filter(i => i.insight_type === 'optimization');
  const earnedBadges = new Set(achievements.map(a => a.badge_type));

  const allBadges: { type: BadgeType; active: boolean }[] = [
    { type: 'seven_day_streak', active: earnedBadges.has('seven_day_streak') },
    { type: 'off_peak_hero', active: earnedBadges.has('off_peak_hero') },
    { type: 'carbon_neutral', active: earnedBadges.has('carbon_neutral') },
    { type: 'master_saver', active: earnedBadges.has('master_saver') },
  ];

  if (loading) {
    return <div className="p-8 flex items-center justify-center min-h-[60vh]"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="p-10 max-w-7xl mx-auto space-y-12">
      {/* Hero Section */}
      <section className="flex flex-col md:flex-row items-end gap-8 relative pb-4">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="w-64 h-64 flex-shrink-0 relative">
          <div className="absolute inset-0 bg-primary-container/10 rounded-full blur-3xl"></div>
          <img src="/zapperBird.png"
            alt="Tarsier Mascot" className="w-full h-full object-contain relative z-10" referrerPolicy="no-referrer" />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="flex-grow pb-8">
          <div className="relative bg-surface-container-lowest p-8 rounded-[2rem] rounded-bl-none shadow-xl border-l-8 border-primary-container max-w-2xl">
            <p className="text-[10px] uppercase tracking-widest text-primary font-black mb-2 font-headline">Predictive Insight</p>
            <h3 className="text-3xl md:text-4xl font-black font-headline leading-tight text-on-surface">
              {savingsAmount > 0
                ? <>You're on track to save <span className="text-primary">{formatPeso(savingsAmount)}</span> this month!</>
                : <>Your projected bill is <span className="text-primary">{formatPeso(dashData?.projectedBill || 0)}</span></>}
            </h3>
            <p className="mt-4 text-on-surface-variant font-medium leading-relaxed">
              Based on your usage data, keep using heavy appliances after 10 PM to maximize savings with off-peak rates.
            </p>
          </div>
        </motion.div>
      </section>

      {/* Main Data Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-surface-container-lowest rounded-3xl p-8 shadow-sm flex flex-col gap-8 border border-outline-variant/10">
          <div className="flex justify-between items-start">
            <div>
              <h4 className="text-xl font-bold font-headline">7-Day Energy Forecast</h4>
              <p className="text-sm text-on-surface-variant">Predicted vs. Actual Consumption (kWh)</p>
            </div>
            <div className="flex gap-4">
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-primary-container"></div><span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Predicted</span></div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-surface-container"></div><span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Actual</span></div>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={forecastData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e2e2" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 600, fill: '#4d4732' }} dy={10} />
                <Tooltip />
                <Line type="monotone" dataKey="predicted" stroke="#ffd700" strokeWidth={4} dot={false} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="actual" stroke="#4d4732" strokeWidth={3} strokeDasharray="8 4" strokeOpacity={0.3} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Achievement Gallery */}
        <div className="bg-primary p-8 rounded-3xl text-white flex flex-col justify-between shadow-lg">
          <div>
            <h4 className="text-xl font-bold font-headline mb-1">Achievement Gallery</h4>
            <p className="text-primary-container text-sm mb-8">Your energy saving milestones</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {allBadges.map((badge, i) => {
              const info = BADGE_INFO[badge.type];
              const IconComp = info.icon;
              return (
                <div key={i} className="flex flex-col items-center gap-2 group">
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center border-4 shadow-lg transition-transform group-hover:scale-110 ${
                    badge.active ? 'bg-primary-container border-primary text-primary' : 'bg-white/10 border-white/10 text-white/40'
                  }`}>
                    <IconComp className="w-8 h-8" fill={badge.active ? "currentColor" : "none"} />
                  </div>
                  <p className={`text-[10px] font-black uppercase tracking-tighter text-center ${badge.active ? 'opacity-100' : 'opacity-60'}`}>{info.label}</p>
                </div>
              );
            })}
          </div>
          <button className="mt-8 w-full py-3 bg-primary-container text-primary font-black rounded-xl text-sm uppercase tracking-widest hover:bg-white transition-colors">
            View All Badges
          </button>
        </div>
      </div>

      {/* Optimization Suggestions */}
      <section className="space-y-6">
        <div className="flex justify-between items-end">
          <h4 className="text-2xl font-black font-headline tracking-tight">Optimization Suggestions</h4>
          <button onClick={handleGenerateInsights} disabled={insightsLoading}
            className="text-primary font-bold text-sm border-b-2 border-primary pb-1 hover:opacity-70 transition-opacity flex items-center gap-2">
            {insightsLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</> : <><RefreshCw className="w-4 h-4" /> Generate AI Tips</>}
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {optimizations.length > 0 ? optimizations.slice(0, 3).map((opt) => (
            <SuggestionCard key={opt.id} icon={Clock} title={opt.title}
              description={<>{opt.description}{opt.potential_savings && <> — Save <span className="font-bold text-primary">{formatPeso(opt.potential_savings)}</span></>}</>} />
          )) : (
            <>
              <SuggestionCard icon={Clock} title="Peak Hour Alert"
                description={<>Shift heavy loads to off-peak hours (after 10 PM). Log usage to get personalized tips!</>} />
              <SuggestionCard icon={Zap} title="Track to Save"
                description={<>Start logging daily usage and our AI will find savings opportunities for you.</>} />
              <SuggestionCard icon={Sun} title="Solar Potential"
                description={<>Click "Generate AI Tips" above to get personalized recommendations based on your data.</>} />
            </>
          )}
        </div>
      </section>

      {/* Floating Action: Ask Energy AI */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-white/70 backdrop-blur-md border border-white p-2 rounded-full shadow-2xl flex items-center gap-2 z-50">
        <button onClick={() => setShowChat(true)}
          className="flex items-center gap-3 px-6 py-3 bg-primary text-white rounded-full font-bold text-sm hover:scale-105 active:scale-95 transition-all">
          <MessageSquare className="w-4 h-4" /> Ask Energy AI
        </button>
        <div className="w-[1px] h-8 bg-on-surface-variant/20 mx-2"></div>
        <button className="w-10 h-10 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-white transition-colors">
          <Share2 className="w-5 h-5" />
        </button>
      </div>

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
                    <p>Ask me anything about your energy usage, tips para makatipid, or bill predictions!</p>
                  </div>
                )}
                {chatMessages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] rounded-2xl p-4 text-sm ${
                      msg.role === 'user' ? 'bg-primary text-white rounded-br-none' : 'bg-surface-container-low text-on-surface rounded-bl-none'
                    }`}>{msg.content}</div>
                  </div>
                ))}
                {chatLoading && (
                  <div className="flex justify-start"><div className="bg-surface-container-low rounded-2xl rounded-bl-none p-4"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div></div>
                )}
              </div>
              <div className="p-4 border-t border-outline-variant/10 flex gap-2">
                <input type="text" value={chatInput} onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSendChat()}
                  placeholder="Ask about your energy usage..."
                  className="flex-1 bg-surface-container-low border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-primary-container" />
                <button onClick={handleSendChat} disabled={chatLoading || !chatInput.trim()}
                  className="p-3 bg-primary text-white rounded-xl disabled:opacity-50 hover:shadow-lg transition-all">
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SuggestionCard({ icon: Icon, title, description, footer }: any) {
  return (
    <motion.div whileHover={{ scale: 1.02, y: -5 }}
      className="bg-surface-container-low p-6 rounded-3xl hover:bg-surface-container-lowest transition-all cursor-pointer group shadow-sm border border-outline-variant/5">
      <div className="w-14 h-14 rounded-2xl bg-primary-container flex items-center justify-center mb-6 group-hover:rotate-6 transition-transform">
        <Icon className="text-primary w-8 h-8" />
      </div>
      <h5 className="text-lg font-bold font-headline mb-2">{title}</h5>
      <p className="text-sm text-on-surface-variant leading-relaxed mb-4">{description}</p>
      {footer && <div className="flex items-center gap-2 mt-auto">{footer}</div>}
    </motion.div>
  );
}
