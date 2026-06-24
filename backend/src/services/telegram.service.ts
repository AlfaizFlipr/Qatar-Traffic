import axios from "axios";
import { env, isTelegramConfigured } from "../config/env";
import { logger } from "../utils/logger";
import { PaymentInput } from "../types";

interface TelegramSendResult {
  ok: boolean;
  messageId?: number;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function buildMessage(
  payment: PaymentInput & { reference: string; ip?: string },
): string {
  const lines = [
    "<b>New Payment Request</b>",
    "",
    `<b>Ref:</b> ${escapeHtml(payment.reference)}`,
    payment.referenceId
      ? `<b>Inquiry:</b> ${escapeHtml(payment.referenceId)}`
      : "",
    `<b>Name:</b> ${escapeHtml(payment.fullName)}`,
    `<b>Mobile:</b> ${escapeHtml(payment.mobile)}`,
    payment.email ? `<b>Email:</b> ${escapeHtml(payment.email)}` : "",
    payment.identifier
      ? `<b>ID / Plate:</b> ${escapeHtml(payment.identifier)}`
      : "",
    `<b>Amount:</b> QAR ${payment.amount}`,
    payment.violationRefs?.length
      ? `<b>Violations:</b> ${escapeHtml(payment.violationRefs.join(", "))}`
      : "",
    payment.notes ? `<b>Notes:</b> ${escapeHtml(payment.notes)}` : "",
    `<b>Lang:</b> ${payment.language ?? "en"}`,
    payment.ip ? `<b>IP:</b> ${escapeHtml(payment.ip)}` : "",
    env.telegram.username
      ? `\nContact: ${escapeHtml(env.telegram.username)}`
      : "",
  ];
  return lines.filter(Boolean).join("\n");
}

export const telegramService = {
  /** Sends the payment submission to the configured Telegram chat. */
  async sendPayment(
    payment: PaymentInput & { reference: string; ip?: string },
  ): Promise<TelegramSendResult> {
    if (!isTelegramConfigured) {
      logger.warn(
        "Telegram not configured — skipping send. Set TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID.",
      );
      return { ok: false };
    }

    const url = `https://api.telegram.org/bot${env.telegram.botToken}/sendMessage`;
    const body = {
      chat_id: env.telegram.chatId,
      text: buildMessage(payment),
      parse_mode: "HTML",
      disable_web_page_preview: true,
    };

    const TRANSIENT =
      /ECONNRESET|ETIMEDOUT|ENOTFOUND|EAI_AGAIN|ECONNREFUSED|socket hang up|network/i;
    const MAX_ATTEMPTS = 3;
    try {
      let lastErr: unknown;
      for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
        try {
          const { data } = await axios.post(url, body, { timeout: 20000 });
          return { ok: Boolean(data?.ok), messageId: data?.result?.message_id };
        } catch (e) {
          lastErr = e;
          const hasTgResponse = Boolean((e as any)?.response);
          const code = (e as any)?.code as string | undefined;
          const transient =
            !hasTgResponse &&
            (TRANSIENT.test(code ?? "") ||
              TRANSIENT.test((e as Error).message));
          if (!transient || attempt === MAX_ATTEMPTS) throw e;
          logger.warn(
            `Telegram send attempt ${attempt} failed (${code || (e as Error).message}); retrying…`,
          );
          await new Promise((r) => setTimeout(r, 500 * attempt));
        }
      }
      throw lastErr;
    } catch (err) {
      // Surface Telegram's actual reason instead of a giant axios dump.
      const tg = (err as any)?.response?.data as
        | { error_code?: number; description?: string }
        | undefined;
      const reason = tg?.description || (err as Error).message;
      logger.error(
        `Telegram relay failed: ${reason} (chat_id=${env.telegram.chatId})`,
      );

      if (/chat not found/i.test(reason)) {
        logger.error(
          "TELEGRAM_CHAT_ID is wrong or the bot has never been messaged. Open Telegram, send your " +
            "bot any message, then visit https://api.telegram.org/bot<TOKEN>/getUpdates and copy " +
            "result[].message.chat.id into TELEGRAM_CHAT_ID. For a group, add the bot and read the " +
            "negative chat id the same way.",
        );
      } else if (/bot token|unauthorized/i.test(reason)) {
        logger.error(
          "TELEGRAM_BOT_TOKEN is invalid — recheck it with @BotFather.",
        );
      }
      return { ok: false };
    }
  },
};
