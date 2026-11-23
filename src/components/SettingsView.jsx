import {
  useEffect,
  useState
} from 'react';

import { supabase } from '../lib/supabaseClient';

const toLocalInputValue = (
  isoValue
) => {
  if (!isoValue) {
    return '';
  }

  const date =
    new Date(isoValue);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return '';
  }

  const pad = (value) =>
    String(value).padStart(
      2,
      '0'
    );

  return [
    date.getFullYear(),
    '-',
    pad(
      date.getMonth() + 1
    ),
    '-',
    pad(date.getDate()),
    'T',
    pad(date.getHours()),
    ':',
    pad(date.getMinutes())
  ].join('');
};

const formatDeadline = (
  isoValue
) => {
  if (!isoValue) {
    return 'Niet ingesteld';
  }

  const date =
    new Date(isoValue);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return 'Ongeldige datum';
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

export default function SettingsView({
  season,
  finaleSettings,
  onSettingsChanged
}) {
  const [
    deadlineValue,
    setDeadlineValue
  ] = useState('');
  const [saving, setSaving] =
    useState(false);
  const [message, setMessage] =
    useState('');

  useEffect(() => {
    setDeadlineValue(
      toLocalInputValue(
        finaleSettings
          ?.response_deadline_at
      )
    );
  }, [
    finaleSettings
      ?.response_deadline_at
  ]);

  const saveDeadline =
    async () => {
      if (!season?.id) {
        return;
      }

      if (!deadlineValue) {
        alert(
          'Kies een datum en tijd voor de reactiedeadline.'
        );
        return;
      }

      const localDate =
        new Date(
          deadlineValue
        );

      if (
        Number.isNaN(
          localDate.getTime()
        )
      ) {
        alert(
          'De gekozen datum of tijd is ongeldig.'
        );
        return;
      }

      setSaving(true);
      setMessage('');

      const { error } =
        await supabase.rpc(
          'set_finale_response_deadline',
          {
            p_season_id:
              season.id,
            p_deadline_at:
              localDate.toISOString()
          }
        );

      setSaving(false);

      if (error) {
        alert(error.message);
        return;
      }

      setMessage(
        'De finale-reactiedeadline is opgeslagen.'
      );

      await onSettingsChanged?.();
    };

  return (
    <div>
      <h2
        style={{
          marginTop: 0
        }}
      >
        ⚙️ Instellingen
      </h2>

      <div
        style={{
          maxWidth: 680,
          padding: 18,
          borderRadius: 12,
          background: '#181818',
          border:
            '1px solid #2f2f2f'
        }}
      >
        <h3
          style={{
            marginTop: 0,
            marginBottom: 8
          }}
        >
          Finale-inschrijving
        </h3>

        <div
          style={{
            color: '#aaa',
            lineHeight: 1.5,
            marginBottom: 16
          }}
        >
          Stel hier per seizoen in tot
          wanneer finalisten zichzelf
          kunnen aanmelden of afmelden.
          Na deze deadline wordt de
          persoonlijke codepagina
          automatisch gesloten.
        </div>

        <label
          htmlFor="finale-response-deadline"
          style={{
            display: 'block',
            fontWeight: 800,
            marginBottom: 7
          }}
        >
          Reactiedeadline
        </label>

        <input
          id="finale-response-deadline"
          type="datetime-local"
          value={deadlineValue}
          onChange={(event) =>
            setDeadlineValue(
              event.target.value
            )
          }
          style={{
            width: '100%',
            maxWidth: 340,
            boxSizing:
              'border-box',
            padding: '11px 12px',
            borderRadius: 8,
            border:
              '1px solid #444',
            background: '#101010',
            color: '#fff'
          }}
        />

        <div
          style={{
            marginTop: 8,
            color: '#999',
            fontSize: 13
          }}
        >
          Huidig:{' '}
          <strong
            style={{
              color: '#ddd'
            }}
          >
            {formatDeadline(
              finaleSettings
                ?.response_deadline_at
            )}
          </strong>
        </div>

        <button
          type="button"
          disabled={saving}
          onClick={() =>
            void saveDeadline()
          }
          style={{
            marginTop: 16
          }}
        >
          {saving
            ? 'Opslaan...'
            : 'Deadline opslaan'}
        </button>

        {message && (
          <div
            style={{
              marginTop: 12,
              color: '#81c784',
              fontWeight: 700
            }}
          >
            {message}
          </div>
        )}
      </div>
    </div>
  );
}
