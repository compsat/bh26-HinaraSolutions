import React, { useEffect, useState } from 'react';
import { 
  Plus, ChevronDown, Wind, Refrigerator, Tv, WashingMachine,
  ArrowRight, Sun, Clock, Thermometer, Settings2, Zap, Laptop,
  X, Loader2, Trash2
} from 'lucide-react';
import { motion } from 'motion/react';
import { supabase } from '@/src/lib/supabase';
import { useAppliances } from '@/src/hooks/useAppliances';
import * as api from '@/src/lib/api';
import { APPLIANCE_DEFAULTS, ALL_APPLIANCE_TYPES } from '@/src/lib/constants';
import { calculateDailyKwh, calculateMonthlyCost, formatPeso } from '@/src/lib/energy-calculator';
import { DEFAULT_RATE_PER_KWH } from '@/src/lib/constants';
import type { ApplianceType, AiInsight } from '@/src/lib/types';

const ICON_MAP: Record<string, any> = {
  refrigerator: Refrigerator, ac: Wind, washing_machine: WashingMachine,
  tv: Tv, microwave: Zap, computer: Laptop, electric_fan: Wind,
  rice_cooker: Zap, water_heater: Thermometer, lighting: Sun,
  flat_iron: Zap, water_dispenser: Zap, router: Settings2, other: Zap,
};

export function AppliancesScreen() {
  const [userId, setUserId] = useState<string>();
  const [showAddModal, setShowAddModal] = useState(false);
  const [rate, setRate] = useState(DEFAULT_RATE_PER_KWH);
  const [optimizations, setOptimizations] = useState<AiInsight[]>([]);
  const [sortBy, setSortBy] = useState('usage');

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUserId(user.id);
    });
    api.getCurrentRate().then(setRate);
  }, []);

  const { appliances, loading, addAppliance, updateAppliance, deleteAppliance } = useAppliances(userId);

  useEffect(() => {
    if (userId) {
      api.getUserInsights(userId).then(ins => {
        setOptimizations(ins.filter(i => i.insight_type === 'optimization').slice(0, 3));
      });
    }
  }, [userId]);

  const sorted = [...appliances].sort((a, b) => {
    if (sortBy === 'name') return (a.custom_name || a.appliance_type).localeCompare(b.custom_name || b.appliance_type);
    if (sortBy === 'active') return (b.is_active ? 1 : 0) - (a.is_active ? 1 : 0);
    return calculateDailyKwh(b.wattage, b.default_daily_hours, b.quantity) - calculateDailyKwh(a.wattage, a.default_daily_hours, a.quantity);
  });

  if (loading) {
    return <div className="p-8 flex items-center justify-center min-h-[60vh]"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-primary mb-2 block">Energy Management</span>
          <h1 className="text-4xl font-extrabold font-headline tracking-tight text-on-surface">My Appliances</h1>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative">
            <select value={sortBy} onChange={e => setSortBy(e.target.value)}
              className="appearance-none bg-surface-container-low border-none rounded-full py-3 px-6 pr-12 text-sm font-semibold focus:ring-2 focus:ring-primary-container text-on-surface cursor-pointer">
              <option value="usage">Sort by: Highest Usage</option>
              <option value="name">Sort by: Name</option>
              <option value="active">Sort by: Active State</option>
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant w-4 h-4" />
          </div>
          <button onClick={() => setShowAddModal(true)}
            className="bg-primary-container text-on-primary-container py-3 px-8 rounded-full font-bold flex items-center gap-2 hover:shadow-lg transition-all active:scale-95">
            <Plus className="w-5 h-5" /> Add New Appliance
          </button>
        </div>
      </header>

      <div className="flex flex-col lg:flex-row gap-8">
        <section className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-6">
          {sorted.map((app) => {
            const Icon = ICON_MAP[app.appliance_type] || Zap;
            const dailyKwh = calculateDailyKwh(app.wattage, app.default_daily_hours, app.quantity);
            const monthlyCost = calculateMonthlyCost(dailyKwh, rate);
            const displayName = app.quantity > 1 ? `${app.custom_name || app.appliance_type} (x${app.quantity})` : (app.custom_name || APPLIANCE_DEFAULTS[app.appliance_type]?.label || app.appliance_type);
            const chart = Array.from({ length: 7 }, () => Math.floor(Math.random() * 60) + 20);

            return (
              <ApplianceCard
                key={app.id}
                icon={Icon}
                name={displayName}
                status={app.is_active ? 'Active' : 'Inactive'}
                value={app.wattage >= 1000 ? (app.wattage / 1000).toFixed(1) : String(app.wattage)}
                unit={app.wattage >= 1000 ? 'kW' : 'W'}
                cost={`${formatPeso(monthlyCost / 30)} Today`}
                active={app.is_active}
                chart={chart}
                onToggle={() => updateAppliance(app.id, { is_active: !app.is_active })}
                onDelete={() => { if (confirm('Delete this appliance?')) deleteAppliance(app.id); }}
              />
            );
          })}
          {sorted.length === 0 && (
            <div className="col-span-2 text-center py-16 text-on-surface-variant">
              <Zap className="w-16 h-16 mx-auto mb-4 opacity-20" />
              <p className="text-lg font-bold mb-2">No appliances yet</p>
              <p className="text-sm">Click "Add New Appliance" to get started tracking your energy usage.</p>
            </div>
          )}
        </section>

        <aside className="w-full lg:w-80 shrink-0">
          <div className="bg-surface-container-low rounded-3xl p-8 sticky top-24 border border-outline-variant/5">
            <div className="flex items-center gap-3 mb-8">
              <Zap className="text-primary w-6 h-6 fill-primary" />
              <h2 className="font-headline font-bold text-xl">Optimization</h2>
            </div>
            <div className="space-y-6">
              {optimizations.length > 0 ? optimizations.map((opt, i) => (
                <OptimizationItem key={opt.id} icon={i === 0 ? Clock : i === 1 ? Thermometer : Settings2}
                  title={opt.title} description={opt.description}
                  action={opt.potential_savings ? `Save ${formatPeso(opt.potential_savings)}` : 'Learn More'}
                />
              )) : (
                <>
                  <OptimizationItem icon={Clock} title="Log Usage First"
                    description="Start logging your daily usage to receive personalized optimization tips from our AI."
                    action="Get Started" />
                </>
              )}
            </div>

            <div className="mt-8 relative overflow-hidden bg-primary-container rounded-2xl p-6 shadow-sm">
              <div className="relative z-10">
                <p className="text-[10px] font-bold uppercase tracking-tighter text-on-primary-container mb-2">Current Rate</p>
                <h3 className="font-headline font-extrabold text-on-primary-container text-lg leading-tight mb-4">Meralco: {formatPeso(rate)}/kWh</h3>
                <p className="text-[10px] text-on-primary-container/70">Updated automatically</p>
              </div>
              <div className="absolute -right-4 -bottom-4 opacity-10">
                <Sun className="w-24 h-24 fill-current" />
              </div>
            </div>
          </div>
        </aside>
      </div>

      {showAddModal && userId && (
        <AddApplianceModal
          onClose={() => setShowAddModal(false)}
          onAdd={async (data) => {
            await addAppliance(data);
            setShowAddModal(false);
          }}
        />
      )}
    </div>
  );
}

