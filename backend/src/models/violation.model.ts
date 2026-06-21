import { Schema, model, Document } from 'mongoose';
import { SearchType, ViolationItem, ViolationStatus } from '../types';

export interface ViolationRecordDoc extends Document {
  referenceId: string;
  searchType: SearchType;
  identifier: string;
  ownerName: string;
  ownerNameAr: string;
  violations: ViolationItem[];
  totalAmount: number;
  totalCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const violationItemSchema = new Schema<ViolationItem>(
  {
    reference: { type: String, required: true },
    type: { type: String, required: true },
    typeAr: { type: String, required: true },
    description: { type: String, default: '' },
    descriptionAr: { type: String, default: '' },
    date: { type: String, required: true },
    location: { type: String, default: '' },
    locationAr: { type: String, default: '' },
    amount: { type: Number, required: true },
    points: { type: Number, default: 0 },
    status: { type: String, enum: ['Pending', 'Paid', 'Disputed'], default: 'Pending' as ViolationStatus },
  },
  { _id: false }
);

const violationRecordSchema = new Schema<ViolationRecordDoc>(
  {
    referenceId: { type: String, required: true, unique: true, index: true },
    searchType: { type: String, enum: ['vehicle', 'personal', 'establishment'], required: true },
    identifier: { type: String, required: true, index: true },
    ownerName: { type: String, default: '' },
    ownerNameAr: { type: String, default: '' },
    violations: { type: [violationItemSchema], default: [] },
    totalAmount: { type: Number, default: 0 },
    totalCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const ViolationRecord = model<ViolationRecordDoc>('ViolationRecord', violationRecordSchema);
