/**
 * Opens MOI_URL in a VISIBLE Chromium window (through the VPN, if enabled) and
 * dumps candidate selectors so you can fill in liveScraper's SEL_* values.
 *
 *   npm i playwright && npx playwright install chromium
 *   # in backend/.env set MOI_URL and (optionally) VPN_ENABLED=true
 *   npm run inspect
 *
 * The report lists every input/select, image, button, and table on the page.
 * Match them to: plate/personal/establishment inputs, the CAPTCHA image, the
 * CAPTCHA text input, the submit button, and the results table. Put the chosen
 * selectors in .env (SEL_PLATE, SEL_CAPTCHA_IMG, SEL_SUBMIT, SEL_RESULTS, ...).
 * The window stays open until you press Ctrl+C.
 */
import 'dotenv/config';
import { env } from '../config/env';
import { openVpn } from '../services/vpn/openvpn.service';

async function run() {
  const url = env.violation.moiUrl;
  if (!url) {
    console.error('Set MOI_URL in backend/.env first.');
    process.exit(1);
  }

  if (env.vpn.enabled) {
    console.log('Connecting VPN (run this terminal as Administrator)...');
    await openVpn.ensureConnected();
    console.log('VPN connected.\n');
  }

  let playwright: any;
  try {
    playwright = await import('playwright' as string);
  } catch {
    console.error('Playwright is not installed. Run: npm i playwright && npx playwright install chromium');
    process.exit(1);
  }

  console.log(`Opening ${url} ... (close with Ctrl+C)\n`);
  const browser = await playwright.chromium.launch({ headless: false, devtools: true });
  const context = await browser.newContext({ locale: 'ar-QA' });
  const page = await context.newPage();
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 }).catch(() => undefined);
  await page.waitForTimeout(2500);

  const report = await page.evaluate(() => {
    const sel = (el: Element) => {
      const id = el.id ? `#${el.id}` : '';
      const name = el.getAttribute('name');
      const cls = (el.getAttribute('class') || '').trim().split(/\s+/).filter(Boolean).slice(0, 2);
      return {
        id,
        name,
        class: cls.length ? '.' + cls.join('.') : '',
        type: el.getAttribute('type') || '',
        placeholder: el.getAttribute('placeholder') || '',
        text: (el.textContent || '').trim().slice(0, 40),
        src: el.getAttribute('src') || '',
      };
    };
    const pick = (q: string) => Array.from(document.querySelectorAll(q)).map(sel);
    return {
      inputs: pick('input, select, textarea'),
      images: pick('img'),
      buttons: pick('button, input[type="submit"], a[role="button"]'),
      tables: pick('table'),
    };
  });

  const show = (title: string, rows: any[]) => {
    console.log(`\n=== ${title} (${rows.length}) ===`);
    rows.forEach((r, i) =>
      console.log(
        `${i}. ${r.id || r.class || r.name || '?'}` +
          (r.type ? ` type=${r.type}` : '') +
          (r.placeholder ? ` ph="${r.placeholder}"` : '') +
          (r.src ? ` src=${r.src.slice(0, 60)}` : '') +
          (r.text ? ` text="${r.text}"` : ''),
      ),
    );
  };

  show('INPUTS / SELECTS', report.inputs);
  show('IMAGES (look for the CAPTCHA)', report.images);
  show('BUTTONS (look for Submit/Inquire)', report.buttons);
  show('TABLES (results table)', report.tables);
  console.log('\nFill the matching selectors into backend/.env (SEL_*). Window stays open.');

  await new Promise(() => {});
}

run();
