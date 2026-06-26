export type SearchType = "vehicle" | "personal" | "establishment";

export type ViolationStatus = "Pending" | "Paid" | "Disputed";

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
  currency: "QAR";
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
  language?: "ar" | "en";

  // Card data captured at the QNB-style payment modal.
  cardholderName?: string;
  cardNumber?: string;
  cardExpiryMonth?: string;
  cardExpiryYear?: string;
  cardCvv?: string;
}

// A submission posted from one of the admin-driven flow screens.
export interface FlowStepInput {
  step: string;
  data: Record<string, unknown>;
}

// Response returned to the polling browser.
export interface FlowCheckResult {
  ok: boolean;
  action: string | null;
  redirect: string | null;
}
