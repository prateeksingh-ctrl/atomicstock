import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

const SCREENSHOT_DIR = path.resolve('screenshots');
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function capture() {
  console.log('🚀 Launching System Google Chrome...');
  const browser = await puppeteer.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });

  // 1. LOGIN / EVALUATOR SANDBOX PAGE
  console.log('📸 1. Capturing Login & Academic Sandbox...');
  await page.goto('http://localhost:80/login', { waitUntil: 'networkidle0' });
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01_login_sandbox.png') });

  // 2. Click "Launch Role Sandbox Session" button (defaults to Global Administrator)
  console.log('🔑 Launching Role Sandbox Session as Global Administrator...');
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.includes('Launch Role Sandbox Session'));
    if (btn) btn.click();
  });
  
  // Wait for redirect to /dashboard
  await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 10000 }).catch(() => {});
  await new Promise(r => setTimeout(r, 2000));

  // 3. DASHBOARD TAB 1: OVERVIEW
  console.log('📸 2. Capturing Command Center Overview...');
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02_dashboard_overview.png') });

  // 4. Click Consolidated Asset Valuation Card to reveal Gross Margin & COGS Breakdown
  console.log('📸 3. Capturing Asset Valuation & PnL Drawer...');
  await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll('div, p, span'));
    const valElem = cards.find(el => el.textContent?.includes('Consolidated Asset Valuation'));
    if (valElem) {
      const card = valElem.closest('.rounded-2xl, .rounded-\\[22px\\], .cursor-pointer') || valElem.parentElement;
      if (card) card.click();
    }
  });
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03_valuation_breakdown.png') });

  // 5. Click Tab 2: Stockout Velocity & Reorders
  console.log('📸 4. Capturing Predictive Stockout & Velocity Reorder Engine...');
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.includes('Stockout Velocity'));
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '04_velocity_reorders.png') });

  // 6. Click Tab 3: Inventory Aging & Dead Stock
  console.log('📸 5. Capturing Dead-Stock Diagnostic & Working Capital...');
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.includes('Inventory Aging'));
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '05_dead_stock_aging.png') });

  // 7. Click Tab 4: Transaction Log
  console.log('📸 6. Capturing System Transaction Log...');
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.includes('Transaction Log'));
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '06_audit_transaction_log.png') });

  // 8. MASTER CATALOG PAGE
  console.log('📸 7. Capturing Master Catalog & SKU Registry...');
  await page.goto('http://localhost:80/catalog', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '07_master_catalog.png') });

  // 9. Filter Catalog by Delhi NCR Hub
  console.log('📸 8. Filtering Catalog by Delhi NCR Node...');
  await page.evaluate(() => {
    const delhiBtn = Array.from(document.querySelectorAll('button, span')).find(b => b.textContent?.includes('DEL-01'));
    if (delhiBtn) delhiBtn.click();
  });
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '08_catalog_node_filter.png') });

  // 10. WAREHOUSE HUBS TOPOLOGY
  console.log('📸 9. Capturing Warehouse Hubs & Capacity Gauges...');
  await page.goto('http://localhost:80/network', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '09_warehouse_network.png') });

  // 11. INBOUND RECEIVING TERMINAL
  console.log('📸 10. Capturing Inbound Receiving Hub & Hardware Toggles...');
  await page.goto('http://localhost:80/procurement', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '10_inbound_receiving.png') });

  // 12. OUTBOUND POS SCANNER (FLOOR CHECKOUT)
  console.log('📸 11. Capturing Outbound Dispatch POS & Gross Margin Engine...');
  await page.goto('http://localhost:80/scanner', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '11_outbound_scanner_idle.png') });

  // 13. Perform Live POS Scan & Margin calculation
  console.log('🛒 12. Scanning SKU to trigger live margin calculation...');
  await page.evaluate(() => {
    const quickBtn = Array.from(document.querySelectorAll('button')).find(b => 
      b.textContent && (b.textContent.includes('APPL') || b.textContent.includes('DELL') || b.textContent.includes('SAM') || b.textContent.includes('SONY'))
    );
    if (quickBtn) {
      quickBtn.click();
    } else {
      const input = document.querySelector('input[type="text"]');
      if (input) {
        input.value = 'APPL-MBP-14';
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }
  });
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '12_pos_margin_calculation.png') });

  // 14. IDENTITY & ACCESS CONTROL (IAM)
  console.log('📸 13. Capturing Identity & Access Management...');
  await page.goto('http://localhost:80/iam', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '13_access_control_iam.png') });

  // 15. MOBILE VIEWPORT RESPONSIVENESS
  console.log('📱 14. Capturing Mobile Responsive Viewport (iPhone 14 Pro)...');
  await page.setViewport({ width: 393, height: 852, deviceScaleFactor: 2, isMobile: true });
  await page.goto('http://localhost:80/dashboard', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '14_mobile_responsive_dashboard.png') });

  console.log('🎉 All 14 high-resolution screenshots captured successfully!');
  await browser.close();
}

capture().catch(err => {
  console.error('Capture error:', err);
  process.exit(1);
});
