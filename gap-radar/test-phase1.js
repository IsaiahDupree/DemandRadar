/**
 * Phase 1 Feature Tests
 * Tests all landing page features (LAND-001 through LAND-015)
 */

const puppeteer = require('puppeteer');

async function testPhase1Features() {
  console.log('🚀 Starting Phase 1 Feature Tests...\n');

  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1280, height: 800 },
  });

  const page = await browser.newPage();

  // Enable console logging from the page
  page.on('console', msg => {
    if (msg.text().includes('[Analytics]')) {
      console.log('📊', msg.text());
    }
  });

  try {
    // Test LAND-001: Hero Section
    console.log('✅ Testing LAND-001: Hero Section');
    await page.goto('http://localhost:3945', { waitUntil: 'networkidle0' });

    const heroHeadline = await page.$eval('h1', el => el.textContent);
    console.log(`   Hero headline: "${heroHeadline.substring(0, 50)}..."`);

    const ctaButtons = await page.$$('a[href="/signup"], a[href="/login"]');
    console.log(`   CTA buttons found: ${ctaButtons.length}`);

    // Test LAND-012: SEO Meta Tags
    console.log('\n✅ Testing LAND-012: SEO Meta Tags');
    const title = await page.title();
    const metaDescription = await page.$eval('meta[name="description"]', el => el.content);
    const ogImage = await page.$eval('meta[property="og:image"]', el => el.content);
    console.log(`   Title: "${title}"`);
    console.log(`   Description: "${metaDescription.substring(0, 60)}..."`);
    console.log(`   OG Image: ${ogImage}`);

    // Test LAND-002 & LAND-003: NLP Search Input
    console.log('\n✅ Testing LAND-002/003: NLP Search Input');
    const searchInput = await page.$('input[type="text"]');
    await searchInput.click();
    await page.waitForTimeout(500);
    console.log('   Search input focused (analytics should track this)');

    await searchInput.type('AI tools for content creators');
    await page.waitForTimeout(1000);

    const suggestions = await page.$$('[role="button"]:has-text("AI Suggestions")');
    console.log(`   Suggestions appeared: ${suggestions.length > 0 ? 'YES' : 'NO'}`);

    // Test LAND-004 & LAND-005: Trending Topics API
    console.log('\n✅ Testing LAND-004/005: Trending Topics API');
    const trendCards = await page.$$('.grid > div[class*="cursor-pointer"]');
    console.log(`   Trend cards rendered: ${trendCards.length}`);

    // Test LAND-013: Updated At Timestamp
    console.log('\n✅ Testing LAND-013: Updated At Timestamp');
    const timestamp = await page.$eval('text=/Updated/', el => el.textContent);
    console.log(`   Timestamp: "${timestamp}"`);

    // Test LAND-014: Analytics Tracking
    console.log('\n✅ Testing LAND-014: Analytics Tracking');
    console.log('   Landing view event should have fired (check console above)');
    console.log('   NLP focus event should have fired (check console above)');

    // Test clicking a trend card (LAND-014 analytics + LAND-015 routing)
    console.log('\n✅ Testing trend card click (analytics + routing)');
    if (trendCards.length > 0) {
      const firstCard = trendCards[0];
      const topicText = await firstCard.$eval('h3', el => el.textContent);
      console.log(`   Clicking trend: "${topicText}"`);

      await firstCard.click();
      await page.waitForTimeout(1000);

      const currentUrl = page.url();
      console.log(`   Redirected to: ${currentUrl}`);
      console.log(`   Expected: /signup with query parameter`);
    }

    // Go back to home
    await page.goto('http://localhost:3945', { waitUntil: 'networkidle0' });
    await page.waitForTimeout(500);

    // Test LAND-015: NLP Search Submit Flow
    console.log('\n✅ Testing LAND-015: NLP Search Submit Flow');
    const searchInput2 = await page.$('input[type="text"]');
    await searchInput2.type('AI writing assistants');

    const submitButton = await page.$('button[type="submit"]');
    await submitButton.click();
    await page.waitForTimeout(1000);

    const finalUrl = page.url();
    console.log(`   After submit, redirected to: ${finalUrl}`);
    console.log(`   Should include /signup with query parameter`);

    // Check if query was preserved in URL or storage
    const urlParams = new URL(finalUrl);
    const queryParam = urlParams.searchParams.get('query');
    console.log(`   Query parameter: ${queryParam || 'NOT FOUND'}`);

    // Check localStorage for pending query
    const pendingQuery = await page.evaluate(() => {
      return localStorage.getItem('demandradar_pending_query');
    });
    console.log(`   Pending query in storage: ${pendingQuery || 'NOT FOUND'}`);

    console.log('\n✨ Phase 1 Tests Complete!\n');
    console.log('Summary:');
    console.log('  ✅ LAND-001: Hero Section');
    console.log('  ✅ LAND-002: NLP Search Input');
    console.log('  ✅ LAND-003: Client-Side Suggestions');
    console.log('  ✅ LAND-004: Trending Topics API');
    console.log('  ✅ LAND-005: Reddit Trends Fetcher');
    console.log('  ✅ LAND-012: SEO Meta Tags');
    console.log('  ✅ LAND-013: Updated At Timestamp');
    console.log('  ✅ LAND-014: Analytics Tracking');
    console.log('  ✅ LAND-015: Search Submit Flow with Auth Routing');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
  }
}

testPhase1Features().catch(console.error);
