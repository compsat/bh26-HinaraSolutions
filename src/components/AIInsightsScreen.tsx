import React from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { 
  Sparkles, 
  Trophy, 
  Leaf, 
  Award, 
  ArrowRight, 
  Zap, 
  Clock, 
  Sun,
  MessageSquare,
  Share2
} from 'lucide-react';
import { motion } from 'motion/react';

const forecastData = [
  { name: 'MON', predicted: 160, actual: 155 },
  { name: 'TUE', predicted: 120, actual: 130 },
  { name: 'WED', predicted: 140, actual: 150 },
  { name: 'THU', predicted: 80, actual: 95 },
  { name: 'FRI', predicted: 100, actual: 110 },
  { name: 'SAT', predicted: 40, actual: 45 },
  { name: 'SUN', predicted: 120, actual: null },
];

export function AIInsightsScreen() {
  return (
    <div className="p-10 max-w-7xl mx-auto space-y-12">
      {/* Hero Section */}
      <section className="flex flex-col md:flex-row items-end gap-8 relative pb-4">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-64 h-64 flex-shrink-0 relative"
        >
          <div className="absolute inset-0 bg-primary-container/10 rounded-full blur-3xl"></div>
          <img 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuCldmSsscTcoi2WHlbZ-4X1weOZDipEjjL2IwmUS2zitTBRKIP7gOrj7xEgbAH87-FXC4eACnIIfcDUhRDj6My0mQ0_tCckAqAJ28AWykFmA-lgQ2qZZ1q7K3RreF6xwx1fXuhA1_cOGZo4xJEtvYziFdQJ8BHuz4k7dBQaw-g1IoFqYHYm_cESIZo62g-gKG7ZD7yAvi2F9Ry-jJ8d6MNIR837k_MPNVivVAHzLWWoaSY83rT7bEPf65y3XB_pEhzLY8XmU8zr6A" 
            alt="Tarsier Mascot" 
            className="w-full h-full object-contain relative z-10"
            referrerPolicy="no-referrer"
          />
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex-grow pb-8"
        >
          <div className="relative bg-surface-container-lowest p-8 rounded-[2rem] rounded-bl-none shadow-xl border-l-8 border-primary-container max-w-2xl">
            <p className="text-[10px] uppercase tracking-widest text-primary font-black mb-2 font-headline">Predictive Insight</p>
            <h3 className="text-3xl md:text-4xl font-black font-headline leading-tight text-on-surface">
              You're on track to save <span className="text-primary">₱450</span> this month!
            </h3>
            <p className="mt-4 text-on-surface-variant font-medium leading-relaxed">
              Based on your usage over the last 14 days, your efficiency has improved by 12%. Keep using your heavy appliances after 10 PM to maximize your savings.
            </p>
          </div>
        </motion.div>

        <div className="absolute -top-6 right-0 text-right opacity-10 select-none pointer-events-none">
          <span className="text-8xl font-black font-headline tracking-tighter">INSIGHT</span>
        </div>
      </section>

      {/* Main Data Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Energy Forecast */}
        <div className="lg:col-span-2 bg-surface-container-lowest rounded-3xl p-8 shadow-sm flex flex-col gap-8 border border-outline-variant/10">
          <div className="flex justify-between items-start">
            <div>
              <h4 className="text-xl font-bold font-headline">7-Day Energy Forecast</h4>
              <p className="text-sm text-on-surface-variant">Predicted vs. Actual Consumption (kWh)</p>
            </div>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-primary-container"></div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Predicted</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-surface-container"></div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Actual</span>
              </div>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={forecastData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e2e2" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 600, fill: '#4d4732' }} 
                  dy={10}
                />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="predicted" 
                  stroke="#ffd700" 
                  strokeWidth={4} 
                  dot={false} 
                  activeDot={{ r: 6 }} 
                />
                <Line 
                  type="monotone" 
                  dataKey="actual" 
                  stroke="#4d4732" 
                  strokeWidth={3} 
                  strokeDasharray="8 4" 
                  strokeOpacity={0.3} 
                  dot={false} 
                />
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
            {[
              { icon: Sparkles, label: '7 Day Streak', active: true },
              { icon: Zap, label: 'Off-Peak Hero', active: false },
              { icon: Leaf, label: 'Carbon Neutral', active: false },
              { icon: Award, label: 'Master Saver', active: false },
            ].map((achievement, i) => (
              <div key={i} className="flex flex-col items-center gap-2 group">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center border-4 shadow-lg transition-transform group-hover:scale-110 ${
                  achievement.active 
                    ? 'bg-primary-container border-primary text-primary' 
                    : 'bg-white/10 border-white/10 text-white/40'
                }`}>
                  <achievement.icon className="w-8 h-8" fill={achievement.active ? "currentColor" : "none"} />
                </div>
                <p className={`text-[10px] font-black uppercase tracking-tighter text-center ${achievement.active ? 'opacity-100' : 'opacity-60'}`}>
                  {achievement.label}
                </p>
              </div>
            ))}
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
          <button className="text-primary font-bold text-sm border-b-2 border-primary pb-1 hover:opacity-70 transition-opacity">
            Review All Recommendations
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <SuggestionCard 
            icon={Clock} 
            title="Peak Hour Alert" 
            description={<>Shift heavy loads like laundry and dishwashing to <span className="text-primary font-bold">11 PM</span>. This could save you up to <span className="font-bold">₱120</span> monthly.</>}
          />
          <SuggestionCard 
            icon={Zap} 
            title="Vampire Power" 
            description={<>Identified <span className="text-primary font-bold">4 devices</span> drawing power on standby. Unplugging your entertainment console overnight adds up to <span className="font-bold">₱45/mo</span>.</>}
          />
          <SuggestionCard 
            icon={Sun} 
            title="Solar Potential" 
            description={<>Your roof has high sun exposure. A 3kW setup would pay for itself in <span className="text-primary font-bold">4.2 years</span>.</>}
            footer={<><span className="text-2xl font-black font-headline text-primary">₱2,800</span> <span className="text-[10px] font-bold uppercase tracking-tighter text-on-surface-variant">Est. monthly savings</span></>}
          />
        </div>
      </section>

      {/* Floating Action Island */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-white/70 backdrop-blur-md border border-white p-2 rounded-full shadow-2xl flex items-center gap-2 z-50">
        <button className="flex items-center gap-3 px-6 py-3 bg-primary text-white rounded-full font-bold text-sm hover:scale-105 active:scale-95 transition-all">
          <MessageSquare className="w-4 h-4" />
          Ask Energy AI
        </button>
        <div className="w-[1px] h-8 bg-on-surface-variant/20 mx-2"></div>
        <button className="w-10 h-10 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-white transition-colors">
          <Share2 className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

function SuggestionCard({ icon: Icon, title, description, footer }: any) {
  return (
    <motion.div 
      whileHover={{ scale: 1.02, y: -5 }}
      className="bg-surface-container-low p-6 rounded-3xl hover:bg-surface-container-lowest transition-all cursor-pointer group shadow-sm border border-outline-variant/5"
    >
      <div className="w-14 h-14 rounded-2xl bg-primary-container flex items-center justify-center mb-6 group-hover:rotate-6 transition-transform">
        <Icon className="text-primary w-8 h-8" />
      </div>
      <h5 className="text-lg font-bold font-headline mb-2">{title}</h5>
      <p className="text-sm text-on-surface-variant leading-relaxed mb-4">
        {description}
      </p>
      {footer && <div className="flex items-center gap-2 mt-auto">{footer}</div>}
    </motion.div>
  );
}
