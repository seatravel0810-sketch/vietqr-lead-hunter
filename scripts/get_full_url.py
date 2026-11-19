import asyncio
from playwright.async_api import async_playwright

async def find_full_urls():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        search_responses = []
        page.on("response", lambda res: search_responses.append((res.url, res)) if "tbm=map" in res.url or "batchexecute" in res.url else None)

        url = "https://www.google.com/maps/search/Spa+Y%C3%AAn+B%C3%A1i?hl=vi"
        await page.goto(url, wait_until="domcontentloaded", timeout=30000)
        await page.wait_for_timeout(3000)

        for u, res in search_responses:
            print("FULL SEARCH URL:")
            print(u)
            text = await res.text()
            print("Response length:", len(text))
            if "Yên Bái" in text:
                print(">>> CONTAINS 'Yên Bái'!")
                # Search for names of spas in Yen Bai
                with open("scripts/yenbai_response.txt", "w", encoding="utf-8") as f:
                    f.write(text)

        await browser.close()

asyncio.run(find_full_urls())
