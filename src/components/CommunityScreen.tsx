import React, { useEffect, useState } from 'react';
import { 
  Trophy, Users, Leaf, MoreHorizontal, UserPlus, Compass,
  ArrowRight, Zap, Plus, Loader2
} from 'lucide-react';
import { motion } from 'motion/react';
import { supabase } from '@/src/lib/supabase';
import * as api from '@/src/lib/api';
import type { LeaderboardEntry, Challenge, CommunityTeam } from '@/src/lib/types';

export function CommunityScreen() {
  const [userId, setUserId] = useState<string>();
  const [userName, setUserName] = useState('You');
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [activity, setActivity] = useState<any[]>([]);
  const [userRank, setUserRank] = useState<LeaderboardEntry | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUserId(user.id);
        setUserName(user.user_metadata?.full_name || user.email?.split('@')[0] || 'You');
      }
    });
  }, []);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    Promise.all([
      api.getLeaderboard(10),
      api.getActiveChallenges(),
      api.getRecentActivity(),
    ]).then(([lb, ch, act]) => {
      setLeaderboard(lb);
      setChallenges(ch);
      setActivity(act);
      const myRank = lb.find(e => e.user_id === userId);
      setUserRank(myRank || null);
    }).catch(console.error).finally(() => setLoading(false));
  }, [userId]);

  const activeChallenge = challenges[0];
  const daysUntilEnd = activeChallenge
    ? Math.max(0, Math.ceil((new Date(activeChallenge.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  if (loading) {
    return <div className="p-8 flex items-center justify-center min-h-[60vh]"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <main className="pt-8 pb-12 px-6 lg:px-12 max-w-7xl mx-auto">
      {/* Hero Section */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
        <div className="lg:col-span-8 bg-surface-container-low rounded-[2rem] p-8 relative overflow-hidden flex items-center min-h-[320px] border border-outline-variant/10 shadow-sm">
          <div className="relative z-10 max-w-lg">
            <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-primary mb-4 block">Global Impact</span>
            <h2 className="text-4xl md:text-5xl font-extrabold font-headline leading-tight mb-4">
              Together, we've saved <span className="text-primary">12,480 Tons</span> of CO2
            </h2>
            <p className="text-on-surface-variant text-lg mb-8">That's equivalent to planting over <span className="font-bold">200,000 trees</span> across the Philippines this year.</p>
            <div className="flex gap-4">
              <button className="bg-primary text-white px-6 py-3 rounded-full font-semibold hover:opacity-90 transition-opacity">View Impact Map</button>
              <button className="border border-outline-variant px-6 py-3 rounded-full font-semibold hover:bg-white transition-colors">How it's calculated</button>
            </div>
          </div>
          <div className="absolute right-0 bottom-0 top-0 w-1/3 hidden md:flex items-center justify-center bg-gradient-to-l from-primary-container/20 to-transparent">
            <div className="relative">
              <div className="w-48 h-48 bg-primary-container rounded-full blur-3xl opacity-30 absolute -z-10 animate-pulse"></div>
              <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuDqiJ9OhxLmlHxy1xJuJJqCW0NdLA7fOWBKrHU3MQpcc4rLo7A8MQnM1CYW8sE9lt6tAAfxBWtJ0dNt0USQTdqom20_imbLtbtFvTQMfUiU2yMX9VEPtkjDDne1tY8KHUk2nk0vN5oI6ZZMm1PtCTgLql3QQoue1MbqwcQxf61Mh0rk96WWliXxKGJM5BBUS83FmUqubPxIUqSSUIEzVgWB8oy8Lb7s-POzc2CxCqRHe3WLKr3ObfZ12tWGJP2oeINMAB_ewPrC_A"
                alt="Tarsier mascot" className="w-32 h-32 object-contain drop-shadow-xl" referrerPolicy="no-referrer" />
              <div className="absolute -top-4 -right-4 bg-white/70 backdrop-blur-md p-3 rounded-xl shadow-lg border border-white/50">
                <Leaf className="text-green-600 w-6 h-6" />
              </div>
            </div>
          </div>
        </div>

        {/* Activity Feed */}
        <div className="lg:col-span-4 bg-surface-container-lowest border border-outline-variant/10 rounded-[2rem] p-8 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold font-headline">Recent Activity</h3>
            <MoreHorizontal className="text-on-surface-variant cursor-pointer w-5 h-5" />
          </div>
          <div className="space-y-6">
            {activity.length > 0 ? activity.slice(0, 3).map((act, i) => (
              <ActivityItem key={i}
                name={act.profile?.full_name || 'A user'}
                action={<>earned the <span className="text-primary font-bold">{act.badge_type?.replace(/_/g, ' ')}</span> badge!</>}
                time={new Date(act.earned_at).toLocaleDateString()}
                seed={act.user_id?.slice(0, 8)}
              />
            )) : (
              <>
                <ActivityItem name="WattZup" action="Welcome to the community!" time="Just now" seed="wattzup" />
                <ActivityItem name="System" action="Start logging usage to see activity here" time="Today" seed="system" />
              </>
            )}
          </div>
          <button className="w-full mt-8 py-3 text-primary font-bold text-sm border-t border-outline-variant/10 hover:bg-surface-container-low transition-colors rounded-b-xl">
            View All Activity
          </button>
        </div>
      </section>

      {/* Leaderboard & Challenges */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-5 bg-surface-container-lowest rounded-[2rem] p-8 border border-outline-variant/10 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-2xl font-bold font-headline">Top Savers</h3>
              <p className="text-sm text-on-surface-variant">Monthly energy savings %</p>
            </div>
          </div>
          <div className="space-y-8">
            {leaderboard.slice(0, 3).map((entry, idx) => (
              <LeaderboardItem key={entry.user_id} rank={idx + 1}
                name={entry.full_name || 'User'} value={`${entry.savings_percent}% Saved`}
                progress={Math.min(entry.savings_percent * 2, 100)}
                seed={entry.user_id?.slice(0, 8)} isTop={idx === 0} />
            ))}
            {leaderboard.length === 0 && (
              <p className="text-center text-on-surface-variant text-sm py-8">No leaderboard data yet. Start logging!</p>
            )}

            {/* Current user position */}
            <div className="bg-primary-container/10 p-4 rounded-2xl flex items-center gap-4 border border-primary-container/20">
              <span className="text-lg font-black text-primary w-4">{userRank ? leaderboard.indexOf(userRank) + 1 : '—'}</span>
              <img src={`https://picsum.photos/seed/${userId?.slice(0,8) || 'me'}/100/100`} alt="You" className="w-10 h-10 rounded-full ring-2 ring-primary" referrerPolicy="no-referrer" />
              <div className="flex-1">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold text-sm italic">You ({userName})</span>
                  <span className="text-xs font-bold text-primary">{userRank ? `${userRank.savings_percent}% Saved` : 'N/A'}</span>
                </div>
                <div className="h-2 w-full bg-surface-container-high rounded-full overflow-hidden">
                  <div className="h-full bg-primary" style={{ width: `${userRank ? Math.min(userRank.savings_percent * 2, 100) : 0}%` }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Team Challenges */}
        <div className="lg:col-span-7 space-y-8">
          <div className="bg-surface-container-low rounded-[2rem] p-8 border border-outline-variant/5 overflow-hidden relative shadow-sm">
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <Trophy className="text-primary w-5 h-5 fill-primary" />
                <span className="text-[10px] font-bold uppercase text-primary font-headline">Live Team Challenge</span>
              </div>
              <h3 className="text-3xl font-bold font-headline mb-6">
                {activeChallenge?.title || 'Regional Power Duel'}
              </h3>
              <div className="space-y-8 mb-10">
                <div>
                  <div className="flex justify-between items-end mb-2">
                    <span className="text-lg font-extrabold">{activeChallenge?.team_a?.name || 'Team A'}</span>
                    <span className="text-sm font-medium">Leading</span>
                  </div>
                  <div className="h-6 w-full bg-white rounded-full p-1 shadow-inner">
                    <div className="h-full bg-primary-container rounded-full" style={{ width: '65%' }}></div>
                  </div>
                </div>
                <div className="flex justify-center -my-4">
                  <span className="bg-surface px-4 py-1 rounded-full text-[10px] font-black text-on-surface-variant border border-outline-variant/20 z-20">VS</span>
                </div>
                <div>
                  <div className="flex justify-between items-end mb-2">
                    <span className="text-lg font-extrabold text-on-surface-variant/70">{activeChallenge?.team_b?.name || 'Team B'}</span>
                    <span className="text-sm font-medium">Catching up</span>
                  </div>
                  <div className="h-6 w-full bg-white rounded-full p-1 shadow-inner opacity-60">
                    <div className="h-full bg-outline-variant rounded-full" style={{ width: '55%' }}></div>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex -space-x-3">
                  {[1, 2, 3].map(i => (
                    <img key={i} src={`https://picsum.photos/seed/team${i}/100/100`} className="w-10 h-10 rounded-full border-2 border-white" referrerPolicy="no-referrer" />
                  ))}
                  <div className="w-10 h-10 rounded-full border-2 border-white bg-primary-container flex items-center justify-center text-[10px] font-bold">+2.4k</div>
                </div>
                <p className="text-sm text-on-surface-variant italic">Ends in: <span className="font-bold text-on-surface">{daysUntilEnd} days</span></p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-surface-container-lowest p-8 rounded-[2rem] border border-outline-variant/10 shadow-sm flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-primary-container/20 rounded-full flex items-center justify-center mb-4">
                <UserPlus className="text-primary w-8 h-8" />
              </div>
              <h4 className="font-bold text-lg mb-2">Invite Friends</h4>
              <p className="text-xs text-on-surface-variant mb-6">Earn <span className="text-primary font-bold">50 Watts</span> for every neighbor you bring on board.</p>
              <button onClick={() => {
                const url = `${window.location.origin}?ref=${userId?.slice(0,8)}`;
                navigator.clipboard.writeText(url).then(() => alert('Referral link copied!'));
              }} className="w-full py-3 border border-primary text-primary rounded-full font-bold hover:bg-primary-container/10 transition-colors">
                Share Referral Code
              </button>
            </div>
            <div className="bg-primary-container p-8 rounded-[2rem] shadow-sm flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-white/30 rounded-full flex items-center justify-center mb-4">
                <Compass className="text-on-primary-container w-8 h-8" />
              </div>
              <h4 className="font-bold text-lg mb-2 text-on-primary-container">Join Challenges</h4>
              <p className="text-xs text-on-primary-container/80 mb-6">Find local neighborhood competitions and start saving together.</p>
              <button className="w-full py-3 bg-on-primary-container text-white rounded-full font-bold hover:opacity-90 transition-opacity">Browse Local</button>
            </div>
          </div>
        </div>
      </section>

      <button className="fixed bottom-12 right-12 w-16 h-16 bg-primary shadow-2xl rounded-full text-white flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-40">
        <Plus className="w-8 h-8" />
      </button>
    </main>
  );
}

function ActivityItem({ name, action, time, seed }: any) {
  return (
    <div className="flex gap-4 items-start">
      <img src={`https://picsum.photos/seed/${seed}/100/100`} alt={name} className="w-10 h-10 rounded-full" referrerPolicy="no-referrer" />
      <div>
        <p className="text-sm font-medium"><span className="font-bold">{name}</span> {action}</p>
        <span className="text-[10px] text-on-surface-variant">{time}</span>
      </div>
    </div>
  );
}

function LeaderboardItem({ rank, name, value, progress, seed, isTop }: any) {
  return (
    <div className="flex items-center gap-4">
      <span className={`text-lg font-black w-4 ${isTop ? 'text-primary' : 'text-on-surface-variant opacity-50'}`}>{rank}</span>
      <img src={`https://picsum.photos/seed/${seed}/100/100`} alt={name} className={`w-12 h-12 rounded-full border-2 shadow-sm ${isTop ? 'border-primary-container' : 'border-outline-variant/20'}`} referrerPolicy="no-referrer" />
      <div className="flex-1">
        <div className="flex justify-between items-center mb-1">
          <span className="font-bold text-sm">{name}</span>
          <span className={`text-xs font-bold ${isTop ? 'text-primary' : 'text-on-surface-variant'}`}>{value}</span>
        </div>
        <div className="h-2 w-full bg-surface-container-high rounded-full overflow-hidden">
          <div className={`h-full ${isTop ? 'bg-primary-container' : 'bg-primary'}`} style={{ width: `${progress}%` }}></div>
        </div>
      </div>
    </div>
  );
}
