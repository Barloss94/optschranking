import { MAX_FINALISTS } from '../constants/rankingConstants';

export default function FinalistsView({
  finalStackList,
  baseFinalists,
  reservePool,
  availableReserves,
  nextUp,
  declinedFinalists,
  finaleRegistrations = [],
  isAdmin,
  finaleLocked,
  onDeclineFinalist,
  onUndoDecline
}) {
  const declinedIds = declinedFinalists.map((item) => item.player_id);

  const getFinaleStatus = (playerId) => {
    const registration =
      finaleRegistrations.find(
        (item) =>
          item.player_id ===
          playerId
      );

    if (
      registration?.status ===
      'confirmed'
    ) {
      return {
        label: '✅ Aangemeld',
        color: '#4caf50'
      };
    }

    return {
      label: '⏳ Reactie nodig',
      color: '#ffd740'
    };
  };

  return (
    <>
      <h2>Finalisten / Waitlist</h2>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div>
          <h3>🏆 Finalisten ({finalStackList.length}/{MAX_FINALISTS})</h3>

          <div style={{ color: '#aaa', fontSize: 12, marginBottom: 10 }}>
            Totale stack: 1.350.000 · Basis: 20.000 per finalist · Rest op rankingpunten
          </div>

          <div style={{ display: 'grid', gap: 8 }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: isAdmin
                  ? '40px minmax(140px, 1fr) 80px 120px 130px 120px'
                  : '40px minmax(140px, 1fr) 80px 120px 130px',
                gap: 10,
                color: '#aaa',
                fontSize: 12,
                fontWeight: 800,
                padding: '0 10px'
              }}
            >
              <div>#</div>
              <div>Speler</div>
              <div>Punten</div>
              <div>Stack</div>
              <div>Status</div>
              {isAdmin && <div>Actie</div>}
            </div>

            {finalStackList.map((player, idx) => {
              const wasReplacement = !baseFinalists.some((p) => p.id === player.id);
              const isBaseFinalist = baseFinalists.some((p) => p.id === player.id);
              const finaleStatus = getFinaleStatus(player.id);

              return (
                <div
                  key={player.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: isAdmin
                      ? '40px minmax(140px, 1fr) 80px 120px 130px 120px'
                      : '40px minmax(140px, 1fr) 80px 120px 130px',
                    gap: 10,
                    alignItems: 'center',
                    background: '#181818',
                    padding: 10,
                    borderRadius: 8
                  }}
                >
                  <div>{idx + 1}</div>

                  <div>
                    {player.displayName}{' '}
                    {wasReplacement && (
                      <span style={{ color: '#ffd54f' }}>(doorgeschoven)</span>
                    )}
                  </div>

                  <div style={{ color: '#aaa', fontWeight: 700 }}>
                    {player.totalPoints} pt
                  </div>

                  <div style={{ color: '#ffd740', fontWeight: 900 }}>
                    {player.finalStack.toLocaleString('nl-NL')}
                  </div>

                  <div
                    style={{
                      color: finaleStatus.color,
                      fontWeight: 800,
                      fontSize: 13
                    }}
                  >
                    {finaleStatus.label}
                  </div>

                  {isAdmin && isBaseFinalist ? (
                    <button
                      onClick={() => onDeclineFinalist(player)}
                      disabled={finaleLocked}
                      style={{ color: 'red' }}
                    >
                      ❌ Afmelden
                    </button>
                  ) : isAdmin ? (
                    <div />
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <h3>🟡 Waitlist (28 t/m 32)</h3>

          <div style={{ display: 'grid', gap: 8 }}>
            {reservePool.length === 0 && (
              <div style={{ color: '#888' }}>Geen waitlist spelers.</div>
            )}

            {reservePool.map((player, idx) => {
              const declined = declinedIds.includes(player.id);
              const isAvailable = availableReserves.some((p) => p.id === player.id);
              const isNext = nextUp?.id === player.id;

              return (
                <div
                  key={player.id}
                  style={{
                    background: isNext ? 'rgba(255,215,64,0.18)' : '#181818',
                    border: isNext ? '1px solid #ffd740' : '1px solid transparent',
                    padding: 10,
                    borderRadius: 8,
                    opacity: declined ? 0.45 : 1
                  }}
                >
                  <strong>#{MAX_FINALISTS + idx + 1}</strong> {player.displayName}{' '}
                  {isNext && (
                    <span style={{ color: '#ffd740', fontWeight: 800 }}>
                      ⭐ NEXT UP
                    </span>
                  )}
                  {!isNext && isAvailable && (
                    <span style={{ color: '#bbb' }}>Beschikbaar</span>
                  )}
                  {declined && (
                    <span style={{ color: '#f44336' }}>Niet beschikbaar</span>
                  )}
                </div>
              );
            })}
          </div>

          {isAdmin && (
            <div
              style={{
                marginTop: 20,
                padding: 12,
                background: '#181818',
                borderRadius: 8
              }}
            >
              <div style={{ fontWeight: 800, marginBottom: 6 }}>Undo afmelding</div>
              <div style={{ color: '#aaa', marginBottom: 10 }}>
                Laatste afmelding ongedaan maken.
              </div>
              <button onClick={onUndoDecline} disabled={finaleLocked}>
                ↩️ Undo
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}