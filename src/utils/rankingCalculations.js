import {
  BONUS_POINTS,
  BEST_RESULTS_COUNT,
  MAX_FINALISTS,
  MAX_WAITLIST,
  TOTAL_FINAL_STACK,
  BASE_FINAL_STACK,
  FINAL_PAYOUT_PERCENTAGES
} from '../constants/rankingConstants';

export const roundTo100 = (value) =>
  Math.round(value / 100) * 100;

export const roundDown5 = (n) =>
  Math.floor(n / 5) * 5;

export const roundUp5 = (n) =>
  Math.ceil(n / 5) * 5;

export const roundDown025 = (n) =>
  Math.floor(n * 4) / 4;

export const getRoundPoints = (
  position,
  totalPlayers
) => {
  if (
    !position ||
    !totalPlayers ||
    position > totalPlayers
  ) {
    return 0;
  }

  const basePoints =
    totalPlayers - position + 1;

  const bonusPoints =
    BONUS_POINTS[position] || 0;

  return basePoints + bonusPoints;
};

export const getDisplayRoundPoints = (
  position,
  totalPlayers,
  doublePoints = false
) => {
  const basePoints = getRoundPoints(
    position,
    totalPlayers
  );

  return doublePoints
    ? basePoints * 2
    : basePoints;
};

export const getPaidPlacesForRound = (
  playerCount
) => {
  if (
    !playerCount ||
    playerCount <= 0
  ) {
    return 0;
  }

  return Math.min(
    6,
    Math.ceil(playerCount * 0.15)
  );
};

export const getRoundPayoutPercentages = (
  paidPlaces
) => {
  const payoutMap = {
    1: [100],
    2: [65, 35],
    3: [50, 30, 20],
    4: [45, 25, 18, 12],
    5: [40, 23, 16, 12, 9],
    6: [35, 22, 16, 11, 9, 7],
    7: [32, 21, 15, 11, 9, 7, 5],
    8: [30, 20, 14, 11, 9, 7, 5, 4],
    9: [
      29,
      19,
      13,
      11,
      9,
      7,
      5,
      4,
      3
    ],
    10: [
      28,
      18,
      13,
      11,
      9,
      7,
      5,
      4,
      3,
      2
    ],
    11: [
      27,
      18,
      12,
      11,
      9,
      7,
      5,
      4,
      3,
      2,
      2
    ],
    12: [
      26,
      17,
      12,
      10,
      9,
      7,
      5,
      4,
      3,
      3,
      2,
      2
    ],
    13: [
      25,
      17,
      12,
      10,
      8,
      7,
      5,
      4,
      3,
      3,
      2,
      2,
      2
    ],
    14: [
      24,
      16,
      12,
      10,
      8,
      7,
      5,
      4,
      3,
      3,
      2,
      2,
      2,
      2
    ]
  };

  return payoutMap[paidPlaces] || [];
};

export const getHostFeeForRound = (
  playerCount,
  forceHighFee = false
) => {
  const total =
    Number(playerCount) || 0;

  if (total <= 0) {
    return 0;
  }

  if (forceHighFee) {
    return 15;
  }

  if (total <= 9) {
    return 5;
  }

  if (total <= 18) {
    return 6;
  }

  if (total <= 36) {
    return 8;
  }

  return 15;
};

export const getEffectiveDaypotPlayers = (
  playerCount,
  forceHighFee = false
) => {
  const total =
    Number(playerCount) || 0;

  if (total <= 0) {
    return 0;
  }

  const hostFee =
    getHostFeeForRound(
      total,
      forceHighFee
    );

  return Math.max(
    0,
    total - hostFee / 5
  );
};

export const getRoundPrizePool = (
  playerCount,
  forceHighFee = false
) => {
  const total =
    Number(playerCount) || 0;

  if (total <= 0) {
    return 0;
  }

  const grossPot =
    total * 5;

  const hostFee =
    getHostFeeForRound(
      total,
      forceHighFee
    );

  return Math.max(
    0,
    grossPot - hostFee
  );
};

export const getTeamEventTournamentPrizePool = (
  playerCount
) => {
  const total =
    Number(playerCount) || 0;

  if (total <= 0) {
    return 0;
  }

  return Math.max(
    0,
    (total * 5 - 15) / 2
  );
};

export const getTeamEventTournamentPrizes = (
  totalPlayers,
  tournamentPlayers
) => {
  const paidPlaces =
    getPaidPlacesForRound(
      tournamentPlayers
    );

  if (!paidPlaces) {
    return [];
  }

  const percentages =
    getRoundPayoutPercentages(
      paidPlaces
    );

  const totalPot =
    getTeamEventTournamentPrizePool(
      totalPlayers
    );

  if (
    !percentages.length ||
    totalPot <= 0
  ) {
    return [];
  }

  const raw =
    percentages.map(
      (percentage) =>
        (
          totalPot *
          percentage
        ) / 100
    );

  const roundedDown =
    raw.map(roundDown025);

  let remainder =
    Math.round(
      (
        totalPot -
        roundedDown.reduce(
          (sum, value) =>
            sum + value,
          0
        )
      ) * 100
    ) / 100;

  const prizes = [
    ...roundedDown
  ];

  for (
    let index = 0;
    index < prizes.length &&
    remainder >= 0.25 - 0.0001;
    index += 1
  ) {
    prizes[index] =
      Math.round(
        (
          prizes[index] +
          0.25
        ) * 100
      ) / 100;

    remainder =
      Math.round(
        (
          remainder -
          0.25
        ) * 100
      ) / 100;

    if (
      index ===
        prizes.length - 1 &&
      remainder >=
        0.25 - 0.0001
    ) {
      index = -1;
    }
  }

  return prizes;
};

