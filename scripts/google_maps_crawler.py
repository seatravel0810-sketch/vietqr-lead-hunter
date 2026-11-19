import asyncio
import argparse
import json
import re
import os
import sys
import time
from playwright.async_api import async_playwright

def infer_category(name: str) -> str:
  lower = name.lower()
  if any(k in lower for k in ['spa', 'thẩm mỹ', 'beauty', 'massage', 'dưỡng sinh']):
    return 'spa'
  if any(k in lower for k in ['nha khoa', 'răng', 'dental', 'nụ cười']):
    return 'dental'
  if any(k in lower for k in ['salon', 'tóc', 'hair', 'barber', 'nail']):
    return 'salon'
  if any(k in lower for k in ['sân', 'pickleball', 'tennis', 'cầu lông', 'bóng đá']):
    return 'sports'
  if any(k in lower for k in ['phòng khám', 'bác sĩ', 'clinic', 'y tế']):
    return 'clinic'
  return 'other'

def generate_slug(name: str) -> str:
  slug = name.lower()
  replacements = {
      'à': 'a', 'á': 'a', 'ả': 'a', 'ã': 'a', 'ạ': 'a',
      'ă': 'a', 'ằ': 'a', 'ắ': 'a', 'ẳ': 'a', 'ẵ': 'a', 'ặ': 'a',
      'â': 'a', 'ầ': 'a', 'ấ': 'a', 'ẩ': 'a', 'ẫ': 'a', 'ậ': 'a',
      'è': 'e', 'é': 'e', 'ẻ': 'e', 'ẽ': 'e', 'ẹ': 'e',
      'ê': 'e', 'ề': 'e', 'ế': 'e', 'ể': 'e', 'ễ': 'e', 'ệ': 'e',
      'ì': 'i', 'í': 'i', 'ỉ': 'i', 'ĩ': 'i', 'ị': 'i',
      'ò': 'o', 'ó': 'o', 'ỏ': 'o', 'õ': 'o', 'ọ': 'o',
      'ô': 'o', 'ồ': 'o', 'ố': 'o', 'ổ': 'o', 'ỗ': 'o', 'ộ': 'o',
      'ơ': 'o', 'ờ': 'o', 'ớ': 'o', 'ở': 'o', 'ỡ': 'o', 'ợ': 'o',
      'ù': 'u', 'ú': 'u', 'ủ': 'u', 'ũ': 'u', 'ụ': 'u',
      'ư': 'u', 'ừ': 'u', 'ứ': 'u', 'ử': 'u', 'ữ': 'u', 'ự': 'u',
      'ỳ': 'y', 'ý': 'y', 'ỷ': 'y', 'ỹ': 'y', 'ỵ': 'y',
      'đ': 'd'
  }
  for k, v in replacements.items():
    slug = slug.replace(k, v)
  slug = re.sub(r'[^a-z0-9\s-]', '', slug)
  slug = re.sub(r'\s+', '-', slug.strip())
  return slug or 'tiem-dich-vu'

