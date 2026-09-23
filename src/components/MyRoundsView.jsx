import { formatEuro } from '../utils/formatters';

function formatDateTime(value) {
  if (!value) return '-';

  return new Date(value).toLocaleString('nl-NL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export default function MyRoundsView({
  currentPlayer,
  season,
  rounds,
  roundEntries,
  roundPayments,
  roundResults = {},
  getRoundPaymentUrl,
  onRegisterRound
}) {
  const now = new Date();

  const getEntry = (round) =>
    roundEntries.find(
      (entry) =>
        entry.round_id === round.id &&
        entry.player_id === currentPlayer?.id &&
        entry.status !== 'cancelled'
    );

  const hasPlayerResult = (round) => {
    const results = roundResults[round.round_number] || [];
    return results.some((result) => result?.player_id === currentPlayer?.id);
  };

  const hasRoundResult = (round) => {
    const results = roundResults[round.round_number] || [];
    return results.some((result) => result?.player_id);
  };

  const sortedRounds = [...rounds]
    .filter((round) => {
      if (!currentPlayer) return true;

      const entry = getEntry(round);
      const playerHasResult = hasPlayerResult(round);
      const roundHasResult = hasRoundResult(round);

      if (roundHasResult && !entry && !playerHasResult) {
        return false;
      }

      return true;
    })
    .sort((a, b) => a.round_number - b.round_number);

  const getRegistrationState = (round) => {
    const opensAt = round.registration_opens_at
      ? new Date(round.registration_opens_at)
      : null;

    const closesAt = round.registration_closes_at
      ? new Date(round.registration_closes_at)
      : null;

    if (opensAt && now < opensAt) return 'not_open';
    if (closesAt && now > closesAt) return 'closed';

    return 'open';
  };

  const isPaid = (round) =>
    roundPayments.some(
      (payment) =>
        payment.round_id === round.id &&
        payment.player_id === currentPlayer?.id
    );

  const sharePaymentLink = async (paymentUrl, round) => {
    if (!paymentUrl) return;

    const text = `Hier is mijn betaallink voor Ronde ${round.round_number} van de OPTSCH ranking:`;

    if (navigator.share) {
      await navigator.share({
        title: 'OPTSCH betaallink',
        text,
        url: paymentUrl
      });
      return;
    }

    await navigator.clipboard.writeText(`${text}\n${paymentUrl}`);
    alert('Betaallink gekopieerd.');
  };

  const handleRegisterAndPay = async (round, paymentUrl) => {
    const success = await onRegisterRound(round);

    if (success && paymentUrl) {
      window.open(paymentUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const handleRegisterAndShare = async (round, paymentUrl) => {
    const success = await onRegisterRound(round);

    if (success && paymentUrl) {
      await sharePaymentLink(paymentUrl, round);
    }
  };

  if (!currentPlayer) {
    return (
      <>
        <h2>Mijn rondes</h2>
        <div style={{ color: '#ff8a80' }}>
          Je account is nog niet gekoppeld aan een speler.
        </div>
      </>
    );
  }

  return (
    <>
      <h2>Mijn rondes</h2>

      <div style={{ color: '#aaa', marginBottom: 16 }}>
        Je inschrijving is pas definitief na betaling.
      </div>

      <div style={{ display: 'grid', gap: 12 }}>
        {sortedRounds.map((round) => {
          const entry = getEntry(round);
          const paid = isPaid(round);
          const registrationState = getRegistrationState(round);
          const paymentUrl = getRoundPaymentUrl?.(round, currentPlayer);
          const playerHasResult = hasPlayerResult(round);

          return (
            <div
              key={round.id}
              style={{
                background: '#181818',
                border: '1px solid #333',
                borderRadius: 10,
                padding: 14
              }}
            >
              <h3 style={{ marginTop: 0 }}>
                Ronde {round.round_number} / {round.payment_code || `VR${round.round_number}`}
              </h3>

              <div style={{ color: '#aaa', marginBottom: 10 }}>
                Speeldatum: {formatDateTime(round.round_date)}
                <br />
                Inschrijving opent: {formatDateTime(round.registration_opens_at)}
                <br />
                Inschrijving sluit: {formatDateTime(round.registration_closes_at)}
              </div>

              {!entry && !playerHasResult && registrationState === 'open' && (
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <button onClick={() => handleRegisterAndPay(round, paymentUrl)}>
                    Inschrijven en betalen
                  </button>

                  <button onClick={() => handleRegisterAndShare(round, paymentUrl)}>
                    Inschrijven en betaallink delen
                  </button>
                </div>
              )}

              {!entry && !playerHasResult && registrationState === 'not_open' && (
                <div style={{ color: '#888', fontWeight: 800 }}>
                  Inschrijving nog niet geopend.
                </div>
              )}

              {!entry && !playerHasResult && registrationState === 'closed' && (
                <div style={{ color: '#ff8a80', fontWeight: 800 }}>
                  Inschrijving gesloten.
                </div>
              )}

              {entry && !paid && (
                <>
                  <div style={{ color: '#ffd740', fontWeight: 800 }}>
                    Inschrijving gestart, betaling nog nodig.
                  </div>

                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 10 }}>
                    <a href={paymentUrl} target="_blank" rel="noreferrer">
                      Betaal {formatEuro(Number(season?.buy_in) || 7.5)}
                    </a>

                    <button onClick={() => sharePaymentLink(paymentUrl, round)}>
                      Betaallink delen
                    </button>
                  </div>
                </>
              )}

              {entry && paid && !playerHasResult && (
                <div style={{ color: '#4caf50', fontWeight: 800 }}>
                  ✅ Inschrijving definitief
                </div>
              )}

              {playerHasResult && (
                <div style={{ color: '#4caf50', fontWeight: 800 }}>
                  🏁 Deelgenomen
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}