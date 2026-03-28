import { useState, useEffect, useCallback } from 'react';
import * as api from '@/src/lib/api';
import type { Appliance, NewAppliance } from '@/src/lib/types';

export function useAppliances(userId: string | undefined) {
  const [appliances, setAppliances] = useState<Appliance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAppliances = useCallback(async () => {
    if (!userId) return;
    try {
      setLoading(true);
      const data = await api.getUserAppliances(userId);
      setAppliances(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchAppliances();
  }, [fetchAppliances]);

  const add = useCallback(async (appliance: NewAppliance) => {
    if (!userId) throw new Error('Not authenticated');
    const newApp = await api.addAppliance(userId, appliance);
    setAppliances(prev => [...prev, newApp]);
    return newApp;
  }, [userId]);

  const update = useCallback(async (id: string, updates: Partial<Appliance>) => {
    const updated = await api.updateAppliance(id, updates);
    setAppliances(prev => prev.map(a => a.id === id ? updated : a));
    return updated;
  }, []);

  const remove = useCallback(async (id: string) => {
    await api.deleteAppliance(id);
    setAppliances(prev => prev.filter(a => a.id !== id));
  }, []);

  return {
    appliances,
    loading,
    error,
    addAppliance: add,
    updateAppliance: update,
    deleteAppliance: remove,
    refresh: fetchAppliances,
  };
}
