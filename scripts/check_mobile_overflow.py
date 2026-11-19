import asyncio
from playwright.async_api import async_playwright

async def check_overflow():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(viewport={"width": 375, "height": 812})
        page = await context.new_page()
        await page.goto("https://vietqr-lead-hunter.vercel.app", wait_until="networkidle")

        # Find overflowing elements
        overflowing = await page.evaluate('''() => {
            const docWidth = document.documentElement.clientWidth;
            const elements = document.querySelectorAll('*');
            const bad = [];
            elements.forEach(el => {
                const rect = el.getBoundingClientRect();
                if (rect.right > docWidth + 1) {
                    bad.push({
                        tag: el.tagName,
                        className: el.className,
                        id: el.id,
                        right: rect.right,
                        width: rect.width,
                        text: (el.innerText || '').slice(0, 30)
                    });
                }
            });
            return bad.slice(0, 10);
        }''')

        print("Overflowing elements count:", len(overflowing))
        for item in overflowing:
            print(f"- <{item['tag']} class='{item['className']}'> right={item['right']} text='{item['text']}'")

        await browser.close()

asyncio.run(check_overflow())
