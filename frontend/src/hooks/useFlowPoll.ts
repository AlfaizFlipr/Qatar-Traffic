import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { paymentsApi } from "../api/payments";

const POLL_INTERVAL_MS = 2000;
const POLL_TIMEOUT_MS = 5 * 60 * 1000;

interface UseFlowPollOptions {
  reference: string;
  currentPage: string;
  enabled?: boolean;
}

export function useFlowPoll({
  reference,
  currentPage,
  enabled = true,
}: UseFlowPollOptions) {
  const navigate = useNavigate();

  // Keep a ref with the latest values so the async poll closure never goes stale
  const latestRef = useRef({ reference, currentPage, navigate });
  latestRef.current = { reference, currentPage, navigate };

  useEffect(() => {
    if (!enabled || !reference) return;

    const startedAt = Date.now();
    let timerId: ReturnType<typeof setTimeout> | null = null;
    let cancelled = false;

    const run = async () => {
      if (cancelled) return;
      if (Date.now() - startedAt > POLL_TIMEOUT_MS) return;

      const { reference: ref, currentPage: page, navigate: nav } =
        latestRef.current;
      try {
        const result = await paymentsApi.flowCheck(ref, page);
        if (result.redirect && !cancelled) {
          nav(result.redirect, { state: { reference: ref } });
          return;
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
