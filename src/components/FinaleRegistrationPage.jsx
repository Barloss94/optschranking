import {
  useMemo,
  useState
} from 'react';

import { supabase } from '../lib/supabaseClient';

const normalizeCode = (value) =>
  String(value || '')
    .toUpperCase()
    .replace(/[^A-F0-9]/g, '')
    .slice(0, 10);

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

  const displayedCode =
    useMemo(
      () => formatCode(code),
      [code]
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
  };

  const updateStatus = async (
    status
  ) => {
    if (!profile) {
      return;
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

    const { data, error: rpcError } =
      await supabase.rpc(
        'set_finale_response_by_code',
        {
          p_code:
            normalizeCode(code),
          p_status: status
        }
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

    setNotice(
      result?.status_message ||
      (
        status === 'confirmed'
          ? 'Je deelname is bevestigd.'
          : 'Je bent afgemeld.'
      )
    );

    await loadStatus(code);
    setSaving(false);
  };

  const reset = () => {
    setProfile(null);
    setCode('');
    setError('');
    setNotice('');
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
              marginBottom: 22
            }}
          >
            Bevestig hier met je
            persoonlijke code of je
            deelneemt aan de Ranking
            Finale.
          </div>

          {!profile ? (
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
                    saving ||
                    !profile.can_confirm
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
                      profile.can_confirm
                        ? 'rgba(76,175,80,0.18)'
                        : 'rgba(255,255,255,0.04)',
                    color:
                      profile.can_confirm
                        ? '#9be7a0'
                        : '#666',
                    fontWeight: 900,
                    cursor:
                      saving ||
                      !profile.can_confirm
                        ? 'default'
                        : 'pointer'
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
