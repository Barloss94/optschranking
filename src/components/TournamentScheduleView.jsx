import {
  useEffect,
  useMemo,
  useState
} from 'react';
import { supabase } from '../lib/supabaseClient';

function toDateTimeLocalValue(value) {
  if (!value) return '';

  const date = new Date(value);
  const offset = date.getTimezoneOffset();

  return new Date(
    date.getTime() -
      offset * 60 * 1000
  )
    .toISOString()
    .slice(0, 16);
}

function fromDateTimeLocalValue(value) {
  if (!value) return null;

  return new Date(value).toISOString();
}

function formatDateTime(value) {
  if (!value) return '-';

  return new Date(value).toLocaleString(
    'nl-NL',
    {
      weekday: 'short',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }
  );
}

function getScheduleStatus(item) {
  const now = new Date();

  const opensAt =
    item.registration_opens_at
      ? new Date(
          item.registration_opens_at
        )
      : null;

  const closesAt =
    item.registration_closes_at
      ? new Date(
          item.registration_closes_at
        )
      : null;

  const roundDate =
    item.round_date
      ? new Date(item.round_date)
      : null;

  if (
    roundDate &&
    roundDate < now &&
    item.round_id
  ) {
    return {
      label: 'Actief / gespeeld',
      color: '#4caf50'
    };
  }

  if (
    closesAt &&
    now > closesAt
  ) {
    return {
      label: 'Inschrijving gesloten',
      color: '#ff8a80'
    };
  }

  if (
    opensAt &&
    now >= opensAt
  ) {
    return {
      label: item.round_id
        ? 'Inschrijving open'
        : 'Wordt geactiveerd',
      color: '#4caf50'
    };
  }

  return {
    label: 'Gepland',
    color: '#ffd740'
  };
}

const emptyForm = {
  round_number: '',
  round_date: '',
  registration_opens_at: '',
  registration_closes_at: '',
  round_type: 'normal',
  double_points: false,
  force_high_fee: false,
  host_not_playing: false,
  payment_code: ''
};

