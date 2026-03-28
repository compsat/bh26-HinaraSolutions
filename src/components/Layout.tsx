import React, { useState, useEffect, useRef } from 'react';
import { 
  LayoutDashboard, Zap, BrainCircuit, Users, Settings, Mic, 
  Search, Bell, LogOut, TrendingUp
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { supabase } from '@/src/lib/supabase';
import * as api from '@/src/lib/api';
import { calculateCO2Saved } from '@/src/lib/energy-calculator';
import { VoiceInputModal } from './VoiceInputModal';

type Tab = 'dashboard' | 'appliances' | 'insights' | 'community' | 'settings';

interface SidebarProps {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
}

export function Sidebar({ activeTab, setActiveTab }: SidebarProps) {
  const [showVoice, setShowVoice] = useState(false);
  const [userId, setUserId] = useState<string>('');
  const [co2Saved, setCo2Saved] = useState(0);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUserId(user.id);
        // Calculate CO2 saved from total kWh this month
        api.getDashboardData(user.id).then(dash => {
          // Estimate savings as budget minus projected (if under budget)
          const savedPeso = Math.max(0, dash.monthlyBudget - dash.projectedBill);
          const rateApprox = 11.8569;
          const savedKwh = savedPeso / rateApprox;
          setCo2Saved(Math.round(calculateCO2Saved(savedKwh) * 10) / 10);
        }).catch(() => {});
      }
    });
  }, []);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'appliances', label: 'Appliances', icon: Zap },
    { id: 'insights', label: 'AI Insights', icon: BrainCircuit },
    { id: 'community', label: 'Community', icon: Users },
    { id: 'settings', label: 'Settings', icon: Settings },
  ] as const;

  return (
    <>
      <aside className="h-screen w-64 fixed left-0 top-0 bg-surface-container-low flex flex-col p-6 gap-8 z-50 border-r border-outline-variant/20">
        <div className="flex items-center gap-3">
          <div className="w-15 h-15 rounded-xl bg-primary-container flex items-center justify-center">
            <img src="/wattzap_logo.png" alt="WattZup" className="w-15 h-15 rounded-xl object-contain" />
          </div>
          <div>
            <h1 className="text-lg font-black text-primary font-headline tracking-tight">WattZap</h1>
            <p className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold">Energy Intelligence</p>
          </div>
        </div>

        <nav className="flex flex-col gap-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={cn(
                "flex items-center gap-3 py-2 px-3 rounded-lg transition-all text-sm font-medium font-headline",
                activeTab === item.id 
                  ? "text-primary bg-surface-container-lowest shadow-sm border-r-4 border-primary" 
                  : "text-on-surface opacity-70 hover:opacity-100 hover:bg-surface-container-lowest"
              )}
            >
              <item.icon className={cn("w-5 h-5", activeTab === item.id && "fill-primary/20")} />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="mt-auto space-y-4">
          <div className="p-4 bg-primary-container/10 rounded-2xl border border-primary-container/30">
            <p className="text-xs font-bold text-primary mb-2 uppercase tracking-tighter">Your Impact</p>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black font-headline">{co2Saved || '0.0'}</span>
              <span className="text-[10px] leading-tight text-on-surface-variant font-medium">kg CO2<br />saved</span>
            </div>
          </div>

          <button
            onClick={() => setShowVoice(true)}
            className="w-full flex items-center justify-center gap-2 py-3 bg-primary-container text-on-primary-container rounded-full font-bold shadow-sm hover:shadow-md transition-all active:scale-95"
          >
            <Mic className="w-5 h-5" />
            <span>Voice Input</span>
          </button>
        </div>
      </aside>

      <VoiceInputModal
        isOpen={showVoice}
        onClose={() => setShowVoice(false)}
        userId={userId}
        onLogged={() => {
          // Could trigger a global refresh here
        }}
      />
    </>
  );
}

export function Header({ title }: { title: string }) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        api.getUnreadInsightCount(user.id).then(setUnreadCount).catch(() => {});
      }
    });
  }, []);

  // Close the dropdown if the user clicks outside of it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="w-full sticky top-0 z-40 bg-surface/80 backdrop-blur-md flex justify-between items-center px-8 py-4 border-b border-outline-variant/10">
      <div className="flex items-center gap-4">
        <h2 className="text-2xl font-bold tracking-tight text-primary font-headline">{title}</h2>
      </div>
      
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2 px-4 py-2 bg-surface-container-low rounded-full">
          <Search className="text-on-surface-variant w-4 h-4" />
          <input 
            type="text" 
            placeholder="Ask AI about your bill..." 
            className="bg-transparent border-none focus:ring-0 text-sm w-48 font-medium placeholder:text-on-surface-variant/50"
          />
        </div>
        
        <div className="flex items-center gap-4">
          <button className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-surface-container-high transition-colors relative">
            <Bell className="w-5 h-5 text-on-surface-variant" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
          
          {/* Profile Dropdown Container */}
          <div className="relative" ref={menuRef}>
            <button 
              onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
              className="w-10 h-10 rounded-full overflow-hidden border-2 border-primary-container shadow-sm active:scale-95 transition-transform block"
            >
              <img 
                src="https://picsum.photos/seed/user/100/100" 
                alt="User profile" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </button>

            {/* Dropdown Menu */}
            {isProfileMenuOpen && (
              <div className="absolute right-0 mt-3 w-48 bg-surface-container-lowest rounded-xl shadow-lg border border-outline-variant/20 py-2 z-50">
                <button 
                  onClick={() => {
                    setIsProfileMenuOpen(false);
                    supabase.auth.signOut();
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm font-medium text-error hover:bg-error/10 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            )}
          </div>

        </div>
      </div>
    </header>
  );
}