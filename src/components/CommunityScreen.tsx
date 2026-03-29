import React, { useEffect, useState } from 'react';
import {
  Trophy, Users, Leaf, MoreHorizontal, UserPlus, Compass,
  ArrowRight, Zap, Plus, Loader2
} from 'lucide-react';
import { motion } from 'motion/react';
import { supabase } from '@/src/lib/supabase';
import * as api from '@/src/lib/api';
import type { LeaderboardEntry, Challenge } from '@/src/lib/types';

// This function was created using Generative AI
export function CommunityScreen() {
  const [userId, setUserId] = useState<string>();
  const [userName, setUserName] = useState('You');
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [activity, setActivity] = useState<any[]>([]);

  const [userRank, setUserRank] = useState<LeaderboardEntry | null>(null);
  const [userLocation, setUserLocation] = useState('your area');
  const [loading, setLoading] = useState(true);
  const [regionalRankings, setRegionalRankings] = useState<any[]>([]);

  // NEW: State to hold the live duel statistics
  const [challengeStats, setChallengeStats] = useState<any[]>([]);

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

    api.getProfile(userId).then(async (profile) => {
      const loc = profile?.location || 'Metro Manila';
      setUserLocation(loc);

      const [lb, ch, act, rankings] = await Promise.all([
        api.getLeaderboard(10, loc),
        api.getActiveChallenges(loc), // You can keep this or remove it if you aren't using the old challenges anymore
        api.getRecentActivity(),
        api.getRegionalRankings() // NEW FETCHER
      ]);

      setLeaderboard(lb);
      setChallenges(ch);
      setActivity(act);
      setRegionalRankings(rankings); // SET STATE

      const myRank = lb.find(e => e.user_id === userId);
      setUserRank(myRank || null);

      setLoading(false);
    }).catch(console.error);
  }, [userId]);

  const activeChallenge = challenges[0];
  const daysUntilEnd = activeChallenge
      ? Math.max(0, Math.ceil((new Date(activeChallenge.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
      : 0;

  // --- MATH FOR THE DUEL ---
  // Lower usage = Better. We sort ascending so the team with the lowest kWh is at index [0]
  const sortedStats = [...challengeStats].sort((a, b) => Number(a.total_kwh_reduced) - Number(b.total_kwh_reduced));
  const leadingTeam = sortedStats[0] || { team_name: 'Team A', total_kwh_reduced: 0, member_count: 0 };
  const trailingTeam = sortedStats[1] || { team_name: 'Team B', total_kwh_reduced: 0, member_count: 0 };

  const totalUsage = Number(leadingTeam.total_kwh_reduced) + Number(trailingTeam.total_kwh_reduced) || 1;

  // Hackathon UI Trick: To make the "Winning" bar visually larger, we give it the trailing team's usage percentage
  const leadingPct = totalUsage === 1 ? 50 : (Number(trailingTeam.total_kwh_reduced) / totalUsage) * 100;
  const trailingPct = totalUsage === 1 ? 50 : (Number(leadingTeam.total_kwh_reduced) / totalUsage) * 100;
  const totalMembers = Number(leadingTeam.member_count) + Number(trailingTeam.member_count);

  if (loading) {
    return <div className="p-8 flex items-center justify-center min-h-[60vh]"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
      <main className="pt-8 pb-12 px-6 lg:px-12 max-w-7xl mx-auto">
        {/* Hero Section */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
          <div className="lg:col-span-8 bg-surface-container-low rounded-[2rem] p-8 relative overflow-hidden flex items-center min-h-[320px] border border-outline-variant/10 shadow-sm">
            <div className="relative z-10 max-w-lg">
            <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-primary mb-4 block">
              Local Impact: {userLocation}
            </span>
              <h2 className="text-4xl md:text-5xl font-extrabold font-headline leading-tight mb-4">
                Together, we've saved <span className="text-primary">12,480 Tons</span> of CO2
              </h2>
              <p className="text-on-surface-variant text-lg mb-8">That's equivalent to planting over <span className="font-bold">200,000 trees</span> across the Philippines this year.</p>
              <div className="flex gap-4">
                <button className="bg-primary text-white px-6 py-3 rounded-full font-semibold hover:opacity-90 transition-opacity">View Impact Map</button>
                <button className="border border-outline-variant px-6 py-3 rounded-full font-semibold hover:bg-white transition-colors">How it's calculated</button>
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
                  <ActivityItem name="System" action="Waiting for usage logs..." time="Today" seed="system" />
              )}
            </div>
          </div>
        </section>

        {/* Leaderboard & Challenges */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-5 bg-surface-container-lowest rounded-[2rem] p-8 border border-outline-variant/10 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-2xl font-bold font-headline">Top Savers in {userLocation}</h3>
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

          {/* THE DYNAMIC TEAM CHALLENGE */}
          <div className="lg:col-span-7 space-y-8">
            <div className="bg-surface-container-low rounded-[2rem] p-8 border border-outline-variant/5 overflow-hidden relative shadow-sm">
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Compass className="text-primary w-5 h-5" />
                      <span className="text-[10px] font-bold uppercase text-primary font-headline">City vs City</span>
                    </div>
                    <h3 className="text-3xl font-bold font-headline">
                      Regional Power Rankings
                    </h3>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-on-surface-variant uppercase tracking-widest block mb-1">Metric</span>
                    <span className="text-sm font-bold text-primary bg-primary-container/20 px-3 py-1 rounded-full">Avg % Saved</span>
                  </div>
                </div>

                <div className="space-y-6 mb-8">
                  {regionalRankings.length > 0 ? (
                      regionalRankings.map((region, index) => {
                        // Make the top region the 100% width benchmark
                        const maxScore = regionalRankings[0].avg_savings_pct || 1;
                        const barWidth = Math.max(5, (region.avg_savings_pct / maxScore) * 100);
                        const isUserRegion = region.region === userLocation;

                        return (
                            <div key={region.region} className={`p-4 rounded-2xl transition-colors ${isUserRegion ? 'bg-primary-container/10 border border-primary/20' : ''}`}>
                              <div className="flex justify-between items-end mb-2">
                                <div className="flex items-center gap-3">
                            <span className={`text-lg font-black w-4 ${index === 0 ? 'text-primary' : 'text-on-surface-variant/50'}`}>
                              {index + 1}
                            </span>
                                  <span className="text-lg font-extrabold flex items-center gap-2">
                              {region.region}
                                    {isUserRegion && <span className="text-[10px] bg-primary text-white px-2 py-0.5 rounded-full uppercase tracking-wider">You</span>}
                            </span>
                                </div>
                                <div className="text-right">
                                  <span className="text-sm font-bold text-primary block">{region.avg_savings_pct}%</span>
                                  <span className="text-[10px] text-on-surface-variant font-medium">{region.total_users} active users</span>
                                </div>
                              </div>
                              <div className="h-4 w-full bg-white rounded-full p-0.5 shadow-inner">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${barWidth}%` }}
                                    transition={{ duration: 1.2, delay: index * 0.1, ease: "easeOut" }}
                                    className={`h-full rounded-full ${index === 0 ? 'bg-primary' : 'bg-primary-container'}`}
                                />
                              </div>
                            </div>
                        );
                      })
                  ) : (
                      <div className="text-center py-8 text-on-surface-variant text-sm">
                        No regional data available yet. Be the first to log your energy!
                      </div>
                  )}
                </div>
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

// This function was created using Generative AI
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

// This function was created using Generative AI
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