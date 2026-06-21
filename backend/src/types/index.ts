export type SearchType = 'vehicle' | 'personal' | 'establishment';

export type ViolationStatus = 'Pending' | 'Paid' | 'Disputed';

export interface ViolationItem {
  reference: string;
  type: string;
  typeAr: string;
  description: string;
  descriptionAr: string;
  date: string; // ISO date
  location: string;
  locationAr: string;
  amount: number; // QAR
  points: number;
  status: ViolationStatus;
}

export interface ViolationSearchInput {
  searchType: SearchType;
  country: string;
  plateType?: string;
  plateNumber?: string;
  personalNumber?: string;
  establishmentId?: string;
}

export interface ViolationSearchResult {
  referenceId: string;
  searchType: SearchType;
  identifier: string;
  owner: { name: string; nameAr: string };
  violations: ViolationItem[];
  totalAmount: number;
  totalCount: number;
  currency: 'QAR';
}

export interface PaymentInput {
  referenceId?: string;
  fullName: string;
  mobile: string;
  email?: string;
  identifier?: string;
  amount: number;
  violationRefs?: string[];
  notes?: string;
  language?: 'ar' | 'en';
}
