import React from 'react';
import { motion } from 'motion/react';
import { Zap, Sun, Shield, BarChart3, ArrowRight, Globe, Leaf, Users, BrainCircuit } from 'lucide-react';

interface LandingScreenProps {
  onGetStarted: () => void;
}

export function LandingScreen({ onGetStarted }: LandingScreenProps) {
  return (
    <div className="min-h-screen bg-surface selection:bg-primary/30 selection:text-primary">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-surface/80 backdrop-blur-md border-b border-outline-variant/10 px-8 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary-container flex items-center justify-center">
            <Zap className="text-primary w-6 h-6 fill-primary" />
          </div>
          <h1 className="text-xl font-black text-primary font-headline tracking-tight">WattZup</h1>
        </div>
        <div className="hidden md:flex items-center gap-8">
          <a href="#features" className="text-sm font-bold text-on-surface-variant hover:text-primary transition-colors">Features</a>
          <a href="#impact" className="text-sm font-bold text-on-surface-variant hover:text-primary transition-colors">Impact</a>
          <a href="#community" className="text-sm font-bold text-on-surface-variant hover:text-primary transition-colors">Community</a>
        </div>
        <button 
          onClick={onGetStarted}
          className="px-6 py-2.5 bg-primary text-white rounded-full font-bold text-sm hover:shadow-lg hover:-translate-y-0.5 transition-all active:scale-95"
        >
          Sign In
        </button>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-8 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary-container/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-primary-container/10 rounded-full blur-3xl"></div>
        </div>

        <div className="max-w-5xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-block px-4 py-1.5 bg-primary-container/30 text-primary rounded-full text-[10px] font-black uppercase tracking-widest mb-6">
              Next-Gen Energy Intelligence
            </span>
            <h2 className="text-5xl md:text-7xl font-black font-headline text-on-surface leading-[1.1] tracking-tight mb-8">
              Master Your Home's <br />
              <span className="text-primary italic">Energy DNA</span>
            </h2>
            <p className="text-lg md:text-xl text-on-surface-variant max-w-2xl mx-auto mb-12 font-medium leading-relaxed">
              WattZup uses advanced AI to decode your power consumption, predict solar yields, and help you save up to 40% on your monthly bills.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button 
                onClick={onGetStarted}
                className="w-full sm:w-auto px-10 py-5 bg-primary text-white rounded-2xl font-black font-headline text-sm uppercase tracking-widest hover:shadow-2xl hover:-translate-y-1 transition-all flex items-center justify-center gap-3"
              >
                Start Saving Now
                <ArrowRight className="w-5 h-5" />
              </button>
              <button className="w-full sm:w-auto px-10 py-5 bg-surface-container-low text-on-surface rounded-2xl font-black font-headline text-sm uppercase tracking-widest hover:bg-surface-container-high transition-all">
                Watch Demo
              </button>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="mt-20 relative"
          >
            <div className="relative rounded-[3rem] overflow-hidden shadow-2xl border-8 border-surface-container-low">
              <img 
                src="https://picsum.photos/seed/dashboard/1200/800" 
                alt="WattZup Dashboard Preview" 
                className="w-full h-auto"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-surface/40 to-transparent"></div>
            </div>
            
            {/* Floating Stats */}
            <div className="absolute -left-10 top-1/4 hidden lg:block p-6 bg-white rounded-3xl shadow-xl border border-outline-variant/10 animate-bounce-slow">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-green-100 flex items-center justify-center">
                  <Leaf className="text-green-600 w-6 h-6" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">CO2 Saved</p>
                  <p className="text-xl font-black text-on-surface">12.4 kg</p>
                </div>
              </div>
            </div>

            <div className="absolute -right-10 bottom-1/4 hidden lg:block p-6 bg-white rounded-3xl shadow-xl border border-outline-variant/10 animate-bounce-slow delay-700">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-primary-container flex items-center justify-center">
                  <Sun className="text-primary w-6 h-6" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Solar Yield</p>
                  <p className="text-xl font-black text-on-surface">4.8 kWh</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 px-8 bg-surface-container-lowest">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h3 className="text-3xl md:text-5xl font-black font-headline text-on-surface mb-4">Intelligence in Every Watt</h3>
            <p className="text-on-surface-variant font-medium">Everything you need to optimize your home energy ecosystem.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: BarChart3,
                title: "Real-time Analytics",
                desc: "Track every appliance's consumption with millisecond precision."
              },
              {
                icon: BrainCircuit,
                title: "AI Forecasting",
                desc: "Predict your next bill and solar production with 98% accuracy."
              },
              {
                icon: Shield,
                title: "Safety Alerts",
                desc: "Get notified about unusual power spikes or faulty appliances."
              }
            ].map((feature, i) => (
              <div key={i} className="p-10 bg-surface rounded-[2.5rem] border border-outline-variant/10 hover:shadow-xl transition-all group">
                <div className="w-16 h-16 rounded-2xl bg-primary-container/20 flex items-center justify-center mb-8 group-hover:bg-primary-container transition-colors">
                  <feature.icon className="text-primary w-8 h-8" />
                </div>
                <h4 className="text-xl font-black font-headline text-on-surface mb-4">{feature.title}</h4>
                <p className="text-on-surface-variant font-medium leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section id="community" className="py-24 px-8">
        <div className="max-w-7xl mx-auto bg-primary rounded-[3rem] p-12 md:p-20 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-1/2 h-full opacity-10 pointer-events-none">
            <Globe className="w-full h-full text-white" />
          </div>
          
          <div className="relative z-10 max-w-2xl">
            <h3 className="text-3xl md:text-5xl font-black font-headline text-white mb-8">Join the Neighborhood Revolution</h3>
            <p className="text-white/80 text-lg font-medium mb-12">
              Over 10,000 households are already saving together. Compete in local challenges, earn rewards, and make your neighborhood the greenest in the city.
            </p>
            <div className="flex items-center gap-6">
              <div className="flex -space-x-4">
                {[1, 2, 3, 4].map(i => (
                  <img 
                    key={i}
                    src={`https://picsum.photos/seed/user${i}/100/100`} 
                    className="w-12 h-12 rounded-full border-4 border-primary"
                    alt="User"
                    referrerPolicy="no-referrer"
                  />
                ))}
              </div>
              <p className="text-white font-bold text-sm">Join 10k+ WattZuppers</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-8 border-t border-outline-variant/10 text-center">
        <div className="flex items-center justify-center gap-3 mb-6">
          <Zap className="text-primary w-6 h-6 fill-primary" />
          <span className="text-xl font-black text-primary font-headline tracking-tight">WattZup</span>
        </div>
        <p className="text-sm text-on-surface-variant font-medium mb-8">© 2026 WattZup Energy Intelligence. All rights reserved.</p>
        <div className="flex justify-center gap-8">
          <a href="#" className="text-xs font-bold text-on-surface-variant hover:text-primary">Privacy Policy</a>
          <a href="#" className="text-xs font-bold text-on-surface-variant hover:text-primary">Terms of Service</a>
          <a href="#" className="text-xs font-bold text-on-surface-variant hover:text-primary">Contact Us</a>
        </div>
      </footer>
    </div>
  );
}
