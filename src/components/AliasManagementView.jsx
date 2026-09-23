import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { thStyle, tdStyle } from '../styles/tableStyles';

export default function AliasManagementView({ season, players }) {
  const [aliases, setAliases] = useState([]);
  const [newAlias, setNewAlias] = useState('');
  const [selectedPlayerId, setSelectedPlayerId] = useState('');

  const loadAliases = async () => {
    if (!season?.id) return;

    const { data, error } = await supabase
      .from('player_aliases')
      .select('*')
      .eq('season_id', season.id)
      .order('alias_name', { ascending: true });

    if (error) {
      alert(error.message);
      return;
    }

    setAliases(data || []);
  };

  useEffect(() => {
    loadAliases();
  }, [season?.id]);

  const addAlias = async () => {
    const aliasName = newAlias.trim();

    if (!aliasName || !selectedPlayerId || !season?.id) return;

    const { error } = await supabase.from('player_aliases').insert({
      season_id: season.id,
      player_id: selectedPlayerId,
      alias_name: aliasName,
      source: 'manual'
    });

    if (error) {
      alert(error.message);
      return;
    }

    setNewAlias('');
    setSelectedPlayerId('');
    await loadAliases();
  };

  const deleteAlias = async (aliasId) => {
    const { error } = await supabase
      .from('player_aliases')
      .delete()
      .eq('id', aliasId);

    if (error) {
      alert(error.message);
      return;
    }

    await loadAliases();
  };

  const getPlayerName = (playerId) => {
    const player = players.find((item) => item.id === playerId);
    return player ? player.preferred_name || player.name : 'Onbekend';
  };

  return (
    <>
      <h2>Aliasbeheer</h2>

      <div style={{ color: '#aaa', marginBottom: 16 }}>
        Koppel meerdere Pokerrrr2/CSV-namen aan dezelfde speler.
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr auto',
          gap: 10,
          marginBottom: 20
        }}
      >
        <input
          value={newAlias}
          onChange={(e) => setNewAlias(e.target.value)}
          placeholder="Alias / Pokerrrr2 naam..."
        />

        <select
          value={selectedPlayerId}
          onChange={(e) => setSelectedPlayerId(e.target.value)}
        >
          <option value="">Koppel aan speler...</option>
          {players.map((player) => (
            <option key={player.id} value={player.id}>
              {player.preferred_name || player.name}
            </option>
          ))}
        </select>

        <button onClick={addAlias}>Alias toevoegen</button>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={thStyle}>Alias</th>
            <th style={thStyle}>Speler</th>
            <th style={thStyle}>Bron</th>
            <th style={thStyle}>Actie</th>
          </tr>
        </thead>

        <tbody>
          {aliases.map((alias) => (
            <tr key={alias.id}>
              <td style={tdStyle}>{alias.alias_name}</td>
              <td style={tdStyle}>{getPlayerName(alias.player_id)}</td>
              <td style={tdStyle}>{alias.source}</td>
              <td style={tdStyle}>
                <button onClick={() => deleteAlias(alias.id)} style={{ color: 'red' }}>
                  🗑
                </button>
              </td>
            </tr>
          ))}

          {aliases.length === 0 && (
            <tr>
              <td style={tdStyle} colSpan={4}>
                Nog geen aliassen toegevoegd.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </>
  );
}