# Architecture: VietQR Lead Hunter (Scrap.io Clean-Room Rebuild)

> Thiết kế kiến trúc kỹ thuật chuẩn Clean-Room Engineering dựa trên kết quả khảo sát từ `replica/recon.md` và hệ thống thiết kế `ui-ux-pro-max-skill` (chống giao diện web đơn điệu).

---

## 1. Stack

| Layer | Choice | Why |
| --- | --- | --- |
| **Web App** | Next.js 15 (App Router) + TypeScript | Rendering phía server nhanh (RSC), API routes tích hợp sẵn, typed an toàn. |
| **Styling & UI Tokens** | TailwindCSS + **`ui-ux-pro-max-skill`** | Sử dụng toàn bộ bộ token và quy tắc thiết kế từ `ui-ux-pro-max-skill` (Trust Blue `#2563EB`, Accent `#EA580C`, font Plus Jakarta Sans, Density 8/10, glassmorphism, multi-layer shadows). |
| **Data Table** | TanStack Table v8 | Xử lý bảng dữ liệu lớn (1.000+ leads) mượt mà với sorting, column filtering, pagination, selection. |
| **Database** | PostgreSQL on Supabase (hoặc Neon) | Lưu trữ hàng trăm ngàn cơ sở dữ liệu làm Cache layer, hỗ trợ truy vấn không gian Geo, JSONB cho giờ mở cửa, RLS bảo mật. |
| **ORM** | Drizzle ORM | Siêu nhẹ, zero-overhead, hỗ trợ TypeScript hoàn hảo, migrate schema an toàn. |
| **Crawler Engine** | Python Playwright + Stealth Layer | Chạy headless worker giả lập hành vi người dùng thật, chia ô lưới địa lý để cào 100% không sót và không bị Google chặn. |
| **Export Engine** | SheetJS (`xlsx`) | Tạo file Excel `.xlsx` có màu sắc, freeze header, auto-width chỉ trong 0.5s ở client hoặc server. |
| **Outreach** | Native Zalo Scheme & URL Encoder | Gọi trực tiếp `https://zalo.me/{phone}?text={encoded}` mở app Zalo tức thì không tốn phí SMS/API. |
| **Payments** | Dynamic VietQR (SePAY / PayOS) | Thanh toán quét mã QR Napas247 tự động kích hoạt gói trong 5 giây, 0% phí giao dịch, không cần thẻ Visa. |
| **Hosting** | Vercel (Front + API) | Tối ưu hóa CDN, Edge routing, auto deployment qua GitHub. |

---

## 2. Schema

