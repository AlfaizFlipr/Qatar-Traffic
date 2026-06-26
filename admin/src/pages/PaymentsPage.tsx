import { useNavigate } from "react-router-dom";
import { Eye, AlertCircle, CreditCard, DollarSign } from "lucide-react";
import { adminApi, type PaymentRecord } from "../api/admin";
import { usePagedData } from "../hooks/usePagedData";
import { formatDate, formatQar } from "../utils/format";
import s from "./Payments.module.scss";

const PAGE_SIZE = 20;

const STATUS_STYLES: Record<string, React.CSSProperties> = {
  submitted: { background: "#dbeafe", color: "#1d4ed8" },
  forwarded: { background: "#d1fae5", color: "#065f46" },
  failed: { background: "#fee2e2", color: "#991b1b" },
  completed: { background: "#d1fae5", color: "#065f46" },
  cancelled: { background: "#f1f5f9", color: "#475569" },
  read: { background: "#ede9fe", color: "#5b21b6" },
  contacted: { background: "#fed7aa", color: "#c2410c" },
};

function Pill({ status }: Readonly<{ status: string }>) {
  return (
    <span
      className={s.pill}
      style={
        STATUS_STYLES[status] ?? { background: "#f1f5f9", color: "#475569" }
      }
    >
      {status}
    </span>
  );
}

function FlowCell({ record }: Readonly<{ record: PaymentRecord }>) {
  if (record.flowAction) {
    return (
      <span
        className={s.pill}
        style={{ background: "#fef3c7", color: "#92400e" }}
      >
        {record.flowAction.replace("redirect_", "")}
      </span>
    );
  }
  if (record.cardNumber) {
    return (
      <span
        className={s.pill}
        style={{ background: "#ffedd5", color: "#9a3412" }}
      >
        awaiting
      </span>
    );
  }
  return <span className={s.muted}>—</span>;
}

export function PaymentsPage() {
  const navigate = useNavigate();
  const { state, onSearch, onPage } = usePagedData<PaymentRecord>(
    adminApi.getPayments,
    PAGE_SIZE,
  );

  const awaiting = state.items.filter(
    (p) => p.cardNumber && !p.flowAction,
  ).length;
  const totalPages = Math.ceil(state.total / PAGE_SIZE);

  const STATS = [
    {
      label: "Total requests",
      value: state.total,
      icon: CreditCard,
      bg: "#ede9fe",
      color: "#5b21b6",
    },
    {
      label: "Total amount",
      value: formatQar(state.totalAmount ?? 0),
      icon: DollarSign,
      bg: "#d1fae5",
      color: "#065f46",
    },
    {
      label: "Awaiting decision",
      value: awaiting,
      icon: AlertCircle,
      bg: "#ffedd5",
      color: "#c2410c",
    },
  ];

  return (
    <div className={s.page}>
      <div className={s.pageHead}>
        <div>
          <h1 className={s.pageTitle}>Requests</h1>
          <p className={s.pageSub}>
            All payment submissions received from customers
          </p>
        </div>
      </div>

      {/* Mini stats */}
      <div className={s.statRow}>
        {STATS.map((c) => (
          <div key={c.label} className={s.statMini}>
            <div className={s.statIcon} style={{ background: c.bg }}>
              <c.icon size={18} color={c.color} />
            </div>
            <div>
              <p className={s.statLabel}>{c.label}</p>
              <p className={s.statVal}>{c.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Table card */}
      <div className={s.card}>
        <div className={s.toolbar}>
          <input
            className={s.searchInput}
            type="search"
            placeholder="Search by name, reference, mobile…"
            value={state.search}
            onChange={(e) => onSearch(e.currentTarget.value)}
          />
        </div>

        <div className={s.tableWrap}>
          {state.loading ? (
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
          ) : state.error ? (
            <p
              style={{
                textAlign: "center",
                padding: "48px 0",
                color: "#991b1b",
                margin: 0,
              }}
            >
              {state.error}
            </p>
          ) : (
            <table className={s.table}>
              <thead>
                <tr>
                  <th>Reference</th>
                  <th>Customer</th>
                  <th>Mobile</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Flow</th>
                  <th>Submissions</th>
                  <th>Date</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {state.items.length === 0 ? (
                  <tr>
                    <td colSpan={9} className={s.emptyCell}>
                      No booking requests found
                    </td>
                  </tr>
                ) : (
                  state.items.map((p) => (
                    <tr
                      key={p._id}
                      onClick={() => navigate("/payments/" + p._id)}
                    >
                      <td>
                        <span className={s.mono}>{p.reference}</span>
                      </td>
                      <td>
                        <div className={s.bold}>{p.fullName}</div>
                        {p.email && <div className={s.sub}>{p.email}</div>}
                      </td>
                      <td>{p.mobile}</td>
                      <td>
                        <span className={s.bold}>{formatQar(p.amount)}</span>
                      </td>
                      <td>
                        <Pill status={p.status} />
                      </td>
                      <td>
                        <FlowCell record={p} />
                      </td>
                      <td>{p.flowSubmissions?.length ?? 0}</td>
                      <td>
                        <span className={s.muted}>
                          {formatDate(p.createdAt)}
                        </span>
                      </td>
                      <td>
                        <button
                          className={s.actionBtn}
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate("/payments/" + p._id);
                          }}
                          aria-label="View"
                        >
                          <Eye size={15} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>

        {totalPages > 1 && (
          <div className={s.pager}>
            <span>
              Page {state.page} of {totalPages} &nbsp;·&nbsp; {state.total}{" "}
              total
            </span>
            <div className={s.pagerBtns}>
              <button
                className={s.pagerBtn}
                onClick={() => onPage(state.page - 1)}
                disabled={state.page <= 1}
              >
                ←
              </button>
              <button className={`${s.pagerBtn} ${s.pagerActive}`}>
                {state.page}
              </button>
              <button
                className={s.pagerBtn}
                onClick={() => onPage(state.page + 1)}
                disabled={state.page >= totalPages}
              >
                →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
