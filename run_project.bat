@echo off
echo Starting ConfessionKML Project...

:: Check if python is installed
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Python is not installed or not in PATH. Please install Python.
    pause
    exit /b
)

:: Create virtual environment if it doesn't exist
if not exist "venv" (
    echo Creating virtual environment...
    python -m venv venv
)

:: Activate venv and install requirements
echo Installing backend dependencies...
call venv\Scripts\activate
pip install -r backend\requirements.txt

:: Start the backend
echo.
echo ===================================================
echo 🚀 ConfessionKML Backend is starting...
echo 🔗 Website URL: http://127.0.0.1:8000
echo 📂 Open this URL in your browser (Do NOT open the html file directly!)
echo ===================================================
echo.

:: Run uvicorn. Using 'python -m uvicorn' ensures the venv's python is used with the module path.
python -m uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000

pause