async def crawl_google_maps(query: str, max_results: int = 20):
  print(f"[1/4] Đang khởi động trình duyệt Chromium tự động...")
  t0 = time.time()
  leads = []
  
  async with async_playwright() as p:
    browser = await p.chromium.launch(headless=True)
    context = await browser.new_context(
        user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        viewport={"width": 1280, "height": 900}
    )
    page = await context.new_page()
    
    url = f"https://www.google.com/maps/search/{query.replace(' ', '+')}?hl=vi"
    print(f"[2/4] Đang truy cập Google Maps: {url}")
    try:
      await page.goto(url, wait_until="domcontentloaded", timeout=30000)
      await page.wait_for_timeout(2000)
    except Exception as e:
      print(f"Lỗi truy cập trang: {e}")
      await browser.close()
      return []

    # Dynamic scroll: scroll feed to discover all relevant places
    feed = page.locator('div[role="feed"]')
    if await feed.count() > 0:
      box = await feed.bounding_box()
      if box:
        await page.mouse.move(box["x"] + box["width"] / 2, box["y"] + box["height"] / 2)
      
      scroll_times = max(3, (max_results // 5) + 1)
      print(f"[2.5/4] Đang cuộn feed {scroll_times} lần để tải tất cả các cơ sở liên quan...")
      for _ in range(scroll_times):
        await page.mouse.wheel(0, 3500)
        await page.wait_for_timeout(600)

    # Collect candidate links & basic info from feed cards
    place_links = await page.locator('a[href*="/maps/place/"]').all()
    print(f"[3/4] Tìm thấy {len(place_links)} cơ sở trên bản đồ. Bắt đầu thu thập danh sách...")

    candidates = []
    visited = set()

    for link in place_links:
      try:
        raw_name = await link.get_attribute("aria-label")
        href = await link.get_attribute("href")
        if not raw_name or not href or raw_name in visited:
          continue
        visited.add(raw_name)

        parent = link.locator('xpath=ancestor::div[contains(@class, "Nv2PK")]')
        card_text = ""
        card_rating = None
        if await parent.count() > 0:
          card_text = await parent.first.inner_text()
          m = re.search(r'\b([345][.,]\d)\b', card_text)
          if m:
            card_rating = float(m.group(1).replace(',', '.'))

        candidates.append({
            "name": raw_name,
            "href": href,
            "card_text": card_text,
            "rating": card_rating or 4.9
        })

        if len(candidates) >= max_results:
          break
      except:
        continue

    await page.close()
    print(f"[4/4] Bắt đầu bóc tách số điện thoại & địa chỉ chi tiết cho {len(candidates)} tiệm...")

    # Open dedicated detail page to extract exact phone and address
    detail_page = await context.new_page()

    for idx, item in enumerate(candidates):
      try:
        item_url = item["href"]
        if "hl=" not in item_url:
          item_url += "&hl=vi" if "?" in item_url else "?hl=vi"

        await detail_page.goto(item_url, wait_until="domcontentloaded", timeout=15000)

        # Wait for detail buttons to be ready
        try:
          await detail_page.wait_for_selector('button[data-item-id*="address"], button[data-item-id*="phone"]', timeout=5000)
        except:
          pass
        await detail_page.wait_for_timeout(800)

        # 1. Phone extraction
        phone = ""
        phone_btn = detail_page.locator('button[data-item-id*="phone"], a[data-item-id*="phone"]')
        if await phone_btn.count() > 0:
          raw_phone = await phone_btn.first.inner_text()
          phone = re.sub(r'[^0-9+]', '', raw_phone)
        
        if not phone:
          # Search tel: links
          tel_links = await detail_page.locator('a[href^="tel:"]').all()
          if len(tel_links) > 0:
            tel_href = await tel_links[0].get_attribute('href') or ""
            phone = re.sub(r'[^0-9+]', '', tel_href)

        if not phone:
          # Regex search in main pane
          main_pane = detail_page.locator('div[role="main"]').first
          if await main_pane.count() > 0:
            pane_text = await main_pane.inner_text()
            match = re.search(r'(0\d{9,10}|\+84\d{9,10}|02\d{8,9})', pane_text)
            if match:
              phone = re.sub(r'[^0-9+]', '', match.group(1))

        # 2. Address extraction
        address = "Chưa cập nhật địa chỉ"
        addr_btn = detail_page.locator('button[data-item-id="address"], button[data-item-id*="address"]')
        if await addr_btn.count() > 0:
          raw_addr = await addr_btn.first.inner_text()
          address = raw_addr.replace('', '').strip()
        elif item["card_text"]:
          # Fallback address from card text lines
          lines = [l.strip() for l in item["card_text"].split('\n') if l.strip()]
          for l in lines:
            if any(k in l.lower() for k in ['đường', 'phố', 'phường', 'quận', 'ngõ', 'ngách', 'số ', 'hải châu', 'ngũ hành sơn', 'sơn trà', 'thanh khê', 'cẩm lệ', 'liên chiểu', 'đống đa', 'cầu giấy', 'ba đình', 'quận 1', 'quận 3']):
              address = l.replace('·', '').strip()
              break

        category = infer_category(item["name"])
        slug = generate_slug(item["name"])

        lead = {
            "name": item["name"],
            "category": category,
            "phone": phone or "Chưa có SĐT",
            "location": address,
            "managerName": "Chủ tiệm",
            "status": "new",
            "demoSlug": slug,
            "googleMapsUrl": item["href"],
            "rating": item["rating"],
            "notes": f"Tự động cào từ Google Maps ({query})"
        }

        leads.append(lead)
        print(f"   [{idx+1}/{len(candidates)}] {lead['name'][:25]} | SĐT: {lead['phone']} | ĐC: {address[:35]}...")

      except Exception as err:
        print(f"   [{idx+1}/{len(candidates)}] Bỏ qua lỗi {item['name']}: {err}")
        continue

    await detail_page.close()
    await browser.close()
    
    # Sort leads so that those with valid phone numbers appear first!
    leads.sort(key=lambda x: (x["phone"] != "Chưa có SĐT" and len(x["phone"]) >= 9), reverse=True)
    print(f"\n[HOÀN TẤT] Đã cào và bóc tách thành công {len(leads)} tiệm trong {time.time() - t0:.1f}s.")
    return leads

def main():
  parser = argparse.ArgumentParser(description="Cào dữ liệu khách hàng từ Google Maps tự động")
  parser.add_argument("--query", type=str, default="Spa Cầu Giấy Hà Nội", help="Từ khóa tìm kiếm")
  parser.add_argument("--limit", type=int, default=20, help="Số lượng cơ sở cần lấy")
  parser.add_argument("--output", type=str, default="leads_scraped.json", help="Tên file JSON xuất ra")
  args = parser.parse_args()

  results = asyncio.run(crawl_google_maps(args.query, args.limit))
  
  with open(args.output, "w", encoding="utf-8") as f:
    json.dump(results, f, ensure_ascii=False, indent=2)
  print(f"File kết quả đã được lưu tại: {os.path.abspath(args.output)}")

if __name__ == "__main__":
  main()
