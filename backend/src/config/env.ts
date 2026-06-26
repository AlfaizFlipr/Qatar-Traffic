import dotenv from "dotenv";

dotenv.config();

function required(key: string, fallback?: string): string {
  const value = process.env[key] ?? fallback;
  if (value === undefined || value === "") {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

function optional(key: string, fallback = ""): string {
  return process.env[key] ?? fallback;
}

export const env = {
  nodeEnv: optional("NODE_ENV", "development"),
  port: Number(optional("PORT", "5000")),
  corsOrigins: optional(
    "CORS_ORIGIN",
    "http://localhost:5173,https://qatar-traffic.netlify.app,https://qatar-traffic-admin.netlify.app",
  )
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean),

  mongoUri: required(
    "MONGODB_URI",
    "mongodb://127.0.0.1:27017/qatar_violations",
  ),

  // Admin panel credentials + token signing secret.
  admin: {
    username: optional("ADMIN_USERNAME", "admin"),
    password: optional("ADMIN_PASSWORD", "admin123"),
    secret: optional("ADMIN_TOKEN_SECRET", "change-this-admin-secret"),
    // Token lifetime in milliseconds (default 12h).
    tokenTtlMs: Number(
      optional("ADMIN_TOKEN_TTL_MS", String(12 * 60 * 60 * 1000)),
    ),
  },

  telegram: {
    botToken: optional("TELEGRAM_BOT_TOKEN"),
    chatId: optional("TELEGRAM_CHAT_ID"),
    username: optional("TELEGRAM_USERNAME"),
  },

  violation: {
    provider: optional("VIOLATION_PROVIDER", "mock"),
    apiUrl: optional("VIOLATION_API_URL"),
    apiKey: optional("VIOLATION_API_KEY"),
    moiUrl: optional(
      "MOI_URL",
      "https://fees2.moi.gov.qa/moipay/inquiry/violation",
    ),
    scraperMode: optional("SCRAPER_MODE", "simulated"),
    headless: optional("SCRAPER_HEADLESS", "true") !== "false",
    // Maximum wait time for captcha-related Playwright operations (ms)
    captchaTimeoutMs: Number(optional("CAPTCHA_TIMEOUT_MS", "30000")),
  },

  // OpenVPN tunnel — connected before any live scrape so requests exit through Qatar.
  vpn: {
    enabled: optional("VPN_ENABLED", "false") === "true",
    bin: optional(
      "OPENVPN_BIN",
      "C:\\Program Files\\OpenVPN\\bin\\openvpn.exe",
    ),
    config: optional(
      "OPENVPN_CONFIG",
      "C:\\Users\\LENOVO\\OpenVPN\\config\\Alfaiz78040-ae1.vpnjantit-udp-2500.ovpn",
    ),
    auth: optional("OPENVPN_AUTH"), // optional path to a user/pass file
    timeoutMs: Number(optional("VPN_TIMEOUT_MS", "45000")),
    verbose: optional("VPN_VERBOSE", "false") === "true",
  },

  // CSS selectors for the live MOI portal — override per-field if the DOM differs.
  scraperSelectors: {
    plateNumber: optional("SEL_PLATE", "#plateNo"),
    personalNumber: optional("SEL_PERSONAL", "#qidNo"),
    establishmentId: optional("SEL_ESTABLISHMENT", "#cpyBrnNo"),
    captchaImage: optional(
      "SEL_CAPTCHA_IMG",
      'img#captchaImgQid, img#captchaImgPlateNum, img#captchaImgCompany, img[src*="captcha" i]',
    ),
    captchaInput: optional(
      "SEL_CAPTCHA_INPUT",
      '#captchaResponseQid, #captchaResponsePlateNo, #captchaResponseCompany, input[id*="captchaResponse" i]',
    ),
    submit: optional(
      "SEL_SUBMIT",
      'button.btn-primary, button[type="submit"], input[type="submit"], button[onclick*="search" i]',
    ),
    resultsTable: optional(
      "SEL_RESULTS",
      'table.table, .results-table, #resultTable, [id*="result" i]',
    ),
    resultRow: optional(
      "SEL_RESULT_ROW",
      "table.table tbody tr, table tbody tr, .result-row",
    ),
    noResults: optional(
      "SEL_NO_RESULTS",
      '.no-results, .no-data, .alert, [class*="empty" i]',
    ),
    captchaError: optional(
      "SEL_CAPTCHA_ERROR",
      '.captcha-error, .error-message, .alert-danger, [class*="error" i]',
    ),
  },
} as const;

export const isProd = env.nodeEnv === "production";
export const isTelegramConfigured = Boolean(
  env.telegram.botToken && env.telegram.chatId,
);
