import { extractPlayerNamesFromCSV } from '../utils/csv';
import { normalizeName } from '../utils/formatters';
import {
  getTeamEventTournamentPrizes
} from '../utils/rankingCalculations';

function parseCsvLine(line, delimiter) {
  const values = [];
  let current = '';
  let insideQuotes = false;

  for (
    let index = 0;
    index < line.length;
    index += 1
  ) {
    const character = line[index];
    const nextCharacter = line[index + 1];

    if (character === '"') {
      if (
        insideQuotes &&
        nextCharacter === '"'
      ) {
        current += '"';
        index += 1;
      } else {
        insideQuotes = !insideQuotes;
      }

      continue;
    }

    if (
      character === delimiter &&
      !insideQuotes
    ) {
      values.push(current.trim());
      current = '';
      continue;
    }

    current += character;
  }

  values.push(current.trim());

  return values;
}

function detectCsvDelimiter(firstLine) {
  const delimiters = [',', ';', '\t'];

  let selectedDelimiter = ',';
  let highestColumnCount = 0;

  for (const delimiter of delimiters) {
    const columnCount = parseCsvLine(
      firstLine,
      delimiter
    ).length;

    if (columnCount > highestColumnCount) {
      selectedDelimiter = delimiter;
      highestColumnCount = columnCount;
    }
  }

  return selectedDelimiter;
}

function normalizeCsvHeader(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/-/g, '_');
}

function getCsvValue(
  row,
  possibleHeaders
) {
  for (const header of possibleHeaders) {
    const value = row[header];

    if (String(value || '').trim()) {
      return String(value).trim();
    }
  }

  return '';
}

function parseTeamEventTeamsCSV(
  csvText
) {
  const lines = String(csvText || '')
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
    .filter(
      (line) => line.trim() !== ''
    );

  if (lines.length < 2) {
    throw new Error(
      'De duo-CSV bevat geen gegevensregels.'
    );
  }

  const delimiter =
    detectCsvDelimiter(lines[0]);

  const headers = parseCsvLine(
    lines[0],
    delimiter
  ).map(normalizeCsvHeader);

  const headerGroups = {
    teamNumber: [
      'team_number',
      'teamnummer',
      'team_no',
      'team'
    ],
    teamName: [
      'team_name',
      'teamnaam',
      'team_naam',
      'naam'
    ],
    player1: [
      'player_1',
      'player1',
      'speler_1',
      'speler1',
      'naam_speler_1',
      'naam_speler1',
      'toernooi_1',
      'toernooi1'
    ],
    player2: [
      'player_2',
      'player2',
      'speler_2',
      'speler2',
      'naam_speler_2',
      'naam_speler2',
      'toernooi_2',
      'toernooi2'
    ]
  };

  const requiredGroups = [
    [
      'speler_1',
      headerGroups.player1
    ],
    [
      'speler_2',
      headerGroups.player2
    ]
  ];

  for (
    const [
      label,
      possibleHeaders
    ] of requiredGroups
  ) {
    const headerExists =
      possibleHeaders.some(
        (header) =>
          headers.includes(header)
      );

    if (!headerExists) {
      throw new Error(
        `Verplichte CSV-kolom ontbreekt: ${label}.`
      );
    }
  }

  return lines
    .slice(1)
    .map((line, index) => {
      const values = parseCsvLine(
        line,
        delimiter
      );

      const row = headers.reduce(
        (
          result,
          header,
          headerIndex
        ) => {
          result[header] =
            values[headerIndex] || '';

          return result;
        },
        {}
      );

      return {
        csvRowNumber: index + 2,
        teamNumber:
          getCsvValue(
            row,
            headerGroups.teamNumber
          ) || String(index + 1),
        teamName: getCsvValue(
          row,
          headerGroups.teamName
        ),
        player1Name: getCsvValue(
          row,
          headerGroups.player1
        ),
        player2Name: getCsvValue(
          row,
          headerGroups.player2
        )
      };
    });
}

/**
 * Geeft de bonuspunten voor een eindpositie.
 *
 * 1e plaats: 6
 * 2e plaats: 5
 * 3e plaats: 4
 * 4e plaats: 3
 * 5e plaats: 2
 * 6e plaats: 1
 */
