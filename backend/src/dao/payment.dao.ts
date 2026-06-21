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
};
