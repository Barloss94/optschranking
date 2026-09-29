import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function ChangePasswordPanel({
  user
}) {
  const [currentPassword, setCurrentPassword] =
    useState('');

  const [newPassword, setNewPassword] =
    useState('');

  const [
    confirmNewPassword,
    setConfirmNewPassword
  ] = useState('');

  const [saving, setSaving] =
    useState(false);

  const changePassword = async () => {
    if (saving) {
      return;
    }

    if (!user?.email) {
      alert(
        'Je accountgegevens konden niet worden gevonden.'
      );
      return;
    }

    if (!currentPassword) {
      alert(
        'Vul je huidige wachtwoord in.'
      );
      return;
    }

    if (!newPassword) {
      alert(
        'Vul een nieuw wachtwoord in.'
      );
      return;
    }

    if (!confirmNewPassword) {
      alert(
        'Herhaal je nieuwe wachtwoord.'
      );
      return;
    }

    if (
      newPassword !==
      confirmNewPassword
    ) {
      alert(
        'De nieuwe wachtwoorden komen niet overeen.'
      );
      return;
    }

    if (
      currentPassword === newPassword
    ) {
      alert(
        'Je nieuwe wachtwoord moet verschillen van je huidige wachtwoord.'
      );
      return;
    }

    setSaving(true);

    try {
      const {
        error: verifyError
      } =
        await supabase.auth.signInWithPassword({
          email: user.email,
          password: currentPassword
        });

      if (verifyError) {
        alert(
          'Het huidige wachtwoord is niet correct.'
        );
        return;
      }

      const {
        error: updateError
      } =
        await supabase.auth.updateUser({
          password: newPassword
        });

      if (updateError) {
        alert(updateError.message);
        return;
      }

      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');

      alert(
        'Je wachtwoord is gewijzigd.'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      style={{
        background: '#181818',
        border: '1px solid #333',
        borderRadius: 12,
        padding: 16
      }}
    >
      <div
        style={{
          fontWeight: 900,
          fontSize: 18,
          marginBottom: 6
        }}
      >
        Wachtwoord wijzigen
      </div>

      <div
        style={{
          color: '#aaa',
          fontSize: 13,
          marginBottom: 16
        }}
      >
        Vul eerst je huidige wachtwoord in
        om de wijziging te bevestigen.
      </div>

      <div
        style={{
          display: 'grid',
          gap: 10,
          maxWidth: 420
        }}
      >
        <input
          type="password"
          value={currentPassword}
          onChange={(event) =>
            setCurrentPassword(
              event.target.value
            )
          }
          placeholder="Huidig wachtwoord"
          autoComplete="current-password"
          disabled={saving}
        />

        <input
          type="password"
          value={newPassword}
          onChange={(event) =>
            setNewPassword(
              event.target.value
            )
          }
          placeholder="Nieuw wachtwoord"
          autoComplete="new-password"
          disabled={saving}
        />

        <input
          type="password"
          value={confirmNewPassword}
          onChange={(event) =>
            setConfirmNewPassword(
              event.target.value
            )
          }
          placeholder="Herhaal nieuw wachtwoord"
          autoComplete="new-password"
          disabled={saving}
        />

        <button
          type="button"
          onClick={changePassword}
          disabled={saving}
        >
          {saving
            ? 'Wachtwoord wijzigen...'
            : 'Wachtwoord wijzigen'}
        </button>
      </div>
    </div>
  );
}