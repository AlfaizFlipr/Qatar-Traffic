import { env } from '../../config/env';
import { logger } from '../../utils/logger';
import { AppError } from '../../utils/apiResponse';
import { ViolationItem, ViolationSearchInput, ViolationSearchResult } from '../../types';

/**
 * Live MOI scraper (Playwright). Lazy-loaded so the backend runs without it.
 * Enable with VIOLATION_PROVIDER=scraper and SCRAPER_MODE=live, then:
 *   npm i playwright && npx playwright install chromium
 *
 * The CSS selectors below are PLACEHOLDERS — open the real portal, inspect the
 * DOM, and replace SEL.* with the actual selectors. The flow itself is complete.
 */

// >>> Adjust these to the live MOI DOM <<<
const SEL = {
  plateNumber: '#plateNumber',
  personalNumber: '#personalNumber',
  establishmentId: '#establishmentId',
  captchaImage: 'img.captcha',
  captchaInput: '#captchaInput',
  submit: 'button[type="submit"]',
  resultsTable: '.results-table',
  resultRow: '.results-table tbody tr',
};

async function loadPlaywright(): Promise<any> {
  try {
    return await import('playwright' as string);
  } catch {
    throw new AppError(
      'Playwright is not installed. Run: npm i playwright && npx playwright install chromium',
      501
    );
  }
}

/** Step 1: open the portal, fill the identifier, and capture the CAPTCHA image. */
export async function openAndCaptureCaptcha(
  input: ViolationSearchInput
): Promise<{ browser: any; page: any; captchaImage: string }> {
  const moiUrl = process.env.MOI_URL || env.violation.apiUrl;
  if (!moiUrl) throw new AppError('MOI_URL is not configured', 500);

  const playwright = await loadPlaywright();
  const browser = await playwright.chromium.launch({ headless: true });

  try {
    const page = await browser.newPage({ locale: 'ar-QA' });
    await page.goto(moiUrl, { waitUntil: 'networkidle', timeout: 30000 });

    // Pre-fill the identifier so only the CAPTCHA remains for the user.
    if (input.searchType === 'vehicle' && input.plateNumber) {
      await page.fill(SEL.plateNumber, input.plateNumber).catch(() => undefined);
    } else if (input.searchType === 'personal' && input.personalNumber) {
      await page.fill(SEL.personalNumber, input.personalNumber).catch(() => undefined);
    } else if (input.searchType === 'establishment' && input.establishmentId) {
      await page.fill(SEL.establishmentId, input.establishmentId).catch(() => undefined);
    }

    const captcha = page.locator(SEL.captchaImage);
    const buffer: Buffer = await captcha.screenshot();
    const captchaImage = `data:image/png;base64,${buffer.toString('base64')}`;

    return { browser, page, captchaImage };
  } catch (err) {
    await browser.close().catch(() => undefined);
    throw err;
  }
}

/** Step 2: type the CAPTCHA the user solved, submit, and parse the results. */
export async function submitAndParse(
  page: any,
  input: ViolationSearchInput,
  captchaCode: string
): Promise<ViolationSearchResult> {
  await page.fill(SEL.captchaInput, captchaCode);
  await page.click(SEL.submit);

  // Either results appear or the CAPTCHA was wrong (portal re-renders it).
  await page.waitForSelector(SEL.resultsTable, { timeout: 15000 }).catch(() => {
    throw new AppError('Verification code incorrect or no results returned.', 400);
  });

  const rows: Array<Record<string, string>> = await page.$$eval(SEL.resultRow, (els: Element[]) =>
    els.map((row) => {
      const cols = row.querySelectorAll('td');
      return {
        violationNo: cols[0]?.textContent?.trim() ?? '',
        date: cols[1]?.textContent?.trim() ?? '',
        description: cols[2]?.textContent?.trim() ?? '',
        amount: cols[3]?.textContent?.trim() ?? '',
      };
    })
  );

  const violations: ViolationItem[] = rows.map((r) => {
    const amount = Number(String(r.amount).replace(/[^\d.]/g, '')) || 0;
    return {
      reference: r.violationNo,
      type: r.description,
      typeAr: r.description,
      description: r.description,
      descriptionAr: r.description,
      date: r.date,
      location: '',
      locationAr: '',
      amount,
      points: 0,
      status: 'Pending',
    };
  });

  const identifier = input.plateNumber || input.personalNumber || input.establishmentId || '';
  logger.info(`Scraped ${violations.length} violations for ${identifier}`);

  return {
    referenceId: `MOI-${Date.now().toString(36).toUpperCase()}`,
    searchType: input.searchType,
    identifier,
    owner: { name: '', nameAr: '' },
    violations,
    totalAmount: violations.filter((v) => v.status !== 'Paid').reduce((s, v) => s + v.amount, 0),
    totalCount: violations.length,
    currency: 'QAR',
  };
}
