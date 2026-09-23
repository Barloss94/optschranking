export const parseCSVLine = (
  line,
  delimiter = null
) => {
  const result = [];
  let current = '';
  let insideQuotes = false;

  const detectedDelimiter =
    delimiter ||
    (() => {
      let commaCount = 0;
      let semicolonCount = 0;
      let quoted = false;

      for (
        let index = 0;
        index < line.length;
        index += 1
      ) {
        const char = line[index];

        if (char === '"') {
          quoted = !quoted;
          continue;
        }

        if (!quoted) {
          if (char === ',') {
            commaCount += 1;
          }

          if (char === ';') {
            semicolonCount += 1;
          }
        }
      }

      return semicolonCount >
        commaCount
        ? ';'
        : ',';
    })();

  for (
    let index = 0;
    index < line.length;
    index += 1
  ) {
    const char = line[index];
    const nextChar =
      line[index + 1];

    if (char === '"') {
      if (
        insideQuotes &&
        nextChar === '"'
      ) {
        current += '"';
        index += 1;
      } else {
        insideQuotes = !insideQuotes;
      }

      continue;
    }

    if (
      char === detectedDelimiter &&
      !insideQuotes
    ) {
      result.push(
        current.trim()
      );

      current = '';

      continue;
    }

    current += char;
  }

  result.push(
    current.trim()
  );

  return result;
};

export const extractPlayerNamesFromCSV = (
  text
) => {
  const lines = String(
    text || ''
  )
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
    .map(
      (line) =>
        line.trim()
    )
    .filter(Boolean);

  if (
    lines.length === 0
  ) {
    return [];
  }

  const firstLine =
    lines[0];

  const commaColumns =
    parseCSVLine(
      firstLine,
      ','
    ).length;

  const semicolonColumns =
    parseCSVLine(
      firstLine,
      ';'
    ).length;

  const delimiter =
    semicolonColumns >
    commaColumns
      ? ';'
      : ',';

  const rows = lines.map(
    (line) =>
      parseCSVLine(
        line,
        delimiter
      )
  );

  const headers =
    rows[0].map(
      (header) =>
        String(
          header || ''
        )
          .trim()
          .toLowerCase()
    );

  const playerColumnIndex =
    headers.findIndex(
      (header) =>
        [
          'player',
          'naam',
          'name',
          'speler',
          'deelnemer'
        ].includes(
          header
        )
    );

  if (
    playerColumnIndex === -1
  ) {
    throw new Error(
      'Geen Player/Naam kolom gevonden in de CSV.'
    );
  }

  return rows
    .slice(1)
    .map(
      (row) =>
        String(
          row[
            playerColumnIndex
          ] || ''
        ).trim()
    )
    .filter(Boolean);
};

/**
 * Maakt een waarde veilig voor CSV.
 *
 * We gebruiken puntkomma's als scheidingsteken,
 * omdat Nederlandse Excel-installaties dit
 * doorgaans automatisch correct openen.
 */
export const escapeCSVValue = (
  value
) => {
  if (
    value === null ||
    value === undefined
  ) {
    return '';
  }

  const stringValue =
    String(value);

  const escapedValue =
    stringValue.replace(
      /"/g,
      '""'
    );

  if (
    escapedValue.includes(
      ';'
    ) ||
    escapedValue.includes(
      '"'
    ) ||
    escapedValue.includes(
      '\n'
    ) ||
    escapedValue.includes(
      '\r'
    )
  ) {
    return `"${escapedValue}"`;
  }

  return escapedValue;
};

/**
 * Zet een array met rijen om naar CSV.
 *
 * Voorbeeld:
 *
 * [
 *   ['Positie', 'Naam', 'Punten'],
 *   [1, 'Barry', 32]
 * ]
 */
export const createCSVText = (
  rows
) => {
  return (
    '\uFEFF' +
    rows
      .map(
        (row) =>
          row
            .map(
              escapeCSVValue
            )
            .join(';')
      )
      .join('\r\n')
  );
};

/**
 * Downloadt CSV direct vanuit de browser.
 */
export const downloadCSV = ({
  filename,
  rows
}) => {
  if (
    !Array.isArray(rows) ||
    rows.length === 0
  ) {
    throw new Error(
      'Er zijn geen CSV-gegevens om te downloaden.'
    );
  }

  const csvText =
    createCSVText(rows);

  const blob =
    new Blob(
      [csvText],
      {
        type:
          'text/csv;charset=utf-8;'
      }
    );

  const url =
    URL.createObjectURL(
      blob
    );

  const anchor =
    document.createElement(
      'a'
    );

  anchor.href = url;

  anchor.download =
    String(
      filename ||
        'export.csv'
    ).endsWith(
      '.csv'
    )
      ? filename
      : `${filename}.csv`;

  document.body.appendChild(
    anchor
  );

  anchor.click();

  document.body.removeChild(
    anchor
  );

  URL.revokeObjectURL(
    url
  );
};

/**
 * Maakt een veilige bestandsnaam.
 */
