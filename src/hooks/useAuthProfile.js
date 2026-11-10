import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

const PROFILE_RETRY_DELAYS = [2000, 8000];

export function useAuthProfile() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState(null);
  const [profileReloadKey, setProfileReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    let eventCount = 0;

    // Houd de callback synchroon: databaseverzoeken hierin kunnen de
    // Supabase-auth-lock blokkeren terwijl een token ververst wordt.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, nextSession) => {
        if (!active) return;
        eventCount += 1;

        setSession(nextSession ?? null);
        if (event === 'SIGNED_OUT') {
          setProfile(null);
          setProfileError(null);
          setProfileLoading(false);
        }
        setLoadingAuth(false);
      }
    );

    const initAuth = async () => {
      const eventsBeforeRequest = eventCount;

      try {
        const { data, error } = await supabase.auth.getSession();
        if (!active) return;

        if (error) {
          console.error('Inlogsessie herstellen mislukt:', error);
          setProfileError('Inlogsessie kon niet worden hersteld. Log opnieuw in.');
          return;
        }

        // Een nieuwer auth-event mag niet door een ouder verzoek
        // overschreven worden (bijvoorbeeld na uitloggen).
        if (eventsBeforeRequest === eventCount) {
          setSession(data.session ?? null);
        }
      } catch (error) {
        if (active) {
          console.error('Inlogsessie ophalen mislukt:', error);
          setProfileError('Inlogsessie kon niet worden hersteld. Log opnieuw in.');
        }
      } finally {
        if (active) setLoadingAuth(false);
      }
    };

    void initAuth();

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const userId = session?.user?.id ?? null;
  const accessToken = session?.access_token ?? null;

  useEffect(() => {
    if (!userId) {
      setProfile(null);
      setProfileLoading(false);
      return undefined;
    }

    let active = true;
    let retryTimer;

    setProfileLoading(true);
    setProfileError(null);

    const loadProfile = async (attempt = 0) => {
      let data = null;
      let error = null;

      try {
        const response = await supabase
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
          .maybeSingle();

        data = response.data;
        error = response.error;
      } catch (requestError) {
        error = requestError;
      }

      if (!active) return;

      if (error || !data) {
        console.error('Profiel laden mislukt:', error || 'Geen profiel gevonden');

        // Korte tijdelijke storingen zijn geen reden om een host of admin
        // als viewer weer te geven. Vernieuw het profiel beperkt.
        if (error && attempt < PROFILE_RETRY_DELAYS.length) {
          retryTimer = window.setTimeout(
            () => { void loadProfile(attempt + 1); },
            PROFILE_RETRY_DELAYS[attempt]
          );
          return;
        }

        setProfile((previous) => previous?.id === userId ? previous : null);
        setProfileError(
          error
            ? 'Profiel tijdelijk niet bereikbaar. Probeer opnieuw.'
            : 'Er is geen profiel gekoppeld aan dit account.'
        );
        setProfileLoading(false);
        return;
      }

      setProfile(data);
      setProfileError(null);
      setProfileLoading(false);
    };

    void loadProfile();

    return () => {
      active = false;
      window.clearTimeout(retryTimer);
    };
  }, [userId, accessToken, profileReloadKey]);

  const currentProfile = profile?.id === userId ? profile : null;

  return {
    session,
    user: session?.user ?? null,
    profile: currentProfile,
    loadingAuth,
    profileLoading,
    profileError,
    reloadProfile: () => setProfileReloadKey((value) => value + 1),
    isLoggedIn: Boolean(session?.user),
    role: currentProfile?.role ?? (userId ? null : 'viewer'),
    isAdmin: currentProfile?.role === 'admin',
    isHost: currentProfile?.role === 'host',
    isHostOrAdmin:
      currentProfile?.role === 'host' ||
      currentProfile?.role === 'admin',
    financialStatsEnabled:
      currentProfile?.financial_stats_enabled === true
  };
}
