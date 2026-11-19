import asyncio
from playwright.async_api import async_playwright

async def find_undefined():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        await page.goto("https://vietqr-lead-hunter.vercel.app", wait_until="networkidle")

        res = await page.evaluate('''() => {
            const matches = [];
            const walk = (node) => {
                if (node.nodeType === Node.TEXT_NODE) {
                    if (node.textContent.includes('undefined')) {
                        matches.push({
                            parentTag: node.parentElement ? node.parentElement.tagName : null,
                            parentClass: node.parentElement ? node.parentElement.className : null,
                            text: node.textContent.trim()
                        });
                    }
                } else if (node.nodeType === Node.ELEMENT_NODE) {
                    node.childNodes.forEach(walk);
                }
            };
            walk(document.body);
            return matches;
        }''')

        print("Matches containing 'undefined':", len(res))
        for m in res:
            print(m)

        await browser.close()

asyncio.run(find_undefined())
