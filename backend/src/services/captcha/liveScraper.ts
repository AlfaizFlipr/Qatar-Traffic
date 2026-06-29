import { promises as fs } from "fs";
import path from "path";
import { env } from "../../config/env";
import { logger } from "../../utils/logger";
import { AppError } from "../../utils/apiResponse";
import { openVpn } from "../vpn/openvpn.service";
import {
  ViolationItem,
  ViolationSearchInput,
  ViolationSearchResult,
} from "../../types";

/**
 * Live MOI scraper (Playwright) for https://fees2.moi.gov.qa/moipay/inquiry/violation
 *
 * The portal is a Bootstrap/jQuery page with THREE tabbed forms inside tab-panes:
 *   - vehicle      -> tab #plateNumTab / pane #plateNum / form #frmPlateNum
 *   - personal     -> tab #qidNumTab   / pane #qidNum   / form #frmQid
 *   - establishment-> tab #cpyNumTab   / pane #companyId/ form #frmCpy
 *
 * Critical facts learned from the real DOM (backend/debug/MOI.html):
 *   1. The submit "استعلم" is <button type="button" onclick="formSubmitXxx()"> — NOT
 *      type="submit". So we must click that button (or call its onclick fn), Enter/submit
 *      won't work.
 *   2. Each form lives in a hidden tab-pane. We must click the tab first, otherwise the
 *      id field is hidden (never fills) and the captcha <img> has an empty src.
 *   3. The captcha is loaded by JS when the tab activates; we wait for the image to paint.
 *
 * SEL_* env vars can still override, but the per-tab map below is the source of truth.
 */

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

type SearchKind = "vehicle" | "personal" | "establishment";

interface FormSel {
  tab: string; // tab link that activates the pane
  pane: string; // the tab-pane wrapper
  form: string; // the <form>
  field: string; // identifier input
  captchaImg: string; // captcha <img>
  captchaInput: string; // captcha text input
  submit: string; // the "استعلم" button
  submitFn: string; // onclick function name (called as a JS fallback)
}

const FORMS: Record<SearchKind, FormSel> = {
  vehicle: {
    tab: "#plateNumTab",
    pane: "#plateNum",
    form: "#frmPlateNum",
    field: "#plateNo",
    captchaImg: "#captchaImgPlateNum",
    captchaInput: "#captchaResponsePlateNo",
    submit:
      '#frmPlateNum button.btn-primary, #frmPlateNum button[onclick*="formSubmit" i]',
    submitFn: "formSubmitPlateNumber",
  },
  personal: {
    tab: "#qidNumTab",
    pane: "#qidNum",
    form: "#frmQid",
    field: "#qidNo",
    captchaImg: "#captchaImgQid",
    captchaInput: "#captchaResponseQid",
    submit:
      '#frmQid button.btn-primary, #frmQid button[onclick*="formSubmit" i]',
    submitFn: "formSubmitQid",
  },
  establishment: {
    tab: "#cpyNumTab",
    pane: "#companyId",
    form: "#frmCpy",
    field: "#cpyNo",
    captchaImg: "#captchaImgCompany",
    captchaInput: "#captchaResponseCompany",
    submit:
      '#frmCpy button.btn-primary, #frmCpy button[onclick*="formSubmit" i]',
    submitFn: "formSubmitCompanyId",
  },
};

function kindOf(input: ViolationSearchInput): SearchKind {
  if (input.searchType === "vehicle") return "vehicle";
  if (input.searchType === "establishment") return "establishment";
  return "personal";
}

async function loadPlaywright(): Promise<any> {
  try {
    return await import("playwright" as string);
  } catch {
    throw new AppError(
      "Playwright is not installed. Run: npm i playwright && npx playwright install chromium",
      501,
    );
  }
}

// One shared browser process reused across searches — launching Chromium per request
// costs ~1-3s. Each search still gets its own isolated context (closed when the
// session ends), so cookies/captcha state never leak between users.
let sharedBrowser: any = null;
let browserLaunch: Promise<any> | null = null;

async function getBrowser(): Promise<any> {
  if (sharedBrowser && sharedBrowser.isConnected?.()) return sharedBrowser;
  if (!browserLaunch) {
    const playwright = await loadPlaywright();
    browserLaunch = playwright.chromium
      .launch({ headless: env.violation.headless })
      .then((b: any) => {
        sharedBrowser = b;
        b.on?.("disconnected", () => {
          sharedBrowser = null;
          browserLaunch = null;
        });
        return b;
      })
      .finally(() => {
        browserLaunch = null;
      });
  }
  return browserLaunch;
}