export const splitFirstTwoPrizes = (
  prizes
) => {
  if (
    !prizes ||
    prizes.length < 2
  ) {
    return prizes;
  }

  const combined =
    Math.round(
      (
        prizes[0] +
        prizes[1]
      ) * 100
    );

  const second =
    Math.floor(combined / 2);

  const first =
    combined - second;

  return [
    first / 100,
    second / 100,
    ...prizes.slice(2)
  ];
};

export const getRoundPrizes = (
  playerCount,
  splitFirstTwo = false,
  forceHighFee = false
) => {
  const paidPlaces =
    getPaidPlacesForRound(
      playerCount
    );

  const percentages =
    getRoundPayoutPercentages(
      paidPlaces
    );

  const totalPot =
    getRoundPrizePool(
      playerCount,
      forceHighFee
    );

  if (
    !paidPlaces ||
    !percentages.length ||
    totalPot <= 0
  ) {
    return [];
  }

  const raw =
    percentages.map(
      (percentage) =>
        (
          totalPot *
          percentage
        ) / 100
    );

  const roundedDown =
    raw.map(
      (value) =>
        roundDown025(value)
    );

  let remainder =
    Math.round(
      (
        totalPot -
        roundedDown.reduce(
          (sum, value) =>
            sum + value,
          0
        )
      ) * 100
    ) / 100;

  const prizes = [
    ...roundedDown
  ];

  for (
    let index = 0;
    index < prizes.length &&
    remainder >= 0.25 - 0.0001;
    index += 1
  ) {
    prizes[index] =
      Math.round(
        (
          prizes[index] +
          0.25
        ) * 100
      ) / 100;

    remainder =
      Math.round(
        (
          remainder -
          0.25
        ) * 100
      ) / 100;

    if (
      index ===
        prizes.length - 1 &&
      remainder >=
        0.25 - 0.0001
    ) {
      index = -1;
    }
  }

  return splitFirstTwo
    ? splitFirstTwoPrizes(prizes)
    : prizes;
};

export const getSafePayouts = (
  pot
) => {
  if (pot <= 0) {
    return {
      places: [
        0,
        0,
        0,
        0,
        0,
        0
      ],
      rankingWinner: 0
    };
  }

  const raw2 =
    (
      pot *
      FINAL_PAYOUT_PERCENTAGES.place2
    ) / 100;

  const raw3 =
    (
      pot *
      FINAL_PAYOUT_PERCENTAGES.place3
    ) / 100;

  const raw4 =
    (
      pot *
      FINAL_PAYOUT_PERCENTAGES.place4
    ) / 100;

  const raw5 =
    (
      pot *
      FINAL_PAYOUT_PERCENTAGES.place5
    ) / 100;

  const raw6 =
    (
      pot *
      FINAL_PAYOUT_PERCENTAGES.place6
    ) / 100;

  const p2 =
    roundDown5(raw2);

  const p3 =
    roundDown5(raw3);

  const p4 =
    roundDown5(raw4);

  const p5 =
    roundDown5(raw5);

  const shared =
    roundUp5(raw6);

  const p6 = shared;

  const rankingWinner =
    shared;

  const usedWithoutP1 =
    p2 +
    p3 +
    p4 +
    p5 +
    p6 +
    rankingWinner;

  const p1 =
    Math.max(
      0,
      pot - usedWithoutP1
    );

  return {
    places: [
      p1,
      p2,
      p3,
      p4,
      p5,
      p6
    ],
    rankingWinner
  };
};