export function getTeamEventPositionBonus(
  position
) {
  const numericPosition =
    Number(position);

  if (
    !Number.isInteger(
      numericPosition
    ) ||
    numericPosition < 1 ||
    numericPosition > 6
  ) {
    return 0;
  }

  return 7 - numericPosition;
}

/**
 * Berekent de individuele Team Event-punten.
 *
 * base_points:
 * playerCount - finishPosition + 1
 *
 * total_points:
 * basePoints + bonusPoints
 */
export function calculateTeamEventPlayerPoints({
  finishPosition,
  playerCount
}) {
  const numericPosition =
    Number(finishPosition);

  const numericPlayerCount =
    Number(playerCount);

  if (
    !Number.isInteger(
      numericPosition
    ) ||
    !Number.isInteger(
      numericPlayerCount
    ) ||
    numericPosition < 1 ||
    numericPlayerCount < 1 ||
    numericPosition >
      numericPlayerCount
  ) {
    return {
      basePoints: 0,
      bonusPoints: 0,
      totalPoints: 0
    };
  }

  const basePoints =
    numericPlayerCount -
    numericPosition +
    1;

  const bonusPoints =
    getTeamEventPositionBonus(
      numericPosition
    );

  return {
    basePoints,
    bonusPoints,
    totalPoints:
      basePoints + bonusPoints
  };
}

/**
 * Zorgt ervoor dat Toernooi 1 en Toernooi 2
 * voor een Team Event bestaan.
 */
export async function ensureTeamEventTournaments({
  supabase,
  seasonId,
  roundId
}) {
  if (!supabase) {
    throw new Error(
      'Supabase-client ontbreekt.'
    );
  }

  if (!seasonId) {
    throw new Error(
      'Season ID ontbreekt.'
    );
  }

  if (!roundId) {
    throw new Error(
      'Round ID ontbreekt.'
    );
  }

  const tournamentRows = [
    {
      season_id: seasonId,
      round_id: roundId,
      tournament_number: 1,
      name: 'Toernooi 1'
    },
    {
      season_id: seasonId,
      round_id: roundId,
      tournament_number: 2,
      name: 'Toernooi 2'
    }
  ];

  const {
    error: upsertError
  } = await supabase
    .from('team_event_tournaments')
    .upsert(tournamentRows, {
      onConflict:
        'round_id,tournament_number',
      ignoreDuplicates: true
    });

  if (upsertError) {
    throw upsertError;
  }

  const {
    data,
    error
  } = await supabase
    .from('team_event_tournaments')
    .select('*')
    .eq('round_id', roundId)
    .order(
      'tournament_number',
      {
        ascending: true
      }
    );

  if (error) {
    throw error;
  }

  return data || [];
}

/**
 * Zoekt een speler op basis van de naam
 * uit een Pokerrrr 2 CSV.
 *
 * Er wordt gekeken naar:
 * - players.name
 * - players.preferred_name
 * - player_aliases.alias_name
 */
export function findTeamEventPlayerByCsvName({
  csvName,
  players,
  playerAliases
}) {
  const normalizedCsvName =
    normalizeName(csvName);

  if (!normalizedCsvName) {
    return null;
  }

  const directPlayer = (
    players || []
  ).find(
    (player) =>
      normalizeName(
        player.name
      ) === normalizedCsvName ||
      normalizeName(
        player.preferred_name
      ) === normalizedCsvName
  );

  if (directPlayer) {
    return directPlayer;
  }

  const alias = (
    playerAliases || []
  ).find(
    (item) =>
      normalizeName(
        item.alias_name
      ) === normalizedCsvName
  );

  if (!alias) {
    return null;
  }

  return (
    (players || []).find(
      (player) =>
        player.id ===
        alias.player_id
    ) || null
  );
}

/**
 * Geeft de zichtbare spelersnaam terug.
 */
export function getTeamEventPlayerName(
  player
) {
  return (
    player?.preferred_name ||
    player?.name ||
    'Onbekende speler'
  );
}

/**
 * Importeert de volledige duo-indeling
 * uit een CSV-bestand.
 *
 * Ondersteunde kolommen:
 * - team_number / teamnummer
 * - team_name / teamnaam
 * - player_1 / speler_1
 * - player_2 / speler_2
 *
 * Speler 1 wordt gekoppeld aan Toernooi 1.
 * Speler 2 wordt gekoppeld aan Toernooi 2.
 */