function identifierOf(input: ViolationSearchInput): string {
  return (
    input.plateNumber ||
    input.personalNumber ||
    input.establishmentId ||
    ""
  ).trim();
}

/** Dump the current page HTML to backend/debug for offline selector inspection. */
async function dumpDebugHtml(page: any, label: string): Promise<void> {
  try {
    const html = await page.content();
    const dir = path.resolve(process.cwd(), "debug");
    await fs.mkdir(dir, { recursive: true });
    const file = path.join(dir, `scrape-${label}-${Date.now()}.html`);
    await fs.writeFile(file, html, "utf8");
    logger.info(`[scraper] wrote debug HTML to ${file}`);
  } catch (e) {
    logger.warn("[scraper] failed to write debug HTML: " + String(e));
  }
}

/** Activate the correct tab so its form fields and captcha become visible/loaded. */
async function activateTab(page: any, f: FormSel, ctx: string): Promise<void> {
  try {
    const tab = page.locator(f.tab).first();
    if (((await tab.count?.()) ?? 0) > 0) {
      await tab.click({ timeout: 5000 }).catch(() => undefined);
      logger.info(`[scraper] activated tab ${f.tab} (${ctx})`);
    }
  } catch (e) {
    logger.warn(
      `[scraper] could not click tab ${f.tab} (${ctx}): ${String(e)}`,
    );
  }
  // Wait for the pane to be visible.
  await page
    .locator(f.pane)
    .first()
    .waitFor({ state: "visible", timeout: 10000 })
    .catch(() => undefined);
}

/** Fill the identifier into the active form's field(s). */
async function fillIdentifier(
  page: any,
  kind: SearchKind,
  value: string,
  ctx: string,
): Promise<void> {
  if (!value) return;
  const f = FORMS[kind];

  if (kind === "establishment") {
    // Company id is 3 boxes: type(2) / no(4) / brn(2). Accept "type-no-brn" or a digit run.
    const parts = value.split(/[-/ ]+/).filter(Boolean);
    let type = "";
    let no = "";
    let brn = "";
    if (parts.length === 3) {
      [type, no, brn] = parts;
    } else {
      const digits = value.replace(/\D/g, "");
      type = digits.slice(0, 2);
      no = digits.slice(2, 6);
      brn = digits.slice(6, 8);
    }
    const set = async (sel: string, v: string) => {
      if (!v) return;
      await page
        .locator(sel)
        .first()
        .fill(v)
        .catch(() => undefined);
    };
    await set("#cpyType", type);
    await set("#cpyNo", no);
    await set("#cpyBrnNo", brn);
    logger.info(`[scraper] filled company id boxes (${ctx})`);
    return;
  }

  try {
    const loc = page.locator(f.field).first();
    await loc.waitFor({ state: "visible", timeout: 8000 });
    await loc.fill(value);
    logger.info(`[scraper] filled identifier via ${f.field} (${ctx})`);
  } catch (e) {
    logger.warn(
      `[scraper] could not fill identifier ${f.field} (${ctx}): ${String(e)}`,
    );
  }
}

/** Wait for the captcha image to actually render (it loads via JS on tab activation). */
async function waitCaptchaPainted(
  page: any,
  f: FormSel,
  ctx: string,
): Promise<void> {
  const painted = await page
    .waitForFunction(
      (sel: string) => {
        const img = document.querySelector(sel) as HTMLImageElement | null;
        return !!img && img.complete && img.naturalWidth > 0;
      },
      f.captchaImg,
      { timeout: 8000 },
    )
    .then(() => true)
    .catch(() => false);

  if (!painted) {
    // Trigger a refresh via the refresh link inside this form, then wait again.
    await page
      .locator(`${f.form} .refreshCaptcha a`)
      .first()
      .click({ timeout: 3000 })
      .catch(() => undefined);
    await page
      .waitForFunction(
        (sel: string) => {
          const img = document.querySelector(sel) as HTMLImageElement | null;
          return !!img && img.complete && img.naturalWidth > 0;
        },
        f.captchaImg,
        { timeout: 8000 },
      )
      .catch(() =>
        logger.warn(`[scraper] captcha image still not painted (${ctx})`),
      );
  }
}

