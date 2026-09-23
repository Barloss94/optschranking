import { thStyle, tdStyle } from '../styles/tableStyles';
import { formatEuro } from '../utils/formatters';

export default function FinalView({
  finalList,
  finalResults,
  finalPot,
  finalPayouts,
  rankingWinner,
  isAdmin,
  onUpdateFinalResult
}) {
  const usedPlayerIds = finalResults.map((r) => r?.player_id).filter(Boolean);

  const getAvailableFinalPlayers = (position) =>
    finalList.filter(
      (player) =>
        !usedPlayerIds.includes(player.id) ||
        finalResults?.[position]?.player_id === player.id
    );

  return (
    <>
      <h2>Finale</h2>

      <div style={{ color: '#aaa', marginBottom: 14 }}>
        Finale is een apart toernooi. Alleen finalisten kunnen hier ingevoerd worden.
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: isAdmin ? '1fr 320px' : '1fr', gap: 24 }}>
        <div>
          {isAdmin ? (
            <div style={{ display: 'grid', gap: 8, maxWidth: 720 }}>
              {Array.from({ length: finalList.length }).map((_, pos) => (
                <div
                  key={pos}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '60px 1fr',
                    gap: 10,
                    alignItems: 'center'
                  }}
                >
                  <div style={{ fontWeight: 700 }}>{pos + 1}</div>

                  <select
                    value={finalResults?.[pos]?.player_id || ''}
                    onChange={(e) => onUpdateFinalResult(pos + 1, e.target.value)}
                    style={{ padding: 10 }}
                  >
                    <option value="">-- kies finalist --</option>

                    {getAvailableFinalPlayers(pos).map((player) => (
                      <option key={player.id} value={player.id}>
                        {player.displayName}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={thStyle}>#</th>
                  <th style={thStyle}>Naam</th>
                </tr>
              </thead>

              <tbody>
                {finalResults.length > 0 ? (
                  finalResults
                    .filter((row) => row?.player_id)
                    .map((row) => (
                      <tr key={row.position}>
                        <td style={tdStyle}>{row.position}</td>
                        <td style={tdStyle}>{row.player_name}</td>
                      </tr>
                    ))
                ) : (
                  <tr>
                    <td style={tdStyle} colSpan={2}>
                      Finale-uitslag is nog niet ingevuld.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {isAdmin && (
          <div>
            <div
              style={{
                background: '#181818',
                borderRadius: 10,
                padding: 14,
                marginBottom: 16
              }}
            >
              <div style={{ fontSize: 12, color: '#aaa' }}>Netto finalepot</div>
              <div style={{ fontSize: 28, fontWeight: 800 }}>{formatEuro(finalPot)}</div>
            </div>

            <div
              style={{
                background: '#181818',
                borderRadius: 10,
                padding: 14
              }}
            >
              <h3 style={{ marginTop: 0 }}>Uitbetaling</h3>

              <div style={{ display: 'grid', gap: 8 }}>
                {finalPayouts.places.map((amount, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '50px 1fr',
                      gap: 10
                    }}
                  >
                    <div>{idx + 1}</div>
                    <div>{formatEuro(amount)}</div>
                  </div>
                ))}

                <div
                  style={{
                    marginTop: 10,
                    paddingTop: 10,
                    borderTop: '1px solid #333',
                    display: 'grid',
                    gap: 4
                  }}
                >
                  <div style={{ fontWeight: 700 }}>Winnaar ranking</div>
                  <div>
                    {rankingWinner ? rankingWinner.displayName : '-'} →{' '}
                    {formatEuro(finalPayouts.rankingWinner)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}