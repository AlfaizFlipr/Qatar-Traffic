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
  maxSeconds = 65,
}: LoadingOverlayProps) {
  const { isArabic } = useLang();
  const messages = isArabic ? MESSAGES_AR : MESSAGES_EN;

  const [elapsed, setElapsed] = useState(0);
  const [msgIndex, setMsgIndex] = useState(0);
  const [timedOut, setTimedOut] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const msgTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!visible) {
      clearInterval(timerRef.current!);
      clearInterval(msgTimerRef.current!);
      setElapsed(0);
      setMsgIndex(0);
      setTimedOut(false);
      return;
    }

    setElapsed(0);
    setMsgIndex(0);
    setTimedOut(false);

    timerRef.current = setInterval(() => {
      setElapsed((prev) => {
        const next = prev + 1;
        if (next >= maxSeconds) {
          setTimedOut(true);
          clearInterval(timerRef.current!);
        }
        return next;
      });
    }, 1000);

    msgTimerRef.current = setInterval(() => {
      setMsgIndex((i) => (i + 1) % messages.length);
    }, 10000);

    return () => {
      clearInterval(timerRef.current!);
      clearInterval(msgTimerRef.current!);
    };
  }, [visible, maxSeconds, messages.length]);

  if (!visible) return null;

  const remaining = Math.max(0, maxSeconds - elapsed);
  const progress = Math.min(100, (elapsed / maxSeconds) * 100);

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
                ? "جارٍ استرداد بيانات المخالفات المرورية. قد تستغرق هذه العملية حتى 60 ثانية."
                : "We are retrieving your traffic violation information. This process may take up to 60 seconds."}
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
              {isArabic ? "استغرق الطلب وقتًا أطول" : "This is taking longer than expected"}
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
