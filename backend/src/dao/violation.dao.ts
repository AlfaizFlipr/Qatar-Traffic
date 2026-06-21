import { ViolationRecord, ViolationRecordDoc } from '../models/violation.model';
import { ViolationSearchResult } from '../types';

/** Data-access layer for violation records. Controllers/services never touch the model directly. */
export const violationDao = {
  async upsertByReference(result: ViolationSearchResult): Promise<ViolationRecordDoc> {
    return ViolationRecord.findOneAndUpdate(
      { referenceId: result.referenceId },
      {
        referenceId: result.referenceId,
        searchType: result.searchType,
        identifier: result.identifier,
        ownerName: result.owner.name,
        ownerNameAr: result.owner.nameAr,
        violations: result.violations,
        totalAmount: result.totalAmount,
        totalCount: result.totalCount,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  },

  async findByReference(referenceId: string): Promise<ViolationRecordDoc | null> {
    return ViolationRecord.findOne({ referenceId });
  },

  async findRecentByIdentifier(identifier: string): Promise<ViolationRecordDoc | null> {
    return ViolationRecord.findOne({ identifier }).sort({ updatedAt: -1 });
  },
};
