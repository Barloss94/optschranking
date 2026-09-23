import { useMemo } from 'react';
import { thStyle, tdStyle } from '../styles/tableStyles';

const NO_PAYMENT_NEEDED_STATUSES = ['cancelled', 'no_show', 'refunded'];
const REFUND_STATUSES = ['refund_due'];

export default function PaymentsView({
  players,
  rounds,
  roundEntries = [],
  roundPayments = []
}) {
  const getPlayerName = (playerId) => {
    const player = players.find((item) => item.id === playerId);
    return player ? player.preferred_name || player.name : 'Onbekende speler';
  };

  const getRoundLabel = (roundId) => {
    const round = rounds.find((item) => item.id === roundId);
    return round ? round.payment_code || `VR${round.round_number}` : 'Onbekende ronde';
  };

  const financialActionsByPlayer = useMemo(() => {
    const map = new Map();

    roundEntries.forEach((entry) => {
      if (NO_PAYMENT_NEEDED_STATUSES.includes(entry.status)) return;

      const isPaid = roundPayments.some(
        (payment) =>
          payment.round_id === entry.round_id &&
          payment.player_id === entry.player_id
      );

      const needsRefund = REFUND_STATUSES.includes(entry.status) && isPaid;
      const needsPayment = !isPaid && !REFUND_STATUSES.includes(entry.status);

      if (!needsPayment && !needsRefund) return;

      if (!map.has(entry.player_id)) {
        map.set(entry.player_id, {
          playerId: entry.player_id,
          playerName: getPlayerName(entry.player_id),
          openPayments: [],
          refunds: []
        });
      }

      const item = map.get(entry.player_id);

      if (needsPayment) item.openPayments.push(entry);
      if (needsRefund) item.refunds.push(entry);
    });

    return [...map.values()].sort((a, b) =>
      a.playerName.localeCompare(b.playerName)
    );
  }, [roundEntries, roundPayments, players, rounds]);

  const totalOpenPayments = financialActionsByPlayer.reduce(
    (sum, item) => sum + item.openPayments.length,
    0
  );

  const totalRefunds = financialActionsByPlayer.reduce(
    (sum, item) => sum + item.refunds.length,
    0
  );

  return (
    <>
      <h2>Openstaande buy-ins</h2>

      <div style={{ color: '#aaa', marginBottom: 16 }}>
        Dit overzicht toont spelers die nog moeten betalen of restitutie moeten krijgen.
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, minmax(140px, 1fr))',
          gap: 12,
          marginBottom: 24
        }}
      >
        <div style={{ background: '#181818', borderRadius: 10, padding: 14 }}>
          <div style={{ color: '#aaa', fontSize: 12 }}>Openstaande buy-ins</div>
          <div
            style={{
              fontSize: 28,
              fontWeight: 900,
              color: totalOpenPayments > 0 ? '#ff8a80' : '#4caf50'
            }}
          >
            {totalOpenPayments}
          </div>
        </div>

        <div style={{ background: '#181818', borderRadius: 10, padding: 14 }}>
          <div style={{ color: '#aaa', fontSize: 12 }}>Restituties</div>
          <div
            style={{
              fontSize: 28,
              fontWeight: 900,
              color: totalRefunds > 0 ? '#ffb74d' : '#4caf50'
            }}
          >
            {totalRefunds}
          </div>
        </div>

        <div style={{ background: '#181818', borderRadius: 10, padding: 14 }}>
          <div style={{ color: '#aaa', fontSize: 12 }}>Spelers met actie</div>
          <div
            style={{
              fontSize: 28,
              fontWeight: 900,
              color: financialActionsByPlayer.length > 0 ? '#ffd740' : '#4caf50'
            }}
          >
            {financialActionsByPlayer.length}
          </div>
        </div>
      </div>

      {financialActionsByPlayer.length === 0 ? (
        <div
          style={{
            background: '#181818',
            borderRadius: 10,
            padding: 16,
            color: '#4caf50',
            fontWeight: 800
          }}
        >
          ✅ Geen openstaande buy-ins of restituties.
        </div>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={thStyle}>Speler</th>
              <th style={thStyle}>Openstaand</th>
              <th style={thStyle}>Restitutie</th>
              <th style={thStyle}>Details</th>
            </tr>
          </thead>

          <tbody>
            {financialActionsByPlayer.map((item) => (
              <tr key={item.playerId}>
                <td style={tdStyle}>{item.playerName}</td>

                <td style={{ ...tdStyle, color: item.openPayments.length > 0 ? '#ff8a80' : '#4caf50', fontWeight: 900 }}>
                  {item.openPayments.length}
                </td>

                <td style={{ ...tdStyle, color: item.refunds.length > 0 ? '#ffb74d' : '#4caf50', fontWeight: 900 }}>
                  {item.refunds.length}
                </td>

                <td style={tdStyle}>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {item.openPayments.map((entry) => (
                      <span key={`open-${entry.id}`} style={{ background: '#111', border: '1px solid #333', borderRadius: 999, padding: '4px 10px', color: '#ff8a80', fontWeight: 800 }}>
                        ❌ {getRoundLabel(entry.round_id)}
                      </span>
                    ))}

                    {item.refunds.map((entry) => (
                      <span key={`refund-${entry.id}`} style={{ background: '#111', border: '1px solid #333', borderRadius: 999, padding: '4px 10px', color: '#ffb74d', fontWeight: 800 }}>
                        ↩️ {getRoundLabel(entry.round_id)}
                      </span>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}