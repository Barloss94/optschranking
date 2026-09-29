import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export function useAuthProfile() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  const loadProfile = async (userId) => {
    if (!userId) {
      setProfile(null);
      return;
    }

    const { data, error } = await supabase
      .from('profiles')
      .select(`
        id,
        email,
        display_name,
        role,
        player_id,
        financial_stats_enabled
      `)
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Profiel laden mislukt:', error);
      setProfile(null);
      return;
    }

    setProfile(data);
  };

  useEffect(() => {
    const initAuth = async () => {
      const { data } = await supabase.auth.getSession();

      setSession(data.session ?? null);

      if (data.session?.user?.id) {
        await loadProfile(data.session.user.id);
      } else {
        setProfile(null);
      }

      setLoadingAuth(false);
    };

    initAuth();

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        setSession(newSession);

        if (newSession?.user?.id) {
          await loadProfile(newSession.user.id);
        } else {
          setProfile(null);
        }
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  return {
    session,
    user: session?.user ?? null,
    profile,
    loadingAuth,
    isLoggedIn: Boolean(session),
    role: profile?.role ?? 'viewer',
    isAdmin: profile?.role === 'admin',
    isHost: profile?.role === 'host',
    isHostOrAdmin:
      profile?.role === 'host' ||
      profile?.role === 'admin',
    financialStatsEnabled:
      profile?.financial_stats_enabled === true
  };
}