export default function TournamentScheduleView({
  season,
  isAdmin,
  onScheduleChanged
}) {
  const [
    schedule,
    setSchedule
  ] = useState([]);

  const [
    loading,
    setLoading
  ] = useState(true);

  const [
    form,
    setForm
  ] = useState(emptyForm);

  const [
    editingId,
    setEditingId
  ] = useState(null);

  const loadSchedule = async () => {
    if (!season?.id) {
      setSchedule([]);
      setLoading(false);
      return;
    }

    const { data, error } =
      await supabase
        .from('tournament_schedule')
        .select('*')
        .eq(
          'season_id',
          season.id
        )
        .order(
          'round_number',
          {
            ascending: true
          }
        );

    if (error) {
      console.error(
        'Toernooischema laden mislukt:',
        error
      );

      setSchedule([]);
      setLoading(false);
      return;
    }

    setSchedule(data || []);
    setLoading(false);
  };

  useEffect(() => {
    loadSchedule();

    const interval =
      window.setInterval(
        loadSchedule,
        60000
      );

    return () =>
      window.clearInterval(
        interval
      );
  }, [season?.id]);

  const nextRoundNumber =
    useMemo(() => {
      if (!schedule.length) {
        return 1;
      }

      return (
        Math.max(
          ...schedule.map(
            (item) =>
              Number(
                item.round_number
              ) || 0
          )
        ) + 1
      );
    }, [schedule]);

  useEffect(() => {
    if (
      !editingId &&
      !form.round_number
    ) {
      setForm(
        (current) => ({
          ...current,
          round_number:
            nextRoundNumber,
          payment_code:
            `VR${nextRoundNumber}`
        })
      );
    }
  }, [
    nextRoundNumber,
    editingId
  ]);

  const resetForm = () => {
    setEditingId(null);

    const next =
      schedule.length > 0
        ? Math.max(
            ...schedule.map(
              (item) =>
                Number(
                  item.round_number
                ) || 0
            )
          ) + 1
        : 1;

    setForm({
      ...emptyForm,
      round_number: next,
      payment_code: `VR${next}`
    });
  };

  const startEdit = (item) => {
    setEditingId(item.id);

    setForm({
      round_number:
        item.round_number ?? '',
      round_date:
        toDateTimeLocalValue(
          item.round_date
        ),
      registration_opens_at:
        toDateTimeLocalValue(
          item.registration_opens_at
        ),
      registration_closes_at:
        toDateTimeLocalValue(
          item.registration_closes_at
        ),
      round_type:
        item.round_type ||
        'normal',
      double_points:
        Boolean(
          item.double_points
        ),
      force_high_fee:
        Boolean(
          item.force_high_fee
        ),
      host_not_playing:
        Boolean(
          item.host_not_playing
        ),
      payment_code:
        item.payment_code || ''
    });

    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  const saveSchedule = async (
    event
  ) => {
    event.preventDefault();

    if (!season?.id) return;

    const roundNumber =
      Number(
        form.round_number
      );

    if (
      !Number.isInteger(
        roundNumber
      ) ||
      roundNumber <= 0
    ) {
      alert(
        'Vul een geldig rondenummer in.'
      );
      return;
    }

    if (
      !form.registration_opens_at
    ) {
      alert(
        'Vul in wanneer de inschrijving opent.'
      );
      return;
    }

    const payload = {
      season_id: season.id,
      round_number:
        roundNumber,
      round_date:
        fromDateTimeLocalValue(
          form.round_date
        ),
      registration_opens_at:
        fromDateTimeLocalValue(
          form.registration_opens_at
        ),
      registration_closes_at:
        fromDateTimeLocalValue(
          form.registration_closes_at
        ),
      round_type:
        form.round_type,
      double_points:
        Boolean(
          form.double_points
        ),
      force_high_fee:
        Boolean(
          form.force_high_fee
        ),
      host_not_playing:
        Boolean(
          form.host_not_playing
        ),
      payment_code:
        String(
          form.payment_code || ''
        ).trim() ||
        `VR${roundNumber}`
    };

    let response;

    if (editingId) {
      const current =
        schedule.find(
          (item) =>
            item.id ===
            editingId
        );

      response =
        await supabase
          .from(
            'tournament_schedule'
          )
          .update(payload)
          .eq(
            'id',
            editingId
          );

      if (
        !response.error &&
        current?.round_id
      ) {
        const {
          error: roundError
        } = await supabase
          .from('rounds')
          .update({
            round_number:
              payload.round_number,
            round_date:
              payload.round_date,
            registration_opens_at:
              payload.registration_opens_at,
            registration_closes_at:
              payload.registration_closes_at,
            round_type:
              payload.round_type,
            double_points:
              payload.double_points,
            force_high_fee:
              payload.force_high_fee,
            host_not_playing:
              payload.host_not_playing,
            payment_code:
              payload.payment_code
          })
          .eq(
            'id',
            current.round_id
          );

        if (roundError) {
          response = {
            error: roundError
          };
        }
      }
    } else {
      response =
        await supabase
          .from(
            'tournament_schedule'
          )
          .insert(payload);
    }

    if (response.error) {
      alert(
        response.error.message
      );
      return;
    }

    await loadSchedule();
    await onScheduleChanged?.();
    resetForm();
  };

  const deleteSchedule = async (
    item
  ) => {
    if (item.round_id) {
      alert(
        'Deze planning is al geactiveerd als rankingronde en kan hier niet meer worden verwijderd.'
      );
      return;
    }

    if (
      !window.confirm(
        `Ronde ${item.round_number} uit het toernooischema verwijderen?`
      )
    ) {
      return;
    }

    const { error } =
      await supabase
        .from(
          'tournament_schedule'
        )
        .delete()
        .eq('id', item.id);

    if (error) {
      alert(error.message);
      return;
    }

    await loadSchedule();
    await onScheduleChanged?.();

    if (
      editingId === item.id
    ) {
      resetForm();
    }
  };

  return (
    <>
      <h2>
        📅 Toernooischema
      </h2>

      <div
        style={{
          color: '#aaa',
          marginBottom: 18,
          lineHeight: 1.5
        }}
      >
        Alle geplande rankingtoernooien
        van dit seizoen. Een ronde wordt
        automatisch geactiveerd zodra de
        ingestelde inschrijving opent.
      </div>

      {isAdmin && (
        <form
          onSubmit={
            saveSchedule
          }
          style={{
            background: '#181818',
            border:
              '1px solid #333',
            borderRadius: 12,
            padding: 16,
            marginBottom: 22
          }}
        >
          <h3
            style={{
              marginTop: 0
            }}
          >
            {editingId
              ? 'Planning aanpassen'
              : 'Toernooi plannen'}
          </h3>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns:
                'repeat(auto-fit, minmax(210px, 1fr))',
              gap: 12
            }}
          >
            <label>
              <div
                style={{
                  color: '#aaa',
                  marginBottom: 5
                }}
              >
                Ronde
              </div>

              <input
                type="number"
                min="1"
                value={
                  form.round_number
                }
                onChange={(
                  event
                ) => {
                  const value =
                    event.target
                      .value;

                  setForm(
                    (current) => ({
                      ...current,
                      round_number:
                        value,
                      payment_code:
                        current
                          .payment_code ===
                          `VR${current.round_number}` ||
                        !current
                          .payment_code
                          ? `VR${value}`
                          : current.payment_code
                    })
                  );
                }}
                style={{
                  width: '100%'
                }}
              />
            </label>

            <label>
              <div
                style={{
                  color: '#aaa',
                  marginBottom: 5
                }}
              >
                Speeldatum / starttijd
              </div>

              <input
                type="datetime-local"
                value={
                  form.round_date
                }
                onChange={(
                  event
                ) =>
                  setForm(
                    (current) => ({
                      ...current,
                      round_date:
                        event.target
                          .value
                    })
                  )
                }
                style={{
                  width: '100%'
                }}
              />
            </label>

            <label>
              <div
                style={{
                  color: '#aaa',
                  marginBottom: 5
                }}
              >
                Inschrijving opent
              </div>

              <input
                type="datetime-local"
                required
                value={
                  form.registration_opens_at
                }
                onChange={(
                  event
                ) =>
                  setForm(
                    (current) => ({
                      ...current,
                      registration_opens_at:
                        event.target
                          .value
                    })
                  )
                }
                style={{
                  width: '100%'
                }}
              />
            </label>

            <label>
              <div
                style={{
                  color: '#aaa',
                  marginBottom: 5
                }}
              >
                Inschrijving sluit
              </div>

              <input
                type="datetime-local"
                value={
                  form.registration_closes_at
                }
                onChange={(
                  event
                ) =>
                  setForm(
                    (current) => ({
                      ...current,
                      registration_closes_at:
                        event.target
                          .value
                    })
                  )
                }
                style={{
                  width: '100%'
                }}
              />
            </label>

            <label>
              <div
                style={{
                  color: '#aaa',
                  marginBottom: 5
                }}
              >
                Type
              </div>

              <select
                value={
                  form.round_type
                }
                onChange={(
                  event
                ) =>
                  setForm(
                    (current) => ({
                      ...current,
                      round_type:
                        event.target
                          .value
                    })
                  )
                }
                style={{
                  width: '100%'
                }}
              >
                <option value="normal">
                  Normaal
                </option>

                <option value="team_event">
                  Team Event
                </option>
              </select>
            </label>

            <label>
              <div
                style={{
                  color: '#aaa',
                  marginBottom: 5
                }}
              >
                Betaalcode
              </div>

              <input
                type="text"
                value={
                  form.payment_code
                }
                onChange={(
                  event
                ) =>
                  setForm(
                    (current) => ({
                      ...current,
                      payment_code:
                        event.target
                          .value
                    })
                  )
                }
                style={{
                  width: '100%'
                }}
              />
            </label>
          </div>

          <div
            style={{
              display: 'flex',
              gap: 14,
              flexWrap: 'wrap',
              marginTop: 14
            }}
          >
            <label
              style={{
                display: 'flex',
                alignItems:
                  'center',
                gap: 7
              }}
            >
              <input
                type="checkbox"
                checked={
                  form.double_points
                }
                onChange={(
                  event
                ) =>
                  setForm(
                    (current) => ({
                      ...current,
                      double_points:
                        event.target
                          .checked
                    })
                  )
                }
              />
              Dubbele punten
            </label>

            <label
              style={{
                display: 'flex',
                alignItems:
                  'center',
                gap: 7
              }}
            >
              <input
                type="checkbox"
                checked={
                  form.force_high_fee
                }
                onChange={(
                  event
                ) =>
                  setForm(
                    (current) => ({
                      ...current,
                      force_high_fee:
                        event.target
                          .checked
                    })
                  )
                }
              />
              Gebruik 36+ inhouding
            </label>

            <label
              style={{
                display: 'flex',
                alignItems:
                  'center',
                gap: 7
              }}
            >
              <input
                type="checkbox"
                checked={
                  form.host_not_playing
                }
                onChange={(
                  event
                ) =>
                  setForm(
                    (current) => ({
                      ...current,
                      host_not_playing:
                        event.target
                          .checked
                    })
                  )
                }
              />
              Host speelt niet mee
            </label>
          </div>

          <div
            style={{
              display: 'flex',
              gap: 10,
              flexWrap: 'wrap',
              marginTop: 16
            }}
          >
            <button
              type="submit"
            >
              {editingId
                ? '💾 Wijzigingen opslaan'
                : '➕ Toernooi toevoegen'}
            </button>

            {editingId && (
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
        </form>
      )}

      {loading ? (
        <div>
          Schema laden...
        </div>
      ) : schedule.length === 0 ? (
        <div
          style={{
            color: '#888'
          }}
        >
          Er zijn nog geen
          toernooien gepland.
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gap: 10
          }}
        >
          {schedule.map(
            (item) => {
              const status =
                getScheduleStatus(
                  item
                );

              return (
                <div
                  key={item.id}
                  style={{
                    background:
                      '#181818',
                    border:
                      item.round_id
                        ? '1px solid rgba(76, 175, 80, 0.38)'
                        : '1px solid #333',
                    borderRadius: 11,
                    padding: 14
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent:
                        'space-between',
                      gap: 12,
                      flexWrap:
                        'wrap'
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: 19,
                          fontWeight:
                            900
                        }}
                      >
                        Ronde{' '}
                        {
                          item.round_number
                        }
                      </div>

                      <div
                        style={{
                          color:
                            '#aaa',
                          marginTop: 5,
                          lineHeight: 1.5
                        }}
                      >
                        Speeldatum:{' '}
                        {formatDateTime(
                          item.round_date
                        )}
                        <br />
                        Inschrijving
                        opent:{' '}
                        {formatDateTime(
                          item.registration_opens_at
                        )}
                        <br />
                        Inschrijving
                        sluit:{' '}
                        {formatDateTime(
                          item.registration_closes_at
                        )}
                      </div>
                    </div>

                    <div
                      style={{
                        textAlign:
                          'right'
                      }}
                    >
                      <div
                        style={{
                          color:
                            status.color,
                          fontWeight:
                            900
                        }}
                      >
                        {
                          status.label
                        }
                      </div>

                      <div
                        style={{
                          color:
                            '#aaa',
                          marginTop: 5
                        }}
                      >
                        {item.round_type ===
                        'team_event'
                          ? '👥 Team Event'
                          : '♠ Normaal'}

                        {item.double_points
                          ? ' · x2 punten'
                          : ''}
                      </div>
                    </div>
                  </div>

                  {isAdmin && (
                    <div
                      style={{
                        display:
                          'flex',
                        gap: 8,
                        flexWrap:
                          'wrap',
                        marginTop: 12
                      }}
                    >
                      <button
                        type="button"
                        onClick={() =>
                          startEdit(
                            item
                          )
                        }
                      >
                        ✏️ Aanpassen
                      </button>

                      {!item.round_id && (
                        <button
                          type="button"
                          onClick={() =>
                            deleteSchedule(
                              item
                            )
                          }
                          style={{
                            color:
                              '#ff8a80'
                          }}
                        >
                          🗑️ Verwijderen
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            }
          )}
        </div>
      )}
    </>
  );
}
