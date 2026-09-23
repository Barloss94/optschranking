export default function AuditLogView({ auditLog }) {
  return (
    <>
      <h2>Audit log</h2>

      <div style={{ display: 'grid', gap: 8 }}>
        {auditLog.length === 0 && (
          <div style={{ color: '#888' }}>Nog geen logregels.</div>
        )}

        {auditLog.map((entry) => (
          <div
            key={entry.id}
            style={{
              background: '#181818',
              borderRadius: 8,
              padding: 10
            }}
          >
            <div style={{ fontSize: 12, color: '#aaa' }}>
              {new Date(entry.created_at).toLocaleString('nl-NL')}
            </div>
            <div>{entry.message}</div>
          </div>
        ))}
      </div>
    </>
  );
}