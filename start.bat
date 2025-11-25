@echo off
echo ========================================
echo        Blue Dice - Starting App
echo ========================================
echo.

cd /d "C:\Users\bob\blue-dice\frontend"

echo Starting development server...
echo.
echo Once started, open http://localhost:3001
echo Press Ctrl+C to stop the server
echo.

call npm run dev

pause
