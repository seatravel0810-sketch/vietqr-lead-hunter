# Recon map: Scrap.io (Web Application)

Scope: Google Maps B2B Lead Scraper, Data Enrichment, Smart Filtering & Outreach Platform (Bản địa hóa 100% cho thị trường Việt Nam)  
For: B2B Marketing Agencies, Freelancers, Telesales Teams, and Software Sales in Vietnam  
Date: 2026-11-19  

---

## Sources

| # | source | URL | notes |
| --- | --- | --- | --- |
| 1 | Scrap.io Official Website | `https://scrap.io` | Marketing positioning, core value proposition, live preview features |
| 2 | Scrap.io Pricing Page | `https://scrap.io/pricing` | Credit system (10k - 100k leads/mo), pricing tiers ($49 - $599/mo), geographic gates |
| 3 | Scrap.io Knowledge Base & FAQ | `https://scrap.io/faq` | Credit consumption rules, 30-day deduplication, search filters |
| 4 | Industry Reviews (G2 & Capterra) | `https://g2.com/products/scrap-io` | User feedback on real-time extraction vs stale databases, email validity |
| 5 | Vietnamese B2B Outbound Landscape | Local Field Research | High demand for Zalo 1-click outreach, mobile phone extraction (09x/08x/03x/07x/05x), and VietQR subscriptions |

---

## Core loop

Người dùng nhập ngành nghề & khu vực ➔ Hệ thống trích xuất dữ liệu Google Maps thời gian thực trong vài giây kèm bộ lọc điểm đau (Chưa có web, SĐT di động, Rating) ➔ Xem trước miễn phí và xuất danh sách Excel/CSV (trừ Credit) hoặc bấm 1-chạm mở Zalo gửi kịch bản chào hàng cá nhân hóa.

---

## Screens

| ID | screen | route / how to reach | purpose | key components | states seen |
| --- | --- | --- | --- | --- | --- |
| **S01** | Search & Live Workspace | `/` hoặc `/search` | Trung tâm tìm kiếm cơ sở kinh doanh theo ngành nghề & địa bàn | Thanh input đôi (Category dropdown + Location/City selector), Nút Quét dữ liệu, Đếm số lượng kết quả | Empty, Searching (Loading skeleton), Results Loaded, Error |
| **S02** | Data Table & Live Preview | `/search/results` | Hiển thị danh sách doanh nghiệp dạng bảng SaaS chuyên nghiệp | Data Table (Tên, SĐT, Địa chỉ, ⭐ Rating, Reviews, Web status, Socials), Pagination, Checkbox chọn hàng loạt | Empty, Partial results, Full table, Row selected |
| **S03** | Smart Filter Drawer | Sidebar / Drawer | Lọc các cơ sở có "vết thương số" để tăng tỷ lệ chốt sale | Toggles: Chỉ lấy tiệm có SĐT di động, Tiệm CHƯA CÓ Website, Rating < 4.0 ⭐, Có Fanpage/Zalo, Bán kính km | Default (no filter), Active filters, 0 results match |
| **S04** | Lead Detail Modal / Drawer | Click vào hàng bất kỳ | Xem chi tiết 360 độ về một cơ sở kinh doanh | Thẻ tổng quan, Giờ mở cửa, Đánh giá chi tiết, Link Google Maps gốc, Trình tạo kịch bản chào hàng nhanh | Loading, Full details, Edit notes |
| **S05** | Export & Credit Deduct Modal | Bấm nút "Xuất Excel" | Xuất file dữ liệu và trừ hạn mức Credit minh bạch | Hiển thị số lead đã chọn, Số dư Credit hiện tại, Số Credit sẽ trừ, Tùy chọn định dạng (.xlsx / .csv), Nút Tải ngay | Confirmation, Deducting, Success download, Out of credits |
| **S06** | Lead Pipeline CRM (Kanban) | `/crm` hoặc `/leads` | Quản lý quy trình chăm sóc khách hàng sau khi cào | Bảng Kanban kéo thả (Mới cào ➔ Đã liên hệ ➔ Khách quan tâm ➔ Đã chốt ➔ Bỏ qua), Lịch sử gọi/nhắn | Empty board, Populated cards, Filtered by status |
| **S07** | Pricing & VietQR Auto-Billing | `/pricing` | Mua gói thuê bao & Nạp thêm Credits tự động 100% | Bảng giá 3 gói (Starter 199k - Pro 499k - Business 999k), Khung mã Dynamic VietQR Napas247, Timer đếm ngược | Pricing selection, Awaiting payment, Payment confirmed |

---

## Flows

```text
F01 Săn khách hàng & Xuất danh sách Excel (Core Loop)
    S01 (chọn ngành: Spa + chọn Tỉnh: Hà Nội) 
    ➔ S02 (hiển thị 150 tiệm trong 2 giây) 
    ➔ S03 (bật bộ lọc: "Chưa có website" ➔ còn 38 tiệm) 
    ➔ S05 (chọn tất cả 38 tiệm ➔ hiện modal trừ 38 credits ➔ tải file .xlsx)
    happy path clicks: 4 clicks
    edge: hết credit (chuyển hướng sang S07), không tìm thấy tiệm nào trong khu vực

F02 Tiếp cận 1-Chạm qua Zalo (Vietnamese Killer Advantage)
    S02 (chọn cơ sở tiềm năng) 
    ➔ S04 (bấm nút "💬 Nhắn Zalo") 
    ➔ Chọn kịch bản mẫu ("Chào thiết kế Web" hoặc "Chào dịch vụ Marketing") 
    ➔ Bấm "Mở Zalo" (hệ thống tự động inject tên tiệm, địa chỉ vào link `zalo.me/84...` và mở Zalo)
    happy path clicks: 3 clicks
    edge: số điện thoại bàn không có Zalo (hệ thống cảnh báo và gợi ý gọi thoại)

F03 Nạp Credit & Kích hoạt gói tức thì qua VietQR
    S07 (chọn gói Pro 499.000đ / 5.000 credits) 
    ➔ Quét mã Dynamic VietQR trên app ngân hàng 
    ➔ Webhook SePAY/PayOS bắt giao dịch trong 5s ➔ Màn hình tự động nhảy xanh và cộng 5.000 credits
    happy path clicks: 2 clicks (quét QR trên điện thoại)
    edge: chuyển khoản sai nội dung (hệ thống hiển thị hotline hỗ trợ tra soát)
```

