import {
  Button,
  Container,
  Group,
  Paper,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from "@mantine/core";
import { ArrowRight, CheckCircle2, ShieldCheck, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import qatarLogo from "../assets/images/Qatar-logo.png";
import vehicle1 from "../assets/images/vehicles/vehicle-1.png";
import vehicle2 from "../assets/images/vehicles/vehicle-2.png";
import vehicle3 from "../assets/images/vehicles/vehicle-3.png";
import vehicle4 from "../assets/images/vehicles/vehicle-4.png";
import vehicle5 from "../assets/images/vehicles/vehicle-5.png";
import vehicle6 from "../assets/images/vehicles/vehicle-6.png";
import { translations } from "../constants/translations";
import type { Language } from "../types";
import styles from "./HeroSection.module.scss";

type Props = Readonly<{
  language: Language;
  t: (typeof translations)[Language];
}>;

const vehicleImages = [
  vehicle1,
  vehicle2,
  vehicle3,
  vehicle4,
  vehicle5,
  vehicle6,
];
const ROTATE_MS = 3200;

export function HeroSection({ language, t }: Props) {
  const isArabic = language === "ar";
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % vehicleImages.length);
    }, ROTATE_MS);
    return () => clearInterval(id);
  }, []);

  return (
    <section id="home" className={styles.hero} dir={isArabic ? "rtl" : "ltr"}>
      <Container size="lg" className={styles.container}>
        <div className={styles.content}>
          <Stack gap={18} className={styles.textBlock}>
            <Group gap={8} className={styles.badge}>
              <ThemeIcon variant="light" color="red" size="sm" radius="xl">
                <ShieldCheck size={16} />
              </ThemeIcon>
              <Text size="sm" fw={700} c="dimmed">
                {t.hero.eyebrow}
              </Text>
            </Group>
            <Title order={1} className={styles.title}>
              {t.hero.title}
            </Title>
            <Text size="lg" c="dimmed" className={styles.description}>
              {t.hero.description}
            </Text>
            <Group gap={12}>
              <Button
                component="a"
                href="#search"
                size="lg"
                radius="xl"
                className={styles.primaryButton}
                rightSection={<ArrowRight size={18} />}
              >
                {t.hero.primaryCta}
              </Button>
              <Button
                component="a"
                href="/about"
                variant="default"
                size="lg"
                radius="xl"
                className={styles.secondaryButton}
              >
                {t.hero.secondaryCta}
              </Button>
            </Group>
            <div className={styles.servicePills}>
              <span>Traffic Inquiries</span>
              <span>Visa inquiry</span>
              <span>Exit-Entry Services</span>
            </div>
            <Group gap={20} className={styles.statsRow}>
              <div>
                <Text fw={800} size="xl">
                  24/7
                </Text>
                <Text size="sm" c="dimmed">
                  Service
                </Text>
              </div>
              <div>
                <Text fw={800} size="xl">
                  99.9%
                </Text>
                <Text size="sm" c="dimmed">
                  Accuracy
                </Text>
              </div>
            </Group>
          </Stack>

          <div className={styles.visualPanel}>
            <Paper className={styles.glassCard}>
              <div className={styles.orb} />

              <div className={styles.logoWrap}>
                <img src={qatarLogo} alt="Qatar logo" className={styles.logo} />
              </div>

              <div className={styles.vehicleStage}>
                {vehicleImages.map((src, index) => (
                  <img
                    key={src}
                    src={src}
                    alt={
                      isArabic ? `مركبة ${index + 1}` : `Vehicle ${index + 1}`
                    }
                    className={styles.vehicleImage}
                    data-active={index === activeIndex || undefined}
                  />
                ))}

                <div className={styles.dots}>
                  {vehicleImages.map((src, index) => (
                    <button
                      key={src}
                      type="button"
                      className={styles.dot}
                      data-active={index === activeIndex || undefined}
                      aria-label={
                        isArabic
                          ? `عرض المركبة ${index + 1}`
                          : `Show vehicle ${index + 1}`
                      }
                      onClick={() => setActiveIndex(index)}
                    />
                  ))}
                </div>
              </div>

              <div className={styles.vehiclePanel}>
                <div className={styles.vehicleBadge}>
                  <Sparkles size={16} />
                  <Text fw={700} size="sm">
                    Vehicle Status
                  </Text>
                </div>
                <div className={styles.vehicleCard}>
                  <Text size="xs" c="dimmed">
                    Active record
                  </Text>
                  <Text fw={800} size="xl">
                    R 4521
                  </Text>
                  <CheckCircle2 size={20} color="#8a1538" />
                </div>
              </div>
            </Paper>
          </div>
        </div>
      </Container>
    </section>
  );
}
