export default function InfoView({
  profile,
  currentPlayer
}) {
  const role =
    profile?.role || 'viewer';

  const hasPlayerLink =
    Boolean(currentPlayer);

  const roleLabels = {
    viewer: 'Viewer',
    player: 'Speler',
    host: 'Host',
    admin: 'Beheerder'
  };

  const cardStyle = {
    background: '#181818',
    border: '1px solid #333',
    borderRadius: 12,
    padding: 16
  };

  const titleStyle = {
    marginTop: 0,
    marginBottom: 8
  };

  const textStyle = {
    color: '#ccc',
    lineHeight: 1.6,
    margin: 0
  };

  const listStyle = {
    color: '#ccc',
    lineHeight: 1.7,
    marginTop: 8,
    marginBottom: 0,
    paddingLeft: 22
  };

  const sectionStyle = {
    display: 'grid',
    gap: 12,
    marginTop: 18
  };

  const viewerItems = [
    'De algemene ranking bekijken.',
    'De uitslagen en gegevens van gespeelde rondes bekijken.',
    'De lijst met finalisten en de waitlist bekijken.',
    'De finale en de uiteindelijke uitslag bekijken.'
  ];

  const playerItems = [
    'Alles bekijken wat ook voor viewers beschikbaar is.',
    'Via Mijn rondes je eigen inschrijvingen en ronde-informatie bekijken.',
    'Je voor een beschikbare ronde inschrijven wanneer de inschrijving geopend is.',
    'Via Mijn statistieken je eigen rankingprestaties bekijken.',
    'Je eigen wachtwoord wijzigen nadat je huidige wachtwoord is gecontroleerd.'
  ];

  const hostItems = [
    'Alles bekijken wat ook voor viewers beschikbaar is.',
    'Nieuwe spelers aan de ranking toevoegen.',
    'Uitslagen van normale rondes invoeren of via CSV importeren.',
    'Team Event-gegevens invoeren en importeren.',
    'Rondeprijzen bekijken.',
    'Rondegegevens beheren voor zover de hostrechten dit toestaan.'
  ];

  const adminItems = [
    'Alle functies van viewer en host gebruiken.',
    'Nieuwe rankingrondes aanmaken.',
    'Spelers volledig beheren, inclusief namen aanpassen en spelers verwijderen.',
    'Openstaande buy-ins en betalingen beheren.',
    'De finalepot en finale-uitgaven beheren.',
    'Gebruikers, rollen en spelerskoppelingen beheren.',
    'Aliasbeheer gebruiken.',
    'Het auditlog bekijken.',
    'Finalisten afmelden, herstellen en de finalistenlijst vergrendelen.',
    'Volledige rondes verwijderen.'
  ];

  const getRoleItems = () => {
    if (role === 'admin') {
      return adminItems;
    }

    if (role === 'host') {
      return hostItems;
    }

    if (role === 'player') {
      return playerItems;
    }

    return viewerItems;
  };

  return (
    <>
      <h2>Info</h2>

      <div
        style={{
          color: '#aaa',
          marginBottom: 18
        }}
      >
        Uitleg over de rankingapp en de
        mogelijkheden van jouw account.
      </div>

      <div style={sectionStyle}>
        <div style={cardStyle}>
          <h3 style={titleStyle}>
            Jouw rol
          </h3>

          <div
            style={{
              fontSize: 26,
              fontWeight: 900,
              color: '#ffd740',
              marginBottom: 8
            }}
          >
            {roleLabels[role] || role}
          </div>

          <p style={textStyle}>
            De beschikbare functies in de app
            worden bepaald door je accountrol
            en, voor persoonlijke onderdelen,
            door de koppeling met een speler.
          </p>

          <ul style={listStyle}>
            {getRoleItems().map((item) => (
              <li key={item}>
                {item}
              </li>
            ))}
          </ul>
        </div>

        {role === 'player' && (
          <div style={cardStyle}>
            <h3 style={titleStyle}>
              Spelerskoppeling
            </h3>

            {hasPlayerLink ? (
              <p style={textStyle}>
                Je account is gekoppeld aan{' '}
                <strong style={{ color: '#fff' }}>
                  {currentPlayer?.preferred_name ||
                    currentPlayer?.name ||
                    'jouw speler'}
                </strong>
                . Daardoor zijn Mijn rondes en
                Mijn statistieken beschikbaar.
              </p>
            ) : (
              <p style={textStyle}>
                Je account heeft de rol Speler,
                maar is nog niet gekoppeld aan
                een speler in de ranking.
                Persoonlijke onderdelen worden
                beschikbaar zodra een beheerder
                die koppeling heeft gemaakt.
              </p>
            )}
          </div>
        )}

        <div style={cardStyle}>
          <h3 style={titleStyle}>
            Algemene ranking
          </h3>

          <p style={textStyle}>
            In de algemene stand worden de
            rankingpunten per ronde getoond.
            Alleen de beste resultaten tellen
            mee zodra het maximum aantal
            meetellende resultaten is bereikt.
            Een ronde met dubbele punten telt
            met de ingestelde
            puntenvermenigvuldiging mee.
          </p>
        </div>

        <div style={cardStyle}>
          <h3 style={titleStyle}>
            Rondes en Team Events
          </h3>

          <p style={textStyle}>
            Normale rondes gebruiken de
            reguliere rankingpuntentelling.
            Team Events hebben een eigen
            puntentelling waarbij de
            individuele scores van beide
            teamleden samen de teamscore
            vormen. De behaalde
            rankingpunten van het duo worden
            vervolgens aan beide spelers
            toegekend.
          </p>
        </div>

        <div style={cardStyle}>
          <h3 style={titleStyle}>
            Finale
          </h3>

          <p style={textStyle}>
            De pagina Finalisten / Waitlist
            laat zien welke spelers zich op
            basis van de ranking voor de
            finale plaatsen en welke spelers
            reserve staan. De finale-pagina
            toont de uiteindelijke
            finalistenlijst en finalegegevens.
          </p>
        </div>
      </div>
    </>
  );
}
