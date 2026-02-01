import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
await page.setViewportSize({ width: 1400, height: 900 });

console.log('Loading page...');
await page.goto('http://localhost:8002', { waitUntil: 'networkidle' });
await page.waitForTimeout(1500);

console.log('Login dialog visible, entering password...');
await page.fill('input[type="password"]', 'Gaowei1102..');
await page.click('button[type="submit"]');

console.log('Waiting for dashboard...');
await page.waitForTimeout(3000);
await page.waitForSelector('text=Dashboard', { timeout: 5000 });

console.log('Dashboard loaded! Taking screenshot...');
await page.screenshot({ 
  path: '/tmp/dashboard-capture.png', 
  fullPage: true,
  type: 'png'
});

console.log('Screenshot saved to /tmp/dashboard-capture.png');
console.log('File size:', (await (await import('fs')).stat('/tmp/dashboard-capture.png')).size, 'bytes');

await browser.close();
