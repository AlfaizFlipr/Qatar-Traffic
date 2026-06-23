import { Container } from "@mantine/core";
import { Languages } from "lucide-react";
import { Link, NavLink } from "react-router-dom";
import qatarLogo from "../assets/images/Qatar-logo.png";
import { useLang } from "../context/LanguageContext";
import styles from "./Navbar.module.scss";
import { FaFacebook, FaInstagram, FaTwitter, FaYoutube } from "react-icons/fa";

const SOCIALS = [
  { Icon: FaYoutube, label: "YouTube" },
  { Icon: FaInstagram, label: "Instagram" },
  { Icon: FaTwitter, label: "Twitter" },
  { Icon: FaFacebook, label: "Facebook" },
];

export function Navbar() {
  const { t, language, toggleLanguage } = useLang();

  const links = [
    { label: t.nav.trafficInquiry, to: "/" },
    { label: t.nav.financialInquiry, to: "/financial" },
  ];

  return (
    <header className={styles.header}>
      {/* Teal social strip */}
      <div className={styles.topbar}>
        <Container size="xl" className={styles.topbarInner}>
          <div className={styles.socials}>
            {SOCIALS.map(({ Icon, label }) => (
              <a
                key={label}
                href="#"
                className={styles.socialLink}
                aria-label={label}
              >
                <Icon size={16} />
              </a>
            ))}
          </div>
        </Container>
      </div>

      {/* Main header row: Payment Gateway + MOI logo */}
      <Container size="xl" className={styles.mainRow}>
        <Link to="/" className={styles.brand} aria-label="home">
          <img
            src={qatarLogo}
            alt="وزارة الداخلية - Ministry of Interior"
            className={styles.logo}
          />
        </Link>
      </Container>

      {/* Nav links + language toggle */}
      <div className={styles.navRow}>
        <Container size="xl" className={styles.navInner}>
          <nav className={styles.navLinks}>
            {links.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end
                className={({ isActive }) =>
                  `${styles.navLink} ${isActive ? styles.active : ""}`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <button
            type="button"
            className={styles.langBtn}
            onClick={toggleLanguage}
          >
            <span>{language === "ar" ? "English" : "العربية"}</span>
            <Languages size={16} />
          </button>
        </Container>
      </div>
    </header>
  );
}
