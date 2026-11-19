import asyncio
import os
import sys
import json
from playwright.async_api import async_playwright

BASE_URL = "https://vietqr-lead-hunter.vercel.app"

async def run_tests():
    print("=" * 70)
    print("🚀 BẮT ĐẦU TEST TOÀN DIỆN UI & CHỨC NĂNG: VIETQR LEAD HUNTER")
    print(f"Target URL: {BASE_URL}")
    print("=" * 70)

    console_logs = []
    page_errors = []
    test_results = []

    def record_result(name, passed, details="", severity=""):
        test_results.append({
            "name": name,
            "passed": passed,
            "details": details,
            "severity": severity
        })
        status_icon = "✅ PASS" if passed else f"❌ FAIL [{severity}]"
        print(f"[{status_icon}] {name}")
        if details:
            print(f"   -> {details}")

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(viewport={"width": 1280, "height": 800})
        page = await context.new_page()

        # Capture console messages and errors
        page.on("console", lambda msg: console_logs.append(f"[{msg.type}] {msg.text}"))
        page.on("pageerror", lambda err: page_errors.append(str(err)))

        # -------------------------------------------------------------
        # TEST 1: Page Load & Initial UI Structure
        # -------------------------------------------------------------
        print("\n--- TEST 1: Khởi động & Cấu trúc Header / Hero UI ---")
        try:
            response = await page.goto(BASE_URL, wait_until="networkidle", timeout=20000)
            status_code = response.status if response else 0
            if status_code == 200:
                record_result("T1.1: Tải trang chủ HTTP 200", True, f"Status {status_code}")
            else:
                record_result("T1.1: Tải trang chủ HTTP 200", False, f"Status {status_code}", "S1")

            # Check Header & Branding
            title_text = await page.locator("header").text_content()
            has_branding = "vietqr.hunter" in title_text.lower() and "credits" in title_text.lower()
            record_result("T1.2: Hiển thị Logo, Tên app & Số dư Credits", has_branding, title_text.strip()[:60])

            # Check Hero Search Bar elements
            has_category_select = await page.locator("select").is_visible()
            has_search_input = await page.locator("input[placeholder*='Nhập địa bàn']").is_visible()
            has_scan_button = await page.locator("button:has-text('Quét Google Maps')").is_visible()
            record_result("T1.3: Đầy đủ Form tìm kiếm (Ngành nghề, Từ khóa, Nút Quét)", 
                          has_category_select and has_search_input and has_scan_button)

        except Exception as e:
            record_result("T1: Lỗi tải trang", False, str(e), "S1")

        # -------------------------------------------------------------
        # TEST 2: Quét "Spa Yên bái" & Kiểm tra Tính Toàn Vẹn Địa Lý (Geo-Integrity)
        # -------------------------------------------------------------
        print("\n--- TEST 2: Quét 'Spa Yên bái' & Kiểm tra Địa lý ---")
        try:
            # Type 'Spa Yên bái'
            search_input = page.locator("input[placeholder*='Nhập địa bàn']")
            await search_input.fill("Spa Yên bái")
            
            # Click Quét Google Maps
            await page.locator("button:has-text('Quét Google Maps')").click()

            # Wait for table to appear
            await page.wait_for_selector("table tbody tr", timeout=15000)
            
            # Count rows
            rows = page.locator("table tbody tr")
            row_count = await rows.count()
            record_result("T2.1: Hiển thị bảng kết quả cho 'Spa Yên bái'", row_count > 0, f"Số cơ sở hiển thị: {row_count}")

            # Verify all rows are in Yên Bái and NONE in Hà Nội
            hanoi_count = 0
            yenbai_count = 0
            addresses = []
            for i in range(row_count):
                row_text = await rows.nth(i).text_content()
                addresses.append(row_text)
                if "Hà Nội" in row_text or "Hai Bà Trưng" in row_text:
                    hanoi_count += 1
                if "Yên Bái" in row_text:
                    yenbai_count += 1

            if hanoi_count == 0 and yenbai_count == row_count:
                record_result("T2.2: 100% Cơ sở thuộc tỉnh Yên Bái (0 cơ sở Hà Nội)", True, 
                              f"{yenbai_count}/{row_count} chuẩn Yên Bái")
            else:
                record_result("T2.2: 100% Cơ sở thuộc tỉnh Yên Bái (0 cơ sở Hà Nội)", False, 
                              f"Lỗi: Tìm thấy {hanoi_count} cơ sở Hà Nội trong kết quả Yên Bái!", "S2")

        except Exception as e:
            record_result("T2: Lỗi quét Yên Bái", False, str(e), "S2")

        # -------------------------------------------------------------
        # TEST 3: Bộ Lọc Điểm Đau (Smart Pain-Point Filters)
        # -------------------------------------------------------------
        print("\n--- TEST 3: Kiểm tra Bộ Lọc Điểm Đau ---")
        try:
            initial_count = await page.locator("table tbody tr").count()

            # 3.1: Filter Mobile Only
            btn_mobile = page.locator("button:has-text('Chỉ SĐT Di Động (Zalo)')")
            await btn_mobile.click()
            await page.wait_for_timeout(500)
            mobile_count = await page.locator("table tbody tr").count()
            record_result("T3.1: Lọc 'Chỉ SĐT Di Động (Zalo)'", mobile_count <= initial_count, f"{mobile_count}/{initial_count} cơ sở có số di động")

            # Check if all visible rows have mobile tag
            rows = page.locator("table tbody tr")
            all_mobile = True
            for i in range(mobile_count):
                txt = await rows.nth(i).text_content()
                if "Số bàn" in txt:
                    all_mobile = False
            record_result("T3.2: Tính chính xác nhãn Di động", all_mobile)

            # Turn off mobile filter
            await btn_mobile.click()
            await page.wait_for_timeout(300)

            # 3.3: Filter Missing Website
            btn_no_web = page.locator("button:has-text('Chưa Có Website')")
            await btn_no_web.click()
            await page.wait_for_timeout(500)
            no_web_count = await page.locator("table tbody tr").count()
            record_result("T3.3: Lọc 'Chưa Có Website (Cần Bán Web)'", no_web_count <= initial_count, f"{no_web_count}/{initial_count} cơ sở chưa có web")

            # Turn off no web filter
            await btn_no_web.click()
            await page.wait_for_timeout(300)

            # 3.4: Filter High Rating >= 4.8
            btn_high_rating = page.locator("button:has-text('Rating ≥ 4.8')")
            await btn_high_rating.click()
            await page.wait_for_timeout(500)
            high_count = await page.locator("table tbody tr").count()
            record_result("T3.4: Lọc 'Rating ≥ 4.8 (Cơ sở uy tín)'", high_count <= initial_count, f"{high_count}/{initial_count} cơ sở đạt rating cao")

            # Reset filter button
            btn_reset = page.locator("button:has-text('Đặt lại bộ lọc')")
            if await btn_reset.is_visible():
                await btn_reset.click()
                await page.wait_for_timeout(500)
                reset_count = await page.locator("table tbody tr").count()
                record_result("T3.5: Nút 'Đặt lại bộ lọc' hoạt động", reset_count == initial_count, f"Trả về đúng {reset_count} cơ sở ban đầu")

        except Exception as e:
            record_result("T3: Lỗi test Smart Filters", False, str(e), "S3")

        # -------------------------------------------------------------
        # TEST 4: Chọn hàng loạt (Selection Checkboxes)
        # -------------------------------------------------------------
        print("\n--- TEST 4: Chọn hàng loạt (Checkboxes & Bulk selection) ---")
        try:
            # Check Select All checkbox
            select_all = page.locator("thead input[type='checkbox']")
            await select_all.click()
            await page.wait_for_timeout(300)
            
            selected_badge = page.locator("span:has-text('Đã chọn')")
            badge_visible = await selected_badge.is_visible()
            badge_text = await selected_badge.text_content() if badge_visible else ""
            record_result("T4.1: Chọn tất cả (Select All) hiển thị badge số lượng", badge_visible, badge_text)

            # Deselect 1 individual row
            first_row_cb = page.locator("tbody tr").first.locator("input[type='checkbox']")
            await first_row_cb.click()
            await page.wait_for_timeout(300)
            updated_badge_text = await selected_badge.text_content()
            record_result("T4.2: Bỏ chọn 1 dòng cập nhật đúng số lượng", badge_text != updated_badge_text, f"{badge_text} -> {updated_badge_text}")

            # Uncheck all
            await select_all.click()
            await page.wait_for_timeout(300)
            badge_disappeared = not (await selected_badge.is_visible())
            record_result("T4.3: Hủy chọn tất cả (Deselect All)", badge_disappeared)

        except Exception as e:
            record_result("T4: Lỗi test selection", False, str(e), "S3")

        # -------------------------------------------------------------
        # TEST 5: Modal Xuất File Excel (.xlsx) & Trừ Credits
        # -------------------------------------------------------------
        print("\n--- TEST 5: Modal Xuất Excel (.xlsx) ---")
        try:
            btn_export = page.locator("button:has-text('Xuất File Excel')")
            await btn_export.click()
            await page.wait_for_selector(".glass-modal", timeout=3000)
            
            modal_text = await page.locator(".glass-modal").text_content()
            has_export_details = "Xuất Danh Sách Excel" in modal_text and "Chi phí tiêu hao" in modal_text
            record_result("T5.1: Mở Modal Xuất Excel thành công", has_export_details)

            # Click Hủy bỏ to close
            btn_cancel = page.locator(".glass-modal button:has-text('Hủy bỏ')")
            await btn_cancel.click()
            await page.wait_for_timeout(500)
            is_closed = not (await page.locator(".glass-modal").is_visible())
            record_result("T5.2: Đóng Modal Xuất Excel khi bấm Hủy", is_closed)

        except Exception as e:
            record_result("T5: Lỗi test Modal Xuất Excel", False, str(e), "S3")

        # -------------------------------------------------------------
        # TEST 6: Quick Action - Zalo Outreach Modal
        # -------------------------------------------------------------
        print("\n--- TEST 6: Quick Action - Zalo Outreach Modal ---")
        try:
            btn_zalo = page.locator("tbody tr button:has-text('Zalo')").first
            if await btn_zalo.is_visible():
                await btn_zalo.click()
                await page.wait_for_selector("h2:has-text('Gửi Tin Zalo Chào Hàng')", timeout=3000)
                
                zalo_modal_text = await page.locator(".fixed.inset-0").text_content()
                has_script = "Kịch bản" in zalo_modal_text or "Dạ em chào" in zalo_modal_text or "Zalo" in zalo_modal_text
                record_result("T6.1: Mở Outreach Modal thành công", has_script)

                # Test Copy Message button
                btn_copy = page.locator("button:has-text('Sao Chép Tin Nhắn'), button:has-text('Sao chép tin nhắn')").first
                if await btn_copy.is_visible():
                    await btn_copy.click()
                    await page.wait_for_timeout(300)
                    record_result("T6.2: Nút Sao chép tin nhắn click được", True)

                # Close modal
                btn_close = page.locator("button[aria-label='Đóng'], button:has-text('Đóng')").first
                if await btn_close.is_visible():
                    await btn_close.click()
                else:
                    await page.locator(".fixed.inset-0").click(position={"x": 10, "y": 10})
                await page.wait_for_timeout(800)
            else:
                record_result("T6.1: Nút Zalo trên dòng", False, "Không tìm thấy nút Zalo", "S3")

        except Exception as e:
            record_result("T6: Lỗi test Zalo modal", False, str(e), "S3")

        # -------------------------------------------------------------
        # TEST 7: Quét "Spa hoàn kiếm" với số lượng 20
        # -------------------------------------------------------------
        print("\n--- TEST 7: Quét 'Spa hoàn kiếm' với Limit = 20 ---")
        try:
            # Click limit 20
            btn_20 = page.locator("div:has(button:has-text('20')) button:has-text('20')")
            await btn_20.click()
            await page.wait_for_timeout(300)

            # Fill 'Spa hoàn kiếm'
            search_input = page.locator("input[placeholder*='Nhập địa bàn']")
            await search_input.fill("Spa hoàn kiếm")
            await page.locator("button:has-text('Quét Google Maps')").click()

            # Wait for results
            await page.wait_for_selector("table tbody tr", timeout=15000)
            hk_count = await page.locator("table tbody tr").count()
            
            if hk_count == 20:
                record_result("T7.1: Quét 'Spa hoàn kiếm' trả về đúng 20/20 cơ sở", True, f"Số lượng: {hk_count}")
            elif hk_count > 0:
                record_result("T7.1: Quét 'Spa hoàn kiếm' trả về cơ sở", True, f"Số lượng: {hk_count} (chưa đạt 20)", "S3")
            else:
                record_result("T7.1: Quét 'Spa hoàn kiếm'", False, "0 cơ sở tìm thấy", "S2")

        except Exception as e:
            record_result("T7: Lỗi quét Hoàn Kiếm", False, str(e), "S2")

        # -------------------------------------------------------------
        # TEST 8: Tìm kiếm khu vực chưa có dữ liệu ("Spa Cà Mau")
        # -------------------------------------------------------------
        print("\n--- TEST 8: Tìm kiếm khu vực chưa có dữ liệu ('Spa Cà Mau') ---")
        try:
            # Wait for previous toast to clear
            await page.wait_for_timeout(4000)
            search_input = page.locator("input[placeholder*='Nhập địa bàn']")
            await search_input.fill("Spa Cà Mau")
            await page.locator("button:has-text('Quét Google Maps')").click()

            # Expect Toast message notification
            toast = page.locator(".fixed.bottom-20, .fixed.bottom-6")
            try:
                await toast.wait_for(state="visible", timeout=8000)
                toast_text = await toast.text_content()
                has_clean_explanation = "chưa có dữ liệu" in toast_text or "thử các khu vực" in toast_text
                record_result("T8.1: Hiển thị thông báo Toast trung thực (không lấy bừa tỉnh khác)", 
                              has_clean_explanation, toast_text)
            except:
                # Check if an alert was triggered
                record_result("T8.1: Thông báo cho khu vực trống", False, "Toast không xuất hiện kịp", "S3")

        except Exception as e:
            record_result("T8: Lỗi test khu vực trống", False, str(e), "S3")

        # -------------------------------------------------------------
        # TEST 9: Mobile Responsive Viewport (375x812 iPhone)
        # -------------------------------------------------------------
        print("\n--- TEST 9: Kiểm tra Hiển thị Di Động (Mobile 375px) ---")
        try:
            await page.set_viewport_size({"width": 375, "height": 812})
            await page.goto(BASE_URL, wait_until="networkidle")

            # Check if search input and Quét button are visible and not overflowed
            is_input_visible = await page.locator("input[placeholder*='Nhập địa bàn']").is_visible()
            is_scan_visible = await page.locator("button:has-text('Quét Google Maps')").is_visible()
            
            # Check horizontal scroll on page body
            scroll_width = await page.evaluate("() => document.documentElement.scrollWidth")
            client_width = await page.evaluate("() => document.documentElement.clientWidth")
            no_horizontal_overflow = scroll_width <= client_width + 5

            record_result("T9.1: Giao diện di động co giãn tốt, không bị vỡ tràn chiều ngang", 
                          no_horizontal_overflow, f"scrollWidth={scroll_width}, clientWidth={client_width}")
            record_result("T9.2: Form tìm kiếm hiển thị trọn vẹn trên Mobile", 
                          is_input_visible and is_scan_visible)

        except Exception as e:
            record_result("T9: Lỗi test Mobile", False, str(e), "S3")

        # -------------------------------------------------------------
        # TEST 10: Zero Syntax Leakage & Console Errors Audit
        # -------------------------------------------------------------
        print("\n--- TEST 10: Kiểm tra Lọt cú pháp (Zero Syntax Leakage) & Console Errors ---")
        try:
            body_text = await page.evaluate("() => document.body.innerText")
            leakage_found = []
            for bad_char in ["$\\rightarrow$", "\\times", "NaN", "undefined", "[object Object]"]:
                if bad_char in body_text:
                    leakage_found.append(bad_char)

            if len(leakage_found) == 0:
                record_result("T10.1: Không lọt ký tự LaTeX thô / escape / undefined", True)
            else:
                record_result("T10.1: Không lọt ký tự LaTeX thô / escape", False, f"Tìm thấy: {leakage_found}", "S3")

            # Check console errors
            severe_console_errors = [log for log in console_logs if "[error]" in log and "favicon" not in log]
            if len(severe_console_errors) == 0 and len(page_errors) == 0:
                record_result("T10.2: Console hoàn toàn sạch, không có Uncaught Exception", True)
            else:
                details = f"PageErrors: {page_errors} | ConsoleErrors: {severe_console_errors[:3]}"
                record_result("T10.2: Console sạch", False, details, "S4")

        except Exception as e:
            record_result("T10: Lỗi audit syntax/console", False, str(e), "S4")

        await browser.close()

    print("\n" + "=" * 70)
    print("📊 TỔNG KẾT KẾT QUẢ TEST UI & CHỨC NĂNG")
    print("=" * 70)
    passed_count = sum(1 for r in test_results if r["passed"])
    total_count = len(test_results)
    print(f"Tổng số test: {total_count} | Đạt: {passed_count} | Thất bại: {total_count - passed_count}")

    # Save test report to json
    with open("scripts/test_run_report.json", "w", encoding="utf-8") as f:
        json.dump({
            "target": BASE_URL,
            "total": total_count,
            "passed": passed_count,
            "failed": total_count - passed_count,
            "results": test_results,
            "console_logs": console_logs,
            "page_errors": page_errors
        }, f, ensure_ascii=False, indent=2)

if __name__ == "__main__":
    asyncio.run(run_tests())
