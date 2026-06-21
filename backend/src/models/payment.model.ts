import { Schema, model, Document } from 'mongoose';

export type PaymentStatus = 'submitted' | 'forwarded' | 'failed';

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
  language: 'ar' | 'en';
  status: PaymentStatus;
  telegramMessageId?: number;
  ip?: string;
  createdAt: Date;
  updatedAt: Date;
}

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
    language: { type: String, enum: ['ar', 'en'], default: 'en' },
    status: { type: String, enum: ['submitted', 'forwarded', 'failed'], default: 'submitted' },
    telegramMessageId: { type: Number },
    ip: { type: String },
  },
  { timestamps: true }
);

export const Payment = model<PaymentDoc>('Payment', paymentSchema);
