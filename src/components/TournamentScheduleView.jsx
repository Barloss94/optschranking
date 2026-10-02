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
    date.getTime() - offset * 60 * 1000
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

function formatTime(value) {
  if (!value) return '-';

  return new Date(value).toLocaleTimeString(
    'nl-NL',
    {
      hour: '2-digit',
      minute: '2-digit'
    }
  );
}

function escapeIcsText(value) {
  return String(value || '')
    .replace(/\\/g, '\\\\')
    .replace(/\r?\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;');
}

function toIcsUtc(value) {
  if (!value) return '';

  return new Date(value)
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}Z$/, 'Z');
}

function getScheduleTypeLabel(item) {
  if (
    item.schedule_type ===
    'final_confirmed'
  ) {
    return 'Finale bevestigd';
  }

  if (
    item.schedule_type ===
    'final_provisional'
  ) {
    return 'Finale onder voorbehoud';
  }

  if (
    item.schedule_type ===
    'team_event'
  ) {
    return item.double_points
      ? 'Team Event · dubbele punten'
      : 'Team Event';
  }

  if (
    item.schedule_type ===
    'double_points'
  ) {
    return 'Dubbele punten';
  }

  return 'Normaal';
}

function formatMonthTitle(date) {
  return date.toLocaleDateString(
    'nl-NL',
    {
      month: 'long',
      year: 'numeric'
    }
  );
}

function isFinaleType(type) {
  return (
    type === 'final_confirmed' ||
    type === 'final_provisional'
  );
}

function getItemLabel(item) {
  if (
    item.schedule_type ===
    'final_confirmed'
  ) {
    return '🏆 FINALE';
  }

  if (
    item.schedule_type ===
    'final_provisional'
  ) {
    return '🕒 FINALE';
  }

  if (
    item.schedule_type ===
    'team_event'
  ) {
    return `👥 Ronde ${item.round_number}`;
  }

  if (
    item.schedule_type ===
    'double_points'
  ) {
    return `✨ Ronde ${item.round_number}`;
  }

  return `♠ Ronde ${item.round_number}`;
}

