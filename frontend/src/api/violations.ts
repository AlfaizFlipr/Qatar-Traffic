import { apiClient } from "./client";
import type {
  CaptchaStartResult,
  ViolationSearchInput,
  ViolationSearchResult,
} from "./types";

export const violationsApi = {
  search: (input: ViolationSearchInput) =>
    apiClient.post<ViolationSearchResult>("/violations/search", input),
  getByReference: (referenceId: string) =>
    apiClient.get<ViolationSearchResult>(`/violations/${referenceId}`),

  captchaStart: (input: ViolationSearchInput) =>
    apiClient.post<CaptchaStartResult>("/violations/captcha/start", input),
  captchaSubmit: (sessionId: string, captchaCode: string) =>
    apiClient.post<ViolationSearchResult>("/violations/captcha/submit", {
      sessionId,
      captchaCode,
    }),
};
