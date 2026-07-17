import { useEffect, useRef, useState } from "react";
import { useLang } from "../context/LanguageContext";
import styles from "./LoadingOverlay.module.scss";

interface LoadingOverlayProps {
  visible: boolean;
  onRetry: () => void;
  onCancel?: () => void;
  maxSeconds?: number;
}

const MESSAGES_AR = [
  "جارٍ الاتصال بالنظام الرسمي…",
  "جارٍ التحقق من الرقم الشخصي…",
  "جارٍ استرداد بيانات المخالفات…",
  "نتيجتك على وشك الظهور…",
];

const MESSAGES_EN = [
  "Connecting to the official system…",
  "Verifying the Civil ID…",
  "Retrieving violation details…",
  "Your result is almost ready…",
];

export function LoadingOverlay({
  visible,
  onRetry,
  onCancel,
  // The live scraper's captcha/submit round-trip typically finishes in ~5-8s
  // (pre-warmed page pool + tight timeouts); this is a generous safety-net
  // ceiling, not the expected wait — keep it in sync with reality so the
  // countdown/messages don't promise a much longer wait than actually happens.
  maxSeconds = 20,
}: LoadingOverlayProps) {
  const { isArabic } = useLang();
  const messages = isArabic ? MESSAGES_AR : MESSAGES_EN;

  const [elapsedMs, setElapsedMs] = useState(0);
  const [timedOut, setTimedOut] = useState(false);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startRef = useRef(0);

  useEffect(() => {
    if (!visible) {
      clearInterval(tickRef.current!);
      setElapsedMs(0);
      setTimedOut(false);
      return;
    }

    startRef.current = Date.now();
    setElapsedMs(0);
    setTimedOut(false);

    // Derive elapsed time from a real timestamp on every tick (rather than
    // incrementing a counter) so the display never drifts even if a tick
    // fires a little late — a frequent tick just keeps it visually smooth.
    tickRef.current = setInterval(() => {
      const next = Date.now() - startRef.current;
      setElapsedMs(next);
      if (next >= maxSeconds * 1000) {
        setTimedOut(true);
        clearInterval(tickRef.current!);
      }
    }, 200);

    return () => clearInterval(tickRef.current!);
  }, [visible, maxSeconds]);

  const elapsed = Math.min(maxSeconds, Math.floor(elapsedMs / 1000));
  const msgIndex = Math.min(
    messages.length - 1,
    Math.floor(elapsedMs / ((maxSeconds * 1000) / messages.length)),
  );

  if (!visible) return null;

  const remaining = Math.max(0, maxSeconds - elapsed);
  const progress = Math.min(100, (elapsedMs / (maxSeconds * 1000)) * 100);

  return (
    <div className={styles.backdrop} dir={isArabic ? "rtl" : "ltr"}>
      <div className={styles.card}>
        <div className={styles.iconWrap}>
          <div className={styles.ring1} />
          <div className={styles.ring2} />
          <svg className={styles.shieldIcon} viewBox="0 0 24 24" fill="none">
            <path
              d="M12 2L3 6v6c0 5.25 3.75 10.15 9 11.25C17.25 22.15 21 17.25 21 12V6L12 2z"
              fill="url(#shieldGrad)"
              opacity="0.2"
              stroke="url(#shieldGrad)"
              strokeWidth="1.5"
            />
            <path
              d="M9 12l2 2 4-4"
              stroke="#fff"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <defs>
              <linearGradient id="shieldGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#4fc3f7" />
                <stop offset="100%" stopColor="#0d4261" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {!timedOut ? (
          <>
            <h2 className={styles.title}>
              {isArabic ? "يُرجى الانتظار" : "Please Wait"}
            </h2>
            <p className={styles.subtitle}>
              {isArabic
                ? `جارٍ استرداد بيانات المخالفات المرورية. قد تستغرق هذه العملية حتى ${maxSeconds} ثانية.`
                : `We are retrieving your traffic violation information. This process may take up to ${maxSeconds} seconds.`}
            </p>

            <div className={styles.msgBox}>
              <span className={styles.dot} />
              <span key={msgIndex} className={styles.msgText}>
                {messages[msgIndex]}
              </span>
            </div>

            <div className={styles.progressTrack}>
              <div
                className={styles.progressBar}
                style={{ width: `${progress}%` }}
              />
            </div>

            <div className={styles.countdown}>
              {isArabic
                ? `الوقت المتبقي المقدّر: ${remaining} ثانية`
                : `Estimated time remaining: ${remaining}s`}
            </div>

            <div className={styles.warning}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
                  stroke="#f59e0b"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
              {isArabic
                ? "يُرجى عدم إغلاق هذه الصفحة أو تحديثها."
                : "Please do not close or refresh this page."}
            </div>

            <div className={styles.steps}>
              {MESSAGES_EN.map((_, i) => (
                <div
                  key={i}
                  className={`${styles.step} ${i <= msgIndex ? styles.stepActive : ""}`}
                />
              ))}
            </div>
          </>
        ) : (
          <>
            <h2 className={styles.title}>
              {isArabic
                ? "استغرق الطلب وقتًا أطول"
                : "This is taking longer than expected"}
            </h2>
            <p className={styles.subtitle}>
              {isArabic
                ? "النظام لا يستجيب في الوقت المتوقع. يمكنك المحاولة مرة أخرى."
                : "The system is not responding as expected. Please try again."}
            </p>
            <button className={styles.retryBtn} onClick={onRetry}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path
                  d="M1 4v6h6M23 20v-6h-6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <path
                  d="M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
              {isArabic ? "إعادة المحاولة" : "Try Again"}
            </button>
            {onCancel && (
              <button className={styles.cancelBtn} onClick={onCancel}>
                {isArabic ? "إلغاء" : "Cancel"}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
