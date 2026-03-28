import React from 'react';
import { 
  Plus, 
  ChevronDown, 
  Wind, 
  Refrigerator, 
  Tv, 
  WashingMachine,
  ArrowRight,
  Sun,
  Clock,
  Thermometer,
  Settings2,
  Zap
} from 'lucide-react';
import { motion } from 'motion/react';

export function AppliancesScreen() {
  return (
    <div className="p-8 max-w-7xl mx-auto">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-primary mb-2 block">Energy Management</span>
          <h1 className="text-4xl font-extrabold font-headline tracking-tight text-on-surface">My Appliances</h1>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative">
            <select className="appearance-none bg-surface-container-low border-none rounded-full py-3 px-6 pr-12 text-sm font-semibold focus:ring-2 focus:ring-primary-container text-on-surface cursor-pointer">
              <option>Sort by: Highest Usage</option>
              <option>Sort by: Name</option>
              <option>Sort by: Active State</option>
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant w-4 h-4" />
          </div>
          <button className="bg-primary-container text-on-primary-container py-3 px-8 rounded-full font-bold flex items-center gap-2 hover:shadow-lg transition-all active:scale-95">
            <Plus className="w-5 h-5" />
            Add New Appliance
          </button>
        </div>
      </header>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Appliances Grid */}
        <section className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-6">
          <ApplianceCard 
            icon={Wind} 
            name="Master AC" 
            status="Active" 
            value="1.2" 
            unit="kW" 
            cost="₱142 Today" 
            active 
            chart={[40, 60, 50, 80, 95, 70, 40]}
          />
          <ApplianceCard 
            icon={Refrigerator} 
            name="Kitchen Fridge" 
            status="Active" 
            value="180" 
            unit="W" 
            cost="₱52 Today" 
            active 
            chart={[40, 38, 42, 41, 40, 39, 41]}
          />
          <ApplianceCard 
            icon={WashingMachine} 
            name="Laundry Box" 
            status="Inactive" 
            value="0" 
            unit="W" 
            cost="₱28 Today" 
            active={false} 
            chart={[10, 10, 90, 10, 10, 10, 10]}
          />
          <ApplianceCard 
            icon={Tv} 
            name="Living Room TV" 
            status="Active" 
            value="120" 
            unit="W" 
            cost="₱12 Today" 
            active 
            chart={[15, 15, 15, 65, 75, 85, 90]}
          />
        </section>

        {/* Optimization Sidebar */}
        <aside className="w-full lg:w-80 shrink-0">
          <div className="bg-surface-container-low rounded-3xl p-8 sticky top-24 border border-outline-variant/5">
            <div className="flex items-center gap-3 mb-8">
              <Zap className="text-primary w-6 h-6 fill-primary" />
              <h2 className="font-headline font-bold text-xl">Optimization</h2>
            </div>

            <div className="space-y-6">
              <OptimizationItem 
                icon={Clock} 
                title="Washing Machine" 
                description={<>Delay start to 11 PM for off-peak rates. You could save up to <span className="text-primary font-bold">₱450/mo</span>.</>}
                action="Set Schedule"
              />
              <OptimizationItem 
                icon={Thermometer} 
                title="Kitchen Fridge" 
                description="Temperature is set 2° lower than needed. Adjusting to 4°C maintains safety while reducing load."
                action="Adjust Temp"
                color="secondary"
              />
              <OptimizationItem 
                icon={Settings2} 
                title="Standby Power" 
                description="The Living Room TV is drawing 15W while off. Enable 'Deep Sleep' in settings."
                action="Optimize Now"
              />
            </div>

            {/* Promo Card */}
            <div className="mt-8 relative overflow-hidden bg-primary-container rounded-2xl p-6 shadow-sm">
              <div className="relative z-10">
                <p className="text-[10px] font-bold uppercase tracking-tighter text-on-primary-container mb-2">Solar Forecast</p>
                <h3 className="font-headline font-extrabold text-on-primary-container text-lg leading-tight mb-4">Peak solar hours expected tomorrow at 11 AM.</h3>
                <button className="bg-on-primary-container text-primary-container text-[10px] font-bold py-2 px-4 rounded-full inline-block hover:opacity-90 transition-opacity">
                  Plan High Load Tasks
                </button>
              </div>
              <div className="absolute -right-4 -bottom-4 opacity-10">
                <Sun className="w-24 h-24 fill-current" />
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function ApplianceCard({ icon: Icon, name, status, value, unit, cost, active, chart }: any) {
  return (
    <motion.div 
      whileHover={{ scale: 1.01 }}
      className="bg-surface-container-lowest rounded-3xl p-6 shadow-sm border border-outline-variant/10"
    >
      <div className="flex justify-between items-start mb-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-surface-container-low rounded-2xl flex items-center justify-center text-primary">
            <Icon className="w-8 h-8" />
          </div>
          <div>
            <h3 className="font-headline font-bold text-lg">{name}</h3>
            <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider ${active ? 'text-green-600' : 'text-on-surface-variant opacity-60'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-green-600 animate-pulse' : 'bg-on-surface-variant'}`}></span> {status}
            </span>
          </div>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input type="checkbox" className="sr-only peer" defaultChecked={active} />
          <div className="w-11 h-6 bg-surface-variant peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
        </label>
      </div>

      <div className="mb-6">
        <span className="text-4xl font-extrabold font-headline">{value} <span className="text-lg font-medium text-on-surface-variant">{unit}</span></span>
        <p className="text-sm text-on-surface-variant">Real-time power draw</p>
      </div>

      <div className="h-16 w-full flex items-end gap-1 mb-6">
        {chart.map((h: number, i: number) => (
          <div 
            key={i} 
            className={`w-full rounded-t-sm transition-all duration-500 ${h > 90 ? 'bg-primary shadow-[0_0_10px_rgba(112,93,0,0.4)]' : 'bg-primary-container/30'}`} 
            style={{ height: `${h}%` }}
          ></div>
        ))}
      </div>

      <div className="pt-4 border-t border-surface-variant/30 flex justify-between items-center">
        <span className="text-sm font-medium text-on-surface-variant">Estimated Cost</span>
        <span className="font-bold text-on-surface font-headline">{cost}</span>
      </div>
    </motion.div>
  );
}

function OptimizationItem({ icon: Icon, title, description, action, color = 'primary' }: any) {
  return (
    <div className={`bg-surface-container-lowest p-5 rounded-2xl shadow-sm border-l-4 ${color === 'primary' ? 'border-primary' : 'border-on-surface-variant'}`}>
      <div className="flex items-start gap-3 mb-2">
        <Icon className={`w-5 h-5 ${color === 'primary' ? 'text-primary' : 'text-on-surface-variant'}`} />
        <p className="font-headline font-bold text-sm">{title}</p>
      </div>
      <p className="text-[10px] text-on-surface-variant leading-relaxed">{description}</p>
      <button className={`mt-4 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 hover:gap-2 transition-all ${color === 'primary' ? 'text-primary' : 'text-on-surface-variant'}`}>
        {action} <ArrowRight className="w-3 h-3" />
      </button>
    </div>
  );
}
