import {
  useEffect,
  useMemo,
  useState
} from 'react';

import { supabase } from '../lib/supabaseClient';

const normalizeCode = (value) =>
  String(value || '')
    .toUpperCase()
    .replace(/[^A-F0-9]/g, '')
    .slice(0, 10);


const formatDeadline = (
  isoValue
) => {
  if (!isoValue) {
    return null;
  }

  const date =
    new Date(isoValue);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return null;
  }

  return new Intl.DateTimeFormat(
    'nl-NL',
    {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }
  ).format(date);
};

const formatCode = (value) => {
  const clean = normalizeCode(value);

  if (clean.length <= 4) {
    return clean;
  }

  if (clean.length <= 7) {
    return `${clean.slice(0, 4)}-${clean.slice(4)}`;
  }

  return `${clean.slice(0, 4)}-${clean.slice(4, 7)}-${clean.slice(7)}`;
};

export default function FinaleRegistrationPage() {
  const [code, setCode] = useState('');
  const [profile, setProfile] =
    useState(null);
  const [loading, setLoading] =
    useState(false);
  const [saving, setSaving] =
    useState(false);
  const [error, setError] =
    useState('');
  const [notice, setNotice] =
    useState('');
  const [
    registrationWindow,
    setRegistrationWindow
  ] = useState(null);
  const [
    windowLoading,
    setWindowLoading
  ] = useState(true);
  const [guestCount, setGuestCount] =
    useState('');
  const [
    volunteerDealer,
    setVolunteerDealer
  ] = useState('');

  const displayedCode =
    useMemo(
      () => formatCode(code),
      [code]
    );


  useEffect(() => {
    let cancelled = false;

    const loadRegistrationWindow =
      async () => {
        setWindowLoading(true);

        const {
          data,
          error: rpcError
        } = await supabase.rpc(
          'get_finale_registration_window'
        );

        if (cancelled) {
          return;
        }

        if (rpcError) {
          console.error(
            'Finale-inschrijfperiode laden mislukt:',
            rpcError
          );
          setRegistrationWindow(
            null
          );
          setWindowLoading(false);
          return;
        }

        const result =
          Array.isArray(data)
            ? data[0]
            : data;

        setRegistrationWindow(
          result || null
        );
        setWindowLoading(false);
      };

    void loadRegistrationWindow();

    return () => {
      cancelled = true;
    };
  }, []);

  const deadlineText =
    formatDeadline(
      registrationWindow
        ?.response_deadline_at
    );

  const loadStatus = async (
    rawCode = code
  ) => {
    const normalized =
      normalizeCode(rawCode);

    if (normalized.length !== 10) {
      setError(
        'Vul je volledige persoonlijke code in.'
      );
      return;
    }

    setLoading(true);
    setError('');
    setNotice('');

    const { data, error: rpcError } =
      await supabase.rpc(
        'get_finale_access_status',
        {
          p_code: normalized
        }
      );

    setLoading(false);

    if (rpcError) {
      setError(
        rpcError.message ||
        'De code kon niet worden gecontroleerd.'
      );
      return;
    }

    const result =
      Array.isArray(data)
        ? data[0]
        : data;

    if (!result) {
      setProfile(null);
      setError(
        'Deze persoonlijke code is niet geldig.'
      );
      return;
    }

    setCode(normalized);
    setProfile(result);

    setGuestCount(
      result.guest_count ===
        null ||
      result.guest_count ===
        undefined
        ? ''
        : String(
            result.guest_count
          )
    );

    setVolunteerDealer(
      result.volunteer_dealer ===
        true
        ? 'yes'
        : result.volunteer_dealer ===
            false
          ? 'no'
          : ''
    );
  };

  const updateStatus = async (
    status
  ) => {
    if (!profile) {
      return;
    }

    if (
      status === 'confirmed'
    ) {
      if (
        !['0', '1', '2'].includes(
          guestCount
        )
      ) {
        setError(
          'Geef aan met hoeveel extra personen je komt.'
        );
        return;
      }

      if (
        !['yes', 'no'].includes(
          volunteerDealer
        )
      ) {
        setError(
          'Geef aan of je vrijwillig als vaste deler wilt optreden.'
        );
        return;
      }
    }

    const question =
      status === 'confirmed'
        ? 'Weet je zeker dat je je wilt aanmelden voor de finale?'
        : 'Weet je zeker dat je je wilt afmelden voor de finale?';

    if (!window.confirm(question)) {
      return;
    }

    setSaving(true);
    setError('');
    setNotice('');

    const params = {
      p_code:
        normalizeCode(code),
      p_status: status,
      p_guest_count:
        status === 'confirmed'
          ? Number(
              guestCount
            )
          : null,
      p_volunteer_dealer:
        status === 'confirmed'
          ? volunteerDealer ===
            'yes'
          : null
    };

    const { data, error: rpcError } =
      await supabase.rpc(
        'set_finale_response_by_code',
        params
      );

    if (rpcError) {
      setSaving(false);
      setError(
        rpcError.message ||
        'Je keuze kon niet worden opgeslagen.'
      );
      return;
    }

    const result =
      Array.isArray(data)
        ? data[0]
        : data;

    await loadStatus(code);

    setNotice(
      status === 'confirmed'
        ? `✅ Je antwoord is ontvangen. ${result?.status_message || 'Je deelname aan de finale is bevestigd.'}`
        : `✅ Je antwoord is ontvangen. ${result?.status_message || 'Je afmelding voor de finale is verwerkt.'}`
    );

    setSaving(false);
  };

  const reset = () => {
    setProfile(null);
    setCode('');
    setError('');
    setNotice('');
    setGuestCount('');
    setVolunteerDealer('');
  };

  const statusLabel =
    profile?.registration_status ===
      'confirmed'
      ? '✅ Aangemeld'
      : profile?.registration_status ===
          'declined'
        ? '❌ Afgemeld'
        : '⏳ Reactie nodig';

  const statusColor =
    profile?.registration_status ===
      'confirmed'
      ? '#81c784'
      : profile?.registration_status ===
          'declined'
        ? '#ff8a80'
        : '#ffd740';

  const canSubmitConfirmation =
    profile?.can_confirm &&
    ['0', '1', '2'].includes(
      guestCount
    ) &&
    ['yes', 'no'].includes(
      volunteerDealer
    ) &&
    !saving;

  return (
    <div
      style={{
        minHeight: '100vh',
        padding: '28px 16px',
        boxSizing: 'border-box',
        color: '#fff',
        background:
          'radial-gradient(circle at top, #173326 0%, #09110d 48%, #050706 100%)'
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 620,
          margin: '0 auto'
        }}
      >
        <div
          style={{
            border:
              '1px solid rgba(212, 175, 87, 0.35)',
            borderRadius: 20,
            padding: 24,
            background:
              'rgba(9, 14, 11, 0.96)',
            boxShadow:
              '0 24px 60px rgba(0,0,0,0.42)'
          }}
        >
          <div
            style={{
              color: '#d4af57',
              fontSize: 13,
              fontWeight: 900,
              letterSpacing: 2,
              textTransform:
                'uppercase',
              marginBottom: 8
            }}
          >
            OPTSCH Ranking
          </div>

          <h1
            style={{
              margin:
                '0 0 8px',
              fontSize: 31
            }}
          >
            Finale aanmelden
          </h1>

          <div
            style={{
              color: '#bbb',
              lineHeight: 1.55,
              marginBottom: 12
            }}
          >
            Bevestig hier met je
            persoonlijke code of je
            deelneemt aan de Ranking
            Finale.
          </div>

          {!windowLoading &&
            registrationWindow
              ?.registration_open &&
            deadlineText && (
              <div
                style={{
                  marginBottom: 22,
                  padding: '10px 12px',
                  borderRadius: 10,
                  background:
                    'rgba(255, 193, 7, 0.10)',
                  border:
                    '1px solid rgba(255, 193, 7, 0.28)',
                  color: '#ffd740',
                  fontWeight: 800
                }}
              >
                ⏰ Reageer uiterlijk{' '}
                {deadlineText}.
              </div>
            )}

          {windowLoading ? (
            <div
              style={{
                padding: 18,
                borderRadius: 12,
                background:
                  'rgba(255,255,255,0.04)',
                border:
                  '1px solid rgba(255,255,255,0.08)',
                color: '#bbb'
              }}
            >
              Inschrijfperiode controleren...
            </div>
          ) : registrationWindow &&
            !registrationWindow
              .registration_open ? (
            <div
              style={{
                padding: 20,
                borderRadius: 14,
                background:
                  'rgba(244,67,54,0.10)',
                border:
                  '1px solid rgba(244,67,54,0.34)'
              }}
            >
              <div
                style={{
                  fontSize: 22,
                  fontWeight: 900,
                  color: '#ff9b94',
                  marginBottom: 8
                }}
              >
                Inschrijfperiode gesloten
              </div>

              <div
                style={{
                  color: '#ddd',
                  lineHeight: 1.55
                }}
              >
                De reactiedeadline voor
                de Ranking Finale is
                verstreken. Aanmelden of
                afmelden via een
                persoonlijke code is niet
                meer mogelijk.
              </div>

              {deadlineText && (
                <div
                  style={{
                    marginTop: 10,
                    color: '#aaa',
                    fontSize: 13
                  }}
                >
                  Deadline:{' '}
                  {deadlineText}
                </div>
              )}
            </div>
          ) : !profile ? (
            <>
              <label
                htmlFor="finale-code"
                style={{
                  display: 'block',
                  fontWeight: 800,
                  marginBottom: 8
                }}
              >
                Persoonlijke code
              </label>

              <input
                id="finale-code"
                type="text"
                value={displayedCode}
                onChange={(event) =>
                  setCode(
                    normalizeCode(
                      event.target.value
                    )
                  )
                }
                onKeyDown={(event) => {
                  if (
                    event.key ===
                    'Enter'
                  ) {
                    void loadStatus();
                  }
                }}
                autoComplete="one-time-code"
                inputMode="text"
                placeholder="XXXX-XXX-XXX"
                style={{
                  width: '100%',
                  boxSizing:
                    'border-box',
                  padding:
                    '14px 16px',
                  borderRadius: 10,
                  border:
                    '1px solid rgba(212,175,87,0.4)',
                  background:
                    '#101713',
                  color: '#fff',
                  fontSize: 22,
                  letterSpacing: 2,
                  textTransform:
                    'uppercase',
                  outline: 'none'
                }}
              />

              <button
                type="button"
                disabled={loading}
                onClick={() =>
                  void loadStatus()
                }
                style={{
                  width: '100%',
                  marginTop: 14,
                  padding:
                    '13px 16px',
                  borderRadius: 10,
                  border:
                    '1px solid #d4af57',
                  background:
                    '#d4af57',
                  color: '#111',
                  fontWeight: 900,
                  cursor: loading
                    ? 'default'
                    : 'pointer'
                }}
              >
                {loading
                  ? 'Controleren...'
                  : 'Doorgaan'}
              </button>
            </>
          ) : (
            <>
              <div
                style={{
                  borderRadius: 14,
                  padding: 18,
                  background:
                    'rgba(255,255,255,0.04)',
                  border:
                    '1px solid rgba(255,255,255,0.1)',
                  marginBottom: 16
                }}
              >
                <div
                  style={{
                    color: '#999',
                    fontSize: 12,
                    marginBottom: 4
                  }}
                >
                  Speler
                </div>

                <div
                  style={{
                    fontSize: 24,
                    fontWeight: 900
                  }}
                >
                  {profile.player_name}
                </div>

                <div
                  style={{
                    marginTop: 7,
                    color: '#bbb'
                  }}
                >
                  Rankingpositie #
                  {profile.rank_position}
                  {' · '}
                  {profile.qualification_type ===
                  'finalist'
                    ? 'Finalist'
                    : 'Waitlist'}
                </div>

                <div
                  style={{
                    marginTop: 14,
                    fontWeight: 900,
                    color:
                      statusColor
                  }}
                >
                  {statusLabel}
                </div>

                <div
                  style={{
                    marginTop: 7,
                    color: '#ccc',
                    lineHeight: 1.5
                  }}
                >
                  {
                    profile.status_message
                  }
                </div>
              </div>

              {profile.can_confirm && (
                <div
                  style={{
                    display: 'grid',
                    gap: 16,
                    marginBottom: 16,
                    padding: 16,
                    borderRadius: 14,
                    border:
                      '1px solid rgba(212,175,87,0.24)',
                    background:
                      'rgba(212,175,87,0.05)'
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontWeight: 900,
                        marginBottom: 5
                      }}
                    >
                      Met hoeveel extra personen kom je?
                    </div>

                    <div
                      style={{
                        color: '#aaa',
                        fontSize: 13,
                        lineHeight: 1.45,
                        marginBottom: 10
                      }}
                    >
                      Kies 0, 1 of 2.
                      Personen die zelf
                      finalist zijn tel je
                      hierin niet mee.
                    </div>

                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns:
                          'repeat(3, 1fr)',
                        gap: 8
                      }}
                    >
                      {['0', '1', '2'].map(
                        (value) => (
                          <button
                            key={value}
                            type="button"
                            onClick={() =>
                              setGuestCount(
                                value
                              )
                            }
                            style={{
                              padding:
                                '12px 10px',
                              borderRadius: 10,
                              border:
                                guestCount ===
                                value
                                  ? '1px solid #d4af57'
                                  : '1px solid #333',
                              background:
                                guestCount ===
                                value
                                  ? 'rgba(212,175,87,0.18)'
                                  : '#111713',
                              color:
                                guestCount ===
                                value
                                  ? '#f4d77b'
                                  : '#ddd',
                              fontWeight: 900,
                              cursor:
                                'pointer'
                            }}
                          >
                            {value}
                          </button>
                        )
                      )}
                    </div>
                  </div>

                  <div>
                    <div
                      style={{
                        fontWeight: 900,
                        marginBottom: 5
                      }}
                    >
                      Wil je vrijwillig als vaste deler optreden?
                    </div>

                    <div
                      style={{
                        color: '#aaa',
                        fontSize: 13,
                        lineHeight: 1.45,
                        marginBottom: 10
                      }}
                    >
                      Kies verplicht ja of
                      nee.
                    </div>

                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns:
                          '1fr 1fr',
                        gap: 8
                      }}
                    >
                      {[
                        {
                          value:
                            'yes',
                          label:
                            'Ja'
                        },
                        {
                          value:
                            'no',
                          label:
                            'Nee'
                        }
                      ].map(
                        (option) => (
                          <button
                            key={
                              option.value
                            }
                            type="button"
                            onClick={() =>
                              setVolunteerDealer(
                                option.value
                              )
                            }
                            style={{
                              padding:
                                '12px 10px',
                              borderRadius: 10,
                              border:
                                volunteerDealer ===
                                option.value
                                  ? '1px solid #d4af57'
                                  : '1px solid #333',
                              background:
                                volunteerDealer ===
                                option.value
                                  ? 'rgba(212,175,87,0.18)'
                                  : '#111713',
                              color:
                                volunteerDealer ===
                                option.value
                                  ? '#f4d77b'
                                  : '#ddd',
                              fontWeight: 900,
                              cursor:
                                'pointer'
                            }}
                          >
                            {
                              option.label
                            }
                          </button>
                        )
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns:
                    '1fr 1fr',
                  gap: 10
                }}
              >
                <button
                  type="button"
                  disabled={
                    !canSubmitConfirmation
                  }
                  onClick={() =>
                    void updateStatus(
                      'confirmed'
                    )
                  }
                  style={{
                    padding:
                      '13px 12px',
                    borderRadius: 10,
                    border:
                      '1px solid rgba(76,175,80,0.65)',
                    background:
                      canSubmitConfirmation
                        ? 'rgba(76,175,80,0.18)'
                        : 'rgba(255,255,255,0.04)',
                    color:
                      canSubmitConfirmation
                        ? '#9be7a0'
                        : '#666',
                    fontWeight: 900,
                    cursor:
                      canSubmitConfirmation
                        ? 'pointer'
                        : 'default'
                  }}
                >
                  ✅ Aanmelden
                </button>

                <button
                  type="button"
                  disabled={
                    saving ||
                    !profile.can_decline
                  }
                  onClick={() =>
                    void updateStatus(
                      'declined'
                    )
                  }
                  style={{
                    padding:
                      '13px 12px',
                    borderRadius: 10,
                    border:
                      '1px solid rgba(244,67,54,0.65)',
                    background:
                      profile.can_decline
                        ? 'rgba(244,67,54,0.16)'
                        : 'rgba(255,255,255,0.04)',
                    color:
                      profile.can_decline
                        ? '#ff9b94'
                        : '#666',
                    fontWeight: 900,
                    cursor:
                      saving ||
                      !profile.can_decline
                        ? 'default'
                        : 'pointer'
                  }}
                >
                  ❌ Afmelden
                </button>
              </div>

              <button
                type="button"
                onClick={reset}
                style={{
                  width: '100%',
                  marginTop: 12,
                  padding:
                    '10px 12px',
                  borderRadius: 10,
                  border:
                    '1px solid #333',
                  background:
                    'transparent',
                  color: '#aaa',
                  cursor: 'pointer'
                }}
              >
                Andere code gebruiken
              </button>
            </>
          )}

          {error && (
            <div
              style={{
                marginTop: 16,
                padding: 12,
                borderRadius: 10,
                background:
                  'rgba(244,67,54,0.13)',
                border:
                  '1px solid rgba(244,67,54,0.38)',
                color: '#ff9b94'
              }}
            >
              {error}
            </div>
          )}

          {notice && (
            <div
              style={{
                marginTop: 16,
                padding: 12,
                borderRadius: 10,
                background:
                  'rgba(76,175,80,0.13)',
                border:
                  '1px solid rgba(76,175,80,0.38)',
                color: '#9be7a0'
              }}
            >
              {notice}
            </div>
          )}

          <div
            style={{
              marginTop: 22,
              paddingTop: 16,
              borderTop:
                '1px solid #252a27',
              color: '#888',
              fontSize: 12,
              lineHeight: 1.5
            }}
          >
            Ranking Finale ·
            zaterdag 28 november 2026 ·
            Café de Proeverij,
            Amersfoort · start 13:00
          </div>
        </div>
      </div>
    </div>
  );
}
