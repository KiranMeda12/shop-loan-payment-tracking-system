@echo off
title Shop Loan & Payment Tracking Management System
echo ======================================================================
echo    Starting Shop Loan & Payment Tracking Management System
echo ======================================================================
echo.

cd /d "%~dp0"

echo [1/2] Starting Python FastAPI Backend on http://127.0.0.1:8000 ...
start "ShopCredit Backend API" cmd /k "python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload"

echo [2/2] Starting React Vite Frontend on http://localhost:5173 ...
cd frontend
start "ShopCredit React Frontend" cmd /k "npm run dev -- --host 127.0.0.1 --port 5173"

echo.
echo Waiting for servers to initialize...
timeout /t 3 >nul

echo Opening application in your default browser...
start http://localhost:5173

echo.
echo ======================================================================
echo   ShopCredit Pro is now running!
echo   Frontend:  http://localhost:5173
echo   Backend:   http://127.0.0.1:8000
echo   API Docs:  http://127.0.0.1:8000/docs
echo   Default Credentials:
echo     Username: admin
echo     Password: admin123
echo ======================================================================
echo.
pause