/** Step 1: open the portal, switch to the right tab, fill the id, and capture the CAPTCHA. */
export async function openAndCaptureCaptcha(
  input: ViolationSearchInput,
): Promise<{
  context: any;
  page: any;
  captchaImage: string;
  formContext?: string;
}> {
  await openVpn.ensureConnected();

  const moiUrl = env.violation.moiUrl;
  if (!moiUrl) throw new AppError("MOI_URL is not configured", 500);

  const kind = kindOf(input);
  const f = FORMS[kind];
  const browser = await getBrowser();
  let context: any;

  try {
    const proxyServer = env.violation.proxyServer;
    context = await browser.newContext({
      locale: "ar-QA",
      userAgent: UA,
      ...(proxyServer ? { proxy: { server: proxyServer } } : {}),
    });

    // Speed: skip fonts, media and decorative images (logo, banner, metrash slides).
    // Keep CSS (needed for tab visibility detection) and the captcha image itself.
    await context
      .route("**/*", (route: any) => {
        const req = route.request();
        const type = req.resourceType();
        const url = req.url();
        if (type === "font" || type === "media") return route.abort();
        if (type === "image" && !/captcha/i.test(url)) return route.abort();
        return route.continue();
      })
      .catch(() => undefined);

    const page = await context.newPage();
    try {
      await page.goto(moiUrl, {
        waitUntil: "domcontentloaded",
        timeout: 45000,
      });
    } catch (e) {
      if (
        /ERR_CONNECTION_TIMED_OUT|ERR_TIMED_OUT|ERR_NAME_NOT_RESOLVED|ERR_CONNECTION_RESET/i.test(
          (e as Error).message,
        )
      ) {
        throw new AppError(
          "Cannot reach the MOI portal. It is only accessible from a Qatar IP — " +
            "make sure the OpenVPN tunnel is connected before searching.",
          502,
        );
      }
      throw e;
    }

    await activateTab(page, f, kind);
    await fillIdentifier(page, kind, identifierOf(input), kind);
    await waitCaptchaPainted(page, f, kind);

    const captchaLocator = page.locator(f.captchaImg).first();
    await captchaLocator
      .waitFor({ state: "visible", timeout: 10000 })
      .catch(() => {
        throw new AppError(
          `CAPTCHA image (${f.captchaImg}) not found on the MOI page for the ${kind} form.`,
          502,
        );
      });
    const buffer: Buffer = await captchaLocator.screenshot();
    const captchaImage = `data:image/png;base64,${buffer.toString("base64")}`;

    logger.info(`[scraper] captured captcha image for ${kind} search`);
    return { context, page, captchaImage, formContext: kind };
  } catch (err) {
    // Only tear down this search's context — keep the shared browser alive.
    await context?.close().catch(() => undefined);
    throw err;
  }
}

/** Submit the active form: click the استعلم button, fall back to its onclick fn, then Enter. */
async function submitForm(
  page: any,
  f: FormSel,
  captchaLocator: any,
  ctx: string,
): Promise<void> {
  const btn = page.locator(f.submit).first();
  if (
    ((await btn.count?.()) ?? 0) > 0 &&
    (await btn.isVisible?.().catch(() => false))
  ) {
    try {
      await btn.click({ timeout: 5000 });
      logger.info(`[scraper] clicked submit button (${ctx})`);
      return;
    } catch (e) {
      logger.warn(`[scraper] submit click failed (${ctx}): ${String(e)}`);
    }
  }

  // Fallback: invoke the page's own submit function (the onclick handler).
  const called = await page
    .evaluate((fn: string) => {
      const w = window as any;
      if (typeof w[fn] === "function") {
        w[fn]();
        return true;
      }
      return false;
    }, f.submitFn)
    .catch(() => false);
  if (called) {
    logger.info(`[scraper] invoked ${f.submitFn}() directly (${ctx})`);
    return;
  }

  logger.warn(
    `[scraper] submit button/fn unavailable, pressing Enter (${ctx})`,
  );
  await captchaLocator.press("Enter").catch(() => undefined);
}

/**
 * Wait until the page reaches a DECISIVE state after submitting: either violation rows
 * rendered, an explicit "no data" popup, or a captcha/validation error. This prevents
 * reading the page too early (which previously returned a false "empty").
 */
