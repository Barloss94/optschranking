import {
  MAX_FINALISTS
} from '../constants/rankingConstants';

export default function FinalistsView({
  finalStackList,
  baseFinalists,
  reservePool,
  availableReserves,
  nextUp,
  declinedFinalists,
  finaleRegistrations = [],
  finaleQualifications = [],
  isAdmin,
  finaleLocked,
  onDeclineFinalist,
  onUndoDecline,
  onSetFinaleResponseAdmin
}) {
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

  return (
    <>
      <h2>
        Finalisten / Waitlist
      </h2>

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
