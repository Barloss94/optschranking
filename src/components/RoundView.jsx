import { useState } from 'react';
import TeamEventPanel from './TeamEventPanel';
import { thStyle, tdStyle } from '../styles/tableStyles';
import { formatEuro } from '../utils/formatters';
import {
  downloadRoundResultsCSV
} from '../utils/csv';
import {
  getDisplayRoundPoints,
  getEffectiveDaypotPlayers,
  getPaidPlacesForRound,
  getRoundPrizePool,
  getRoundPrizes
} from '../utils/rankingCalculations';

const ACTIVE_ENTRY_STATUSES = [
  'pending_payment',
  'registered',
  'admin_added',
  'late_added',
  'played',
  'no_show',
  'refund_due'
];

function toDateTimeLocalValue(value) {
  if (!value) return '';

  const date = new Date(value);
  const offset = date.getTimezoneOffset();

  const localDate = new Date(
    date.getTime() - offset * 60 * 1000
  );

  return localDate.toISOString().slice(0, 16);
}

function fromDateTimeLocalValue(value) {
  if (!value) return null;

  return new Date(value).toISOString();
}

export default function RoundView({
  round,
  players,
  results,
  roundEntries = [],
  roundPayments = [],

  teamEventTournaments = [],
  teamEventTeams = [],
  teamEventPlayers = [],

  canEnterResults,
  canViewRoundPrizes,
  canDeleteRound = false,
  onDeleteRound,

  splitFirstTwo,
  setSplitFirstTwo,

  onUpdateRound,
  onUpdateResult,
  onImportCSV,

  onEnsureTeamEventTournaments,
  onSaveTeamEventTeam,
  onDeleteTeamEventTeam,
  onImportTeamEventTeamsCSV,
  onImportTeamEventTournamentCSV,

  onAddRoundEntry,
  onCancelRoundEntry,
  onMarkRoundPlayerPaid,
  onRemoveRoundPlayerPayment,

  getRoundPaymentUrl,
  getRoundPaymentReference
}) {
  const [
    selectedEntryPlayerId,
    setSelectedEntryPlayerId
  ] = useState('');

  if (!round) return null;

  const playerCount =
    Number(round.player_count) || 0;

  const forceHighFee =
    Boolean(round.force_high_fee);

  const doublePoints =
    Boolean(round.double_points);

  const isTeamEvent =
    round.round_type === 'team_event';

  const prizes = getRoundPrizes(
    playerCount,
    splitFirstTwo,
    forceHighFee
  );

  const effectiveDaypotPlayers =
    getEffectiveDaypotPlayers(
      playerCount,
      forceHighFee
    );

  const roundPot = getRoundPrizePool(
    playerCount,
    forceHighFee
  );

  const currentEntries = roundEntries
    .filter(
      (entry) =>
        entry.round_id === round.id &&
        ACTIVE_ENTRY_STATUSES.includes(
          entry.status
        )
    )
    .map((entry) => {
      const player = players.find(
        (item) =>
          item.id === entry.player_id
      );

      return {
        ...entry,
        player,
        playerName: player
          ? player.preferred_name ||
            player.name
          : 'Onbekende speler'
      };
    })
    .sort((a, b) =>
      a.playerName.localeCompare(
        b.playerName,
        'nl'
      )
    );

  const currentRoundPayments =
    roundPayments.filter(
      (payment) =>
        payment.round_id === round.id
    );

  const paidPlayerIds = new Set(
    currentRoundPayments.map(
      (payment) => payment.player_id
    )
  );

  const paidCount =
    currentEntries.filter((entry) =>
      paidPlayerIds.has(
        entry.player_id
      )
    ).length;

  const openPaymentCount =
    currentEntries.filter(
      (entry) =>
        !paidPlayerIds.has(
          entry.player_id
        ) &&
        ![
          'no_show',
          'refund_due'
        ].includes(entry.status)
    ).length;

  const refundCount =
    currentEntries.filter(
      (entry) =>
        paidPlayerIds.has(
          entry.player_id
        ) &&
        [
          'no_show',
          'refund_due'
        ].includes(entry.status)
    ).length;

  const activeEntryPlayerIds =
    currentEntries.map(
      (entry) => entry.player_id
    );

  const availableEntryPlayers =
    players
      .filter(
        (player) =>
          !activeEntryPlayerIds.includes(
            player.id
          )
      )
      .sort((a, b) =>
        (
          a.preferred_name ||
          a.name
        ).localeCompare(
          b.preferred_name ||
            b.name,
          'nl'
        )
      );

  const usedPlayerIds = (
    results || []
  )
    .map(
      (result) =>
        result?.player_id
    )
    .filter(Boolean);

  const getAvailablePlayers = (
    position
  ) =>
    players.filter(
      (player) =>
        !usedPlayerIds.includes(
          player.id
        ) ||
        results?.[position]
          ?.player_id === player.id
    );

  const rows = Array.from({
    length: playerCount
  }).map((_, position) => {
    const result =
      results?.[position] || null;

    const points =
      getDisplayRoundPoints(
        position + 1,
        playerCount,
        doublePoints
      );

    const prize =
      prizes[position] || 0;

    return {
      pos: position + 1,
      result,
      points,
      prize
    };
  });

  const filledRows = rows.filter(
    (row) => row.result?.player_id
  );

  const getStatusLabel = (
    status
  ) => {
    switch (status) {
      case 'pending_payment':
        return 'Wacht op betaling';

      case 'registered':
        return 'Ingeschreven';

      case 'admin_added':
        return 'Toegevoegd';

      case 'late_added':
        return 'Via uitslag toegevoegd';

      case 'played':
        return 'Gespeeld';

      case 'no_show':
        return 'No-show';

      case 'refund_due':
        return 'Restitutie';

      case 'refunded':
        return 'Terugbetaald';

      case 'cancelled':
        return 'Geannuleerd';

      default:
        return status || '-';
    }
  };

  const getStatusColor = (
    status,
    isPaid
  ) => {
    if (status === 'refund_due') {
      return '#ffb74d';
    }

    if (
      status === 'no_show' &&
      isPaid
    ) {
      return '#ffb74d';
    }

    if (status === 'no_show') {
      return '#888';
    }

    if (isPaid) {
      return '#4caf50';
    }

    if (
      status ===
      'pending_payment'
    ) {
      return '#ff8a80';
    }

    return '#ffd740';
  };

  const handleAddEntry =
    async () => {
      if (
        !selectedEntryPlayerId
      ) {
        return;
      }

      await onAddRoundEntry?.(
        round,
        selectedEntryPlayerId
      );

      setSelectedEntryPlayerId(
        ''
      );
    };

  const handleDownloadRoundCSV =
    () => {
      if (filledRows.length === 0) {
        alert(
          'Er is nog geen rondeuitslag om te downloaden.'
        );

        return;
      }

      downloadRoundResultsCSV({
        roundNumber:
          round.round_number,
        includePrizes:
          canViewRoundPrizes,
        rows: filledRows.map(
          (row) => ({
            position:
              row.pos,
            name:
              row.result
                ?.player_name ||
              players.find(
                (player) =>
                  player.id ===
                  row.result
                    ?.player_id
              )
                ?.preferred_name ||
              players.find(
                (player) =>
                  player.id ===
                  row.result
                    ?.player_id
              )?.name ||
              'Onbekende speler',
            points:
              row.points,
            prize:
              row.prize
          })
        )
      });
    };

  return (
    <>
      <h2>
        Ronde {round.round_number}
      </h2>

      {canDeleteRound && (
        <div
          style={{
            display: 'flex',
            justifyContent:
              'flex-end',
            marginTop: -46,
            marginBottom: 20
          }}
        >
          <button
            type="button"
            onClick={() =>
              onDeleteRound?.(
                round
              )
            }
            style={{
              background:
                '#3a1111',
              color: '#ff8a80',
              border:
                '1px solid #7f3030',
              fontWeight: 800
            }}
          >
            Ronde verwijderen
          </button>
        </div>
      )}

      {canEnterResults && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns:
              'repeat(2, minmax(220px, 1fr))',
            gap: 16,
            alignItems: 'end',
            marginBottom: 20,
            maxWidth: 1000
          }}
        >
          {!isTeamEvent && (
            <div>
              <label
                style={{
                  display: 'block',
                  marginBottom: 6,
                  color: '#aaa'
                }}
              >
                Aantal deelnemers
                uitslag
              </label>

              <input
                type="number"
                min="0"
                value={
                  round.player_count ??
                  ''
                }
                onChange={(event) =>
                  onUpdateRound(
                    round.id,
                    {
                      player_count:
                        event.target
                          .value === ''
                          ? 0
                          : Number(
                              event
                                .target
                                .value
                            )
                    }
                  )
                }
                style={{
                  width: '100%',
                  padding: 10
                }}
              />
            </div>
          )}

          <div>
            <label
              style={{
                display: 'block',
                marginBottom: 6,
                color: '#aaa'
              }}
            >
              Speeldatum / starttijd
            </label>

            <input
              type="datetime-local"
              value={toDateTimeLocalValue(
                round.round_date
              )}
              onChange={(event) =>
                onUpdateRound(
                  round.id,
                  {
                    round_date:
                      fromDateTimeLocalValue(
                        event.target
                          .value
                      )
                  }
                )
              }
              style={{
                width: '100%',
                padding: 10
              }}
            />
          </div>

          <div>
            <label
              style={{
                display: 'block',
                marginBottom: 6,
                color: '#aaa'
              }}
            >
              Inschrijving opent
            </label>

            <input
              type="datetime-local"
              value={toDateTimeLocalValue(
                round.registration_opens_at
              )}
              onChange={(event) =>
                onUpdateRound(
                  round.id,
                  {
                    registration_opens_at:
                      fromDateTimeLocalValue(
                        event.target
                          .value
                      )
                  }
                )
              }
              style={{
                width: '100%',
                padding: 10
              }}
            />
          </div>

          <div>
            <label
              style={{
                display: 'block',
                marginBottom: 6,
                color: '#aaa'
              }}
            >
              Inschrijving sluit
            </label>

            <input
              type="datetime-local"
              value={toDateTimeLocalValue(
                round.registration_closes_at
              )}
              onChange={(event) =>
                onUpdateRound(
                  round.id,
                  {
                    registration_closes_at:
                      fromDateTimeLocalValue(
                        event.target
                          .value
                      )
                  }
                )
              }
              style={{
                width: '100%',
                padding: 10
              }}
            />
          </div>

          <div
            style={{
              gridColumn:
                '1 / -1',
              display: 'flex',
              alignItems:
                'center',
              gap: 14,
              flexWrap: 'wrap'
            }}
          >
            {!isTeamEvent &&
              canViewRoundPrizes && (
                <label
                  style={{
                    color: '#aaa',
                    display: 'flex',
                    gap: 8,
                    alignItems:
                      'center'
                  }}
                >
                  <input
                    type="checkbox"
                    checked={
                      splitFirstTwo
                    }
                    onChange={(
                      event
                    ) =>
                      setSplitFirstTwo(
                        event.target
                          .checked
                      )
                    }
                  />

                  Top 2 prijzen
                  splitten
                </label>
              )}

            <label
              style={{
                color: '#aaa',
                display: 'flex',
                gap: 8,
                alignItems:
                  'center'
              }}
            >
              <input
                type="checkbox"
                checked={
                  isTeamEvent
                }
                onChange={(event) =>
                  onUpdateRound(
                    round.id,
                    {
                      round_type:
                        event.target
                          .checked
                          ? 'team_event'
                          : 'normal'
                    }
                  )
                }
              />

              Team Event
            </label>

            <label
              style={{
                color: '#aaa',
                display: 'flex',
                gap: 8,
                alignItems:
                  'center'
              }}
            >
              <input
                type="checkbox"
                checked={
                  doublePoints
                }
                onChange={(event) =>
                  onUpdateRound(
                    round.id,
                    {
                      double_points:
                        event.target
                          .checked
                    }
                  )
                }
              />

              Dubbele punten
            </label>

            {!isTeamEvent &&
              canViewRoundPrizes && (
                <label
                  style={{
                    color: '#aaa',
                    display: 'flex',
                    gap: 8,
                    alignItems:
                      'center'
                  }}
                >
                  <input
                    type="checkbox"
                    checked={
                      forceHighFee
                    }
                    onChange={(
                      event
                    ) =>
                      onUpdateRound(
                        round.id,
                        {
                          force_high_fee:
                            event
                              .target
                              .checked
                        }
                      )
                    }
                  />

                  Gebruik 36+
                  inhouding
                </label>
              )}
          </div>

          {!isTeamEvent && (
            <div
              style={{
                gridColumn:
                  '1 / -1'
              }}
            >
              <label
                style={{
                  display: 'block',
                  marginBottom: 6,
                  color: '#aaa'
                }}
              >
                CSV uitslag uploaden
              </label>

              <input
                type="file"
                accept=".csv,text/csv"
                onChange={(event) => {
                  onImportCSV(
                    round,
                    event.target
                      .files?.[0]
                  );

                  event.target.value =
                    '';
                }}
                style={{
                  width: '100%',
                  padding: 10,
                  background:
                    '#181818',
                  color: '#fff',
                  border:
                    '1px solid #333',
                  borderRadius: 6
                }}
              />
            </div>
          )}
        </div>
      )}

      {canViewRoundPrizes && (
        <>
          <div
            style={{
              display: 'flex',
              gap: 30,
              flexWrap: 'wrap',
              marginBottom: 16,
              color: '#aaa'
            }}
          >
            {!isTeamEvent && (
              <>
                <div>
                  <strong>
                    Deelnemers
                    uitslag:
                  </strong>{' '}
                  {playerCount}
                </div>

                <div>
                  <strong>
                    Dagpot-spelers:
                  </strong>{' '}
                  {
                    effectiveDaypotPlayers
                  }
                </div>

                <div>
                  <strong>
                    Pot:
                  </strong>{' '}
                  {formatEuro(
                    roundPot
                  )}
                </div>

                <div>
                  <strong>
                    Betaalde plekken:
                  </strong>{' '}
                  {getPaidPlacesForRound(
                    playerCount
                  )}
                </div>
              </>
            )}

            <div>
              <strong>
                Ingeschreven:
              </strong>{' '}
              {
                currentEntries.length
              }
            </div>
          </div>

          <div
            style={{
              background:
                '#181818',
              border:
                '1px solid #333',
              borderRadius: 10,
              padding: 14,
              marginBottom: 22
            }}
          >
            <h3
              style={{
                marginTop: 0
              }}
            >
              📋 Deelnemers &
              buy-ins
            </h3>

            {canEnterResults && (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns:
                    '1fr auto',
                  gap: 10,
                  marginBottom: 16
                }}
              >
                <select
                  value={
                    selectedEntryPlayerId
                  }
                  onChange={(
                    event
                  ) =>
                    setSelectedEntryPlayerId(
                      event.target
                        .value
                    )
                  }
                  style={{
                    width: '100%',
                    padding: 10,
                    background:
                      '#fff',
                    color: '#111',
                    border:
                      '1px solid #333',
                    borderRadius: 6
                  }}
                >
                  <option value="">
                    Speler toevoegen
                    aan deze ronde...
                  </option>

                  {availableEntryPlayers.map(
                    (player) => (
                      <option
                        key={
                          player.id
                        }
                        value={
                          player.id
                        }
                      >
                        {player.preferred_name ||
                          player.name}
                      </option>
                    )
                  )}
                </select>

                <button
                  type="button"
                  onClick={
                    handleAddEntry
                  }
                  disabled={
                    !selectedEntryPlayerId
                  }
                >
                  Toevoegen
                </button>
              </div>
            )}

            <div
              style={{
                display: 'flex',
                gap: 24,
                flexWrap: 'wrap',
                marginBottom: 14
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 12,
                    color: '#aaa'
                  }}
                >
                  Deelnemers
                </div>

                <div
                  style={{
                    fontSize: 24,
                    fontWeight: 900
                  }}
                >
                  {
                    currentEntries.length
                  }
                </div>
              </div>

              <div>
                <div
                  style={{
                    fontSize: 12,
                    color: '#aaa'
                  }}
                >
                  Betaald
                </div>

                <div
                  style={{
                    fontSize: 24,
                    fontWeight: 900,
                    color:
                      '#4caf50'
                  }}
                >
                  {paidCount}
                </div>
              </div>

              <div>
                <div
                  style={{
                    fontSize: 12,
                    color: '#aaa'
                  }}
                >
                  Openstaand
                </div>

                <div
                  style={{
                    fontSize: 24,
                    fontWeight: 900,
                    color:
                      openPaymentCount >
                      0
                        ? '#ff8a80'
                        : '#4caf50'
                  }}
                >
                  {
                    openPaymentCount
                  }
                </div>
              </div>

              <div>
                <div
                  style={{
                    fontSize: 12,
                    color: '#aaa'
                  }}
                >
                  Restitutie
                </div>

                <div
                  style={{
                    fontSize: 24,
                    fontWeight: 900,
                    color:
                      refundCount >
                      0
                        ? '#ffb74d'
                        : '#4caf50'
                  }}
                >
                  {refundCount}
                </div>
              </div>
            </div>

            {currentEntries.length ===
            0 ? (
              <div
                style={{
                  color: '#888'
                }}
              >
                Nog geen deelnemers
                ingeschreven voor deze
                ronde.
              </div>
            ) : (
              <div
                style={{
                  display: 'grid',
                  gap: 6
                }}
              >
                {currentEntries.map(
                  (entry) => {
                    const player =
                      entry.player;

                    const isPaid =
                      paidPlayerIds.has(
                        entry.player_id
                      );

                    const paymentUrl =
                      player
                        ? getRoundPaymentUrl?.(
                            round,
                            player
                          )
                        : null;

                    const reference =
                      player
                        ? getRoundPaymentReference?.(
                            round,
                            player
                          )
                        : null;

                    const statusColor =
                      getStatusColor(
                        entry.status,
                        isPaid
                      );

                    return (
                      <div
                        key={
                          entry.id
                        }
                        style={{
                          display:
                            'grid',
                          gridTemplateColumns:
                            '32px 1.4fr 1fr auto auto auto',
                          gap: 8,
                          alignItems:
                            'center',
                          background:
                            '#111',
                          borderRadius: 8,
                          padding:
                            '8px 10px'
                        }}
                      >
                        <div
                          style={{
                            fontWeight:
                              900
                          }}
                        >
                          {isPaid
                            ? '✅'
                            : entry.status ===
                                'no_show'
                              ? '🚫'
                              : '❌'}
                        </div>

                        <div
                          style={{
                            color:
                              statusColor,
                            fontWeight:
                              700
                          }}
                        >
                          {
                            entry.playerName
                          }

                          {reference && (
                            <div
                              style={{
                                color:
                                  '#888',
                                fontSize:
                                  12,
                                fontWeight:
                                  400
                              }}
                            >
                              {
                                reference
                              }
                            </div>
                          )}
                        </div>

                        <div
                          style={{
                            color:
                              statusColor,
                            fontWeight:
                              800
                          }}
                        >
                          {getStatusLabel(
                            entry.status
                          )}
                        </div>

                        {paymentUrl ? (
                          <a
                            href={
                              paymentUrl
                            }
                            target="_blank"
                            rel="noreferrer"
                          >
                            Betaallink
                          </a>
                        ) : (
                          <span />
                        )}

                        {player &&
                          (isPaid ? (
                            <button
                              type="button"
                              onClick={() =>
                                onRemoveRoundPlayerPayment?.(
                                  round,
                                  player
                                )
                              }
                              style={{
                                color:
                                  'red'
                              }}
                            >
                              Verwijder
                              betaling
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() =>
                                onMarkRoundPlayerPaid?.(
                                  round,
                                  player
                                )
                              }
                            >
                              Handmatig
                              betaald
                            </button>
                          ))}

                        {canEnterResults && (
                          <button
                            type="button"
                            onClick={() =>
                              onCancelRoundEntry?.(
                                entry
                              )
                            }
                            style={{
                              color:
                                '#ff8a80'
                            }}
                          >
                            Annuleren
                          </button>
                        )}
                      </div>
                    );
                  }
                )}
              </div>
            )}
          </div>
        </>
      )}

      {isTeamEvent ? (
        <TeamEventPanel
          round={round}
          players={players}
          teamEventTournaments={
            teamEventTournaments
          }
          teamEventTeams={
            teamEventTeams
          }
          teamEventPlayers={
            teamEventPlayers
          }
          canEnterResults={
            canEnterResults
          }
          onEnsureTournaments={
            onEnsureTeamEventTournaments
          }
          onSaveTeam={
            onSaveTeamEventTeam
          }
          onDeleteTeam={
            onDeleteTeamEventTeam
          }
          onImportTeamsCSV={
            onImportTeamEventTeamsCSV
          }
          onImportTournamentCSV={
            onImportTeamEventTournamentCSV
          }
        />
      ) : (
        <>
          {canEnterResults &&
            playerCount > 0 && (
              <table
                style={{
                  width: '100%',
                  borderCollapse:
                    'collapse',
                  marginBottom: 30
                }}
              >
                <thead>
                  <tr>
                    <th style={thStyle}>
                      #
                    </th>

                    <th style={thStyle}>
                      Naam
                    </th>

                    <th style={thStyle}>
                      Punten
                    </th>

                    {canViewRoundPrizes && (
                      <th
                        style={thStyle}
                      >
                        Prijs
                      </th>
                    )}
                  </tr>
                </thead>

                <tbody>
                  {rows.map(
                    (
                      row,
                      index
                    ) => (
                      <tr
                        key={
                          row.pos
                        }
                      >
                        <td
                          style={{
                            ...tdStyle,
                            fontWeight:
                              700
                          }}
                        >
                          {
                            row.pos
                          }
                        </td>

                        <td
                          style={
                            tdStyle
                          }
                        >
                          <select
                            value={
                              row
                                .result
                                ?.player_id ||
                              ''
                            }
                            onChange={(
                              event
                            ) =>
                              onUpdateResult(
                                round,
                                index +
                                  1,
                                event
                                  .target
                                  .value
                              )
                            }
                            style={{
                              width:
                                '100%',
                              padding:
                                10,
                              background:
                                '#fff',
                              color:
                                '#111',
                              border:
                                '1px solid #333',
                              borderRadius:
                                6
                            }}
                          >
                            <option value="">
                              -- kies
                              speler --
                            </option>

                            {getAvailablePlayers(
                              index
                            ).map(
                              (
                                player
                              ) => (
                                <option
                                  key={
                                    player.id
                                  }
                                  value={
                                    player.id
                                  }
                                >
                                  {player.preferred_name ||
                                    player.name}
                                </option>
                              )
                            )}
                          </select>
                        </td>

                        <td
                          style={{
                            ...tdStyle,
                            fontWeight:
                              800,
                            color:
                              '#ffd740'
                          }}
                        >
                          {
                            row.points
                          }
                        </td>

                        {canViewRoundPrizes && (
                          <td
                            style={{
                              ...tdStyle,
                              fontWeight:
                                800,
                              color:
                                row.prize >
                                0
                                  ? '#4caf50'
                                  : '#888'
                            }}
                          >
                            {row.prize >
                            0
                              ? formatEuro(
                                  row.prize
                                )
                              : '-'}
                          </td>
                        )}
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            )}

          <div
            style={{
              display: 'flex',
              justifyContent:
                'flex-end',
              marginBottom: 12
            }}
          >
            <button
              type="button"
              onClick={
                handleDownloadRoundCSV
              }
              disabled={
                filledRows.length ===
                0
              }
            >
              📄 CSV downloaden
            </button>
          </div>

          <div id="round-export">
            <h3
              style={{
                marginBottom: 12
              }}
            >
              Uitslag Ronde{' '}
              {round.round_number}
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
                    Naam
                  </th>

                  <th style={thStyle}>
                    Punten
                  </th>

                  {canViewRoundPrizes && (
                    <th
                      style={thStyle}
                    >
                      Prijs
                    </th>
                  )}
                </tr>
              </thead>

              <tbody>
                {filledRows.length >
                0 ? (
                  filledRows.map(
                    (row) => (
                      <tr
                        key={`${row.pos}-${row.result.player_id}`}
                      >
                        <td
                          style={
                            tdStyle
                          }
                        >
                          {
                            row.pos
                          }
                        </td>

                        <td
                          style={
                            tdStyle
                          }
                        >
                          {
                            row
                              .result
                              .player_name
                          }
                        </td>

                        <td
                          style={{
                            ...tdStyle,
                            fontWeight:
                              800,
                            color:
                              '#ffd740'
                          }}
                        >
                          {
                            row.points
                          }
                        </td>

                        {canViewRoundPrizes && (
                          <td
                            style={{
                              ...tdStyle,
                              fontWeight:
                                800,
                              color:
                                row.prize >
                                0
                                  ? '#4caf50'
                                  : '#888'
                            }}
                          >
                            {row.prize >
                            0
                              ? formatEuro(
                                  row.prize
                                )
                              : '-'}
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
                        canViewRoundPrizes
                          ? 4
                          : 3
                      }
                    >
                      Nog geen spelers
                      ingevuld.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </>
  );
}