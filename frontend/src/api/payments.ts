import { apiClient } from './client'
import type { PaymentInput, PaymentResult } from './types'

export const paymentsApi = {
  create: (input: PaymentInput) => apiClient.post<PaymentResult>('/payments', input),
}
