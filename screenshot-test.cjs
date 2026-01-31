const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  const consoleMessages = [];
  page.on('console', msg => {
    consoleMessages.push({ type: msg.type(), text: msg.text() });
  });
  
  const pageErrors = [];
  page.on('pageerror', error => {
    pageErrors.push(error.message);
  });
  
  try {
    console.log('1. Loading page...');
    await page.goto('http://localhost:8002', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);
    
    console.log('2. Checking for login dialog...');
    const loginDialog = await page.$('text=输入访问密码');
    console.log('   Login dialog visible:', !!loginDialog);
    
    if (loginDialog) {
      console.log('3. Entering password...');
      await page.fill('input[type="password"]', 'Gaowei1102..');
      
      console.log('4. Clicking submit...');
      await page.click('button[type="submit"]');
      await page.waitForTimeout(3000);
    }
    
    console.log('5. Taking screenshot...');
    await page.screenshot({ path: '/tmp/dashboard.png', fullPage: true });
    console.log('   Screenshot saved to /tmp/dashboard.png');
    
    console.log('\n6. Checking current state:');
    const dialogAfter = await page.$('text=输入访问密码');
    console.log('   Login dialog visible:', !!dialogAfter);
    
    const dashboard = await page.$('text=Dashboard');
    console.log('   Dashboard visible:', !!dashboard);
    
    const sessions = await page.$('text=Sessions');
    console.log('   Sessions visible:', !!sessions);
    
    console.log('\n7. Console errors:');
    const errors = consoleMessages.filter(m => m.type === 'error');
    if (errors.length > 0) {
      errors.forEach(err => console.log('  -', err.text));
    } else {
      console.log('   No console errors!');
    }
    
    console.log('\n8. Page errors:');
    if (pageErrors.length > 0) {
      pageErrors.forEach(err => console.log('  -', err));
    } else {
      console.log('   No page errors!');
    }
    
  } catch (error) {
    console.log('Error:', error.message);
  }
  
  await browser.close();
})();
