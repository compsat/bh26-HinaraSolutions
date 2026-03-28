import React, { useEffect, useState } from 'react';
import { 
  Camera, Wallet, Plus, Edit2, Link2Off, Lock, Shield, Trash2,
  ArrowRight, ChevronRight, Bell, Wind, Refrigerator, Router,
  Loader2, Check, Zap
} from 'lucide-react';
import { motion } from 'motion/react';
import { supabase } from '@/src/lib/supabase';
import * as api from '@/src/lib/api';
import { useAppliances } from '@/src/hooks/useAppliances';
import { formatPeso } from '@/src/lib/energy-calculator';
import { APPLIANCE_DEFAULTS } from '@/src/lib/constants';
import type { Profile } from '@/src/lib/types';

const DEVICE_ICONS: Record<string, any> = {
  ac: Wind, refrigerator: Refrigerator, router: Router,
  electric_fan: Wind, tv: Zap, computer: Zap, washing_machine: Zap,
};

export function SettingsScreen() {
  const [userId, setUserId] = useState<string>();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [location, setLocation] = useState('');
  const [monthlyBudget, setMonthlyBudget] = useState(4000);
  const [alertThreshold, setAlertThreshold] = useState(80);
  const [householdSize, setHouseholdSize] = useState(4);
  const [notifyEnergy, setNotifyEnergy] = useState(true);
  const [notifyWeekly, setNotifyWeekly] = useState(true);
  const [notifyCommunity, setNotifyCommunity] = useState(false);
  const [notifyBadges, setNotifyBadges] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) { setUserId(user.id); setEmail(user.email || ''); }
    });
  }, []);

  const { appliances } = useAppliances(userId);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    api.getProfile(userId).then(p => {
      if (p) {
        setProfile(p);
        setFullName(p.full_name || '');
        setLocation(p.location || 'Metro Manila');
        setMonthlyBudget(p.monthly_budget || 4000);
        setAlertThreshold(p.alert_threshold || 80);
        setHouseholdSize(p.household_size || 4);
        setNotifyEnergy(p.notify_energy_alerts);
        setNotifyWeekly(p.notify_weekly_reports);
        setNotifyCommunity(p.notify_community);
        setNotifyBadges(p.notify_badges);
      }
    }).finally(() => setLoading(false));
  }, [userId]);

  const handleSave = async () => {
    if (!userId) return;
    setSaving(true); setSaved(false);
    try {
      await api.updateProfile(userId, {
        full_name: fullName, location, monthly_budget: monthlyBudget,
        alert_threshold: alertThreshold, household_size: householdSize,
        notify_energy_alerts: notifyEnergy, notify_weekly_reports: notifyWeekly,
        notify_community: notifyCommunity, notify_badges: notifyBadges,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error('Save profile error:', err);
      alert('Failed to save. Please try again.');
    } finally { setSaving(false); }
  };

  if (loading) {
    return <div className="p-8 flex items-center justify-center min-h-[60vh]"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="max-w-6xl mx-auto px-8 py-12">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <section className="lg:col-span-8 space-y-8">
          {/* Profile Settings */}
          <div className="bg-surface-container-lowest rounded-xl p-8 shadow-sm border border-outline-variant/10">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="font-headline text-xl font-bold text-on-surface">Profile Settings</h3>
                <p className="text-sm text-on-surface-variant">Manage your personal information and public profile.</p>
              </div>
              <button onClick={handleSave} disabled={saving}
                className={`px-6 py-2 font-bold rounded-full text-sm transition-all active:scale-95 hover:shadow-md ${saved ? 'bg-green-600 text-white' : 'bg-primary-container text-on-primary-container'} disabled:opacity-50`}>
                {saving ? 'Saving...' : saved ? '✓ Saved!' : 'Save Changes'}
              </button>
            </div>
            <div className="flex flex-col md:flex-row gap-10 items-start">
              <div className="relative group">
                <img src={profile?.avatar_url || `https://picsum.photos/seed/${userId?.slice(0,8) || 'profile'}/200/200`}
                  alt="Profile" className="w-32 h-32 rounded-3xl object-cover ring-4 ring-primary-container/20" referrerPolicy="no-referrer" />
                <button className="absolute -bottom-2 -right-2 bg-white p-2 rounded-full shadow-lg border border-outline-variant/20 hover:bg-surface-container transition-colors">
                  <Camera className="text-primary w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                <InputGroup label="Full Name" value={fullName} onChange={setFullName} />
                <InputGroup label="Email Address" value={email} type="email" disabled />
                <InputGroup label="Household Size" value={String(householdSize)} type="number" onChange={v => setHouseholdSize(Number(v))} />
                <InputGroup label="Location" value={location} onChange={setLocation} />
              </div>
            </div>
          </div>

          {/* Energy Budgeting */}
          <div className="bg-surface-container-lowest rounded-xl p-8 shadow-sm border border-outline-variant/10">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-primary-container/20 p-2 rounded-lg"><Wallet className="text-primary w-6 h-6" /></div>
              <div>
                <h3 className="font-headline text-xl font-bold text-on-surface">Energy Budgeting</h3>
                <p className="text-sm text-on-surface-variant">Control your monthly spending and usage thresholds.</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-4">
                <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Monthly Budget (₱)</label>
                <span className="text-3xl font-headline font-extrabold text-on-surface block">{formatPeso(monthlyBudget)}</span>
                <input type="range" className="w-full h-1 bg-surface-container-high rounded-full appearance-none cursor-pointer accent-primary"
                  min="1000" max="20000" step="100" value={monthlyBudget} onChange={e => setMonthlyBudget(Number(e.target.value))} />
                <div className="flex justify-between text-[10px] text-on-surface-variant font-medium"><span>₱1,000</span><span>₱20,000</span></div>
              </div>
              <div className="space-y-6">
                <div className="flex justify-between items-end">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">High Usage Alert Threshold</label>
                  <span className="text-sm font-bold text-primary">{alertThreshold}%</span>
                </div>
                <input type="range" className="w-full h-1 bg-surface-container-high rounded-full appearance-none cursor-pointer accent-primary"
                  min="50" max="100" value={alertThreshold} onChange={e => setAlertThreshold(Number(e.target.value))} />
                <p className="text-[11px] text-on-surface-variant leading-relaxed">
                  We'll send a push notification when your consumption reaches {alertThreshold}% of your defined monthly budget.
                </p>
              </div>
            </div>
          </div>

          {/* Connected Devices */}
          <div className="bg-surface-container-lowest rounded-xl p-8 shadow-sm border border-outline-variant/10">
            <div className="flex items-center justify-between mb-8">
              <h3 className="font-headline text-xl font-bold text-on-surface">Connected Devices</h3>
              <span className="text-sm text-on-surface-variant font-medium">{appliances.length} appliance{appliances.length !== 1 ? 's' : ''}</span>
            </div>
            <div className="space-y-4">
              {appliances.slice(0, 5).map(app => {
                const Icon = DEVICE_ICONS[app.appliance_type] || Zap;
                return (
                  <DeviceItem key={app.id} icon={Icon}
                    name={app.custom_name || APPLIANCE_DEFAULTS[app.appliance_type]?.label || app.appliance_type}
                    details={`${app.wattage}W • ${app.default_daily_hours}h/day • ${app.is_active ? 'Active' : 'Inactive'}`} />
                );
              })}
              {appliances.length === 0 && (
                <p className="text-sm text-on-surface-variant text-center py-4">No appliances added yet.</p>
              )}
            </div>
          </div>
        </section>

        <aside className="lg:col-span-4 space-y-8">
          <div className="bg-surface-container-lowest rounded-xl p-8 shadow-sm border border-outline-variant/10">
            <h3 className="font-headline text-lg font-bold text-on-surface mb-6">Notifications</h3>
            <div className="space-y-6">
              <ToggleItem label="Energy Alerts" description="Instant push for high usage" checked={notifyEnergy} onChange={setNotifyEnergy} />
              <ToggleItem label="Weekly Reports" description="Summary of your energy gains" checked={notifyWeekly} onChange={setNotifyWeekly} />
              <ToggleItem label="Community Challenges" description="Compete with local neighbors" checked={notifyCommunity} onChange={setNotifyCommunity} />
              <ToggleItem label="New Badge Earned" description="Gamified achievement alerts" checked={notifyBadges} onChange={setNotifyBadges} />
            </div>
          </div>

          <div className="bg-surface-container-lowest rounded-xl p-8 shadow-sm border border-outline-variant/10">
            <h3 className="font-headline text-lg font-bold text-on-surface mb-6">Account Security</h3>
            <div className="space-y-4">
              <SecurityButton icon={Lock} label="Change Password" onClick={async () => {
                const { error } = await supabase.auth.resetPasswordForEmail(email);
                if (!error) alert('Password reset email sent!'); else alert('Error: ' + error.message);
              }} />
              <SecurityButton icon={Shield} label="Two-Factor Auth" subLabel="DISABLED" subLabelColor="text-red-600" />
              <div className="pt-4">
                <button className="text-xs font-bold text-red-600 flex items-center gap-2 hover:opacity-80 transition-opacity">
                  <Trash2 className="w-4 h-4" /> Delete My Account
                </button>
              </div>
            </div>
          </div>

          <div className="bg-primary/5 rounded-xl p-6 border border-primary/10">
            <h4 className="text-sm font-bold text-on-surface mb-2">Need Help?</h4>
            <p className="text-xs text-on-surface-variant mb-4 leading-relaxed">Check our documentation or chat with Zippy to optimize your setup.</p>
            <a href="#" className="inline-flex items-center gap-2 text-primary text-[10px] font-extrabold uppercase tracking-widest hover:gap-3 transition-all">
              Go to Help Center <ArrowRight className="w-3 h-3" />
            </a>
          </div>
        </aside>
      </div>
    </div>
  );
}

function InputGroup({ label, value, type = "text", onChange, disabled }: {
  label: string; value: string; type?: string; onChange?: (v: string) => void; disabled?: boolean;
}) {
  return (
    <div className="space-y-1">
      <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant px-1">{label}</label>
      <input type={type} value={value} onChange={e => onChange?.(e.target.value)} disabled={disabled}
        className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-primary-container disabled:opacity-50" />
    </div>
  );
}

function DeviceItem({ icon: Icon, name, details }: any) {
  return (
    <div className="flex items-center justify-between p-4 rounded-2xl bg-surface-container-low group hover:bg-surface-container-lowest transition-all hover:ring-1 hover:ring-primary-container/30">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-primary"><Icon className="w-6 h-6" /></div>
        <div>
          <h4 className="text-sm font-bold text-on-surface">{name}</h4>
          <p className="text-xs text-on-surface-variant">{details}</p>
        </div>
      </div>
    </div>
  );
}

function ToggleItem({ label, description, checked, onChange }: {
  label: string; description: string; checked: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-bold text-on-surface">{label}</p>
        <p className="text-[10px] text-on-surface-variant">{description}</p>
      </div>
      <label className="relative inline-flex items-center cursor-pointer">
        <input type="checkbox" className="sr-only peer" checked={checked} onChange={e => onChange(e.target.checked)} />
        <div className="w-11 h-6 bg-surface-container-high peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
      </label>
    </div>
  );
}

function SecurityButton({ icon: Icon, label, subLabel, subLabelColor, onClick }: any) {
  return (
    <button onClick={onClick}
      className="w-full flex items-center justify-between p-4 rounded-xl bg-surface-container-low hover:bg-surface-container-high transition-colors text-left group">
      <div className="flex items-center gap-3">
        <Icon className="text-on-surface-variant group-hover:text-primary w-5 h-5" />
        <div>
          <span className="text-sm font-bold block">{label}</span>
          {subLabel && <span className={`text-[10px] font-bold uppercase ${subLabelColor}`}>{subLabel}</span>}
        </div>
      </div>
      <ChevronRight className="w-4 h-4 text-on-surface-variant" />
    </button>
  );
}
