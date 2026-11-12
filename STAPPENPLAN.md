# Summit Days live zetten

Dit is het volledige stappenplan om Summit Days online te zetten, zodat jij en je vrienden in dezelfde kamer kunnen spelen. Het gaat om een web app: je stuurt een link, iedereen opent hem op de telefoon. Alles blijft binnen het gratis Firebase Spark plan.

Jouw gegevens die je nodig hebt:

* GitHub repository: `oceanezemering-arch/wii` (https://github.com/oceanezemering-arch/wii)
* Firebase project id: dat bedenk je in stap 1, bijvoorbeeld `summit-days`
* Live adres na het uitrollen: `https://JE-PROJECT-ID.web.app`

## Overzicht van wat er staat

* `index.html` en `app.js`: de hele app, met 3D bord, poppetjes en minigames
* `firebase-config.js`: hier vul je de gegevens van jouw Firebase project in
* `firestore.rules`: de beveiliging van de database
* `firebase.json`, `.firebaserc`: koppelen aan jouw Firebase project
* `.github/workflows/deploy.yml`: zet bij elke push naar `main` alles automatisch live
* `tests/rules.test.mjs`: test de beveiligingsregels

## Stap 1. Firebase project maken

1. Ga naar https://console.firebase.google.com en log in met je Google account.
2. Kies "Project toevoegen" en geef het de naam `summit-days`. Google Analytics mag uit.
3. Laat het project op het gratis Spark plan staan. Je hoeft geen creditcard in te vullen.
4. Onthoud het project id dat Firebase laat zien, zoals `summit-days-1a2b3`.

## Stap 2. Web app toevoegen en gegevens invullen

1. Klik in je project op het web pictogram (`</>`) bij "Voeg een app toe".
2. Geef de app een naam, zoals `Summit Days web`. Vink Firebase Hosting nu nog niet aan.
3. Je ziet een stuk code met `firebaseConfig`. Kopieer de waarden naar `firebase-config.js` in de map.
4. Vul ook je project id in bij `.firebaserc`.

Deze waarden zijn niet geheim. De beveiliging zit in de regels uit stap 5.

## Stap 3. Anoniem inloggen aanzetten

1. Ga naar Build, dan Authentication, dan "Aan de slag".
2. Kies bij "Aanmeldmethode" voor Anoniem en zet dat aan.

Zo krijgt iedereen een eigen account zonder wachtwoord. Het poppetje hoort bij dat account op het apparaat.

## Stap 4. Database maken

1. Ga naar Build, dan Firestore Database, dan "Database maken".
2. Kies productiemodus en een Europese locatie, bijvoorbeeld `eur3`. De locatie kun je later niet meer wijzigen.

## Stap 5. Tools installeren en inloggen

Op je computer heb je Node.js nodig (https://nodejs.org, de LTS versie).

```bash
npm install -g firebase-tools
firebase login
```

Open daarna een terminal in de map van de repository en koppel het project:

```bash
firebase use JE-PROJECT-ID
```

## Stap 6. Beveiligingsregels testen (aanbevolen)

Dit draait lokaal in een emulator, dus zonder echte gegevens. Er is Java nodig voor de emulator.

```bash
npm install
npm run test:rules
```

Je ziet 30 regels met `ok`. Dat controleert onder andere:

* een poppetje kan maar één keer worden gemaakt en de naam kan niet meer wijzigen
* een score kan maar één keer worden gemaakt
* scores van anderen zijn pas leesbaar na het eindtijdstip
* een ronde kan pas worden afgesloten na het eindtijdstip

## Stap 7. De app lokaal proberen

```bash
firebase emulators:start --only auth,firestore,hosting
```

Open daarna `http://localhost:5000/?emulator=1&debug=3`. Met `debug=3` duurt een ronde 3 minuten in plaats van tot 20:00. Gebruik `&round=t2`, `&round=t3` enzovoort voor een nieuwe testronde. Open de pagina in een tweede privévenster om als tweede speler mee te doen.

## Stap 8. De eerste keer live zetten

```bash
firebase deploy
```

Dit zet de website en de regels online. Je krijgt het adres `https://JE-PROJECT-ID.web.app`. Open het op je telefoon en maak je poppetje.

## Stap 9. GitHub koppelen

Zo wordt alles automatisch live gezet bij elke push.

1. Zet de bestanden in de repository `oceanezemering-arch/wii` (de bestanden uit deze map).
2. Maak een sleutel voor GitHub:
   * Ga naar https://console.cloud.google.com en kies jouw project.
   * Ga naar IAM en beheer, dan Serviceaccounts, en maak een account met de naam `github-deploy`.
   * Geef het de rol "Firebase Admin".
   * Open het account, ga naar Sleutels, dan "Sleutel toevoegen", en kies JSON. Er downloadt een bestand.
3. Zet die sleutel in GitHub, nooit in de code:
   * Ga naar de repository, dan Settings, dan Secrets and variables, dan Actions.
   * Maak een secret met de naam `FIREBASE_SERVICE_ACCOUNT` en plak de hele inhoud van het JSON bestand erin.
   * Maak onder het tabblad Variables een variabele `FIREBASE_PROJECT_ID` met je project id.
4. Doe een commit en push naar de branch `main`. Bij het tabblad Actions zie je de uitrol lopen.

Wil je liever alleen de website laten uitrollen met een testlink per pull request, dan kan dit ook met `firebase init hosting:github`. Als de vraag "For which GitHub repository would you like to set up a GitHub workflow?" komt, vul je `oceanezemering-arch/wii` in. Dan moet je de regels wel zelf blijven uitrollen met `firebase deploy --only firestore`.

## Stap 10. Testen met twee telefoons

1. Open het live adres op beide telefoons. Maak op elk een eigen poppetje.
2. Telefoon 1 maakt een kamer. Je ziet een code van 6 tekens. Tik op de code om hem te delen.
3. Telefoon 2 vult de code in bij "Meedoen met een code". Het poppetje verschijnt direct in het speelveld van telefoon 1.
4. Speel beide alle 4 minigames. Open de pagina met `?debug=3` zodat de uitslag na 3 minuten komt.
5. Na het eindtijdstip opent de eerste speler de app. De uitslag verschijnt, tik op "Dobbel nu" en swipe omhoog.
6. Controleer dat je een score niet twee keer kunt spelen en dat je de score van de ander niet ziet voor de uitslag.

## Hoe de uitslag werkt zonder betaald plan

Er draait geen server. De eerste speler die de app opent na het eindtijdstip rekent de uitslag uit in één database transactie. Daarna kunnen de anderen hem zien. Voor een vriendengroep werkt dat goed. Een kwaadwillend lid zou in theorie kunnen sjoemelen met de uitslag. Dat is een bewuste afweging.

## Veelvoorkomende problemen

* "Firebase is nog niet gekoppeld": je hebt `firebase-config.js` nog niet ingevuld.
* "Opslaan mislukt": controleer of Anoniem inloggen aanstaat (stap 3) en of de regels zijn uitgerold (stap 8).
* "Permission denied" in de console: de regels zijn niet uitgerold, of je zit niet in de kamer.
* De uitslag komt niet: de eerste speler moet de app openen na het eindtijdstip. Er wordt elke 20 seconden gekeken.
* GitHub Action mislukt: controleer het secret `FIREBASE_SERVICE_ACCOUNT` en de variabele `FIREBASE_PROJECT_ID`.

## Later uitbreiden

* Cloud Functions op het Blaze plan, zodat de uitslag stipt om 20:00 op de server wordt uitgerekend en de regels strenger kunnen.
* Inloggen met Google of Apple, zodat een poppetje bij een persoon hoort en niet bij het apparaat.
* Pushmeldingen om 20:00.
* App Check, tegen misbruik van je Firebase project.
* Een Expo versie voor de app stores. De 3D en minigames zijn nu gemaakt voor de browser, dus dat is een aparte bouw.
