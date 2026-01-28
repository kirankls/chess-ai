@echo off
REM ♔ AI Chess Application - Automated Setup Script (Windows)
REM This script sets up the entire development environment on Windows

setlocal enabledelayedexpansion

echo ======================================
echo ♔ AI CHESS APPLICATION - SETUP ^(WINDOWS^)
echo ======================================
echo.

REM Check Python
echo Checking prerequisites...
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python is not installed. Please install Python 3.8 or higher.
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('python --version') do set PYTHON_VERSION=%%i
echo [OK] %PYTHON_VERSION% found

REM Check Node.js
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js is not installed. Please install Node.js 14 or higher.
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo [OK] Node %NODE_VERSION% found

REM Check npm
npm --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: npm is not installed.
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i
echo [OK] npm %NPM_VERSION% found

echo.

REM BACKEND SETUP
echo Setting up backend...

if not exist "backend" (
    echo Creating backend directory...
    mkdir backend
)

cd backend

REM Create virtual environment
if not exist "venv" (
    echo Creating Python virtual environment...
    python -m venv venv
)

REM Activate virtual environment
echo Activating virtual environment...
call venv\Scripts\activate.bat

REM Install dependencies
echo Installing Python dependencies...
python -m pip install --upgrade pip
pip install -r requirements.txt

REM Setup .env file
if not exist ".env" (
    echo Creating .env file from template...
    copy .env.example .env
    echo [WARNING] IMPORTANT: Edit backend\.env and add your OPENAI_API_KEY
) else (
    echo .env file already exists
)

echo [OK] Backend setup complete

cd ..

echo.

REM FRONTEND SETUP
echo Setting up frontend...

if not exist "frontend" (
    echo Creating frontend directory...
    mkdir frontend
)

cd frontend

REM Check if node_modules exist
if not exist "node_modules" (
    echo Installing npm dependencies...
    call npm install
) else (
    echo npm dependencies already installed
)

REM Create .env file
if not exist ".env" (
    echo Creating .env file...
    (
        echo REACT_APP_API_URL=http://localhost:5000/api
    ) > .env
)

echo [OK] Frontend setup complete

cd ..

echo.
echo ======================================
echo [OK] Setup Complete!
echo ======================================
echo.
echo Next steps:
echo.
echo 1. Configure OpenAI API Key:
echo    Edit: backend\.env
echo    Add: OPENAI_API_KEY=sk-your-api-key-here
echo.
echo 2. Start Backend ^(Command Prompt 1^):
echo    cd backend
echo    venv\Scripts\activate
echo    python app.py
echo.
echo 3. Start Frontend ^(Command Prompt 2^):
echo    cd frontend
echo    npm start
echo.
echo 4. Open Browser:
echo    http://localhost:3000
echo.
echo Backend API: http://localhost:5000/api
echo.
pause
