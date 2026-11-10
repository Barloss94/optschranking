import html2canvas from 'html2canvas';

import {
  thStyle,
  tdStyle
} from '../styles/tableStyles';
import {
  formatEuro
} from '../utils/formatters';

const FINAL_DATE_LABEL =
  'Zaterdag 28 november 2026';

const BLIND_STRUCTURE = [
  { type: 'level', level: 1, duration: 30, elapsed: '0:30', sb: '100', bb: '200', ante: '-' },
  { type: 'level', level: 2, duration: 30, elapsed: '1:00', sb: '200', bb: '400', ante: '-' },
  { type: 'level', level: 3, duration: 30, elapsed: '1:30', sb: '300', bb: '600', ante: '-' },
  { type: 'level', level: 4, duration: 30, elapsed: '2:00', sb: '400', bb: '800', ante: '-' },
  { type: 'break', duration: 15, elapsed: '2:15', label: 'Einde registratie · 15:15' },
  { type: 'level', level: 5, duration: 30, elapsed: '2:45', sb: '500', bb: '1K', ante: '-' },
  { type: 'level', level: 6, duration: 30, elapsed: '3:15', sb: '600', bb: '1200', ante: '-' },
  { type: 'level', level: 7, duration: 30, elapsed: '3:45', sb: '700', bb: '1400', ante: '-' },
  { type: 'level', level: 8, duration: 30, elapsed: '4:15', sb: '800', bb: '1600', ante: '-' },
  { type: 'level', level: 9, duration: 30, elapsed: '4:45', sb: '1K', bb: '2K', ante: '-' },
  { type: 'break', duration: 60, elapsed: '5:45', label: 'Dinerbreak' },
  { type: 'level', level: 10, duration: 25, elapsed: '6:10', sb: '1500', bb: '3K', ante: '3K' },
  { type: 'level', level: 11, duration: 25, elapsed: '6:35', sb: '2K', bb: '4K', ante: '4K' },
  { type: 'level', level: 12, duration: 25, elapsed: '7:00', sb: '3K', bb: '6K', ante: '6K' },
  { type: 'break', duration: 15, elapsed: '7:15', label: 'Pauze · einde 20:15' },
  { type: 'level', level: 13, duration: 25, elapsed: '7:40', sb: '4K', bb: '8K', ante: '8K' },
  { type: 'level', level: 14, duration: 25, elapsed: '8:05', sb: '5K', bb: '10K', ante: '10K' },
  { type: 'level', level: 15, duration: 25, elapsed: '8:30', sb: '6K', bb: '12K', ante: '12K' },
  { type: 'break', duration: 15, elapsed: '8:45', label: 'Pauze · einde 21:45' },
  { type: 'level', level: 16, duration: 20, elapsed: '9:05', sb: '8K', bb: '16K', ante: '16K' },
  { type: 'level', level: 17, duration: 20, elapsed: '9:25', sb: '10K', bb: '20K', ante: '20K' },
  { type: 'level', level: 18, duration: 20, elapsed: '9:45', sb: '15K', bb: '30K', ante: '30K' },
  { type: 'level', level: 19, duration: 20, elapsed: '10:05', sb: '20K', bb: '40K', ante: '40K' },
  { type: 'level', level: 20, duration: 20, elapsed: '10:25', sb: '25K', bb: '50K', ante: '50K' },
  { type: 'level', level: 21, duration: 20, elapsed: '10:45', sb: '40K', bb: '80K', ante: '80K' },
  { type: 'level', level: 22, duration: 20, elapsed: '11:05', sb: '50K', bb: '100K', ante: '100K' },
  { type: 'level', level: 23, duration: 20, elapsed: '11:25', sb: '75K', bb: '150K', ante: '150K' }
];

const FINAL_START_MINUTES =
  13 * 60;

const formatClockTime = (
  totalMinutes
) => {
  const normalized =
    ((totalMinutes % 1440) + 1440) %
    1440;

  const hours =
    Math.floor(
      normalized / 60
    );

  const minutes =
    normalized % 60;

  return `${String(
    hours
  ).padStart(2, '0')}:${String(
    minutes
  ).padStart(2, '0')}`;
};

const BLIND_STRUCTURE_WITH_TIMES =
  (() => {
    let currentMinutes =
      FINAL_START_MINUTES;

    return BLIND_STRUCTURE.map(
      (item) => {
        const startMinutes =
          currentMinutes;

        const endMinutes =
          startMinutes +
          item.duration;

        currentMinutes =
          endMinutes;

        return {
          ...item,
          startTime:
            formatClockTime(
              startMinutes
            ),
          endTime:
            formatClockTime(
              endMinutes
            )
        };
      }
    );
  })();

