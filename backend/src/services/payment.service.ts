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

    // Relay to Telegram in the BACKGROUND so the user gets an instant response.
    // The DB row records the real delivery outcome for retry/audit.
    void telegramService
      .sendPayment({ ...input, reference, ip })
      .then((sent) =>
        paymentDao.updateStatus(
          reference,
          sent.ok ? 'forwarded' : 'failed',
          sent.messageId,
        ),
      )
      .catch((err) => {
        logger.error('Telegram relay failed', err);
        return paymentDao.updateStatus(reference, 'failed');
      });

    // 'submitted' = accepted and queued for relay.
    return { reference, status: record.status, amount: record.amount };
  },
};
