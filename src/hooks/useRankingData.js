import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export function useRankingData() {
  const [season, setSeason] = useState(null);
  const [players, setPlayers] = useState([]);
  const [playerAliases, setPlayerAliases] = useState([]);
  const [rounds, setRounds] = useState([]);
  const [roundEntries, setRoundEntries] = useState([]);
  const [roundResults, setRoundResults] = useState({});

  const [teamEventTournaments, setTeamEventTournaments] = useState([]);
  const [teamEventTeams, setTeamEventTeams] = useState([]);
  const [teamEventPlayers, setTeamEventPlayers] = useState([]);

  const [declinedFinalists, setDeclinedFinalists] = useState([]);
  const [finaleRegistrations, setFinaleRegistrations] = useState([]);
  const [finaleSettings, setFinaleSettings] = useState(null);
  const [finalResults, setFinalResults] = useState([]);
  const [finalExpenses, setFinalExpenses] = useState([]);
  const [payments, setPayments] = useState([]);
  const [paymentPlayers, setPaymentPlayers] = useState([]);
  const [roundPayments, setRoundPayments] = useState([]);
  const [paymentTransactions, setPaymentTransactions] = useState([]);
  const [auditLog, setAuditLog] = useState([]);
  const [
    registrationNotificationCount,
    setRegistrationNotificationCount
  ] = useState(0);
  const [loadingData, setLoadingData] = useState(true);

  const loadData = async (showLoading = false) => {
    if (showLoading) {
      setLoadingData(true);
    }

    const { data: seasonData, error: seasonError } = await supabase
      .from('seasons')
      .select('*')
      .eq('is_active', true)
      .single();

    if (seasonError) {
      console.error('Seizoen laden mislukt:', seasonError);
      setLoadingData(false);
      return;
    }

    const seasonId = seasonData.id;

    setSeason(seasonData);

    const [
      playersResponse,
      aliasesResponse,
      roundsResponse,
      roundEntriesResponse,
      resultsResponse,
      teamEventTournamentsResponse,
      teamEventTeamsResponse,
      teamEventPlayersResponse,
      declinedResponse,
      finaleRegistrationsResponse,
      finaleSettingsResponse,
      finalResultsResponse,
      finalExpensesResponse,
      paymentsResponse,
      paymentPlayersResponse,
      roundPaymentsResponse,
      paymentTransactionsResponse,
      auditLogResponse,
      registrationNotificationsResponse
    ] = await Promise.all([
      supabase
        .from('players')
        .select('*')
        .eq('season_id', seasonId)
        .order('preferred_name', { ascending: true }),

      supabase
        .from('player_aliases')
        .select('*')
        .eq('season_id', seasonId),

      supabase
        .from('rounds')
        .select('*')
        .eq('season_id', seasonId)
        .order('round_number', { ascending: true }),

      supabase
        .from('round_entries')
        .select('*')
        .eq('season_id', seasonId)
        .order('created_at', { ascending: true }),

      supabase
        .from('round_results')
        .select('*')
        .eq('season_id', seasonId)
        .order('position', { ascending: true }),

      supabase
        .from('team_event_tournaments')
        .select('*')
        .eq('season_id', seasonId)
        .order('tournament_number', { ascending: true }),

      supabase
        .from('team_event_teams')
        .select('*')
        .eq('season_id', seasonId)
        .order('created_at', { ascending: true }),

      supabase
        .from('team_event_players')
        .select('*')
        .eq('season_id', seasonId),

      supabase
        .from('declined_finalists')
        .select('*')
        .eq('season_id', seasonId)
        .order('created_at', { ascending: true }),

      supabase
        .from('finale_registrations')
        .select('*')
        .eq('season_id', seasonId)
        .order('responded_at', { ascending: true }),

      supabase
        .from('finale_settings')
        .select('*')
        .eq('season_id', seasonId)
        .single(),

      supabase
        .from('final_results')
        .select('*')
        .eq('season_id', seasonId)
        .order('position', { ascending: true }),

      supabase
        .from('final_expenses')
        .select('*')
        .eq('season_id', seasonId)
        .order('created_at', { ascending: true }),

      supabase
        .from('payments')
        .select('*')
        .eq('season_id', seasonId)
        .order('created_at', { ascending: false }),

      supabase
        .from('payment_players')
        .select('*'),

      supabase
        .from('round_payments')
        .select('*')
        .eq('season_id', seasonId)
        .order('created_at', { ascending: false }),

      supabase
        .from('payment_transactions')
        .select('*')
        .eq('season_id', seasonId)
        .order('paid_at', { ascending: false }),

      supabase
        .from('audit_log')
        .select('*')
        .eq('season_id', seasonId)
        .order('created_at', { ascending: false }),

      supabase
        .from('registration_notifications')
        .select('id', { count: 'exact' })
        .eq('processed', false)
    ]);

    if (playersResponse.error) {
      console.error(
        'Spelers laden mislukt:',
        playersResponse.error
      );
    }

    if (aliasesResponse.error) {
      console.error(
        'Speleraliassen laden mislukt:',
        aliasesResponse.error
      );
    }

    if (roundsResponse.error) {
      console.error(
        'Rondes laden mislukt:',
        roundsResponse.error
      );
    }

    if (roundEntriesResponse.error) {
      console.error(
        'Ronde-inschrijvingen laden mislukt:',
        roundEntriesResponse.error
      );
    }

    if (resultsResponse.error) {
      console.error(
        'Ronde-uitslagen laden mislukt:',
        resultsResponse.error
      );
    }

    if (teamEventTournamentsResponse.error) {
      console.error(
        'Team Event-toernooien laden mislukt:',
        teamEventTournamentsResponse.error
      );
    }

    if (teamEventTeamsResponse.error) {
      console.error(
        'Team Event-teams laden mislukt:',
        teamEventTeamsResponse.error
      );
    }

    if (teamEventPlayersResponse.error) {
      console.error(
        'Team Event-spelers laden mislukt:',
        teamEventPlayersResponse.error
      );
    }

    if (declinedResponse.error) {
      console.error(
        'Afgemelde finalisten laden mislukt:',
        declinedResponse.error
      );
    }

    if (finaleRegistrationsResponse.error) {
      console.error(
        'Finale-aanmeldingen laden mislukt:',
        finaleRegistrationsResponse.error
      );
    }

    if (finaleSettingsResponse.error) {
      console.error(
        'Finale-instellingen laden mislukt:',
        finaleSettingsResponse.error
      );
    }

    if (finalResultsResponse.error) {
      console.error(
        'Finale-uitslagen laden mislukt:',
        finalResultsResponse.error
      );
    }

    if (finalExpensesResponse.error) {
      console.error(
        'Finale-uitgaven laden mislukt:',
        finalExpensesResponse.error
      );
    }

    if (paymentsResponse.error) {
      console.error(
        'Betalingen laden mislukt:',
        paymentsResponse.error
      );
    }

    if (paymentPlayersResponse.error) {
      console.error(
        'Betalingsspelers laden mislukt:',
        paymentPlayersResponse.error
      );
    }

    if (roundPaymentsResponse.error) {
      console.error(
        'Rondebetalingen laden mislukt:',
        roundPaymentsResponse.error
      );
    }

    if (paymentTransactionsResponse.error) {
      console.error(
        'Betalingstransacties laden mislukt:',
        paymentTransactionsResponse.error
      );
    }

    if (auditLogResponse.error) {
      console.error(
        'Auditlog laden mislukt:',
        auditLogResponse.error
      );
    }

    if (registrationNotificationsResponse.error) {
      console.error(
        'Registratiemeldingen laden mislukt:',
        registrationNotificationsResponse.error
      );
    }

    setPlayers(playersResponse.data || []);
    setPlayerAliases(aliasesResponse.data || []);
    setRounds(roundsResponse.data || []);
    setRoundEntries(roundEntriesResponse.data || []);
    setPayments(paymentsResponse.data || []);
    setPaymentPlayers(paymentPlayersResponse.data || []);
    setRoundPayments(roundPaymentsResponse.data || []);
    setPaymentTransactions(paymentTransactionsResponse.data || []);

    setTeamEventTournaments(
      teamEventTournamentsResponse.data || []
    );

    setTeamEventTeams(
      teamEventTeamsResponse.data || []
    );

    setTeamEventPlayers(
      teamEventPlayersResponse.data || []
    );

    const groupedResults = {};

    (resultsResponse.data || []).forEach((result) => {
      if (!groupedResults[result.round_number]) {
        groupedResults[result.round_number] = [];
      }

      groupedResults[result.round_number][
        result.position - 1
      ] = result;
    });

    setRoundResults(groupedResults);
    setDeclinedFinalists(declinedResponse.data || []);
    setFinaleRegistrations(
      finaleRegistrationsResponse.data || []
    );
    setFinaleSettings(finaleSettingsResponse.data || null);
    setFinalResults(finalResultsResponse.data || []);
    setFinalExpenses(finalExpensesResponse.data || []);
    setAuditLog(auditLogResponse.data || []);

    setRegistrationNotificationCount(
      registrationNotificationsResponse.count || 0
    );

    setLoadingData(false);
  };

  useEffect(() => {
    loadData(true);
  }, []);

  return {
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
    finaleRegistrations,
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
    reloadData: () => loadData(false)
  };
}