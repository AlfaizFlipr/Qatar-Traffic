import { randomUUID } from "crypto";
import { env } from "../../config/env";
import { AppError } from "../../utils/apiResponse";
import { TTLCache } from "../../utils/cache";
import { logger } from "../../utils/logger";
import { violationDao } from "../../dao/violation.dao";
import { ViolationSearchInput, ViolationSearchResult } from "../../types";
import { generateMockResult } from "../providers/mockProvider";
import { generateCaptcha } from "./captchaImage";
import { sessionStore, SessionMode } from "./sessionStore";
import { openAndCaptureCaptcha, submitAndParse } from "./liveScraper";

const CACHE_TTL_MS = Number(process.env.CACHE_TTL_MS || 10 * 60 * 1000);
const resultCache = new TTLCache<ViolationSearchResult>(CACHE_TTL_MS);

function mode(): SessionMode {
  return env.violation.scraperMode === "live" ? "live" : "simulated";
}

function identifierOf(input: ViolationSearchInput): string {
  return (
    input.plateNumber ||
    input.personalNumber ||
    input.establishmentId ||
    ""
  ).trim();
}

export type StartResponse =
  | { cached: true; result: ViolationSearchResult }
  | {
      cached: false;
      captchaRequired: true;
      sessionId: string;
      captchaImage: string;
      mode: SessionMode;
    };

export const captchaService = {
  async start(input: ViolationSearchInput): Promise<StartResponse> {
    const identifier = identifierOf(input);

    const cached = resultCache.get(`${input.searchType}:${identifier}`);
    if (cached) {
      logger.info(`Cache hit for ${identifier}`);
      return { cached: true, result: cached };
    }

    const id = randomUUID();
    const currentMode = mode();

    if (currentMode === "live") {
      const { context, page, captchaImage, formContext } =
        await openAndCaptureCaptcha(input);
      sessionStore.create({
        id,
        mode: "live",
        identifier,
        input,
        context,
        page,
        formContext,
      });
      return {
        cached: false,
        captchaRequired: true,
        sessionId: id,
        captchaImage,
        mode: "live",
      };
    }

    // simulated
    const challenge = generateCaptcha();
    sessionStore.create({
      id,
      mode: "simulated",
      identifier,
      input,
      expectedCode: challenge.code,
    });
    return {
      cached: false,
      captchaRequired: true,
      sessionId: id,
      captchaImage: challenge.image,
      mode: "simulated",
    };
  },

  /** Step 2 — verify the typed CAPTCHA, fetch + parse violations, cache, and return. */
  async submit(
    sessionId: string,
    captchaCode: string,
  ): Promise<ViolationSearchResult> {
    const session = sessionStore.get(sessionId);
    if (!session)
      throw new AppError("CAPTCHA session expired. Please search again.", 410);

    const code = captchaCode.trim();
    let result: ViolationSearchResult;

    try {
      if (session.mode === "live") {
        result = await submitAndParse(
          session.page,
          session.input,
          code,
          session.formContext,
        );
      } else {
        if (code.toUpperCase() !== (session.expectedCode ?? "").toUpperCase()) {
          throw new AppError("Verification code incorrect.", 400);
        }
        // CAPTCHA passed -> resolve data. (Mock data in simulated mode.)
        result = generateMockResult(session.input);
      }
    } finally {
      await sessionStore.destroy(sessionId);
    }

    resultCache.set(`${result.searchType}:${result.identifier}`, result);
    try {
      await violationDao.upsertByReference(result);
    } catch (err) {
      logger.warn("Failed to persist scraped result", err);
    }

    return result;
  },

  activeMode: mode,
  configuredProvider: env.violation.provider,
};