Số bảng: **6 bảng chính**.  
Chi tiết SQL xem tại file: [replica/schema.sql](file:///d:/Replica%20skill/vietqr-lead-hunter/replica/schema.sql).

- `users`: Quản lý người dùng, hạng gói (`free`, `starter`, `pro`, `business`) và số dư `credits_balance`.
- `leads`: Kho dữ liệu cơ sở kinh doanh đã cào (Google Place ID, tên, SĐT, phân loại mobile/landline, địa chỉ, rating, web status).
- `search_queries`: Lưu trữ lịch sử tìm kiếm và đếm số lượng kết quả.
- `user_exports`: Lịch sử các lần xuất file Excel/CSV.
- `user_exported_leads`: Ghi nhận các tiệm đã xuất để **bảo vệ chống trừ credit trùng lặp trong 30 ngày**.
- `lead_pipeline`: Bảng Kanban CRM quản lý tiến độ săn khách (`new`, `contacted`, `interested`, `won`, `lost`).
- `billing_transactions`: Ghi nhận giao dịch nạp credit tự động qua VietQR.

---

## 3. API Endpoints

| Method & Path | Does | Who | Input | Output | Flow |
| --- | --- | --- | --- | --- | --- |
| `POST /api/search` | Tìm kiếm cơ sở trong cache hoặc kích hoạt worker | Public / Auth | `{ category, location, radius, filters }` | `{ leads: Lead[], totalCount: number, fromCache: boolean }` | F01 |
| `POST /api/crawler/run` | Kích hoạt Python Playwright cào trực tiếp từ Google Maps | Internal API | `{ query, limit, geoGrid }` | `{ rawLeads: any[], executionTime: number }` | F01 |
| `POST /api/leads/export` | Trừ Credit và sinh file Excel/CSV tải về | Auth User | `{ leadIds: string[], format: 'xlsx' \| 'csv' }` | `{ downloadUrl, creditsDeducted, newBalance }` | F01 |
| `GET /api/leads/:id` | Xem chi tiết 360 độ một cơ sở kinh doanh | Auth User | `leadId` | `{ lead: LeadDetail, outreachTemplates: any[] }` | F02 |
| `POST /api/outreach/zalo` | Render kịch bản Zalo cá nhân hóa và sinh link | Auth User | `{ leadId, templateId, customNotes }` | `{ zaloLink: string, messageText: string }` | F02 |
| `GET /api/crm/pipeline` | Lấy danh sách khách hàng trên bảng Kanban | Auth User | `none` | `{ stages: { [stage]: Lead[] } }` | F02 |
| `PATCH /api/crm/pipeline/:id` | Cập nhật trạng thái kéo thả Kanban | Auth User | `{ stage, notes }` | `{ success: boolean }` | F02 |
| `POST /api/billing/create-qr` | Sinh mã Dynamic VietQR nạp Credit | Auth User | `{ planTier: 'starter' \| 'pro' \| 'business' }` | `{ qrCodeUrl, paymentCode, amount, expiresAt }` | F03 |
| `POST /api/webhooks/sepay` | Webhook ngân hàng tự động cộng Credit | SePAY Webhook | `{ gateway, transferAmount, content }` | `{ success: true, userCredited }` | F03 |

---

## 4. The Parts That Bite (Các bẫy kỹ thuật và giải pháp)

1. **Phân loại Số điện thoại Di động vs Số bàn (Phone Parsing)**:
   - *Bẫy*: Cào được SĐT nhưng là số bàn (024, 028) khiến người dùng bấm vào Zalo bị báo "Số điện thoại chưa đăng ký Zalo".
   - *Giải pháp*: Regex engine bóc tách đầu số: Nếu bắt đầu bằng `09, 08, 07, 03, 05` gán nhãn `mobile` và hiển thị badge xanh `📱 Zalo khả dụng`; nếu là đầu số khác gán nhãn `landline` hiển thị badge xám `☎️ Máy bàn (Chỉ gọi)`.
2. **Chống trừ tiền trùng lặp (Idempotency & Deduplication)**:
   - *Bẫy*: Người dùng cào lại một khu vực nhiều lần và xuất file bị trừ tiền oan.
   - *Giải pháp*: Bảng `user_exported_leads` có ràng buộc `UNIQUE(user_id, lead_id)`. Trước khi trừ Credit, hệ thống chạy `COUNT(*) WHERE lead_id IN (...) AND user_id = ...`. Chỉ trừ Credit cho những tiệm **chưa từng xuất** trong 30 ngày qua!
3. **Hiệu năng Bảng dữ liệu lớn (DOM Bloat)**:
   - *Bẫy*: Render 1.000 dòng thẻ tiệm cùng lúc làm trình duyệt lag và giật chuột.
   - *Giải pháp*: Dùng `TanStack Table` kết hợp phân trang (20 / 50 / 100 dòng mỗi trang) và kỹ thuật Window Virtualization.

---

## 5. Build Order (Thứ tự triển khai)

### Giai đoạn 1: Lát cắt mỏng (Vertical Slice)
- Màn hình S01 (Khung tìm kiếm + Tỉnh thành 63 tỉnh) + S02 (Bảng dữ liệu SaaS Table áp dụng đầy đủ theme `ui-ux-pro-max-skill`).
- Worker cào Playwright bóc tách Tên, SĐT di động/bàn, Địa chỉ, Website, Rating.
- Nút xuất file Excel `.xlsx` 1 chạm.

### Giai đoạn 2: Must-Haves
- Bộ lọc điểm đau (Lọc tiệm chưa có web, Lọc tiệm có SĐT di động, Lọc rating < 4.0).
- Hệ thống Credit (Xem trước miễn phí, trừ credit khi bấm xuất file).
- Module 1-Click Zalo Outreach với 4 kịch bản mẫu.

### Giai đoạn 3: Should-Haves & Pro Features
- Bảng Kanban CRM kéo thả trạng thái săn khách.
- Tích hợp cổng thanh toán tự động VietQR Napas247 (SePAY/PayOS).
- Lưu trữ Cache kết quả trên PostgreSQL để tìm kiếm tức thì trong 0.2 giây.
