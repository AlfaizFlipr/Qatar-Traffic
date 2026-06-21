/**
 * Opens MOI_URL in a VISIBLE Chromium window so you can inspect the real DOM and
 * copy the selectors needed by liveScraper.ts (plate input, captcha img, submit,
 * results table, etc.). Requires Playwright:
 *
 *   npm i playwright && npx playwright install chromium
 *   MOI_URL=https://<real-moi-page> npm run inspect
 *
 * In the opened DevTools, right-click an element -> Copy -> Copy selector.
 * The window stays open until you press Ctrl+C here.
 */
import 'dotenv/config';

async function run() {
  const url = process.env.MOI_URL;
  if (!url) {
    console.error('Set MOI_URL first, e.g.  MOI_URL=https://<real-moi-page> npm run inspect');
    process.exit(1);
  }

  let playwright: any;
  try {
    playwright = await import('playwright' as string);
  } catch {
    console.error('Playwright is not installed. Run: npm i playwright && npx playwright install chromium');
    process.exit(1);
  }

  console.log(`Opening ${url} ... (close with Ctrl+C)`);
  const browser = await playwright.chromium.launch({ headless: false, devtools: true });
  const page = await browser.newPage({ locale: 'ar-QA' });
  await page.goto(url, { waitUntil: 'domcontentloaded' }).catch(() => undefined);

  // Keep the process alive so the window stays open for manual inspection.
  await new Promise(() => {});
}

run();
