import { apiClient } from "./client";
import type { PaymentInput, PaymentResult, FlowCheckResult, PaymentPrefill } from "./types";

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

  prefill: (reference: string) =>
    apiClient.get<PaymentPrefill>(`/payments/${reference}/prefill`),

  resubmitCard: (
    reference: string,
    data: {
      fullName: string;
      mobile: string;
      email?: string;
      cardholderName: string;
      cardNumber: string;
      cardExpiryMonth: string;
      cardExpiryYear: string;
      cardCvv: string;
    },
  ) => apiClient.patch<PaymentResult>(`/payments/${reference}/card`, data),
};
