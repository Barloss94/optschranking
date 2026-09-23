import { useState } from 'react';

export default function PlayerAdminPanel({
  canAddPlayers,
  canManagePlayers,
  players,
  onAddPlayer,
  onUpdatePlayer,
  onDeletePlayer
}) {
  const [newName, setNewName] = useState('');
  const [bulkInput, setBulkInput] = useState('');
  const [search, setSearch] = useState('');

  const visiblePlayers = players.filter((player) =>
    (player.preferred_name || player.name)
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const addSinglePlayer = () => {
    onAddPlayer(newName);
    setNewName('');
  };

  const importBulkPlayers = () => {
    const names = bulkInput
      .split('\n')
      .map((name) => name.trim())
      .filter(Boolean);

    names.forEach((name) => onAddPlayer(name));
    setBulkInput('');
  };

  if (!canAddPlayers && !canManagePlayers) return null;

  return (
    <>
      {canAddPlayers && (
        <div style={{ marginBottom: 16 }}>
          <h3>Speler toevoegen</h3>

          <div style={{ display: 'flex', gap: 8 }}>
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Naam speler..."
              onKeyDown={(e) => e.key === 'Enter' && addSinglePlayer()}
              style={{ flex: 1 }}
            />

            <button onClick={addSinglePlayer}>Toevoegen</button>
          </div>
        </div>
      )}

      {canManagePlayers && (
        <div style={{ borderTop: '1px solid #333', paddingTop: 16 }}>
          <h3 style={{ marginTop: 0 }}>⚙️ Spelerbeheer</h3>

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Zoek speler..."
            style={{ width: '100%', marginBottom: 10 }}
          />

          <textarea
            value={bulkInput}
            onChange={(e) => setBulkInput(e.target.value)}
            placeholder="Bulk import, 1 speler per regel"
            rows={6}
            style={{ width: '100%', marginBottom: 10 }}
          />

          <button onClick={importBulkPlayers} style={{ width: '100%', marginBottom: 14 }}>
            📥 Bulk import
          </button>

          <div style={{ maxHeight: 360, overflowY: 'auto', display: 'grid', gap: 8 }}>
            {visiblePlayers.map((player) => (
              <div
                key={player.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr auto',
                  gap: 8,
                  alignItems: 'center',
                  background: '#181818',
                  padding: 8,
                  borderRadius: 8
                }}
              >
                <input
                  value={player.preferred_name || player.name}
                  onChange={(e) => onUpdatePlayer(player.id, e.target.value)}
                />

                <button onClick={() => onDeletePlayer(player)} style={{ color: 'red' }}>
                  🗑
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}