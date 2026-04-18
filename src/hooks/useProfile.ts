import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export type Profile = {
  id: string;
  full_name: string;
  balance_usd: number;
  ai_mode_enabled: boolean;
  created_at: string;
};

export function useProfile(userId: string | undefined) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    if (!userId) { setLoading(false); return; }
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
    setProfile(data as Profile | null);
    setLoading(false);
  }, [userId]);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!userId) return;
    const { data } = await supabase.from('profiles').update(updates).eq('id', userId).select().maybeSingle();
    if (data) setProfile(data as Profile);
    return data as Profile | null;
  };

  return { profile, loading, refetch: fetchProfile, updateProfile };
}
