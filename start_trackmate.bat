@echo off
title TrackMate Server
echo ========================================================
echo   Starting TrackMate Personal Productivity App...
echo ========================================================
echo.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0server.ps1"
pause

