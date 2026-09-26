// End-to-end check of the built site in a real browser.
// Usage: npm run build && npm run test:e2e
// Needs Chromium: set CHROMIUM_PATH, or it uses Playwright's default install.
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { chromium } from 'playwright-core';

const PORT = 4179;
const BASE = `http://localhost:${PORT}/`;
const SHOTS = process.env.SHOTS_DIR || 'test-results';
mkdirSync(SHOTS, { recursive: true });

const results = [];
let failures = 0;
function check(name, ok, detail = '') {
  results.push(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
  if (!ok) failures++;
}

// Run vite directly (not through npx) so server.kill() stops the real process.
const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--port', String(PORT), '--strictPort'], { stdio: 'pipe' });
await new Promise((resolve, reject) => {
  const timer = setTimeout(() => reject(new Error('preview server did not start')), 20000);
  server.stdout.on('data', (d) => { if (String(d).includes(String(PORT))) { clearTimeout(timer); resolve(); } });
});

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });

async function newPage(viewport = { width: 1366, height: 900 }) {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  page.errors = [];
  page.on('pageerror', (e) => page.errors.push(String(e)));
  // External resources (web fonts) are ignored: they may be blocked where tests run.
  page.on('console', (m) => { if (m.type() === 'error' && (m.location().url || '').startsWith(BASE)) page.errors.push(m.text()); });
  return page;
}
const go = async (page, hash) => { await page.goto(BASE + '#' + hash); await page.waitForSelector('main'); };
const isNotFound = (page) => page.locator('.empty h3', { hasText: /not found/i }).count();

