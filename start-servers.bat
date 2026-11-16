@echo off
title JINQP Gaming Center - Dual Server Launcher
echo ===================================================
echo     JINQP GAMING CENTER - KHOI DONG SERVER
echo ===================================================
echo.

echo [1/2] Dang khoi dong Player App (Port 5173)...
start "JINQP Player (Port 5173)" cmd /k "cd /d \"%~dp0nova-arcade\player\" && npm run dev -- --port 5173"

timeout /t 3 /nobreak > nul

echo [2/2] Dang khoi dong Admin Control (Port 5174)...
start "JINQP Admin (Port 5174)" cmd /k "cd /d \"%~dp0nova-arcade\admin\" && npm run dev -- --port 5174"

echo.
echo ===================================================
echo [OK] Ca 2 server da duoc khoi dong thanh cong!
echo - Player Web: http://localhost:5173
echo - Admin Web:  http://localhost:5174
echo.
echo De website hoat dong qua Cloudflare Tunnel,
echo hay giu 2 cua so server tren mo (hoac thu nho xuong).
echo ===================================================
pause
