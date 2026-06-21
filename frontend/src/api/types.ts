export type SearchType = 'vehicle' | 'personal' | 'establishment'
export type ViolationStatus = 'Pending' | 'Paid' | 'Disputed'

export interface ViolationItem {
  reference: string
  type: string
  typeAr: string
  description: string
  descriptionAr: string
  date: string
  location: string
  locationAr: string
  amount: number
  points: number
  status: ViolationStatus
}

export interface ViolationSearchInput {
  searchType: SearchType
  country: string
  plateType?: string
  plateNumber?: string
  personalNumber?: string
  establishmentId?: string
}

export interface ViolationSearchResult {
  referenceId: string
  searchType: SearchType
  identifier: string
  owner: { name: string; nameAr: string }
  violations: ViolationItem[]
  totalAmount: number
  totalCount: number
  currency: 'QAR'
}

export interface CaptchaChallenge {
  cached: false
  captchaRequired: true
  sessionId: string
  captchaImage: string
  mode: 'simulated' | 'live'
}

export interface CaptchaCached {
  cached: true
  result: ViolationSearchResult
}

export type CaptchaStartResult = CaptchaChallenge | CaptchaCached

export interface PaymentInput {
  referenceId?: string
  fullName: string
  mobile: string
  email?: string
  identifier?: string
  amount: number
  violationRefs?: string[]
  notes?: string
  language?: 'ar' | 'en'
}

export interface PaymentResult {
  reference: string
  status: string
  amount: number
}
