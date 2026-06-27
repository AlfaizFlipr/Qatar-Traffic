import { useLang } from "../../context/LanguageContext";
import styles from "./FlowHeader.module.scss";

/**
 * A slim top-bar shown on every flow page.
 * Clicking the button toggles the site language (Arabic ↔ English).
 * The button label always shows the *opposite* language name so the user
 * knows what they will switch TO.
 */
export function FlowHeader() {
  const { t, toggleLanguage } = useLang();
  const ft = t.flow;

  return (
    <div className={styles.headerBar}>
      <div className={styles.headerInner}>
        <button
          type="button"
          onClick={toggleLanguage}
          className={styles.langBtn}
          aria-label="Switch language"
        >
          {/* Globe icon */}
          <svg
            style={{ width: "14px", height: "14px" }}
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 21a9.004 9.004 0 008.716-6H12V9h8.627A9.004 9.004 0 0012 3c-5.373 0-9.735 4.365-9.735 9.75S6.627 21.75 12 21.75z"
            />
          </svg>
          {ft.langToggle}
        </button>
      </div>
    </div>
  );
}
