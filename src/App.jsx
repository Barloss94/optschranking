import React, { useMemo, useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import './App.css';

import { supabase } from './lib/supabaseClient';
import { useAuthProfile } from './hooks/useAuthProfile';
import { useRankingData } from './hooks/useRankingData';
import { useMyFinancialStats } from './hooks/useMyFinancialStats';

import AppHeader from './components/AppHeader';
import Sidebar from './components/Sidebar';
import PlayerAdminPanel from './components/PlayerAdminPanel';
import RankingTable from './components/RankingTable';
import RoundView from './components/RoundView';
import FinalistsView from './components/FinalistsView';
import FinalView from './components/FinalView';
import PotView from './components/PotView';
import AuditLogView from './components/AuditLogView';
import UserManagementView from './components/UserManagementView';
import AliasManagementView from './components/AliasManagementView';
import PaymentsView from './components/PaymentsView';
import MyRoundsView from './components/MyRoundsView';
import MyStatsView from './components/MyStatsView';
import InfoView from './components/InfoView';
import GeneralStatsView from './components/GeneralStatsView';
import TournamentScheduleView from './components/TournamentScheduleView';

import { extractPlayerNamesFromCSV } from './utils/csv';
import { normalizeName } from './utils/formatters';
import {
  buildFinalLists,
  buildFinalStackList,
  buildRanking,
  getDisplayRoundPoints,
  getRoundPrizes,
  getSafePayouts
} from './utils/rankingCalculations';

import {
  deleteTeamEventTeam,
  ensureTeamEventTournaments,
  importTeamEventTeamsCSV,
  importTeamEventTournamentCSV,
  saveTeamEventTeam
} from './services/teamEventService';

const BUNQ_BASE_URL = 'https://bunq.me/optsch';

export default function App() {
  const exportRef = useRef(null);

  const {
    user,
    profile,
    loadingAuth,
    isAdmin,
    isHostOrAdmin,
    financialStatsEnabled
  } = useAuthProfile();

  const {
    season,
    players,
    playerAliases,
    rounds,
    roundEntries,
    roundResults,
    teamEventTournaments,
    teamEventTeams,
    teamEventPlayers,
    declinedFinalists,
    finaleSettings,
    finalResults,
    finalExpenses,
    payments,
    paymentPlayers,
    roundPayments,
    paymentTransactions,
    auditLog,
    registrationNotificationCount,
    loadingData,
    reloadData
  } = useRankingData();

  const [view, setView] = useState('total');
  const [splitFirstTwo, setSplitFirstTwo] =
    useState(false);
  const [newExpenseLabel, setNewExpenseLabel] =
    useState('');
  const [newExpenseAmount, setNewExpenseAmount] =
    useState('');

  const currentPlayer =
    players.find(
      (player) =>
        player.id === profile?.player_id
    ) || null;

  const showMyRounds = Boolean(currentPlayer);

  const {
    financialStats,
    loadingFinancialStats
  } = useMyFinancialStats({
    user,
    currentPlayer,
    financialStatsEnabled
  });

  const canAddPlayers = isHostOrAdmin;
  const canManagePlayers = isAdmin;
  const canEnterResults = isHostOrAdmin;
  const canViewRoundPrizes = isHostOrAdmin;

  const finaleLocked = Boolean(
    finaleSettings?.finale_locked
  );

  const getRoundPlayerCount = (
    roundNumber
  ) => {
    const round = rounds.find(
      (item) =>
        item.round_number === roundNumber
    );

    return Number(round?.player_count) || 0;
  };

  const getRoundDoublePoints = (
    roundNumber
  ) => {
    const round = rounds.find(
      (item) =>
        item.round_number === roundNumber
    );

    return Boolean(round?.double_points);
  };

  const rankingResults = useMemo(() => {
    const combinedResults = {
      ...roundResults
    };

    const playerById = new Map(
      players.map((player) => [
        player.id,
        player
      ])
    );

    for (const round of rounds) {
      if (
        round.round_type !== 'team_event'
      ) {
        continue;
      }

      const teamsForRound =
        teamEventTeams.filter(
          (team) =>
            team.round_id === round.id
        );

      const playersForRound =
        teamEventPlayers.filter(
          (teamPlayer) =>
            teamPlayer.round_id === round.id
        );

      const teamEventResults = [];

      for (const team of teamsForRound) {
        const teamMembers =
          playersForRound.filter(
            (teamPlayer) =>
              teamPlayer.team_id === team.id
          );

        const hasCompleteResult =
          teamMembers.length === 2 &&
          teamMembers.every(
            (teamPlayer) =>
              teamPlayer.finish_position !==
                null &&
              teamPlayer.finish_position !==
                undefined
          );

        if (!hasCompleteResult) {
          continue;
        }

        for (const teamMember of teamMembers) {
          const player = playerById.get(
            teamMember.player_id
          );

          teamEventResults.push({
            id: `team-event-${team.id}-${teamMember.player_id}`,
            season_id: round.season_id,
            round_id: round.id,
            round_number:
              round.round_number,
            position:
              Number(team.final_position) ||
              null,
            player_id:
              teamMember.player_id,
            player_name:
              player?.preferred_name ||
              player?.name ||
              'Onbekende speler',
            points:
              Number(
                team.ranking_points
              ) || 0,
            prize: 0,
            team_event_team_id: team.id
          });
        }
      }

      combinedResults[
        round.round_number
      ] = teamEventResults;
    }

    return combinedResults;
  }, [
    players,
    rounds,
    roundResults,
    teamEventTeams,
    teamEventPlayers
  ]);

  const ranking = useMemo(() => {
    return buildRanking({
      players,
      rounds,
      roundResults: rankingResults,
      getRoundPlayerCount,
      getRoundDoublePoints
    });
  }, [players, rounds, rankingResults]);

  const {
    baseFinalists,
    reservePool,
    availableReserves,
    finalList,
    nextUp
  } = useMemo(() => {
    return buildFinalLists({
      ranking,
      declinedFinalists
    });
  }, [ranking, declinedFinalists]);

  const finalStackList = useMemo(() => {
    return buildFinalStackList(finalList);
  }, [finalList]);

  const finalPotBreakdown = useMemo(() => {
    return rounds.map((round) => {
      const isTeamEvent =
        round.round_type === 'team_event';

      const entries = isTeamEvent
        ? teamEventPlayers.filter(
            (teamEventPlayer) =>
              teamEventPlayer.round_id ===
                round.id &&
              teamEventPlayer.finish_position !==
                null &&
              teamEventPlayer.finish_position !==
                undefined
          ).length
        : Number(round.player_count) || 0;

      return {
        round: round.round_number,
        entries,
        contribution: entries * 2.5
      };
    });
  }, [rounds, teamEventPlayers]);

  const grossFinalPot = useMemo(() => {
    return finalPotBreakdown.reduce(
      (sum, item) =>
        sum + item.contribution,
      0
    );
  }, [finalPotBreakdown]);

  const totalFinalExpenses = useMemo(() => {
    return finalExpenses.reduce(
      (sum, item) =>
        sum +
        (Number(item.amount) || 0),
      0
    );
  }, [finalExpenses]);

  const finalPot = Math.max(
    0,
    grossFinalPot - totalFinalExpenses
  );

  const finalPayouts =
    getSafePayouts(finalPot);

  const rankingWinner =
    ranking[0] || null;

  const addAudit = async (message) => {
    if (!season?.id) return;

    await supabase
      .from('audit_log')
      .insert({
        season_id: season.id,
        user_id: user?.id || null,
        message
      });
  };

  const addPlayer = async (rawName) => {
    const name = String(
      rawName || ''
    ).trim();

    if (!name || !season?.id) return;

    const exists = players.some(
      (player) =>
        normalizeName(player.name) ===
          normalizeName(name) ||
        normalizeName(
          player.preferred_name
        ) === normalizeName(name)
    );

    if (exists) {
      alert(
        '❌ Deze speler staat al in het systeem.'
      );
      return;
    }

    const { data, error } =
      await supabase
        .from('players')
        .insert({
          season_id: season.id,
          name,
          preferred_name: name,
          payment_code: String(
            crypto.randomUUID()
          )
            .slice(0, 8)
            .toUpperCase()
        })
        .select()
        .single();

    if (error) {
      alert(error.message);
      return;
    }

    await supabase
      .from('player_aliases')
      .insert({
        season_id: season.id,
        player_id: data.id,
        alias_name: name,
        source: 'manual'
      });

    await addAudit(
      `Speler toegevoegd: ${name}`
    );

    await reloadData();
  };

  const updatePlayer = async (
    playerId,
    rawName
  ) => {
    const preferredName = String(
      rawName || ''
    ).trim();

    if (!preferredName) return;

    const { error } =
      await supabase
        .from('players')
        .update({
          preferred_name:
            preferredName
        })
        .eq('id', playerId);

    if (error) {
      alert(error.message);
      return;
    }

    await addAudit(
      `Spelernaam aangepast: ${preferredName}`
    );

    await reloadData();
  };

  const deletePlayer = async (
    player
  ) => {
    if (
      !window.confirm(
        `Weet je zeker dat je ${
          player.preferred_name ||
          player.name
        } wilt verwijderen?`
      )
    ) {
      return;
    }

    const { error } =
      await supabase
        .from('players')
        .delete()
        .eq('id', player.id);

    if (error) {
      alert(error.message);
      return;
    }

    await addAudit(
      `Speler verwijderd: ${
        player.preferred_name ||
        player.name
      }`
    );

    await reloadData();
  };

  const addRound = async () => {
    if (!season?.id) return;

    const nextRound =
      rounds.length > 0
        ? Math.max(
            ...rounds.map(
              (round) =>
                round.round_number
            )
          ) + 1
        : 1;

    const { error } =
      await supabase
        .from('rounds')
        .insert({
          season_id: season.id,
          round_number: nextRound,
          payment_code: `VR${nextRound}`
        });

    if (error) {
      alert(error.message);
      return;
    }

    await addAudit(
      `Nieuwe ronde toegevoegd: Ronde ${nextRound}`
    );

    await reloadData();
  };

  const updateRound = async (
    roundId,
    updates
  ) => {
    const { error } =
      await supabase
        .from('rounds')
        .update(updates)
        .eq('id', roundId);

    if (error) {
      alert(error.message);
      return;
    }

    await reloadData();
  };

  const deleteRound = async (round) => {
    if (!round?.id || !isAdmin) {
      return;
    }

    const confirmed =
      window.confirm(
        [
          `Weet je zeker dat je Ronde ${round.round_number} volledig wilt verwijderen?`,
          '',
          'Hiermee worden ook alle inschrijvingen, betalingen, uitslagen en Team Event-gegevens van deze ronde verwijderd.',
          '',
          'Deze actie kan niet ongedaan worden gemaakt.'
        ].join('\n')
      );

    if (!confirmed) {
      return;
    }

    const secondConfirmation =
      window.prompt(
        `Typ VERWIJDER RONDE ${round.round_number} om door te gaan.`
      );

    if (
      secondConfirmation !==
      `VERWIJDER RONDE ${round.round_number}`
    ) {
      alert(
        'Verwijderen geannuleerd.'
      );
      return;
    }

    try {
      const deleteSteps = [
        {
          table:
            'team_event_players',
          column: 'round_id'
        },
        {
          table:
            'team_event_teams',
          column: 'round_id'
        },
        {
          table:
            'team_event_tournaments',
          column: 'round_id'
        },
        {
          table: 'round_results',
          column: 'round_id'
        },
        {
          table: 'round_payments',
          column: 'round_id'
        },
        {
          table: 'round_entries',
          column: 'round_id'
        }
      ];

      for (const step of deleteSteps) {
        const { error } =
          await supabase
            .from(step.table)
            .delete()
            .eq(
              step.column,
              round.id
            );

        if (error) {
          throw error;
        }
      }

      const { error: roundError } =
        await supabase
          .from('rounds')
          .delete()
          .eq('id', round.id);

      if (roundError) {
        throw roundError;
      }

      await addAudit(
        `Ronde ${round.round_number} volledig verwijderd.`
      );

      setView('total');
      await reloadData();
    } catch (error) {
      alert(
        error?.message ||
          'De ronde kon niet volledig worden verwijderd.'
      );
    }
  };

  const ensureRoundEntry = async (
    round,
    playerId,
    status = 'late_added'
  ) => {
    if (
      !season?.id ||
      !round?.id ||
      !playerId
    ) {
      return;
    }

    const existingEntry =
      roundEntries.find(
        (entry) =>
          entry.round_id ===
            round.id &&
          entry.player_id === playerId
      );

    if (existingEntry) return;

    const { error } =
      await supabase
        .from('round_entries')
        .insert({
          season_id: season.id,
          round_id: round.id,
          player_id: playerId,
          status
        });

    if (error) throw error;
  };

  const registerForRound = async (
    round
  ) => {
    if (
      !season?.id ||
      !round?.id ||
      !currentPlayer?.id
    ) {
      return false;
    }

    const now = new Date();

    const opensAt =
      round.registration_opens_at
        ? new Date(
            round.registration_opens_at
          )
        : null;

    const closesAt =
      round.registration_closes_at
        ? new Date(
            round.registration_closes_at
          )
        : null;

    if (opensAt && now < opensAt) {
      alert(
        'De inschrijving voor deze ronde is nog niet geopend.'
      );
      return false;
    }

    if (closesAt && now > closesAt) {
      alert(
        'De inschrijving voor deze ronde is gesloten.'
      );
      return false;
    }

    const existingEntry =
      roundEntries.find(
        (entry) =>
          entry.round_id ===
            round.id &&
          entry.player_id ===
            currentPlayer.id
      );

    if (
      existingEntry &&
      existingEntry.status !==
        'cancelled'
    ) {
      alert(
        'Je bent al aangemeld voor deze ronde.'
      );
      return false;
    }

    const { error } =
      await supabase
        .from('round_entries')
        .upsert(
          {
            season_id: season.id,
            round_id: round.id,
            player_id:
              currentPlayer.id,
            status:
              'pending_payment',
            registered_at:
              new Date().toISOString()
          },
          {
            onConflict:
              'round_id,player_id'
          }
        );

    if (error) {
      alert(error.message);
      return false;
    }

    await reloadData();

    return true;
  };

  const addRoundEntry = async (
    round,
    playerId
  ) => {
    if (
      !season?.id ||
      !round?.id ||
      !playerId
    ) {
      return;
    }

    const player = players.find(
      (item) => item.id === playerId
    );

    const existingEntry =
      roundEntries.find(
        (entry) =>
          entry.round_id ===
            round.id &&
          entry.player_id === playerId
      );

    if (
      existingEntry &&
      existingEntry.status !==
        'cancelled'
    ) {
      alert(
        'Deze speler staat al ingeschreven voor deze ronde.'
      );
      return;
    }

    if (
      existingEntry &&
      existingEntry.status ===
        'cancelled'
    ) {
      const { error } =
        await supabase
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

      if (error) {
        alert(error.message);
        return;
      }
    } else {
      const { error } =
        await supabase
          .from('round_entries')
          .insert({
            season_id: season.id,
            round_id: round.id,
            player_id: playerId,
            status: 'admin_added'
          });

      if (error) {
        alert(error.message);
        return;
      }
    }

    await addAudit(
      `Speler toegevoegd aan Ronde ${
        round.round_number
      }: ${
        player
          ? player.preferred_name ||
            player.name
          : playerId
      }`
    );

    await reloadData();
  };

  const cancelRoundEntry = async (
    entry
  ) => {
    if (!entry?.id) return;

    const player = players.find(
      (item) =>
        item.id === entry.player_id
    );

    const round = rounds.find(
      (item) =>
        item.id === entry.round_id
    );

    if (
      !window.confirm(
        `Inschrijving annuleren voor ${
          player
            ? player.preferred_name ||
              player.name
            : 'deze speler'
        }?`
      )
    ) {
      return;
    }

    const { error } =
      await supabase
        .from('round_entries')
        .update({
          status: 'cancelled'
        })
        .eq('id', entry.id);

    if (error) {
      alert(error.message);
      return;
    }

    await addAudit(
      `Inschrijving geannuleerd: ${
        player
          ? player.preferred_name ||
            player.name
          : entry.player_id
      }${
        round
          ? ` voor Ronde ${round.round_number}`
          : ''
      }`
    );

    await reloadData();
  };

  const updateRoundResult = async (
    round,
    position,
    playerId
  ) => {
    const player = players.find(
      (item) => item.id === playerId
    );

    const playerName = player
      ? player.preferred_name ||
        player.name
      : null;

    const playerCount =
      Number(round.player_count) || 0;

    const points = playerId
      ? getDisplayRoundPoints(
          position,
          playerCount,
          Boolean(
            round.double_points
          )
        )
      : 0;

    const prizes = getRoundPrizes(
      playerCount,
      splitFirstTwo,
      Boolean(round.force_high_fee)
    );

    const prize =
      prizes[position - 1] || 0;

    try {
      if (playerId) {
        await ensureRoundEntry(
          round,
          playerId,
          'late_added'
        );
      }

      const { error } =
        await supabase
          .from('round_results')
          .upsert(
            {
              season_id: season.id,
              round_id: round.id,
              round_number:
                round.round_number,
              position,
              player_id:
                playerId || null,
              player_name:
                playerName,
              points,
              prize
            },
            {
              onConflict:
                'round_id,position'
            }
          );

      if (error) throw error;

      await reloadData();
    } catch (error) {
      alert(error.message);
    }
  };

  const findPlayerByCsvName = (
    csvName
  ) => {
    const normalizedCsvName =
      normalizeName(csvName);

    const directPlayer =
      players.find(
        (player) =>
          normalizeName(player.name) ===
            normalizedCsvName ||
          normalizeName(
            player.preferred_name
          ) === normalizedCsvName
      );

    if (directPlayer) {
      return directPlayer;
    }

    const alias =
      playerAliases.find(
        (item) =>
          normalizeName(
            item.alias_name
          ) === normalizedCsvName
      );

    if (!alias) return null;

    return (
      players.find(
        (player) =>
          player.id ===
          alias.player_id
      ) || null
    );
  };

  const importRoundCSV = async (
    round,
    file
  ) => {
    if (!file) return;

    try {
      const text = await file.text();

      const names =
        extractPlayerNamesFromCSV(text);

      const prizes = getRoundPrizes(
        names.length,
        splitFirstTwo,
        Boolean(
          round.force_high_fee
        )
      );

      const csvPlayerIds = [];

      for (
        let index = 0;
        index < names.length;
        index += 1
      ) {
        const csvName =
          names[index];

        let player =
          findPlayerByCsvName(
            csvName
          );

        if (!player) {
          const { data, error } =
            await supabase
              .from('players')
              .insert({
                season_id:
                  season.id,
                name: csvName,
                preferred_name:
                  csvName,
                payment_code:
                  String(
                    crypto.randomUUID()
                  )
                    .slice(0, 8)
                    .toUpperCase()
              })
              .select()
              .single();

          if (error) throw error;

          player = data;

          await supabase
            .from('player_aliases')
            .insert({
              season_id:
                season.id,
              player_id:
                player.id,
              alias_name: csvName,
              source: 'pokerrrr2'
            });
        }

        csvPlayerIds.push(
          player.id
        );

        const existingEntry =
          roundEntries.find(
            (entry) =>
              entry.round_id ===
                round.id &&
              entry.player_id ===
                player.id
          );

        if (existingEntry) {
          await supabase
            .from('round_entries')
            .update({
              status: 'played'
            })
            .eq(
              'id',
              existingEntry.id
            );
        } else {
          await supabase
            .from('round_entries')
            .insert({
              season_id:
                season.id,
              round_id: round.id,
              player_id:
                player.id,
              status: 'late_added'
            });
        }

        const points =
          getDisplayRoundPoints(
            index + 1,
            names.length,
            Boolean(
              round.double_points
            )
          );

        await supabase
          .from('round_results')
          .upsert(
            {
              season_id:
                season.id,
              round_id: round.id,
              round_number:
                round.round_number,
              position: index + 1,
              player_id:
                player.id,
              player_name:
                player.preferred_name ||
                player.name,
              points,
              prize:
                prizes[index] || 0
            },
            {
              onConflict:
                'round_id,position'
            }
          );
      }

      const currentEntriesForRound =
        roundEntries.filter(
          (entry) =>
            entry.round_id ===
              round.id &&
            [
              'registered',
              'admin_added'
            ].includes(entry.status)
        );

      for (
        const entry of
        currentEntriesForRound
      ) {
        if (
          !csvPlayerIds.includes(
            entry.player_id
          )
        ) {
          const hasPaid =
            roundPayments.some(
              (payment) =>
                payment.round_id ===
                  round.id &&
                payment.player_id ===
                  entry.player_id
            );

          await supabase
            .from('round_entries')
            .update({
              status: hasPaid
                ? 'refund_due'
                : 'no_show'
            })
            .eq('id', entry.id);
        }
      }

      await supabase
        .from('rounds')
        .update({
          player_count:
            names.length
        })
        .eq('id', round.id);

      await addAudit(
        `CSV geïmporteerd voor Ronde ${round.round_number}: ${names.length} spelers.`
      );

      await reloadData();
    } catch (error) {
      alert(error.message);
    }
  };

  const ensureTeamEventRoundTournaments =
    async (round) => {
      if (
        !season?.id ||
        !round?.id
      ) {
        return;
      }

      try {
        await ensureTeamEventTournaments({
          supabase,
          seasonId: season.id,
          roundId: round.id
        });

        await addAudit(
          `Team Event-toernooien aangemaakt voor Ronde ${round.round_number}.`
        );

        await reloadData();
      } catch (error) {
        throw error;
      }
    };

  const saveTeamEventRoundTeam =
    async ({
      round,
      teamId,
      teamNumber,
      teamName,
      player1Id,
      player2Id
    }) => {
      if (
        !season?.id ||
        !round?.id
      ) {
        return;
      }

      try {
        await saveTeamEventTeam({
          supabase,
          seasonId: season.id,
          round,
          teamId,
          teamNumber,
          teamName,
          player1Id,
          player2Id
        });

        await addAudit(
          `${
            teamId
              ? 'Team Event-duo aangepast'
              : 'Team Event-duo toegevoegd'
          } voor Ronde ${
            round.round_number
          }: Team ${teamNumber}.`
        );

        await reloadData();
      } catch (error) {
        throw error;
      }
    };

  const deleteTeamEventRoundTeam =
    async ({
      round,
      teamId
    }) => {
      if (
        !round?.id ||
        !teamId
      ) {
        return;
      }

      try {
        const team =
          teamEventTeams.find(
            (item) =>
              item.id === teamId
          );

        await deleteTeamEventTeam({
          supabase,
          round,
          teamId
        });

        await addAudit(
          `Team Event-duo verwijderd uit Ronde ${round.round_number}: ${
            team?.team_name ||
            `Team ${
              team?.team_number ||
              ''
            }`
          }.`
        );

        await reloadData();
      } catch (error) {
        throw error;
      }
    };

  const importTeamEventRoundTeamsCSV =
    async ({
      round,
      file
    }) => {
      if (
        !season?.id ||
        !round?.id ||
        !file
      ) {
        throw new Error(
          'De Team Event-ronde of het CSV-bestand ontbreekt.'
        );
      }

      const result =
        await importTeamEventTeamsCSV({
          supabase,
          seasonId: season.id,
          round,
          file,
          players,
          playerAliases
        });

      await addAudit(
        `Duo-indeling geïmporteerd voor Ronde ${round.round_number}: ${result.teamCount} duo's.`
      );

      await reloadData();

      return result;
    };

  const importTeamEventRoundTournamentCSV =
    async ({
      round,
      tournament,
      file
    }) => {
      if (
        !season?.id ||
        !round?.id ||
        !tournament?.id ||
        !file
      ) {
        return;
      }

      try {
        const result =
          await importTeamEventTournamentCSV({
            supabase,
            seasonId: season.id,
            round,
            tournament,
            file,
            players,
            playerAliases
          });

        await addAudit(
          `Team Event-CSV geïmporteerd voor Ronde ${round.round_number}, ${tournament.name}: ${result.importedPlayers} spelers.`
        );

        await reloadData();
      } catch (error) {
        throw error;
      }
    };

  const getRoundPaymentReference = (
    round,
    player
  ) => {
    const roundCode =
      round.payment_code ||
      `VR${round.round_number}`;

    const playerCode =
      player.payment_code ||
      String(player.id)
        .slice(0, 8)
        .toUpperCase();

    return `${roundCode}-${playerCode}`;
  };

  const getRoundPaymentUrl = (
    round,
    player
  ) => {
    const amount =
      Number(season?.buy_in) ||
      7.5;

    const description =
      getRoundPaymentReference(
        round,
        player
      );

    return `${BUNQ_BASE_URL}?amount=${amount.toFixed(
      2
    )}&description=${encodeURIComponent(
      description
    )}`;
  };

  const markRoundPlayerPaid = async (
    round,
    player
  ) => {
    if (
      !season?.id ||
      !round?.id ||
      !player?.id
    ) {
      return;
    }

    const existing =
      roundPayments.find(
        (payment) =>
          payment.round_id ===
            round.id &&
          payment.player_id ===
            player.id
      );

    if (existing) {
      alert(
        'Deze speler staat al betaald voor deze ronde.'
      );
      return;
    }

    const amount =
      Number(season?.buy_in) ||
      7.5;

    const reference =
      getRoundPaymentReference(
        round,
        player
      );

    const {
      data: transaction,
      error: transactionError
    } = await supabase
      .from('payment_transactions')
      .insert({
        season_id: season.id,
        amount,
        payment_reference:
          reference,
        source: 'manual',
        status: 'paid',
        paid_at:
          new Date().toISOString()
      })
      .select()
      .single();

    if (transactionError) {
      alert(
        transactionError.message
      );
      return;
    }

    const {
      error: roundPaymentError
    } = await supabase
      .from('round_payments')
      .insert({
        transaction_id:
          transaction.id,
        season_id: season.id,
        round_id: round.id,
        player_id: player.id,
        amount,
        status: 'paid',
        paid_at:
          new Date().toISOString()
      });

    if (roundPaymentError) {
      alert(
        roundPaymentError.message
      );
      return;
    }

    const entry =
      roundEntries.find(
        (item) =>
          item.round_id ===
            round.id &&
          item.player_id ===
            player.id
      );

    if (
      entry &&
      entry.status ===
        'pending_payment'
    ) {
      await supabase
        .from('round_entries')
        .update({
          status: 'registered'
        })
        .eq('id', entry.id);
    }

    await addAudit(
      `Handmatige buy-in verwerkt: ${
        player.preferred_name ||
        player.name
      } voor Ronde ${
        round.round_number
      } (${reference})`
    );

    await reloadData();
  };

  const removeRoundPlayerPayment =
    async (
      round,
      player
    ) => {
      const payment =
        roundPayments.find(
          (item) =>
            item.round_id ===
              round.id &&
            item.player_id ===
              player.id
        );

      if (!payment) return;

      if (
        !window.confirm(
          `Betaling verwijderen voor ${
            player.preferred_name ||
            player.name
          } in Ronde ${
            round.round_number
          }?`
        )
      ) {
        return;
      }

      const { error } =
        await supabase
          .from('round_payments')
          .delete()
          .eq('id', payment.id);

      if (error) {
        alert(error.message);
        return;
      }

      await addAudit(
        `Buy-in verwijderd: ${
          player.preferred_name ||
          player.name
        } voor Ronde ${round.round_number}`
      );

      await reloadData();
    };

  const declineFinalist = async (
    player
  ) => {
    if (finaleLocked) return;

    const { error } =
      await supabase
        .from('declined_finalists')
        .insert({
          season_id: season.id,
          player_id: player.id,
          player_name:
            player.displayName
        });

    if (error) {
      alert(error.message);
      return;
    }

    await addAudit(
      `Finalist afgemeld: ${player.displayName}`
    );

    await reloadData();
  };

  const undoLastDecline = async () => {
    const last =
      declinedFinalists[
        declinedFinalists.length - 1
      ];

    if (!last) return;

    const { error } =
      await supabase
        .from('declined_finalists')
        .delete()
        .eq('id', last.id);

    if (error) {
      alert(error.message);
      return;
    }

    await addAudit(
      `Undo afmelding: ${last.player_name}`
    );

    await reloadData();
  };

  const toggleFinaleLock = async () => {
    if (!finaleSettings?.id) {
      return;
    }

    const { error } =
      await supabase
        .from('finale_settings')
        .update({
          finale_locked:
            !finaleLocked
        })
        .eq(
          'id',
          finaleSettings.id
        );

    if (error) {
      alert(error.message);
      return;
    }

    await addAudit(
      !finaleLocked
        ? 'Finaledeelnemerslijst gelockt.'
        : 'Finaledeelnemerslijst ontgrendeld.'
    );

    await reloadData();
  };

  const updateFinalResult = async (
    position,
    playerId
  ) => {
    const player = finalList.find(
      (item) => item.id === playerId
    );

    const playerName = player
      ? player.displayName
      : null;

    const { error } =
      await supabase
        .from('final_results')
        .upsert(
          {
            season_id: season.id,
            position,
            player_id:
              playerId || null,
            player_name:
              playerName
          },
          {
            onConflict:
              'season_id,position'
          }
        );

    if (error) {
      alert(error.message);
      return;
    }

    await reloadData();
  };

  const addFinalExpense = async () => {
    const label =
      newExpenseLabel.trim();

    const amount = Number(
      String(
        newExpenseAmount
      ).replace(',', '.')
    );

    if (
      !label ||
      Number.isNaN(amount) ||
      amount <= 0
    ) {
      return;
    }

    const { error } =
      await supabase
        .from('final_expenses')
        .insert({
          season_id: season.id,
          label,
          amount
        });

    if (error) {
      alert(error.message);
      return;
    }

    setNewExpenseLabel('');
    setNewExpenseAmount('');

    await addAudit(
      `Finale-uitgave toegevoegd: ${label}`
    );

    await reloadData();
  };

  const deleteFinalExpense = async (
    expense
  ) => {
    const { error } =
      await supabase
        .from('final_expenses')
        .delete()
        .eq('id', expense.id);

    if (error) {
      alert(error.message);
      return;
    }

    await addAudit(
      `Finale-uitgave verwijderd: ${expense.label}`
    );

    await reloadData();
  };

  const exportScreenshot = async () => {
    const roundExportElement =
      document.getElementById(
        'round-export'
      );

    const element =
      roundExportElement ||
      exportRef.current;

    if (!element) return;

    const canvas =
      await html2canvas(element, {
        backgroundColor: '#070908',
        scale: 2,
        useCORS: true
      });

    const link =
      document.createElement('a');

    link.href =
      canvas.toDataURL('image/png');

    link.download =
      roundExportElement
        ? 'uitslag-ronde.png'
        : 'ranking.png';

    link.click();
  };

  const resetAll = async () => {
    alert(
      'Reset bouwen we later veilig in.'
    );
  };

  const roundViewNumber =
    view.startsWith('round-')
      ? Number(
          view.replace('round-', '')
        )
      : null;

  const selectedRound =
    roundViewNumber
      ? rounds.find(
          (round) =>
            round.round_number ===
            roundViewNumber
        )
      : null;

  if (loadingAuth || loadingData) {
    return (
      <div
        className="container"
        style={{
          padding: 20,
          color: '#fff',
          background: 'transparent',
          minHeight: '100vh'
        }}
      >
        Laden...
      </div>
    );
  }

  return (
    <div
      className="container"
      style={{
        padding: 20,
        color: '#fff',
        background: 'transparent',
        minHeight: '100vh'
      }}
    >
      <AppHeader
        user={user}
        profile={profile}
        isAdmin={isAdmin}
        finaleLocked={finaleLocked}
        onToggleFinaleLock={
          toggleFinaleLock
        }
        onUndoDecline={
          undoLastDecline
        }
        undoDisabled={
          declinedFinalists.length ===
            0 || finaleLocked
        }
        onExport={exportScreenshot}
        onReset={resetAll}
      />

      <div
        style={{
          display: 'grid',
          gridTemplateColumns:
            'minmax(300px, 360px) minmax(0, 1fr)',
          gap: 24
        }}
      >
        <Sidebar
          view={view}
          setView={setView}
          rounds={rounds}
          isAdmin={isAdmin}
          showMyRounds={showMyRounds}
          grossFinalPot={grossFinalPot}
          totalFinalExpenses={
            totalFinalExpenses
          }
          finalPot={finalPot}
          registrationNotificationCount={
            registrationNotificationCount
          }
          onAddRound={addRound}
        >
          <PlayerAdminPanel
            canAddPlayers={
              canAddPlayers
            }
            canManagePlayers={
              canManagePlayers
            }
            players={players}
            onAddPlayer={addPlayer}
            onUpdatePlayer={
              updatePlayer
            }
            onDeletePlayer={
              deletePlayer
            }
          />
        </Sidebar>

        <section
          ref={exportRef}
          style={{
            border:
              '1px solid rgba(212, 175, 87, 0.2)',
            padding: 20,
            borderRadius: 15,
            background:
              'linear-gradient(145deg, rgba(19, 32, 25, 0.98), rgba(9, 14, 11, 0.99))',
            boxShadow:
              '0 18px 40px rgba(0, 0, 0, 0.34)',
            overflowX: 'auto'
          }}
        >
          {view === 'info' && (
            <InfoView
              profile={profile}
              currentPlayer={
                currentPlayer
              }
            />
          )}

          {view === 'my-stats' && (
            <MyStatsView
              user={user}
              currentPlayer={
                currentPlayer
              }
              ranking={ranking}
              rounds={rounds}
              financialStatsEnabled={
                financialStatsEnabled &&
                financialStats !== null &&
                !loadingFinancialStats
              }
              totalBuyIn={
                financialStats?.totalBuyIn ?? 0
              }
              totalWinnings={
                financialStats?.totalWinnings ?? 0
              }
            />
          )}

          {view === 'my-rounds' && (
            <MyRoundsView
              currentPlayer={
                currentPlayer
              }
              season={season}
              rounds={rounds}
              roundEntries={
                roundEntries
              }
              roundPayments={
                roundPayments
              }
              getRoundPaymentUrl={
                getRoundPaymentUrl
              }
              onRegisterRound={
                registerForRound
              }
              roundResults={
                roundResults
              }
              isFinaleQualified={
                Boolean(
                  currentPlayer &&
                  finalList.some(
                    (player) =>
                      player.id ===
                      currentPlayer.id
                  )
                )
              }
            />
          )}

          {view === 'total' && (
            <RankingTable
              ranking={ranking}
              rounds={rounds}
              nextUp={nextUp}
            />
          )}

          {view === 'general-stats' && (
            <GeneralStatsView
              ranking={ranking}
              rounds={rounds}
              rankingResults={
                rankingResults
              }
              teamEventPlayers={
                teamEventPlayers
              }
            />
          )}

          {view === 'schedule' && (
            <TournamentScheduleView
              season={season}
              isAdmin={isAdmin}
              onScheduleChanged={
                reloadData
              }
            />
          )}

          {selectedRound && (
            <RoundView
              round={selectedRound}
              players={players}
              results={
                roundResults[
                  selectedRound
                    .round_number
                ] || []
              }
              roundEntries={
                roundEntries
              }
              roundPayments={
                roundPayments
              }
              teamEventTournaments={teamEventTournaments.filter(
                (item) =>
                  item.round_id ===
                  selectedRound.id
              )}
              teamEventTeams={teamEventTeams.filter(
                (item) =>
                  item.round_id ===
                  selectedRound.id
              )}
              teamEventPlayers={teamEventPlayers.filter(
                (item) =>
                  item.round_id ===
                  selectedRound.id
              )}
              canEnterResults={
                canEnterResults
              }
              canViewRoundPrizes={
                canViewRoundPrizes
              }
              canDeleteRound={
                isAdmin
              }
              splitFirstTwo={
                splitFirstTwo
              }
              setSplitFirstTwo={
                setSplitFirstTwo
              }
              onUpdateRound={
                updateRound
              }
              onDeleteRound={
                deleteRound
              }
              onUpdateResult={
                updateRoundResult
              }
              onImportCSV={
                importRoundCSV
              }
              onEnsureTeamEventTournaments={
                ensureTeamEventRoundTournaments
              }
              onSaveTeamEventTeam={
                saveTeamEventRoundTeam
              }
              onDeleteTeamEventTeam={
                deleteTeamEventRoundTeam
              }
              onImportTeamEventTeamsCSV={
                importTeamEventRoundTeamsCSV
              }
              onImportTeamEventTournamentCSV={
                importTeamEventRoundTournamentCSV
              }
              onAddRoundEntry={
                addRoundEntry
              }
              onCancelRoundEntry={
                cancelRoundEntry
              }
              onMarkRoundPlayerPaid={
                markRoundPlayerPaid
              }
              onRemoveRoundPlayerPayment={
                removeRoundPlayerPayment
              }
              getRoundPaymentUrl={
                getRoundPaymentUrl
              }
              getRoundPaymentReference={
                getRoundPaymentReference
              }
            />
          )}

          {view === 'finalists' && (
            <FinalistsView
              finalStackList={
                finalStackList
              }
              baseFinalists={
                baseFinalists
              }
              reservePool={
                reservePool
              }
              availableReserves={
                availableReserves
              }
              nextUp={nextUp}
              declinedFinalists={
                declinedFinalists
              }
              isAdmin={isAdmin}
              finaleLocked={
                finaleLocked
              }
              onDeclineFinalist={
                declineFinalist
              }
              onUndoDecline={
                undoLastDecline
              }
            />
          )}

          {view === 'final' && (
            <FinalView
              finalList={finalList}
              finalResults={
                finalResults
              }
              finalPot={finalPot}
              finalPayouts={
                finalPayouts
              }
              rankingWinner={
                rankingWinner
              }
              isAdmin={isAdmin}
              onUpdateFinalResult={
                updateFinalResult
              }
            />
          )}

          {view === 'payments' &&
            isAdmin && (
              <PaymentsView
                players={players}
                rounds={rounds}
                roundEntries={
                  roundEntries
                }
                roundResults={
                  roundResults
                }
                roundPayments={
                  roundPayments
                }
              />
            )}

          {view === 'pot' &&
            isAdmin && (
              <PotView
                finalPotBreakdown={
                  finalPotBreakdown
                }
                grossFinalPot={
                  grossFinalPot
                }
                finalExpenses={
                  finalExpenses
                }
                totalFinalExpenses={
                  totalFinalExpenses
                }
                finalPot={finalPot}
                newExpenseLabel={
                  newExpenseLabel
                }
                setNewExpenseLabel={
                  setNewExpenseLabel
                }
                newExpenseAmount={
                  newExpenseAmount
                }
                setNewExpenseAmount={
                  setNewExpenseAmount
                }
                onAddFinalExpense={
                  addFinalExpense
                }
                onDeleteFinalExpense={
                  deleteFinalExpense
                }
              />
            )}

          {view === 'audit' &&
            isAdmin && (
              <AuditLogView
                auditLog={auditLog}
              />
            )}

          {view === 'users' &&
            isAdmin && (
              <UserManagementView
                players={players}
              />
            )}

          {view === 'aliases' &&
            isAdmin && (
              <AliasManagementView
                season={season}
                players={players}
              />
            )}
        </section>
      </div>
    </div>
  );
}
