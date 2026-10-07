@echo off
title PNMP - Personalized Nutrition ^& Meal Planner
echo ========================================================
echo   PERSONALIZED NUTRITION ^& MEAL PLANNER (PNMP)
echo ========================================================
echo.

cd /d "%~dp0"

:: 1. Check Python installation
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python is not installed or not in your PATH.
    echo Please install Python 3.10+ from https://www.python.org/
    pause
    exit /b 1
)

:: 2. Setup Virtual Environment
if not exist ".venv" (
    echo [*] Creating virtual environment (.venv)...
    python -m venv .venv
)

:: 3. Activate Virtual Environment
echo [*] Activating virtual environment...
call .venv\Scripts\activate.bat

:: 4. Install / Update Requirements
echo [*] Installing dependencies from requirements.txt...
pip install -r requirements.txt --quiet

:: 5. Create .env if not exists
if not exist ".env" (
    echo [*] Creating .env file from .env.example...
    copy .env.example .env >nul
    echo [NOTE] Remember to open .env and insert your real GEMINI_API_KEY!
)

:: 6. Launch Flask Server
echo.
echo ========================================================
echo   PNMP Server is starting!
echo   Open your browser at: http://127.0.0.1:5000
echo ========================================================
echo.
python app.py
pause