try {
  const page = await newPage();

  // ---- Home
  await go(page, '/');
  check('home: category tiles', (await page.locator('.category-tile').count()) === 12);
  check('home: featured + latest listings', (await page.locator('.listing-card').count()) >= 16);
  check('home: location tiles', (await page.locator('.location-tile').count()) === 9);
  await page.screenshot({ path: join(SHOTS, 'desktop-home.png'), fullPage: true });

  // ---- All 50 listing pages
  await go(page, '/search');
  const ids = [];
  for (let n = 1; n <= 3; n++) {
    await go(page, `/search?page=${n}`);
    ids.push(...await page.$$eval('.listing-card .listing-link', (as) => as.map((a) => a.getAttribute('href').split('/').pop())));
  }
  check('search: 50 listings across 3 pages', ids.length === 50 && new Set(ids).size === 50, `${ids.length} found`);
  let bad = [];
  for (const id of ids) {
    await go(page, `/listing/${id}`);
    const ok = (await page.locator('.detail-title').count()) === 1
      && (await page.locator('.gallery-main img').count()) === 1
      && (await page.locator('.spec-table > div').count()) >= 4
      && (await page.locator('.seller-card').count()) === 1
      && (await page.locator('.description').innerText()).length > 20;
    if (!ok) bad.push(id);
  }
  check('listing: all 50 detail pages render title, gallery, specs, seller, description', bad.length === 0, bad.join(', '));
  await go(page, `/listing/${ids[0]}`);
  await page.screenshot({ path: join(SHOTS, 'desktop-listing.png'), fullPage: true });

  // Gallery navigation + phone reveal + share + report
  await go(page, '/listing/L001');
  const first = await page.locator('.gallery-main img').getAttribute('src');
  await page.click('.gallery-main .gallery-nav.next');
  check('listing: gallery next photo', (await page.locator('.gallery-main img').getAttribute('src')) !== first);
  await page.click('.contact-buttons button.btn-success');
  check('listing: phone reveal shows tel link', (await page.locator('.contact-buttons a[href^="tel:+855"]').count()) >= 1);
  await page.click('button:has-text("Share")');
  check('listing: share dialog', (await page.locator('.modal a[href*="t.me/share"]').count()) === 1);
  await page.keyboard.press('Escape');
  await page.click('button:has-text("Report ad")');
  await page.click('.modal input[type=radio] >> nth=0');
  await page.click('.modal button[type=submit]');
  check('listing: report submitted', (await page.locator('.toast.show').innerText()).includes('review'));
  check('listing: similar ads', (await page.locator('.section .listing-card').count()) > 0);

  // ---- Categories and subcategories
  const catLinks = await (await go(page, '/categories'), page.$$eval('.category-block a', (as) => as.map((a) => a.getAttribute('href'))));
  bad = [];
  for (const href of catLinks) {
    await go(page, href.replace(/^#/, ''));
    if (await isNotFound(page)) bad.push(href);
    const count = parseInt(await page.locator('.results-head .muted').innerText(), 10);
    const cards = await page.locator('.results-main .listing-card').count();
    if (Math.min(count, 20) !== cards) bad.push(`${href} (${count} vs ${cards})`);
  }
  check(`categories: ${catLinks.length} category/subcategory pages`, bad.length === 0, bad.join(', '));

  // ---- Locations
  const locLinks = await (await go(page, '/locations'), page.$$eval('.location-tile', (as) => as.map((a) => a.getAttribute('href'))));
  bad = [];
  for (const href of locLinks) {
    await go(page, href.replace(/^#/, ''));
    if (await isNotFound(page)) bad.push(href);
  }
  check(`locations: ${locLinks.length} province pages`, locLinks.length === 25 && bad.length === 0, bad.join(', '));
  await go(page, '/l/phnom-penh');
  const ppCards = await page.$$eval('.results-main .listing-meta span:first-child', (s) => s.map((x) => x.textContent));
  check('locations: Phnom Penh results are all in Phnom Penh', ppCards.length > 0 && ppCards.every((t) => t.includes('Phnom Penh')));

  // ---- Search + filters
  await go(page, '/');
  await page.fill('.header-search .sb-input', 'iphone');
  await page.click('.header-search .sb-submit');
  await page.waitForURL(/q=iphone/);
  const iphoneTitles = await page.$$eval('.results-main .listing-title', (h) => h.map((x) => x.textContent));
  check('search: keyword "iphone"', iphoneTitles.length > 0 && iphoneTitles.some((t) => /iphone/i.test(t)), `${iphoneTitles.length} results`);
  await go(page, '/search?q=zzznomatch');
  check('search: no results state', (await page.locator('.empty').count()) === 1);

  await go(page, '/c/cars-vehicles');
  const before = await page.locator('.results-main .listing-card').count();
  await page.click('.filters fieldset:has-text("Condition") button:has-text("Used")');
  await page.waitForURL(/condition=used/);
  const usedCount = await page.locator('.results-main .listing-card').count();
  check('filters: condition=used narrows cars', usedCount > 0 && usedCount <= before, `${before} -> ${usedCount}`);
  await page.selectOption('#f-transmission', 'Automatic');
  await page.waitForURL(/s\.transmission=Automatic/);
  check('filters: category spec filter (transmission)', (await page.locator('.chip-removable', { hasText: 'Automatic' }).count()) === 1);
  await page.fill('.price-range input >> nth=1', '20000');
  await page.click('.price-range button');
  await page.waitForURL(/max=20000/);
  const prices = await page.$$eval('.results-main .price-value', (p) => p.map((x) => Number(x.textContent.replace(/[^\d.]/g, ''))));
  check('filters: max price', prices.every((v) => v <= 20000), prices.join(','));
  await page.selectOption('#f-prov', 'phnom-penh');
  await page.waitForURL(/province=phnom-penh/);
  check('filters: district list appears after province', (await page.locator('#f-dist option').count()) > 5);
  await page.click('.active-filters .link-btn');
  check('filters: clear all', (await page.locator('.chip-removable').count()) === 0);
  await go(page, '/search?deal=rent');
  const rentTags = await page.$$eval('.results-main .listing-card', (c) => c.map((x) => x.textContent));
  check('filters: rent only', rentTags.length > 0 && rentTags.every((t) => t.includes('For Rent')));
  await go(page, '/search?sort=price_desc');
  const sorted = await page.$$eval('.results-main .price-value', (p) => p.map((x) => Number(x.textContent.split(' ')[0].replace(/[^\d.]/g, ''))).filter((n) => n > 0));
  check('sort: price high to low', sorted.every((v, i) => i === 0 || v <= sorted[i - 1]));
  await go(page, '/search?date=1');
  const d1 = await page.locator('.results-main .listing-card').count();
  check('filters: posted in last 24h', d1 > 0 && d1 < 50, `${d1}`);
  await go(page, '/search');
  await page.click('.layout-toggle button[aria-label="List view"]');
  check('results: list layout', (await page.locator('.listing-card.list').count()) > 0);
  await page.screenshot({ path: join(SHOTS, 'desktop-search.png'), fullPage: false });

  // ---- Auth guards, login, register
  await go(page, '/post');
  check('auth: /post redirects guests to login', page.url().includes('#/login?next='));
  await page.fill('input[type=email]', 'demo@example.com');
  await page.fill('input[type=password]', 'wrong');
  await page.click('form button.btn-primary');
  check('auth: wrong password error', (await page.locator('.form-error').count()) === 1);
  await page.fill('input[type=password]', 'demo1234');
  await page.click('form button.btn-primary');
  await page.waitForURL(/#\/post/);
  check('auth: demo login returns to /post', true);

  // ---- Post listing wizard (with photo upload)
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAIAAAD91JpzAAAAFklEQVR4nGP8z8DAwMDAxMDAwMDAAAANHQEDasKb6QAAAABJRU5ErkJggg==', 'base64');
  writeFileSync(join(SHOTS, 'photo.png'), png);
  await page.click('.choice:has-text("Phones & Tablets")');
  await page.click('.choice-row:has-text("Mobile Phones")');
  await page.fill('input[placeholder^="e.g. Toyota"]', 'Test Phone Samsung Galaxy A55 128GB');
  check('post: phone fields shown for phone category', (await page.locator('label:has-text("Storage")').count()) === 1 && (await page.locator('label:has-text("Mileage")').count()) === 0);
  await page.locator('label:has-text("Brand") select').selectOption('Samsung');
  await page.locator('label:has-text("Storage") select').selectOption('128GB');
  await page.click('.post-nav .btn-primary');
  await page.click('.post-nav .btn-primary'); // no photo yet -> error
  check('post: photo required', (await page.locator('.field-error').count()) === 1);
  await page.setInputFiles('[data-testid=photo-input]', join(SHOTS, 'photo.png'));
  await page.waitForSelector('.photo img');
  await page.click('.post-nav .btn-primary');
  await page.fill('.input-prefix input', '329');
  await page.check('label:has-text("Negotiable") input');
  await page.click('.post-nav .btn-primary');
  await page.click('.choice:has(strong:text-is("Used"))');
  await page.click('.post-nav .btn-primary');
  await page.locator('label:has-text("District") select').selectOption({ index: 2 });
  await page.click('.post-nav .btn-primary');
  await page.fill('textarea', 'Good condition, battery 92%, with box and charger. Meet in Tuol Kouk.');
  await page.click('.post-nav .btn-primary');
  check('post: contact phone prefilled', (await page.locator('input[type=tel]').inputValue()).length >= 9);
  await page.click('.post-nav .btn-primary');
  check('post: preview step', (await page.locator('.preview .listing-card').count()) === 1);
  check('post: chosen condition shown in preview', (await page.locator('.preview .spec-table').innerText()).includes('Used'));
  await page.screenshot({ path: join(SHOTS, 'desktop-post-preview.png'), fullPage: true });
  await page.click('.post-nav .btn-accent');
  await page.waitForURL(/#\/listing\/U/);
  check('post: published ad page', (await page.locator('.detail-title').innerText()).includes('Galaxy A55'));
  const newUrl = page.url();
  await go(page, '/search?q=galaxy a55');
  check('post: new ad appears in search', (await page.locator('.results-main .listing-card').count()) === 1);

  // Edit + delete own listing
  await page.goto(newUrl);
  await page.click('.owner-bar a:has-text("Edit")');
  await page.fill('input[placeholder^="e.g. Toyota"]', 'Test Phone Samsung Galaxy A55 128GB (edited)');
  await page.click('.stepper li:last-child button');
  await page.click('.post-nav .btn-accent');
  await page.waitForURL(/#\/listing\/U/);
  check('edit: title updated', (await page.locator('.detail-title').innerText()).includes('(edited)'));

  // ---- Favorites
  await go(page, '/listing/L010');
  await page.click('.detail-actions button:has-text("Save")');
  await go(page, '/account/saved');
  check('favorites: saved ad listed', (await page.locator('.listing-card').count()) === 1);
  await page.click('.listing-card .fav-btn');
  await go(page, '/account/saved');
  check('favorites: unsave', (await page.locator('.empty').count()) === 1);

  // ---- Dashboard
  await go(page, '/account/listings');
  const mine = await page.locator('.manage-item').count();
  check('dashboard: my listings (3 sample + 1 new)', mine === 4, `${mine}`);
  await page.click('.manage-item:has-text("(edited)") button:has-text("Mark sold")');
  check('dashboard: mark sold', (await page.locator('.manage-item:has-text("(edited)") .status-sold').count()) === 1);
  await page.click('.manage-item:has-text("(edited)") button:has-text("Delete")');
  await page.click('.modal .btn-danger');
  check('dashboard: delete', (await page.locator('.manage-item').count()) === 3);
  await go(page, '/account/settings');
  await page.fill('label:has-text("Telegram") input', 'demo_updated');
  await page.click('button:has-text("Save changes")');
  await go(page, '/seller/s14');
  check('settings: profile saved to seller page', (await page.locator('a[href="https://t.me/demo_updated"]').count()) === 1);
  await go(page, '/account');
  await page.screenshot({ path: join(SHOTS, 'desktop-account.png'), fullPage: true });
  await page.click('.account-btn');
  await page.click('.dropdown button:has-text("Logout")');
  check('auth: logout', (await page.locator('.auth-links').count()) === 1);

  // Register
  await go(page, '/register');
  await page.fill('label:has-text("Full name") input', 'Test Buyer');
  await page.fill('label:has-text("Email") input', 'buyer@example.com');
  await page.fill('label:has-text("Phone") input', '+855 96 123 4567');
  await page.fill('label:has-text("Password") input >> nth=0', 'secret12');
  await page.fill('label:has-text("Confirm") input', 'secret12');
  await page.click('button.btn-primary');
  check('register: validation (terms)', (await page.locator('.field-error').count()) >= 1);
  await page.check('.checkbox input');
  await page.click('button.btn-primary');
  await page.waitForURL(/#\/account/);
  check('register: account created + logged in', (await page.locator('.profile-card h1').innerText()) === 'Test Buyer');
  check('register: phone formatted', (await page.locator('.profile-card').innerText()).includes('096 123 4567'));

  // ---- Seller profiles
  bad = [];
  for (let i = 1; i <= 14; i++) {
    await go(page, `/seller/s${i}`);
    if (await isNotFound(page) || (await page.locator('.seller-hero h1').count()) !== 1) bad.push(`s${i}`);
  }
  check('sellers: 14 profile pages', bad.length === 0, bad.join(', '));

  // ---- Broken internal links (crawl every link on key pages)
  const seen = new Set();
  const toVisit = ['/', '/categories', '/locations', '/search', '/listing/L001', '/seller/s1', '/account', '/account/listings'];
  const broken = [];
  for (const start of toVisit) {
    await go(page, start);
    const hrefs = await page.$$eval('a[href^="#/"]', (as) => as.map((a) => a.getAttribute('href')));
    for (const h of hrefs) {
      if (seen.has(h)) continue;
      seen.add(h);
      await go(page, h.slice(1));
      if (await isNotFound(page)) broken.push(h);
    }
  }
  check(`links: ${seen.size} unique internal links, none broken`, broken.length === 0, broken.join(', '));
  check('console: no errors (desktop)', page.errors.length === 0, page.errors.slice(0, 3).join(' | '));

  // ---- Responsive: tablet + mobile
  for (const [name, vp] of [['tablet', { width: 768, height: 1024 }], ['mobile', { width: 390, height: 844 }], ['small', { width: 320, height: 640 }]]) {
    const m = await newPage(vp);
    const overflow = [];
    for (const h of ['/', '/search', '/c/house-land', '/listing/L001', '/listing/L030', '/categories', '/locations', '/login', '/register', '/seller/s5']) {
      await go(m, h);
      const w = await m.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      if (w > 1) overflow.push(`${h} (+${w}px)`);
    }
    check(`${name}: no horizontal overflow`, overflow.length === 0, overflow.join(', '));
    await go(m, '/');
    check(`${name}: bottom tab bar visible`, await m.locator('.tabbar').isVisible());
    await m.screenshot({ path: join(SHOTS, `${name}-home.png`), fullPage: true });
    await m.click('button[aria-label="Menu"]');
    check(`${name}: menu drawer opens`, await m.locator('.drawer.open').isVisible());
    await m.screenshot({ path: join(SHOTS, `${name}-drawer.png`) });
    await m.click('.drawer a:has-text("House & Land")');
    await m.waitForURL(/#\/c\/house-land/);
    check(`${name}: drawer navigation`, !(await m.locator('.drawer.open').count()));
    await m.click('.results-toolbar button:has-text("Filters")');
    check(`${name}: filter sheet opens`, await m.locator('.filter-sidebar.open').isVisible());
    await m.waitForTimeout(400); // let the slide-up animation finish
    await m.screenshot({ path: join(SHOTS, `${name}-filters.png`) });
    await m.click('.sheet-foot button');
    await go(m, '/listing/L001');
    check(`${name}: sticky contact bar`, await m.locator('.contact-sticky').isVisible());
    await m.screenshot({ path: join(SHOTS, `${name}-listing.png`), fullPage: true });
    await m.click('.tabbar a:has-text("Sell")');
    check(`${name}: Sell tab goes to login when logged out`, m.url().includes('#/login'));
    await m.click('.lang-switch button:has-text("ខ្មែរ") >> visible=true').catch(async () => {
      await m.click('button[aria-label="Menu"]');
      await m.click('.drawer .lang-switch button:has-text("ខ្មែរ")');
    });
    await go(m, '/');
    check(`${name}: Khmer interface`, (await m.locator('.section-head h2').first().innerText()).includes('ស្វែងរក'));
    if (name === 'mobile') await m.screenshot({ path: join(SHOTS, 'mobile-home-km.png'), fullPage: false });
    check(`console: no errors (${name})`, m.errors.length === 0, m.errors.slice(0, 3).join(' | '));
  }
} catch (e) {
  check('unexpected error', false, e.stack || String(e));
} finally {
  await browser.close();
  server.kill();
}

console.log(results.join('\n'));
console.log(`\n${results.length - failures} passed, ${failures} failed`);
process.exit(failures ? 1 : 0);
