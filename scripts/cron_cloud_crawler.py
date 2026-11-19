import asyncio
import os
import sys
import json
import re
import time
from playwright.async_api import async_playwright
import psycopg2
from psycopg2.extras import Json

# Danh sách nhiệm vụ quét định kỳ cho các ngành dịch vụ và các tỉnh thành trọng điểm tại Việt Nam
CRAWL_TARGETS = [
    # 1. Hair Salon & Tiệm Cắt Tóc / Barber
    ("Cắt tóc Hoàn Kiếm Hà Nội", "salon", "Hair Salon & Cắt tóc", "Hà Nội"),
    ("Cắt tóc Cầu Giấy Hà Nội", "salon", "Hair Salon & Cắt tóc", "Hà Nội"),
    ("Cắt tóc Xuân Mai Chương Mỹ", "salon", "Hair Salon & Cắt tóc", "Xuân Mai"),
    ("Cắt tóc Quận 1 TP.HCM", "salon", "Hair Salon & Cắt tóc", "TP.HCM"),
    ("Cắt tóc Quận 3 TP.HCM", "salon", "Hair Salon & Cắt tóc", "TP.HCM"),
    ("Cắt tóc Hải Châu Đà Nẵng", "salon", "Hair Salon & Cắt tóc", "Đà Nẵng"),
    ("Cắt tóc TP Huế", "salon", "Hair Salon & Cắt tóc", "Huế"),
    ("Cắt tóc TP Hải Phòng", "salon", "Hair Salon & Cắt tóc", "Hải Phòng"),
    ("Cắt tóc TP Nha Trang", "salon", "Hair Salon & Cắt tóc", "Nha Trang"),
    ("Cắt tóc TP Vũng Tàu", "salon", "Hair Salon & Cắt tóc", "Vũng Tàu"),
    ("Cắt tóc TP Buôn Ma Thuột", "salon", "Hair Salon & Cắt tóc", "Đắk Lắk"),
    ("Cắt tóc TP Cần Thơ", "salon", "Hair Salon & Cắt tóc", "Cần Thơ"),
    ("Cắt tóc TP Cà Mau", "salon", "Hair Salon & Cắt tóc", "Cà Mau"),
    ("Cắt tóc TP Hạ Long", "salon", "Hair Salon & Cắt tóc", "Quảng Ninh"),
    ("Cắt tóc TP Đà Lạt", "salon", "Hair Salon & Cắt tóc", "Lâm Đồng"),

    # 2. Spa & Thẩm mỹ viện & Dưỡng sinh
    ("Spa Hoàn Kiếm Hà Nội", "spa", "Spa & Thẩm mỹ viện", "Hà Nội"),
    ("Spa Cầu Giấy Hà Nội", "spa", "Spa & Thẩm mỹ viện", "Hà Nội"),
    ("Spa Đống Đa Hà Nội", "spa", "Spa & Thẩm mỹ viện", "Hà Nội"),
    ("Spa Quận 1 TP.HCM", "spa", "Spa & Thẩm mỹ viện", "TP.HCM"),
    ("Spa Quận 3 TP.HCM", "spa", "Spa & Thẩm mỹ viện", "TP.HCM"),
    ("Spa Quận 7 TP.HCM", "spa", "Spa & Thẩm mỹ viện", "TP.HCM"),
    ("Spa Hải Châu Đà Nẵng", "spa", "Spa & Thẩm mỹ viện", "Đà Nẵng"),
    ("Spa TP Huế", "spa", "Spa & Thẩm mỹ viện", "Huế"),
    ("Spa Vĩnh Yên Vĩnh Phúc", "spa", "Spa & Thẩm mỹ viện", "Vĩnh Phúc"),
    ("Spa TP Yên Bái", "spa", "Spa & Thẩm mỹ viện", "Yên Bái"),
    ("Spa TP Hải Phòng", "spa", "Spa & Thẩm mỹ viện", "Hải Phòng"),
    ("Spa TP Hạ Long", "spa", "Spa & Thẩm mỹ viện", "Quảng Ninh"),
    ("Spa Thủ Dầu Một Bình Dương", "spa", "Spa & Thẩm mỹ viện", "Bình Dương"),
    ("Spa TP Biên Hòa", "spa", "Spa & Thẩm mỹ viện", "Đồng Nai"),
    ("Spa Ninh Kiều Cần Thơ", "spa", "Spa & Thẩm mỹ viện", "Cần Thơ"),
    ("Spa TP Nha Trang", "spa", "Spa & Thẩm mỹ viện", "Khánh Hòa"),
    ("Spa TP Vũng Tàu", "spa", "Spa & Thẩm mỹ viện", "Bà Rịa - Vũng Tàu"),
    ("Spa TP Đà Lạt", "spa", "Spa & Thẩm mỹ viện", "Lâm Đồng"),
    ("Spa TP Buôn Ma Thuột", "spa", "Spa & Thẩm mỹ viện", "Đắk Lắk"),
    ("Spa TP Cà Mau", "spa", "Spa & Thẩm mỹ viện", "Cà Mau"),
    
    # 3. Nha khoa & Răng hàm mặt
    ("Nha khoa Hoàn Kiếm Hà Nội", "dental", "Nha khoa & Răng hàm mặt", "Hà Nội"),
    ("Nha khoa Cầu Giấy Hà Nội", "dental", "Nha khoa & Răng hàm mặt", "Hà Nội"),
    ("Nha khoa Quận 1 TP.HCM", "dental", "Nha khoa & Răng hàm mặt", "TP.HCM"),
    ("Nha khoa Quận 10 TP.HCM", "dental", "Nha khoa & Răng hàm mặt", "TP.HCM"),
    ("Nha khoa Hải Châu Đà Nẵng", "dental", "Nha khoa & Răng hàm mặt", "Đà Nẵng"),
    ("Nha khoa TP Huế", "dental", "Nha khoa & Răng hàm mặt", "Huế"),
    ("Nha khoa TP Hải Phòng", "dental", "Nha khoa & Răng hàm mặt", "Hải Phòng"),
    ("Nha khoa TP Hạ Long", "dental", "Nha khoa & Răng hàm mặt", "Quảng Ninh"),
    ("Nha khoa TP Cần Thơ", "dental", "Nha khoa & Răng hàm mặt", "Cần Thơ"),
    ("Nha khoa TP Biên Hòa", "dental", "Nha khoa & Răng hàm mặt", "Đồng Nai"),
    ("Nha khoa TP Nha Trang", "dental", "Nha khoa & Răng hàm mặt", "Khánh Hòa"),
    ("Nha khoa TP Vũng Tàu", "dental", "Nha khoa & Răng hàm mặt", "Bà Rịa - Vũng Tàu"),
    ("Nha khoa TP Buôn Ma Thuột", "dental", "Nha khoa & Răng hàm mặt", "Đắk Lắk"),

    # 4. Sân Thể thao (Pickleball, Cầu lông, Tennis)
    ("Sân Pickleball Cầu Giấy Hà Nội", "sports", "Sân Thể thao & Pickleball", "Hà Nội"),
    ("Sân Pickleball Quận 7 TP.HCM", "sports", "Sân Thể thao & Pickleball", "TP.HCM"),
    ("Sân Pickleball Bình Thạnh TP.HCM", "sports", "Sân Thể thao & Pickleball", "TP.HCM"),
    ("Sân Pickleball Đà Nẵng", "sports", "Sân Thể thao & Pickleball", "Đà Nẵng"),
    ("Sân Pickleball Hải Phòng", "sports", "Sân Thể thao & Pickleball", "Hải Phòng"),
    ("Sân Pickleball Cần Thơ", "sports", "Sân Thể thao & Pickleball", "Cần Thơ"),
    ("Sân Pickleball Nha Trang", "sports", "Sân Thể thao & Pickleball", "Khánh Hòa"),

    # 5. Phòng khám đa khoa & chuyên khoa
    ("Phòng khám Cầu Giấy Hà Nội", "clinic", "Phòng khám & Y tế", "Hà Nội"),
    ("Phòng khám Quận 1 TP.HCM", "clinic", "Phòng khám & Y tế", "TP.HCM"),
    ("Phòng khám đa khoa Hải Phòng", "clinic", "Phòng khám & Y tế", "Hải Phòng"),
    ("Phòng khám TP Đà Nẵng", "clinic", "Phòng khám & Y tế", "Đà Nẵng"),
    ("Phòng khám TP Huế", "clinic", "Phòng khám & Y tế", "Huế"),
    ("Phòng khám TP Cần Thơ", "clinic", "Phòng khám & Y tế", "Cần Thơ"),
    ("Phòng khám TP Vũng Tàu", "clinic", "Phòng khám & Y tế", "Bà Rịa - Vũng Tàu"),
]

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://postgres.ugsirgcornvyoamvzuyy:VqHunter2026%21DbSecret@aws-1-ap-south-1.pooler.supabase.com:6543/postgres"
)

