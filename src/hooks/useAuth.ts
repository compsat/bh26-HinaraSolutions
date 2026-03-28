import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/src/lib/supabase';
import * as api from '@/src/lib/api';
import type { Profile } from '@/src/lib/types';
import type { Session, User } from '@supabase/supabase-js';

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch profile when user changes
  useEffect(() => {
    if (user?.id) {
      api.getProfile(user.id).then(p => setProfile(p));
    } else {
      setProfile(null);
    }
  }, [user?.id]);

  const updateProfile = useCallback(async (updates: Partial<Profile>) => {
    if (!user?.id) return;
    const updated = await api.updateProfile(user.id, updates);
    if (updated) setProfile(updated);
    return updated;
  }, [user?.id]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  return { session, user, profile, loading, updateProfile, signOut };
}
