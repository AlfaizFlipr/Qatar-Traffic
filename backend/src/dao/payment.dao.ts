import { Payment, PaymentDoc, PaymentStatus } from '../models/payment.model';

export const paymentDao = {
  async create(data: Partial<PaymentDoc>): Promise<PaymentDoc> {
    return Payment.create(data);
  },

  async updateStatus(
    reference: string,
    status: PaymentStatus,
    telegramMessageId?: number
  ): Promise<PaymentDoc | null> {
    return Payment.findOneAndUpdate(
      { reference },
      { status, ...(telegramMessageId ? { telegramMessageId } : {}) },
      { new: true }
    );
  },

  async findByReference(reference: string): Promise<PaymentDoc | null> {
    return Payment.findOne({ reference });
  },

  /** Paginated list for the admin panel, newest first, with optional text search. */
  async list({ page, limit, search }: { page: number; limit: number; search?: string }) {
    const filter = search
      ? {
          $or: [
            { reference: { $regex: search, $options: 'i' } },
            { fullName: { $regex: search, $options: 'i' } },
            { mobile: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } },
            { identifier: { $regex: search, $options: 'i' } },
          ],
        }
      : {};

    const [items, total, amountAgg] = await Promise.all([
      Payment.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Payment.countDocuments(filter),
      Payment.aggregate<{ sum: number }>([
        { $match: filter },
        { $group: { _id: null, sum: { $sum: '$amount' } } },
      ]),
    ]);

    return { items, total, totalAmount: amountAgg[0]?.sum ?? 0 };
  },
};
