# 📝 Klassen-Blog 10d

Ein einfaches, modernes Blog-System für Schulklassen — ohne Login, geschützt durch geheime URLs.

---

## Funktionen

| Bereich | Beschreibung |
|---|---|
| **Schüler-Blog** | Übersichtsseite mit Beitrags-Karten, Einzelansicht |
| **Beitrag einreichen** | Texteditor (fett, kursiv, Überschriften …) oder Datei-Upload (PDF / Word) |
| **Admin-Bereich** | Beiträge freigeben, zurückziehen oder löschen |
| **Zugangsschutz** | Geheime URL-Pfade statt Passwort-Login |
| **Datei-Anzeige** | PDFs werden direkt eingebettet, Word-Dokumente als Download |

---

## Voraussetzungen

- **Node.js** ≥ 18 ([nodejs.org](https://nodejs.org))
- **npm** (wird mit Node.js mitgeliefert)

---

## Schnellstart (lokal)

```bash
# 1. Abhängigkeiten installieren
npm install

# 2. Server starten
npm start
```

Der Server startet und zeigt dir die URLs an:

```
================================================
  📝 Klassen-Blog 10d
================================================

  📚 Schüler-Blog:   http://localhost:3000/klasse10d-xk92m
  ✏️  Beitrag neu:    http://localhost:3000/klasse10d-xk92m/neu
  🔒 Admin-Bereich:  http://localhost:3000/lehrer-admin-xk92m
================================================
```

Die geheimen Pfade sind die Zugangskontrolle — teile sie nur mit wem du möchtest.

---

## Konfiguration

Kopiere `.env.example` nach `.env` und passe die Werte an:

```bash
cp .env.example .env
```

| Variable | Standard | Beschreibung |
|---|---|---|
| `PORT` | `3000` | Port des Webservers |
| `STUDENT_PATH` | `klasse10d-xk92m` | Geheimer Pfad für Schüler:innen |
| `ADMIN_PATH` | `lehrer-admin-xk92m` | Geheimer Pfad für Lehrkraft |
| `REQUIRE_APPROVAL` | `false` | `true` = Beiträge erst nach Freigabe sichtbar |

**Wichtig:** Wähle eigene, schwer zu erratende Pfade (z. B. zufällige Buchstaben-Zahlen-Kombinationen).

> Die `.env`-Datei wird vom `.gitignore` ausgeschlossen und landet nicht im Repository.

Umgebungsvariablen können auch direkt gesetzt werden (ohne .env):

```bash
# Linux / macOS
PORT=8080 STUDENT_PATH=meingeheimerpfad npm start

# Windows (PowerShell)
$env:PORT=8080; $env:STUDENT_PATH="meingeheimerpfad"; npm start
```

---

## Deployment (öffentlich erreichbar machen)

### Option A — Railway (empfohlen, kostenlos)

1. Erstelle einen Account auf [railway.app](https://railway.app)
2. „New Project" → „Deploy from GitHub Repo" → dieses Repository auswählen
3. Unter **Variables** folgende Umgebungsvariablen eintragen:
   - `STUDENT_PATH` = dein geheimer Schülerpfad
   - `ADMIN_PATH` = dein geheimer Adminpfad
   - `REQUIRE_APPROVAL` = `false` oder `true`
4. Railway generiert eine öffentliche URL (z. B. `https://mein-blog.up.railway.app`)
5. Blog-URL: `https://mein-blog.up.railway.app/DEIN_STUDENT_PATH`

> **Hinweis:** Railway speichert hochgeladene Dateien nur temporär (flüchtiges Dateisystem).
> Für dauerhaften Datei-Upload empfiehlt sich ein Cloud-Speicher (z. B. Cloudinary).
> Für reine Text-Beiträge ohne Datei-Upload ist Railway perfekt geeignet.

### Option B — Render

1. Account auf [render.com](https://render.com) erstellen
2. „New Web Service" → GitHub-Repo verbinden
3. Build Command: `npm install`
4. Start Command: `npm start`
5. Umgebungsvariablen unter „Environment" eintragen
6. „Create Web Service" → Render stellt die App bereit

### Option C — Schulserver (z. B. mit nginx)

```bash
# Auf dem Server:
git clone <repo-url> /var/www/klassen-blog
cd /var/www/klassen-blog
npm install
npm install -g pm2
pm2 start server.js --name "klassen-blog"
pm2 save
pm2 startup
```

nginx-Konfiguration (in `/etc/nginx/sites-available/klassen-blog`):

```nginx
server {
    listen 80;
    server_name meineschule.de;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    client_max_body_size 10M;
}
```

---

## Dateistruktur

```
klassen-blog/
├── server.js          ← Express-Server mit allen Routen
├── database.js        ← SQLite-Datenbankoperationen
├── views.js           ← HTML-Templates (CSS + JS inklusive)
├── package.json       ← Abhängigkeiten
├── .env.example       ← Konfigurationsvorlage
├── .gitignore
├── blog.db            ← wird beim ersten Start erstellt
└── uploads/           ← wird beim ersten Start erstellt
```

---

## Sicherheitshinweise

- Die geheimen URL-Pfade **ersetzen ein Login-System** — wähle lange, zufällige Pfade.
- Empfehlung für einen sicheren Pfad: `openssl rand -hex 8` im Terminal ausführen.
- Die `.env`-Datei niemals ins Git-Repository einchecken (ist bereits in `.gitignore`).
- Alle Benutzereingaben werden serverseitig bereinigt (XSS-Schutz via `sanitize-html`).
- Datei-Uploads sind auf PDF und Word beschränkt, maximale Größe: 10 MB.

---

## Entwicklung

```bash
# Mit automatischem Neustart bei Dateiänderungen
npm run dev
```

---

## Lizenz

MIT — frei verwendbar für schulische Zwecke.