export const sanitizeCSVFilename = (
  value
) => {
  return String(
    value || 'export'
  )
    .trim()
    .toLowerCase()
    .replace(
      /[^a-z0-9à-ÿ_-]+/gi,
      '-'
    )
    .replace(
      /-+/g,
      '-'
    )
    .replace(
      /^-|-$/g,
      ''
    );
};

/**
 * Export normale ronde.
 *
 * rows verwacht bijvoorbeeld:
 *
 * {
 *   position: 1,
 *   name: 'Barry',
 *   points: 30,
 *   prize: 25
 * }
 */
export const downloadRoundResultsCSV = ({
  roundNumber,
  rows,
  includePrizes = true
}) => {
  const headers = [
    'Positie',
    'Naam',
    'Punten'
  ];

  if (includePrizes) {
    headers.push(
      'Prijs'
    );
  }

  const csvRows = [
    headers
  ];

  (
    rows || []
  ).forEach(
    (row) => {
      const csvRow = [
        row.position,
        row.name,
        row.points
      ];

      if (
        includePrizes
      ) {
        csvRow.push(
          Number(
            row.prize
          ) || 0
        );
      }

      csvRows.push(
        csvRow
      );
    }
  );

  downloadCSV({
    filename:
      `ranking-ronde-${roundNumber}.csv`,
    rows: csvRows
  });
};

/**
 * Export Team Event.
 *
 * Eén CSV met drie secties:
 * - Toernooi A
 * - Toernooi B
 * - Team Event-dagstand
 */
export const downloadTeamEventResultsCSV = ({
  roundNumber,
  tournaments = [],
  tournamentResults = [],
  teams = []
}) => {
  const csvRows = [];

  tournaments.forEach(
    (tournament) => {
      csvRows.push([
        tournament.name
      ]);

      csvRows.push([
        'Positie',
        'Speler',
        'Basispunten',
        'Bonuspunten',
        'Totaalpunten',
        'Prijs'
      ]);

      const results =
        tournamentResults
          .filter(
            (item) =>
              item.tournamentId ===
              tournament.id
          )
          .sort(
            (a, b) =>
              (
                Number(
                  a.position
                ) ||
                Number.MAX_SAFE_INTEGER
              ) -
              (
                Number(
                  b.position
                ) ||
                Number.MAX_SAFE_INTEGER
              )
          );

      results.forEach(
        (result) => {
          csvRows.push([
            result.position ||
              '',
            result.playerName ||
              '',
            Number(
              result.basePoints
            ) || 0,
            Number(
              result.bonusPoints
            ) || 0,
            Number(
              result.totalPoints
            ) || 0,
            Number(
              result.prize
            ) || 0
          ]);
        }
      );

      csvRows.push([]);
    }
  );

  csvRows.push([
    'Team Event-dagstand'
  ]);

  csvRows.push([
    'Positie',
    'Teamnummer',
    'Team',
    'Speler Toernooi A',
    'Punten Toernooi A',
    'Speler Toernooi B',
    'Punten Toernooi B',
    'Teamtotaal',
    'Rankingpunten'
  ]);

  teams.forEach(
    (team) => {
      csvRows.push([
        team.position ||
          '',
        team.teamNumber ||
          '',
        team.teamName ||
          '',
        team.player1Name ||
          '',
        Number(
          team.player1Points
        ) || 0,
        team.player2Name ||
          '',
        Number(
          team.player2Points
        ) || 0,
        Number(
          team.teamTotal
        ) || 0,
        Number(
          team.rankingPoints
        ) || 0
      ]);
    }
  );

  downloadCSV({
    filename:
      `ranking-ronde-${roundNumber}-team-event.csv`,
    rows: csvRows
  });
};

/**
 * Export algemene ranking.
 *
 * roundColumns:
 * [
 *   {
 *     id,
 *     roundNumber,
 *     index
 *   }
 * ]
 *
 * Bij een schrapresultaat wordt "(schrap)"
 * toegevoegd zodat dit ook voor automatische
 * verslaggeneratie direct herkenbaar is.
 */
export const downloadRankingCSV = ({
  ranking = [],
  roundColumns = [],
  getStatus
}) => {
  const headers = [
    'Positie',
    'Naam',
    ...roundColumns.map(
      (round) =>
        `R${round.roundNumber}`
    ),
    'Gespeeld',
    'Totaal',
    'Status'
  ];

  const csvRows = [
    headers
  ];

  ranking.forEach(
    (player, index) => {
      const roundValues =
        roundColumns.map(
          (round) => {
            const detail =
              player
                .roundDetails?.[
                round.index
              ];

            if (
              !detail?.hasData
            ) {
              return '';
            }

            if (
              detail.isCounted ===
              false
            ) {
              return `${detail.points} (schrap)`;
            }

            return detail.points;
          }
        );

      const status =
        typeof getStatus ===
        'function'
          ? getStatus(
              player,
              index
            )
          : '';

      csvRows.push([
        index + 1,
        player.displayName ||
          '',
        ...roundValues,
        Number(
          player.playedRounds
        ) || 0,
        Number(
          player.totalPoints
        ) || 0,
        status
      ]);
    }
  );

  downloadCSV({
    filename:
      'ranking-algemene-stand.csv',
    rows: csvRows
  });
};