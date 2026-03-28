import React from 'react';
import { 
  Camera, 
  Wallet, 
  Plus, 
  Edit2, 
  Link2Off, 
  Lock, 
  Shield, 
  Trash2, 
  ArrowRight,
  ChevronRight,
  Bell,
  Wind,
  Refrigerator,
  Router
} from 'lucide-react';
import { motion } from 'motion/react';

export function SettingsScreen() {
  return (
    <div className="max-w-6xl mx-auto px-8 py-12">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Profile & Budgeting */}
        <section className="lg:col-span-8 space-y-8">
          {/* Profile Settings */}
          <div className="bg-surface-container-lowest rounded-xl p-8 shadow-sm border border-outline-variant/10">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="font-headline text-xl font-bold text-on-surface">Profile Settings</h3>
                <p className="text-sm text-on-surface-variant">Manage your personal information and public profile.</p>
              </div>
              <button className="px-6 py-2 bg-primary-container text-on-primary-container font-bold rounded-full text-sm transition-transform active:scale-95 hover:shadow-md">
                Save Changes
              </button>
            </div>
            
            <div className="flex flex-col md:flex-row gap-10 items-start">
              <div className="relative group">
                <img 
                  src="https://picsum.photos/seed/profile/200/200" 
                  alt="Profile" 
                  className="w-32 h-32 rounded-3xl object-cover ring-4 ring-primary-container/20"
                  referrerPolicy="no-referrer"
                />
                <button className="absolute -bottom-2 -right-2 bg-white p-2 rounded-full shadow-lg border border-outline-variant/20 hover:bg-surface-container transition-colors">
                  <Camera className="text-primary w-5 h-5" />
                </button>
              </div>
              
              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                <InputGroup label="Full Name" value="Juan Dela Cruz" />
                <InputGroup label="Email Address" value="juan.delacruz@wattzup.io" type="email" />
                <InputGroup label="Phone Number" value="+63 917 123 4567" type="tel" />
                <InputGroup label="Location" value="Manila, Philippines" />
              </div>
            </div>
          </div>

          {/* Energy Budgeting */}
          <div className="bg-surface-container-lowest rounded-xl p-8 shadow-sm border border-outline-variant/10">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-primary-container/20 p-2 rounded-lg">
                <Wallet className="text-primary w-6 h-6" />
              </div>
              <div>
                <h3 className="font-headline text-xl font-bold text-on-surface">Energy Budgeting</h3>
                <p className="text-sm text-on-surface-variant">Control your monthly spending and usage thresholds.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-4">
                <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Monthly Budget (₱)</label>
                <div className="flex items-center gap-4">
                  <span className="text-3xl font-headline font-extrabold text-on-surface">₱4,000</span>
                  <button className="text-xs font-bold text-primary underline underline-offset-4 hover:opacity-70">Edit Limit</button>
                </div>
                <div className="w-full bg-surface-container-low h-2 rounded-full overflow-hidden">
                  <div className="bg-primary h-full" style={{ width: '65%' }}></div>
                </div>
                <p className="text-[11px] text-on-surface-variant font-medium">You have used ₱2,600 (65%) of your budget.</p>
              </div>

              <div className="space-y-6">
                <div className="flex justify-between items-end">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">High Usage Alert Threshold</label>
                  <span className="text-sm font-bold text-primary">80%</span>
                </div>
                <input 
                  type="range" 
                  className="w-full h-1 bg-surface-container-high rounded-full appearance-none cursor-pointer accent-primary" 
                  min="50" max="100" defaultValue="80"
                />
                <p className="text-[11px] text-on-surface-variant leading-relaxed">
                  We'll send a push notification when your consumption reaches 80% of your defined monthly budget.
                </p>
              </div>
            </div>
          </div>

          {/* Connected Devices */}
          <div className="bg-surface-container-lowest rounded-xl p-8 shadow-sm border border-outline-variant/10">
            <div className="flex items-center justify-between mb-8">
              <h3 className="font-headline text-xl font-bold text-on-surface">Connected Devices</h3>
              <button className="flex items-center gap-2 px-4 py-2 border border-outline-variant text-sm font-bold rounded-full hover:bg-surface-container transition-colors">
                <Plus className="w-4 h-4" />
                Add Device
              </button>
            </div>
            
            <div className="space-y-4">
              <DeviceItem icon={Wind} name="Master AC" details="LG Inverter V12-S • Living Room" />
              <DeviceItem icon={Refrigerator} name="Kitchen Fridge" details="Samsung Family Hub • Kitchen" />
              <DeviceItem icon={Router} name="Main Router" details="Asus RT-AX88U • Study Room" />
            </div>
          </div>
        </section>

        {/* Sidebar Settings */}
        <aside className="lg:col-span-4 space-y-8">
          {/* Notifications */}
          <div className="bg-surface-container-lowest rounded-xl p-8 shadow-sm border border-outline-variant/10">
            <h3 className="font-headline text-lg font-bold text-on-surface mb-6">Notifications</h3>
            <div className="space-y-6">
              <ToggleItem label="Energy Alerts" description="Instant push for high usage" checked />
              <ToggleItem label="Weekly Reports" description="Summary of your solar gains" checked />
              <ToggleItem label="Community Challenges" description="Compete with local neighbors" />
              <ToggleItem label="New Badge Earned" description="Gamified achievement alerts" checked />
            </div>
          </div>

          {/* Account Security */}
          <div className="bg-surface-container-lowest rounded-xl p-8 shadow-sm border border-outline-variant/10">
            <h3 className="font-headline text-lg font-bold text-on-surface mb-6">Account Security</h3>
            <div className="space-y-4">
              <SecurityButton icon={Lock} label="Change Password" />
              <SecurityButton icon={Shield} label="Two-Factor Auth" subLabel="DISABLED" subLabelColor="text-red-600" />
              
              <div className="pt-4">
                <button className="text-xs font-bold text-red-600 flex items-center gap-2 hover:opacity-80 transition-opacity">
                  <Trash2 className="w-4 h-4" />
                  Delete My Account
                </button>
              </div>
            </div>
          </div>

          {/* Help & Support */}
          <div className="bg-primary/5 rounded-xl p-6 border border-primary/10">
            <h4 className="text-sm font-bold text-on-surface mb-2">Need Help?</h4>
            <p className="text-xs text-on-surface-variant mb-4 leading-relaxed">Check our documentation or chat with a solar expert to optimize your setup.</p>
            <a href="#" className="inline-flex items-center gap-2 text-primary text-[10px] font-extrabold uppercase tracking-widest hover:gap-3 transition-all">
              Go to Help Center
              <ArrowRight className="w-3 h-3" />
            </a>
          </div>
        </aside>
      </div>
    </div>
  );
}