---

## Components

| component | variants | states | used on |
| --- | --- | --- | --- |
| **SearchBar** | dual-input (Category + Location) | default, focused, loading, disabled | S01 |
| **LeadDataTable** | striped, bordered, compact | loading skeleton, populated, sorted, selected | S02 |
| **FilterChip** | outline, filled, active | default, hover, active, disabled | S01, S02, S03 |
| **LeadBadge** | mobile-phone, landline, no-website, high-rating, new | default | S02, S04 |
| **Button** | primary (purple/blue), secondary (slate), success (emerald), danger | default, hover, active, loading spinner, disabled | all |
| **CreditCounter** | badge pill, progress bar | normal, warning (<10%), exhausted (0) | S01, S02, S05, S07 |
| **KanbanCard** | draggable, compact, expanded | default, dragging, dropped | S06 |
| **VietQRModal** | qr-display, timer, status-indicator | awaiting_payment, verifying, success, expired | S07 |

---

## Inferred data model

```text
User
    id, email, phone, full_name, plan_tier (free | starter | pro | business),
    credits_balance, credits_reset_at, created_at, updated_at
    evidence: S07 pricing, S05 credit modal, account settings
    confidence: high

Lead (Business Listing)
    id, place_id, name, category, phone, phone_type (mobile | landline | none),
    address, city, district, latitude, longitude,
    google_rating, reviews_count, google_maps_url,
    website, has_website, facebook_url, zalo_url,
    opening_hours (json), raw_data (json), last_crawled_at
    evidence: S02 data table, S04 detail drawer, export file format
    confidence: high

SearchHistory
    id, user_id, query_category, query_location, total_found, created_at
    evidence: S01 recent searches, caching layer
    confidence: high

UserExport
    id, user_id, export_name, leads_count, credits_spent, file_format (xlsx | csv),
    file_url, created_at
    evidence: S05 export history, 30-day duplicate protection
    confidence: high

LeadPipelineItem (CRM)
    id, user_id, lead_id, status (new | contacted | interested | won | lost),
    notes, last_contacted_at, created_at
    evidence: S06 Kanban board
    confidence: high

Transaction (VietQR Billing)
    id, user_id, plan_id, amount, payment_code, status (pending | paid | expired),
    gateway (sepay | payos), paid_at
    evidence: S07 VietQR modal
    confidence: high
```

Relationships:  
`User 1-n SearchHistory`, `User 1-n UserExport`, `User 1-n LeadPipelineItem`, `User 1-n Transaction`, `Lead 1-n LeadPipelineItem`.

---

## Feature matrix

Xem chi tiết tại `replica/features.csv`.  
- **Must (Bắt buộc cho Core Loop):** 12 tính năng cốt lõi.  
- **Should (Gia tăng giá trị & chuyển đổi):** 8 tính năng nâng cao.  
- **Could (Mở rộng quy mô):** 4 tính năng tiện ích.  
- **Skip (Không clone):** 2 tính năng đặc thù quốc tế của Scrap.io không phù hợp VN (Cold Email qua SMTP quốc tế, Dữ liệu danh bạ Pháp/Mỹ ngoài phạm vi).

---

## Out of scope (cannot or should not be cloned)

- **Cào dữ liệu danh bạ nước ngoài (Pháp, Mỹ, Anh):** Clone tập trung 100% vào dữ liệu 63 tỉnh thành Việt Nam.
- **Hạ tầng SMTP Cold Email:** Văn hóa kinh doanh B2B tại Việt Nam không đọc cold email; thay thế hoàn toàn bằng **Zalo 1-Click & Hotline Call Generator**.
- **Cổng thanh toán Stripe / PayPal:** Thay thế bằng **Dynamic VietQR Napas247** không cần thẻ Visa, phí giao dịch 0%.

---

## Size

- **Screens:** 7 màn hình (S01 - S07).
- **Flows:** 3 luồng người dùng cốt lõi (F01, F02, F03).
- **Entities:** 6 bảng dữ liệu thực thể.
- **Phần khó nhất:**  
  1. Engine Playwright crawler bóc tách Google Maps mượt mà, phân loại chuẩn số di động vs số bàn.
  2. Bảng dữ liệu lớn (Table) tải mượt 1.000+ dòng có phân trang, bộ lọc thời gian thực và xuất file `.xlsx` trong 1 click.
  3. Cơ chế trừ Credit minh bạch và chống tính trùng trong 30 ngày.
- **Kích thước dự án (Size):** **M (Medium)** — Hoàn thành bản MVP chuẩn thương mại trong 2 - 3 ngày làm việc tập trung.
