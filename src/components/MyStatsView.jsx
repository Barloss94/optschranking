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

function StatCard({
  label,
  value,
  details = [],
  cardStyle,
  labelStyle,
  valueStyle
}) {
  const [open, setOpen] =
    useState(false);

  const hasDetails =
    details.length > 0;

  return (
    <div
      style={{
        ...cardStyle,
        position: 'relative',
        cursor:
          hasDetails
            ? 'pointer'
            : 'default'
      }}
      onMouseEnter={() => {
        if (hasDetails) {
          setOpen(true);
        }
      }}
      onMouseLeave={() => {
        setOpen(false);
      }}
      onClick={() => {
        if (hasDetails) {
          setOpen(
            (current) => !current
          );
        }
      }}
      role={
        hasDetails
          ? 'button'
          : undefined
      }
      tabIndex={
        hasDetails
          ? 0
          : undefined
      }
      onKeyDown={(event) => {
        if (
          !hasDetails ||
          (
            event.key !== 'Enter' &&
            event.key !== ' '
          )
        ) {
          return;
        }

        event.preventDefault();

        setOpen(
          (current) => !current
        );
      }}
    >
      <div style={labelStyle}>
        {label}
      </div>

      <div style={valueStyle}>
        {value}
      </div>

      {hasDetails && (
        <div
          style={{
            color: '#777',
            fontSize: 11,
            marginTop: 8
          }}
        >
          Hover of tik voor details
        </div>
      )}

      {hasDetails && open && (
        <div
          style={{
            position: 'absolute',
            zIndex: 50,
            top: 'calc(100% + 8px)',
            left: 0,
            minWidth: 220,
            maxWidth: 300,
            width: 'max-content',
            background: '#0f0f0f',
            border:
              '1px solid #555',
            borderRadius: 10,
            padding: 12,
            boxShadow:
              '0 12px 30px rgba(0, 0, 0, 0.55)'
          }}
          onClick={(event) =>
            event.stopPropagation()
          }
        >
          <div
            style={{
              color: '#ffd740',
              fontSize: 13,
              fontWeight: 800,
              marginBottom: 8
            }}
          >
            {label}
          </div>

          <div
            style={{
              display: 'grid',
              gap: 6
            }}
          >
            {details.map(
              (detail, index) => (
                <div
                  key={`${detail.roundNumber}-${detail.text}-${index}`}
                  style={{
                    color: '#ddd',
                    fontSize: 13,
                    lineHeight: 1.4
                  }}
                >
                  {detail.text}
                </div>
              )
            )}
          </div>
        </div>
      )}
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
    teamEventItmResults,
    setTeamEventItmResults
  ] = useState([]);

  useEffect(() => {
    let cancelled = false;

    const loadTeamEventItmResults =
      async () => {
        if (!currentPlayer?.id) {
          if (!cancelled) {
            setTeamEventItmResults([]);
          }

          return;
        }

        const { data, error } =
          await supabase
            .from('team_event_players')
            .select(
              'id, round_id, prize, finish_position'
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

          setTeamEventItmResults([]);
          return;
        }

        setTeamEventItmResults(
          (data || []).filter(
            (result) =>
              result.finish_position !==
                null &&
              result.finish_position !==
                undefined &&
              Number(result.prize) > 0
          )
        );
      };

    loadTeamEventItmResults();

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

  const averagePointsAll =
    results.length > 0
      ? totalPointsWithoutDrops /
        results.length
      : 0;

  const averagePointsCounted =
    countedResults.length > 0
      ? totalPointsWithDrops /
        countedResults.length
      : 0;

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

  const finalTableResults =
    results.filter(
      (detail) =>
        Number(detail.pos) >= 1 &&
        Number(detail.pos) <= 9
    );

  const topThreeResults =
    results.filter(
      (detail) =>
        Number(detail.pos) >= 1 &&
        Number(detail.pos) <= 3
    );

  const winResults =
    results.filter(
      (detail) =>
        Number(detail.pos) === 1
    );

  const secondPlaceResults =
    results.filter(
      (detail) =>
        Number(detail.pos) === 2
    );

  const thirdPlaceResults =
    results.filter(
      (detail) =>
        Number(detail.pos) === 3
    );

  const finalTables =
    finalTableResults.length;

  const topThreeFinishes =
    topThreeResults.length;

  const wins =
    winResults.length;

  const secondPlaces =
    secondPlaceResults.length;

  const thirdPlaces =
    thirdPlaceResults.length;

  const normalRoundItmResults =
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
    });

  const itmFinishes =
    normalRoundItmResults.length +
    teamEventItmResults.length;

  const buildFinishDetails = (
    finishResults
  ) =>
    finishResults.map(
      (detail) => ({
        roundNumber:
          detail.roundNumber,
        text:
          `Ronde ${detail.roundNumber} – ${Number(
            detail.pos
          )}e`
      })
    );

  const finalTableDetails =
    buildFinishDetails(
      finalTableResults
    );

  const topThreeDetails =
    buildFinishDetails(
      topThreeResults
    );

  const winDetails =
    buildFinishDetails(
      winResults
    );

  const secondPlaceDetails =
    buildFinishDetails(
      secondPlaceResults
    );

  const thirdPlaceDetails =
    buildFinishDetails(
      thirdPlaceResults
    );

  const normalItmDetails =
    buildFinishDetails(
      normalRoundItmResults
    );

  const teamEventItmDetails =
    teamEventItmResults
      .map((result) => {
        const round = rounds.find(
          (item) =>
            item.id ===
            result.round_id
        );

        return {
          roundNumber:
            round?.round_number ??
            '?',
          text:
            `Ronde ${
              round?.round_number ??
              '?'
            } – ITM (Team Event)`
        };
      })
      .sort((a, b) => {
        const roundA =
          Number(a.roundNumber) || 0;

        const roundB =
          Number(b.roundNumber) || 0;

        return roundA - roundB;
      });

  const itmDetails = [
    ...normalItmDetails,
    ...teamEventItmDetails
  ].sort((a, b) => {
    const roundA =
      Number(a.roundNumber) || 0;

    const roundB =
      Number(b.roundNumber) || 0;

    return roundA - roundB;
  });

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

        <StatCard
          label="Final Tables"
          value={finalTables}
          details={finalTableDetails}
          cardStyle={cardStyle}
          labelStyle={labelStyle}
          valueStyle={valueStyle}
        />

        <StatCard
          label="ITM-finishes"
          value={itmFinishes}
          details={itmDetails}
          cardStyle={cardStyle}
          labelStyle={labelStyle}
          valueStyle={valueStyle}
        />

        <StatCard
          label="Top 3-finishes"
          value={topThreeFinishes}
          details={topThreeDetails}
          cardStyle={cardStyle}
          labelStyle={labelStyle}
          valueStyle={valueStyle}
        />

        <StatCard
          label="Overwinningen"
          value={wins}
          details={winDetails}
          cardStyle={cardStyle}
          labelStyle={labelStyle}
          valueStyle={valueStyle}
        />

        <StatCard
          label="2e plaatsen"
          value={secondPlaces}
          details={secondPlaceDetails}
          cardStyle={cardStyle}
          labelStyle={labelStyle}
          valueStyle={valueStyle}
        />

        <StatCard
          label="3e plaatsen"
          value={thirdPlaces}
          details={thirdPlaceDetails}
          cardStyle={cardStyle}
          labelStyle={labelStyle}
          valueStyle={valueStyle}
        />

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
            Gemiddelde score
          </div>

          <div style={valueStyle}>
            {averagePointsAll.toLocaleString(
              'nl-NL',
              {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              }
            )}
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

        <div style={cardStyle}>
          <div style={labelStyle}>
            Gemiddelde meetellende score
          </div>

          <div style={valueStyle}>
            {averagePointsCounted.toLocaleString(
              'nl-NL',
              {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              }
            )}
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