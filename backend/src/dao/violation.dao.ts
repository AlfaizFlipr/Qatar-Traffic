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

  /** Paginated list of search records for the admin panel, newest first. */
  async list({ page, limit, search }: { page: number; limit: number; search?: string }) {
    const filter = search
      ? {
          $or: [
            { referenceId: { $regex: search, $options: 'i' } },
            { identifier: { $regex: search, $options: 'i' } },
            { ownerName: { $regex: search, $options: 'i' } },
            { ownerNameAr: { $regex: search, $options: 'i' } },
          ],
        }
      : {};

    const [items, total, agg] = await Promise.all([
      ViolationRecord.find(filter)
        .sort({ updatedAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      ViolationRecord.countDocuments(filter),
      ViolationRecord.aggregate<{ sumAmount: number; sumCount: number }>([
        { $match: filter },
        { $group: { _id: null, sumAmount: { $sum: '$totalAmount' }, sumCount: { $sum: '$totalCount' } } },
      ]),
    ]);

    return {
      items,
      total,
      totalAmount: agg[0]?.sumAmount ?? 0,
      totalViolations: agg[0]?.sumCount ?? 0,
    };
  },
};
