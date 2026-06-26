import { useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { LayoutDashboard, CreditCard, LogOut, Menu, X } from "lucide-react";
import { useAdminAuth } from "../context/AdminAuthContext";
import s from "./AdminLayout.module.scss";

const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/payments", label: "Requests", icon: CreditCard },
];

export function AdminLayout() {
  const [open, setOpen] = useState(false);
  const { logout } = useAdminAuth();
  const { pathname } = useLocation();

  const isActive = (to: string) =>
    to === "/" ? pathname === "/" : pathname.startsWith(to);

  const title =
    pathname === "/"
      ? "Dashboard"
      : pathname.startsWith("/payments/") &&
          pathname.length > "/payments/".length
        ? "Request Detail"
        : pathname === "/payments"
          ? "Requests"
          : pathname === "/searches"
            ? "Searches"
            : "Admin";

  return (
    <div className={s.layout}>
      {open && <div className={s.overlay} onClick={() => setOpen(false)} />}

      <aside className={`${s.sidebar} ${open ? s.sidebarOpen : ""}`}>
        <div className={s.sidebarHead}>
          <Link to="/" className={s.sidebarLogo} onClick={() => setOpen(false)}>
            Qatar Admin
          </Link>
          <button
            className={s.closeSidebarBtn}
            onClick={() => setOpen(false)}
            aria-label="Close menu"
          >
            <X size={16} />
          </button>
        </div>

        <nav className={s.nav}>
          {NAV.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className={`${s.navLink} ${isActive(to) ? s.navActive : ""}`}
              onClick={() => setOpen(false)}
            >
              <Icon size={18} />
              {label}
            </Link>
          ))}
        </nav>

        <div className={s.sidebarFoot}>
          <button className={s.logoutBtn} onClick={logout}>
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </aside>

      <div className={s.body}>
        <header className={s.header}>
          <button
            className={s.openSidebarBtn}
            onClick={() => setOpen(true)}
            aria-label="Open menu"
          >
            <Menu size={20} />
          </button>
          <h1 className={s.headerTitle}>{title}</h1>
          <div className={s.avatar}>A</div>
        </header>

        <div className={s.content}>
          <Outlet />
        </div>
      </div>
    </div>
  );
}