function ApplianceCard({ icon: Icon, name, status, value, unit, cost, active, chart, onToggle, onDelete }: any) {
  return (
    <motion.div whileHover={{ scale: 1.01 }}
      className="bg-surface-container-lowest rounded-3xl p-6 shadow-sm border border-outline-variant/10">
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
        <div className="flex items-center gap-2">
          <button onClick={onDelete} className="p-1 text-on-surface-variant/40 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" className="sr-only peer" checked={active} onChange={onToggle} />
            <div className="w-11 h-6 bg-surface-variant peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
          </label>
        </div>
      </div>
      <div className="mb-6">
        <span className="text-4xl font-extrabold font-headline">{value} <span className="text-lg font-medium text-on-surface-variant">{unit}</span></span>
        <p className="text-sm text-on-surface-variant">Rated power draw</p>
      </div>
      <div className="h-16 w-full flex items-end gap-1 mb-6">
        {chart.map((h: number, i: number) => (
          <div key={i} className={`w-full rounded-t-sm transition-all duration-500 ${h > 90 ? 'bg-primary shadow-[0_0_10px_rgba(112,93,0,0.4)]' : 'bg-primary-container/30'}`} style={{ height: `${h}%` }}></div>
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

function AddApplianceModal({ onClose, onAdd }: { onClose: () => void; onAdd: (data: any) => Promise<void> }) {
  const [type, setType] = useState<ApplianceType>('ac');
  const [customName, setCustomName] = useState('');
  const [wattage, setWattage] = useState(APPLIANCE_DEFAULTS.ac.wattage);
  const [quantity, setQuantity] = useState(1);
  const [hours, setHours] = useState(APPLIANCE_DEFAULTS.ac.defaultHours);
  const [saving, setSaving] = useState(false);

  const handleTypeChange = (t: ApplianceType) => {
    setType(t);
    const defaults = APPLIANCE_DEFAULTS[t];
    setWattage(defaults.wattage);
    setHours(defaults.defaultHours);
    setCustomName('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onAdd({
        appliance_type: type,
        custom_name: customName || APPLIANCE_DEFAULTS[type].label,
        wattage,
        quantity,
        default_daily_hours: hours,
        is_always_on: APPLIANCE_DEFAULTS[type].isAlwaysOn,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={onClose}>
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        onClick={e => e.stopPropagation()}
        className="bg-surface-container-lowest rounded-3xl p-8 w-full max-w-md shadow-2xl border border-outline-variant/10">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-headline font-bold text-xl">Add Appliance</h3>
          <button onClick={onClose} className="p-2 hover:bg-surface-container-low rounded-full"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Type</label>
            <select value={type} onChange={e => handleTypeChange(e.target.value as ApplianceType)}
              className="w-full bg-surface-container-low border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-primary-container">
              {ALL_APPLIANCE_TYPES.map(t => (
                <option key={t} value={t}>{APPLIANCE_DEFAULTS[t].emoji} {APPLIANCE_DEFAULTS[t].label}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Custom Name</label>
            <input type="text" value={customName} onChange={e => setCustomName(e.target.value)}
              placeholder={APPLIANCE_DEFAULTS[type].label}
              className="w-full bg-surface-container-low border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-primary-container" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Watts</label>
              <input type="number" value={wattage} onChange={e => setWattage(Number(e.target.value))} min="1"
                className="w-full bg-surface-container-low border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-primary-container" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Qty</label>
              <input type="number" value={quantity} onChange={e => setQuantity(Number(e.target.value))} min="1"
                className="w-full bg-surface-container-low border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-primary-container" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Hrs/Day</label>
              <input type="number" value={hours} onChange={e => setHours(Number(e.target.value))} min="0" max="24" step="0.5"
                className="w-full bg-surface-container-low border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-primary-container" />
            </div>
          </div>
          <button type="submit" disabled={saving}
            className="w-full py-4 bg-primary text-white rounded-xl font-bold transition-all hover:shadow-lg disabled:opacity-50">
            {saving ? 'Adding...' : 'Add Appliance'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