function InputGroup({ label, value, type = "text" }: any) {
  return (
    <div className="space-y-1">
      <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant px-1">{label}</label>
      <input 
        type={type} 
        defaultValue={value}
        className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-primary-container"
      />
    </div>
  );
}

function DeviceItem({ icon: Icon, name, details }: any) {
  return (
    <div className="flex items-center justify-between p-4 rounded-2xl bg-surface-container-low group hover:bg-surface-container-lowest transition-all hover:ring-1 hover:ring-primary-container/30">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-primary">
          <Icon className="w-6 h-6" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-on-surface">{name}</h4>
          <p className="text-xs text-on-surface-variant">{details}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button className="p-2 text-on-surface-variant hover:text-primary"><Edit2 className="w-4 h-4" /></button>
        <button className="p-2 text-on-surface-variant hover:text-red-600"><Link2Off className="w-4 h-4" /></button>
      </div>
    </div>
  );
}

function ToggleItem({ label, description, checked }: any) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-bold text-on-surface">{label}</p>
        <p className="text-[10px] text-on-surface-variant">{description}</p>
      </div>
      <label className="relative inline-flex items-center cursor-pointer">
        <input type="checkbox" className="sr-only peer" defaultChecked={checked} />
        <div className="w-11 h-6 bg-surface-container-high peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
      </label>
    </div>
  );
}

function SecurityButton({ icon: Icon, label, subLabel, subLabelColor }: any) {
  return (
    <button className="w-full flex items-center justify-between p-4 rounded-xl bg-surface-container-low hover:bg-surface-container-high transition-colors text-left group">
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
