@echo off
setlocal
title Simulasi Manasik 3D - Server
cd /d "%~dp0"

echo ==========================================
echo   SIMULASI MANASIK UMRAH ^& HAJI 3D
echo   http://127.0.0.1:8090/
echo ==========================================
echo.
echo Menyalakan server... browser akan terbuka otomatis.
echo Tutup jendela ini untuk mematikan server.
echo.

start "" /b powershell -NoProfile -WindowStyle Hidden -Command "Start-Sleep -Seconds 2; Start-Process 'http://127.0.0.1:8090/'"

python -m http.server 8090 --bind 127.0.0.1

echo.
echo Server berhenti.
echo Jika Python tidak terpasang, jalankan: npx --yes serve -l 8090 .
pause
