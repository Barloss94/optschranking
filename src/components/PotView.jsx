import { thStyle, tdStyle } from '../styles/tableStyles';
import { formatEuro } from '../utils/formatters';

export default function PotView({
  finalPotBreakdown,
  grossFinalPot,
  finalExpenses,
  totalFinalExpenses,
  finalPot,
  newExpenseLabel,
  setNewExpenseLabel,
  newExpenseAmount,
  setNewExpenseAmount,
  onAddFinalExpense,
  onDeleteFinalExpense
}) {
  return (
    <>
      <h2>Finalepot overzicht</h2>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <div>
          <h3>Opbouw per ronde</h3>

          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={thStyle}>Ronde</th>
                <th style={thStyle}>Spelers</th>
                <th style={thStyle}>Bijdrage</th>
              </tr>
            </thead>

            <tbody>
              {finalPotBreakdown.map((item) => (
                <tr key={item.round}>
                  <td style={tdStyle}>Ronde {item.round}</td>
                  <td style={tdStyle}>{item.entries}</td>
                  <td style={tdStyle}>{formatEuro(item.contribution)}</td>
                </tr>
              ))}

              <tr>
                <td style={{ ...tdStyle, fontWeight: 800 }} colSpan={2}>
                  Bruto pot
                </td>
                <td style={{ ...tdStyle, fontWeight: 800 }}>
                  {formatEuro(grossFinalPot)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div>
          <h3>Finale-uitgaven</h3>

          <div style={{ display: 'grid', gap: 8, marginBottom: 16 }}>
            <input
              value={newExpenseLabel}
              onChange={(e) => setNewExpenseLabel(e.target.value)}
              placeholder="Omschrijving uitgave..."
            />

            <input
              value={newExpenseAmount}
              onChange={(e) => setNewExpenseAmount(e.target.value)}
              placeholder="Bedrag..."
              type="number"
              min="0"
              step="1"
            />

            <button onClick={onAddFinalExpense}>➕ Uitgave toevoegen</button>
          </div>

          <div style={{ display: 'grid', gap: 8 }}>
            {finalExpenses.length === 0 && (
              <div style={{ color: '#888' }}>Nog geen uitgaven toegevoegd.</div>
            )}

            {finalExpenses.map((expense) => (
              <div
                key={expense.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr auto auto',
                  gap: 10,
                  alignItems: 'center',
                  background: '#181818',
                  padding: 10,
                  borderRadius: 8
                }}
              >
                <div>{expense.label}</div>
                <div>{formatEuro(expense.amount)}</div>

                <button
                  onClick={() => onDeleteFinalExpense(expense)}
                  style={{ color: 'red' }}
                >
                  🗑
                </button>
              </div>
            ))}
          </div>

          <div
            style={{
              marginTop: 18,
              padding: 12,
              background: '#181818',
              borderRadius: 8
            }}
          >
            <div style={{ fontSize: 12, color: '#aaa' }}>Totaal uitgaven</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#ff8a80' }}>
              - {formatEuro(totalFinalExpenses)}
            </div>

            <div style={{ fontSize: 12, color: '#aaa', marginTop: 12 }}>
              Netto finalepot
            </div>
            <div style={{ fontSize: 28, fontWeight: 900 }}>
              {formatEuro(finalPot)}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}