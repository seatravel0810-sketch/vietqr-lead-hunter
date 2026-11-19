import asyncio
from playwright.async_api import async_playwright

async def log_network():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        endpoints = []
        page.on("request", lambda req: endpoints.append((req.method, req.url)) if "google.com/maps" in req.url else None)
        page.on("response", lambda res: print("RESPONSE:", res.status, res.url[:120]) if "search" in res.url or "preview" in res.url or "listentities" in res.url else None)

        url = "https://www.google.com/maps/search/Spa+Y%C3%AAn+B%C3%A1i?hl=vi"
        await page.goto(url, wait_until="domcontentloaded", timeout=30000)
        await page.wait_for_timeout(4000)

        print("\nAll Maps network requests:")
        for method, u in endpoints:
            if any(k in u for k in ["search", "rpc", "preview", "pb=", "query"]):
                print(f"{method} {u[:150]}")

        await browser.close()

asyncio.run(log_network())
