import { request } from './client'

export interface LoginResult {
  token: string
  username: string
  expiresIn: number
}

export interface Paginated<T> {
  items: T[]
  total: number
  page: number
  limit: number
  totalAmount?: number
  totalViolations?: number
}

export interface PaymentRecord {
  _id: string
  reference: string
  referenceId?: string
  fullName: string
  mobile: string
  email?: string
  identifier?: string
  amount: number
  violationRefs: string[]
  notes?: string
  language: 'ar' | 'en'
  status: string
  ip?: string
  createdAt: string
  updatedAt: string
}

export interface ViolationRecord {
  _id: string
  referenceId: string
  searchType: 'vehicle' | 'personal' | 'establishment'
  identifier: string
  ownerName: string
  ownerNameAr: string
  totalAmount: number
  totalCount: number
  createdAt: string
  updatedAt: string
}

interface ListParams {
  page?: number
  limit?: number
  search?: string
}

function toQuery({ page = 1, limit = 20, search }: ListParams): string {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) })
  if (search) params.set('search', search)
  return params.toString()
}

export const adminApi = {
  login: (username: string, password: string) =>
    request<LoginResult>('/admin/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),

  getPayments: (params: ListParams = {}) =>
    request<Paginated<PaymentRecord>>(`/admin/payments?${toQuery(params)}`),

  getViolations: (params: ListParams = {}) =>
    request<Paginated<ViolationRecord>>(`/admin/violations?${toQuery(params)}`),
}
