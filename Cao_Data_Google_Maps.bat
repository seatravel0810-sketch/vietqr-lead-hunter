@echo off
chcp 65001 >nul
title CỖ MÁY CÀO DATA GOOGLE MAPS TỰ ĐỘNG - VIETQR LEAD HUNTER
cd /d "%~dp0"

echo =====================================================================
echo       CỖ MÁY CÀO DATA GOOGLE MAPS TỰ ĐỘNG 100% CHO VIETQR HUNTER
echo =====================================================================
echo.
echo Công cụ sẽ tự động mở Google Maps ngầm, quét toàn bộ tiệm theo từ khóa,
echo tự động bóc tách: Tên tiệm, Số điện thoại (Zalo), Địa chỉ, Link Maps.
echo.

set /p QUERY="Nhập từ khóa và khu vực (VD: Spa Cầu Giấy, Nha khoa Quận 1, Salon tóc Đà Nẵng): "
if "%QUERY%"=="" set QUERY=Spa Quan 1

set /p LIMIT="Số lượng cơ sở muốn cào (Mặc định: 15): "
if "%LIMIT%"=="" set LIMIT=15

echo.
echo [Đang tiến hành cào dữ liệu cho: "%QUERY%" (Số lượng: %LIMIT% tiệm)]...
echo.

python "scripts\google_maps_crawler.py" --query "%QUERY%" --limit %LIMIT% --output "data_crawled.json"

if %errorlevel% equ 0 (
    echo.
    echo =====================================================================
    echo [THÀNH CÔNG RỰC RỠ] Đã cào xong dữ liệu và lưu vào: data_crawled.json
    echo.
    echo Bây giờ bạn mở web app: https://vietqr-lead-hunter.vercel.app
    echo Bấm nút "Săn Google Maps" -> Chọn file "data_crawled.json" để nạp ngay!
    echo =====================================================================
) else (
    echo.
    echo [LỖI] Có lỗi xảy ra trong quá trình cào. Vui lòng kiểm tra lại kết nối mạng.
)

echo.
pause
