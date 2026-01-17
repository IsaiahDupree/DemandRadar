const { chromium } = require("playwright");
const path = require("path");
const fs = require("fs");

const DIR = path.join(__dirname, "../docs/screenshots/hookd");
fs.mkdirSync(DIR, { recursive: true });

(async () => {
  console.log("\n🚀 Hookd Screenshot Capture Tool\n");
  
  const browser = await chromium.launch({ headless: false }); // Visible browser for manual login
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  
  // 1. Login
  console.log("Logging in...");
  await page.goto("https://app.gethookd.ai/explore", { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForTimeout(2000);
  
  // Fill login form if present
  try {
    await page.fill('input[type="email"]', process.env.HOOKD_EMAIL || "isaiahdupree33@gmail.com");
    await page.fill('input[type="password"]', process.env.HOOKD_PASS || "Frogger12!@");
    await page.click('button[type="submit"]');
    await page.waitForTimeout(5000);
    console.log("Logged in successfully");
  } catch (e) {
    console.log("Already logged in or login form not found");
  }
  
  await page.waitForTimeout(2000);
  
  // 2. Capture app pages - COMPLETE LIST
  const appPages = [
    // Discover Ads section
    { action: "goto", url: "https://app.gethookd.ai/explore", name: "01-explore-ads" },
    { action: "click", text: "Brands", name: "01b-explore-brands" },
    { action: "goto", url: "https://app.gethookd.ai/swipe-file", name: "02-swipe-file" },
    { action: "click", text: "Brands", name: "02b-swipe-file-brands" },
    { action: "goto", url: "https://app.gethookd.ai/brand-spy", name: "03-brand-spy" },
    { action: "goto", url: "https://app.gethookd.ai/expert-picks", name: "03b-expert-picks" },
    
    // Create Ads section (5 sub-pages) - using direct URLs
    { action: "goto", url: "https://app.gethookd.ai/create", name: "04-clone-ads" },
    { action: "goto", url: "https://app.gethookd.ai/video-scripts", name: "05-video-scripts" },
    { action: "goto", url: "https://app.gethookd.ai/brand-assets", name: "06-brand-assets" },
    { action: "goto", url: "https://app.gethookd.ai/image-ad-templates", name: "07-image-templates" },
    { action: "goto", url: "https://app.gethookd.ai/funnel-templates", name: "08-funnel-templates" },
    
    // Analyze Ads section (2 sub-pages) - using direct URLs
    { action: "goto", url: "https://app.gethookd.ai/analyze", name: "09-creative-analyzer" },
    { action: "goto", url: "https://app.gethookd.ai/dashboard", name: "09b-dashboard" },
    
    // Integrations
    { action: "click", text: "Integrations", name: "10-integrations" },
    
    // Success Guide section (3 sub-pages)
    { action: "click", text: "Success Guide", name: "11-get-started" },
    { action: "click", text: "Our Blog", name: "11b-blog" },
    { action: "click", text: "Features Explained", name: "11c-features" },
  ];
  
  for (const p of appPages) {
    try {
      if (p.action === "goto") {
        await page.goto(p.url, { waitUntil: "domcontentloaded", timeout: 15000 });
      } else if (p.action === "click") {
        await page.getByText(p.text, { exact: true }).first().click();
      }
      await page.waitForTimeout(1500);
      await page.screenshot({ path: path.join(DIR, p.name + ".png") });
      console.log("✓ Saved:", p.name + ".png");
    } catch (e) {
      console.log("✗ Failed:", p.name, "-", e.message.slice(0, 50));
    }
  }
  
  // 3. Marketing pages (no login needed)
  const marketingPages = [
    ["https://gethookd.ai", "14-marketing-home"],
    ["https://gethookd.ai/pricing", "15-pricing"],
  ];
  
  for (const [url, name] of marketingPages) {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 15000 });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(DIR, name + ".png") });
    console.log("✓ Saved:", name + ".png");
  }
  
  await browser.close();
  console.log("\n✅ Done! Screenshots saved to:", DIR, "\n");
})();
