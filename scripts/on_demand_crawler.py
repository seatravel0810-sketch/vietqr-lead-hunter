import asyncio
import os
import sys
import json
import re
import time
import argparse
from playwright.async_api import async_playwright
import psycopg2

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://postgres.ugsirgcornvyoamvzuyy:VqHunter2026%21DbSecret@aws-1-ap-south-1.pooler.supabase.com:6543/postgres"
)

CATEGORY_MAP = [
    (["spa", "thẩm mỹ", "massage", "dưỡng sinh", "chăm sóc da"], "spa", "Spa & Thẩm mỹ viện"),
    (["nha khoa", "răng", "dental"], "dental", "Nha khoa & Răng hàm mặt"),
    (["cắt tóc", "hớt tóc", "tiệm tóc", "salon", "barber", "tóc", "hair", "nail", "móng"], "salon", "Hair Salon & Cắt tóc"),
    (["pickleball", "sân", "cầu lông", "tennis", "bóng đá"], "sports", "Sân Thể thao & Pickleball"),
    (["phòng khám", "bác sĩ", "bệnh viện", "clinic", "y tế"], "clinic", "Phòng khám & Y tế"),
    (["nhà hàng", "quán ăn", "cafe", "cà phê", "trà sữa"], "restaurant", "Nhà hàng & F&B"),
    (["khách sạn", "hotel", "homestay", "nhà nghỉ"], "hotel", "Khách sạn & Lưu trú"),
]

def detect_category(query: str):
    q = query.lower()
    for keys, cat_slug, cat_label in CATEGORY_MAP:
        if any(k in q for k in keys):
            return cat_slug, cat_label
    return "other", "Dịch vụ địa phương"

def extract_city(query: str):
    q = query.lower()
    cat_words = ["spa", "thẩm mỹ viện", "nha khoa", "cắt tóc", "hớt tóc", "tiệm tóc", "salon", "phòng khám", "sân pickleball", "quán"]
    loc = q
    for cw in cat_words:
        loc = loc.replace(cw, " ")
    loc = loc.strip()
    return loc.title() if loc else "Việt Nam"

