const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const SCREENSHOT_DIR = path.join(__dirname, '../docs/screenshots/hookd');

// Ensure directory exists
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

const pages = [
  { url: 'https://app.gethookd.ai/explore', name: '01-explore-ads' },
  { url: 'https://app.gethookd.ai/swipe-file', name: '02-swipe-file' },
  { url: 'https://app.gethookd.ai/brand-spy', name: '03-brand-spy' },
  { url: 'https://gethookd.ai', name: '14-marketing-home' },
  { url: 'https://gethookd.ai/pricing', name: '15-pricing' },
];

const sidebarClicks = [
  { click: 'Brands', name: '01b-explore-brands', wait: 1000 },
  { click: 'Create Ads', name: '04-create-ads-menu', wait: 1000 },
  { click: 'Video Scripts', name: '05-video-scripts', wait: 500 },
  { click: 'Brand Assets', name: '06-brand-assets', wait: 500 },
  { click: 'Image Ad Templates', name: '07-image-templates', wait: 500 },
  { click: 'Funnel Templates', name: '08-funnel-templates', wait: 500 },
  { click: 'Analyze Ads', name: '09-analyze-ads', wait: 1000 },
  { click: 'Integrations', name: '10-integrations', wait: 1000 },
  { click: 'Success Guide', name: '11-success-guide', wait: 1000 },
];

async function captureScreenshots() {
  console.log('Launching browser...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });
  
  const page = await context.newPage();

  // Load cookies if available (for authenticated session)
  const cookiesPath = path.join(__dirname, 'hookd-cookies.json');
  if (fs.existsSync(cookiesPath)) {
    const cookies = JSON.parse(fs.readFileSync(cookiesPath, 'utf8'));
    await context.addCookies(cookies);
    console.log('Loaded session cookies');
  }

  // Capture direct URL pages
  for (const p of pages) {
    try {
      console.log(`Capturing ${p.name}...`);
      await page.goto(p.url, { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForTimeout(1500);
      await page.screenshot({ 
        path: path.join(SCREENSHOT_DIR, `${p.name}.png`),
        fullPage: false 
      });
      console.log(`  ✓ Saved ${p.name}.png`);
    } catch (err) {
      console.log(`  ✗ Failed: ${err.message}`);
    }
  }

  // Navigate back to app for sidebar clicks
  try {
    await page.goto('https://app.gethookd.ai/explore', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);

    for (const item of sidebarClicks) {
      try {
        console.log(`Clicking ${item.click}...`);
        
        // Find and click the element
        const clicked = await page.evaluate((text) => {
          const elements = [...document.querySelectorAll('span, div, a, button')];
          const el = elements.find(e => e.textContent.trim() === text);
          if (el) { el.click(); return true; }
          return false;
        }, item.click);

        if (clicked) {
          await page.waitForTimeout(item.wait || 1000);
          await page.screenshot({ 
            path: path.join(SCREENSHOT_DIR, `${item.name}.png`),
            fullPage: false 
          });
          console.log(`  ✓ Saved ${item.name}.png`);
        } else {
          console.log(`  ✗ Element not found: ${item.click}`);
        }
      } catch (err) {
        console.log(`  ✗ Failed: ${err.message}`);
      }
    }
  } catch (err) {
    console.log(`Navigation error: ${err.message}`);
  }

  await browser.close();
  console.log('\nDone! Screenshots saved to:', SCREENSHOT_DIR);
}

captureScreenshots().catch(console.error);
