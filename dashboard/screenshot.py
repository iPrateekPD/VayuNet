import asyncio
from playwright.async_api import async_playwright

async def capture():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page(viewport={"width": 1400, "height": 900})
        
        print("Navigating to Nowcast...")
        await page.goto("http://localhost:5174/#/operations/nowcast")
        await page.wait_for_timeout(2000)
        await page.screenshot(path="/Users/prateekpd/.gemini/antigravity-ide/brain/367900e8-bf0e-4760-bc51-c0bcef0f68b2/final_nowcast.png")
        
        print("Navigating to Analysis...")
        await page.goto("http://localhost:5174/#/operations/analysis")
        await page.wait_for_timeout(2000)
        await page.screenshot(path="/Users/prateekpd/.gemini/antigravity-ide/brain/367900e8-bf0e-4760-bc51-c0bcef0f68b2/final_analysis.png")
        
        print("Navigating to Events...")
        await page.goto("http://localhost:5174/#/operations/events")
        await page.wait_for_timeout(2000)
        await page.screenshot(path="/Users/prateekpd/.gemini/antigravity-ide/brain/367900e8-bf0e-4760-bc51-c0bcef0f68b2/final_events.png")
        
        print("Navigating to Alerts...")
        await page.goto("http://localhost:5174/#/operations/alerts")
        await page.wait_for_timeout(2000)
        await page.screenshot(path="/Users/prateekpd/.gemini/antigravity-ide/brain/367900e8-bf0e-4760-bc51-c0bcef0f68b2/final_alerts.png")
        
        await browser.close()

asyncio.run(capture())
