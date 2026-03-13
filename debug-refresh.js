const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage();

    page.on('console', msg => console.log(`BROWSER CONSOLE: ${msg.type()}: ${msg.text()}`));
    page.on('pageerror', error => console.error(`BROWSER ERROR: ${error.message}`));

    console.log("Navigating to http://localhost:3000...");
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });

    console.log("Waiting 3 seconds...");
    await page.waitForTimeout(3000);

    console.log("Done.");
    await browser.close();
})();
