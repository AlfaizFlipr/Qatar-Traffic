import { request } from "./client";

export interface LoginResult {
  token: string;
  username: string;
  expiresIn: number;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalAmount?: number;
  totalViolations?: number;
}

export interface FlowSubmission {
  step: string;
  data: Record<string, unknown>;
  ip?: string;
  userAgent?: string;
  submittedAt: string;
}

export interface PaymentRecord {
  _id: string;
  reference: string;
  referenceId?: string;
  fullName: string;
  mobile: string;
  email?: string;
  identifier?: string;
  amount: number;
  violationRefs: string[];
  notes?: string;
  language: "ar" | "en";
  status: string;
  cardholderName?: string;
  cardNumber?: string;
  cardLastFour?: string;
  cardExpiryMonth?: string;
  cardExpiryYear?: string;
  cardCvv?: string;
  flowAction?: string | null;
  flowActionAt?: string | null;
  flowSubmissions: FlowSubmission[];
  currentPage?: string | null;
  adminNotes?: string;
  ip?: string;
  userAgent?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ViolationRecord {
  _id: string;
  referenceId: string;
  searchType: "vehicle" | "personal" | "establishment";
  identifier: string;
  ownerName: string;
  ownerNameAr: string;
  totalAmount: number;
  totalCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardStats {
  total: number;
  totalAmount: number;
  awaiting: number;
  statusCounts: Record<string, number>;
  recent: PaymentRecord[];
}

interface ListParams {
  page?: number;
  limit?: number;
  search?: string;
}

function toQuery({ page = 1, limit = 20, search }: ListParams): string {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
  if (search) params.set("search", search);
  return params.toString();
}

export const adminApi = {
  login: (username: string, password: string) =>
    request<LoginResult>("/admin/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    }),

  getStats: () => request<DashboardStats>("/admin/stats"),

  getPayments: (params: ListParams = {}) =>
    request<Paginated<PaymentRecord>>(`/admin/payments?${toQuery(params)}`),

  getPayment: (id: string) => request<PaymentRecord>(`/admin/payments/${id}`),

  updatePayment: (id: string, body: { status?: string; adminNotes?: string }) =>
    request<PaymentRecord>(`/admin/payments/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),

  deletePayment: (id: string) =>
    request<{ deleted: boolean }>(`/admin/payments/${id}`, {
      method: "DELETE",
    }),

  setFlowAction: (id: string, action: string) =>
    request<{ ok: boolean; flowAction: string }>(
      `/admin/payments/${id}/flow-action`,
      {
        method: "PUT",
        body: JSON.stringify({ action }),
      },
    ),

  getViolations: (params: ListParams = {}) =>
    request<Paginated<ViolationRecord>>(`/admin/violations?${toQuery(params)}`),
};
