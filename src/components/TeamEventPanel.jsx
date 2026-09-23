import {
  useMemo,
  useState
} from 'react';

import {
  thStyle,
  tdStyle
} from '../styles/tableStyles';

import {
  downloadTeamEventResultsCSV
} from '../utils/csv';

function getPlayerName(player) {
  return (
    player?.preferred_name ||
    player?.name ||
    'Onbekende speler'
  );
}

function getTeamName(team) {
  const customName = String(
    team?.team_name || ''
  ).trim();

  if (customName) {
    return customName;
  }

  return `Team ${team?.team_number || '-'}`;
}

function getTournamentNumber(
  tournament
) {
  return Number(
    tournament?.tournament_number
  );
}

function getTournamentDisplayName(
  tournament
) {
  const number =
    getTournamentNumber(
      tournament
    );

  if (number === 1) {
    return 'Toernooi A';
  }

  if (number === 2) {
    return 'Toernooi B';
  }

  return (
    tournament?.name ||
    'Toernooi'
  );
}

function formatPrize(value) {
  const numericValue =
    Number(value) || 0;

  if (numericValue <= 0) {
    return '-';
  }

  return new Intl.NumberFormat(
    'nl-NL',
    {
      style: 'currency',
      currency: 'EUR'
    }
  ).format(numericValue);
}

function getPlayerForTeamTournament({
  team,
  tournament,
  teamEventPlayers
}) {
  if (
    !team?.id ||
    !tournament?.id
  ) {
    return null;
  }

  return (
    teamEventPlayers.find(
      (item) =>
        item.team_id ===
          team.id &&
        item.tournament_id ===
          tournament.id
    ) || null
  );
}