export async function importTeamEventTeamsCSV({
  supabase,
  seasonId,
  round,
  file,
  players,
  playerAliases
}) {
  if (!supabase) {
    throw new Error(
      'Supabase-client ontbreekt.'
    );
  }

  if (
    !seasonId ||
    !round?.id
  ) {
    throw new Error(
      'De Team Event-ronde ontbreekt.'
    );
  }

  if (!file) {
    throw new Error(
      'Selecteer eerst een duo-CSV.'
    );
  }

  const tournaments =
    await ensureTeamEventTournaments({
      supabase,
      seasonId,
      roundId: round.id
    });

  const tournament1 =
    tournaments.find(
      (tournament) =>
        Number(
          tournament.tournament_number
        ) === 1
    );

  const tournament2 =
    tournaments.find(
      (tournament) =>
        Number(
          tournament.tournament_number
        ) === 2
    );

  if (
    !tournament1 ||
    !tournament2
  ) {
    throw new Error(
      'Toernooi 1 en Toernooi 2 konden niet worden gevonden.'
    );
  }

  const csvText =
    await file.text();

  const csvRows =
    parseTeamEventTeamsCSV(
      csvText
    );

  const validationErrors = [];
  const seenTeamNumbers =
    new Set();
  const seenPlayerIds =
    new Set();

  const resolvedTeams =
    csvRows.map((row) => {
      const teamNumber =
        Number(row.teamNumber);

      if (
        !Number.isInteger(
          teamNumber
        ) ||
        teamNumber < 1
      ) {
        validationErrors.push(
          `Regel ${row.csvRowNumber}: ongeldig teamnummer.`
        );
      } else if (
        seenTeamNumbers.has(
          teamNumber
        )
      ) {
        validationErrors.push(
          `Regel ${row.csvRowNumber}: teamnummer ${teamNumber} komt meerdere keren voor.`
        );
      } else {
        seenTeamNumbers.add(
          teamNumber
        );
      }

      if (!row.player1Name) {
        validationErrors.push(
          `Regel ${row.csvRowNumber}: speler voor Toernooi 1 ontbreekt.`
        );
      }

      if (!row.player2Name) {
        validationErrors.push(
          `Regel ${row.csvRowNumber}: speler voor Toernooi 2 ontbreekt.`
        );
      }

      const player1 =
        findTeamEventPlayerByCsvName({
          csvName:
            row.player1Name,
          players,
          playerAliases
        });

      const player2 =
        findTeamEventPlayerByCsvName({
          csvName:
            row.player2Name,
          players,
          playerAliases
        });

      if (
        row.player1Name &&
        !player1
      ) {
        validationErrors.push(
          `Regel ${row.csvRowNumber}: speler "${row.player1Name}" is niet gevonden.`
        );
      }

      if (
        row.player2Name &&
        !player2
      ) {
        validationErrors.push(
          `Regel ${row.csvRowNumber}: speler "${row.player2Name}" is niet gevonden.`
        );
      }

      if (
        player1 &&
        player2 &&
        player1.id === player2.id
      ) {
        validationErrors.push(
          `Regel ${row.csvRowNumber}: dezelfde speler staat in beide toernooien.`
        );
      }

      for (
        const player of [
          player1,
          player2
        ]
      ) {
        if (!player) {
          continue;
        }

        if (
          seenPlayerIds.has(
            player.id
          )
        ) {
          validationErrors.push(
            `Regel ${row.csvRowNumber}: ${getTeamEventPlayerName(
              player
            )} staat in meerdere duo's.`
          );
        } else {
          seenPlayerIds.add(
            player.id
          );
        }
      }

      const swap =
        Math.random() < 0.5;

      return {
        teamNumber,
        teamName:
          String(
            row.teamName || ''
          ).trim() || null,
        player1: swap
          ? player2
          : player1,
        player2: swap
          ? player1
          : player2
      };
    });

  if (
    validationErrors.length > 0
  ) {
    throw new Error(
      [
        'De duo-CSV is niet geïmporteerd:',
        '',
        ...validationErrors.map(
          (message) =>
            `- ${message}`
        )
      ].join('\n')
    );
  }

  const {
    error: deletePlayersError
  } = await supabase
    .from('team_event_players')
    .delete()
    .eq(
      'round_id',
      round.id
    );

  if (deletePlayersError) {
    throw deletePlayersError;
  }

  const {
    error: deleteTeamsError
  } = await supabase
    .from('team_event_teams')
    .delete()
    .eq(
      'round_id',
      round.id
    );

  if (deleteTeamsError) {
    throw deleteTeamsError;
  }

  const teamRows =
    resolvedTeams.map(
      (team) => ({
        season_id: seasonId,
        round_id: round.id,
        team_number:
          team.teamNumber,
        team_name:
          team.teamName,
        base_points: 0,
        ranking_points: 0,
        final_position: null
      })
    );

  const {
    data: insertedTeams,
    error: insertTeamsError
  } = await supabase
    .from('team_event_teams')
    .insert(teamRows)
    .select('*');

  if (insertTeamsError) {
    throw insertTeamsError;
  }

  const insertedTeamByNumber =
    new Map(
      (insertedTeams || []).map(
        (team) => [
          Number(
            team.team_number
          ),
          team
        ]
      )
    );

  const teamPlayerRows =
    resolvedTeams.flatMap(
      (team) => {
        const insertedTeam =
          insertedTeamByNumber.get(
            team.teamNumber
          );

        if (!insertedTeam) {
          throw new Error(
            `Team ${team.teamNumber} kon na het opslaan niet worden gevonden.`
          );
        }

        return [
          {
            season_id: seasonId,
            round_id: round.id,
            team_id:
              insertedTeam.id,
            tournament_id:
              tournament1.id,
            player_id:
              team.player1.id,
            finish_position:
              null,
            base_points: 0,
            bonus_points: 0,
            total_points: 0,
            prize: 0
          },
          {
            season_id: seasonId,
            round_id: round.id,
            team_id:
              insertedTeam.id,
            tournament_id:
              tournament2.id,
            player_id:
              team.player2.id,
            finish_position:
              null,
            base_points: 0,
            bonus_points: 0,
            total_points: 0,
            prize: 0
          }
        ];
      }
    );

  const {
    error: insertPlayersError
  } = await supabase
    .from('team_event_players')
    .insert(teamPlayerRows);

  if (insertPlayersError) {
    throw insertPlayersError;
  }

  const importedPlayerIds = [
    ...new Set(
      teamPlayerRows.map(
        (item) => item.player_id
      )
    )
  ];

  const {
    data: existingRoundEntries,
    error: existingEntriesError
  } = await supabase
    .from('round_entries')
    .select(
      'id, player_id, status'
    )
    .eq(
      'round_id',
      round.id
    )
    .in(
      'player_id',
      importedPlayerIds
    );

  if (existingEntriesError) {
    throw existingEntriesError;
  }

  const existingEntryByPlayerId =
    new Map(
      (
        existingRoundEntries || []
      ).map((entry) => [
        entry.player_id,
        entry
      ])
    );

  const newRoundEntryRows = [];

  for (
    const playerId of importedPlayerIds
  ) {
    const existingEntry =
      existingEntryByPlayerId.get(
        playerId
      );

    if (!existingEntry) {
      newRoundEntryRows.push({
        season_id: seasonId,
        round_id: round.id,
        player_id: playerId,
        status: 'admin_added'
      });

      continue;
    }

    if (
      existingEntry.status ===
      'cancelled'
    ) {
      const {
        error: reactivateEntryError
      } = await supabase
        .from('round_entries')
        .update({
          status: 'admin_added',
          registered_at:
            new Date().toISOString()
        })
        .eq(
          'id',
          existingEntry.id
        );

      if (reactivateEntryError) {
        throw reactivateEntryError;
      }
    }
  }

  if (
    newRoundEntryRows.length > 0
  ) {
    const {
      error: insertEntriesError
    } = await supabase
      .from('round_entries')
      .insert(
        newRoundEntryRows
      );

    if (insertEntriesError) {
      throw insertEntriesError;
    }
  }

  const {
    data: allRoundPlayers,
    error: roundPlayersError
  } = await supabase
    .from('round_entries')
    .select('id')
    .eq(
      'round_id',
      round.id
    )
    .neq(
      'status',
      'cancelled'
    );

  if (roundPlayersError) {
    throw roundPlayersError;
  }

  const {
    error: roundUpdateError
  } = await supabase
    .from('rounds')
    .update({
      player_count:
        (
          allRoundPlayers || []
        ).length
    })
    .eq(
      'id',
      round.id
    );

  if (roundUpdateError) {
    throw roundUpdateError;
  }

  await recalculateTeamEventTeams({
    supabase,
    round
  });

  return {
    teamCount:
      resolvedTeams.length,
    playerCount:
      importedPlayerIds.length
  };
}

