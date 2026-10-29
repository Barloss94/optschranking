import {
  useEffect,
  useState
} from 'react';
import html2canvas from 'html2canvas';

import {
  MAX_FINALISTS
} from '../constants/rankingConstants';
import { supabase } from '../lib/supabaseClient';

export default function FinalistsView({
  finalStackList,
  baseFinalists,
  reservePool,
  availableReserves,
  nextUp,
  declinedFinalists,
  finaleRegistrations = [],
  finaleQualifications = [],
  season,
  rounds = [],
  rankingResults = {},
  isAdmin,
  finaleLocked,
  onDeclineFinalist,
  onUndoDecline,
  onSetFinaleResponseAdmin
}) {
  const [
    plannedLastRoundNumber,
    setPlannedLastRoundNumber
  ] = useState(null);

  const [
    scheduleLoaded,
    setScheduleLoaded
  ] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadPlannedLastRound =
      async () => {
        if (!season?.id) {
          if (!cancelled) {
            setPlannedLastRoundNumber(
              null
            );
            setScheduleLoaded(true);
          }
          return;
        }

        const { data, error } =
          await supabase
            .from(
              'tournament_schedule'
            )
            .select(
              'round_number,schedule_type'
            )
            .eq(
              'season_id',
              season.id
            );

        if (cancelled) {
          return;
        }

        if (error) {
          console.error(
            'Laatste geplande voorronde laden mislukt:',
            error
          );
          setPlannedLastRoundNumber(
            null
          );
          setScheduleLoaded(true);
          return;
        }

        const roundNumbers =
          (data || [])
            .filter(
              (item) =>
                item.round_number !==
                  null &&
                item.round_number !==
                  undefined &&
                item.schedule_type !==
                  'final_confirmed' &&
                item.schedule_type !==
                  'final_provisional'
            )
            .map(
              (item) =>
                Number(
                  item.round_number
                )
            )
            .filter(
              (value) =>
                Number.isInteger(
                  value
                ) &&
                value > 0
            );

        setPlannedLastRoundNumber(
          roundNumbers.length > 0
            ? Math.max(
                ...roundNumbers
              )
            : null
        );

        setScheduleLoaded(true);
      };

    setScheduleLoaded(false);
    loadPlannedLastRound();

    return () => {
      cancelled = true;
    };
  }, [season?.id]);

  const declinedIds =
    declinedFinalists.map(
      (item) =>
        item.player_id
    );

  const finaleRegistrationStarted =
    finaleQualifications.length > 0;

  const getRegistration = (
    playerId
  ) =>
    finaleRegistrations.find(
      (item) =>
        item.player_id ===
        playerId
    ) || null;

  const getFinaleStatus = (
    playerId
  ) => {
    if (!finaleRegistrationStarted) {
      return null;
    }

    const registration =
      getRegistration(
        playerId
      );

    if (
      registration?.status ===
      'confirmed'
    ) {
      return {
        label:
          registration.source ===
          'admin'
            ? '✅ Aangemeld door admin'
            : '✅ Aangemeld',
        color: '#4caf50'
      };
    }

    if (
      registration?.status ===
      'declined'
    ) {
      if (
        registration.source ===
        'automatic'
      ) {
        return {
          label:
            '⏰ Deadline gemist',
          color: '#ff8a80'
        };
      }

      return {
        label: '❌ Afgemeld',
        color: '#ff8a80'
      };
    }

    return {
      label: '⏳ Reactie nodig',
      color: '#ffd740'
    };
  };

  const activeFinalistIds =
    new Set(
      finalStackList.map(
        (player) =>
          player.id
      )
    );

  const lateOrDeclinedBase =
    baseFinalists.filter(
      (player) =>
        declinedIds.includes(
          player.id
        )
    );

  const highestActivatedRoundNumber =
    rounds.length > 0
      ? Math.max(
          ...rounds.map(
            (round) =>
              Number(
                round.round_number
              ) || 0
          )
        )
      : 0;

  const expectedLastRoundNumber =
    plannedLastRoundNumber ??
    highestActivatedRoundNumber;

  const lastRound =
    rounds.find(
      (round) =>
        Number(
          round.round_number
        ) ===
        Number(
          expectedLastRoundNumber
        )
    ) || null;

  const lastRoundResults =
    lastRound
      ? rankingResults[
          lastRound.round_number
        ] || []
      : [];

  const lastRoundPlayerCount =
    Number(
      lastRound?.player_count
    ) || 0;

  const lastRoundCompleted =
    scheduleLoaded &&
    Boolean(
      expectedLastRoundNumber
    ) &&
    Boolean(lastRound) &&
    lastRoundPlayerCount > 0 &&
    lastRoundResults.filter(
      Boolean
    ).length >=
      lastRoundPlayerCount;

  const isProvisional =
    !lastRoundCompleted;

  const exportFinalistsImage =
    async () => {
      const element =
        document.getElementById(
          'finalists-export'
        );

      if (!element) {
        return;
      }

      try {
        const canvas =
          await html2canvas(
            element,
            {
              backgroundColor:
                '#070908',
              scale: 2,
              useCORS: true,
              logging: false
            }
          );

        const link =
          document.createElement(
            'a'
          );

        link.href =
          canvas.toDataURL(
            'image/png'
          );

        link.download =
          'optsch-finalisten-waitlist.png';

        link.click();
      } catch (error) {
        console.error(
          'Finalistenoverzicht exporteren mislukt:',
          error
        );

        alert(
          'De afbeelding kon niet worden gemaakt.'
        );
      }
    };

  return (
    <>
      <div
        style={{
          display: 'flex',
          justifyContent:
            'space-between',
          alignItems: 'center',
          gap: 12,
          flexWrap: 'wrap',
          marginBottom: 14
        }}
      >
        <h2
          style={{
            margin: 0
          }}
        >
          Finalisten / Waitlist
        </h2>

        <button
          type="button"
          onClick={
            exportFinalistsImage
          }
        >
          📸 Download overzicht
        </button>
      </div>

      <div
        id="finalists-export"
        style={{
          position: 'fixed',
          left: '-12000px',
          top: 0,
          width: 1200,
          padding: 44,
          boxSizing:
            'border-box',
          background:
            'linear-gradient(145deg, #132019, #070908)',
          color: '#fff',
          fontFamily:
            'Arial, Helvetica, sans-serif'
        }}
      >
        <div
          style={{
            border:
              '1px solid rgba(212, 175, 87, 0.35)',
            borderRadius: 20,
            padding: 30,
            background:
              'rgba(7, 9, 8, 0.72)',
            boxShadow:
              '0 20px 50px rgba(0,0,0,0.35)'
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent:
                'space-between',
              alignItems:
                'flex-start',
              gap: 24,
              marginBottom: 24
            }}
          >
            <div>
              <div
                style={{
                  color: '#d4af57',
                  fontSize: 14,
                  fontWeight: 900,
                  letterSpacing: 2,
                  textTransform:
                    'uppercase',
                  marginBottom: 8
                }}
              >
                OPTSCH Ranking
              </div>

              <div
                style={{
                  fontSize: 34,
                  fontWeight: 900,
                  lineHeight: 1.1
                }}
              >
                Finalisten & Waitlist
              </div>
            </div>

            <div
              style={{
                padding:
                  '10px 14px',
                borderRadius: 999,
                background:
                  isProvisional
                    ? 'rgba(255, 193, 7, 0.16)'
                    : 'rgba(76, 175, 80, 0.16)',
                border:
                  isProvisional
                    ? '1px solid rgba(255, 215, 64, 0.55)'
                    : '1px solid rgba(76, 175, 80, 0.55)',
                color:
                  isProvisional
                    ? '#ffd740'
                    : '#81c784',
                fontWeight: 900,
                fontSize: 15,
                whiteSpace:
                  'nowrap'
              }}
            >
              {isProvisional
                ? '⚠ VOORLOPIGE STACKS'
                : '✓ DEFINITIEVE STACKS'}
            </div>
          </div>

          {isProvisional && (
            <div
              style={{
                padding: 14,
                marginBottom: 24,
                borderRadius: 10,
                background:
                  'rgba(255, 193, 7, 0.10)',
                border:
                  '1px solid rgba(255, 215, 64, 0.32)',
                color: '#ffe082',
                fontWeight: 800,
                lineHeight: 1.45
              }}
            >
              De laatste voorronde is nog
              niet gespeeld, de finalisten
              en stacks in dit overzicht
              zijn daarom VOORLOPIG en
              kunnen nog wijzigen.
            </div>
          )}

          <div
            style={{
              display: 'grid',
              gridTemplateColumns:
                '1.7fr 1fr',
              gap: 24
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 20,
                  fontWeight: 900,
                  marginBottom: 12,
                  color: '#ffd740'
                }}
              >
                🏆 Finalisten
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns:
                    'repeat(2, minmax(0, 1fr))',
                  gap: 8
                }}
              >
                {finalStackList.map(
                  (player, idx) => {
                    const wasReplacement =
                      !baseFinalists.some(
                        (item) =>
                          item.id ===
                          player.id
                      );

                    return (
                      <div
                        key={
                          player.id
                        }
                        style={{
                          padding:
                            '10px 12px',
                          borderRadius: 10,
                          background:
                            '#181818',
                          border:
                            wasReplacement
                              ? '1px solid rgba(255, 215, 64, 0.42)'
                              : '1px solid #2a2a2a'
                        }}
                      >
                        <div
                          style={{
                            display:
                              'flex',
                            justifyContent:
                              'space-between',
                            alignItems:
                              'baseline',
                            gap: 8
                          }}
                        >
                          <div
                            style={{
                              minWidth: 0
                            }}
                          >
                            <strong>
                              #{idx + 1}{' '}
                              {
                                player.displayName
                              }
                            </strong>

                            {wasReplacement && (
                              <div
                                style={{
                                  color:
                                    '#ffd54f',
                                  fontSize: 11,
                                  fontWeight:
                                    800,
                                  marginTop: 2
                                }}
                              >
                                doorgeschoven
                              </div>
                            )}
                          </div>

                          <strong
                            style={{
                              color:
                                '#ffd740',
                              whiteSpace:
                                'nowrap'
                            }}
                          >
                            {player.finalStack.toLocaleString(
                              'nl-NL'
                            )}
                          </strong>
                        </div>

                        <div
                          style={{
                            color: '#999',
                            fontSize: 11,
                            marginTop: 3
                          }}
                        >
                          {
                            player.totalPoints
                          } pt
                        </div>
                      </div>
                    );
                  }
                )}
              </div>
            </div>

            <div>
              <div
                style={{
                  fontSize: 20,
                  fontWeight: 900,
                  marginBottom: 12,
                  color: '#ff8a80'
                }}
              >
                ❌ Afgemeld
              </div>

              <div
                style={{
                  display: 'grid',
                  gap: 8,
                  marginBottom: 24
                }}
              >
                {lateOrDeclinedBase.length ===
                0 ? (
                  <div
                    style={{
                      color: '#888',
                      padding: 10,
                      background:
                        '#181818',
                      borderRadius: 8
                    }}
                  >
                    Geen afmeldingen.
                  </div>
                ) : (
                  lateOrDeclinedBase.map(
                    (player) => (
                      <div
                        key={
                          player.id
                        }
                        style={{
                          padding:
                            '9px 11px',
                          background:
                            '#181818',
                          borderRadius: 8,
                          border:
                            '1px solid rgba(255, 138, 128, 0.25)'
                        }}
                      >
                        <strong>
                          {
                            player.displayName
                          }
                        </strong>
                        <span
                          style={{
                            color:
                              '#999',
                            marginLeft: 8,
                            fontSize: 12
                          }}
                        >
                          {
                            player.totalPoints
                          } pt
                        </span>
                      </div>
                    )
                  )
                )}
              </div>

              <div
                style={{
                  fontSize: 20,
                  fontWeight: 900,
                  marginBottom: 12,
                  color: '#ffd740'
                }}
              >
                🟡 Waitlist
              </div>

              <div
                style={{
                  display: 'grid',
                  gap: 8
                }}
              >
                {reservePool.length ===
                0 ? (
                  <div
                    style={{
                      color: '#888',
                      padding: 10,
                      background:
                        '#181818',
                      borderRadius: 8
                    }}
                  >
                    Geen waitlist spelers.
                  </div>
                ) : (
                  reservePool.map(
                    (player, idx) => {
                      const promoted =
                        activeFinalistIds.has(
                          player.id
                        );

                      const declined =
                        declinedIds.includes(
                          player.id
                        );

                      return (
                        <div
                          key={
                            player.id
                          }
                          style={{
                            padding:
                              '9px 11px',
                            background:
                              '#181818',
                            borderRadius: 8,
                            border:
                              promoted
                                ? '1px solid rgba(76, 175, 80, 0.38)'
                                : '1px solid #2a2a2a',
                            opacity:
                              declined
                                ? 0.6
                                : 1
                          }}
                        >
                          <strong>
                            #
                            {MAX_FINALISTS +
                              idx +
                              1}{' '}
                            {
                              player.displayName
                            }
                          </strong>

                          {promoted && (
                            <span
                              style={{
                                color:
                                  '#81c784',
                                marginLeft:
                                  7,
                                fontSize: 11,
                                fontWeight:
                                  900
                              }}
                            >
                              DOORGESCHOVEN
                            </span>
                          )}

                          {declined && (
                            <span
                              style={{
                                color:
                                  '#ff8a80',
                                marginLeft:
                                  7,
                                fontSize: 11,
                                fontWeight:
                                  900
                              }}
                            >
                              AFGEMELD
                            </span>
                          )}
                        </div>
                      );
                    }
                  )
                )}
              </div>
            </div>
          </div>

          <div
            style={{
              marginTop: 24,
              paddingTop: 14,
              borderTop:
                '1px solid rgba(255,255,255,0.10)',
              color: '#777',
              fontSize: 11,
              display: 'flex',
              justifyContent:
                'space-between',
              gap: 16
            }}
          >
            <span>
              Totale finalestack:
              1.350.000 · Basis:
              20.000 per finalist
            </span>

            <span>
              Waitlist blijft gekoppeld
              aan rankingposities 28 t/m
              32.
            </span>
          </div>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns:
            'repeat(auto-fit, minmax(320px, 1fr))',
          gap: 20
        }}
      >
        <div>
          <h3>
            🏆 Finalisten (
            {finalStackList.length}/
            {MAX_FINALISTS})
          </h3>

          <div
            style={{
              color: '#aaa',
              fontSize: 12,
              marginBottom: 10
            }}
          >
            Totale stack: 1.350.000 ·
            Basis: 20.000 per finalist ·
            Rest op rankingpunten
          </div>

          <div
            style={{
              display: 'grid',
              gap: 8
            }}
          >
            {finalStackList.map(
              (player, idx) => {
                const wasReplacement =
                  !baseFinalists.some(
                    (item) =>
                      item.id ===
                      player.id
                  );

                const status =
                  getFinaleStatus(
                    player.id
                  );

                return (
                  <div
                    key={player.id}
                    style={{
                      background:
                        '#181818',
                      border:
                        wasReplacement
                          ? '1px solid rgba(255, 215, 64, 0.35)'
                          : '1px solid #2a2a2a',
                      padding: 10,
                      borderRadius: 8
                    }}
                  >
                    <div
                      style={{
                        display:
                          'flex',
                        justifyContent:
                          'space-between',
                        gap: 10,
                        flexWrap:
                          'wrap'
                      }}
                    >
                      <div>
                        <strong>
                          #{idx + 1}{' '}
                          {
                            player.displayName
                          }
                        </strong>

                        {wasReplacement && (
                          <span
                            style={{
                              color:
                                '#ffd54f',
                              marginLeft:
                                6
                            }}
                          >
                            (doorgeschoven)
                          </span>
                        )}
                      </div>

                      {status && (
                        <div
                          style={{
                            color:
                              status.color,
                            fontWeight:
                              800,
                            fontSize: 13
                          }}
                        >
                          {
                            status.label
                          }
                        </div>
                      )}
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        gap: 14,
                        flexWrap:
                          'wrap',
                        marginTop: 7,
                        color: '#aaa'
                      }}
                    >
                      <span>
                        {
                          player.totalPoints
                        } pt
                      </span>

                      <span
                        style={{
                          color:
                            '#ffd740',
                          fontWeight:
                            900
                        }}
                      >
                        Stack:{' '}
                        {player.finalStack.toLocaleString(
                          'nl-NL'
                        )}
                      </span>
                    </div>

                    {isAdmin &&
                      finaleRegistrationStarted &&
                      !finaleLocked && (
                        <div
                          style={{
                            display:
                              'flex',
                            gap: 8,
                            flexWrap:
                              'wrap',
                            marginTop: 10
                          }}
                        >
                          {getRegistration(
                            player.id
                          )?.status !==
                            'confirmed' && (
                            <button
                              type="button"
                              onClick={() =>
                                onSetFinaleResponseAdmin?.(
                                  player,
                                  'confirmed'
                                )
                              }
                            >
                              ✅ Bevestigen
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => {
                              if (
                                onSetFinaleResponseAdmin
                              ) {
                                onSetFinaleResponseAdmin(
                                  player,
                                  'declined'
                                );
                                return;
                              }

                              onDeclineFinalist?.(
                                player
                              );
                            }}
                            style={{
                              color:
                                '#ff8a80'
                            }}
                          >
                            ❌ Afmelden
                          </button>
                        </div>
                      )}
                  </div>
                );
              }
            )}
          </div>

          {isAdmin &&
            finaleRegistrationStarted &&
            lateOrDeclinedBase.length >
              0 && (
              <div
                style={{
                  marginTop: 18,
                  padding: 12,
                  background:
                    '#181818',
                  border:
                    '1px solid rgba(255, 138, 128, 0.35)',
                  borderRadius: 8
                }}
              >
                <div
                  style={{
                    fontWeight: 900,
                    marginBottom: 8
                  }}
                >
                  ⏰ Afgemelde / te late
                  gekwalificeerden
                </div>

                <div
                  style={{
                    color: '#aaa',
                    fontSize: 13,
                    marginBottom: 10
                  }}
                >
                  Deze spelers kunnen door
                  een admin alsnog worden
                  toegelaten. Als er nog
                  ruimte is, schuiven zij
                  weer terug de finalelijst
                  in.
                </div>

                <div
                  style={{
                    display: 'grid',
                    gap: 8
                  }}
                >
                  {lateOrDeclinedBase.map(
                    (player) => {
                      const status =
                        getFinaleStatus(
                          player.id
                        );

                      return (
                        <div
                          key={
                            player.id
                          }
                          style={{
                            display:
                              'flex',
                            justifyContent:
                              'space-between',
                            gap: 10,
                            alignItems:
                              'center',
                            flexWrap:
                              'wrap'
                          }}
                        >
                          <div>
                            <strong>
                              {
                                player.displayName
                              }
                            </strong>
                            <span
                              style={{
                                color:
                                  status.color,
                                marginLeft:
                                  8,
                                fontSize:
                                  13
                              }}
                            >
                              {
                                status.label
                              }
                            </span>
                          </div>

                          <button
                            type="button"
                            disabled={
                              finaleLocked
                            }
                            onClick={() =>
                              onSetFinaleResponseAdmin?.(
                                player,
                                'confirmed'
                              )
                            }
                          >
                            ✅ Alsnog toelaten
                          </button>
                        </div>
                      );
                    }
                  )}
                </div>
              </div>
            )}
        </div>

        <div>
          <h3>
            🟡 Waitlist (28 t/m 32)
          </h3>

          <div
            style={{
              display: 'grid',
              gap: 8
            }}
          >
            {reservePool.length ===
              0 && (
              <div
                style={{
                  color: '#888'
                }}
              >
                Geen waitlist spelers.
              </div>
            )}

            {reservePool.map(
              (player, idx) => {
                const declined =
                  declinedIds.includes(
                    player.id
                  );

                const isAvailable =
                  availableReserves.some(
                    (item) =>
                      item.id ===
                      player.id
                  );

                const isNext =
                  nextUp?.id ===
                  player.id;

                const promoted =
                  activeFinalistIds.has(
                    player.id
                  );

                const status =
                  getFinaleStatus(
                    player.id
                  );

                return (
                  <div
                    key={player.id}
                    style={{
                      background:
                        isNext
                          ? 'rgba(255,215,64,0.18)'
                          : '#181818',
                      border:
                        promoted
                          ? '1px solid rgba(76, 175, 80, 0.42)'
                          : isNext
                            ? '1px solid #ffd740'
                            : '1px solid transparent',
                      padding: 10,
                      borderRadius: 8,
                      opacity:
                        declined
                          ? 0.65
                          : 1
                    }}
                  >
                    <div
                      style={{
                        display:
                          'flex',
                        justifyContent:
                          'space-between',
                        gap: 8,
                        flexWrap:
                          'wrap'
                      }}
                    >
                      <div>
                        <strong>
                          #
                          {MAX_FINALISTS +
                            idx +
                            1}{' '}
                          {
                            player.displayName
                          }
                        </strong>

                        {promoted && (
                          <span
                            style={{
                              color:
                                '#4caf50',
                              marginLeft:
                                7,
                              fontWeight:
                                800
                            }}
                          >
                            ⭐ Doorgeschoven
                          </span>
                        )}

                        {!promoted &&
                          isNext && (
                          <span
                            style={{
                              color:
                                '#ffd740',
                              marginLeft:
                                7,
                              fontWeight:
                                800
                            }}
                          >
                            NEXT UP
                          </span>
                        )}

                        {!promoted &&
                          !isNext &&
                          isAvailable && (
                          <span
                            style={{
                              color:
                                '#bbb',
                              marginLeft:
                                7
                            }}
                          >
                            Beschikbaar
                          </span>
                        )}
                      </div>

                      {status && (
                        <div
                          style={{
                            color:
                              status.color,
                            fontSize: 13,
                            fontWeight:
                              800
                          }}
                        >
                          {
                            status.label
                          }
                        </div>
                      )}
                    </div>

                    {isAdmin &&
                      finaleRegistrationStarted &&
                      !finaleLocked && (
                        <div
                          style={{
                            display:
                              'flex',
                            gap: 8,
                            flexWrap:
                              'wrap',
                            marginTop: 9
                          }}
                        >
                          {promoted && (
                            <button
                              type="button"
                              onClick={() =>
                                onSetFinaleResponseAdmin?.(
                                  player,
                                  'confirmed'
                                )
                              }
                            >
                              ✅ Bevestigen
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() =>
                              onSetFinaleResponseAdmin?.(
                                player,
                                'declined'
                              )
                            }
                            style={{
                              color:
                                '#ff8a80'
                            }}
                          >
                            ❌ Afmelden
                          </button>
                        </div>
                      )}
                  </div>
                );
              }
            )}
          </div>

          {isAdmin && (
            <div
              style={{
                marginTop: 20,
                padding: 12,
                background:
                  '#181818',
                borderRadius: 8
              }}
            >
              <div
                style={{
                  fontWeight: 800,
                  marginBottom: 6
                }}
              >
                Undo afmelding
              </div>

              <div
                style={{
                  color: '#aaa',
                  marginBottom: 10
                }}
              >
                Laatste afmelding
                ongedaan maken.
              </div>

              <button
                onClick={
                  onUndoDecline
                }
                disabled={
                  finaleLocked
                }
              >
                ↩️ Undo
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