export default function TeamEventPanel({
  round,
  players = [],
  teamEventTournaments = [],
  teamEventTeams = [],
  teamEventPlayers = [],
  canEnterResults = false,
  onEnsureTournaments,
  onSaveTeam,
  onDeleteTeam,
  onImportTeamsCSV,
  onImportTournamentCSV
}) {
  const [
    teamNumber,
    setTeamNumber
  ] = useState('');

  const [
    teamName,
    setTeamName
  ] = useState('');

  const [
    player1Id,
    setPlayer1Id
  ] = useState('');

  const [
    player2Id,
    setPlayer2Id
  ] = useState('');

  const [
    editingTeamId,
    setEditingTeamId
  ] = useState(null);

  const [
    savingTeam,
    setSavingTeam
  ] = useState(false);

  const [
    importingTeams,
    setImportingTeams
  ] = useState(false);

  const [
    importingTournamentId,
    setImportingTournamentId
  ] = useState(null);

  const [
    ensuringTournaments,
    setEnsuringTournaments
  ] = useState(false);

  const tournaments =
    useMemo(() => {
      return [
        ...teamEventTournaments
      ].sort(
        (a, b) =>
          getTournamentNumber(a) -
          getTournamentNumber(b)
      );
    }, [
      teamEventTournaments
    ]);

  const tournament1 =
    tournaments.find(
      (item) =>
        getTournamentNumber(
          item
        ) === 1
    );

  const tournament2 =
    tournaments.find(
      (item) =>
        getTournamentNumber(
          item
        ) === 2
    );

  const sortedPlayers =
    useMemo(() => {
      return [
        ...players
      ].sort(
        (a, b) =>
          getPlayerName(
            a
          ).localeCompare(
            getPlayerName(b),
            'nl'
          )
      );
    }, [players]);

  const playerById =
    useMemo(() => {
      return new Map(
        players.map(
          (player) => [
            player.id,
            player
          ]
        )
      );
    }, [players]);

  const teamsWithPlayers =
    useMemo(() => {
      return teamEventTeams
        .map((team) => {
          const tournament1Entry =
            tournament1
              ? getPlayerForTeamTournament({
                  team,
                  tournament:
                    tournament1,
                  teamEventPlayers
                })
              : null;

          const tournament2Entry =
            tournament2
              ? getPlayerForTeamTournament({
                  team,
                  tournament:
                    tournament2,
                  teamEventPlayers
                })
              : null;

          return {
            ...team,

            tournament1Entry,

            tournament2Entry,

            player1:
              playerById.get(
                tournament1Entry
                  ?.player_id
              ) || null,

            player2:
              playerById.get(
                tournament2Entry
                  ?.player_id
              ) || null
          };
        })
        .sort(
          (a, b) => {
            const positionA =
              Number(
                a.final_position
              ) ||
              Number.MAX_SAFE_INTEGER;

            const positionB =
              Number(
                b.final_position
              ) ||
              Number.MAX_SAFE_INTEGER;

            if (
              positionA !==
              positionB
            ) {
              return (
                positionA -
                positionB
              );
            }

            const pointsDifference =
              (
                Number(
                  b.ranking_points
                ) || 0
              ) -
              (
                Number(
                  a.ranking_points
                ) || 0
              );

            if (
              pointsDifference !==
              0
            ) {
              return pointsDifference;
            }

            return (
              Number(
                a.team_number
              ) -
              Number(
                b.team_number
              )
            );
          }
        );
    }, [
      teamEventTeams,
      teamEventPlayers,
      tournament1,
      tournament2,
      playerById
    ]);

  const usedPlayerIds =
    useMemo(() => {
      return new Set(
        teamEventPlayers
          .filter(
            (item) =>
              item.team_id !==
              editingTeamId
          )
          .map(
            (item) =>
              item.player_id
          )
      );
    }, [
      teamEventPlayers,
      editingTeamId
    ]);

  const availablePlayer1Options =
    sortedPlayers.filter(
      (player) =>
        !usedPlayerIds.has(
          player.id
        ) &&
        player.id !==
          player2Id
    );

  const availablePlayer2Options =
    sortedPlayers.filter(
      (player) =>
        !usedPlayerIds.has(
          player.id
        ) &&
        player.id !==
          player1Id
    );

  const resetForm = () => {
    setTeamNumber('');
    setTeamName('');
    setPlayer1Id('');
    setPlayer2Id('');
    setEditingTeamId(null);
  };

  const handleEnsureTournaments =
    async () => {
      setEnsuringTournaments(
        true
      );

      try {
        await onEnsureTournaments?.(
          round
        );
      } catch (error) {
        alert(
          error?.message ||
            'De toernooien konden niet worden aangemaakt.'
        );
      } finally {
        setEnsuringTournaments(
          false
        );
      }
    };

  const handleEditTeam = (
    team
  ) => {
    setEditingTeamId(
      team.id
    );

    setTeamNumber(
      String(
        team.team_number ||
          ''
      )
    );

    setTeamName(
      String(
        team.team_name ||
          ''
      )
    );

    const tournament1Entry =
      tournament1
        ? getPlayerForTeamTournament({
            team,
            tournament:
              tournament1,
            teamEventPlayers
          })
        : null;

    const tournament2Entry =
      tournament2
        ? getPlayerForTeamTournament({
            team,
            tournament:
              tournament2,
            teamEventPlayers
          })
        : null;

    setPlayer1Id(
      tournament1Entry
        ?.player_id ||
        ''
    );

    setPlayer2Id(
      tournament2Entry
        ?.player_id ||
        ''
    );

    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  const handleSaveTeam =
    async () => {
      const numericTeamNumber =
        Number(
          teamNumber
        );

      if (
        !Number.isInteger(
          numericTeamNumber
        ) ||
        numericTeamNumber < 1
      ) {
        alert(
          'Vul een geldig teamnummer in.'
        );

        return;
      }

      if (
        !player1Id ||
        !player2Id
      ) {
        alert(
          'Selecteer voor beide toernooien een speler.'
        );

        return;
      }

      if (
        player1Id ===
        player2Id
      ) {
        alert(
          'Een speler kan niet beide toernooien spelen.'
        );

        return;
      }

      setSavingTeam(true);

      try {
        await onSaveTeam?.({
          round,
          teamId:
            editingTeamId,
          teamNumber:
            numericTeamNumber,
          teamName,
          player1Id,
          player2Id
        });

        resetForm();
      } catch (error) {
        alert(
          error?.message ||
            'Het duo kon niet worden opgeslagen.'
        );
      } finally {
        setSavingTeam(false);
      }
    };

  const handleDeleteTeam =
    async (team) => {
      const confirmed =
        window.confirm(
          `Weet je zeker dat je ${getTeamName(
            team
          )} wilt verwijderen?`
        );

      if (!confirmed) {
        return;
      }

      try {
        await onDeleteTeam?.({
          round,
          teamId:
            team.id
        });

        if (
          editingTeamId ===
          team.id
        ) {
          resetForm();
        }
      } catch (error) {
        alert(
          error?.message ||
            'Het duo kon niet worden verwijderd.'
        );
      }
    };

  const handleTeamsImport =
    async (file) => {
      if (!file) {
        return;
      }

      if (
        teamEventTeams.length >
        0
      ) {
        const confirmed =
          window.confirm(
            [
              'Er bestaat al een duo-indeling.',
              '',
              'Bij het importeren worden alle huidige duo’s en reeds geïmporteerde Team Event-uitslagen vervangen.',
              '',
              'Wil je doorgaan?'
            ].join('\n')
          );

        if (
          !confirmed
        ) {
          return;
        }
      }

      setImportingTeams(
        true
      );

      try {
        if (
          typeof onImportTeamsCSV !==
          'function'
        ) {
          throw new Error(
            'De duo-importfunctie is niet gekoppeld in RoundView.'
          );
        }

        const result =
          await onImportTeamsCSV({
            round,
            file
          });

        alert(
          `${Number(
            result?.teamCount
          ) || 0} duo’s zijn succesvol geïmporteerd.`
        );

        resetForm();
      } catch (error) {
        alert(
          error?.message ||
            'De duo-indeling kon niet worden geïmporteerd.'
        );
      } finally {
        setImportingTeams(
          false
        );
      }
    };

  const handleTournamentImport =
    async (
      tournament,
      file
    ) => {
      if (!file) {
        return;
      }

      setImportingTournamentId(
        tournament.id
      );

      try {
        await onImportTournamentCSV?.({
          round,
          tournament,
          file
        });
      } catch (error) {
        alert(
          error?.message ||
            'De CSV kon niet worden geïmporteerd.'
        );
      } finally {
        setImportingTournamentId(
          null
        );
      }
    };

  const handleDownloadTeamEventCSV =
    () => {
      if (
        teamEventPlayers.length ===
          0 &&
        teamsWithPlayers.length ===
          0
      ) {
        alert(
          'Er zijn nog geen Team Event-gegevens om te downloaden.'
        );

        return;
      }

      const tournamentResults =
        tournaments.flatMap(
          (tournament) =>
            teamEventPlayers
              .filter(
                (entry) =>
                  entry.tournament_id ===
                  tournament.id
              )
              .map(
                (entry) => {
                  const player =
                    playerById.get(
                      entry.player_id
                    );

                  return {
                    tournamentId:
                      tournament.id,

                    position:
                      Number(
                        entry.finish_position
                      ) || '',

                    playerName:
                      getPlayerName(
                        player
                      ),

                    basePoints:
                      Number(
                        entry.base_points
                      ) || 0,

                    bonusPoints:
                      Number(
                        entry.bonus_points
                      ) || 0,

                    totalPoints:
                      Number(
                        entry.total_points
                      ) || 0,

                    prize:
                      Number(
                        entry.prize
                      ) || 0
                  };
                }
              )
        );

      const teamRows =
        teamsWithPlayers.map(
          (team) => ({
            position:
              Number(
                team.final_position
              ) || '',

            teamNumber:
              Number(
                team.team_number
              ) || '',

            teamName:
              getTeamName(
                team
              ),

            player1Name:
              getPlayerName(
                team.player1
              ),

            player1Points:
              Number(
                team
                  .tournament1Entry
                  ?.total_points
              ) || 0,

            player2Name:
              getPlayerName(
                team.player2
              ),

            player2Points:
              Number(
                team
                  .tournament2Entry
                  ?.total_points
              ) || 0,

            teamTotal:
              Number(
                team.base_points
              ) || 0,

            rankingPoints:
              Number(
                team.ranking_points
              ) || 0
          })
        );

      downloadTeamEventResultsCSV({
        roundNumber:
          round.round_number,

        tournaments:
          tournaments.map(
            (tournament) => ({
              id:
                tournament.id,

              name:
                getTournamentDisplayName(
                  tournament
                )
            })
          ),

        tournamentResults,

        teams:
          teamRows
      });
    };

  if (!round) {
    return null;
  }

  return (
    <div
      style={{
        display: 'grid',
        gap: 22
      }}
    >
      <div
        style={{
          padding: 16,
          borderRadius: 10,
          border:
            '1px solid #333',
          background:
            '#181818'
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent:
              'space-between',
            alignItems:
              'center',
            gap: 12,
            flexWrap:
              'wrap'
          }}
        >
          <div>
            <h3
              style={{
                margin: 0
              }}
            >
              Team Event
            </h3>

            <div
              style={{
                marginTop: 6,
                color: '#aaa'
              }}
            >
              Iedere speler speelt één
              toernooi. De twee
              individuele scores worden
              bij elkaar opgeteld.
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              gap: 10,
              alignItems:
                'center',
              flexWrap:
                'wrap'
            }}
          >
            <button
              type="button"
              onClick={
                handleDownloadTeamEventCSV
              }
              disabled={
                teamEventPlayers.length ===
                  0 &&
                teamsWithPlayers.length ===
                  0
              }
            >
              📄 CSV downloaden
            </button>

            {round.double_points && (
              <div
                style={{
                  padding:
                    '6px 10px',
                  borderRadius:
                    999,
                  background:
                    '#ffd740',
                  color: '#111',
                  fontWeight:
                    900
                }}
              >
                Dubbele punten
              </div>
            )}
          </div>
        </div>
      </div>

      {tournaments.length <
      2 ? (
        <div
          style={{
            padding: 16,
            borderRadius: 10,
            border:
              '1px solid #ffb74d',
            background:
              '#21180d'
          }}
        >
          <div
            style={{
              marginBottom: 12,
              color: '#ffcc80'
            }}
          >
            Toernooi A en
            Toernooi B zijn nog niet
            aangemaakt.
          </div>

          {canEnterResults && (
            <button
              type="button"
              disabled={
                ensuringTournaments
              }
              onClick={
                handleEnsureTournaments
              }
            >
              {ensuringTournaments
                ? 'Aanmaken...'
                : 'Toernooien aanmaken'}
            </button>
          )}
        </div>
      ) : (
        <>
          {canEnterResults && (
            <div
              style={{
                padding: 16,
                borderRadius: 10,
                border:
                  '1px solid #333',
                background:
                  '#181818'
              }}
            >
              <h3
                style={{
                  marginTop: 0,
                  marginBottom: 8
                }}
              >
                Duo-indeling
                importeren
              </h3>

              <div
                style={{
                  marginBottom: 12,
                  color: '#aaa',
                  lineHeight: 1.5
                }}
              >
                Importeer eerst de
                volledige duo-indeling.
                Gebruik de kolommen
                team_number, team_name,
                player_1 en player_2.
              </div>

              <input
                type="file"
                accept=".csv,text/csv"
                disabled={
                  importingTeams
                }
                onChange={(
                  event
                ) => {
                  const file =
                    event.target
                      .files?.[0];

                  handleTeamsImport(
                    file
                  );

                  event.target.value =
                    '';
                }}
                style={{
                  width: '100%',
                  padding: 10,
                  background:
                    '#111',
                  color: '#fff',
                  border:
                    '1px solid #333',
                  borderRadius: 6
                }}
              />

              {importingTeams && (
                <div
                  style={{
                    marginTop: 12,
                    color:
                      '#ffd740'
                  }}
                >
                  Duo-indeling
                  importeren...
                </div>
              )}
            </div>
          )}

          {canEnterResults && (
            <div
              style={{
                padding: 16,
                borderRadius: 10,
                border:
                  '1px solid #333',
                background:
                  '#181818'
              }}
            >
              <h3
                style={{
                  marginTop: 0
                }}
              >
                {editingTeamId
                  ? 'Duo aanpassen'
                  : 'Nieuw duo'}
              </h3>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns:
                    'repeat(2, minmax(220px, 1fr))',
                  gap: 14
                }}
              >
                <div>
                  <label
                    style={{
                      display:
                        'block',
                      marginBottom:
                        6,
                      color:
                        '#aaa'
                    }}
                  >
                    Teamnummer
                  </label>

                  <input
                    type="number"
                    min="1"
                    value={
                      teamNumber
                    }
                    onChange={(
                      event
                    ) =>
                      setTeamNumber(
                        event
                          .target
                          .value
                      )
                    }
                    style={{
                      width:
                        '100%',
                      padding: 10
                    }}
                  />
                </div>

                <div>
                  <label
                    style={{
                      display:
                        'block',
                      marginBottom:
                        6,
                      color:
                        '#aaa'
                    }}
                  >
                    Teamnaam
                  </label>

                  <input
                    type="text"
                    value={
                      teamName
                    }
                    placeholder="Optioneel"
                    onChange={(
                      event
                    ) =>
                      setTeamName(
                        event
                          .target
                          .value
                      )
                    }
                    style={{
                      width:
                        '100%',
                      padding: 10
                    }}
                  />
                </div>

                <div>
                  <label
                    style={{
                      display:
                        'block',
                      marginBottom:
                        6,
                      color:
                        '#aaa'
                    }}
                  >
                    Speler Toernooi A
                  </label>

                  <select
                    value={
                      player1Id
                    }
                    onChange={(
                      event
                    ) =>
                      setPlayer1Id(
                        event
                          .target
                          .value
                      )
                    }
                    style={{
                      width:
                        '100%',
                      padding: 10,
                      background:
                        '#fff',
                      color:
                        '#111'
                    }}
                  >
                    <option value="">
                      -- kies speler --
                    </option>

                    {availablePlayer1Options.map(
                      (player) => (
                        <option
                          key={
                            player.id
                          }
                          value={
                            player.id
                          }
                        >
                          {getPlayerName(
                            player
                          )}
                        </option>
                      )
                    )}
                  </select>
                </div>

                <div>
                  <label
                    style={{
                      display:
                        'block',
                      marginBottom:
                        6,
                      color:
                        '#aaa'
                    }}
                  >
                    Speler Toernooi B
                  </label>

                  <select
                    value={
                      player2Id
                    }
                    onChange={(
                      event
                    ) =>
                      setPlayer2Id(
                        event
                          .target
                          .value
                      )
                    }
                    style={{
                      width:
                        '100%',
                      padding: 10,
                      background:
                        '#fff',
                      color:
                        '#111'
                    }}
                  >
                    <option value="">
                      -- kies speler --
                    </option>

                    {availablePlayer2Options.map(
                      (player) => (
                        <option
                          key={
                            player.id
                          }
                          value={
                            player.id
                          }
                        >
                          {getPlayerName(
                            player
                          )}
                        </option>
                      )
                    )}
                  </select>
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  gap: 10,
                  marginTop: 14
                }}
              >
                <button
                  type="button"
                  disabled={
                    savingTeam
                  }
                  onClick={
                    handleSaveTeam
                  }
                >
                  {savingTeam
                    ? 'Opslaan...'
                    : editingTeamId
                      ? 'Wijzigingen opslaan'
                      : 'Duo toevoegen'}
                </button>

                {editingTeamId && (
                  <button
                    type="button"
                    onClick={
                      resetForm
                    }
                  >
                    Annuleren
                  </button>
                )}
              </div>
            </div>
          )}

          <div
            style={{
              display: 'grid',
              gridTemplateColumns:
                'repeat(2, minmax(260px, 1fr))',
              gap: 16
            }}
          >
            {tournaments.map(
              (
                tournament
              ) => {
                const tournamentPlayers =
                  teamEventPlayers
                    .filter(
                      (item) =>
                        item.tournament_id ===
                        tournament.id
                    )
                    .sort(
                      (a, b) =>
                        (
                          Number(
                            a.finish_position
                          ) ||
                          Number.MAX_SAFE_INTEGER
                        ) -
                        (
                          Number(
                            b.finish_position
                          ) ||
                          Number.MAX_SAFE_INTEGER
                        )
                    );

                return (
                  <div
                    key={
                      tournament.id
                    }
                    style={{
                      padding: 16,
                      borderRadius:
                        10,
                      border:
                        '1px solid #333',
                      background:
                        '#181818'
                    }}
                  >
                    <h3
                      style={{
                        marginTop:
                          0
                      }}
                    >
                      {getTournamentDisplayName(
                        tournament
                      )}
                    </h3>

                    <div
                      style={{
                        marginBottom:
                          12,
                        color:
                          '#aaa'
                      }}
                    >
                      Deelnemers
                      uitslag:{' '}
                      <strong>
                        {Number(
                          tournament.player_count
                        ) || 0}
                      </strong>
                    </div>

                    {canEnterResults && (
                      <input
                        type="file"
                        accept=".csv,text/csv"
                        disabled={
                          importingTournamentId ===
                          tournament.id
                        }
                        onChange={(
                          event
                        ) => {
                          const file =
                            event.target
                              .files?.[0];

                          handleTournamentImport(
                            tournament,
                            file
                          );

                          event.target.value =
                            '';
                        }}
                        style={{
                          width:
                            '100%',
                          padding:
                            10,
                          marginBottom:
                            14,
                          background:
                            '#111',
                          color:
                            '#fff',
                          border:
                            '1px solid #333',
                          borderRadius:
                            6
                        }}
                      />
                    )}

                    {importingTournamentId ===
                      tournament.id && (
                      <div
                        style={{
                          marginBottom:
                            12,
                          color:
                            '#ffd740'
                        }}
                      >
                        CSV
                        importeren...
                      </div>
                    )}

                    <table
                      style={{
                        width:
                          '100%',
                        borderCollapse:
                          'collapse'
                      }}
                    >
                      <thead>
                        <tr>
                          <th
                            style={
                              thStyle
                            }
                          >
                            #
                          </th>

                          <th
                            style={
                              thStyle
                            }
                          >
                            Speler
                          </th>

                          <th
                            style={
                              thStyle
                            }
                          >
                            Basis
                          </th>

                          <th
                            style={
                              thStyle
                            }
                          >
                            Bonus
                          </th>

                          <th
                            style={
                              thStyle
                            }
                          >
                            Totaal
                          </th>

                          <th
                            style={
                              thStyle
                            }
                          >
                            Prijs
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        {tournamentPlayers.length >
                        0 ? (
                          tournamentPlayers.map(
                            (
                              entry
                            ) => {
                              const player =
                                playerById.get(
                                  entry.player_id
                                );

                              return (
                                <tr
                                  key={
                                    entry.id
                                  }
                                >
                                  <td
                                    style={
                                      tdStyle
                                    }
                                  >
                                    {entry.finish_position ||
                                      '-'}
                                  </td>

                                  <td
                                    style={
                                      tdStyle
                                    }
                                  >
                                    {getPlayerName(
                                      player
                                    )}
                                  </td>

                                  <td
                                    style={
                                      tdStyle
                                    }
                                  >
                                    {Number(
                                      entry.base_points
                                    ) || 0}
                                  </td>

                                  <td
                                    style={
                                      tdStyle
                                    }
                                  >
                                    {Number(
                                      entry.bonus_points
                                    ) || 0}
                                  </td>

                                  <td
                                    style={{
                                      ...tdStyle,
                                      color:
                                        '#ffd740',
                                      fontWeight:
                                        900
                                    }}
                                  >
                                    {Number(
                                      entry.total_points
                                    ) || 0}
                                  </td>

                                  <td
                                    style={{
                                      ...tdStyle,
                                      color:
                                        Number(
                                          entry.prize
                                        ) >
                                        0
                                          ? '#81c784'
                                          : '#888',
                                      fontWeight:
                                        Number(
                                          entry.prize
                                        ) >
                                        0
                                          ? 900
                                          : 400,
                                      whiteSpace:
                                        'nowrap'
                                    }}
                                  >
                                    {formatPrize(
                                      entry.prize
                                    )}
                                  </td>
                                </tr>
                              );
                            }
                          )
                        ) : (
                          <tr>
                            <td
                              style={
                                tdStyle
                              }
                              colSpan={
                                6
                              }
                            >
                              Nog geen
                              uitslag
                              geïmporteerd.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                );
              }
            )}
          </div>

          <div
            style={{
              padding: 16,
              borderRadius: 10,
              border:
                '1px solid #333',
              background:
                '#181818'
            }}
          >
            <h3
              style={{
                marginTop: 0
              }}
            >
              Team Event-dagstand
            </h3>

            <table
              style={{
                width: '100%',
                borderCollapse:
                  'collapse'
              }}
            >
              <thead>
                <tr>
                  <th style={thStyle}>
                    #
                  </th>

                  <th style={thStyle}>
                    Team
                  </th>

                  <th style={thStyle}>
                    Toernooi A
                  </th>

                  <th style={thStyle}>
                    Punten
                  </th>

                  <th style={thStyle}>
                    Toernooi B
                  </th>

                  <th style={thStyle}>
                    Punten
                  </th>

                  <th style={thStyle}>
                    Teamtotaal
                  </th>

                  <th style={thStyle}>
                    Ranking
                  </th>

                  {canEnterResults && (
                    <th
                      style={
                        thStyle
                      }
                    >
                      Acties
                    </th>
                  )}
                </tr>
              </thead>

              <tbody>
                {teamsWithPlayers.length >
                0 ? (
                  teamsWithPlayers.map(
                    (team) => (
                      <tr
                        key={
                          team.id
                        }
                      >
                        <td
                          style={{
                            ...tdStyle,
                            fontWeight:
                              900
                          }}
                        >
                          {team.final_position ||
                            '-'}
                        </td>

                        <td
                          style={
                            tdStyle
                          }
                        >
                          <div
                            style={{
                              fontWeight:
                                800
                            }}
                          >
                            {getTeamName(
                              team
                            )}
                          </div>

                          <div
                            style={{
                              color:
                                '#888',
                              fontSize:
                                12
                            }}
                          >
                            Teamnummer{' '}
                            {
                              team.team_number
                            }
                          </div>
                        </td>

                        <td
                          style={
                            tdStyle
                          }
                        >
                          {getPlayerName(
                            team.player1
                          )}
                        </td>

                        <td
                          style={
                            tdStyle
                          }
                        >
                          {Number(
                            team
                              .tournament1Entry
                              ?.total_points
                          ) || 0}
                        </td>

                        <td
                          style={
                            tdStyle
                          }
                        >
                          {getPlayerName(
                            team.player2
                          )}
                        </td>

                        <td
                          style={
                            tdStyle
                          }
                        >
                          {Number(
                            team
                              .tournament2Entry
                              ?.total_points
                          ) || 0}
                        </td>

                        <td
                          style={{
                            ...tdStyle,
                            fontWeight:
                              900
                          }}
                        >
                          {Number(
                            team.base_points
                          ) || 0}
                        </td>

                        <td
                          style={{
                            ...tdStyle,
                            fontWeight:
                              900,
                            color:
                              '#ffd740'
                          }}
                        >
                          {Number(
                            team.ranking_points
                          ) || 0}
                        </td>

                        {canEnterResults && (
                          <td
                            style={
                              tdStyle
                            }
                          >
                            <div
                              style={{
                                display:
                                  'flex',
                                gap: 8,
                                flexWrap:
                                  'wrap'
                              }}
                            >
                              <button
                                type="button"
                                onClick={() =>
                                  handleEditTeam(
                                    team
                                  )
                                }
                              >
                                Bewerken
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  handleDeleteTeam(
                                    team
                                  )
                                }
                                style={{
                                  color:
                                    '#ff8a80'
                                }}
                              >
                                Verwijderen
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    )
                  )
                ) : (
                  <tr>
                    <td
                      style={
                        tdStyle
                      }
                      colSpan={
                        canEnterResults
                          ? 9
                          : 8
                      }
                    >
                      Nog geen duo’s
                      aangemaakt.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}