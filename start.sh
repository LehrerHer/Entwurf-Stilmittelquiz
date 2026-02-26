#!/bin/bash
# Klassen-Blog 10d – Mac/Linux Starter
# Doppelklick im Finder oder: ./start.sh im Terminal

echo ""
echo " ================================================"
echo "   📝  Klassen-Blog 10d – Starter (Mac)"
echo " ================================================"
echo ""

# Skript-Verzeichnis ermitteln (funktioniert auch beim Doppelklick)
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DIR"

# ── Node.js prüfen ────────────────────────────────────────────────────────────
if ! command -v node &>/dev/null; then
    echo " [FEHLER] Node.js ist nicht installiert oder nicht im PATH."
    echo ""
    echo " Bitte Node.js 20 LTS herunterladen und installieren:"
    echo " https://nodejs.org/de/download"
    echo ""
    read -p " Drücke Enter zum Beenden ..."
    exit 1
fi

NODE_VER=$(node -v)
echo " Node.js Version: $NODE_VER"

# ── npm install (nur wenn node_modules fehlt) ─────────────────────────────────
if [ ! -d "node_modules" ]; then
    echo ""
    echo " Pakete werden installiert, bitte warten ..."
    echo ""
    npm install
    if [ $? -ne 0 ]; then
        echo ""
        echo " [FEHLER] npm install ist fehlgeschlagen."
        read -p " Drücke Enter zum Beenden ..."
        exit 1
    fi
fi

# ── .env anlegen falls noch nicht vorhanden ───────────────────────────────────
if [ ! -f ".env" ] && [ -f ".env.example" ]; then
    cp ".env.example" ".env"
    echo " .env wurde aus .env.example erstellt."
fi

# ── URLs ermitteln ────────────────────────────────────────────────────────────
PORT=3000
STUDENT_PATH="klasse10d-xk92m"
ADMIN_PATH="lehrer-admin-xk92m"

if [ -f ".env" ]; then
    _p=$(grep -E "^PORT=" .env | cut -d'=' -f2 | tr -d '[:space:]')
    _s=$(grep -E "^STUDENT_PATH=" .env | cut -d'=' -f2 | tr -d '[:space:]')
    _a=$(grep -E "^ADMIN_PATH=" .env | cut -d'=' -f2 | tr -d '[:space:]')
    [ -n "$_p" ] && PORT="$_p"
    [ -n "$_s" ] && STUDENT_PATH="$_s"
    [ -n "$_a" ] && ADMIN_PATH="$_a"
fi

echo ""
echo " ================================================"
echo "  Server startet auf Port $PORT ..."
echo " ================================================"
echo ""
echo "  Blog (Schüler):    http://localhost:$PORT/$STUDENT_PATH"
echo "  Beitrag schreiben: http://localhost:$PORT/$STUDENT_PATH/neu"
echo "  Admin-Bereich:     http://localhost:$PORT/$ADMIN_PATH"
echo ""
echo "  Strg+C drücken zum Beenden."
echo " ================================================"
echo ""

# ── Browser nach 2 Sekunden öffnen ───────────────────────────────────────────
(sleep 2 && open "http://localhost:$PORT/$STUDENT_PATH") &

# ── Server starten ────────────────────────────────────────────────────────────
node server.js

echo ""
echo " Server wurde beendet."
read -p " Drücke Enter zum Schließen ..."
