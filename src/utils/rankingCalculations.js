import {
  BONUS_POINTS,
  BEST_RESULTS_COUNT,
  MAX_FINALISTS,
  MAX_WAITLIST,
  TOTAL_FINAL_STACK,
  BASE_FINAL_STACK,
  FINAL_WINNER_MAX_PAYOUT,
  FINAL_PAYOUT_REFERENCE
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
  const rawPot =
    Number(pot) || 0;

  const roundedPot =
    Math.floor(
      rawPot / 5
    ) * 5;

  const removedRemainder =
    Math.max(
      0,
      Math.round(
        (
          rawPot -
          roundedPot
        ) * 100
      ) / 100
    );

  if (roundedPot <= 0) {
    return {
      places: [
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0
      ],
      payoutPot: 0,
      removedRemainder
    };
  }

  const payoutUnits =
    Math.round(
      roundedPot / 5
    );

  const referenceUnits =
    FINAL_PAYOUT_REFERENCE.map(
      (amount) =>
        Math.round(
          amount / 5
        )
    );

  const referenceTotalUnits =
    referenceUnits.reduce(
      (sum, value) =>
        sum + value,
      0
    );

  const maxWinnerUnits =
    Math.round(
      FINAL_WINNER_MAX_PAYOUT /
        5
    );

  const targetUnits =
    payoutUnits <=
    referenceTotalUnits
      ? referenceUnits.map(
          (value) =>
            value *
            (
              payoutUnits /
              referenceTotalUnits
            )
        )
      : (() => {
          const excessUnits =
            payoutUnits -
            referenceTotalUnits;

          const lowerReferenceTotal =
            referenceUnits
              .slice(1)
              .reduce(
                (sum, value) =>
                  sum + value,
                0
              );

          return [
            maxWinnerUnits,
            ...referenceUnits
              .slice(1)
              .map(
                (value) =>
                  value +
                  (
                    excessUnits *
                    value
                  ) /
                    lowerReferenceTotal
              )
          ];
        })();

  const targetWinnerUnits =
    payoutUnits <=
    referenceTotalUnits
      ? Math.min(
          maxWinnerUnits,
          Math.max(
            1,
            Math.round(
              targetUnits[0]
            )
          )
        )
      : maxWinnerUnits;

  const memo = new Map();

  const search = (
    index,
    previousPrize,
    previousDifference,
    previousReduction,
    remainingUnits,
    fixedFirstPrize
  ) => {
    const key = [
      index,
      previousPrize,
      previousDifference,
      previousReduction,
      remainingUnits,
      fixedFirstPrize
    ].join('|');

    if (memo.has(key)) {
      return memo.get(key);
    }

    if (index === 9) {
      const result =
        remainingUnits === 0
          ? {
              cost: 0,
              values: []
            }
          : null;

      memo.set(
        key,
        result
      );

      return result;
    }

    const positionsLeft =
      9 - index;

    const candidates =
      index === 0
        ? [fixedFirstPrize]
        : Array.from(
            {
              length:
                Math.max(
                  0,
                  previousPrize - 1
                )
            },
            (_, offset) =>
              previousPrize -
              1 -
              offset
          );

    let best = null;

    for (
      const candidate
      of candidates
    ) {
      if (
        candidate <= 0 ||
        candidate >
          remainingUnits
      ) {
        continue;
      }

      const afterCandidate =
        remainingUnits -
        candidate;

      const remainingPositions =
        positionsLeft - 1;

      if (
        remainingPositions > 0
      ) {
        if (
          candidate - 1 <
          remainingPositions
        ) {
          continue;
        }

        const minimumRemaining =
          (
            remainingPositions *
            (
              remainingPositions +
              1
            )
          ) / 2;

        const maximumRemaining =
          (
            remainingPositions *
            (
              2 *
                (
                  candidate -
                  1
                ) -
              (
                remainingPositions -
                1
              )
            )
          ) / 2;

        if (
          afterCandidate <
            minimumRemaining ||
          afterCandidate >
            maximumRemaining
        ) {
          continue;
        }
      } else if (
        afterCandidate !== 0
      ) {
        continue;
      }

      let difference = 0;
      let reduction =
        Number.MAX_SAFE_INTEGER;

      if (index >= 1) {
        difference =
          previousPrize -
          candidate;

        if (
          difference <= 0
        ) {
          continue;
        }

        if (index >= 2) {
          if (
            difference >=
            previousDifference
          ) {
            continue;
          }

          reduction =
            previousDifference -
            difference;

          if (
            reduction < 1
          ) {
            continue;
          }

          if (
            index >= 3 &&
            reduction >
              previousReduction
          ) {
            continue;
          }
        }
      }

      const next =
        search(
          index + 1,
          candidate,
          difference,
          reduction,
          afterCandidate,
          fixedFirstPrize
        );

      if (!next) {
        continue;
      }

      const ownCost =
        (
          candidate -
          targetUnits[index]
        ) ** 2;

      const totalCost =
        ownCost +
        next.cost;

      if (
        !best ||
        totalCost <
          best.cost
      ) {
        best = {
          cost:
            totalCost,
          values: [
            candidate,
            ...next.values
          ]
        };
      }
    }

    memo.set(
      key,
      best
    );

    return best;
  };

  let solution = null;

  for (
    let winnerUnits =
      targetWinnerUnits;
    winnerUnits >= 1;
    winnerUnits -= 1
  ) {
    memo.clear();

    solution =
      search(
        0,
        0,
        0,
        Number.MAX_SAFE_INTEGER,
        payoutUnits,
        winnerUnits
      );

    if (solution) {
      break;
    }
  }

  if (!solution) {
    return {
      places: [
        roundedPot,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0
      ],
      payoutPot:
        roundedPot,
      removedRemainder
    };
  }

  return {
    places:
      solution.values.map(
        (value) =>
          value * 5
      ),
    payoutPot:
      roundedPot,
    removedRemainder
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
  finaleRegistrations = [],
  finaleQualifications = []
}) => {
  const declinedIds = new Set(declinedFinalists.map(item => item.player_id));
  const confirmedIds = new Set(finaleRegistrations
    .filter(item => item.status === 'confirmed')
    .map(item => item.player_id));
  const byId = new Map(ranking.map(player => [player.id, player]));
  const frozen = finaleQualifications.length > 0;
  const qualifications = frozen
    ? [...finaleQualifications].sort((a, b) => a.rank_position - b.rank_position)
    : ranking.slice(0, MAX_FINALISTS + MAX_WAITLIST).map((player, index) => ({
        player_id: player.id,
        rank_position: index + 1,
        qualification_type: index < MAX_FINALISTS ? 'finalist' : 'waitlist'
      }));
  const entries = qualifications.map(q => ({ ...q, player: byId.get(q.player_id) }))
    .filter(q => q.player);
  const baseFinalists = entries.filter(q => q.qualification_type === 'finalist').map(q => q.player);
  const reservePool = entries.filter(q => q.qualification_type === 'waitlist').map(q => q.player);
  const availableReserves = reservePool.filter(player => !declinedIds.has(player.id));
  const priority = q => confirmedIds.has(q.player_id) ? 0 : q.qualification_type === 'finalist' ? 1 : 2;
  const selectedIds = new Set(entries.filter(q => !declinedIds.has(q.player_id))
    .sort((a, b) => priority(a) - priority(b) || a.rank_position - b.rank_position)
    .slice(0, MAX_FINALISTS).map(q => q.player_id));
  const activeBase = baseFinalists.filter(player => selectedIds.has(player.id));
  const replacements = availableReserves.filter(player => selectedIds.has(player.id))
    .sort((a, b) => Number(confirmedIds.has(b.id)) - Number(confirmedIds.has(a.id)));
  return {
    baseFinalists,
    reservePool,
    availableReserves,
    finalList: [...activeBase, ...replacements],
    nextUp: availableReserves.find(player => !selectedIds.has(player.id)) || null
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