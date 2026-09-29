import {
  useEffect,
  useState
} from 'react';
import { supabase } from '../lib/supabaseClient';
import { formatEuro } from '../utils/formatters';
import {
  getPaidPlacesForRound
} from '../utils/rankingCalculations';
import ChangePasswordPanel from './ChangePasswordPanel';

function PointsChart({ results }) {
  if (!results.length) {
    return (
      <div
        style={{
          color: '#888',
          padding: '30px 0',
          textAlign: 'center'
        }}
      >
        Nog geen meetellende resultaten om weer te geven.
      </div>
    );
  }

  const width = 900;
  const height = 320;

  const padding = {
    top: 25,
    right: 25,
    bottom: 55,
    left: 55
  };

  const chartWidth =
    width - padding.left - padding.right;

  const chartHeight =
    height - padding.top - padding.bottom;

  const values = results.map(
    (result) => Number(result.points) || 0
  );

  const maxPoints = Math.max(...values, 1);

  const yMaximum =
    Math.ceil(maxPoints / 5) * 5 || 5;

  const getX = (index) => {
    if (results.length === 1) {
      return padding.left + chartWidth / 2;
    }

    return (
      padding.left +
      (index / (results.length - 1)) *
        chartWidth
    );
  };

  const getY = (points) =>
    padding.top +
    chartHeight -
    (points / yMaximum) * chartHeight;

  const linePoints = results
    .map(
      (result, index) =>
        `${getX(index)},${getY(
          Number(result.points) || 0
        )}`
    )
    .join(' ');

  const ySteps = 5;

  const yGrid = Array.from(
    { length: ySteps + 1 },
    (_, index) => {
      const value =
        (yMaximum / ySteps) * index;

      return {
        value,
        y: getY(value)
      };
    }
  );

  return (
    <div
      style={{
        width: '100%',
        overflowX: 'auto'
      }}
    >
      <svg
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label="Grafiek van meetellende rankingpunten per ronde"
        style={{
          display: 'block',
          width: '100%',
          minWidth: 650,
          height: 'auto'
        }}
      >
        {yGrid.map((gridLine) => (
          <g key={gridLine.value}>
            <line
              x1={padding.left}
              y1={gridLine.y}
              x2={width - padding.right}
              y2={gridLine.y}
              stroke="#333"
              strokeWidth="1"
            />

            <text
              x={padding.left - 10}
              y={gridLine.y + 4}
              textAnchor="end"
              fill="#888"
              fontSize="12"
            >
              {Math.round(gridLine.value)}
            </text>
          </g>
        ))}

        <line
          x1={padding.left}
          y1={padding.top}
          x2={padding.left}
          y2={height - padding.bottom}
          stroke="#555"
          strokeWidth="1"
        />

        <line
          x1={padding.left}
          y1={height - padding.bottom}
          x2={width - padding.right}
          y2={height - padding.bottom}
          stroke="#555"
          strokeWidth="1"
        />

        {results.length > 1 && (
          <polyline
            points={linePoints}
            fill="none"
            stroke="#ffd740"
            strokeWidth="3"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        )}

        {results.map((result, index) => {
          const x = getX(index);

          const y = getY(
            Number(result.points) || 0
          );

          return (
            <g
              key={
                result.round?.id ||
                result.roundNumber ||
                index
              }
            >
              <circle
                cx={x}
                cy={y}
                r="6"
                fill="#ffd740"
                stroke="#111"
                strokeWidth="2"
              >
                <title>
                  {`Ronde ${result.roundNumber}: ${result.points} punten`}
                </title>
              </circle>

              <text
                x={x}
                y={height - padding.bottom + 24}
                textAnchor="middle"
                fill="#aaa"
                fontSize="11"
              >
                R{result.roundNumber}
              </text>

              <text
                x={x}
                y={y - 12}
                textAnchor="middle"
                fill="#ddd"
                fontSize="11"
                fontWeight="700"
              >
                {result.points}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export default function MyStatsView({
  user,
  currentPlayer,
  ranking = [],
  rounds = [],

  financialStatsEnabled = false,
  totalBuyIn = 0,
  totalWinnings = 0
}) {
  const [
    teamEventItmFinishes,
    setTeamEventItmFinishes
  ] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const loadTeamEventItmFinishes =
      async () => {
        if (!currentPlayer?.id) {
          if (!cancelled) {
            setTeamEventItmFinishes(0);
          }

          return;
        }

        const { data, error } =
          await supabase
            .from('team_event_players')
            .select(
              'id, prize, finish_position'
            )
            .eq(
              'player_id',
              currentPlayer.id
            );

        if (cancelled) {
          return;
        }

        if (error) {
          console.error(
            'Team Event ITM-statistieken laden mislukt:',
            error
          );

          setTeamEventItmFinishes(0);
          return;
        }

        const itmCount = (
          data || []
        ).filter(
          (result) =>
            result.finish_position !==
              null &&
            result.finish_position !==
              undefined &&
            Number(result.prize) > 0
        ).length;

        setTeamEventItmFinishes(
          itmCount
        );
      };

    loadTeamEventItmFinishes();

    return () => {
      cancelled = true;
    };
  }, [currentPlayer?.id]);

  if (!currentPlayer) {
    return (
      <>
        <h2>Mijn statistieken</h2>

        <div style={{ color: '#ff8a80' }}>
          Je account is nog niet gekoppeld aan een speler.
        </div>
      </>
    );
  }

  const rankingIndex = ranking.findIndex(
    (player) =>
      player.id === currentPlayer.id
  );

  const rankingPlayer =
    rankingIndex >= 0
      ? ranking[rankingIndex]
      : null;

  if (!rankingPlayer) {
    return (
      <>
        <h2>Mijn statistieken</h2>

        <div style={{ color: '#aaa' }}>
          Er zijn nog geen rankinggegevens voor jouw account.
        </div>
      </>
    );
  }

  const roundDetails =
    rankingPlayer.roundDetails || [];

  const results = roundDetails
    .map((detail, index) => {
      const round = rounds[index] || null;

      return {
        ...detail,
        round,
        roundIndex: index,
        roundNumber:
          round?.round_number ??
          index + 1
      };
    })
    .filter(
      (detail) => detail.hasData
    );

  const countedResults = results.filter(
    (detail) => detail.isCounted
  );

  const totalPointsWithoutDrops =
    results.reduce(
      (sum, detail) =>
        sum +
        (Number(detail.points) || 0),
      0
    );

  const totalPointsWithDrops =
    Number(rankingPlayer.totalPoints) || 0;

  /*
   * Zodra 20 of meer resultaten zijn gespeeld,
   * zoeken we het laagste resultaat dat op dit
   * moment nog tot de beste 20 behoort.
   *
   * Dat is het resultaat dat als eerste gevaar
   * loopt om geschrapt te worden wanneer een
   * beter resultaat wordt behaald.
   *
   * Bij een gelijke puntenscore wordt de nieuwste
   * van de gelijke meetellende resultaten als eerste
   * geschrapt. De bestaande rankinglogica geeft bij
   * gelijke punten namelijk voorrang aan de eerdere ronde.
   */
  const nextDropResult =
    results.length >= 20 &&
    countedResults.length > 0
      ? countedResults.reduce(
          (lowest, detail) => {
            if (!lowest) {
              return detail;
            }

            const detailPoints =
              Number(detail.points) || 0;

            const lowestPoints =
              Number(lowest.points) || 0;

            if (
              detailPoints <
              lowestPoints
            ) {
              return detail;
            }

            if (
              detailPoints ===
                lowestPoints &&
              detail.roundIndex >
                lowest.roundIndex
            ) {
              return detail;
            }

            return lowest;
          },
          null
        )
      : null;

  const finishingPositions = results
    .map((detail) => Number(detail.pos))
    .filter(
      (position) =>
        Number.isFinite(position) &&
        position > 0
    );

  const bestResult =
    finishingPositions.length > 0
      ? Math.min(...finishingPositions)
      : null;

  const finalTables =
    finishingPositions.filter(
      (position) => position <= 9
    ).length;

  const topThreeFinishes =
    finishingPositions.filter(
      (position) => position <= 3
    ).length;

  const wins =
    finishingPositions.filter(
      (position) => position === 1
    ).length;

  const secondPlaces =
    finishingPositions.filter(
      (position) => position === 2
    ).length;

  const thirdPlaces =
    finishingPositions.filter(
      (position) => position === 3
    ).length;

  const normalRoundItmFinishes =
    results.filter((detail) => {
      if (
        detail.round?.round_type ===
        'team_event'
      ) {
        return false;
      }

      const position =
        Number(detail.pos) || 0;

      const totalPlayers =
        Number(
          detail.totalPlayers
        ) || 0;

      const paidPlaces =
        getPaidPlacesForRound(
          totalPlayers
        );

      return (
        position > 0 &&
        paidPlaces > 0 &&
        position <= paidPlaces
      );
    }).length;

  const itmFinishes =
    normalRoundItmFinishes +
    teamEventItmFinishes;

  const financialProfit =
    (Number(totalWinnings) || 0) -
    (Number(totalBuyIn) || 0);

  const cardStyle = {
    background: '#181818',
    border: '1px solid #333',
    borderRadius: 12,
    padding: 16,
    minHeight: 105
  };

  const labelStyle = {
    color: '#aaa',
    fontSize: 13,
    marginBottom: 8
  };

  const valueStyle = {
    fontSize: 28,
    fontWeight: 900
  };

  const sectionTitleStyle = {
    marginTop: 28,
    marginBottom: 12
  };

  return (
    <>
      <h2>Mijn statistieken</h2>

      <div
        style={{
          color: '#aaa',
          marginBottom: 18
        }}
      >
        Persoonlijke statistieken van{' '}
        <strong style={{ color: '#fff' }}>
          {rankingPlayer.displayName}
        </strong>
      </div>

      {financialStatsEnabled && (
        <>
          <h3 style={sectionTitleStyle}>
            Financieel
          </h3>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns:
                'repeat(auto-fit, minmax(190px, 1fr))',
              gap: 12
            }}
          >
            <div style={cardStyle}>
              <div style={labelStyle}>
                Totale buy-in
              </div>

              <div style={valueStyle}>
                {formatEuro(
                  Number(totalBuyIn) || 0
                )}
              </div>
            </div>

            <div style={cardStyle}>
              <div style={labelStyle}>
                Totaal gewonnen
              </div>

              <div style={valueStyle}>
                {formatEuro(
                  Number(totalWinnings) || 0
                )}
              </div>
            </div>

            <div style={cardStyle}>
              <div style={labelStyle}>
                Winst / verlies
              </div>

              <div
                style={{
                  ...valueStyle,
                  color:
                    financialProfit > 0
                      ? '#4caf50'
                      : financialProfit < 0
                        ? '#ff8a80'
                        : '#fff'
                }}
              >
                {financialProfit > 0
                  ? '+ '
                  : financialProfit < 0
                    ? '- '
                    : ''}

                {formatEuro(
                  Math.abs(financialProfit)
                )}
              </div>
            </div>
          </div>
        </>
      )}

      <h3 style={sectionTitleStyle}>
        Ranking
      </h3>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns:
            'repeat(auto-fit, minmax(190px, 1fr))',
          gap: 12
        }}
      >
        <div style={cardStyle}>
          <div style={labelStyle}>
            Positie in ranking
          </div>

          <div style={valueStyle}>
            #{rankingIndex + 1}
          </div>
        </div>

        <div style={cardStyle}>
          <div style={labelStyle}>
            Gespeelde rondes
          </div>

          <div style={valueStyle}>
            {results.length}
          </div>
        </div>

        <div style={cardStyle}>
          <div style={labelStyle}>
            Beste resultaat
          </div>

          <div style={valueStyle}>
            {bestResult !== null
              ? `${bestResult}e`
              : '-'}
          </div>
        </div>

        <div style={cardStyle}>
          <div style={labelStyle}>
            Final Tables
          </div>

          <div style={valueStyle}>
            {finalTables}
          </div>
        </div>

        <div style={cardStyle}>
          <div style={labelStyle}>
            ITM-finishes
          </div>

          <div style={valueStyle}>
            {itmFinishes}
          </div>
        </div>

        <div style={cardStyle}>
          <div style={labelStyle}>
            Top 3-finishes
          </div>

          <div style={valueStyle}>
            {topThreeFinishes}
          </div>
        </div>

        <div style={cardStyle}>
          <div style={labelStyle}>
            Overwinningen
          </div>

          <div style={valueStyle}>
            {wins}
          </div>
        </div>

        <div style={cardStyle}>
          <div style={labelStyle}>
            2e plaatsen
          </div>

          <div style={valueStyle}>
            {secondPlaces}
          </div>
        </div>

        <div style={cardStyle}>
          <div style={labelStyle}>
            3e plaatsen
          </div>

          <div style={valueStyle}>
            {thirdPlaces}
          </div>
        </div>

        <div style={cardStyle}>
          <div style={labelStyle}>
            Punten zonder schrappen
          </div>

          <div style={valueStyle}>
            {totalPointsWithoutDrops}
          </div>
        </div>

        <div style={cardStyle}>
          <div style={labelStyle}>
            Punten met schrappen
          </div>

          <div style={valueStyle}>
            {totalPointsWithDrops}
          </div>
        </div>
      </div>

      {results.length >= 20 && (
        <div
          style={{
            ...cardStyle,
            marginTop: 12
          }}
        >
          <div style={labelStyle}>
            Eerstvolgende schrapresultaat
          </div>

          {nextDropResult ? (
            <>
              <div style={valueStyle}>
                {Number(
                  nextDropResult.points
                ) || 0}{' '}
                punten
              </div>

              <div
                style={{
                  color: '#aaa',
                  marginTop: 6
                }}
              >
                Ronde{' '}
                {nextDropResult.roundNumber}
              </div>
            </>
          ) : (
            <div>-</div>
          )}
        </div>
      )}

      <h3 style={sectionTitleStyle}>
        Meetellende punten per ronde
      </h3>

      <div
        style={{
          background: '#181818',
          border: '1px solid #333',
          borderRadius: 12,
          padding: 16
        }}
      >
        <PointsChart
          results={countedResults}
        />
      </div>

      <h3 style={sectionTitleStyle}>
        Account
      </h3>

      <ChangePasswordPanel user={user} />
    </>
  );
}
