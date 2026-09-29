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

  const stepStyle = {
    color: '#ccc',
    lineHeight: 1.7,
    marginTop: 8,
    marginBottom: 0,
    paddingLeft: 22
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
    'Rondegegevens aanpassen.',
    'Spelers aan een ronde toevoegen en inschrijvingen beheren.',
    'Betalingen per ronde verwerken of verwijderen.',
    'Uitslagen van normale rondes invoeren of via CSV importeren.',
    'Team Events instellen en de Team Event-uitslagen importeren.',
    'Rondeprijzen en potinformatie bekijken.'
  ];

  const adminItems = [
    'Alle functies van viewer en host gebruiken.',
    'Nieuwe rankingrondes aanmaken.',
    'Spelers volledig beheren.',
    'Rondes volledig verwijderen.',
    'Openstaande buy-ins en betalingen beheren.',
    'De finalepot en finale-uitgaven beheren.',
    'Gebruikers, rollen en spelerskoppelingen beheren.',
    'Aliasbeheer gebruiken.',
    'Het auditlog bekijken.',
    'Finalisten afmelden, herstellen en de finalistenlijst vergrendelen.',
    'De finale-uitslag beheren.'
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
          <>
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

            <div style={cardStyle}>
              <h3 style={titleStyle}>
                Wat kun je zelf aanpassen?
              </h3>

              <p style={textStyle}>
                Als speler kun je geen
                rankinggegevens of uitslagen
                wijzigen. Je kunt wel je eigen
                accountwachtwoord wijzigen.
              </p>

              <ol style={stepStyle}>
                <li>
                  Open Mijn statistieken.
                </li>
                <li>
                  Ga naar het onderdeel Account.
                </li>
                <li>
                  Vul je huidige wachtwoord in.
                </li>
                <li>
                  Vul tweemaal je nieuwe
                  wachtwoord in.
                </li>
                <li>
                  Kies Wachtwoord wijzigen.
                </li>
              </ol>
            </div>
          </>
        )}

        {role === 'host' && (
          <>
            <div style={cardStyle}>
              <h3 style={titleStyle}>
                Rondegegevens aanpassen
              </h3>

              <p style={textStyle}>
                Open in het linkermenu de ronde
                die je wilt beheren. Bovenaan de
                ronde kun je de praktische
                instellingen aanpassen.
              </p>

              <ul style={listStyle}>
                <li>
                  Aantal deelnemers van een
                  normale ronde.
                </li>
                <li>
                  Speeldatum en starttijd.
                </li>
                <li>
                  Tijdstip waarop de inschrijving
                  opent.
                </li>
                <li>
                  Tijdstip waarop de inschrijving
                  sluit.
                </li>
                <li>
                  Wisselen tussen een normale
                  ronde en een Team Event.
                </li>
                <li>
                  Dubbele punten aan- of
                  uitzetten.
                </li>
                <li>
                  De hoge inhouding voor 36+
                  deelnemers gebruiken.
                </li>
                <li>
                  De top 2-prijzen laten
                  splitten.
                </li>
              </ul>

              <p
                style={{
                  ...textStyle,
                  marginTop: 12
                }}
              >
                Wijzigingen in deze velden worden
                direct opgeslagen. Er is dus geen
                aparte knop Opslaan.
              </p>
            </div>

            <div style={cardStyle}>
              <h3 style={titleStyle}>
                Spelers en buy-ins beheren
              </h3>

              <ol style={stepStyle}>
                <li>
                  Open de gewenste ronde.
                </li>
                <li>
                  Ga naar Deelnemers & buy-ins.
                </li>
                <li>
                  Kies een speler en voeg die toe
                  wanneer iemand handmatig aan de
                  ronde moet worden toegevoegd.
                </li>
                <li>
                  Gebruik de betaalactie bij een
                  speler om een ontvangen buy-in
                  vast te leggen.
                </li>
                <li>
                  Een foutief geregistreerde
                  betaling kan daar ook weer
                  worden verwijderd.
                </li>
                <li>
                  Een inschrijving kan vanuit
                  dezelfde deelnemerslijst worden
                  geannuleerd.
                </li>
              </ol>
            </div>

            <div style={cardStyle}>
              <h3 style={titleStyle}>
                Normale uitslag invoeren
              </h3>

              <p style={textStyle}>
                Een normale ronde kan handmatig of
                via een Pokerrrr 2-CSV worden
                verwerkt.
              </p>

              <ol style={stepStyle}>
                <li>
                  Open de betreffende ronde.
                </li>
                <li>
                  Controleer eerst het aantal
                  deelnemers.
                </li>
                <li>
                  Voor CSV-import kies je het
                  CSV-bestand bij CSV uitslag
                  uploaden.
                </li>
                <li>
                  De spelers worden aan de
                  uitslag gekoppeld en de
                  rankingpunten worden
                  automatisch berekend.
                </li>
                <li>
                  Bij handmatige invoer kies je
                  per eindpositie de juiste
                  speler.
                </li>
              </ol>
            </div>

            <div style={cardStyle}>
              <h3 style={titleStyle}>
                Team Event beheren
              </h3>

              <ol style={stepStyle}>
                <li>
                  Open de ronde en zet Team Event
                  aan.
                </li>
                <li>
                  Maak of importeer de duo-indeling.
                </li>
                <li>
                  Zorg dat de twee Team
                  Event-toernooien beschikbaar
                  zijn.
                </li>
                <li>
                  Importeer voor ieder toernooi de
                  bijbehorende uitslag.
                </li>
                <li>
                  De individuele punten,
                  teamscores, eindposities en
                  rankingpunten worden daarna
                  berekend.
                </li>
              </ol>
            </div>

            <div style={cardStyle}>
              <h3 style={titleStyle}>
                Speler toevoegen
              </h3>

              <p style={textStyle}>
                Onderaan de linkerzijbalk staat
                Speler toevoegen. Vul de naam in
                en kies Toevoegen. Hosts kunnen
                spelers toevoegen, maar bestaande
                spelers niet volledig beheren of
                verwijderen.
              </p>
            </div>
          </>
        )}

        {role === 'admin' && (
          <>
            <div style={cardStyle}>
              <h3 style={titleStyle}>
                Rondebeheer
              </h3>

              <p style={textStyle}>
                Als beheerder heb je dezelfde
                rondebewerkingen als een host,
                aangevuld met het aanmaken en
                volledig verwijderen van rondes.
              </p>

              <ol style={stepStyle}>
                <li>
                  Kies Nieuwe ronde bovenaan de
                  linkerzijbalk om de volgende
                  ronde aan te maken.
                </li>
                <li>
                  Open een ronde om datum,
                  inschrijving, aantal spelers,
                  rondetype, dubbele punten en
                  prijsinstellingen aan te passen.
                </li>
                <li>
                  Voor een normale ronde kun je
                  de uitslag handmatig of via CSV
                  verwerken.
                </li>
                <li>
                  Voor een Team Event beheer je
                  de duo's en importeer je beide
                  toernooiuitslagen.
                </li>
                <li>
                  De knop Ronde verwijderen
                  verwijdert de volledige ronde
                  inclusief gekoppelde
                  inschrijvingen, betalingen,
                  uitslagen en Team
                  Event-gegevens. Hiervoor wordt
                  extra bevestiging gevraagd.
                </li>
              </ol>
            </div>

            <div style={cardStyle}>
              <h3 style={titleStyle}>
                Spelers beheren
              </h3>

              <p style={textStyle}>
                In de linkerzijbalk kun je
                spelers toevoegen. Beheerders
                krijgen daarnaast Spelerbeheer.
              </p>

              <ul style={listStyle}>
                <li>
                  Zoek een bestaande speler.
                </li>
                <li>
                  Pas de weergavenaam van een
                  speler aan.
                </li>
                <li>
                  Voeg meerdere spelers tegelijk
                  toe via bulkimport, één naam per
                  regel.
                </li>
                <li>
                  Verwijder een speler met de
                  prullenbakknop wanneer dat echt
                  nodig is.
                </li>
              </ul>
            </div>

            <div style={cardStyle}>
              <h3 style={titleStyle}>
                Gebruikersbeheer
              </h3>

              <p style={textStyle}>
                Open Gebruikersbeheer om
                accounts en toegangsrechten te
                beheren.
              </p>

              <ul style={listStyle}>
                <li>
                  Voornaam, achternaam en
                  weergavenaam aanpassen.
                </li>
                <li>
                  Een gebruiker de rol viewer,
                  player, host of admin geven.
                </li>
                <li>
                  Een account aan een speler in
                  de ranking koppelen.
                </li>
                <li>
                  Een voorgestelde
                  spelerskoppeling gebruiken.
                </li>
                <li>
                  Nieuwe registraties als
                  afgehandeld markeren.
                </li>
                <li>
                  Persoonlijke financiële
                  statistieken voor een gekoppelde
                  speler afzonderlijk in- of
                  uitschakelen.
                </li>
              </ul>

              <p
                style={{
                  ...textStyle,
                  marginTop: 12
                }}
              >
                Naamvelden worden opgeslagen
                zodra je het invoerveld verlaat.
                Rollen en spelerskoppelingen
                worden direct opgeslagen wanneer
                je een andere keuze maakt.
              </p>
            </div>

            <div style={cardStyle}>
              <h3 style={titleStyle}>
                Betalingen beheren
              </h3>

              <p style={textStyle}>
                Op een ronde kun je deelnemers en
                hun buy-ins beheren. Daarnaast is
                Openstaande buy-ins beschikbaar
                voor een totaaloverzicht van nog
                niet verwerkte betalingen.
              </p>
            </div>

            <div style={cardStyle}>
              <h3 style={titleStyle}>
                Finalepot beheren
              </h3>

              <p style={textStyle}>
                Open Finalepot overzicht om de
                bruto finalepot, finale-uitgaven
                en netto finalepot te beheren.
                Finale-uitgaven kunnen daar
                worden toegevoegd en verwijderd.
              </p>
            </div>

            <div style={cardStyle}>
              <h3 style={titleStyle}>
                Finalisten en finale beheren
              </h3>

              <ul style={listStyle}>
                <li>
                  Open Finalisten / Waitlist om
                  finalisten af te melden.
                </li>
                <li>
                  Een laatste afmelding kan
                  ongedaan worden gemaakt.
                </li>
                <li>
                  De finalistenlijst kan worden
                  vergrendeld zodra die definitief
                  is.
                </li>
                <li>
                  Open Finale om de uiteindelijke
                  eindposities in te voeren.
                </li>
              </ul>
            </div>

            <div style={cardStyle}>
              <h3 style={titleStyle}>
                Aliasbeheer en auditlog
              </h3>

              <p style={textStyle}>
                Aliasbeheer wordt gebruikt om
                alternatieve spelersnamen aan de
                juiste speler te koppelen, zodat
                imports correct kunnen worden
                herkend. In het Audit log kun je
                belangrijke beheeracties
                terugvinden.
              </p>
            </div>
          </>
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
