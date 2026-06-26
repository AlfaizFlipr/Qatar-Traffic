import { Badge, Container, Group, SimpleGrid, Text } from "@mantine/core";
import { Clock3, ShieldCheck, Sparkles, Users } from "lucide-react";
import { translations } from "../constants/translations";
import type { Language } from "../types";
import { SectionHeader } from "./Shared/SectionHeader";
import styles from "./WhyChooseUs.module.scss";

type Props = Readonly<{
  language: Language;
  t: (typeof translations)[Language];
}>;

export function WhyChooseUs({ language, t }: Props) {
  const isArabic = language === "ar";
  const statIcons = [Users, ShieldCheck, Clock3, Sparkles];

  return (
    <section className={styles.section} dir={isArabic ? "rtl" : "ltr"}>
      <Container size="lg">
        <SectionHeader title={t.stats.title} />
        <SimpleGrid
          cols={{ base: 1, md: 2 }}
          spacing="lg"
          className={styles.grid}
        >
          <div className={styles.panel}>
            <Group gap={8}>
              <Badge color="red">{t.stats.panelBadge}</Badge>
              <Text c="white" size="sm">
                {t.stats.panelService}
              </Text>
            </Group>
            <Text fw={800} size="2rem" mt="md">
              {t.stats.panelTitle}
            </Text>
            <Text c="white" opacity={0.9} mt="sm">
              {t.stats.panelDesc}
            </Text>
            <div className={styles.panelFooter}>
              <span>{t.stats.panelAvailability}</span>
              <span>{t.stats.panelStandard}</span>
            </div>
          </div>
          <div className={styles.statsGrid}>
            {t.stats.items.map((item, index) => {
              const Icon = statIcons[index];

              return (
                <div className={styles.statBox} key={item.label}>
                  <div className={styles.statIcon}>
                    <Icon size={18} />
                  </div>
                  <Text fw={800} size="2rem">
                    {item.value}
                  </Text>
                  <Text c="dimmed">{item.label}</Text>
                </div>
              );
            })}
          </div>
        </SimpleGrid>
      </Container>
    </section>
  );
}