/**
 * Maakt of wijzigt een duo.
 */
export async function saveTeamEventTeam({
  supabase,
  seasonId,
  round,
  teamId = null,
  teamNumber,
  teamName = null,
  player1Id,
  player2Id
}) {
  if (!supabase) {
    throw new Error(
      'Supabase-client ontbreekt.'
    );
  }

  if (
    !seasonId ||
    !round?.id
  ) {
    throw new Error(
      'De Team Event-ronde ontbreekt.'
    );
  }

  const numericTeamNumber =
    Number(teamNumber);

  if (
    !Number.isInteger(
      numericTeamNumber
    ) ||
    numericTeamNumber < 1
  ) {
    throw new Error(
      'Het teamnummer moet minimaal 1 zijn.'
    );
  }

  if (
    !player1Id ||
    !player2Id
  ) {
    throw new Error(
      'Selecteer voor beide toernooien een speler.'
    );
  }

  if (
    player1Id === player2Id
  ) {
    throw new Error(
      'Een duo moet uit twee verschillende spelers bestaan.'
    );
  }

  const tournaments =
    await ensureTeamEventTournaments({
      supabase,
      seasonId,
      roundId: round.id
    });

  const tournament1 =
    tournaments.find(
      (tournament) =>
        Number(
          tournament.tournament_number
        ) === 1
    );

  const tournament2 =
    tournaments.find(
      (tournament) =>
        Number(
          tournament.tournament_number
        ) === 2
    );

  if (
    !tournament1 ||
    !tournament2
  ) {
    throw new Error(
      'Toernooi 1 en Toernooi 2 konden niet worden gevonden.'
    );
  }

  let savedTeam;

  if (teamId) {
    const {
      data,
      error
    } = await supabase
      .from('team_event_teams')
      .update({
        team_number:
          numericTeamNumber,
        team_name:
          String(
            teamName || ''
          ).trim() || null
      })
      .eq('id', teamId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    savedTeam = data;

    const {
      error: deletePlayersError
    } = await supabase
      .from('team_event_players')
      .delete()
      .eq(
        'team_id',
        teamId
      );

    if (deletePlayersError) {
      throw deletePlayersError;
    }
  } else {
    const {
      data,
      error
    } = await supabase
      .from('team_event_teams')
      .insert({
        season_id:
          seasonId,
        round_id:
          round.id,
        team_number:
          numericTeamNumber,
        team_name:
          String(
            teamName || ''
          ).trim() || null,
        base_points: 0,
        ranking_points: 0,
        final_position: null
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    savedTeam = data;
  }

  const teamPlayers = [
    {
      season_id: seasonId,
      round_id: round.id,
      team_id: savedTeam.id,
      tournament_id:
        tournament1.id,
      player_id: player1Id,
      finish_position: null,
      base_points: 0,
      bonus_points: 0,
      total_points: 0,
      prize: 0
    },
    {
      season_id: seasonId,
      round_id: round.id,
      team_id: savedTeam.id,
      tournament_id:
        tournament2.id,
      player_id: player2Id,
      finish_position: null,
      base_points: 0,
      bonus_points: 0,
      total_points: 0,
      prize: 0
    }
  ];

  const {
    error: playerInsertError
  } = await supabase
    .from('team_event_players')
    .insert(teamPlayers);

  if (playerInsertError) {
    throw playerInsertError;
  }

  const playerIds = [
    player1Id,
    player2Id
  ];

  const {
    data: existingRoundEntries,
    error: existingEntriesError
  } = await supabase
    .from('round_entries')
    .select(
      'id, player_id, status'
    )
    .eq(
      'round_id',
      round.id
    )
    .in(
      'player_id',
      playerIds
    );

  if (existingEntriesError) {
    throw existingEntriesError;
  }

  const existingEntryByPlayerId =
    new Map(
      (
        existingRoundEntries || []
      ).map((entry) => [
        entry.player_id,
        entry
      ])
    );

  const newRoundEntryRows = [];

  for (const playerId of playerIds) {
    const existingEntry =
      existingEntryByPlayerId.get(
        playerId
      );

    if (!existingEntry) {
      newRoundEntryRows.push({
        season_id: seasonId,
        round_id: round.id,
        player_id: playerId,
        status: 'admin_added'
      });

      continue;
    }

    if (
      existingEntry.status ===
      'cancelled'
    ) {
      const {
        error: reactivateEntryError
      } = await supabase
        .from('round_entries')
        .update({
          status: 'admin_added',
          registered_at:
            new Date().toISOString()
        })
        .eq(
          'id',
          existingEntry.id
        );

      if (reactivateEntryError) {
        throw reactivateEntryError;
      }
    }
  }

  if (
    newRoundEntryRows.length > 0
  ) {
    const {
      error: insertEntriesError
    } = await supabase
      .from('round_entries')
      .insert(
        newRoundEntryRows
      );

    if (insertEntriesError) {
      throw insertEntriesError;
    }
  }

  const {
    data: allRoundPlayers,
    error: roundPlayersError
  } = await supabase
    .from('round_entries')
    .select('id')
    .eq(
      'round_id',
      round.id
    )
    .neq(
      'status',
      'cancelled'
    );

  if (roundPlayersError) {
    throw roundPlayersError;
  }

  const {
    error: roundUpdateError
  } = await supabase
    .from('rounds')
    .update({
      player_count:
        (
          allRoundPlayers || []
        ).length
    })
    .eq(
      'id',
      round.id
    );

  if (roundUpdateError) {
    throw roundUpdateError;
  }

  await recalculateTeamEventTeams({
    supabase,
    round
  });

  return savedTeam;
}

/**
 * Verwijdert een volledig duo.
 */
export async function deleteTeamEventTeam({
  supabase,
  round,
  teamId
}) {
  if (
    !supabase ||
    !round?.id ||
    !teamId
  ) {
    return;
  }

  const {
    error
  } = await supabase
    .from('team_event_teams')
    .delete()
    .eq('id', teamId)
    .eq(
      'round_id',
      round.id
    );

  if (error) {
    throw error;
  }

  const {
    data: allRoundPlayers,
    error: roundPlayersError
  } = await supabase
    .from('team_event_players')
    .select('id')
    .eq(
      'round_id',
      round.id
    );

  if (roundPlayersError) {
    throw roundPlayersError;
  }

  const {
    error: roundUpdateError
  } = await supabase
    .from('rounds')
    .update({
      player_count:
        (
          allRoundPlayers || []
        ).length
    })
    .eq(
      'id',
      round.id
    );

  if (roundUpdateError) {
    throw roundUpdateError;
  }

  await recalculateTeamEventTeams({
    supabase,
    round
  });
}

/**
 * Importeert één CSV voor Toernooi 1 of Toernooi 2.
 */
export async function importTeamEventTournamentCSV({
  supabase,
  seasonId,
  round,
  tournament,
  file,
  players,
  playerAliases
}) {
  if (!supabase) {
    throw new Error(
      'Supabase-client ontbreekt.'
    );
  }

  if (
    !seasonId ||
    !round?.id
  ) {
    throw new Error(
      'De Team Event-ronde ontbreekt.'
    );
  }

  if (!tournament?.id) {
    throw new Error(
      'Het Team Event-toernooi ontbreekt.'
    );
  }

  if (!file) {
    throw new Error(
      'Selecteer eerst een CSV-bestand.'
    );
  }

  const fileText =
    await file.text();

  const csvNames =
    extractPlayerNamesFromCSV(
      fileText
    );

  if (
    csvNames.length === 0
  ) {
    throw new Error(
      'Er zijn geen spelers in het CSV-bestand gevonden.'
    );
  }

  const {
    data: allRoundAssignments,
    error: allAssignmentsError
  } = await supabase
    .from('team_event_players')
    .select('id')
    .eq(
      'round_id',
      round.id
    );

  if (allAssignmentsError) {
    throw allAssignmentsError;
  }

  const totalTeamEventPlayers =
    (
      allRoundAssignments || []
    ).length;

  const tournamentPrizes =
    getTeamEventTournamentPrizes(
      totalTeamEventPlayers,
      csvNames.length
    );

  const {
    data: tournamentAssignments,
    error: assignmentError
  } = await supabase
    .from('team_event_players')
    .select('*')
    .eq(
      'round_id',
      round.id
    )
    .eq(
      'tournament_id',
      tournament.id
    );

  if (assignmentError) {
    throw assignmentError;
  }

  const assignments =
    tournamentAssignments || [];

  const resolvedResults = [];
  const unknownPlayers = [];
  const unassignedPlayers = [];

  const duplicatePlayerIds =
    new Set();

  const seenPlayerIds =
    new Set();

  for (
    let index = 0;
    index < csvNames.length;
    index += 1
  ) {
    const csvName =
      csvNames[index];

    const player =
      findTeamEventPlayerByCsvName({
        csvName,
        players,
        playerAliases
      });

    if (!player) {
      unknownPlayers.push(
        csvName
      );

      continue;
    }

    if (
      seenPlayerIds.has(
        player.id
      )
    ) {
      duplicatePlayerIds.add(
        player.id
      );

      continue;
    }

    seenPlayerIds.add(
      player.id
    );

    const assignment =
      assignments.find(
        (item) =>
          item.player_id ===
          player.id
      );

    if (!assignment) {
      unassignedPlayers.push(
        getTeamEventPlayerName(
          player
        )
      );

      continue;
    }

    const finishPosition =
      index + 1;

    const {
      basePoints,
      bonusPoints,
      totalPoints
    } =
      calculateTeamEventPlayerPoints({
        finishPosition,
        playerCount:
          csvNames.length
      });

    resolvedResults.push({
      assignment,
      player,
      finishPosition,
      basePoints,
      bonusPoints,
      totalPoints,
      prize:
        tournamentPrizes[
          finishPosition - 1
        ] || 0
    });
  }

  if (
    unknownPlayers.length > 0
  ) {
    throw new Error(
      [
        'De volgende CSV-spelers zijn niet gevonden:',
        ...unknownPlayers.map(
          (name) =>
            `- ${name}`
        )
      ].join('\n')
    );
  }

  if (
    duplicatePlayerIds.size > 0
  ) {
    const duplicateNames =
      Array.from(
        duplicatePlayerIds
      ).map((playerId) => {
        const player = (
          players || []
        ).find(
          (item) =>
            item.id === playerId
        );

        return getTeamEventPlayerName(
          player
        );
      });

    throw new Error(
      [
        'De volgende spelers staan meerdere keren in de CSV:',
        ...duplicateNames.map(
          (name) =>
            `- ${name}`
        )
      ].join('\n')
    );
  }

  if (
    unassignedPlayers.length > 0
  ) {
    throw new Error(
      [
        `De volgende spelers zijn niet gekoppeld aan ${tournament.name}:`,
        ...unassignedPlayers.map(
          (name) =>
            `- ${name}`
        ),
        '',
        'Maak eerst de duo-indeling compleet.'
      ].join('\n')
    );
  }

  const {
    error: resetError
  } = await supabase
    .from('team_event_players')
    .update({
      finish_position: null,
      base_points: 0,
      bonus_points: 0,
      total_points: 0,
      prize: 0
    })
    .eq(
      'round_id',
      round.id
    )
    .eq(
      'tournament_id',
      tournament.id
    );

  if (resetError) {
    throw resetError;
  }

  for (
    const result of resolvedResults
  ) {
    const {
      error
    } = await supabase
      .from('team_event_players')
      .update({
        finish_position:
          result.finishPosition,
        base_points:
          result.basePoints,
        bonus_points:
          result.bonusPoints,
        total_points:
          result.totalPoints,
        prize:
          result.prize
      })
      .eq(
        'id',
        result.assignment.id
      );

    if (error) {
      throw error;
    }
  }

  const {
    error: tournamentUpdateError
  } = await supabase
    .from('team_event_tournaments')
    .update({
      player_count:
        csvNames.length
    })
    .eq(
      'id',
      tournament.id
    );

  if (tournamentUpdateError) {
    throw tournamentUpdateError;
  }

  const {
    error: roundUpdateError
  } = await supabase
    .from('rounds')
    .update({
      player_count:
        totalTeamEventPlayers
    })
    .eq(
      'id',
      round.id
    );

  if (roundUpdateError) {
    throw roundUpdateError;
  }

  const teams =
    await recalculateTeamEventTeams({
      supabase,
      round
    });

  return {
    tournamentId:
      tournament.id,
    tournamentNumber:
      tournament.tournament_number,
    playerCount:
      csvNames.length,
    importedPlayers:
      resolvedResults.length,
    prizePool:
      tournamentPrizes.reduce(
        (sum, prize) =>
          sum +
          (
            Number(prize) || 0
          ),
        0
      ),
    teams
  };
}

/**
 * Herberekent alle teams van één Team Event.
 */
export async function recalculateTeamEventTeams({
  supabase,
  round
}) {
  if (!supabase) {
    throw new Error(
      'Supabase-client ontbreekt.'
    );
  }

  if (!round?.id) {
    throw new Error(
      'De Team Event-ronde ontbreekt.'
    );
  }

  const {
    data: teams,
    error: teamsError
  } = await supabase
    .from('team_event_teams')
    .select('*')
    .eq(
      'round_id',
      round.id
    )
    .order(
      'team_number',
      {
        ascending: true
      }
    );

  if (teamsError) {
    throw teamsError;
  }

  const {
    data: teamPlayers,
    error: playersError
  } = await supabase
    .from('team_event_players')
    .select('*')
    .eq(
      'round_id',
      round.id
    );

  if (playersError) {
    throw playersError;
  }

  const doublePointsMultiplier =
    round.double_points
      ? 2
      : 1;

  const calculatedTeams = (
    teams || []
  ).map((team) => {
    const members = (
      teamPlayers || []
    ).filter(
      (player) =>
        player.team_id ===
        team.id
    );

    const basePoints =
      members.reduce(
        (sum, player) =>
          sum +
          (
            Number(
              player.total_points
            ) || 0
          ),
        0
      );

    return {
      ...team,
      base_points:
        basePoints,
      ranking_points:
        basePoints *
        doublePointsMultiplier,
      final_position: null
    };
  });

  calculatedTeams.sort(
    (teamA, teamB) => {
      const pointsDifference =
        teamB.ranking_points -
        teamA.ranking_points;

      if (
        pointsDifference !== 0
      ) {
        return pointsDifference;
      }

      return (
        Number(
          teamA.team_number
        ) -
        Number(
          teamB.team_number
        )
      );
    }
  );

  let previousPoints = null;
  let previousPosition = 0;

  const rankedTeams =
    calculatedTeams.map(
      (team, index) => {
        const position =
          previousPoints ===
          team.ranking_points
            ? previousPosition
            : index + 1;

        previousPoints =
          team.ranking_points;

        previousPosition =
          position;

        return {
          ...team,
          final_position:
            position
        };
      }
    );

  for (
    const team of rankedTeams
  ) {
    const {
      error
    } = await supabase
      .from('team_event_teams')
      .update({
        base_points:
          team.base_points,
        ranking_points:
          team.ranking_points,
        final_position:
          team.final_position
      })
      .eq(
        'id',
        team.id
      );

    if (error) {
      throw error;
    }
  }

  return rankedTeams;
}

/**
 * Laadt alle Team Event-gegevens van één ronde.
 */
export async function loadTeamEventRound({
  supabase,
  roundId
}) {
  if (
    !supabase ||
    !roundId
  ) {
    return {
      tournaments: [],
      teams: [],
      teamPlayers: []
    };
  }

  const [
    tournamentResponse,
    teamResponse,
    playerResponse
  ] = await Promise.all([
    supabase
      .from(
        'team_event_tournaments'
      )
      .select('*')
      .eq(
        'round_id',
        roundId
      )
      .order(
        'tournament_number',
        {
          ascending: true
        }
      ),

    supabase
      .from(
        'team_event_teams'
      )
      .select('*')
      .eq(
        'round_id',
        roundId
      )
      .order(
        'final_position',
        {
          ascending: true,
          nullsFirst: false
        }
      )
      .order(
        'team_number',
        {
          ascending: true
        }
      ),

    supabase
      .from(
        'team_event_players'
      )
      .select('*')
      .eq(
        'round_id',
        roundId
      )
  ]);

  if (
    tournamentResponse.error
  ) {
    throw tournamentResponse.error;
  }

  if (
    teamResponse.error
  ) {
    throw teamResponse.error;
  }

  if (
    playerResponse.error
  ) {
    throw playerResponse.error;
  }

  return {
    tournaments:
      tournamentResponse.data ||
      [],
    teams:
      teamResponse.data ||
      [],
    teamPlayers:
      playerResponse.data ||
      []
  };
}