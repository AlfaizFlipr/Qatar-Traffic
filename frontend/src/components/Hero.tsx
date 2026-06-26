import { Container } from "@mantine/core";
import { CreditCard, FileSearch } from "lucide-react";
import banner from "../assets/images/banner.jpg";
import { useLang } from "../context/LanguageContext";
import styles from "./Hero.module.scss";

export function Hero() {
  const { t } = useLang();

  const scrollToSearch = () => {
    document
      .getElementById("search")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <section
      className={styles.hero}
      style={{ backgroundImage: `url(${banner})` }}
    >
      <div className={styles.overlay} />
      <Container size="xl" className={styles.inner}>
        <div className={styles.cards}>
          <button
            type="button"
            className={styles.card}
            onClick={scrollToSearch}
          >
            <CreditCard size={34} strokeWidth={1.5} />
            <span>{t.hero.payCard}</span>
          </button>
          <button
            type="button"
            className={styles.card}
            onClick={scrollToSearch}
          >
            <FileSearch size={34} strokeWidth={1.5} />
            <span>{t.hero.inquireCard}</span>
          </button>
        </div>

        <div className={styles.text}>
          <h1 className={styles.title}>{t.hero.title}</h1>
          <p className={styles.subtitle}>{t.hero.subtitle}</p>
        </div>
      </Container>
    </section>
  );
}
