import { chromium } from 'playwright';
import fs from 'fs';

(async () => {
  console.log('Starting End-to-End QA Test...');
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  const report = {
    successfulPages: [],
    failedPages: [],
    consoleErrors: [],
    networkErrors: []
  };

  page.on('console', msg => {
    if (msg.type() === 'error') {
      report.consoleErrors.push({ url: page.url(), message: msg.text() });
    }
  });

  page.on('response', response => {
    if (!response.ok() && response.url().includes('api/v1')) {
      report.networkErrors.push({ url: response.url(), status: response.status() });
    }
  });

  try {
    await page.goto('http://localhost:5173/');
    await page.waitForLoadState('networkidle');

    await page.fill('input[type="text"], input[type="tel"]', '9999999999');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    const links = await page.$$eval('a', els => els.map(e => e.href).filter(h => h.startsWith('http://localhost:5173')));
    const uniqueLinks = [...new Set(links)];
    
    console.log(`Found ${uniqueLinks.length} unique routes to test.`);

    for (const link of uniqueLinks) {
      if (link === 'http://localhost:5173/' || link.includes('logout')) continue;
      console.log(`Testing ${link}...`);
      try {
        await page.goto(link);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000);

        // Check for error boundary or explicit error text
        const content = await page.evaluate(() => document.body.innerText.toLowerCase());
        if (content.includes('something went wrong') || content.includes('internal server error')) {
            report.failedPages.push({ url: link, reason: 'Error Boundary or Server Error detected on page' });
        } else {
            report.successfulPages.push(link);
        }
      } catch (err) {
        report.failedPages.push({ url: link, reason: err.message });
      }
    }
  } catch (err) {
    console.error('Fatal test error:', err);
  }

  await browser.close();
  
  fs.writeFileSync('qa-report.json', JSON.stringify(report, null, 2));
  console.log('QA Test complete. Report saved to qa-report.json');
})();