async def crawl_query(page, context, query, category, cat_label, city, max_results=20):
    print(f"\n>>> [CRON] Bắt đầu cào mục tiêu: '{query}' (tối đa {max_results} tiệm)...")
    url = f"https://www.google.com/maps/search/{query.replace(' ', '+')}?hl=vi"
    
    try:
        await page.goto(url, wait_until="domcontentloaded", timeout=45000)
        await page.wait_for_timeout(2500)
    except Exception as e:
        print(f"Lỗi truy cập Google Maps: {e}")
        return []

    feed = page.locator('div[role="feed"]')
    if await feed.count() > 0:
        box = await feed.bounding_box()
        if box:
            await page.mouse.move(box["x"] + box["width"] / 2, box["y"] + box["height"] / 2)
        scroll_times = max(3, (max_results // 4) + 1)
        for _ in range(scroll_times):
            await page.mouse.wheel(0, 3500)
            await page.wait_for_timeout(600)

    links = await page.locator('a[href*="/maps/place/"]').all()
    candidates = []
    visited = set()

    for link in links:
        raw_name = await link.get_attribute("aria-label")
        href = await link.get_attribute("href")
        if not raw_name or not href or raw_name in visited:
            continue
        visited.add(raw_name)

        parent = link.locator('xpath=ancestor::div[contains(@class, "Nv2PK")]')
        card_rating = 4.8
        if await parent.count() > 0:
            card_text = await parent.first.inner_text()
            m = re.search(r'\b([345][.,]\d)\b', card_text)
            if m:
                card_rating = float(m.group(1).replace(',', '.'))

        candidates.append({"name": raw_name, "href": href, "rating": card_rating})
        if len(candidates) >= max_results:
            break

    detail_page = await context.new_page()
    leads = []
    for c in candidates:
        try:
            item_url = c["href"]
            if "hl=" not in item_url:
                item_url += "&hl=vi" if "?" in item_url else "?hl=vi"
            await detail_page.goto(item_url, wait_until="domcontentloaded", timeout=15000)
            try:
                await detail_page.wait_for_selector('button[data-item-id*="address"], button[data-item-id*="phone"]', timeout=3000)
            except:
                pass
            await detail_page.wait_for_timeout(350)

            phone = ""
            phone_btn = detail_page.locator('button[data-item-id*="phone:tel:"]')
            if await phone_btn.count() > 0:
                phone = (await phone_btn.first.get_attribute("data-item-id") or "").replace("phone:tel:", "").strip()
            if not phone:
                body_text = await detail_page.inner_text("body")
                phone_match = re.search(r'(?:\+84|0)[1-9]\d{8,9}\b', body_text)
                if phone_match:
                    phone = phone_match.group(0)

            address = ""
            addr_btn = detail_page.locator('button[data-item-id*="address"]')
            if await addr_btn.count() > 0:
                address = (await addr_btn.first.get_attribute("aria-label") or "").replace("Địa chỉ: ", "").strip()
            if not address:
                address = f"{query}, Việt Nam"

            website = None
            web_btn = detail_page.locator('a[data-item-id="authority"]')
            if await web_btn.count() > 0:
                website = await web_btn.first.get_attribute("href")

            clean_name = re.sub(r'[^a-zA-Z0-9\s-]', '', c["name"]).strip()
            slug = re.sub(r'\s+', '-', clean_name.lower()) or f"tiem-{int(time.time())}"
            leads.append({
                "name": c["name"],
                "phone": phone or "Chưa có SĐT",
                "location": address,
                "rating": c["rating"],
                "website": website,
                "slug": slug,
                "url": c["href"]
            })
        except:
            continue

    await detail_page.close()
    return leads

async def main():
    print("==================================================================")
    print("      VIETQR LEAD HUNTER - CỖ MÁY CÀO TỰ ĐỘNG CLOUD 24/7         ")
    print(f"      Thời gian chạy: {time.strftime('%Y-%m-%d %H:%M:%S')}      ")
    print(f"      Tổng số mục tiêu hôm nay: {len(CRAWL_TARGETS)} khu vực     ")
    print("==================================================================")

    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()

    total_synced = 0
    t_start = time.time()

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            viewport={"width": 1280, "height": 900}
        )
        page = await context.new_page()

        for query, category, cat_label, city in CRAWL_TARGETS:
            try:
                leads = await crawl_query(page, context, query, category, cat_label, city, max_results=15)
                if not leads:
                    continue

                for l in leads:
                    clean_phone = re.sub(r'[^0-9+]', '', l["phone"])
                    is_mobile = bool(re.match(r'^(0|\+84)(9|8|7|3|5)[0-9]{8}$', clean_phone))
                    cur.execute("""
                        INSERT INTO leads (
                            place_id, name, category, category_label, phone, phone_standard,
                            phone_type, address, city, google_rating, reviews_count,
                            google_maps_url, website, has_website, raw_data, updated_at
                        ) VALUES (
                            %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, NOW()
                        )
                        ON CONFLICT (place_id) DO UPDATE SET
                            phone = EXCLUDED.phone,
                            phone_type = EXCLUDED.phone_type,
                            address = EXCLUDED.address,
                            google_rating = EXCLUDED.google_rating,
                            updated_at = NOW();
                    """, (
                        l["slug"], l["name"], category, cat_label, l["phone"], clean_phone,
                        'mobile' if is_mobile else 'landline' if clean_phone else 'none',
                        l["location"], city, str(l["rating"]), 30, l["url"], l["website"],
                        bool(l["website"]), Json(l)
                    ))
                conn.commit()
                total_synced += len(leads)
                print(f"[OK] Đã lưu/cập nhật {len(leads)} cơ sở cho '{query}'.")
            except Exception as e:
                print(f"[Cảnh báo] Lỗi xử lý '{query}': {e}")
                continue

        await browser.close()

    cur.close()
    conn.close()
    duration = round(time.time() - t_start, 1)
    print("==================================================================")
    print(f"   HOÀN TẤT PHIÊN CÀO: Đã đồng bộ {total_synced} cơ sở thật vào Supabase!")
    print(f"   Thời gian thực hiện: {duration} giây.")
    print("==================================================================")

if __name__ == "__main__":
    asyncio.run(main())
