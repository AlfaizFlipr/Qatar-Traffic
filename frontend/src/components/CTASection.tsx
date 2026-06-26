import { Button, Container, Paper, Title } from "@mantine/core";
import { translations } from "../constants/translations";
import type { Language } from "../types";
import styles from "./CTASection.module.scss";

type Props = Readonly<{
  language: Language;
  t: (typeof translations)[Language];
}>;

export function CTASection({ language, t }: Props) {
  const isArabic = language === "ar";

  return (
    <section className={styles.section} dir={isArabic ? "rtl" : "ltr"}>
      <Container size="lg">
        <Paper className={styles.paper}>
          <Title order={2}>{t.cta.title}</Title>
          <Button size="lg" radius="xl" className={styles.button}>
            {t.cta.button}
          </Button>
        </Paper>
      </Container>
    </section>
  );
}
