import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useFlowPoll } from "../../hooks/useFlowPoll";
import { FlowLoading } from "./FlowLoading";

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
    <>
      <FlowLoading />
    </>
  );
}
