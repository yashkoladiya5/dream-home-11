import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));

  console.log('Navigating to admin panel...');
  await page.goto('http://localhost:5173/');
  await page.waitForLoadState('networkidle');
  
  await page.screenshot({ path: 'login.png' });
  console.log('Saved login.png');

  // Let's print out all text on the page to see inputs
  const content = await page.evaluate(() => document.body.innerText);
  console.log('Page content:', content);

  // Look for inputs
  const inputs = await page.$$eval('input', els => els.map(e => ({ name: e.name, type: e.type, id: e.id, placeholder: e.placeholder })));
  console.log('Inputs found:', inputs);

  // Try to login if we see inputs
  if (inputs.length >= 2) {
    try {
      // Assuming first is phone, second is password
      await page.fill('input[type="text"], input[type="tel"]', '9999999999');
      await page.fill('input[type="password"]', 'password123');
      await page.click('button[type="submit"]');
      
      console.log('Clicked submit, waiting for navigation...');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000); // Wait a bit for react render
      
      await page.screenshot({ path: 'dashboard.png' });
      console.log('Saved dashboard.png');
      const content2 = await page.evaluate(() => document.body.innerText);
      console.log('Dashboard content:', content2);

      const links = await page.$$eval('a', els => els.map(e => ({ text: e.innerText, href: e.href })));
      console.log('Links found on dashboard:', links);
    } catch (e) {
      console.error('Error during login:', e);
    }
  }

  await browser.close();
})();
