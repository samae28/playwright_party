import { test, expect } from '@playwright/test';

test('Monitor m3u8 status codes', async ({ page }) => {
  // Intercept all network requests
  page.on('response', async (response) => {
    const url = response.url();
    if (url.endsWith('.m3u8')) {
      console.log(`M3U8 File: ${url}, Status: ${response.status()}`);
      expect(response.status()).toBe(200); // Ensure it's OK
    }
  });

  await page.goto('https://sinparty.com/sinymoore/live');
});


test('Check M3U8 file status', async ({ page }) => {
  await page.goto('https://sinparty.com/sinymoore/live');

  // Extract and check all M3U8 URLs
  const urls = await page.evaluate(() =>
    Array.from(document.querySelectorAll('a, video, source'))
      .map(el => (el as HTMLAnchorElement).href || (el as HTMLMediaElement).src)
      .filter(url => url?.endsWith('.m3u8'))
  );

  console.log('Found M3U8 URLs:', urls);

  for (const url of urls) {
    const status = await page.evaluate(async (u) => {
      try {
        return (await fetch(u, { method: 'HEAD' })).status;
      } catch {
        return 'Error';
      }
    }, url);

    console.log(`M3U8 File: ${url}, Status: ${status}`);
    expect(status).toBe(200); // Ensure it's valid
  }
});


const m3u8Urls = [
  "https://edge-cdn4.sinparty.com/LiveApp/streams/user6788ae7236198/NxsYe9ONonGfu22040041890336141_720p2000kbps.m3u8",
  "https://example.com/stream2.m3u8"
];

test('Check status of all M3U8 files', async ({ page }) => {
  for (const url of m3u8Urls) {
    const response = await page.evaluate(async (url) => {
      try {
        const res = await fetch(url, { method: 'HEAD' }); // HEAD request for efficiency
        return res.status;
      } catch (error) {
        return `Error: ${error.message}`;
      }
    }, url);

    console.log(`M3U8 File: ${url}, Status: ${response}`);
    expect(response).toBe(200); // Assert it's OK
  }
});

