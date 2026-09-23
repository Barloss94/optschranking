/**
 * Berekent de basispunten voor een speler binnen één Team Event-toernooi.
 *
 * Puntentelling:
 * - Laatste plaats krijgt 1 punt.
 * - Elke plaats hoger krijgt 1 punt extra.
 *
 * Voorbeeld bij 18 spelers:
 * positie 1  = 18 punten
 * positie 2  = 17 punten
 * positie 18 = 1 punt
 */
export function calculateTeamEventBasePoints(
  finishPosition,
  tournamentPlayerCount
) {
  const position = Number(finishPosition);
  const playerCount = Number(tournamentPlayerCount);

  if (!Number.isInteger(position) || position < 1) {
    throw new Error("De eindpositie moet een geheel getal vanaf 1 zijn.");
  }

  if (!Number.isInteger(playerCount) || playerCount < 1) {
    throw new Error(
      "Het aantal deelnemers aan het toernooi moet minimaal 1 zijn."
    );
  }

  if (position > playerCount) {
    throw new Error(
      "De eindpositie kan niet hoger zijn dan het aantal deelnemers."
    );
  }

  return playerCount - position + 1;
}

/**
 * Berekent de bonuspunten voor de top 6.
 *
 * Positie 1 = 6 bonuspunten
 * Positie 2 = 5 bonuspunten
 * Positie 3 = 4 bonuspunten
 * Positie 4 = 3 bonuspunten
 * Positie 5 = 2 bonuspunten
 * Positie 6 = 1 bonuspunt
 */
export function calculateTeamEventBonusPoints(finishPosition) {
  const position = Number(finishPosition);

  if (!Number.isInteger(position) || position < 1) {
    throw new Error("De eindpositie moet een geheel getal vanaf 1 zijn.");
  }

  return position <= 6 ? 7 - position : 0;
}

/**
 * Berekent alle punten van één speler binnen zijn eigen toernooi.
 */
export function calculateTeamEventPlayerResult({
  finishPosition,
  tournamentPlayerCount,
}) {
  const basePoints = calculateTeamEventBasePoints(
    finishPosition,
    tournamentPlayerCount
  );

  const bonusPoints = calculateTeamEventBonusPoints(finishPosition);
  const totalPoints = basePoints + bonusPoints;

  return {
    finishPosition: Number(finishPosition),
    tournamentPlayerCount: Number(tournamentPlayerCount),
    basePoints,
    bonusPoints,
    totalPoints,
  };
}

/**
 * Berekent de gezamenlijke score van een duo.
 *
 * Beide spelers ontvangen uiteindelijk dezelfde rankingpunten.
 */
export function calculateTeamEventTeamResult({
  playerOneResult,
  playerTwoResult,
  doublePoints = false,
}) {
  if (!playerOneResult || !playerTwoResult) {
    throw new Error("Beide spelers van het duo moeten een uitslag hebben.");
  }

  const playerOnePoints = Number(playerOneResult.totalPoints);
  const playerTwoPoints = Number(playerTwoResult.totalPoints);

  if (!Number.isFinite(playerOnePoints) || playerOnePoints < 0) {
    throw new Error("De punten van speler 1 zijn ongeldig.");
  }

  if (!Number.isFinite(playerTwoPoints) || playerTwoPoints < 0) {
    throw new Error("De punten van speler 2 zijn ongeldig.");
  }

  const teamScore = playerOnePoints + playerTwoPoints;
  const multiplier = doublePoints ? 2 : 1;
  const rankingPoints = teamScore * multiplier;

  return {
    playerOnePoints,
    playerTwoPoints,
    teamScore,
    multiplier,
    rankingPoints,
  };
}

/**
 * Berekent een volledig duo in één keer.
 */
export function calculateCompleteTeamEventTeam({
  playerOne,
  playerTwo,
  doublePoints = false,
}) {
  const playerOneResult = calculateTeamEventPlayerResult({
    finishPosition: playerOne.finishPosition,
    tournamentPlayerCount: playerOne.tournamentPlayerCount,
  });

  const playerTwoResult = calculateTeamEventPlayerResult({
    finishPosition: playerTwo.finishPosition,
    tournamentPlayerCount: playerTwo.tournamentPlayerCount,
  });

  const teamResult = calculateTeamEventTeamResult({
    playerOneResult,
    playerTwoResult,
    doublePoints,
  });

  return {
    playerOne: {
      ...playerOne,
      ...playerOneResult,
      rankingPoints: teamResult.rankingPoints,
    },
    playerTwo: {
      ...playerTwo,
      ...playerTwoResult,
      rankingPoints: teamResult.rankingPoints,
    },
    teamScore: teamResult.teamScore,
    multiplier: teamResult.multiplier,
    rankingPoints: teamResult.rankingPoints,
  };
}

/**
 * Sorteert duo's op gezamenlijke score.
 *
 * Bij een gelijke teamscore krijgen duo's voorlopig dezelfde positie.
 * De eerstvolgende positie wordt overgeslagen.
 *
 * Voorbeeld:
 * 1, 2, 2, 4
 */
export function rankTeamEventTeams(teams) {
  if (!Array.isArray(teams)) {
    throw new Error("De teams moeten als lijst worden aangeleverd.");
  }

  const sortedTeams = [...teams].sort((teamA, teamB) => {
    const scoreA = Number(teamA.teamScore ?? 0);
    const scoreB = Number(teamB.teamScore ?? 0);

    return scoreB - scoreA;
  });

  let previousScore = null;
  let previousPosition = 0;

  return sortedTeams.map((team, index) => {
    const teamScore = Number(team.teamScore ?? 0);

    const finalPosition =
      previousScore !== null && teamScore === previousScore
        ? previousPosition
        : index + 1;

    previousScore = teamScore;
    previousPosition = finalPosition;

    return {
      ...team,
      finalPosition,
    };
  });
}

/**
 * Maakt de twee records die later in round_results worden opgeslagen.
 *
 * Beide spelers krijgen:
 * - dezelfde teameindpositie;
 * - dezelfde gezamenlijke rankingpunten;
 * - eventueel het dubbele aantal punten.
 */
export function createTeamEventRoundResults({
  seasonId,
  roundId,
  roundNumber,
  team,
}) {
  if (!team?.playerOne?.playerId || !team?.playerTwo?.playerId) {
    throw new Error("Voor beide spelers is een playerId verplicht.");
  }

  if (!Number.isInteger(team.finalPosition) || team.finalPosition < 1) {
    throw new Error("Het duo heeft nog geen geldige eindpositie.");
  }

  if (!Number.isFinite(Number(team.rankingPoints))) {
    throw new Error("Het duo heeft nog geen geldige rankingpunten.");
  }

  const points = Number(team.rankingPoints);

  return [
    {
      season_id: seasonId,
      round_id: roundId,
      round_number: roundNumber,
      position: team.finalPosition,
      player_id: team.playerOne.playerId,
      player_name: team.playerOne.playerName ?? null,
      points,
      prize: 0,
    },
    {
      season_id: seasonId,
      round_id: roundId,
      round_number: roundNumber,
      position: team.finalPosition,
      player_id: team.playerTwo.playerId,
      player_name: team.playerTwo.playerName ?? null,
      points,
      prize: 0,
    },
  ];
}