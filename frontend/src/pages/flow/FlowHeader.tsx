import { Link } from "react-router-dom";
import { useLang } from "../../context/LanguageContext";
import styles from "./FlowHeader.module.scss";
import qatarLogo from "../../assets/images/Qatar-logo.png";

export function FlowHeader() {
  const { t, toggleLanguage } = useLang();
  const ft = t.flow;

  return (
    <header className={styles.bar}>
      <div className={styles.identity}>
          <img
            src={qatarLogo}
            alt="وزارة الداخلية - Ministry of Interior"
            className={styles.logo}
          />
      </div>

      <button
        type="button"
        onClick={toggleLanguage}
        className={styles.langBtn}
        aria-label="Switch language"
      >
        <svg
          className={styles.globeIcon}
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="1.8"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 21a9 9 0 100-18 9 9 0 000 18zm0 0c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3s4.5 4.03 4.5 9-2.015 9-4.5 9zm-9-9h18"
          />
        </svg>
        {ft.langToggle}
      </button>
    </header>
  );
}
