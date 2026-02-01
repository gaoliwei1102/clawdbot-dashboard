const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ 
    headless: false,
    executablePath: '/usr/bin/google-chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  // Set viewport to standard size
  await page.setViewportSize({ width: 1280, height: 800 });
  
  console.log('1. Loading page...');
  await page.goto('http://localhost:8002', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(2000);
  
  console.log('2. Login dialog should be visible...');
  
  // Wait for login dialog
  await page.waitForSelector('input[type="password"]', { timeout: 5000 });
  console.log('3. Entering password...');
  
  await page.fill('input[type="password"]', 'Gaowei1102..');
  await page.click('button[type="submit"]');
  
  console.log('4. Waiting for login...');
  await page.waitForTimeout(3000);
  
  // Wait for dashboard to load
  await page.waitForSelector('text=Dashboard', { timeout: 5000 });
  console.log('5. Dashboard loaded! Taking screenshot...');
  
  // Take full page screenshot
  await page.screenshot({ 
    path: '/tmp/real-dashboard.png', 
    fullPage: true,
    type: 'png'
  });
  
  console.log('Screenshot saved to /tmp/real-dashboard.png');
  console.log('File size:', (require('fs').statSync('/tmp/real-dashboard.png').size / 1024).toFixed(1), 'KB');
  
  await browser.close();
  console.log('Done!');
})();
