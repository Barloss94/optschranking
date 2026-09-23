import { activeMenuBtn, menuBtn } from '../styles/tableStyles';
import { formatEuro } from '../utils/formatters';

export default function Sidebar({
  view,
  setView,
  rounds,
  isAdmin,
  showMyRounds,
  grossFinalPot,
  totalFinalExpenses,
  finalPot,
  registrationNotificationCount,
  onAddRound,
  children
}) {
  return (
    <aside
      style={{
        border: '1px solid #333',
        padding: 16,
        borderRadius: 12,
        background: '#111'
      }}
    >
      {isAdmin && (
        <button onClick={onAddRound} style={{ width: '100%', marginBottom: 10 }}>
          ➕ Nieuwe ronde
        </button>
      )}

      <div style={{ marginBottom: 16 }}>
        <h3 style={{ marginBottom: 10 }}>Menu</h3>

        <div style={{ display: 'grid', gap: 8, marginBottom: 16 }}>
          {showMyRounds && (
            <button
              onClick={() => setView('my-rounds')}
              style={view === 'my-rounds' ? activeMenuBtn : menuBtn}
            >
              🎟️ Mijn rondes
            </button>
          )}

          <button
            onClick={() => setView('total')}
            style={view === 'total' ? activeMenuBtn : menuBtn}
          >
            🏆 Algemene stand
          </button>

          <button
            onClick={() => setView('finalists')}
            style={view === 'finalists' ? activeMenuBtn : menuBtn}
          >
            👥 Finalisten / Waitlist
          </button>

          <button
            onClick={() => setView('final')}
            style={view === 'final' ? activeMenuBtn : menuBtn}
          >
            🎯 Finale
          </button>

          {isAdmin && (
            <>
              <button
                onClick={() => setView('payments')}
                style={view === 'payments' ? activeMenuBtn : menuBtn}
              >
                💳 Openstaande buy-ins
              </button>

              <button
                onClick={() => setView('pot')}
                style={view === 'pot' ? activeMenuBtn : menuBtn}
              >
                💰 Finalepot overzicht
              </button>

              <button
                onClick={() => setView('audit')}
                style={view === 'audit' ? activeMenuBtn : menuBtn}
              >
                📋 Audit log
              </button>

              <button
                onClick={() => setView('users')}
                style={view === 'users' ? activeMenuBtn : menuBtn}
              >
                👤 Gebruikersbeheer
                {registrationNotificationCount > 0 && (
                  <span
                    style={{
                      color: '#ffd740',
                      fontWeight: 900,
                      marginLeft: 6
                    }}
                  >
                    🔔 {registrationNotificationCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => setView('aliases')}
                style={view === 'aliases' ? activeMenuBtn : menuBtn}
              >
                🏷️ Aliasbeheer
              </button>
            </>
          )}
        </div>

        <h4 style={{ marginBottom: 8, color: '#aaa' }}>Rondes</h4>

        <div style={{ display: 'grid', gap: 6 }}>
          {rounds.map((round) => (
            <button
              key={round.id}
              onClick={() => setView(`round-${round.round_number}`)}
              style={view === `round-${round.round_number}` ? activeMenuBtn : menuBtn}
            >
              🏁 Ronde {round.round_number}
            </button>
          ))}
        </div>
      </div>

      {isAdmin && (
        <div
          style={{
            marginBottom: 16,
            padding: 12,
            background: '#181818',
            borderRadius: 10
          }}
        >
          <div style={{ fontSize: 12, color: '#aaa' }}>Bruto finalepot</div>
          <div style={{ fontSize: 24, fontWeight: 800 }}>
            {formatEuro(grossFinalPot)}
          </div>

          <div style={{ fontSize: 12, color: '#aaa', marginTop: 10 }}>
            Finale-uitgaven
          </div>
          <div
            style={{
              fontSize: 20,
              fontWeight: 700,
              color: totalFinalExpenses > 0 ? '#ff8a80' : '#ccc'
            }}
          >
            - {formatEuro(totalFinalExpenses)}
          </div>

          <div style={{ fontSize: 12, color: '#aaa', marginTop: 10 }}>
            Netto finalepot
          </div>
          <div style={{ fontSize: 28, fontWeight: 800 }}>
            {formatEuro(finalPot)}
          </div>
        </div>
      )}

      {children}
    </aside>
  );
}