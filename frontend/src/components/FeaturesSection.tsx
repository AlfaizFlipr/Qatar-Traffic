import { Card, Container, SimpleGrid, Text } from "@mantine/core";
import { featureContent } from "../constants/content";
import { translations } from "../constants/translations";
import type { Language } from "../types";
import { SectionHeader } from "./Shared/SectionHeader";
import styles from "./FeaturesSection.module.scss";

type Props = Readonly<{
  language: Language;
  t: (typeof translations)[Language];
}>;

export function FeaturesSection({ language, t }: Props) {
  const isArabic = language === "ar";

  return (
    <section className={styles.section} dir={isArabic ? "rtl" : "ltr"}>
      <Container size="lg">
        <SectionHeader
          title={t.features.title}
          subtitle={t.features.subtitle}
        />
        <SimpleGrid
          cols={{ base: 1, sm: 2, lg: 3 }}
          spacing="lg"
          className={styles.grid}
        >
          {featureContent[language].map((feature) => {
            const Icon = feature.icon;
            return (
              <Card key={feature.title} className={styles.card} radius="lg">
                <div className={styles.iconWrap}>
                  <Icon size={20} />
                </div>
                <Text fw={700} size="lg" mb={8}>
                  {feature.title}
                </Text>
                <Text c="dimmed">{feature.description}</Text>
              </Card>
            );
          })}
        </SimpleGrid>
      </Container>
    </section>
  );
}
