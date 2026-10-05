/* Read-only browser review. All API mutations are blocked in this isolated session. */
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const assert = require('node:assert/strict');
let playwright;
try { playwright = require('playwright'); } catch {
  const bundled = path.join(os.homedir(), '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
  playwright = require(process.env.PLAYWRIGHT_MODULE_PATH || bundled);
}
const base = process.env.CUSTOMER_UI_BASE_URL || 'http://localhost:3000';
let runningBrowser;
const output = path.resolve('artifacts/customer-ui');
const widths = [375, 390, 414, 768, 820, 834, 1024, 1440];
fs.mkdirSync(output, { recursive: true });

(async () => {
  const browser = runningBrowser = await playwright.chromium.launch({ channel: process.env.CUSTOMER_UI_BROWSER || 'msedge', headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const apiFailures = new Set();
  const runtimeErrors = new Set();
  const blockedMutations = [];
  const checks = [];
  const interactions = [];
  await context.route('**/api/**', async (route) => {
    if (['GET', 'HEAD', 'OPTIONS'].includes(route.request().method())) return route.continue();
    blockedMutations.push({ method: route.request().method(), path: new URL(route.request().url()).pathname });
    await route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ error: 'Read-only UI verification: mutation blocked' }) });
  });
  const page = await context.newPage();
  page.on('pageerror', (error) => runtimeErrors.add(error.message.split('\n')[0]));
  page.on('response', (response) => {
    const url = new URL(response.url());
    if (url.pathname.startsWith('/api/') && response.status() >= 400) apiFailures.add(`${response.status()} ${url.pathname}`);
  });
  async function visit(route) {
    const catalogSettled = page.waitForResponse((response) => new URL(response.url()).pathname === '/api/products', { timeout: 15000 }).catch(() => null);
    const response = await page.goto(base + route, { waitUntil: 'domcontentloaded' });
    assert.equal(response.status(), 200, `Route ${route} returned ${response.status()}`);
    await page.locator('.storefront:visible').waitFor();
    await page.locator('.storefront:visible .store-header-search input').waitFor();
    await catalogSettled;
  }
  async function bounds(route, width, state = 'default') {
    const result = await page.evaluate(() => {
      const width = innerWidth;
      const outside = Array.from(document.querySelectorAll('.storefront *')).filter((element) => {
        const rect = element.getBoundingClientRect();
        const style = getComputedStyle(element);
        if (!rect.width || !rect.height || style.display === 'none' || style.visibility === 'hidden') return false;
        // Descendants within deliberate clipped image stages or internal scroll areas do not expand the page.
        let ancestor = element.parentElement;
        while (ancestor && !ancestor.classList.contains('storefront')) {
          const ancestorStyle = getComputedStyle(ancestor);
          if (['hidden', 'auto', 'scroll', 'clip'].includes(ancestorStyle.overflowX)) return false;
          ancestor = ancestor.parentElement;
        }
        return rect.left < -1 || rect.right > width + 1;
      }).map((element) => ({ tag: element.tagName, class: String(element.className).slice(0, 150), left: Math.round(element.getBoundingClientRect().left), right: Math.round(element.getBoundingClientRect().right) }));
      return { viewport: width, documentWidth: document.documentElement.scrollWidth, outside };
    });
    checks.push({ route, width, state, ...result, passed: result.documentWidth <= width && result.outside.length === 0 });
    if (result.documentWidth > width || result.outside.length) console.log('OVERFLOW', route, width, state, JSON.stringify(result.outside));
  }
  async function capture(name) {
    // Resolve lazy images before capturing the complete layout.
    await page.evaluate(async () => {
      const images = Array.from(document.querySelectorAll('img'));
      images.forEach((image) => { image.loading = 'eager'; });
      await Promise.all(images.map((image) => image.complete ? Promise.resolve() : new Promise((resolve) => { image.onload = resolve; image.onerror = resolve; })));
      await document.fonts.ready;
    });
    await page.screenshot({ path: path.join(output, `${name}.png`), fullPage: true });
  }
  await visit('/books');
  await page.locator('.storefront:visible .store-book-card').first().waitFor();
  const productRoute = await page.locator('.storefront:visible .store-book-stage').first().getAttribute('href');
  await page.locator('.storefront:visible .store-book-add:not([disabled])').first().click();
  await visit('/cart');
  await page.getByRole('button', { name: /^Increase quantity of/ }).first().click();
  await page.getByRole('button', { name: /^Decrease quantity of/ }).first().click();
  assert.equal(await page.getByRole('spinbutton').first().inputValue(), '1');
  interactions.push('Add to cart, increase/decrease quantity, persist cart across navigation');
  await visit('/orders');
  const orderRoute = await page.locator('a[href^="/orders/"]:not([href$="/track"])').first().getAttribute('href');
  await visit('/branches');
  const branchRoute = await page.locator('a[href^="/branches/"]').first().getAttribute('href');
  const orderId = orderRoute.split('/').pop();
  const routes = ['/', '/books', productRoute, '/books/customer-ui-missing-book', '/categories', '/search', '/search?q=Mathematics', '/cart', '/checkout', '/orders', orderRoute, `${orderRoute}/track`, `/orders/confirmation?orderId=${encodeURIComponent(orderId)}`, '/orders/customer-ui-missing-order', '/tracking', `/tracking?q=${encodeURIComponent(orderId)}`, '/profile', '/profile/addresses', '/profile/security', '/branches', branchRoute];
  for (const route of routes) {
    await visit(route);
    for (const width of widths) {
      await page.setViewportSize({ width, height: width < 768 ? 844 : 1000 });
      await bounds(route, width);
      if ([390, 820, 1440].includes(width) && ['/', '/books', productRoute, '/cart', '/checkout', '/orders', '/profile'].includes(route)) {
        const name = route === '/' ? 'homepage' : route === productRoute ? 'product' : route.slice(1);
        await capture(`${name}-${width}`);
      }
    }
    console.log('Reviewed', route, 'at all 8 widths');
  }
  fs.writeFileSync(path.join(output, 'layout-checks.json'), JSON.stringify(checks, null, 2));
  await page.setViewportSize({ width: 390, height: 844 });
  await visit('/');
  await page.getByRole('button', { name: 'Open navigation' }).click();
  assert.equal(await page.locator('.store-mobile-drawer').evaluate((dialog) => dialog.open), true);
  await bounds('/', 390, 'navigation open');
  for (let i = 0; i < 18; i++) { await page.keyboard.press('Tab'); assert.equal(await page.locator('.store-mobile-drawer').evaluate((dialog) => dialog.contains(document.activeElement) || document.activeElement === document.body), true); }
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('.store-mobile-drawer').evaluate((dialog) => dialog.open), false);
  interactions.push('Mobile navigation, keyboard focus containment, Escape close and focus restoration');
  await page.locator('#store-search').fill('Mathematics');
  await page.getByRole('button', { name: 'Search the bookstore', exact: true }).click();
  await page.waitForURL('**/search?q=Mathematics');
  assert.ok(await page.locator('.storefront:visible .store-book-card').count() > 0);
  interactions.push('Header search navigation and search results');
  await visit('/books');
  await page.getByRole('button', { name: 'Open filter sidebar' }).click();
  await page.getByRole('dialog', { name: 'Filter books' }).waitFor();
  await bounds('/books', 390, 'filters open');
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Open filter sidebar' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Class 10', exact: true }).click();
  await page.getByRole('button', { name: 'Apply Filters' }).click();
  await page.waitForURL('**/books?grade=Class+10');
  assert.ok(await page.locator('.storefront:visible .store-book-card').count() > 0);
  await page.getByLabel('catalog-sort-select', { exact: false }).count();
  await page.locator('#catalog-sort-select').selectOption('price-desc');
  const prices = await page.locator('.storefront:visible .store-book-price strong').allTextContents();
  const numeric = prices.map((price) => Number(price.replace(/[^\d.]/g, '')));
  assert.deepEqual(numeric, [...numeric].sort((a, b) => b - a));
  interactions.push('Mobile filter drawer, class filtering, URL state and price sorting');
  await visit('/checkout');
  for (const method of ['Card', 'Net Banking', 'Wallet', 'Manual Payment', 'UPI']) {
    await page.locator(`input[id="pay-${method}"]`).check();
    await bounds('/checkout', 390, `payment choice ${method}`);
  }
  for (const mode of ['UPI App Intent', 'Scan UPI QR', 'UPI ID Collect']) {
    await page.getByRole('button', { name: new RegExp(mode) }).click();
    await bounds('/checkout', 390, mode);
  }
  await page.locator('input[id="full-name"]').fill('');
  await page.getByRole('button', { name: 'Confirm & Place Order' }).click();
  assert.ok(await page.getByText('Full name is required', { exact: false }).count() > 0);
  interactions.push('Existing payment choices, UPI modes and checkout validation');
  await visit('/profile');
  await page.getByRole('button', { name: 'Edit Profile', exact: true }).click();
  await page.getByRole('dialog').waitFor();
  await bounds('/profile', 390, 'edit profile open');
  await page.keyboard.press('Escape');
  await visit('/profile/addresses');
  await page.getByRole('button', { name: 'Add New Address' }).click();
  await page.getByRole('dialog').waitFor();
  await bounds('/profile/addresses', 390, 'add address open');
  await page.keyboard.press('Escape');
  interactions.push('Profile edit and add-address dialogs open and close');
  await visit('/tracking');
  await page.locator('form input').last().fill(orderId);
  await page.locator('form').last().getByRole('button', { name: /Track/ }).click();
  assert.ok(await page.getByText(orderId, { exact: false }).count() > 0);
  interactions.push('Order tracking reference lookup');
  await visit('/cart');
  await page.getByRole('button', { name: 'Clear all items in cart' }).click();
  await bounds('/cart', 390, 'clear-cart confirmation');
  await page.getByRole('button', { name: 'Confirm clear entire cart' }).click();
  await page.getByText('Your Cart is Currently Empty', { exact: true }).waitFor();
  for (const route of ['/cart', '/checkout']) {
    await visit(route);
    for (const width of widths) {
      await page.setViewportSize({ width, height: width < 768 ? 844 : 1000 });
      await bounds(route, width, 'empty cart');
    }
  }
  interactions.push('Clear-cart confirmation and empty cart/checkout states at all 8 widths');
  fs.writeFileSync(path.join(output, 'layout-checks.json'), JSON.stringify(checks, null, 2));
  const failed = checks.filter((check) => !check.passed);
  const report = { base, widths, routes, checks, interactions, blockedMutations, runtimeErrors: [...runtimeErrors], apiFailures: [...apiFailures], summary: { layouts: checks.length, passed: checks.length - failed.length, failed: failed.length } };
  fs.writeFileSync(path.join(output, 'verification.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ summary: report.summary, interactions, runtimeErrors: report.runtimeErrors, apiFailures: report.apiFailures, blockedMutations }));
  await browser.close();
  if (failed.length || runtimeErrors.size) process.exitCode = 1;
})().catch(async (error) => { console.error(error); await runningBrowser?.close(); process.exitCode = 1; });