async def crawl_on_demand(query: str, max_results: int = 20):
    print(f"\n=======================================================")
    print(f"🚀 [ON-DEMAND CRAWLER] Bắt đầu cào trực tiếp cho: '{query}'")
    print(f"Số lượng tối đa: {max_results}")
    print(f"=======================================================\n")

    category, cat_label = detect_category(query)
    fallback_city = extract_city(query)

    async with async_playwright() as p:
        browser = await p.chromium.launch(
            headless=True,
            args=["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage", "--disable-gpu"]
        )
        context = await browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
            locale="vi-VN",
            viewport={"width": 1280, "height": 800}
        )
        page = await context.new_page()

        search_url = f"https://www.google.com/maps/search/{query.replace(' ', '+')}?hl=vi"
        print(f"Truy cập Google Maps: {search_url}")

        try:
            await page.goto(search_url, wait_until="domcontentloaded", timeout=45000)
            await page.wait_for_timeout(3000)
        except Exception as e:
            print(f"Lỗi truy cập trang: {e}")
            await browser.close()
            return []

        # Cuộn thanh danh sách
        feed = page.locator('div[role="feed"]')
        if await feed.count() > 0:
            box = await feed.bounding_box()
            if box:
                await page.mouse.move(box["x"] + box["width"] / 2, box["y"] + box["height"] / 2)
            scroll_count = max(4, (max_results // 4) + 1)
            for _ in range(scroll_count):
                await page.mouse.wheel(0, 3500)
                await page.wait_for_timeout(700)

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

        print(f"Đã tìm thấy {len(candidates)} địa điểm khả dụng trên bản đồ. Đang bóc tách chi tiết...")

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
                await detail_page.wait_for_timeout(300)

                # Số điện thoại
                phone = ""
                phone_btn = detail_page.locator('button[data-item-id*="phone:tel:"]')
                if await phone_btn.count() > 0:
                    phone = (await phone_btn.first.get_attribute("data-item-id") or "").replace("phone:tel:", "").strip()
                if not phone:
                    body_text = await detail_page.inner_text("body")
                    phone_match = re.search(r'(?:\+84|0)[1-9]\d{8,9}\b', body_text)
                    if phone_match:
                        phone = phone_match.group(0)

                # Địa chỉ
                address = ""
                addr_btn = detail_page.locator('button[data-item-id*="address"]')
                if await addr_btn.count() > 0:
                    address = (await addr_btn.first.get_attribute("aria-label") or "").replace("Địa chỉ: ", "").strip()
                if not address:
                    address = f"{query}, Việt Nam"

                # Website
                website = None
                web_btn = detail_page.locator('a[data-item-id="authority"]')
                if await web_btn.count() > 0:
                    website = await web_btn.first.get_attribute("href")

                # Tách thành phố / tỉnh từ địa chỉ
                city = fallback_city
                addr_parts = [p.strip() for p in address.split(",") if p.strip()]
                if len(addr_parts) >= 2:
                    city = addr_parts[-2] if "Việt Nam" in addr_parts[-1] else addr_parts[-1]

                clean_name = re.sub(r'[^a-zA-Z0-9\s-]', '', c["name"]).strip()
                slug = re.sub(r'\s+', '-', clean_name.lower()) or f"place-{abs(hash(c['name'])) % 1000000}"

                leads.append({
                    "name": c["name"],
                    "phone": phone or "Chưa có SĐT",
                    "location": address,
                    "city": city,
                    "rating": c["rating"],
                    "website": website,
                    "slug": slug,
                    "url": c["href"]
                })
                print(f"  + [OK] {c['name']} | SĐT: {phone or 'None'} | Địa chỉ: {address}")
            except Exception as e:
                print(f"  - Lỗi bóc tách {c['name']}: {e}")

        await detail_page.close()
        await browser.close()

    # Nạp vào Supabase
    if leads:
        print(f"\n>>> Đồng bộ {len(leads)} cơ sở vào Supabase PostgreSQL...")
        try:
            conn = psycopg2.connect(DATABASE_URL)
            conn.autocommit = True
            cur = conn.cursor()

            inserted = 0
            for item in leads:
                clean_phone = re.sub(r'[^0-9+]', '', item["phone"])
                is_mobile = bool(re.match(r'^(0|\+84)(9|8|7|3|5)[0-9]{8}$', clean_phone))
                phone_type = "mobile" if is_mobile else "landline" if clean_phone else "none"

                cur.execute("""
                    INSERT INTO leads (
                        place_id, name, category, category_label, phone, phone_standard,
                        phone_type, address, city, google_rating, reviews_count,
                        google_maps_url, website, has_website, updated_at
                    ) VALUES (
                        %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, NOW()
                    )
                    ON CONFLICT (place_id) DO UPDATE SET
                        phone = EXCLUDED.phone,
                        phone_standard = EXCLUDED.phone_standard,
                        phone_type = EXCLUDED.phone_type,
                        address = EXCLUDED.address,
                        city = EXCLUDED.city,
                        google_rating = EXCLUDED.google_rating,
                        updated_at = NOW();
                """, (
                    item["slug"], item["name"], category, cat_label, item["phone"],
                    clean_phone if clean_phone else None, phone_type, item["location"],
                    item["city"], str(item["rating"]), 30, item["url"],
                    item["website"], bool(item["website"])
                ))
                inserted += 1

            cur.close()
            conn.close()
            print(f"🎉 Hoàn tất! Đã lưu thành công {inserted} cơ sở vào Supabase.")
        except Exception as db_err:
            print(f"Lỗi kết nối Supabase: {db_err}")

    return leads

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="VietQR On-Demand Google Maps Scraper")
    parser.add_argument("--query", type=str, required=True, help="Từ khóa tìm kiếm (VD: 'spa Sapa', 'cắt tóc Mường Khương')")
    parser.add_argument("--limit", type=int, default=20, help="Số lượng kết quả tối đa")
    args = parser.parse_args()

    asyncio.run(crawl_on_demand(args.query, args.limit))
