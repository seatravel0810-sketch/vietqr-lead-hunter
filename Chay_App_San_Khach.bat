@echo off
chcp 65001 >nul
title VietQR Lead Hunter - Cỗ Máy Săn Khách & Bán App 1
setlocal enabledelayedexpansion

cd /d "%~dp0"

echo ================================================================
echo    VIETQR LEAD HUNTER (APP 2) - CỖ MÁY SĂN KHÁCH GOOGLE MAPS
echo ================================================================
echo.

:: 1. Kiểm tra xem port 3001 đã chạy chưa
netstat -ano | findstr :3001 | findstr LISTENING >nul
if %errorlevel% equ 0 (
    echo [OK] Server Next.js da dang chay tren cong 3001.
    goto OPEN_BROWSER
)

echo [1/2] Dang khoi dong Server Next.js cuc bo tren cong 3001...

:: Khoi dong Next.js truc tiep qua node de tranh loi symlink pnpm
if exist "node_modules\next\dist\bin\next" (
    start "VietQR_Hunter_Server" /min cmd /c "node node_modules\next\dist\bin\next dev -p 3001"
) else (
    start "VietQR_Hunter_Server" /min cmd /c "npx next dev -p 3001"
)

echo [INFO] Dang doi server san sang (khoang 3-5 giay)...

:: Vong lap cho server san sang
set /a ATTEMPTS=0
:WAIT_LOOP
timeout /t 1 /nobreak >nul
set /a ATTEMPTS+=1

netstat -ano | findstr :3001 | findstr LISTENING >nul
if %errorlevel% equ 0 (
    echo [OK] Server da san sang tren http://localhost:3001!
    goto OPEN_BROWSER
)

if !ATTEMPTS! lss 15 (
    goto WAIT_LOOP
)

echo.
echo [CANH BAO] Server can them vai giay de khoi dong.
echo Vui long bam F5 (Refresh) tren trinh duyet neu trang chua hien ngay.
echo.

:OPEN_BROWSER
echo [2/2] Dang mo ung dung tren trinh duyet cua ban...
start msedge --app=http://localhost:3001 2>nul || start chrome --app=http://localhost:3001 2>nul || start http://localhost:3001

echo.
echo ================================================================
echo    DA MO UNG DUNG SAN KHANG THANH CONG!
echo    - Dia chi: http://localhost:3001
echo    - Cua so server dang chay ngam duoi thanh Taskbar.
echo    - Ban co the nhap tu khoa bat ky de cao Google Maps that 100%%!
echo ================================================================
timeout /t 3 /nobreak >nul
exit