export const buildRanking = ({
  players,
  rounds,
  roundResults,
  getRoundPlayerCount,
  getRoundDoublePoints
}) => {
  const data =
    players.map((player) => {
      const roundDetails =
        rounds.map((round) => {
          const results =
            roundResults[
              round.round_number
            ] || [];

          const totalPlayers =
            getRoundPlayerCount(
              round.round_number
            );

          const index =
            results.findIndex(
              (entry) =>
                entry.player_id ===
                player.id
            );

          const result =
            index >= 0
              ? results[index]
              : null;

          const pos =
            result
              ? Number(
                  result.position
                ) ||
                index + 1
              : 0;

          const hasStoredPoints =
            result &&
            result.points !== null &&
            result.points !== undefined;

          const isTeamEvent =
            round.round_type ===
            'team_event';

          const points =
            isTeamEvent &&
            hasStoredPoints
              ? Number(
                  result.points
                ) || 0
              : getDisplayRoundPoints(
                  pos,
                  totalPlayers,
                  getRoundDoublePoints(
                    round.round_number
                  )
                );

          return {
            pos,
            points,
            totalPlayers,
            hasData:
              Boolean(result)
          };
        });

      const rankedRoundDetails =
        roundDetails
          .map(
            (detail, index) => ({
              ...detail,
              originalIndex: index
            })
          )
          .filter(
            (detail) =>
              detail.hasData
          )
          .sort(
            (a, b) => {
              if (
                b.points !==
                a.points
              ) {
                return (
                  b.points -
                  a.points
                );
              }

              return (
                a.originalIndex -
                b.originalIndex
              );
            }
          );

      const countedIndexes =
        new Set(
          rankedRoundDetails
            .slice(
              0,
              BEST_RESULTS_COUNT
            )
            .map(
              (detail) =>
                detail.originalIndex
            )
        );

      const roundDetailsWithCounted =
        roundDetails.map(
          (detail, index) => ({
            ...detail,
            isCounted:
              detail.hasData &&
              countedIndexes.has(
                index
              )
          })
        );

      const totalPoints =
        roundDetailsWithCounted
          .filter(
            (detail) =>
              detail.isCounted
          )
          .reduce(
            (sum, detail) =>
              sum + detail.points,
            0
          );

      const playedRounds =
        roundDetailsWithCounted.filter(
          (detail) =>
            detail.hasData
        ).length;

      return {
        ...player,
        displayName:
          player.preferred_name ||
          player.name,
        roundDetails:
          roundDetailsWithCounted,
        totalPoints,
        playedRounds
      };
    });

  return data.sort(
    (a, b) => {
      if (
        b.totalPoints !==
        a.totalPoints
      ) {
        return (
          b.totalPoints -
          a.totalPoints
        );
      }

      if (
        a.playedRounds !==
        b.playedRounds
      ) {
        return (
          a.playedRounds -
          b.playedRounds
        );
      }

      return a.displayName.localeCompare(
        b.displayName
      );
    }
  );
};

export const buildFinalLists = ({
  ranking,
  declinedFinalists,
  finaleRegistrations = []
}) => {
  const declinedIds =
    declinedFinalists.map(
      (item) =>
        item.player_id
    );

  const baseFinalists =
    ranking.slice(
      0,
      MAX_FINALISTS
    );

  const reservePool =
    ranking.slice(
      MAX_FINALISTS,
      MAX_FINALISTS +
        MAX_WAITLIST
    );

  const availableReserves =
    reservePool.filter(
      (player) =>
        !declinedIds.includes(
          player.id
        )
    );

  const confirmedReserveIds =
    new Set(
      finaleRegistrations
        .filter(
          (item) =>
            item.status ===
              'confirmed'
        )
        .map(
          (item) =>
            item.player_id
        )
    );

  const activeBaseFinalists =
    baseFinalists.filter(
      (player) =>
        !declinedIds.includes(
          player.id
        )
    );

  const replacementsNeeded =
    MAX_FINALISTS -
    activeBaseFinalists.length;

  const confirmedReserves =
    availableReserves.filter(
      (player) =>
        confirmedReserveIds.has(
          player.id
        )
    );

  const pendingReserves =
    availableReserves.filter(
      (player) =>
        !confirmedReserveIds.has(
          player.id
        )
    );

  const replacements = [
    ...confirmedReserves,
    ...pendingReserves
  ].slice(
    0,
    Math.max(
      0,
      replacementsNeeded
    )
  );

  const finalList = [
    ...activeBaseFinalists,
    ...replacements
  ];

  return {
    baseFinalists,
    reservePool,
    availableReserves,
    finalList,
    nextUp:
      availableReserves[0] ||
      null
  };
};

export const buildFinalStackList = (
  finalList
) => {
  const totalFinalistPoints =
    finalList.reduce(
      (sum, player) =>
        sum +
        (
          player.totalPoints ||
          0
        ),
      0
    );

  const totalBaseStack =
    finalList.length *
    BASE_FINAL_STACK;

  const remainingStack =
    Math.max(
      0,
      TOTAL_FINAL_STACK -
        totalBaseStack
    );

  const stacks =
    finalList.map(
      (player) => {
        const rawBonus =
          totalFinalistPoints > 0
            ? (
                player.totalPoints /
                totalFinalistPoints
              ) *
              remainingStack
            : 0;

        const bonusStack =
          roundTo100(rawBonus);

        return {
          ...player,
          baseStack:
            BASE_FINAL_STACK,
          bonusStack,
          finalStack:
            BASE_FINAL_STACK +
            bonusStack
        };
      }
    );

  const currentTotal =
    stacks.reduce(
      (sum, player) =>
        sum +
        player.finalStack,
      0
    );

  const diff =
    TOTAL_FINAL_STACK -
    currentTotal;

  if (
    stacks.length > 0 &&
    diff !== 0
  ) {
    stacks[0] = {
      ...stacks[0],
      bonusStack:
        stacks[0].bonusStack +
        diff,
      finalStack:
        stacks[0].finalStack +
        diff
    };
  }

  return stacks;
};