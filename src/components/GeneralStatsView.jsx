import { useMemo } from 'react';

const MIN_AVERAGE_ROUNDS = 10;

function formatAverage(value) {
  return Number(value || 0).toLocaleString(
    'nl-NL',
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }
  );
}

export default function GeneralStatsView({
  ranking,
  rounds,
  rankingResults,
  teamEventPlayers
}) {
  const stats = useMemo(() => {
    const playedRounds = rounds.filter(
      (round) => {
        const results =
          rankingResults[
            round.round_number
          ] || [];

        return results.some(
          (result) =>
            result?.player_id
        );
      }
    );

    const totalPlayedTournaments =
      playedRounds.length;

    const participantCounts =
      playedRounds.map((round) => {
        if (
          round.round_type ===
          'team_event'
        ) {
          return teamEventPlayers.filter(
            (player) =>
              player.round_id ===
                round.id &&
              player.finish_position !==
                null &&
              player.finish_position !==
                undefined
          ).length;
        }

        return (
          Number(
            round.player_count
          ) || 0
        );
      });

    const totalParticipants =
      participantCounts.reduce(
        (sum, count) =>
          sum + count,
        0
      );

    const averageParticipants =
      totalPlayedTournaments > 0
        ? totalParticipants /
          totalPlayedTournaments
        : 0;

    let highestPoints = 0;
    let highestPointResults = [];

    ranking.forEach((player) => {
      player.roundDetails.forEach(
        (detail, index) => {
          if (!detail.hasData) {
            return;
          }

          if (
            detail.points >
            highestPoints
          ) {
            highestPoints =
              detail.points;

            highestPointResults = [
              {
                playerId:
                  player.id,
                playerName:
                  player.displayName,
                points:
                  detail.points,
                roundNumber:
                  rounds[index]
                    ?.round_number
              }
            ];

            return;
          }

          if (
            detail.points ===
              highestPoints &&
            detail.points > 0
          ) {
            highestPointResults.push(
              {
                playerId:
                  player.id,
                playerName:
                  player.displayName,
                points:
                  detail.points,
                roundNumber:
                  rounds[index]
                    ?.round_number
              }
            );
          }
        }
      );
    });

    const winsByPlayer =
      ranking
        .map((player) => ({
          playerId: player.id,
          playerName:
            player.displayName,
          wins:
            player.roundDetails.filter(
              (detail) =>
                detail.hasData &&
                detail.pos === 1
            ).length
        }))
        .filter(
          (player) =>
            player.wins > 0
        )
        .sort((a, b) => {
          if (
            b.wins !== a.wins
          ) {
            return (
              b.wins - a.wins
            );
          }

          return a.playerName.localeCompare(
            b.playerName,
            'nl'
          );
        });

    let topWins = [];

    if (winsByPlayer.length > 0) {
      const cutoffIndex =
        Math.min(
          4,
          winsByPlayer.length - 1
        );

      const cutoffWins =
        winsByPlayer[
          cutoffIndex
        ].wins;

      topWins =
        winsByPlayer.filter(
          (player) =>
            player.wins >=
            cutoffWins
        );
    }

    const eligiblePlayers =
      ranking.filter(
        (player) =>
          player.playedRounds >=
          MIN_AVERAGE_ROUNDS
      );

    const averages =
      eligiblePlayers.map(
        (player) => {
          const allPlayedDetails =
            player.roundDetails.filter(
              (detail) =>
                detail.hasData
            );

          const countedDetails =
            player.roundDetails.filter(
              (detail) =>
                detail.isCounted
            );

          const allPoints =
            allPlayedDetails.reduce(
              (sum, detail) =>
                sum +
                Number(
                  detail.points || 0
                ),
              0
            );

          const countedPoints =
            countedDetails.reduce(
              (sum, detail) =>
                sum +
                Number(
                  detail.points || 0
                ),
              0
            );

          return {
            playerId: player.id,
            playerName:
              player.displayName,
            playedRounds:
              allPlayedDetails.length,
            allPoints,
            averageAll:
              allPlayedDetails.length >
              0
                ? allPoints /
                  allPlayedDetails.length
                : 0,
            countedRounds:
              countedDetails.length,
            countedPoints,
            averageCounted:
              countedDetails.length >
              0
                ? countedPoints /
                  countedDetails.length
                : 0
          };
        }
      );

    const highestAllAverage =
      averages.length > 0
        ? Math.max(
            ...averages.map(
              (player) =>
                player.averageAll
            )
          )
        : 0;

    const bestAverageAll =
      averages
        .filter(
          (player) =>
            Math.abs(
              player.averageAll -
                highestAllAverage
            ) < 0.0000001
        )
        .sort((a, b) =>
          a.playerName.localeCompare(
            b.playerName,
            'nl'
          )
        );

    const highestCountedAverage =
      averages.length > 0
        ? Math.max(
            ...averages.map(
              (player) =>
                player.averageCounted
            )
          )
        : 0;

    const bestAverageCounted =
      averages
        .filter(
          (player) =>
            Math.abs(
              player.averageCounted -
                highestCountedAverage
            ) < 0.0000001
        )
        .sort((a, b) =>
          a.playerName.localeCompare(
            b.playerName,
            'nl'
          )
        );

    return {
      totalPlayedTournaments,
      averageParticipants,
      highestPoints,
      highestPointResults,
      topWins,
      bestAverageAll,
      bestAverageCounted
    };
  }, [
    ranking,
    rounds,
    rankingResults,
    teamEventPlayers
  ]);

  const cardStyle = {
    background: '#181818',
    border: '1px solid #333',
    borderRadius: 12,
    padding: 16
  };

  const labelStyle = {
    color: '#aaa',
    fontSize: 13,
    marginBottom: 6
  };

  const valueStyle = {
    fontSize: 30,
    fontWeight: 900,
    color: '#ffd740'
  };

  const tableStyle = {
    width: '100%',
    borderCollapse: 'collapse'
  };

  const thStyle = {
    textAlign: 'left',
    padding: '10px 8px',
    borderBottom:
      '1px solid #333',
    color: '#aaa',
    fontSize: 13
  };

  const tdStyle = {
    padding: '10px 8px',
    borderBottom:
      '1px solid #2a2a2a'
  };

  return (
    <>
      <h2>
        Algemene statistieken
      </h2>

      <div
        style={{
          color: '#aaa',
          marginBottom: 18
        }}
      >
        Statistieken over alle
        gespeelde rankingtoernooien
        van het huidige seizoen.
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns:
            'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 12,
          marginBottom: 18
        }}
      >
        <div style={cardStyle}>
          <div style={labelStyle}>
            Totaal gespeelde
            toernooien
          </div>

          <div style={valueStyle}>
            {
              stats.totalPlayedTournaments
            }
          </div>
        </div>

        <div style={cardStyle}>
          <div style={labelStyle}>
            Gemiddeld aantal
            deelnemers
          </div>

          <div style={valueStyle}>
            {formatAverage(
              stats.averageParticipants
            )}
          </div>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gap: 12
        }}
      >
        <div style={cardStyle}>
          <h3
            style={{
              marginTop: 0
            }}
          >
            Hoogste score in één
            toernooi
          </h3>

          {stats.highestPointResults
            .length === 0 ? (
            <div
              style={{
                color: '#888'
              }}
            >
              Nog geen uitslagen
              beschikbaar.
            </div>
          ) : (
            <>
              <div
                style={{
                  fontSize: 28,
                  fontWeight: 900,
                  color: '#ffd740',
                  marginBottom: 10
                }}
              >
                {
                  stats.highestPoints
                }{' '}
                punten
              </div>

              <div
                style={{
                  display: 'grid',
                  gap: 6
                }}
              >
                {stats.highestPointResults.map(
                  (
                    result,
                    index
                  ) => (
                    <div
                      key={`${result.playerId}-${result.roundNumber}-${index}`}
                    >
                      <strong>
                        {
                          result.playerName
                        }
                      </strong>
                      {' · '}
                      Ronde{' '}
                      {
                        result.roundNumber
                      }
                    </div>
                  )
                )}
              </div>
            </>
          )}
        </div>

        <div style={cardStyle}>
          <h3
            style={{
              marginTop: 0
            }}
          >
            Meeste overwinningen
          </h3>

          <div
            style={{
              color: '#aaa',
              marginBottom: 10,
              fontSize: 13
            }}
          >
            Top 5 op basis van
            aantal zeges. Bij een
            gelijke stand op de
            vijfde plek worden alle
            gelijkstaande spelers
            getoond.
          </div>

          {stats.topWins.length ===
          0 ? (
            <div
              style={{
                color: '#888'
              }}
            >
              Nog geen overwinningen
              beschikbaar.
            </div>
          ) : (
            <div
              style={{
                overflowX: 'auto'
              }}
            >
              <table
                style={tableStyle}
              >
                <thead>
                  <tr>
                    <th
                      style={thStyle}
                    >
                      Speler
                    </th>

                    <th
                      style={{
                        ...thStyle,
                        textAlign:
                          'right'
                      }}
                    >
                      Overwinningen
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {stats.topWins.map(
                    (player) => (
                      <tr
                        key={
                          player.playerId
                        }
                      >
                        <td
                          style={
                            tdStyle
                          }
                        >
                          {
                            player.playerName
                          }
                        </td>

                        <td
                          style={{
                            ...tdStyle,
                            textAlign:
                              'right',
                            fontWeight:
                              800
                          }}
                        >
                          {
                            player.wins
                          }
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div style={cardStyle}>
          <h3
            style={{
              marginTop: 0
            }}
          >
            Beste gemiddelde
          </h3>

          <div
            style={{
              color: '#aaa',
              marginBottom: 12,
              fontSize: 13
            }}
          >
            Alleen spelers met
            minimaal{' '}
            {
              MIN_AVERAGE_ROUNDS
            }{' '}
            gespeelde toernooien
            tellen mee.
          </div>

          {stats.bestAverageAll
            .length === 0 ? (
            <div
              style={{
                color: '#888'
              }}
            >
              Nog geen speler heeft
              minimaal{' '}
              {
                MIN_AVERAGE_ROUNDS
              }{' '}
              toernooien gespeeld.
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gap: 10
              }}
            >
              {stats.bestAverageAll.map(
                (player) => (
                  <div
                    key={
                      player.playerId
                    }
                    style={{
                      background:
                        '#111',
                      borderRadius: 8,
                      padding: 12
                    }}
                  >
                    <div
                      style={{
                        fontWeight:
                          900,
                        fontSize: 18
                      }}
                    >
                      {
                        player.playerName
                      }
                    </div>

                    <div
                      style={{
                        color:
                          '#ffd740',
                        fontSize: 24,
                        fontWeight:
                          900,
                        marginTop: 4
                      }}
                    >
                      {formatAverage(
                        player.averageAll
                      )}{' '}
                      punten
                    </div>

                    <div
                      style={{
                        color: '#aaa',
                        marginTop: 4
                      }}
                    >
                      {
                        player.allPoints
                      }{' '}
                      punten uit{' '}
                      {
                        player.playedRounds
                      }{' '}
                      toernooien
                    </div>
                  </div>
                )
              )}
            </div>
          )}
        </div>

        <div style={cardStyle}>
          <h3
            style={{
              marginTop: 0
            }}
          >
            Beste gemiddelde na
            weggestreepte scores
          </h3>

          <div
            style={{
              color: '#aaa',
              marginBottom: 12,
              fontSize: 13
            }}
          >
            Alleen de scores die
            voor de algemene ranking
            meetellen worden gebruikt.
            Ook hier geldt minimaal{' '}
            {
              MIN_AVERAGE_ROUNDS
            }{' '}
            gespeelde toernooien.
          </div>

          {stats.bestAverageCounted
            .length === 0 ? (
            <div
              style={{
                color: '#888'
              }}
            >
              Nog geen speler heeft
              minimaal{' '}
              {
                MIN_AVERAGE_ROUNDS
              }{' '}
              toernooien gespeeld.
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gap: 10
              }}
            >
              {stats.bestAverageCounted.map(
                (player) => (
                  <div
                    key={
                      player.playerId
                    }
                    style={{
                      background:
                        '#111',
                      borderRadius: 8,
                      padding: 12
                    }}
                  >
                    <div
                      style={{
                        fontWeight:
                          900,
                        fontSize: 18
                      }}
                    >
                      {
                        player.playerName
                      }
                    </div>

                    <div
                      style={{
                        color:
                          '#ffd740',
                        fontSize: 24,
                        fontWeight:
                          900,
                        marginTop: 4
                      }}
                    >
                      {formatAverage(
                        player.averageCounted
                      )}{' '}
                      punten
                    </div>

                    <div
                      style={{
                        color: '#aaa',
                        marginTop: 4
                      }}
                    >
                      {
                        player.countedPoints
                      }{' '}
                      meetellende
                      punten uit{' '}
                      {
                        player.countedRounds
                      }{' '}
                      meetellende
                      toernooien
                    </div>
                  </div>
                )
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
