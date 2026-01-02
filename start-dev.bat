@echo off
echo Starting AI Workflow Architect Development Environment...
echo.
echo Frontend will run on: http://localhost:5000
echo Backend will run on: http://localhost:3000
echo.
echo Starting servers...
start "Frontend" cmd /k "npm run dev:client"
timeout /t 3 /nobreak > nul
start "Backend" cmd /k "npm run dev:server"
echo.
echo Both servers are starting in separate windows.
echo Visit http://localhost:5000 to use the application.
