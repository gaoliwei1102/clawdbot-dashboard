import { chromium } from 'playwright';

const browser = await chromium.launch({ 
  headless: false,
  executablePath: '/usr/bin/google-chrome',
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--kiosk', '--disable-gpu']
});

const page = await browser.newPage();
await page.setViewportSize({ width: 1400, height: 900 });

console.log('Loading page...');
await page.goto('http://localhost:8002', { waitUntil: 'networkidle', timeout: 30000 });
await page.waitForTimeout(1500);

console.log('Entering password...');
await page.fill('input[type="password"]', 'Gaowei1102..');
await page.click('button[type="submit"]');

console.log('Waiting for dashboard...');
await page.waitForTimeout(3000);
await page.waitForSelector('text=Dashboard', { timeout: 5000 });

console.log('Taking screenshot...');
await page.screenshot({ 
  path: '/tmp/final-dashboard.png', 
  fullPage: true,
  type: 'png'
});

console.log('Screenshot saved!');
console.log('Size:', (await (await import('fs')).stat('/tmp/final-dashboard.png')).size, 'bytes');
await browser.close();