function getScheduleStatus(item) {
  if (
    item.schedule_type ===
    'final_confirmed'
  ) {
    return {
      label: 'Finale bevestigd',
      color: '#4caf50'
    };
  }

  if (
    item.schedule_type ===
    'final_provisional'
  ) {
    return {
      label: 'Finale onder voorbehoud',
      color: '#ffd740'
    };
  }

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

function sameLocalDate(
  value,
  date
) {
  if (!value) return false;

  const candidate =
    new Date(value);

  return (
    candidate.getFullYear() ===
      date.getFullYear() &&
    candidate.getMonth() ===
      date.getMonth() &&
    candidate.getDate() ===
      date.getDate()
  );
}

function buildCalendarDays(monthDate) {
  const year =
    monthDate.getFullYear();

  const month =
    monthDate.getMonth();

  const firstOfMonth =
    new Date(
      year,
      month,
      1
    );

  const lastOfMonth =
    new Date(
      year,
      month + 1,
      0
    );

  const mondayOffset =
    (
      firstOfMonth.getDay() +
      6
    ) % 7;

  const start =
    new Date(
      year,
      month,
      1 - mondayOffset
    );

  const sundayOffset =
    (
      7 -
      (
        (
          lastOfMonth.getDay() +
          6
        ) % 7
      ) -
      1
    );

  const end =
    new Date(
      year,
      month,
      lastOfMonth.getDate() +
        sundayOffset
    );

  const days = [];
  const cursor =
    new Date(start);

  while (
    cursor <= end
  ) {
    days.push(
      new Date(cursor)
    );

    cursor.setDate(
      cursor.getDate() + 1
    );
  }

  return days;
}

const emptyForm = {
  round_number: '',
  round_date: '',
  registration_opens_at: '',
  registration_closes_at: '',
  finalist_registration_deadline_at: '',
  waitlist_registration_deadline_at: '',
  schedule_type: 'normal',
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

  const [
    viewMode,
    setViewMode
  ] = useState('list');

  const [
    calendarMonth,
    setCalendarMonth
  ] = useState(
    () =>
      new Date(
        new Date().getFullYear(),
        new Date().getMonth(),
        1
      )
  );

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
            ascending: true,
            nullsFirst: false
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

  useEffect(() => {
    if (
      schedule.length === 0
    ) {
      return;
    }

    const upcoming =
      schedule
        .filter(
          (item) =>
            item.round_date &&
            new Date(
              item.round_date
            ) >= new Date()
        )
        .sort(
          (a, b) =>
            new Date(
              a.round_date
            ) -
            new Date(
              b.round_date
            )
        )[0];

    const fallback =
      schedule.find(
        (item) =>
          item.round_date
      );

    const target =
      upcoming || fallback;

    if (target?.round_date) {
      const date =
        new Date(
          target.round_date
        );

      setCalendarMonth(
        new Date(
          date.getFullYear(),
          date.getMonth(),
          1
        )
      );
    }
  }, [season?.id]);

  const nextRoundNumber =
    useMemo(() => {
      const roundNumbers =
        schedule
          .map(
            (item) =>
              Number(
                item.round_number
              )
          )
          .filter(
            (value) =>
              Number.isInteger(value) &&
              value > 0
          );

      return roundNumbers.length
        ? Math.max(
            ...roundNumbers
          ) + 1
        : 1;
    }, [schedule]);

  const calendarDays =
    useMemo(
      () =>
        buildCalendarDays(
          calendarMonth
        ),
      [calendarMonth]
    );

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
    editingId,
    form.round_number
  ]);

  const resetForm = () => {
    setEditingId(null);

    setForm({
      ...emptyForm,
      round_number:
        nextRoundNumber,
      payment_code:
        `VR${nextRoundNumber}`
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
      finalist_registration_deadline_at:
        toDateTimeLocalValue(
          item.finalist_registration_deadline_at
        ),
      waitlist_registration_deadline_at:
        toDateTimeLocalValue(
          item.waitlist_registration_deadline_at
        ),
      schedule_type:
        item.schedule_type ||
        (item.round_type === 'team_event'
          ? 'team_event'
          : item.double_points
            ? 'double_points'
            : 'normal'),
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

    const finale =
      isFinaleType(
        form.schedule_type
      );

    const roundNumber =
      finale
        ? null
        : Number(
            form.round_number
          );

    if (
      !finale &&
      (
        !Number.isInteger(
          roundNumber
        ) ||
        roundNumber <= 0
      )
    ) {
      alert(
        'Vul een geldig rondenummer in.'
      );
      return;
    }

    if (!form.round_date) {
      alert(
        'Vul de speeldatum en starttijd in.'
      );
      return;
    }

    if (
      !finale &&
      !form.registration_opens_at
    ) {
      alert(
        'Vul in wanneer de inschrijving opent.'
      );
      return;
    }

    if (finale) {
      if (
        !form.finalist_registration_deadline_at ||
        !form.waitlist_registration_deadline_at
      ) {
        alert(
          'Vul beide finale-aanmelddeadlines in.'
        );
        return;
      }

      const finalistDeadline =
        new Date(
          form.finalist_registration_deadline_at
        );

      const waitlistDeadline =
        new Date(
          form.waitlist_registration_deadline_at
        );

      const finalDate =
        new Date(
          form.round_date
        );

      if (
        finalistDeadline >=
        waitlistDeadline
      ) {
        alert(
          'De deadline voor gekwalificeerden moet vóór de wachtlijstdeadline liggen.'
        );
        return;
      }

      if (
        waitlistDeadline >=
        finalDate
      ) {
        alert(
          'De wachtlijstdeadline moet vóór de start van de finale liggen.'
        );
        return;
      }
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
        finale
          ? null
          : fromDateTimeLocalValue(
              form.registration_opens_at
            ),
      registration_closes_at:
        finale
          ? null
          : fromDateTimeLocalValue(
              form.registration_closes_at
            ),
      finalist_registration_deadline_at:
        finale
          ? fromDateTimeLocalValue(
              form.finalist_registration_deadline_at
            )
          : null,
      waitlist_registration_deadline_at:
        finale
          ? fromDateTimeLocalValue(
              form.waitlist_registration_deadline_at
            )
          : null,
      schedule_type:
        form.schedule_type,
      round_type:
        form.schedule_type ===
          'team_event'
          ? 'team_event'
          : 'normal',
      double_points:
        form.schedule_type ===
          'double_points' ||
        (
          form.schedule_type ===
            'team_event' &&
          Boolean(
            form.double_points
          )
        ),
      force_high_fee:
        finale
          ? false
          : Boolean(
              form.force_high_fee
            ),
      host_not_playing:
        finale
          ? false
          : Boolean(
              form.host_not_playing
            ),
      payment_code:
        finale
          ? null
          : String(
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

      if (
        current?.round_id &&
        finale
      ) {
        alert(
          'Een al geactiveerde rankingronde kan niet worden omgezet naar een finale.'
        );
        return;
      }

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

    const itemLabel =
      isFinaleType(
        item.schedule_type
      )
        ? 'de finale'
        : `Ronde ${item.round_number}`;

    if (
      !window.confirm(
        `${itemLabel} uit het toernooischema verwijderen?`
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

  const finale =
    isFinaleType(
      form.schedule_type
    );

  const shiftCalendarMonth = (
    amount
  ) => {
    setCalendarMonth(
      (current) =>
        new Date(
          current.getFullYear(),
          current.getMonth() +
            amount,
          1
        )
    );
  };

  const downloadCalendar = () => {
    const events =
      schedule.filter(
        (item) =>
          item.round_date
      );

    if (events.length === 0) {
      alert(
        'Er staan nog geen toernooien met een speeldatum in het schema.'
      );
      return;
    }

    const nowStamp =
      toIcsUtc(
        new Date()
      );

    const lines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//OPTSCH//Ranking Calendar//NL',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'X-WR-CALNAME:OPTSCH Ranking',
      'X-WR-CALDESC:Toernooischema OPTSCH Ranking'
    ];

    for (const item of events) {
      const finaleItem =
        isFinaleType(
          item.schedule_type
        );

      const summary =
        finaleItem
          ? 'OPTSCH Ranking - FINALE'
          : `OPTSCH Ranking - Ronde ${item.round_number}`;

      const descriptionParts = [
        `Type: ${getScheduleTypeLabel(item)}`
      ];

      if (finaleItem) {
        if (
          item.finalist_registration_deadline_at
        ) {
          descriptionParts.push(
            `Aanmelddeadline gekwalificeerden: ${formatDateTime(
              item.finalist_registration_deadline_at
            )}`
          );
        }

        if (
          item.waitlist_registration_deadline_at
        ) {
          descriptionParts.push(
            `Deadline wachtlijst: ${formatDateTime(
              item.waitlist_registration_deadline_at
            )}`
          );
        }
      } else {
        if (
          item.registration_opens_at
        ) {
          descriptionParts.push(
            `Inschrijving opent: ${formatDateTime(
              item.registration_opens_at
            )}`
          );
        }

        if (
          item.registration_closes_at
        ) {
          descriptionParts.push(
            `Inschrijving sluit: ${formatDateTime(
              item.registration_closes_at
            )}`
          );
        }
      }

      lines.push(
        'BEGIN:VEVENT',
        `UID:optsch-${item.id}@ranking`,
        `DTSTAMP:${nowStamp}`,
        `DTSTART:${toIcsUtc(
          item.round_date
        )}`,
        `SUMMARY:${escapeIcsText(
          summary
        )}`,
        `DESCRIPTION:${escapeIcsText(
          descriptionParts.join(
            '\\n'
          )
        )}`,
        'END:VEVENT'
      );
    }

    lines.push(
      'END:VCALENDAR'
    );

    const blob =
      new Blob(
        [
          lines.join(
            '\r\n'
          )
        ],
        {
          type:
            'text/calendar;charset=utf-8'
        }
      );

    const url =
      URL.createObjectURL(
        blob
      );

    const link =
      document.createElement(
        'a'
      );

    link.href = url;
    link.download =
      'optsch-ranking-kalender.ics';

    document.body.appendChild(
      link
    );

    link.click();
    link.remove();

    URL.revokeObjectURL(
      url
    );
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
        en de finale van dit seizoen.
        Rankingrondes worden automatisch
        geactiveerd zodra de inschrijving
        opent. Finale-aanmelding start
        automatisch zodra de laatste
        rankingronde is verwerkt.
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

              {finale ? (
                <input
                  type="text"
                  value="FINALE"
                  readOnly
                  style={{
                    width: '100%'
                  }}
                />
              ) : (
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
              )}
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
                Type
              </div>

              <select
                value={
                  form.schedule_type
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
                      schedule_type:
                        value,
                      double_points:
                        value ===
                        'double_points'
                          ? true
                          : value ===
                              'team_event'
                            ? current.double_points
                            : false
                    })
                  );
                }}
                style={{
                  width: '100%'
                }}
              >
                <option value="normal">
                  Normaal
                </option>

                <option value="double_points">
                  Dubbele punten
                </option>

                <option value="team_event">
                  Team Event
                </option>

                <option value="final_confirmed">
                  Finale bevestigd
                </option>

                <option value="final_provisional">
                  Finale onder voorbehoud
                </option>
              </select>
            </label>

            {!finale && (
              <>
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
              </>
            )}

            {finale && (
              <>
                <label>
                  <div
                    style={{
                      color: '#aaa',
                      marginBottom: 5
                    }}
                  >
                    Aanmelddeadline
                    gekwalificeerden
                  </div>

                  <input
                    type="datetime-local"
                    value={
                      form.finalist_registration_deadline_at
                    }
                    onChange={(
                      event
                    ) =>
                      setForm(
                        (current) => ({
                          ...current,
                          finalist_registration_deadline_at:
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
                    Deadline wachtlijst
                  </div>

                  <input
                    type="datetime-local"
                    value={
                      form.waitlist_registration_deadline_at
                    }
                    onChange={(
                      event
                    ) =>
                      setForm(
                        (current) => ({
                          ...current,
                          waitlist_registration_deadline_at:
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
              </>
            )}
          </div>

          {!finale && (
            <div
              style={{
                display: 'flex',
                gap: 14,
                flexWrap: 'wrap',
                marginTop: 14
              }}
            >
              {form.schedule_type ===
                'team_event' && (
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
                  Team Event met dubbele
                  punten
                </label>
              )}

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
          )}

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

      <div
        style={{
          display: 'flex',
          justifyContent:
            'space-between',
          gap: 12,
          flexWrap: 'wrap',
          alignItems: 'center',
          marginBottom: 14
        }}
      >
        <div
          style={{
            display: 'flex',
            gap: 8,
            flexWrap: 'wrap'
          }}
        >
          <button
            type="button"
            onClick={() =>
              setViewMode('list')
            }
            style={{
              fontWeight:
                viewMode === 'list'
                  ? 900
                  : 600,
              opacity:
                viewMode === 'list'
                  ? 1
                  : 0.65
            }}
          >
            ☰ Lijst
          </button>

          <button
            type="button"
            onClick={() =>
              setViewMode(
                'calendar'
              )
            }
            style={{
              fontWeight:
                viewMode ===
                'calendar'
                  ? 900
                  : 600,
              opacity:
                viewMode ===
                'calendar'
                  ? 1
                  : 0.65
            }}
          >
            🗓️ Kalender
          </button>

          <button
            type="button"
            onClick={
              downloadCalendar
            }
          >
            ⬇️ Download .ics
          </button>
        </div>

        {viewMode ===
          'calendar' && (
          <div
            style={{
              display: 'flex',
              gap: 8,
              alignItems:
                'center'
            }}
          >
            <button
              type="button"
              onClick={() =>
                shiftCalendarMonth(
                  -1
                )
              }
            >
              ‹
            </button>

            <strong
              style={{
                minWidth: 150,
                textAlign:
                  'center',
                textTransform:
                  'capitalize'
              }}
            >
              {formatMonthTitle(
                calendarMonth
              )}
            </strong>

            <button
              type="button"
              onClick={() =>
                shiftCalendarMonth(
                  1
                )
              }
            >
              ›
            </button>
          </div>
        )}
      </div>

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
      ) : viewMode === 'calendar' ? (
        <div
          style={{
            overflowX: 'auto',
            paddingBottom: 6
          }}
        >
          <div
            style={{
              minWidth: 760
            }}
          >
            <div
              style={{
                display: 'grid',
                gridTemplateColumns:
                  'repeat(7, 1fr)',
                gap: 6,
                marginBottom: 6
              }}
            >
              {[
                'Ma',
                'Di',
                'Wo',
                'Do',
                'Vr',
                'Za',
                'Zo'
              ].map(
                (day) => (
                  <div
                    key={day}
                    style={{
                      color:
                        '#aaa',
                      fontWeight:
                        900,
                      textAlign:
                        'center',
                      padding: 6
                    }}
                  >
                    {day}
                  </div>
                )
              )}
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns:
                  'repeat(7, 1fr)',
                gap: 6
              }}
            >
              {calendarDays.map(
                (day) => {
                  const events =
                    schedule.filter(
                      (item) =>
                        sameLocalDate(
                          item.round_date,
                          day
                        )
                    );

                  const inMonth =
                    day.getMonth() ===
                    calendarMonth.getMonth();

                  const isToday =
                    sameLocalDate(
                      new Date(),
                      day
                    );

                  return (
                    <div
                      key={
                        day.toISOString()
                      }
                      style={{
                        minHeight: 118,
                        background:
                          inMonth
                            ? '#181818'
                            : '#111',
                        border:
                          isToday
                            ? '1px solid #ffd740'
                            : '1px solid #2b2b2b',
                        borderRadius:
                          8,
                        padding: 7,
                        opacity:
                          inMonth
                            ? 1
                            : 0.45
                      }}
                    >
                      <div
                        style={{
                          color:
                            isToday
                              ? '#ffd740'
                              : '#aaa',
                          fontWeight:
                            900,
                          marginBottom:
                            6
                        }}
                      >
                        {day.getDate()}
                      </div>

                      <div
                        style={{
                          display:
                            'grid',
                          gap: 5
                        }}
                      >
                        {events.map(
                          (item) => {
                            const status =
                              getScheduleStatus(
                                item
                              );

                            return (
                              <button
                                key={
                                  item.id
                                }
                                type="button"
                                onClick={() => {
                                  if (
                                    isAdmin
                                  ) {
                                    startEdit(
                                      item
                                    );
                                  }
                                }}
                                title={
                                  isAdmin
                                    ? 'Klik om aan te passen'
                                    : undefined
                                }
                                style={{
                                  textAlign:
                                    'left',
                                  padding:
                                    '6px 7px',
                                  borderRadius:
                                    7,
                                  border:
                                    '1px solid #3a3a3a',
                                  background:
                                    '#222',
                                  cursor:
                                    isAdmin
                                      ? 'pointer'
                                      : 'default'
                                }}
                              >
                                <div
                                  style={{
                                    fontSize:
                                      12,
                                    fontWeight:
                                      900
                                  }}
                                >
                                  {getItemLabel(
                                    item
                                  )}
                                </div>

                                <div
                                  style={{
                                    fontSize:
                                      11,
                                    color:
                                      '#aaa',
                                    marginTop:
                                      2
                                  }}
                                >
                                  {formatTime(
                                    item.round_date
                                  )}
                                </div>

                                <div
                                  style={{
                                    fontSize:
                                      10,
                                    color:
                                      status.color,
                                    marginTop:
                                      2
                                  }}
                                >
                                  {
                                    status.label
                                  }
                                </div>
                              </button>
                            );
                          }
                        )}
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          </div>
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

              const itemIsFinale =
                isFinaleType(
                  item.schedule_type
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
                        : itemIsFinale
                          ? '1px solid rgba(255, 215, 64, 0.35)'
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
                        {itemIsFinale
                          ? 'FINALE'
                          : `Ronde ${item.round_number}`}
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

                        {itemIsFinale ? (
                          <>
                            <br />
                            Deadline
                            gekwalificeerden:{' '}
                            {formatDateTime(
                              item.finalist_registration_deadline_at
                            )}
                            <br />
                            Deadline
                            wachtlijst:{' '}
                            {formatDateTime(
                              item.waitlist_registration_deadline_at
                            )}
                          </>
                        ) : (
                          <>
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
                          </>
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
                        {item.schedule_type ===
                        'final_confirmed'
                          ? '🏆 Finale bevestigd'
                          : item.schedule_type ===
                              'final_provisional'
                            ? '🕒 Finale onder voorbehoud'
                            : item.schedule_type ===
                                'double_points'
                              ? '✨ Dubbele punten'
                              : item.schedule_type ===
                                  'team_event'
                                ? '👥 Team Event'
                                : '♠ Normaal'}

                        {item.schedule_type ===
                          'team_event' &&
                        item.double_points
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