export default function FinalView({
  finalList,
  finalResults,
  finalPot,
  finalPayouts,
  rankingWinner,
  rankingRunnerUp,
  isAdmin,
  onUpdateFinalResult
}) {
  const usedPlayerIds =
    finalResults
      .map((result) => result?.player_id)
      .filter(Boolean);

  const getAvailableFinalPlayers = (
    position
  ) =>
    finalList.filter(
      (player) =>
        !usedPlayerIds.includes(player.id) ||
        finalResults?.[position]?.player_id === player.id
    );

  const downloadFinalOverview =
    async () => {
      const element =
        document.getElementById(
          'final-overview-export'
        );

      if (!element) {
        return;
      }

      try {
        const canvas =
          await html2canvas(
            element,
            {
              backgroundColor:
                '#070908',
              scale: 2,
              useCORS: true,
              logging: false
            }
          );

        const link =
          document.createElement(
            'a'
          );

        link.href =
          canvas.toDataURL(
            'image/png'
          );

        link.download =
          'optsch-ranking-finale-2026.png';

        link.click();
      } catch (error) {
        console.error(
          'Finale-overzicht exporteren mislukt:',
          error
        );

        alert(
          'De afbeelding kon niet worden gemaakt.'
        );
      }
    };

  const infoCardStyle = {
    background:
      'rgba(24, 24, 24, 0.9)',
    border:
      '1px solid rgba(212, 175, 87, 0.24)',
    borderRadius: 12,
    padding: 16
  };

  return (
    <>
      <div
        style={{
          display: 'flex',
          justifyContent:
            'space-between',
          alignItems: 'center',
          gap: 12,
          flexWrap: 'wrap',
          marginBottom: 16
        }}
      >
        <div>
          <h2
            style={{
              marginBottom: 6
            }}
          >
            Finale
          </h2>

          <div
            style={{
              color: '#aaa'
            }}
          >
            Finale is een apart
            toernooi. Alleen finalisten
            kunnen hier ingevoerd worden.
          </div>
        </div>

        <button
          type="button"
          onClick={
            downloadFinalOverview
          }
        >
          📸 Download finale-overzicht
        </button>
      </div>

      <div
        id="final-overview-export"
        style={{
          width: '100%',
          maxWidth: 1180,
          margin: '0 auto 28px',
          padding: 26,
          boxSizing: 'border-box',
          background:
            'linear-gradient(145deg, #132019 0%, #0a100d 55%, #070908 100%)',
          color: '#fff',
          border:
            '1px solid rgba(212, 175, 87, 0.38)',
          borderRadius: 18
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent:
              'space-between',
            gap: 20,
            alignItems:
              'flex-start',
            flexWrap: 'wrap',
            marginBottom: 20
          }}
        >
          <div>
            <div
              style={{
                color: '#d4af57',
                fontSize: 13,
                fontWeight: 900,
                letterSpacing: 2,
                textTransform:
                  'uppercase',
                marginBottom: 8
              }}
            >
              OPTSCH Ranking
            </div>

            <div
              style={{
                fontSize: 34,
                lineHeight: 1.05,
                fontWeight: 900
              }}
            >
              Ranking Finale 2026
            </div>

            <div
              style={{
                marginTop: 8,
                color: '#cfcfcf',
                fontSize: 17,
                fontWeight: 700
              }}
            >
              {FINAL_DATE_LABEL}
            </div>
          </div>

          <div
            style={{
              padding:
                '10px 14px',
              borderRadius: 999,
              background:
                'rgba(255, 215, 64, 0.12)',
              border:
                '1px solid rgba(255, 215, 64, 0.34)',
              color: '#ffd740',
              fontWeight: 900,
              whiteSpace:
                'nowrap'
            }}
          >
            🏆 Finale · 27 spelers
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns:
              'repeat(4, minmax(0, 1fr))',
            gap: 10,
            marginBottom: 18
          }}
        >
          <div style={infoCardStyle}>
            <div
              style={{
                color: '#999',
                fontSize: 12,
                marginBottom: 5
              }}
            >
              Locatie
            </div>
            <strong>
              Café de Proeverij
            </strong>
          </div>

          <div style={infoCardStyle}>
            <div
              style={{
                color: '#999',
                fontSize: 12,
                marginBottom: 5
              }}
            >
              Adres
            </div>
            <strong>
              Utrechtseweg 58 - 60
            </strong>
            <div
              style={{
                marginTop: 3,
                color: '#bbb',
                fontSize: 13
              }}
            >
              3818 EN Amersfoort
            </div>
          </div>

          <div style={infoCardStyle}>
            <div
              style={{
                color: '#999',
                fontSize: 12,
                marginBottom: 5
              }}
            >
              Zaal open
            </div>
            <strong
              style={{
                color: '#ffd740',
                fontSize: 20
              }}
            >
              12:30
            </strong>
          </div>

          <div style={infoCardStyle}>
            <div
              style={{
                color: '#999',
                fontSize: 12,
                marginBottom: 5
              }}
            >
              Start finale
            </div>
            <strong
              style={{
                color: '#ffd740',
                fontSize: 20
              }}
            >
              13:00
            </strong>
          </div>
        </div>

        <div
          style={{
            ...infoCardStyle,
            marginBottom: 18,
            background:
              'rgba(255, 215, 64, 0.08)'
          }}
        >
          <strong
            style={{
              color: '#ffd740'
            }}
          >
            ⏱ Verwachte eindfase
          </strong>

          <div
            style={{
              marginTop: 5,
              color: '#ddd'
            }}
          >
            De verwachting is dat de
            laatste hand rond level 19
            of 20 wordt gespeeld.
          </div>
        </div>

        <div style={infoCardStyle}>
          <h3
            style={{
              marginTop: 0,
              marginBottom: 12,
              color: '#ffd740'
            }}
          >
            Blindstructuur
          </h3>

          <table
            style={{
              width: '100%',
              borderCollapse:
                'collapse',
              fontSize: 12
            }}
          >
            <thead>
              <tr>
                {[
                  'Level',
                  'Start',
                  'Tijd',
                  'SB',
                  'BB',
                  'BB Ante'
                ].map(
                  (label) => (
                    <th
                      key={label}
                      style={{
                        textAlign:
                          label ===
                          'Level'
                            ? 'left'
                            : 'right',
                        padding:
                          '7px 8px',
                        borderBottom:
                          '1px solid rgba(255,255,255,0.18)',
                        color: '#aaa',
                        fontWeight:
                          800
                      }}
                    >
                      {label}
                    </th>
                  )
                )}
              </tr>
            </thead>

            <tbody>
              {BLIND_STRUCTURE_WITH_TIMES.map(
                (item, index) => {
                  if (
                    item.type ===
                    'break'
                  ) {
                    return (
                      <tr
                        key={
                          `break-${index}`
                        }
                      >
                        <td
                          colSpan={6}
                          style={{
                            padding:
                              '8px',
                            background:
                              'rgba(212, 175, 87, 0.08)',
                            borderBottom:
                              '1px solid rgba(255,255,255,0.08)',
                            color:
                              '#e3c670',
                            fontWeight:
                              800
                          }}
                        >
                          ⏸ {
                            item.label
                          } · {
                            item.startTime
                          } – {
                            item.endTime
                          } · {
                            item.duration
                          } min
                        </td>
                      </tr>
                    );
                  }

                  return (
                    <tr
                      key={item.level}
                    >
                      <td
                        style={{
                          padding:
                            '7px 8px',
                          borderBottom:
                            '1px solid rgba(255,255,255,0.07)',
                          fontWeight:
                            800
                        }}
                      >
                        {item.level}
                      </td>

                      <td
                        style={{
                          padding:
                            '7px 8px',
                          borderBottom:
                            '1px solid rgba(255,255,255,0.07)',
                          textAlign:
                            'right',
                          color:
                            '#ffd740',
                          fontWeight:
                            800
                        }}
                      >
                        {
                          item.startTime
                        }
                      </td>

                      <td
                        style={{
                          padding:
                            '7px 8px',
                          borderBottom:
                            '1px solid rgba(255,255,255,0.07)',
                          textAlign:
                            'right',
                          color: '#bbb'
                        }}
                      >
                        {
                          item.duration
                        } min
                      </td>

                      <td
                        style={{
                          padding:
                            '7px 8px',
                          borderBottom:
                            '1px solid rgba(255,255,255,0.07)',
                          textAlign:
                            'right'
                        }}
                      >
                        {item.sb}
                      </td>

                      <td
                        style={{
                          padding:
                            '7px 8px',
                          borderBottom:
                            '1px solid rgba(255,255,255,0.07)',
                          textAlign:
                            'right',
                          fontWeight:
                            800
                        }}
                      >
                        {item.bb}
                      </td>

                      <td
                        style={{
                          padding:
                            '7px 8px',
                          borderBottom:
                            '1px solid rgba(255,255,255,0.07)',
                          textAlign:
                            'right',
                          color:
                            item.ante === '-'
                              ? '#777'
                              : '#ffd740'
                        }}
                      >
                        {item.ante}
                      </td>
                    </tr>
                  );
                }
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns:
            isAdmin
              ? '1fr 320px'
              : '1fr',
          gap: 24
        }}
      >
        <div>
          {isAdmin ? (
            <div
              style={{
                display: 'grid',
                gap: 8,
                maxWidth: 720
              }}
            >
              {Array.from({
                length:
                  finalList.length
              }).map(
                (_, pos) => (
                  <div
                    key={pos}
                    style={{
                      display:
                        'grid',
                      gridTemplateColumns:
                        '60px 1fr',
                      gap: 10,
                      alignItems:
                        'center'
                    }}
                  >
                    <div
                      style={{
                        fontWeight:
                          700
                      }}
                    >
                      {pos + 1}
                    </div>

                    <select
                      value={
                        finalResults?.[
                          pos
                        ]?.player_id ||
                        ''
                      }
                      onChange={(e) =>
                        onUpdateFinalResult(
                          pos + 1,
                          e.target.value
                        )
                      }
                      style={{
                        padding: 10
                      }}
                    >
                      <option value="">
                        -- kies finalist --
                      </option>

                      {getAvailableFinalPlayers(
                        pos
                      ).map(
                        (player) => (
                          <option
                            key={
                              player.id
                            }
                            value={
                              player.id
                            }
                          >
                            {
                              player.displayName
                            }
                          </option>
                        )
                      )}
                    </select>
                  </div>
                )
              )}
            </div>
          ) : (
            <table
              style={{
                width: '100%',
                borderCollapse:
                  'collapse'
              }}
            >
              <thead>
                <tr>
                  <th
                    style={thStyle}
                  >
                    #
                  </th>
                  <th
                    style={thStyle}
                  >
                    Naam
                  </th>
                </tr>
              </thead>

              <tbody>
                {finalResults.length >
                0 ? (
                  finalResults
                    .filter(
                      (row) =>
                        row?.player_id
                    )
                    .map(
                      (row) => (
                        <tr
                          key={
                            row.position
                          }
                        >
                          <td
                            style={
                              tdStyle
                            }
                          >
                            {
                              row.position
                            }
                          </td>
                          <td
                            style={
                              tdStyle
                            }
                          >
                            {
                              row.player_name
                            }
                          </td>
                        </tr>
                      )
                    )
                ) : (
                  <tr>
                    <td
                      style={tdStyle}
                      colSpan={2}
                    >
                      Finale-uitslag
                      is nog niet
                      ingevuld.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {isAdmin && (
          <div>
            <div
              style={{
                background:
                  '#181818',
                borderRadius: 10,
                padding: 14,
                marginBottom: 16
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  color: '#aaa'
                }}
              >
                Netto finalepot
              </div>
              <div
                style={{
                  fontSize: 28,
                  fontWeight: 800
                }}
              >
                {formatEuro(
                  finalPot
                )}
              </div>
            </div>

            <div
              style={{
                background:
                  '#181818',
                borderRadius: 10,
                padding: 14
              }}
            >
              <h3
                style={{
                  marginTop: 0
                }}
              >
                Uitbetaling
              </h3>

              <div
                style={{
                  display: 'grid',
                  gap: 8
                }}
              >
                {finalPayouts.places.map(
                  (amount, idx) => (
                    <div
                      key={idx}
                      style={{
                        display:
                          'grid',
                        gridTemplateColumns:
                          '50px 1fr',
                        gap: 10
                      }}
                    >
                      <div>
                        {idx + 1}
                      </div>
                      <div>
                        {formatEuro(
                          amount
                        )}
                      </div>
                    </div>
                  )
                )}

                <div
                  style={{
                    marginTop: 10,
                    paddingTop: 10,
                    borderTop:
                      '1px solid #333',
                    display: 'grid',
                    gap: 4
                  }}
                >
                  <div
                    style={{
                      fontWeight: 700
                    }}
                  >
                    Winnaar ranking
                  </div>
                  <div>
                    {rankingWinner
                      ? rankingWinner.displayName
                      : '-'}{' '}
                    →{' '}
                    {formatEuro(
                      finalPayouts.rankingWinner
                    )}
                  </div>

                  <div
                    style={{
                      fontWeight: 700,
                      marginTop: 8
                    }}
                  >
                    Nummer 2 ranking
                  </div>
                  <div>
                    {rankingRunnerUp
                      ? rankingRunnerUp.displayName
                      : '-'}{' '}
                    →{' '}
                    {formatEuro(
                      finalPayouts.rankingRunnerUp
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
