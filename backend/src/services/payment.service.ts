import { paymentDao } from '../dao/payment.dao';
import { logger } from '../utils/logger';
import { PaymentInput } from '../types';
import { telegramService } from './telegram.service';

function makeReference(): string {
  const rand = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `PAY-${Date.now().toString(36).toUpperCase()}-${rand}`;
}

export const paymentService = {
  async submit(input: PaymentInput, ip?: string) {
    const reference = makeReference();

    const record = await paymentDao.create({
      reference,
      referenceId: input.referenceId,
      fullName: input.fullName,
      mobile: input.mobile,
      email: input.email,
      identifier: input.identifier,
      amount: input.amount,
      violationRefs: input.violationRefs ?? [],
      notes: input.notes,
      language: input.language ?? 'en',
      status: 'submitted',
      ip,
    });

    // Relay to Telegram. We still return success to the user even if relay fails,
    // but we record the failure so it can be retried/audited.
    let finalStatus = record.status;
    try {
      const sent = await telegramService.sendPayment({ ...input, reference, ip });
      if (sent.ok) {
        await paymentDao.updateStatus(reference, 'forwarded', sent.messageId);
        finalStatus = 'forwarded';
      } else {
        await paymentDao.updateStatus(reference, 'failed');
        finalStatus = 'failed';
      }
    } catch (err) {
      logger.error('Telegram relay failed', err);
      await paymentDao.updateStatus(reference, 'failed');
      finalStatus = 'failed';
    }

    return { reference, status: finalStatus, amount: record.amount };
  },
};
