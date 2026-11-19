import asyncio
import os
import sys
import json
import re
import time
from playwright.async_api import async_playwright
import psycopg2
from psycopg2.extras import Json

QUERIES = [
    ("Spa Cầu Giấy Hà Nội", "spa", "Spa / Thẩm Mỹ", "Hà Nội"),
    ("Nha khoa Quận 1 TP.HCM", "dental", "Nha Khoa", "TP.HCM"),
    ("Hair Salon Đà Nẵng", "salon", "Hair Salon", "Đà Nẵng"),
    ("Spa Vĩnh Yên", "spa", "Spa / Thẩm Mỹ", "Vĩnh Phúc"),
    ("Phòng khám Hải Phòng", "clinic", "Phòng Khám", "Hải Phòng"),
    ("Sân Pickleball Cầu Giấy", "sports", "Sân Thể Thao", "Hà Nội"),
    ("Nha khoa Cầu Giấy Hà Nội", "dental", "Nha Khoa", "Hà Nội"),
]

DATABASE_URL = "postgresql://postgres.ugsirgcornvyoamvzuyy:VqHunter2026%21DbSecret@aws-1-ap-south-1.pooler.supabase.com:6543/postgres"

async def crawl_and_insert(query, category, cat_label, city, max_items=10):
    print(f"\n=======================================================")
    print(f"[CRAWLER] Đang cào dữ liệu thật cho: '{query}' ({max_items} tiệm)...")
    leads = []
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            viewport={"width": 1280, "height": 900}
        )
        page = await context.new_page()
        url = f"https://www.google.com/maps/search/{query.replace(' ', '+')}?hl=vi"
        try:
            await page.goto(url, wait_until="domcontentloaded", timeout=30000)
            await page.wait_for_timeout(2500)
        except Exception as e:
            print(f"Lỗi: {e}")
            await browser.close()
            return []

        # Scroll feed
        feed = page.locator('div[role="feed"]')
        if await feed.count() > 0:
            box = await feed.bounding_box()
            if box:
                await page.mouse.move(box["x"] + box["width"] / 2, box["y"] + box["height"] / 2)
            for _ in range(3):
                await page.mouse.wheel(0, 3000)
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
            card_text = ""
            card_rating = 4.8
            if await parent.count() > 0:
                card_text = await parent.first.inner_text()
                m = re.search(r'\b([345][.,]\d)\b', card_text)
                if m:
                    card_rating = float(m.group(1).replace(',', '.'))

            candidates.append({"name": raw_name, "href": href, "rating": card_rating})
            if len(candidates) >= max_items:
                break

        await page.close()

        # Extract details
        detail_page = await context.new_page()
        for c in candidates:
            try:
                item_url = c["href"]
                if "hl=" not in item_url:
                    item_url += "&hl=vi" if "?" in item_url else "?hl=vi"
                await detail_page.goto(item_url, wait_until="domcontentloaded", timeout=15000)
                try:
                    await detail_page.wait_for_selector('button[data-item-id*="address"], button[data-item-id*="phone"]', timeout=3500)
                except:
                    pass
                await detail_page.wait_for_timeout(500)

                # Phone
                phone = ""
                phone_btn = detail_page.locator('button[data-item-id*="phone:tel:"]')
                if await phone_btn.count() > 0:
                    phone = (await phone_btn.first.get_attribute("data-item-id") or "").replace("phone:tel:", "").strip()
                if not phone:
                    body_text = await detail_page.inner_text("body")
                    phone_match = re.search(r'(?:\+84|0)[1-9]\d{8,9}\b', body_text)
                    if phone_match:
                        phone = phone_match.group(0)

                # Address
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

                slug = re.sub(r'[^a-z0-9-]', '', re.sub(r'\s+', '-', c["name"].lower())) or f"tiem-{int(time.time())}"
                leads.append({
                    "name": c["name"],
                    "phone": phone or "Chưa có SĐT",
                    "location": address,
                    "rating": c["rating"],
                    "website": website,
                    "slug": slug,
                    "url": c["href"]
                })
                print(f"  + {c['name']} | SĐT: {phone or 'N/A'} | ĐC: {address[:40]}...")
            except Exception as ex:
                continue

        await browser.close()

    # Save to Supabase PostgreSQL
    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()
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
    cur.close()
    conn.close()
    print(f"-> Đã lưu thành công {len(leads)} tiệm vào Supabase PostgreSQL.")

async def main():
    for q, cat, cat_lbl, city in QUERIES:
        await crawl_and_insert(q, cat, cat_lbl, city, max_items=10)

if __name__ == "__main__":
    asyncio.run(main())
