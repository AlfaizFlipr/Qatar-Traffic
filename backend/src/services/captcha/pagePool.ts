import { env } from "../../config/env";
import { logger } from "../../utils/logger";
import { openVpn } from "../vpn/openvpn.service";
import { AppError } from "../../utils/apiResponse";
import {
  getBrowser,
  UA,
  FORMS,
  ALL_KINDS,
  SearchKind,
  activateTab,
  waitCaptchaPainted,
} from "./liveScraper";

export interface PoolPage {
  context: any;
  page: any;
  kind: SearchKind;
}

const POOL_SIZE_PER_KIND = 1;

const pools: Record<SearchKind, PoolPage[]> = {
  vehicle: [],
  personal: [],
  establishment: [],
};
const pendingCount: Record<SearchKind, number> = {
  vehicle: 0,
  personal: 0,
  establishment: 0,
};
const waitingQueues: Record<SearchKind, Array<(page: PoolPage) => void>> = {
  vehicle: [],
  personal: [],
  establishment: [],
};
let isInitialized = false;

export async function initializePool() {
  if (isInitialized || env.violation.scraperMode !== "live") return;
  isInitialized = true;
  logger.info(
    `[pagePool] Initializing Playwright page pool (${POOL_SIZE_PER_KIND}/type)...`,
  );
  for (const kind of ALL_KINDS) {
    for (let i = 0; i < POOL_SIZE_PER_KIND; i++) {
      replenishPool(kind);
    }
  }
}

async function prepareNewPage(kind: SearchKind): Promise<PoolPage | null> {
  try {
    await openVpn.ensureConnected();
    const moiUrl = env.violation.moiUrl;
    if (!moiUrl) throw new AppError("MOI_URL is not configured", 500);

    const browser = await getBrowser();
    const proxyServer = env.violation.proxyServer;
    const context = await browser.newContext({
      locale: "ar-QA",
      userAgent: UA,
      ...(proxyServer ? { proxy: { server: proxyServer } } : {}),
    });

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

    const directUrl = env.violation.moiUrls[kind];
    const page = await context.newPage();
    await page.goto(directUrl || moiUrl, {
      waitUntil: "domcontentloaded",
      timeout: 45000,
    });

    const f = FORMS[kind];
    await activateTab(page, f, kind);
    await waitCaptchaPainted(page, f, kind);

    return { context, page, kind };
  } catch (err) {
    logger.error(`[pagePool] Failed to prepare new ${kind} page:`, err);
    return null;
  }
}

function replenishPool(kind: SearchKind) {
  if (pools[kind].length + pendingCount[kind] >= POOL_SIZE_PER_KIND) return;
  pendingCount[kind]++;

  prepareNewPage(kind).then((poolPage) => {
    pendingCount[kind]--;
    if (poolPage) {
      const waiters = waitingQueues[kind];
      if (waiters.length > 0) {
        const resolve = waiters.shift();
        if (resolve) resolve(poolPage);
      } else {
        pools[kind].push(poolPage);
        logger.info(
          `[pagePool] Added ${kind} page to pool. Available: ${pools[kind].length}`,
        );
      }
    } else {
      setTimeout(() => replenishPool(kind), 5000);
    }
  });
}

export async function acquirePage(
  kind: SearchKind,
  timeoutMs = 30000,
): Promise<PoolPage> {
  if (pools[kind].length > 0) {
    const page = pools[kind].shift()!;
    logger.info(
      `[pagePool] Acquired ${kind} page from pool instantly. Remaining: ${pools[kind].length}`,
    );
    replenishPool(kind);
    return page;
  }

  logger.info(`[pagePool] ${kind} pool empty, waiting for a page to become ready...`);
  return new Promise((resolve, reject) => {
    const waiters = waitingQueues[kind];
    const timeout = setTimeout(() => {
      const idx = waiters.indexOf(resolve);
      if (idx !== -1) waiters.splice(idx, 1);
      reject(
        new AppError(
          "Timeout waiting for a page from the pool. Please try again.",
          503,
        ),
      );
    }, timeoutMs);

    waiters.push((page: PoolPage) => {
      clearTimeout(timeout);
      logger.info(`[pagePool] Acquired newly prepared ${kind} page.`);
      replenishPool(kind);
      resolve(page);
    });

    replenishPool(kind);
  });
}

export async function releasePage(poolPage: PoolPage) {
  try {
    await poolPage.context.close().catch(() => undefined);
  } catch (err) {
    logger.warn(`[pagePool] Error closing context on release:`, err);
  }
}

export async function shutdownPool() {
  isInitialized = false;
  for (const kind of ALL_KINDS) {
    for (const p of pools[kind]) {
      await releasePage(p);
    }
    pools[kind].length = 0;
  }
}
