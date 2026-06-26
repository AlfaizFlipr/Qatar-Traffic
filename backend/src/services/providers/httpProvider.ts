import axios from "axios";
import { env } from "../../config/env";
import { AppError } from "../../utils/apiResponse";
import { ViolationSearchInput, ViolationSearchResult } from "../../types";

/**
 * Real upstream provider. Enable with VIOLATION_PROVIDER=http and set
 * VIOLATION_API_URL (+ optional VIOLATION_API_KEY). The upstream is expected
 * to accept the search input and return a ViolationSearchResult-shaped body.
 * Adjust the mapping below to match the actual API you plug in.
 */
export async function fetchHttpResult(
  input: ViolationSearchInput,
): Promise<ViolationSearchResult> {
  if (!env.violation.apiUrl) {
    throw new AppError("VIOLATION_API_URL is not configured", 500);
  }

  const { data } = await axios.post(env.violation.apiUrl, input, {
    timeout: 15000,
    headers: env.violation.apiKey
      ? { Authorization: `Bearer ${env.violation.apiKey}` }
      : undefined,
  });

  // The upstream is assumed to already return our shape. Map here if it differs.
  return data as ViolationSearchResult;
}
