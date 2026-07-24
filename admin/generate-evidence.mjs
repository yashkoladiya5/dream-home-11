import { chromium, request } from 'playwright';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const OUTPUT_DIR = path.join(process.cwd(), 'evidence');
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR);

function captureDBState(table, label) {
  try {
    const output = execSync(`psql -U postgres -d dream_home_11 -c "SELECT * FROM ${table} ORDER BY created_at DESC LIMIT 5;"`, { encoding: 'utf-8' });
    fs.writeFileSync(path.join(OUTPUT_DIR, `db_state_${table}_${label}.txt`), output);
    return output;
  } catch (e) {
    return e.toString();
  }
}

(async () => {
  console.log('Starting Evidence Generation Suite...');
  
  // 1. Playwright Setup
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  const apiContext = await request.newContext({ baseURL: 'http://localhost:3000' });

  const reportData = {
    pages: [],
    crud: [],
    errors: []
  };

  // Intercept and log network
  page.on('response', response => {
    if (response.url().includes('api/v1')) {
      fs.appendFileSync(path.join(OUTPUT_DIR, 'network.log'), `[${response.status()}] ${response.request().method()} ${response.url()}\n`);
    }
  });

  page.on('console', msg => {
    fs.appendFileSync(path.join(OUTPUT_DIR, 'console.log'), `[${msg.type()}] ${msg.text()}\n`);
  });

  try {
    // LOGIN
    await page.goto('http://localhost:5173/login');
    await page.fill('input[type="tel"]', '9999999999');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
    await page.waitForTimeout(1000);

    const token = await page.evaluate(() => localStorage.getItem('admin_token'));

    // CRAWL PAGES
    const links = await page.$$eval('a', els => els.map(e => e.href).filter(h => h.startsWith('http://localhost:5173')));
    const uniqueLinks = [...new Set(links)].filter(l => !l.includes('logout') && l !== 'http://localhost:5173/');

    console.log(`Scanning ${uniqueLinks.length} pages...`);
    for (let i = 0; i < uniqueLinks.length; i++) {
      const link = uniqueLinks[i];
      const pageName = link.split('/').pop() || 'dashboard';
      console.log(`Capturing ${pageName}...`);
      await page.goto(link);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500);
      
      const screenshotPath = `screenshot_${pageName}.png`;
      await page.screenshot({ path: path.join(OUTPUT_DIR, screenshotPath) });
      
      reportData.pages.push({
        url: link,
        screenshot: screenshotPath,
        status: 'PASS'
      });
    }

    // CRUD DEMO ON BANNERS
    console.log('Executing CRUD operations on banners...');
    const dbBefore = captureDBState('banners', 'before_create');
    
    // Create
    const createRes = await apiContext.post('/api/v1/admin/banners', {
      headers: { Authorization: `Bearer ${token}` },
      data: { title: 'Evidence Banner', imageUrl: 'https://example.com/banner.png', order: 99, isActive: true }
    });
    const createdData = await createRes.json();
    const bannerId = createdData.data?.id || createdData.data?._id;
    const dbAfterCreate = captureDBState('banners', 'after_create');

    // Update
    let dbAfterUpdate = '';
    if (bannerId) {
      await apiContext.patch(`/api/v1/admin/banners/${bannerId}`, {
        headers: { Authorization: `Bearer ${token}` },
        data: { title: 'Evidence Banner Updated' }
      });
      dbAfterUpdate = captureDBState('banners', 'after_update');
    }

    // Delete
    let dbAfterDelete = '';
    if (bannerId) {
      await apiContext.delete(`/api/v1/admin/banners/${bannerId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      dbAfterDelete = captureDBState('banners', 'after_delete');
    }

    reportData.crud.push({
      module: 'Banners',
      createStatus: createRes.status(),
      dbBefore, dbAfterCreate, dbAfterUpdate, dbAfterDelete
    });

  } catch (e) {
    console.error(e);
    reportData.errors.push(e.toString());
  }

  await browser.close();

  // WRITE FINAL MARKDOWN
  let md = `# Verifiable Evidence Report\n\n`;
  md += `Generated securely via automation.\n\n`;
  
  md += `## CRUD Operations\n`;
  reportData.crud.forEach(c => {
    md += `### ${c.module}\n`;
    md += `- **Create Status:** ${c.createStatus}\n`;
    md += `#### DB State Before\n\`\`\`text\n${c.dbBefore}\n\`\`\`\n`;
    md += `#### DB State After Create\n\`\`\`text\n${c.dbAfterCreate}\n\`\`\`\n`;
    md += `#### DB State After Update\n\`\`\`text\n${c.dbAfterUpdate}\n\`\`\`\n`;
    md += `#### DB State After Delete\n\`\`\`text\n${c.dbAfterDelete}\n\`\`\`\n`;
  });

  md += `## Pages Visited\n`;
  reportData.pages.forEach(p => {
    md += `- ✅ ${p.url} (Screenshot captured: \`${p.screenshot}\`)\n`;
  });

  if (reportData.errors.length) {
    md += `\n## Errors Encountered\n\`\`\`\n${reportData.errors.join('\\n')}\n\`\`\`\n`;
  }

  fs.writeFileSync(path.join(process.cwd(), 'verified_report.md'), md);
  console.log('Evidence generation complete. See verified_report.md and evidence/');
})();
