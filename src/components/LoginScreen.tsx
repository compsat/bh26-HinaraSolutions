import React, { useState } from 'react';
import { supabase } from '@/src/lib/supabase';
import { Zap, Mail, Lock, ArrowRight, Github, Chrome, ChevronLeft, Plus, Minus, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/src/lib/utils'; // Moved to the top!

interface LoginScreenProps {
  onBack?: () => void;
}

interface Appliance {
  id: string;
  name: string;
  quantity: number;
  icon: string;
}

const DEFAULT_APPLIANCES: Appliance[] = [
  { id: 'fridge', name: 'Refrigerator', quantity: 1, icon: '❄️' },
  { id: 'ac', name: 'Air Conditioner', quantity: 0, icon: '💨' },
  { id: 'washer', name: 'Washing Machine', quantity: 1, icon: '🧺' },
  { id: 'tv', name: 'Television', quantity: 1, icon: '📺' },
  { id: 'microwave', name: 'Microwave', quantity: 1, icon: '🍲' },
  { id: 'computer', name: 'Computer/Laptop', quantity: 1, icon: '💻' },
];

// This function was created using Generative AI
export function LoginScreen({ onBack }: LoginScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSignUp, setIsSignUp] = useState(false);
  const [step, setStep] = useState(1); // 1: Auth, 2: Appliances
  const [appliances, setAppliances] = useState<Appliance[]>(DEFAULT_APPLIANCES);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // --- NEW: Client-side validation to prevent 422 Backend Errors ---
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid, complete email address.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }
    // -----------------------------------------------------------------

    if (isSignUp && step === 1) {
      setStep(2);
      return;
    }

    setLoading(true);
    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              appliances: appliances.filter(a => a.quantity > 0)
            }
          }
        });
        if (error) throw error;
        alert('Check your email for the confirmation link! (Or turn off email confirmation in Supabase dashboard to skip this during the hackathon)');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err: any) {
      setError(err.message);
      if (isSignUp) setStep(1);
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = (id: string, delta: number) => {
    setAppliances(prev => prev.map(a =>
        a.id === id ? { ...a, quantity: Math.max(0, a.quantity + delta) } : a
    ));
  };

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-6">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-primary-container/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-primary-container/10 rounded-full blur-3xl"></div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-surface-container-lowest p-10 rounded-[2.5rem] shadow-2xl border border-outline-variant/10 relative z-10"
      >
        {(onBack || (isSignUp && step === 2)) && (
          <button 
            onClick={() => step === 2 ? setStep(1) : onBack?.()}
            className="absolute left-6 top-6 p-2 text-on-surface-variant hover:text-primary hover:bg-primary-container/20 rounded-full transition-all"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}
        
        <div className="flex flex-col items-center mb-10">
          <div className="w-16 h-16 rounded-2xl bg-primary-container flex items-center justify-center mb-6 shadow-lg shadow-primary-container/20">
            <img src="/wattzap_logo.png" alt="WattZup" className="w-15 h-15 rounded-xl object-contain" />
          </div>
          <h1 className="text-3xl font-black font-headline text-primary tracking-tight">WattZup</h1>
          <p className="text-sm text-on-surface-variant font-medium mt-2 text-center">
            {isSignUp 
              ? step === 1 ? 'Create your energy intelligence account' : 'Tell us about your household'
              : 'Welcome back to your energy dashboard'}
          </p>
        </div>

        <AnimatePresence mode="wait">
          {step === 1 ? (
            <motion.form 
              key="step1"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              onSubmit={handleAuth} 
              className="space-y-6"
            >
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant px-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant/50" />
                  <input 
                    type="email" 
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-surface-container-low border-none rounded-2xl pl-12 pr-4 py-4 text-sm font-medium focus:ring-2 focus:ring-primary-container transition-all"
                    placeholder="name@example.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant px-1">Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant/50" />
                  <input 
                    type="password" 
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-surface-container-low border-none rounded-2xl pl-12 pr-4 py-4 text-sm font-medium focus:ring-2 focus:ring-primary-container transition-all"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              {error && (
                <p className="text-xs font-bold text-red-600 bg-red-50 p-3 rounded-xl border border-red-100">
                  {error}
                </p>
              )}

              <button 
                type="submit" 
                disabled={loading}
                className="w-full py-4 bg-primary text-white rounded-2xl font-black font-headline text-sm uppercase tracking-widest hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? 'Processing...' : isSignUp ? 'Continue' : 'Sign In'}
                {!loading && <ArrowRight className="w-4 h-4" />}
              </button>

              
    
            </motion.form>
          ) : (
            <motion.div 
              key="step2"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 gap-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {appliances.map((appliance) => (
                  <div 
                    key={appliance.id}
                    className={cn(
                      "flex items-center justify-between p-4 rounded-2xl border transition-all",
                      appliance.quantity > 0 
                        ? "bg-primary-container/10 border-primary/20" 
                        : "bg-surface-container-low border-transparent opacity-60"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{appliance.icon}</span>
                      <span className="text-sm font-bold text-on-surface">{appliance.name}</span>
                    </div>
                    <div className="flex items-center gap-3 bg-surface-container-lowest rounded-full p-1 border border-outline-variant/10">
                      <button 
                        onClick={() => updateQuantity(appliance.id, -1)}
                        className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-surface-container-high transition-colors text-on-surface-variant"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-6 text-center text-sm font-black font-headline">{appliance.quantity}</span>
                      <button 
                        onClick={() => updateQuantity(appliance.id, 1)}
                        className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-surface-container-high transition-colors text-primary"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <button 
                onClick={handleAuth}
                disabled={loading}
                className="w-full py-4 bg-primary text-white rounded-2xl font-black font-headline text-sm uppercase tracking-widest hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? 'Creating Account...' : 'Complete Sign Up'}
                {!loading && <Check className="w-4 h-4" />}
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <p className="mt-10 text-center text-sm font-medium text-on-surface-variant">
          {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button 
            onClick={() => {
              setIsSignUp(!isSignUp);
              setStep(1);
              setError(null);
            }}
            className="text-primary font-black hover:underline underline-offset-4"
          >
            {isSignUp ? 'Sign In' : 'Create One'}
          </button>
        </p>
      </motion.div>
    </div>
  );
}
