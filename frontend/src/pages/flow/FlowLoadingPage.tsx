import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useFlowPoll } from "../../hooks/useFlowPoll";
import { useLang } from "../../context/LanguageContext";
import { FlowHeader } from "./FlowHeader";
import { FlowLoading } from "./FlowLoading";
import styles from "./FlowLoadingPage.module.scss";

export function FlowLoadingPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { dir } = useLang();

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
    <div className={styles.page}>
      <FlowHeader />
      <div className={styles.center} dir={dir}>
        <FlowLoading />
      </div>
    </div>
  );
}