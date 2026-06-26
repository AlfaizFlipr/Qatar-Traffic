import { Container, Text, Title } from "@mantine/core";
import type { ReactNode } from "react";
import styles from "./PageHero.module.scss";

interface Props {
  title: string;
  subtitle?: string;
  children?: ReactNode;
}

export function PageHero({ title, subtitle, children }: Props) {
  return (
    <section className={styles.hero}>
      <Container size="lg">
        <Title order={1} className={styles.title}>
          {title}
        </Title>
        {subtitle && <Text className={styles.subtitle}>{subtitle}</Text>}
        {children}
      </Container>
    </section>
  );
}
