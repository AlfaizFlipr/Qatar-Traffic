import { useLang } from "../../context/LanguageContext";
import styles from "./FlowLoading.module.scss";

export function FlowLoading() {
  const { t } = useLang();
  const fl = t.flow.loading;

  return (
    <div
      className={styles.fixedOverlay}
      role="dialog"
      aria-modal="true"
      aria-labelledby="payment-loading-title"
    >
      <div className={styles.loaderCard}>
        <div className={styles.loaderContainer} aria-hidden="true">
          <div className={styles.loaderOuter} />
          <div className={styles.loaderInner} />
        </div>
        <h2 id="payment-loading-title" className={styles.title}>
          {fl.title}
        </h2>
        <p className={styles.subtitle}>{fl.subtitle}</p>
        <div className={styles.noteBox}>
          <p style={{ margin: 0 }}>{fl.note}</p>
        </div>
        <div className={styles.dotsContainer} aria-hidden="true">
          <span className={styles.dot} />
          <span className={styles.dotActive} />
          <span className={styles.dot} />
        </div>
      </div>
    </div>
  );
}
