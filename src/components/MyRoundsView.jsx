import {
  useEffect,
  useMemo,
  useState
} from 'react';
import { supabase } from '../lib/supabaseClient';
import { formatEuro } from '../utils/formatters';

function formatDateTime(value) {
  if (!value) return '-';

  return new Date(value).toLocaleString(
    'nl-NL',
    {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }
  );
}

function formatTime(value) {
  if (!value) return '-';

  return new Date(value).toLocaleTimeString(
    'nl-NL',
    {
      hour: '2-digit',
      minute: '2-digit'
    }
  );
}

function getStartOfLocalDay(value) {
  const date = new Date(value);

  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    0,
    0,
    0,
    0
  );
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
  const [
    schedule,
    setSchedule
  ] = useState([]);

  const [
    clock,
    setClock
  ] = useState(
    () => new Date()
  );

  const loadSchedule = async () => {
    if (!season?.id) {
      setSchedule([]);
      return;
    }

    const { data, error } =
      await supabase
        .from(
          'tournament_schedule'
        )
        .select('*')
        .eq(
          'season_id',
          season.id
        )
        .order(
          'round_number',
          {
            ascending: true
          }
        );

    if (error) {
      console.error(
        'Toernooischema laden mislukt:',
        error
      );
      return;
    }

    setSchedule(data || []);
  };

  useEffect(() => {
    loadSchedule();

    const interval =
      window.setInterval(
        () => {
          setClock(new Date());
          loadSchedule();
        },
        60000
      );

    return () =>
      window.clearInterval(
        interval
      );
  }, [season?.id]);

  const roundById =
    useMemo(
      () =>
        new Map(
          rounds.map(
            (round) => [
              round.id,
              round
            ]
          )
        ),
      [rounds]
    );

  const getEntry = (
    roundId
  ) =>
    roundEntries.find(
      (entry) =>
        entry.round_id ===
          roundId &&
        entry.player_id ===
          currentPlayer?.id &&
        entry.status !==
          'cancelled'
    );

  const hasPlayerResult = (
    roundNumber
  ) => {
    const results =
      roundResults[
        roundNumber
      ] || [];

    return results.some(
      (result) =>
        result?.player_id ===
        currentPlayer?.id
    );
  };

  const hasRoundResult = (
    roundNumber
  ) => {
    const results =
      roundResults[
        roundNumber
      ] || [];

    return results.some(
      (result) =>
        result?.player_id
    );
  };

  const visibleItems =
    useMemo(() => {
      const scheduledNumbers =
        new Set(
          schedule.map(
            (item) =>
              Number(
                item.round_number
              )
          )
        );

      const fromSchedule =
        schedule
          .filter((item) => {
            if (
              item.schedule_type ===
                'final_confirmed' ||
              item.schedule_type ===
                'final_provisional'
            ) {
              return false;
            }

            if (
              !item.registration_opens_at
            ) {
              return false;
            }

            const visibleFrom =
              getStartOfLocalDay(
                item.registration_opens_at
              );

            return (
              clock >= visibleFrom
            );
          })
          .map((item) => {
            const linkedRound =
              item.round_id
                ? roundById.get(
                    item.round_id
                  )
                : null;

            return {
              ...item,
              ...(linkedRound ||
                {}),
              schedule_id:
                item.id,
              id:
                linkedRound?.id ||
                item.round_id ||
                null,
              round_number:
                item.round_number,
              registration_opens_at:
                item.registration_opens_at,
              registration_closes_at:
                item.registration_closes_at,
              round_date:
                item.round_date,
              round_type:
                item.round_type,
              double_points:
                item.double_points,
              payment_code:
                item.payment_code
            };
          });

      const legacyRounds =
        rounds.filter(
          (round) =>
            !scheduledNumbers.has(
              Number(
                round.round_number
              )
            )
        );

      return [
        ...fromSchedule,
        ...legacyRounds
      ]
        .filter((round) => {
          if (
            !currentPlayer
          ) {
            return true;
          }

          const entry =
            round.id
              ? getEntry(
                  round.id
                )
              : null;

          const playerHasResult =
            hasPlayerResult(
              round.round_number
            );

          const roundHasResult =
            hasRoundResult(
              round.round_number
            );

          if (
            roundHasResult &&
            !entry &&
            !playerHasResult
          ) {
            return false;
          }

          return true;
        })
        .sort(
          (a, b) =>
            Number(
              a.round_number
            ) -
            Number(
              b.round_number
            )
        );
    }, [
      schedule,
      rounds,
      roundById,
      currentPlayer,
      roundEntries,
      roundResults,
      clock
    ]);

  const getRegistrationState = (
    round
  ) => {
    const opensAt =
      round.registration_opens_at
        ? new Date(
            round.registration_opens_at
          )
        : null;

    const closesAt =
      round.registration_closes_at
        ? new Date(
            round.registration_closes_at
          )
        : null;

    if (
      opensAt &&
      clock < opensAt
    ) {
      return 'not_open';
    }

    if (
      closesAt &&
      clock > closesAt
    ) {
      return 'closed';
    }

    if (!round.id) {
      return 'activating';
    }

    return 'open';
  };

  const isPaid = (round) =>
    Boolean(
      round.id &&
      roundPayments.some(
        (payment) =>
          payment.round_id ===
            round.id &&
          payment.player_id ===
            currentPlayer?.id
      )
    );

  const sharePaymentLink =
    async (
      paymentUrl,
      round
    ) => {
      if (!paymentUrl) return;

      const text =
        `Hier is mijn betaallink voor Ronde ${round.round_number} van de OPTSCH ranking:`;

      if (navigator.share) {
        await navigator.share({
          title:
            'OPTSCH betaallink',
          text,
          url: paymentUrl
        });
        return;
      }

      await navigator.clipboard.writeText(
        `${text}\n${paymentUrl}`
      );

      alert(
        'Betaallink gekopieerd.'
      );
    };

  const handleRegisterAndPay =
    async (
      round,
      paymentUrl
    ) => {
      if (!round.id) return;

      const success =
        await onRegisterRound(
          round
        );

      if (
        success &&
        paymentUrl
      ) {
        window.open(
          paymentUrl,
          '_blank',
          'noopener,noreferrer'
        );
      }
    };

  const handleRegisterAndShare =
    async (
      round,
      paymentUrl
    ) => {
      if (!round.id) return;

      const success =
        await onRegisterRound(
          round
        );

      if (
        success &&
        paymentUrl
      ) {
        await sharePaymentLink(
          paymentUrl,
          round
        );
      }
    };

  if (!currentPlayer) {
    return (
      <>
        <h2>
          Mijn rondes
        </h2>

        <div
          style={{
            color: '#ff8a80'
          }}
        >
          Je account is nog niet
          gekoppeld aan een speler.
        </div>
      </>
    );
  }

  return (
    <>
      <h2>
        Mijn rondes
      </h2>

      <div
        style={{
          color: '#aaa',
          marginBottom: 16
        }}
      >
        Toernooien worden vanaf
        00:00 op de dag dat de
        inschrijving opent zichtbaar.
        Je inschrijving is pas
        definitief na betaling.
      </div>

      <div
        style={{
          display: 'grid',
          gap: 12
        }}
      >
        {visibleItems.map(
          (round) => {
            const entry =
              round.id
                ? getEntry(
                    round.id
                  )
                : null;

            const paid =
              isPaid(round);

            const registrationState =
              getRegistrationState(
                round
              );

            const paymentUrl =
              round.id
                ? getRoundPaymentUrl?.(
                    round,
                    currentPlayer
                  )
                : null;

            const playerHasResult =
              hasPlayerResult(
                round.round_number
              );

            return (
              <div
                key={
                  round.schedule_id ||
                  round.id ||
                  round.round_number
                }
                style={{
                  background:
                    '#181818',
                  border:
                    registrationState ===
                    'open'
                      ? '1px solid rgba(76, 175, 80, 0.42)'
                      : '1px solid #333',
                  borderRadius:
                    10,
                  padding: 14
                }}
              >
                <h3
                  style={{
                    marginTop: 0
                  }}
                >
                  Ronde{' '}
                  {
                    round.round_number
                  }{' '}
                  /{' '}
                  {round.payment_code ||
                    `VR${round.round_number}`}

                  {round.round_type ===
                    'team_event' &&
                    ' · Team Event'}

                  {round.double_points &&
                    ' · x2'}
                </h3>

                <div
                  style={{
                    color: '#aaa',
                    marginBottom: 10,
                    lineHeight: 1.5
                  }}
                >
                  Speeldatum:{' '}
                  {formatDateTime(
                    round.round_date
                  )}
                  <br />
                  Inschrijving
                  opent:{' '}
                  {formatDateTime(
                    round.registration_opens_at
                  )}
                  <br />
                  Inschrijving
                  sluit:{' '}
                  {formatDateTime(
                    round.registration_closes_at
                  )}
                </div>

                {!entry &&
                  !playerHasResult &&
                  registrationState ===
                    'open' && (
                    <div
                      style={{
                        display:
                          'flex',
                        gap: 10,
                        flexWrap:
                          'wrap'
                      }}
                    >
                      <button
                        onClick={() =>
                          handleRegisterAndPay(
                            round,
                            paymentUrl
                          )
                        }
                      >
                        Inschrijven en
                        betalen
                      </button>

                      <button
                        onClick={() =>
                          handleRegisterAndShare(
                            round,
                            paymentUrl
                          )
                        }
                      >
                        Inschrijven en
                        betaallink delen
                      </button>
                    </div>
                  )}

                {!entry &&
                  !playerHasResult &&
                  registrationState ===
                    'not_open' && (
                    <div
                      style={{
                        color:
                          '#ffd740',
                        fontWeight:
                          800
                      }}
                    >
                      🕒 Inschrijving
                      opent vandaag om{' '}
                      {formatTime(
                        round.registration_opens_at
                      )}
                    </div>
                  )}

                {!entry &&
                  !playerHasResult &&
                  registrationState ===
                    'activating' && (
                    <div
                      style={{
                        color:
                          '#ffd740',
                        fontWeight:
                          800
                      }}
                    >
                      ⏳ Inschrijving
                      wordt geopend.
                    </div>
                  )}

                {!entry &&
                  !playerHasResult &&
                  registrationState ===
                    'closed' && (
                    <div
                      style={{
                        color:
                          '#ff8a80',
                        fontWeight:
                          800
                      }}
                    >
                      Inschrijving
                      gesloten.
                    </div>
                  )}

                {entry &&
                  !paid && (
                    <>
                      <div
                        style={{
                          color:
                            '#ffd740',
                          fontWeight:
                            800
                        }}
                      >
                        Inschrijving
                        gestart,
                        betaling nog
                        nodig.
                      </div>

                      <div
                        style={{
                          display:
                            'flex',
                          gap: 10,
                          flexWrap:
                            'wrap',
                          marginTop: 10
                        }}
                      >
                        <a
                          href={
                            paymentUrl
                          }
                          target="_blank"
                          rel="noreferrer"
                        >
                          Betaal{' '}
                          {formatEuro(
                            Number(
                              season?.buy_in
                            ) ||
                              7.5
                          )}
                        </a>

                        <button
                          onClick={() =>
                            sharePaymentLink(
                              paymentUrl,
                              round
                            )
                          }
                        >
                          Betaallink
                          delen
                        </button>
                      </div>
                    </>
                  )}

                {entry &&
                  paid &&
                  !playerHasResult && (
                    <div
                      style={{
                        color:
                          '#4caf50',
                        fontWeight:
                          800
                      }}
                    >
                      ✅ Inschrijving
                      definitief
                    </div>
                  )}

                {playerHasResult && (
                  <div
                    style={{
                      color:
                        '#4caf50',
                      fontWeight:
                        800
                    }}
                  >
                    🏁 Deelgenomen
                  </div>
                )}
              </div>
            );
          }
        )}

        {visibleItems.length ===
          0 && (
          <div
            style={{
              color: '#888'
            }}
          >
            Er zijn op dit moment
            geen rondes zichtbaar.
          </div>
        )}
      </div>
    </>
  );
}
