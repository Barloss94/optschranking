import LoginBox from './LoginBox';

export default function AppHeader({
  user,
  profile,
  isAdmin,
  finaleLocked,
  onToggleFinaleLock,
  onUndoDecline,
  undoDisabled,
  onExport,
  onReset
}) {
  return (
    <header
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        gap: 12,
        flexWrap: 'wrap'
      }}
    >
      <h1 style={{ margin: 0 }}>OPTSCH RANKING 2026</h1>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <LoginBox user={user} profile={profile} />

        {isAdmin && (
          <>
            <button
              onClick={onToggleFinaleLock}
              style={{
                background: finaleLocked ? '#b71c1c' : '#1b5e20',
                color: '#fff',
                fontWeight: 'bold'
              }}
            >
              {finaleLocked ? '🔒 Deelnemerslijst gelockt' : '🔓 Deelnemerslijst open'}
            </button>

            <button onClick={onUndoDecline} disabled={undoDisabled}>
              ↩️ Undo afmelding
            </button>

            <button onClick={onExport}>📸 Download afbeelding</button>

            <button onClick={onReset} style={{ color: 'red' }}>
              Reset
            </button>
          </>
        )}
      </div>
    </header>
  );
}