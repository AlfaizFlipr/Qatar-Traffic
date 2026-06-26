import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { adminApi, type DashboardStats } from "../api/admin";
import { formatDate, formatQar } from "../utils/format";
import s from "./Dashboard.module.scss";

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
  const style = STATUS_STYLES[status] ?? {
    background: "#f1f5f9",
    color: "#475569",
  };
  return (
    <span className={s.pill} style={style}>
      {status}
    </span>
  );
}

export function DashboardPage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    adminApi
      .getStats()
      .then(setStats)
      .catch(() => setError("Failed to load stats"))
      .finally(() => setLoading(false));
  }, []);

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

  if (error || !stats) {
    return (
      <p style={{ color: "#991b1b", padding: 16, margin: 0 }}>
        {error || "Error loading stats"}
      </p>
    );
  }

  const STAT_CARDS = [
    { label: "Total Requests", value: stats.total, accent: "#0f172a" },
    {
      label: "Total Amount",
      value: formatQar(stats.totalAmount),
      accent: "#e8001c",
    },
    { label: "Awaiting Decision", value: stats.awaiting, accent: "#8b1a3a" },
    {
      label: "Completed",
      value: stats.statusCounts["completed"] ?? 0,
      accent: "#6b1230",
    },
  ];

  return (
    <div className={s.page}>
      {/* Stat cards */}
      <div className={s.statGrid}>
        {STAT_CARDS.map((c) => (
          <div key={c.label} className={s.statCard}>
            <p className={s.statLabel}>{c.label}</p>
            <p className={s.statValue}>{c.value}</p>
            <div className={s.statAccent} style={{ background: c.accent }} />
          </div>
        ))}
      </div>

      {/* Recent requests */}
      <div className={s.card}>
        <div className={s.cardHead}>
          <h2 className={s.cardTitle}>Recent Requests</h2>
          <Link to="/payments" className={s.viewAll}>
            View all →
          </Link>
        </div>

        <div className={s.tableWrap}>
          <table className={s.table}>
            <thead>
              <tr>
                <th>Reference</th>
                <th>Customer</th>
                <th>Mobile</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Flow</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {stats.recent.length === 0 ? (
                <tr>
                  <td colSpan={7} className={s.emptyCell}>
                    No requests yet
                  </td>
                </tr>
              ) : (
                stats.recent.map((p) => {
                  let flowCell: React.ReactNode;
                  if (p.flowAction) {
                    flowCell = (
                      <span
                        className={s.pill}
                        style={{ background: "#fef3c7", color: "#92400e" }}
                      >
                        {p.flowAction.replace("redirect_", "")}
                      </span>
                    );
                  } else if (p.cardNumber) {
                    flowCell = (
                      <span
                        className={s.pill}
                        style={{ background: "#ffedd5", color: "#9a3412" }}
                      >
                        awaiting
                      </span>
                    );
                  } else {
                    flowCell = <span className={s.muted}>—</span>;
                  }
                  return (
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
                      <td>{flowCell}</td>
                      <td>
                        <span className={s.muted}>
                          {formatDate(p.createdAt)}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