async function waitForDecisiveOutcome(
  page: any,
  timeout: number,
  ctx: string,
): Promise<void> {
  // Poll fast (every 100ms) for the FIRST decisive signal and return the moment it appears.
  const decided = await page
    .waitForFunction(
      () => {
        const vis = (el: Element) => {
          const r = (el as HTMLElement).getBoundingClientRect();
          const s = getComputedStyle(el as HTMLElement);
          return (
            r.width > 0 &&
            r.height > 0 &&
            s.display !== "none" &&
            s.visibility !== "hidden"
          );
        };
        // 1) Results rendered.
        if (document.querySelector("a[data-vlnnumber]")) return true;
        // 2) Sweet-alert popup (no-data or error message).
        if (
          document.querySelector(
            ".sweet-alert.visible, .sweet-alert.showSweetAlert, .swal-overlay--show-modal, .swal2-shown",
          )
        ) {
          return true;
        }
        // 3) Inline validation/captcha error became visible.
        const errs = Array.from(
          document.querySelectorAll(".errorMsg, #captchaResponseErrMsg"),
        );
        if (
          errs.some((el) => vis(el) && (el.textContent || "").trim().length > 0)
        )
          return true;
        return false;
      },
      { timeout, polling: 100 },
    )
    .then(() => true)
    .catch(() => false);

  if (decided) return; // results/popup already present — read immediately, no extra waiting.

  // Nothing decisive within the timeout: give the network a brief chance, then read.
  logger.info(
    `[scraper] decisive-outcome wait timed out, reading current state (${ctx})`,
  );
  await page
    .waitForLoadState?.("networkidle", { timeout: 2000 })
    .catch(() => undefined);
}

export interface ScrapedViolation {
  reference: string;
  date: string;
  time: string;
  description: string;
  amount: number; // amount to pay (after discount)
  originalAmount: number;
  discount: number;
  location: string;
  plateNumber: string;
  plateType: string;
}

/**
 * Read the outcome from the results page. The MOI "Pay Traffic Violations" page renders
 * each violation as a row whose <a class="reference-link"> carries all the real data in
 * data-* attributes (data-vlnnumber / data-vlndate / data-vlndesc / data-amounttopay …),
 * which is far more reliable than the visible cell text (the first <td> is just a
 * checkbox). We parse those attributes directly.
 */
async function readOutcome(
  page: any,
): Promise<{
  kind: "results" | "empty" | "captcha" | "unknown";
  items: ScrapedViolation[];
}> {
  return page.evaluate(() => {
    const isVisible = (el: Element) => {
      const r = (el as HTMLElement).getBoundingClientRect();
      const cs = getComputedStyle(el as HTMLElement);
      return (
        r.width > 0 &&
        r.height > 0 &&
        cs.visibility !== "hidden" &&
        cs.display !== "none"
      );
    };
    const num = (v: string | null) =>
      Number(String(v ?? "").replace(/[^\d.]/g, "")) || 0;
    const clean = (v: string | null) => (v ?? "").replace(/\s+/g, " ").trim();

    // 1) Violations: anchors carrying data-vlnnumber.
    const anchors = Array.from(
      document.querySelectorAll(
        "a.reference-link[data-vlnnumber], a[data-vlnnumber]",
      ),
    );
    if (anchors.length > 0) {
      const items = anchors.map((a) => {
        const d = (k: string) => a.getAttribute(k);
        const street = clean(d("data-vlnstreet"));
        const zone = clean(d("data-vlnzone"));
        const country = clean(d("data-vlncountry"));
        const location = [street, zone, country].filter(Boolean).join(", ");
        return {
          reference: clean(d("data-vlnnumber")),
          date: clean(d("data-vlndate")),
          time: clean(d("data-vlntime")),
          description: clean(d("data-vlndesc")),
          amount: num(d("data-amounttopay")) || num(d("data-violationamt")),
          originalAmount: num(d("data-violationamt")),
          discount: num(d("data-discountamt")),
          location,
          plateNumber: clean(d("data-pltnum")),
          plateType: clean(d("data-plttype")),
        };
      });
      return { kind: "results" as const, items };
    }

    // Collect any visible message text: sweet-alert popup + inline .errorMsg spans.
    const alertEls = Array.from(
      document.querySelectorAll(
        ".sweet-alert.visible, .sweet-alert.showSweetAlert, .swal-modal, .swal2-popup, .errorMsg, #captchaResponseErrMsg",
      ),
    ).filter((el) => isVisible(el));
    const msgText = alertEls
      .map((el) => (el.textContent || "").trim())
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    const isCaptchaMsg = /تحقق|الرمز|captcha|رمز|code|غير صحيح|invalid/.test(
      msgText,
    );
    const isEmptyMsg =
      /لا يوجد بيانات|لا توجد|no violation|no records|no data|not found/.test(
        msgText,
      );

    // 2) No-data popup -> genuinely empty (only when explicitly stated).
    if (isEmptyMsg) return { kind: "empty" as const, items: [] as any[] };

    // 3) Captcha / validation error.
    if (isCaptchaMsg) return { kind: "captcha" as const, items: [] as any[] };

    // 4) Reached the pay/results page but it has a real (empty) violations table -> empty.
    const bodyText = (document.body.textContent || "").toLowerCase();
    const onResultsPage =
      document.querySelector(".violations-table tbody, #plateTable tbody") ||
      /pay traffic violations|دفع المخالفات المرورية/i.test(bodyText);
    if (onResultsPage) return { kind: "empty" as const, items: [] as any[] };

    // 5) Any other visible popup/error we don't recognise -> surface as captcha retry.
    if (msgText.length > 0)
      return { kind: "captcha" as const, items: [] as any[] };

    return { kind: "unknown" as const, items: [] as any[] };
  });
}

