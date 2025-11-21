@echo off
echo Starting Fleet Management Application...
echo.

start "Backend Server" cmd /k "cd backend && npm run dev"
timeout /t 2 /nobreak >nul
start "Frontend Server" cmd /k "cd frontend && npm run dev"

echo.
echo Backend and Frontend servers are starting in separate windows...
echo Backend: http://localhost:5000
echo Frontend: http://localhost:3000
echo.
pause

