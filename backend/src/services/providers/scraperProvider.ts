import { env } from '../../config/env';
import { logger } from '../../utils/logger';
import { AppError } from '../../utils/apiResponse';
import { ViolationSearchInput, ViolationSearchResult } from '../../types';
import { generateMockResult } from './mockProvider';

/**
 * Playwright-based scraper for the Qatar MOI traffic-violations portal.
 *
 * Architecture (Option B — own API):
 *   React App  ->  this Express API  ->  Playwright (headless Chromium)  ->  MOI website
 *
 * Enable with VIOLATION_PROVIDER=scraper and set MOI_URL.
 *
 * NOTES / LIMITATIONS:
 *  - Playwright is imported lazily so the backend runs even if it isn't installed.
 *    Install it when you want live scraping:  npm i playwright && npx playwright install chromium
 *  - The official portal protects the form with a CAPTCHA. Full automation requires a
 *    CAPTCHA-handling strategy (manual relay, a solving service, or an official API key).
 *    The selectors below are placeholders — adjust them to the live DOM.
 *  - If scraping cannot complete, we fall back to deterministic mock data so the API
 *    never hard-fails in development. Flip SCRAPER_STRICT=true to throw instead.
 */

/* Untyped on purpose: playwright is an optional dependency that may not be installed. */
async function loadPlaywright(): Promise<any | null> {
  try {
    return await import('playwright' as string);
  } catch {
    logger.warn('Playwright is not installed; scraper provider will fall back to mock data.');
    return null;
  }
}

export async function fetchScrapedResult(input: ViolationSearchInput): Promise<ViolationSearchResult> {
  const strict = process.env.SCRAPER_STRICT === 'true';
  const moiUrl = process.env.MOI_URL || env.violation.apiUrl;

  if (!moiUrl) {
    if (strict) throw new AppError('MOI_URL is not configured for the scraper provider', 500);
    logger.warn('MOI_URL not set — falling back to mock data.');
    return generateMockResult(input);
  }

  const playwright = await loadPlaywright();
  if (!playwright) {
    if (strict) throw new AppError('Playwright not installed', 500);
    return generateMockResult(input);
  }

  const browser = await playwright.chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ locale: 'ar-QA' });
    await page.goto(moiUrl, { waitUntil: 'networkidle', timeout: 30000 });

    // --- Form fill scaffold (adjust selectors to the live MOI DOM) ---
    if (input.searchType === 'vehicle' && input.plateNumber) {
      await page.fill('#plateNumber', input.plateNumber).catch(() => undefined);
    } else if (input.searchType === 'personal' && input.personalNumber) {
      await page.fill('#personalNumber', input.personalNumber).catch(() => undefined);
    } else if (input.searchType === 'establishment' && input.establishmentId) {
      await page.fill('#establishmentId', input.establishmentId).catch(() => undefined);
    }

    // CAPTCHA handling would go here before submitting.
    // await page.click('#submit');
    // await page.waitForSelector('.violations-table');
    // const rows = await page.$$eval('.violations-row', ...);

    throw new AppError(
      'Live MOI scraping requires CAPTCHA handling and verified selectors. ' +
        'Complete scraperProvider.ts, then it will return parsed violations here.',
      501
    );
  } catch (err) {
    if (strict) throw err;
    logger.warn('Scraper failed, returning mock data:', (err as Error).message);
    return generateMockResult(input);
  } finally {
    await browser.close().catch(() => undefined);
  }
}
