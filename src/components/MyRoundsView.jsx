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
  finaleRegistrations = [],
  getRoundPaymentUrl,
  onRegisterRound,
  onFinaleResponse,
  isFinaleQualified = false,
  finaleRankPosition = null
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

  const finaleScheduleItems =
    useMemo(
      () =>
        schedule.filter(
          (item) =>
            item.schedule_type ===
              'final_confirmed' ||
            item.schedule_type ===
              'final_provisional'
        ),
      [schedule]
    );

  const rankingScheduleItems =
    useMemo(
      () =>
        schedule.filter(
          (item) =>
            item.schedule_type !==
              'final_confirmed' &&
            item.schedule_type !==
              'final_provisional' &&
            Number.isFinite(
              Number(
                item.round_number
              )
            )
        ),
      [schedule]
    );

  const lastScheduledRoundNumber =
    useMemo(() => {
      if (
        rankingScheduleItems.length ===
        0
      ) {
        return null;
      }

      return Math.max(
        ...rankingScheduleItems.map(
          (item) =>
            Number(
              item.round_number
            )
        )
      );
    }, [rankingScheduleItems]);

  const lastRoundHasResult =
    Boolean(
      lastScheduledRoundNumber &&
      (
        roundResults[
          lastScheduledRoundNumber
        ] || []
      ).some(
        (result) =>
          result?.player_id
      )
    );

  const showFinaleInMyRounds =
    Boolean(
      isFinaleQualified &&
      lastRoundHasResult &&
      finaleScheduleItems.length > 0
    );

  const currentFinaleRegistration =
    finaleRegistrations.find(
      (item) =>
        item.player_id ===
        currentPlayer?.id
    ) || null;

  const getFinaleDeadline = (
    round
  ) => {
    if (
      Number(
        finaleRankPosition
      ) > 27
    ) {
      return round.waitlist_registration_deadline_at;
    }

    return round.finalist_registration_deadline_at;
  };

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
              return (
                showFinaleInMyRounds
              );
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

            const isFinale =
              item.schedule_type ===
                'final_confirmed' ||
              item.schedule_type ===
                'final_provisional';

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
                item.payment_code,
              is_finale: isFinale
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
            round.is_finale
          ) {
            return true;
          }

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
          (a, b) => {
            if (
              a.is_finale &&
              !b.is_finale
            ) {
              return 1;
            }

            if (
              !a.is_finale &&
              b.is_finale
            ) {
              return -1;
            }

            return (
              Number(
                a.round_number
              ) -
              Number(
                b.round_number
              )
            );
          }
        );
    }, [
      schedule,
      rounds,
      roundById,
      currentPlayer,
      roundEntries,
      roundResults,
      clock,
      showFinaleInMyRounds
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
        Na de laatste rankingronde zien
        gekwalificeerde spelers hier ook
        de finale. Je inschrijving voor
        rankingrondes is pas definitief
        na betaling.
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
              round.is_finale
                ? false
                : hasPlayerResult(
                    round.round_number
                  );

            const isFinale =
              Boolean(
                round.is_finale
              );

            const finaleDeadline =
              isFinale
                ? getFinaleDeadline(
                    round
                  )
                : null;

            const finaleDeadlinePassed =
              Boolean(
                finaleDeadline &&
                clock >
                  new Date(
                    finaleDeadline
                  )
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
                    isFinale
                      ? '1px solid rgba(255, 215, 64, 0.55)'
                      : registrationState ===
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
                  {isFinale ? (
                    <>
                      🏆 FINALE
                    </>
                  ) : (
                    <>
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
                    </>
                  )}
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

                  {!isFinale && (
                    <>
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
                    </>
                  )}
                </div>

                {isFinale && (
                  <div>
                    <div
                      style={{
                        color:
                          round.schedule_type ===
                          'final_confirmed'
                            ? '#4caf50'
                            : '#ffd740',
                        fontWeight: 900
                      }}
                    >
                      {Number(
                        finaleRankPosition
                      ) > 27
                        ? '⭐ Je bent doorgeschoven vanaf de wachtlijst'
                        : round.schedule_type ===
                            'final_confirmed'
                          ? '🏆 Je bent gekwalificeerd voor de finale'
                          : '🕒 Je bent gekwalificeerd – finale onder voorbehoud'}
                    </div>

                    <div
                      style={{
                        color: '#aaa',
                        marginTop: 8
                      }}
                    >
                      Aanmelddeadline:{' '}
                      {formatDateTime(
                        finaleDeadline
                      )}
                    </div>

                    {currentFinaleRegistration?.status ===
                    'confirmed' ? (
                      <div
                        style={{
                          marginTop: 10
                        }}
                      >
                        <div
                          style={{
                            color:
                              '#4caf50',
                            fontWeight:
                              900
                          }}
                        >
                          ✅ Aangemeld voor de finale
                        </div>

                        {!finaleDeadlinePassed && (
                          <button
                            type="button"
                            onClick={() =>
                              onFinaleResponse?.(
                                'declined'
                              )
                            }
                            style={{
                              marginTop: 10,
                              color:
                                '#ff8a80'
                            }}
                          >
                            Toch afmelden
                          </button>
                        )}
                      </div>
                    ) : finaleDeadlinePassed ? (
                      <div
                        style={{
                          marginTop: 12,
                          color:
                            '#ff8a80',
                          fontWeight: 800
                        }}
                      >
                        De aanmelddeadline is
                        verstreken. Een admin
                        kan je nog handmatig
                        toelaten als er plaats
                        beschikbaar is.
                      </div>
                    ) : (
                      <div
                        style={{
                          marginTop: 12
                        }}
                      >
                        <div
                          style={{
                            color:
                              '#aaa',
                            marginBottom:
                              10
                          }}
                        >
                          Laat weten of je
                          meespeelt. Pas na
                          je bevestiging
                          staat je deelname
                          vast.
                        </div>

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
                            type="button"
                            onClick={() =>
                              onFinaleResponse?.(
                                'confirmed'
                              )
                            }
                          >
                            ✅ Aanmelden voor finale
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              onFinaleResponse?.(
                                'declined'
                              )
                            }
                            style={{
                              color:
                                '#ff8a80'
                            }}
                          >
                            ❌ Ik kan niet
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {!isFinale &&
                  !entry &&
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

                {!isFinale &&
                  !entry &&
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

                {!isFinale &&
                  !entry &&
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

                {!isFinale &&
                  !entry &&
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

                {!isFinale &&
                  entry &&
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

                {!isFinale &&
                  entry &&
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

                {!isFinale &&
                  playerHasResult && (
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
