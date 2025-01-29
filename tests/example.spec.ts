const { test, expect } = require('@playwright/test');

test('Check all m3u8 files after clicking artists', async ({ page, browser }) => {
  // Navigate to the site
  await page.goto('https://sinparty.com/', { waitUntil: 'domcontentloaded' });

  // Accept cookies if the prompt appears
  const agreeButton = page.getByRole('button', { name: 'I agree' });
  if (await agreeButton.isVisible()) {
    await agreeButton.click();
  }

  // Wait until content loads
  await page.waitForSelector('.content-gallery__item', { timeout: 5000 });

  // Define artist locator
  const artistLocator = page.locator('div')
    .filter({ has: page.locator('div[style="height: 1px;"]') })
    .locator('.content-gallery__item')
    .filter({ has: page.locator('span.cam-tile__live-info') });

  const artistCount = await artistLocator.count();
  console.log(`Found ${artistCount} artists`);

  if (artistCount === 0) {
    console.log('No matching elements found');
    return;
  }

  // Click each artist and check all m3u8 files
  for (let i = 0; i < artistCount; i++) {
    const artist = artistLocator.nth(i);
    
    // Open in a new tab
    const newTab = await browser.newPage();
    
    // Store all detected m3u8 URLs
    let m3u8Files = new Set();
    
    newTab.on('request', request => {
      const url = request.url();
      if (url.endsWith('.m3u8')) {
        m3u8Files.add(url);
      }
    });

    // Click the artist to open the stream page
    const artistHref = await artist.evaluate(el => el.querySelector('a')?.href);
    if (artistHref) {
      await newTab.goto(artistHref, { waitUntil: 'networkidle' });

      // Wait additional time to capture late network requests
      await newTab.waitForTimeout(5000);

      if (m3u8Files.size > 0) {
        console.log(`🔍 Checking ${m3u8Files.size} m3u8 files for artist ${i + 1}...`);
        
        // Check each m3u8 file
        for (const m3u8Url of m3u8Files) {
          const response = await newTab.request.get(m3u8Url);
          const status = response.status();
          
          if (status === 400) {
            console.log(`❌ ERROR 400: ${m3u8Url} is not loading properly.`);
          } else {
            console.log(`✅ SUCCESS: ${m3u8Url} loaded with status ${status}`);
          }
        }
      } else {
        console.log(`⚠️ No m3u8 files detected for artist ${i + 1}`);
      }
    } else {
      console.log(`No link found for artist ${i + 1}`);
    }

    // Close the new tab
    await newTab.close();
  }
});

