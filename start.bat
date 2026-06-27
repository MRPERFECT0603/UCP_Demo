@echo off
setlocal

set "ROOT=%~dp0"
set "ROOT=%ROOT:~0,-1%"

echo ===============================================
echo   UCP Shopping Agent - Setup ^& Start
echo ===============================================
echo.

echo [1/4] Installing Flipkart mock server deps...
pushd "%ROOT%\mock-servers\flipkart"
call npm install --prefer-offline 2>nul
if errorlevel 1 (
    echo Installing without cache...
    call npm install
)
popd

echo [2/4] Installing Myntra mock server deps...
pushd "%ROOT%\mock-servers\myntra"
call npm install --prefer-offline 2>nul
if errorlevel 1 (
    call npm install
)
popd

echo [3/4] Installing backend deps...
pushd "%ROOT%\backend"
call npm install --prefer-offline 2>nul
if errorlevel 1 (
    call npm install
)
popd

echo [4/4] Installing frontend deps...
pushd "%ROOT%\frontend"
call npm install --prefer-offline 2>nul
if errorlevel 1 (
    call npm install
)
popd

echo.
echo Freeing ports 3001, 3002, 4000, 5173...
for /f "tokens=5" %%a in ('netstat -aon 2^>nul ^| findstr ":3001 "') do taskkill /PID %%a /F >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon 2^>nul ^| findstr ":3002 "') do taskkill /PID %%a /F >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon 2^>nul ^| findstr ":4000 "') do taskkill /PID %%a /F >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon 2^>nul ^| findstr ":5173 "') do taskkill /PID %%a /F >nul 2>&1
timeout /t 1 /nobreak > nul

echo Starting all services...
echo.

start "Flipkart UCP (port 3001)" cmd /k "cd /d "%ROOT%\mock-servers\flipkart" && npm run start"
timeout /t 2 /nobreak > nul

start "Myntra UCP (port 3002)" cmd /k "cd /d "%ROOT%\mock-servers\myntra" && npm run start"
timeout /t 2 /nobreak > nul

start "Backend API (port 4000)" cmd /k "cd /d "%ROOT%\backend" && npm run dev"
timeout /t 3 /nobreak > nul

start "Frontend (port 5173)" cmd /k "cd /d "%ROOT%\frontend" && npm run dev"

echo.
echo ===============================================
echo   UCP Shopping Agent is starting!
echo ===============================================
echo.
echo   Frontend:        http://localhost:5173
echo   Backend API:     http://localhost:4000
echo   Flipkart Server: http://localhost:3001
echo   Myntra Server:   http://localhost:3002
echo.
echo   Four windows opened - close them to stop.
echo   Open http://localhost:5173 in your browser.
echo ===============================================
echo.
pause
