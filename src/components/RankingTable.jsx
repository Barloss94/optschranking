import {
  MAX_FINALISTS,
  MAX_WAITLIST
} from '../constants/rankingConstants';

import {
  thStyle,
  tdStyle
} from '../styles/tableStyles';

import {
  downloadRankingCSV
} from '../utils/csv';

export default function RankingTable({
  ranking,
  rounds,
  nextUp
}) {
  const playedRoundIndexes = rounds
    .map((round, index) => ({
      round,
      index
    }))
    .filter(({ index }) =>
      ranking.some(
        (player) =>
          player.roundDetails?.[index]
            ?.hasData
      )
    );

  const longestNameLength = Math.max(
    4,
    ...ranking.map(
      (player) =>
        String(
          player.displayName || ''
        ).length
    )
  );

  const NAME_WIDTH = Math.min(
    320,
    Math.max(
      170,
      longestNameLength * 9 + 32
    )
  );

  const lastPlayedRound =
    playedRoundIndexes.length > 0
      ? playedRoundIndexes[
          playedRoundIndexes.length - 1
        ]
      : null;

  const previousPlayedRounds =
    lastPlayedRound
      ? playedRoundIndexes.slice(0, -1)
      : [];

  const STATUS_WIDTH = 120;
  const TOTAL_WIDTH = 80;
  const PLAYED_WIDTH = 100;
  const LAST_ROUND_WIDTH = 55;

  const statusRight = 0;

  const totalRight =
    STATUS_WIDTH;

  const playedRight =
    STATUS_WIDTH +
    TOTAL_WIDTH;

  const lastRoundRight =
    STATUS_WIDTH +
    TOTAL_WIDTH +
    PLAYED_WIDTH;

  const getStickyHeaderStyle = ({
    left,
    right,
    width,
    zIndex = 10,
    borderLeft = false,
    borderRight = false
  }) => ({
    ...thStyle,
    position: 'sticky',
    ...(left !== undefined
      ? { left }
      : {}),
    ...(right !== undefined
      ? { right }
      : {}),
    width,
    minWidth: width,
    maxWidth: width,
    zIndex,
    background: '#181818',
    whiteSpace: 'nowrap',
    ...(borderLeft
      ? {
          borderLeft:
            '2px solid #444'
        }
      : {}),
    ...(borderRight
      ? {
          borderRight:
            '2px solid #444'
        }
      : {})
  });

  const getStickyCellStyle = ({
    left,
    right,
    width,
    background,
    zIndex = 5,
    borderLeft = false,
    borderRight = false,
    fontWeight,
    color
  }) => ({
    ...tdStyle,
    position: 'sticky',
    ...(left !== undefined
      ? { left }
      : {}),
    ...(right !== undefined
      ? { right }
      : {}),
    width,
    minWidth: width,
    maxWidth: width,
    zIndex,
    background,
    whiteSpace: 'nowrap',
    ...(borderLeft
      ? {
          borderLeft:
            '2px solid #333'
        }
      : {}),
    ...(borderRight
      ? {
          borderRight:
            '2px solid #333'
        }
      : {}),
    ...(fontWeight
      ? { fontWeight }
      : {}),
    ...(color
      ? { color }
      : {})
  });

  const getResultCellStyle = ({
    detail,
    rowBackground
  }) => {
    const isDropped =
      detail?.hasData &&
      detail?.isCounted === false;

    return {
      ...tdStyle,
      width: 62,
      minWidth: 62,
      maxWidth: 62,
      textAlign: 'center',
      whiteSpace: 'nowrap',
      background: isDropped
        ? 'rgba(244, 67, 54, 0.18)'
        : rowBackground,
      color: isDropped
        ? '#ff8a80'
        : undefined,
      fontWeight: isDropped
        ? 900
        : undefined,
      ...(isDropped
        ? {
            boxShadow:
              'inset 0 0 0 1px rgba(255, 138, 128, 0.28)'
          }
        : {})
    };
  };

  const getPlayerStatus = (
    player,
    idx
  ) => {
    const isQualified =
      idx < MAX_FINALISTS;

    const isBubble =
      idx ===
      MAX_FINALISTS - 1;

    const isWaitlist =
      idx >= MAX_FINALISTS &&
      idx <
        MAX_FINALISTS +
          MAX_WAITLIST;

    const isNextUp =
      nextUp &&
      nextUp.id === player.id;

    if (isBubble) {
      return 'Bubble';
    }

    if (isQualified) {
      return 'Finalist';
    }

    if (isNextUp) {
      return 'Next up';
    }

    if (isWaitlist) {
      return 'Waitlist';
    }

    return '';
  };

  const getStatusDisplay = (
    player,
    idx
  ) => {
    const status =
      getPlayerStatus(
        player,
        idx
      );

    switch (status) {
      case 'Bubble':
        return '🫧 Bubble';

      case 'Finalist':
        return '🏆 Finalist';

      case 'Next up':
        return '⭐ Next up';

      case 'Waitlist':
        return '🟡 Waitlist';

      default:
        return '—';
    }
  };

  const getRowBackground = (
    idx,
    player
  ) => {
    const isQualified =
      idx < MAX_FINALISTS;

    const isBubble =
      idx ===
      MAX_FINALISTS - 1;

    const isWaitlist =
      idx >= MAX_FINALISTS &&
      idx <
        MAX_FINALISTS +
          MAX_WAITLIST;

    const isNextUp =
      nextUp &&
      nextUp.id === player.id;

    if (isBubble) {
      return '#2b2114';
    }

    if (isQualified) {
      return '#152019';
    }

    if (
      isWaitlist ||
      isNextUp
    ) {
      return '#181818';
    }

    return '#111';
  };

  const handleDownloadRankingCSV =
    () => {
      if (
        ranking.length === 0
      ) {
        alert(
          'Er is nog geen ranking om te downloaden.'
        );

        return;
      }

      downloadRankingCSV({
        ranking,

        roundColumns:
          playedRoundIndexes.map(
            ({
              round,
              index
            }) => ({
              id:
                round.id,

              roundNumber:
                round.round_number,

              index
            })
          ),

        getStatus:
          getPlayerStatus
      });
    };

  return (
    <>
      <div
        className="ranking-heading"
        style={{
          display: 'flex',
          justifyContent:
            'space-between',
          alignItems: 'center',
          gap: 12,
          flexWrap: 'wrap',
          marginBottom: 8
        }}
      >
        <h2
          style={{
            marginBottom: 0
          }}
        >
          Algemene stand
        </h2>

        <button
          type="button"
          className="ranking-download-button"
          onClick={
            handleDownloadRankingCSV
          }
          disabled={
            ranking.length === 0
          }
        >
          📄 CSV downloaden
        </button>
      </div>

      <div
        style={{
          color: '#aaa',
          marginBottom: 8
        }}
      >
        Alleen de beste resultaten per
        speler tellen mee voor de
        ranking.
      </div>

      <div
        className="ranking-drop-legend"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          color: '#aaa',
          marginBottom: 12,
          fontSize: 13
        }}
      >
        <span
          style={{
            display:
              'inline-block',
            width: 14,
            height: 14,
            borderRadius: 3,
            background:
              'rgba(244, 67, 54, 0.18)',
            border:
              '1px solid rgba(255, 138, 128, 0.55)',
            flexShrink: 0
          }}
        />

        <span>
          Rood gemarkeerde resultaten
          tellen niet mee voor het
          totaal.
        </span>
      </div>

      <div
        className="ranking-mobile-list"
      >
        {ranking.map(
          (player, idx) => {
            const rowBackground =
              getRowBackground(
                idx,
                player
              );

            const lastRoundDetail =
              lastPlayedRound
                ? player
                    .roundDetails?.[
                    lastPlayedRound
                      .index
                  ]
                : null;

            const lastRoundDropped =
              lastRoundDetail
                ?.hasData &&
              lastRoundDetail
                ?.isCounted ===
                false;

            return (
              <article
                key={player.id}
                className="ranking-mobile-card"
                style={{
                  background:
                    rowBackground
                }}
              >
                <div className="ranking-mobile-main">
                  <div className="ranking-mobile-position">
                    #{idx + 1}
                  </div>

                  <div className="ranking-mobile-player">
                    <div className="ranking-mobile-name">
                      {
                        player.displayName
                      }
                    </div>

                    <div className="ranking-mobile-status">
                      {getStatusDisplay(
                        player,
                        idx
                      )}
                    </div>
                  </div>

                  <div className="ranking-mobile-total">
                    <strong>
                      {
                        player.totalPoints
                      }
                    </strong>
                    <span>
                      punten
                    </span>
                  </div>
                </div>

                <div className="ranking-mobile-meta">
                  <div>
                    <span>
                      Gespeeld
                    </span>
                    <strong>
                      {
                        player.playedRounds
                      }
                    </strong>
                  </div>

                  <div>
                    <span>
                      Laatste
                    </span>
                    <strong
                      className={
                        lastRoundDropped
                          ? 'ranking-mobile-dropped'
                          : ''
                      }
                    >
                      {lastRoundDetail
                        ?.hasData
                        ? `R${lastPlayedRound?.round.round_number}: ${lastRoundDetail.points}`
                        : '-'}
                    </strong>
                  </div>
                </div>
              </article>
            );
          }
        )}
      </div>

      <div
        className="ranking-desktop-table"
        style={{
          width: '100%',
          maxWidth: '100%',
          overflowX: 'auto',
          position: 'relative'
        }}
      >
        <table
          style={{
            width: 'max-content',
            minWidth: '100%',
            borderCollapse:
              'separate',
            borderSpacing: 0,
            tableLayout: 'fixed'
          }}
        >
          <thead>
            <tr>
              <th
                style={getStickyHeaderStyle({
                  left: 0,
                  width: 48,
                  zIndex: 20
                })}
              >
                #
              </th>

              <th
                style={getStickyHeaderStyle({
                  left: 48,
                  width:
                    NAME_WIDTH,
                  zIndex: 20,
                  borderRight: true
                })}
              >
                Naam
              </th>

              {previousPlayedRounds.map(
                ({ round }) => (
                  <th
                    key={
                      round.id
                    }
                    style={{
                      ...thStyle,
                      width: 62,
                      minWidth: 62,
                      maxWidth: 62,
                      whiteSpace:
                        'nowrap',
                      textAlign:
                        'center'
                    }}
                  >
                    R
                    {
                      round.round_number
                    }
                  </th>
                )
              )}

              <th
                style={getStickyHeaderStyle({
                  right:
                    lastRoundRight,
                  width:
                    LAST_ROUND_WIDTH,
                  zIndex: 20,
                  borderLeft: true
                })}
              >
                {lastPlayedRound
                  ? `R${lastPlayedRound.round.round_number}`
                  : 'Laatste'}
              </th>

              <th
                style={getStickyHeaderStyle({
                  right:
                    playedRight,
                  width:
                    PLAYED_WIDTH,
                  zIndex: 20
                })}
              >
                Gespeeld
              </th>

              <th
                style={getStickyHeaderStyle({
                  right:
                    totalRight,
                  width:
                    TOTAL_WIDTH,
                  zIndex: 20
                })}
              >
                Totaal
              </th>

              <th
                style={getStickyHeaderStyle({
                  right:
                    statusRight,
                  width:
                    STATUS_WIDTH,
                  zIndex: 20
                })}
              >
                Status
              </th>
            </tr>
          </thead>

          <tbody>
            {ranking.map(
              (player, idx) => {
                const rowBackground =
                  getRowBackground(
                    idx,
                    player
                  );

                const lastRoundDetail =
                  lastPlayedRound
                    ? player
                        .roundDetails?.[
                        lastPlayedRound
                          .index
                      ]
                    : null;

                const lastRoundDropped =
                  lastRoundDetail
                    ?.hasData &&
                  lastRoundDetail
                    ?.isCounted ===
                    false;

                return (
                  <tr
                    key={
                      player.id
                    }
                    style={{
                      background:
                        rowBackground
                    }}
                  >
                    <td
                      style={getStickyCellStyle({
                        left: 0,
                        width: 48,
                        background:
                          rowBackground,
                        zIndex: 15
                      })}
                    >
                      {idx + 1}
                    </td>

                    <td
                      style={getStickyCellStyle({
                        left: 48,
                        width:
                          NAME_WIDTH,
                        background:
                          rowBackground,
                        zIndex: 15,
                        borderRight: true,
                        fontWeight: 700
                      })}
                    >
                      {
                        player.displayName
                      }
                    </td>

                    {previousPlayedRounds.map(
                      ({
                        round,
                        index
                      }) => {
                        const detail =
                          player
                            .roundDetails?.[
                            index
                          ];

                        return (
                          <td
                            key={
                              round.id
                            }
                            style={getResultCellStyle({
                              detail,
                              rowBackground
                            })}
                            title={
                              detail?.hasData &&
                              detail?.isCounted ===
                                false
                                ? 'Dit resultaat telt niet mee voor het totaal'
                                : undefined
                            }
                          >
                            {detail?.hasData
                              ? detail.points
                              : '-'}
                          </td>
                        );
                      }
                    )}

                    <td
                      style={getStickyCellStyle({
                        right:
                          lastRoundRight,
                        width:
                          LAST_ROUND_WIDTH,
                        background:
                          lastRoundDropped
                            ? '#3a1717'
                            : rowBackground,
                        zIndex: 15,
                        borderLeft: true,
                        fontWeight:
                          lastRoundDropped
                            ? 900
                            : 700,
                        color:
                          lastRoundDropped
                            ? '#ff8a80'
                            : undefined
                      })}
                      title={
                        lastRoundDropped
                          ? 'Dit resultaat telt niet mee voor het totaal'
                          : undefined
                      }
                    >
                      {lastRoundDetail?.hasData
                        ? lastRoundDetail.points
                        : '-'}
                    </td>

                    <td
                      style={getStickyCellStyle({
                        right:
                          playedRight,
                        width:
                          PLAYED_WIDTH,
                        background:
                          rowBackground,
                        zIndex: 15
                      })}
                    >
                      {
                        player.playedRounds
                      }
                    </td>

                    <td
                      style={getStickyCellStyle({
                        right:
                          totalRight,
                        width:
                          TOTAL_WIDTH,
                        background:
                          rowBackground,
                        zIndex: 15,
                        fontWeight: 900,
                        color:
                          '#ffd740'
                      })}
                    >
                      {
                        player.totalPoints
                      }
                    </td>

                    <td
                      style={getStickyCellStyle({
                        right:
                          statusRight,
                        width:
                          STATUS_WIDTH,
                        background:
                          rowBackground,
                        zIndex: 15
                      })}
                    >
                      {getStatusDisplay(
                        player,
                        idx
                      )}
                    </td>
                  </tr>
                );
              }
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
