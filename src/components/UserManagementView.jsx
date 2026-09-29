import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { thStyle, tdStyle } from '../styles/tableStyles';
import { normalizeName } from '../utils/formatters';

export default function UserManagementView({ players }) {
  const [profiles, setProfiles] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);

    const [profilesResponse, notificationsResponse] = await Promise.all([
      supabase
        .from('profiles')
        .select('*')
        .order('email', { ascending: true }),

      supabase
        .from('registration_notifications')
        .select('*')
        .eq('processed', false)
        .order('created_at', { ascending: false })
    ]);

    if (profilesResponse.error) {
      alert(profilesResponse.error.message);
      setLoading(false);
      return;
    }

    if (notificationsResponse.error) {
      alert(notificationsResponse.error.message);
      setLoading(false);
      return;
    }

    setProfiles(profilesResponse.data || []);
    setNotifications(notificationsResponse.data || []);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const updateProfile = async (profileId, updates) => {
    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', profileId);

    if (error) {
      alert(error.message);
      await loadData();
      return;
    }

    await loadData();
  };

  const updateProfileFieldLocally = (
    profileId,
    field,
    value
  ) => {
    setProfiles((currentProfiles) =>
      currentProfiles.map((profile) =>
        profile.id === profileId
          ? {
              ...profile,
              [field]: value
            }
          : profile
      )
    );
  };

  const saveProfileField = async (
    profileId,
    field,
    value
  ) => {
    const cleanValue = String(value || '').trim();

    const { error } = await supabase
      .from('profiles')
      .update({
        [field]: cleanValue || null
      })
      .eq('id', profileId);

    if (error) {
      alert(error.message);
      await loadData();
      return;
    }

    setProfiles((currentProfiles) =>
      currentProfiles.map((profile) =>
        profile.id === profileId
          ? {
              ...profile,
              [field]: cleanValue || null
            }
          : profile
      )
    );
  };

  const markNotificationProcessed = async (notificationId) => {
    const { error } = await supabase
      .from('registration_notifications')
      .update({
        processed: true,
        processed_at: new Date().toISOString()
      })
      .eq('id', notificationId);

    if (error) {
      alert(error.message);
      return;
    }

    await loadData();
  };

  const getSuggestedPlayer = (profile) => {
    const emailName = String(profile.email || '').split('@')[0];
    const displayName = profile.display_name || '';

    const candidates = [displayName, emailName]
      .map((value) =>
        normalizeName(
          value.replace(/[._-]/g, ' ')
        )
      )
      .filter(Boolean);

    return players.find((player) => {
      const playerNames = [
        player.name,
        player.preferred_name
      ].map((value) => normalizeName(value));

      return candidates.some((candidate) =>
        playerNames.some(
          (playerName) =>
            playerName === candidate ||
            playerName.includes(candidate) ||
            candidate.includes(playerName)
        )
      );
    });
  };

  const profilesWithSuggestions = useMemo(() => {
    return profiles.map((profile) => ({
      ...profile,
      suggestedPlayer: getSuggestedPlayer(profile)
    }));
  }, [profiles, players]);

  if (loading) {
    return <div>Gebruikers laden...</div>;
  }

  return (
    <>
      <h2>Gebruikersbeheer</h2>

      <div
        style={{
          color: '#aaa',
          marginBottom: 16
        }}
      >
        Hier kun je accounts koppelen aan bestaande spelers en rollen instellen.
      </div>

      <div
        style={{
          background: '#181818',
          borderRadius: 10,
          padding: 14,
          marginBottom: 24,
          border:
            notifications.length > 0
              ? '1px solid #ffd740'
              : '1px solid #333'
        }}
      >
        <h3 style={{ marginTop: 0 }}>
          🔔 Nieuwe registraties ({notifications.length})
        </h3>

        {notifications.length === 0 ? (
          <div style={{ color: '#888' }}>
            Geen openstaande registraties.
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gap: 10
            }}
          >
            {notifications.map((notification) => (
              <div
                key={notification.id}
                style={{
                  background: '#111',
                  borderRadius: 8,
                  padding: 10,
                  display: 'grid',
                  gridTemplateColumns: '1fr auto',
                  gap: 10,
                  alignItems: 'center'
                }}
              >
                <div>
                  <div style={{ fontWeight: 800 }}>
                    {notification.email}
                  </div>

                  <div
                    style={{
                      color: '#aaa',
                      fontSize: 13
                    }}
                  >
                    {notification.display_name ||
                      notification.email}{' '}
                    ·{' '}
                    {new Date(
                      notification.created_at
                    ).toLocaleString('nl-NL')}
                  </div>
                </div>

                <button
                  onClick={() =>
                    markNotificationProcessed(
                      notification.id
                    )
                  }
                >
                  Afgehandeld
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div
        style={{
          overflowX: 'auto'
        }}
      >
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse'
          }}
        >
          <thead>
            <tr>
              <th style={thStyle}>
                Voornaam
              </th>

              <th style={thStyle}>
                Achternaam
              </th>

              <th style={thStyle}>
                E-mail
              </th>

              <th style={thStyle}>
                Weergavenaam
              </th>

              <th style={thStyle}>
                Rol
              </th>

              <th style={thStyle}>
                Gekoppelde speler
              </th>

              <th style={thStyle}>
                Suggestie
              </th>

              <th style={thStyle}>
                Financiële statistieken
              </th>
            </tr>
          </thead>

          <tbody>
            {profilesWithSuggestions.length === 0 ? (
              <tr>
                <td
                  style={tdStyle}
                  colSpan={8}
                >
                  Nog geen gebruikers gevonden.
                </td>
              </tr>
            ) : (
              profilesWithSuggestions.map((profile) => (
                <tr key={profile.id}>
                  <td style={tdStyle}>
                    <input
                      value={profile.first_name || ''}
                      onChange={(e) =>
                        updateProfileFieldLocally(
                          profile.id,
                          'first_name',
                          e.target.value
                        )
                      }
                      onBlur={(e) =>
                        saveProfileField(
                          profile.id,
                          'first_name',
                          e.target.value
                        )
                      }
                      placeholder="Voornaam"
                      style={{
                        width: '100%'
                      }}
                    />
                  </td>

                  <td style={tdStyle}>
                    <input
                      value={profile.last_name || ''}
                      onChange={(e) =>
                        updateProfileFieldLocally(
                          profile.id,
                          'last_name',
                          e.target.value
                        )
                      }
                      onBlur={(e) =>
                        saveProfileField(
                          profile.id,
                          'last_name',
                          e.target.value
                        )
                      }
                      placeholder="Achternaam"
                      style={{
                        width: '100%'
                      }}
                    />
                  </td>

                  <td style={tdStyle}>
                    {profile.email}
                  </td>

                  <td style={tdStyle}>
                    <input
                      value={
                        profile.display_name || ''
                      }
                      onChange={(e) =>
                        updateProfileFieldLocally(
                          profile.id,
                          'display_name',
                          e.target.value
                        )
                      }
                      onBlur={(e) =>
                        saveProfileField(
                          profile.id,
                          'display_name',
                          e.target.value
                        )
                      }
                      style={{
                        width: '100%'
                      }}
                    />
                  </td>

                  <td style={tdStyle}>
                    <select
                      value={
                        profile.role || 'viewer'
                      }
                      onChange={(e) =>
                        updateProfile(
                          profile.id,
                          {
                            role:
                              e.target.value
                          }
                        )
                      }
                      style={{
                        width: '100%'
                      }}
                    >
                      <option value="viewer">
                        viewer
                      </option>

                      <option value="player">
                        player
                      </option>

                      <option value="host">
                        host
                      </option>

                      <option value="admin">
                        admin
                      </option>
                    </select>
                  </td>

                  <td style={tdStyle}>
                    <select
                      value={
                        profile.player_id || ''
                      }
                      onChange={(e) =>
                        updateProfile(
                          profile.id,
                          {
                            player_id:
                              e.target.value ||
                              null
                          }
                        )
                      }
                      style={{
                        width: '100%'
                      }}
                    >
                      <option value="">
                        Niet gekoppeld
                      </option>

                      {players.map((player) => (
                        <option
                          key={player.id}
                          value={player.id}
                        >
                          {player.preferred_name ||
                            player.name}
                        </option>
                      ))}
                    </select>
                  </td>

                  <td style={tdStyle}>
                    {profile.suggestedPlayer &&
                    !profile.player_id ? (
                      <button
                        onClick={() =>
                          updateProfile(
                            profile.id,
                            {
                              player_id:
                                profile
                                  .suggestedPlayer
                                  .id,
                              role: 'player'
                            }
                          )
                        }
                      >
                        Koppel aan{' '}
                        {profile
                          .suggestedPlayer
                          .preferred_name ||
                          profile
                            .suggestedPlayer
                            .name}
                      </button>
                    ) : profile.player_id ? (
                      <span
                        style={{
                          color: '#4caf50'
                        }}
                      >
                        Gekoppeld
                      </span>
                    ) : (
                      <span
                        style={{
                          color: '#888'
                        }}
                      >
                        Geen match
                      </span>
                    )}
                  </td>

                  <td style={tdStyle}>
                    <label
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        cursor: profile.player_id
                          ? 'pointer'
                          : 'not-allowed',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={Boolean(
                          profile.financial_stats_enabled
                        )}
                        disabled={
                          !profile.player_id
                        }
                        onChange={(e) =>
                          updateProfile(
                            profile.id,
                            {
                              financial_stats_enabled:
                                e.target.checked
                            }
                          )
                        }
                      />

                      <span>
                        {profile.financial_stats_enabled
                          ? 'Ingeschakeld'
                          : 'Uitgeschakeld'}
                      </span>
                    </label>

                    {!profile.player_id && (
                      <div
                        style={{
                          color: '#888',
                          fontSize: 12,
                          marginTop: 4
                        }}
                      >
                        Koppel eerst een speler
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}