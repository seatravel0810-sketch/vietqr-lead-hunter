# TASKS-002: Các Đầu Việc Triển Khai Luồng "Làm DEMO Đăng Ký Cửa Hàng Thật Sang App 1"

- [ ] Task 1: (App 1) Tạo API `POST /api/hosts/register-demo` trong `vietqr-booking` tiếp nhận thông tin thật của cơ sở.
- [ ] Task 2: (App 1) Cập nhật trang công khai `[slug]/page.tsx` trong `vietqr-booking` hiển thị chính xác Tên tiệm thật, SĐT thật, Địa chỉ thật từ query parameters.
- [ ] Task 3: (App 2) Cập nhật giao diện `src/app/page.tsx` trong `vietqr-lead-hunter`:
  - Hiển thị đầy đủ thông tin cào về (Tên, SĐT, Địa chỉ, Đánh giá, Link Maps, Ngành nghề).
  - Tách nút hành động thành 2 bước: Tiệm mới cào hiện nút `[⚡ Làm DEMO Cho Tiệm Này]`.
  - Khi bấm `[Làm Demo]`: Gọi sang App 1 đăng ký hồ sơ cửa hàng thật.
  - Khi tạo xong Demo: Hiển thị link demo và mở khóa 2 nút `[Mở Xem Demo Của Tiệm]` & `[Gửi Tin Zalo Chốt Sale]`.
- [ ] Task 4: Kiểm thử tự động Vitest cho cả App 1 và App 2.
- [ ] Task 5: Deploy cập nhật cả App 1 (`vietqr-booking`) và App 2 (`vietqr-lead-hunter`) lên Vercel.
- [ ] Task 6: Kiểm tra nghiệm thu thực tế với 1 tiệm cào về, bấm Làm Demo, mở xem Demo trên App 1 hiển thị đúng Tên, SĐT, Địa chỉ.
