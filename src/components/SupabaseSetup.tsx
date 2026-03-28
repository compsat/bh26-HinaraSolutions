import React, { useState } from 'react';
import { Database, Key, Save, AlertCircle } from 'lucide-react';
import { updateSupabaseConfig, supabaseUrl, supabaseAnonKey } from '../lib/supabase';

export function SupabaseSetup() {
  const [url, setUrl] = useState(supabaseUrl || '');
  const [key, setKey] = useState(supabaseAnonKey || '');
  const [error, setError] = useState<string | null>(null);

  const handleSave = () => {
    if (!url || !key) {
      setError('Both URL and Anon Key are required.');
      return;
    }
    try {
      // Basic URL validation
      new URL(url);
      updateSupabaseConfig(url, key);
    } catch (e) {
      setError('Invalid Supabase URL format.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-6">
      <div className="bg-surface-container-lowest rounded-[2rem] p-8 max-w-md w-full shadow-2xl border border-outline-variant/10">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-primary-container/20 rounded-2xl flex items-center justify-center">
            <Database className="text-primary w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold font-headline">Supabase Setup</h2>
            <p className="text-sm text-on-surface-variant">Configure your database connection</p>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2 ml-1">
              Supabase URL
            </label>
            <div className="relative">
              <Database className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant/50" />
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://your-project.supabase.co"
                className="w-full bg-surface-container-low border border-outline-variant/20 rounded-2xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2 ml-1">
              Anon Public Key
            </label>
            <div className="relative">
              <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant/50" />
              <input
                type="password"
                value={key}
                onChange={(e) => setKey(e.target.value)}
                placeholder="your-anon-key"
                className="w-full bg-surface-container-low border border-outline-variant/20 rounded-2xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-500 bg-red-500/10 p-4 rounded-2xl border border-red-500/20">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <p className="text-xs font-medium">{error}</p>
            </div>
          )}

          <div className="pt-4">
            <button
              onClick={handleSave}
              className="w-full bg-primary text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity shadow-lg shadow-primary/20"
            >
              <Save className="w-5 h-5" />
              Save Configuration
            </button>
            <p className="text-[10px] text-center text-on-surface-variant mt-4 leading-relaxed">
              This will be stored in your browser's local storage. For production, use environment variables.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
