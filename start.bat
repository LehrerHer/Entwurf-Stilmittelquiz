@echo off
chcp 65001 >nul
title Klassen-Blog 10d

echo.
echo  ================================================
echo   📝  Klassen-Blog 10d – Starter
echo  ================================================
echo.

:: ── Prüfen ob Node.js installiert ist ──────────────────────────────────────
where node >nul 2>&1
if errorlevel 1 (
    echo  [FEHLER] Node.js ist nicht installiert oder nicht im PATH.
    echo.
    echo  Bitte Node.js 20 LTS herunterladen und installieren:
    echo  https://nodejs.org/de/download
    echo.
    pause
    exit /b 1
)

:: Node-Version anzeigen
for /f "tokens=*" %%v in ('node -v') do set NODE_VER=%%v
echo  Node.js Version: %NODE_VER%

:: ── npm install (nur wenn node_modules fehlt) ───────────────────────────────
if not exist "node_modules\" (
    echo.
    echo  Pakete werden installiert, bitte warten ...
    echo.
    call npm install
    if errorlevel 1 (
        echo.
        echo  [FEHLER] npm install ist fehlgeschlagen.
        pause
        exit /b 1
    )
)

:: ── .env anlegen falls noch nicht vorhanden ─────────────────────────────────
if not exist ".env" (
    if exist ".env.example" (
        copy ".env.example" ".env" >nul
        echo  .env wurde aus .env.example erstellt.
    )
)

:: ── URLs ermitteln ──────────────────────────────────────────────────────────
set PORT=3000
set STUDENT_PATH=klasse10d-xk92m
set ADMIN_PATH=lehrer-admin-xk92m

:: Werte aus .env lesen (falls vorhanden)
if exist ".env" (
    for /f "usebackq tokens=1,* delims==" %%a in (".env") do (
        if "%%a"=="PORT"         set PORT=%%b
        if "%%a"=="STUDENT_PATH" set STUDENT_PATH=%%b
        if "%%a"=="ADMIN_PATH"   set ADMIN_PATH=%%b
    )
)

echo.
echo  ================================================
echo   Server startet auf Port %PORT% ...
echo  ================================================
echo.
echo   Blog (Schueler):   http://localhost:%PORT%/%STUDENT_PATH%
echo   Beitrag schreiben: http://localhost:%PORT%/%STUDENT_PATH%/neu
echo   Admin-Bereich:     http://localhost:%PORT%/%ADMIN_PATH%
echo.
echo   Fenster schliessen oder Strg+C druecken zum Beenden.
echo  ================================================
echo.

:: ── Browser nach 2 Sekunden oeffnen ────────────────────────────────────────
start "" /b cmd /c "timeout /t 2 >nul && start http://localhost:%PORT%/%STUDENT_PATH%"

:: ── Server starten ──────────────────────────────────────────────────────────
node server.js

echo.
echo  Server wurde beendet.
pause
