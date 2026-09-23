import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function LoginBox({ user, profile }) {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const login = async () => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) alert(error.message);
  };

  const register = async () => {
  const cleanEmail = email.trim();

  const { error } = await supabase.auth.signUp({
    email: cleanEmail,
    password
  });

  if (error) {
    alert(error.message);
    return;
  }

  const { data: functionData, error: functionError } =
    await supabase.functions.invoke('notify-admin-registration', {
      body: JSON.stringify({
        email: cleanEmail,
        display_name: cleanEmail
      }),
      headers: {
        'Content-Type': 'application/json'
      }
    });

  console.log('FUNCTION DATA:', functionData);
  console.log('FUNCTION ERROR:', functionError);

  if (functionError) {
    alert(`Account aangemaakt, maar e-mailmelding mislukt: ${functionError.message}`);
    return;
  }

  alert('Account aangemaakt. De beheerder heeft een melding ontvangen.');
};

  const logout = async () => {
    await supabase.auth.signOut();
  };

  if (user) {
    return (
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <span>
          👤 {profile?.display_name || user.email} · {profile?.role || 'viewer'}
        </span>
        <button onClick={logout}>Uitloggen</button>
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gap: 8 }}>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="E-mail" />
        <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Wachtwoord" type="password" />

        {mode === 'login' ? (
          <button onClick={login}>Inloggen</button>
        ) : (
          <button onClick={register}>Account maken</button>
        )}
      </div>

      <button
        onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
        style={{ background: 'transparent', color: '#ffd740', border: 'none', padding: 0, textAlign: 'left', cursor: 'pointer' }}
      >
        {mode === 'login' ? 'Nog geen account? Account maken' : 'Al een account? Inloggen'}
      </button>
    </div>
  );
}