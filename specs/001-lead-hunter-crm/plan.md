# PLAN-002: Kế Hoạch Triển Khai Luồng "Làm DEMO Đăng Ký Cửa Hàng Thật Sang App 1"

## 1. Kiến Trúc Kỹ Thuật (Architecture)
- **App 1 (`vietqr-booking`):**
  - Tạo endpoint đăng ký cửa hàng: `POST /api/hosts/register-demo`.
    - Nhận: `businessName`, `phone`, `address`, `category`, `slug`.
    - Lưu trữ hồ sơ cửa hàng với thông tin thật.
    - Trả về `demoUrl` chính thức: `https://vietqr-booking.vercel.app/[slug]?name=...&phone=...&addr=...&cat=...`.
  - Cập nhật trang công khai `src/app/(public)/[slug]/page.tsx`:
    - Đọc tham số `name`, `phone`, `addr`, `cat` từ URL (`useSearchParams`) hoặc hồ sơ đăng ký.
    - Hiển thị chính xác tên tiệm, địa chỉ thật, số điện thoại thật trên giao diện đặt lịch.
    - Hiển thị danh mục dịch vụ phù hợp với ngành nghề của tiệm (Salon tóc: cắt/uốn/nhuộm; Nha khoa: cạo vôi/tẩy trắng/trám răng; Spa: chăm sóc da/massage).
- **App 2 (`vietqr-lead-hunter`):**
  - Cập nhật `src/app/page.tsx`:
    - Thẻ tiệm hiển thị đầy đủ thông tin cào về.
    - Nút bấm `[⚡ Làm DEMO Cho Tiệm Này]`:
      - Khi bấm: Gửi request đăng ký sang App 1.
      - Sau khi App 1 tạo xong: Cập nhật `isDemoCreated: true` và `demoUrl` vào state tiệm.
      - Hiển thị link demo và mở khóa 2 nút hành động `[Mở Xem Demo Của Tiệm]` & `[Gửi Tin Zalo Chốt Sale]`.
