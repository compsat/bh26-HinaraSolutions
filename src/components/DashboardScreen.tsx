import React, { useEffect, useState } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import { 
  Search, 
  User, 
  Mic, 
  AlertTriangle, 
  Lightbulb, 
  ChevronRight,
  TrendingUp
} from 'lucide-react';
import { motion } from 'motion/react';
import { supabase } from '@/src/lib/supabase';

const weeklyData = [
  { name: 'Mon', value: 40 },
  { name: 'Tue', value: 65 },
  { name: 'Wed', value: 85 },
  { name: 'Thu', value: 50 },
  { name: 'Fri', value: 30 },
  { name: 'Sat', value: 90 },
  { name: 'Sun', value: 45 },
];

export function DashboardScreen() {
  const [userAppliances, setUserAppliances] = useState<any[]>([]);

  useEffect(() => {
    const fetchUserMetadata = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.user_metadata?.appliances) {
        setUserAppliances(user.user_metadata.appliances);
      } else {
        setUserAppliances([
          { id: 'ac', name: 'Air Conditioner' },
          { id: 'fridge', name: 'Refrigerator' },
          { id: 'lights', name: 'Smart Lighting' },
          { id: 'kettle', name: 'Electric Kettle' },
        ]);
      }
    };
    fetchUserMetadata();
  }, []);

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
              {/* Semi-circle Gauge */}
              <div className="relative w-[320px] h-[160px] overflow-hidden">
                <div className="absolute top-0 left-0 w-[320px] h-[320px] rounded-full border-[28px] border-surface-container-low"></div>
                <div 
                  className="absolute top-0 left-0 w-[320px] h-[320px] rounded-full border-[28px] border-transparent border-t-primary border-r-primary rotate-[45deg]"
                  style={{ transition: 'transform 1s ease-out' }}
                ></div>
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-center pb-2">
                  <p className="font-headline font-extrabold text-4xl text-on-surface">₱125</p>
                  <p className="font-label text-xs uppercase text-on-surface-variant font-bold">per day</p>
                </div>
              </div>

              <div className="mt-8 text-center">
                <h4 className="font-headline font-bold text-lg">Predicted Bill: <span className="text-primary font-extrabold tracking-tight">₱3,850</span></h4>
                <p className="text-on-surface-variant font-semibold text-sm mt-1">
                  Status: <span className="underline decoration-primary-container decoration-4 underline-offset-4">Under Budget</span>
                </p>
              </div>
            </div>

            <div className="mt-6 border-2 border-primary-container/30 bg-primary-container/5 rounded-2xl p-4 flex items-center gap-4">
              <AlertTriangle className="text-primary w-5 h-5 fill-primary/20" />
              <p className="text-on-surface-variant text-sm font-medium italic">"You are close to exceeding your target if usage continues!"</p>
            </div>

            <div className="absolute -top-20 -right-20 w-64 h-64 bg-primary-container/10 blur-[80px] rounded-full pointer-events-none"></div>
          </section>

          {/* Mascot & Bento Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Mascot Widget */}
            <div className="bg-surface-container-low rounded-3xl p-8 flex items-center gap-6 relative transition-all duration-300 hover:scale-[1.01] border border-outline-variant/5">
              <div className="w-32 h-32 flex-shrink-0 bg-white rounded-full p-2 shadow-inner">
                <img 
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuAHqNSYjIbV_8BYFNjfANTV6F-D6jAZD0omj5B_O-W96RIsKYi5wrPe4iHMw-a7YdD81TYkDOxI4FnF1cVSPZYqMtQhpXbTcw6mppw7anqs5ZPA4AqUEohvQfNUAx8o7_NdX98wsrOzvTY9wEhy1HISCtSOJfLYX2Vnb45pZ-pPS_tilWCqsxSwD_Dy-5kg2rBzCImqJ7nGBb0yqOLopmYE637yiyfjPACG39sxF6rHGsl4EC7yZ9quzucfcInA15o3IDUh9wu8nQ" 
                  alt="Wattzy Mascot" 
                  className="w-full h-full object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="relative bg-white p-5 rounded-2xl rounded-tl-none shadow-sm">
                <p className="text-sm text-on-surface leading-relaxed font-medium">
                  "Great job! Switching the AC to fan mode now will save you <span className="font-bold text-primary">₱150</span> this week. Keep going!"
                </p>
                <div className="absolute top-0 -left-3 w-4 h-4 bg-white" style={{ clipPath: 'polygon(100% 0, 0 0, 100% 100%)' }}></div>
              </div>
            </div>

            {/* Weekly Usage Trends */}
            <div className="bg-surface-container-lowest rounded-3xl p-8 shadow-sm border border-outline-variant/10">
              <h3 className="font-headline font-bold text-lg mb-6 flex justify-between items-center">
                Weekly Usage Trends
                <TrendingUp className="text-on-surface-variant w-4 h-4" />
              </h3>
              <div className="h-32 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyData}>
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {weeklyData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={entry.value > 80 ? '#705d00' : '#ffd700'} 
                          fillOpacity={entry.value > 80 ? 1 : 0.4}
                          className="hover:fill-primary transition-all duration-300"
                        />
                      ))}
                    </Bar>
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 10, fontWeight: 700, fill: '#4d4732', opacity: 0.5 }} 
                    />
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
            <form className="space-y-5">
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-wider text-on-surface-variant font-bold">Appliance Type</label>
                <select className="w-full bg-surface-container-low border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-primary-container">
                  {userAppliances.map((app, i) => (
                    <option key={i}>{app.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-wider text-on-surface-variant font-bold">Hours Used</label>
                <input 
                  type="number" 
                  className="w-full bg-surface-container-low border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-primary-container" 
                  placeholder="0" 
                />
              </div>
              <button className="w-full py-4 bg-primary text-white rounded-xl font-bold transition-all hover:shadow-lg hover:translate-y-[-2px] active:translate-y-0">
                Log Usage
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
              <li className="flex gap-4 group cursor-pointer">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-container/20 flex items-center justify-center text-primary group-hover:bg-primary-container group-hover:text-white transition-colors">
                  <Lightbulb className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-[10px] font-bold uppercase tracking-tight text-on-surface mb-1">Optimization</h4>
                  <p className="text-sm text-on-surface-variant leading-tight">Turn off AC 2 hours earlier = Save <span className="font-bold text-primary">₱500</span></p>
                </div>
              </li>
              <li className="flex gap-4 group cursor-pointer">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-600 group-hover:bg-red-600 group-hover:text-white transition-colors">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-[10px] font-bold uppercase tracking-tight text-red-600 mb-1">Critical Alert</h4>
                  <p className="text-sm text-on-surface-variant leading-tight">Fridge power draw is higher than usual. Check door seal.</p>
                </div>
              </li>
            </ul>
          </section>

          {/* Community Savings */}
          <section className="bg-surface-container-lowest rounded-3xl p-8 shadow-sm border border-outline-variant/10 overflow-hidden relative">
            <h3 className="font-headline font-bold text-lg mb-6">Community Savings</h3>
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-surface-container-high border-2 border-primary-container overflow-hidden">
                  <img src="https://picsum.photos/seed/juan/100/100" alt="User" referrerPolicy="no-referrer" />
                </div>
                <div className="flex-grow">
                  <div className="flex justify-between text-[10px] font-bold mb-1">
                    <span>Juan Dela Cruz</span>
                    <span>85%</span>
                  </div>
                  <div className="w-full h-1.5 bg-surface-container-low rounded-full overflow-hidden">
                    <div className="h-full bg-primary-container w-[85%]"></div>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-8 border-t border-outline-variant/10">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Team Challenge</span>
                  <div className="flex -space-x-2">
                    <span className="w-6 h-6 rounded-full bg-primary-fixed flex items-center justify-center text-[10px] font-bold border border-white">C</span>
                    <span className="w-6 h-6 rounded-full bg-blue-200 flex items-center justify-center text-[10px] font-bold border border-white">Q</span>
                  </div>
                </div>
                <div className="bg-surface-container-low p-4 rounded-2xl">
                  <p className="text-xs font-bold mb-3">Cavite vs. Quezon City</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-grow h-2 bg-white rounded-full overflow-hidden flex">
                      <div className="h-full bg-primary w-[55%]"></div>
                      <div className="h-full bg-blue-400 w-[45%] opacity-50"></div>
                    </div>
                    <span className="text-[10px] font-extrabold">+12%</span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