/** Step 2: type the solved CAPTCHA, submit, and parse the results (or "no results"). */
export async function submitAndParse(
  page: any,
  input: ViolationSearchInput,
  captchaCode: string,
  formContext?: string,
): Promise<ViolationSearchResult> {
  const DEFAULT_TIMEOUT = Number(env.violation.captchaTimeoutMs || 30000);
  const kind = (formContext as SearchKind) || kindOf(input);
  const f = FORMS[kind] || FORMS.personal;
  const ctx = kind;

  const captchaLocator = page.locator(f.captchaInput).first();
  try {
    await captchaLocator.waitFor({
      state: "visible",
      timeout: DEFAULT_TIMEOUT,
    });
  } catch {
    throw new AppError(
      `CAPTCHA input (${f.captchaInput}) not found on the MOI page (${ctx}).`,
      502,
    );
  }

  let outcome: {
    kind: "results" | "empty" | "captcha" | "unknown";
    items: ScrapedViolation[];
  } = {
    kind: "unknown",
    items: [],
  };

  for (let attempt = 1; attempt <= 2 && outcome.kind === "unknown"; attempt++) {
    await captchaLocator.fill("").catch(() => undefined);
    await captchaLocator
      .fill(captchaCode)
      .catch((e: any) =>
        logger.warn(
          `[scraper] fill captcha failed (attempt ${attempt}, ${ctx}): ${String(e)}`,
        ),
      );

    await submitForm(page, f, captchaLocator, ctx);

    logger.info(
      `[scraper] waiting for results (attempt ${attempt}, timeout ${DEFAULT_TIMEOUT}ms, ${ctx})`,
    );
    await waitForDecisiveOutcome(page, DEFAULT_TIMEOUT, ctx);

    outcome = await readOutcome(page).catch(() => ({
      kind: "unknown" as const,
      items: [],
    }));

    if (outcome.kind === "captcha") {
      throw new AppError("Verification code incorrect. Please try again.", 400);
    }
    if (outcome.kind === "unknown" && attempt === 1) {
      logger.info(`[scraper] no clear outcome yet, retrying once (${ctx})`);
    }
  }

  const identifier = identifierOf(input);

  if (outcome.kind === "unknown") {
    await dumpDebugHtml(page, ctx);
    logger.warn(
      `[scraper] no outcome found after retries (${ctx}). A debug HTML snapshot was saved to ` +
        `backend/debug — open it to confirm the real results/error markup.`,
    );
    throw new AppError(
      "The MOI portal did not return a recognizable result. The verification code may be wrong, " +
        "or the page changed. Please try again.",
      400,
    );
  }

  if (outcome.kind === "empty") {
    logger.info(`[scraper] no violations for ${identifier} (${ctx})`);
    return buildResult(input, []);
  }

  const violations: ViolationItem[] = outcome.items
    .map((it) => ({
      reference: it.reference,
      type: it.description,
      typeAr: it.description,
      description: it.description,
      descriptionAr: it.description,
      date: [it.date, it.time].filter(Boolean).join(" ").trim(),
      location: it.location,
      locationAr: it.location,
      amount: it.amount,
      points: 0,
      status: "Pending" as const,
    }))
    .filter((v) => v.reference || v.description);

  logger.info(
    `[scraper] parsed ${violations.length} violations for ${identifier} (${ctx})`,
  );
  return buildResult(input, violations);
}

function buildResult(
  input: ViolationSearchInput,
  violations: ViolationItem[],
): ViolationSearchResult {
  return {
    referenceId: `MOI-${Date.now().toString(36).toUpperCase()}`,
    searchType: input.searchType,
    identifier: identifierOf(input),
    owner: { name: "", nameAr: "" },
    violations,
    totalAmount: violations
      .filter((v) => v.status !== "Paid")
      .reduce((s, v) => s + v.amount, 0),
    totalCount: violations.length,
    currency: "QAR",
  };
}
