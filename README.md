# Word of Jesus Daily

Een dagelijkse pagina met één uitspraak van Jezus uit de vier evangeliën: Engelse tekst (NRSVue),
Griekse grondtekst (SBLGNT, tekstkritisch gelijkwaardig aan NA27/28), context over manuscripten,
kernwoord-definities, een Jesus Seminar-classificatie, en parallelle verzen in de andere evangeliën.
Gepubliceerd als pagina op [QuintsQuest](https://quintsquestforjesus.blogspot.com).

## Hoe het werkt
- `data/verses.json` bevat de referentielijst (~479 items) met thema, Jesus Seminar-kleur,
  parallel-verzen en algemene manuscript-info.
- `netlify/functions/verse.js` kiest dagelijks één nog niet (recent) gebruikt vers, cachet het
  in Netlify Blobs op datum, en haalt de Engelse (API.Bible/NRSVue) en Griekse (SBLGNT) tekst op.
- `netlify/functions/send-daily-notification.js` stuurt om 07:00 (NL-tijd) een push-notificatie
  via Firebase Cloud Messaging naar alle geregistreerde tokens, met hetzelfde vers als de pagina.
- `netlify/functions/save-token.js` slaat FCM-tokens van bezoekers op.
- De Blogger-pagina zelf doet alleen een `fetch()` naar `verse.js` — alle logica draait op Netlify.

## Setup
1. Repo moet **public** zijn (anders faalt Netlify Functions-verificatie).
2. Deploy via Netlify (Import from GitHub), publish directory `.`, functions directory `netlify/functions`.
3. Environment variables instellen in Netlify:
   - `BIBLE_API_KEY`, `BIBLE_API_BIBLE_ID` (NRSVue via scripture.api.bible)
   - `FIREBASE_SERVICE_ACCOUNT` (volledige service-account-JSON als string)
   - `NETLIFY_AUTH_TOKEN`
   - `SECRETS_SCAN_ENABLED=false`
4. Firebase-project met Cloud Messaging + VAPID-key, gekoppeld in `firebase-messaging-sw.js`.
5. `icon-192.png` moet in de repo-root staan (naast `index.html`/`netlify.toml`), anders faalt
   `showNotification` soms stil op Android Chrome.
6. Cron via EasyCron: `0 5 * * *` UTC = 07:00 Nederlandse tijd (let op zomer/wintertijd).

## Bronvermelding & copyright
- Engelse tekst: NRSVue, via API.Bible-licentie — niet zelf hardcoded reproduceren.
- Griekse tekst: SBLGNT (CC BY 4.0), niet NA27/28 zelf (die is auteursrechtelijk beschermd).
- Manuscript-afbeeldingen: alleen linken naar https://collections.csntm.org, niet zelf hosten.
- Woorddefinities: eigen korte definitie schrijven, linken naar
  https://www.billmounce.com/dictionary/ i.p.v. zijn tekst overnemen.

## Nog te doen
- [ ] `verses.json` genereren uit de CSV
- [ ] SBLGNT-tekst per vers koppelen
- [ ] Blogger-pagina HTML/CSS
- [ ] Downloadbare afbeelding-generatie (canvas/satori)
- [ ] Eigen domein overwegen i.p.v. blogspot-subdomein
