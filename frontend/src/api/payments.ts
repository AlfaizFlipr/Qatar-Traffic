import { apiClient } from "./client";
import type { PaymentInput, PaymentResult, FlowCheckResult } from "./types";

export const paymentsApi = {
  create: (input: PaymentInput) =>
    apiClient.post<PaymentResult>("/payments", input),

  flowCheck: (reference: string, page?: string) => {
    const qs = page ? "?page=" + encodeURIComponent(page) : "";
    return apiClient.get<FlowCheckResult>(
      `/payments/${reference}/flow-check${qs}`,
    );
  },

  flowStep: (reference: string, step: string, data: Record<string, unknown>) =>
    apiClient.post<{ ok: boolean }>(`/payments/${reference}/flow-step`, {
      step,
      data,
    }),
};
