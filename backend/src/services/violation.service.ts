import { env } from "../config/env";
import { violationDao } from "../dao/violation.dao";
import { logger } from "../utils/logger";
import { ViolationSearchInput, ViolationSearchResult } from "../types";
import { generateMockResult } from "./providers/mockProvider";
import { fetchHttpResult } from "./providers/httpProvider";
import { fetchScrapedResult } from "./providers/scraperProvider";

async function resolveFromProvider(
  input: ViolationSearchInput,
): Promise<ViolationSearchResult> {
  switch (env.violation.provider) {
    case "http":
      return fetchHttpResult(input);
    case "scraper":
      return fetchScrapedResult(input);
    default:
      return generateMockResult(input);
  }
}

export const violationService = {
  async search(input: ViolationSearchInput): Promise<ViolationSearchResult> {
    const result = await resolveFromProvider(input);

    // Persist for audit + later reference lookups (best-effort; never blocks the response).
    try {
      await violationDao.upsertByReference(result);
    } catch (err) {
      logger.warn("Failed to persist violation record", err);
    }

    return result;
  },

  async getByReference(
    referenceId: string,
  ): Promise<ViolationSearchResult | null> {
    const doc = await violationDao.findByReference(referenceId);
    if (!doc) return null;
    return {
      referenceId: doc.referenceId,
      searchType: doc.searchType,
      identifier: doc.identifier,
      owner: { name: doc.ownerName, nameAr: doc.ownerNameAr },
      violations: doc.violations,
      totalAmount: doc.totalAmount,
      totalCount: doc.totalCount,
      currency: "QAR",
    };
  },
};
