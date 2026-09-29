import { useRef, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function LoginBox({ user, profile }) {
  const [mode, setMode] = useState('login');

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const passwordRef = useRef(null);

  const login = async () => {
    const cleanEmail = email.trim();

    if (!cleanEmail) {
      alert('Vul je e-mailadres in.');
      return;
    }

    if (!password) {
      alert('Vul je wachtwoord in.');
      passwordRef.current?.focus();
      return;
    }

    const { error } =
      await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password
      });

    if (error) {
      alert(error.message);
    }
  };

  const register = async () => {
    const cleanFirstName = firstName.trim();
    const cleanLastName = lastName.trim();
    const cleanEmail = email.trim();

    if (!cleanFirstName) {
      alert('Vul je voornaam in.');
      return;
    }

    if (!cleanLastName) {
      alert('Vul je achternaam in.');
      return;
    }

    if (!cleanEmail) {
      alert('Vul je e-mailadres in.');
      return;
    }

    if (!password) {
      alert('Vul een wachtwoord in.');
      return;
    }

    const displayName =
      `${cleanFirstName} ${cleanLastName}`.trim();

    const { error } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: {
        data: {
          first_name: cleanFirstName,
          last_name: cleanLastName,
          display_name: displayName
        }
      }
    });

    if (error) {
      alert(error.message);
      return;
    }

    const {
      data: functionData,
      error: functionError
    } = await supabase.functions.invoke(
      'notify-admin-registration',
      {
        body: JSON.stringify({
          email: cleanEmail,
          first_name: cleanFirstName,
          last_name: cleanLastName,
          display_name: displayName
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    console.log(
      'FUNCTION DATA:',
      functionData
    );

    console.log(
      'FUNCTION ERROR:',
      functionError
    );

    if (functionError) {
      alert(
        `Account aangemaakt, maar e-mailmelding mislukt: ${functionError.message}`
      );
      return;
    }

    alert(
      'Account aangemaakt. De beheerder heeft een melding ontvangen.'
    );
  };

  const logout = async () => {
    await supabase.auth.signOut();
  };

  const handleEmailKeyDown = (event) => {
    if (
      mode === 'login' &&
      event.key === 'Enter'
    ) {
      event.preventDefault();
      passwordRef.current?.focus();
    }
  };

  const handlePasswordKeyDown = (event) => {
    if (
      mode === 'login' &&
      event.key === 'Enter'
    ) {
      event.preventDefault();
      login();
    }
  };

  const changeMode = () => {
    const nextMode =
      mode === 'login'
        ? 'register'
        : 'login';

    setMode(nextMode);

    setFirstName('');
    setLastName('');
    setPassword('');
  };

  if (user) {
    return (
      <div
        style={{
          display: 'flex',
          gap: 10,
          alignItems: 'center',
          flexWrap: 'wrap'
        }}
      >
        <span>
          👤{' '}
          {profile?.display_name ||
            user.email}{' '}
          · {profile?.role || 'viewer'}
        </span>

        <button onClick={logout}>
          Uitloggen
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'grid',
        gap: 8
      }}
    >
      <div
        style={{
          display: 'flex',
          gap: 8,
          flexWrap: 'wrap'
        }}
      >
        {mode === 'register' && (
          <>
            <input
              value={firstName}
              onChange={(event) =>
                setFirstName(
                  event.target.value
                )
              }
              placeholder="Voornaam"
              autoComplete="given-name"
            />

            <input
              value={lastName}
              onChange={(event) =>
                setLastName(
                  event.target.value
                )
              }
              placeholder="Achternaam"
              autoComplete="family-name"
            />
          </>
        )}

        <input
          value={email}
          onChange={(event) =>
            setEmail(event.target.value)
          }
          onKeyDown={
            handleEmailKeyDown
          }
          placeholder="E-mail"
          type="email"
          autoComplete="email"
        />

        <input
          ref={passwordRef}
          value={password}
          onChange={(event) =>
            setPassword(
              event.target.value
            )
          }
          onKeyDown={
            handlePasswordKeyDown
          }
          placeholder="Wachtwoord"
          type="password"
          autoComplete={
            mode === 'login'
              ? 'current-password'
              : 'new-password'
          }
        />

        {mode === 'login' ? (
          <button onClick={login}>
            Inloggen
          </button>
        ) : (
          <button onClick={register}>
            Account maken
          </button>
        )}
      </div>

      <button
        onClick={changeMode}
        style={{
          background: 'transparent',
          color: '#ffd740',
          border: 'none',
          padding: 0,
          textAlign: 'left',
          cursor: 'pointer'
        }}
      >
        {mode === 'login'
          ? 'Nog geen account? Account maken'
          : 'Al een account? Inloggen'}
      </button>
    </div>
  );
}