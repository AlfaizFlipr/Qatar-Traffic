import { Button, Container, Group, Paper, Stack, Text, ThemeIcon, Title } from '@mantine/core'
import { ArrowRight, CheckCircle2, ShieldCheck, Sparkles } from 'lucide-react'
import qatarLogo from '../assets/images/Qatar-logo.png'
import { translations } from '../constants/translations'
import type { Language } from '../types'
import styles from './HeroSection.module.scss'

type Props = Readonly<{
  language: Language
  t: (typeof translations)[Language]
}>

export function HeroSection({ language, t }: Props) {
  const isArabic = language === 'ar'

  return (
    <section id="home" className={styles.hero} dir={isArabic ? 'rtl' : 'ltr'}>
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
              <Button size="lg" radius="xl" className={styles.primaryButton} rightSection={<ArrowRight size={18} />}>
                {t.hero.primaryCta}
              </Button>
              <Button variant="default" size="lg" radius="xl" className={styles.secondaryButton}>
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
                <Text fw={800} size="xl">24/7</Text>
                <Text size="sm" c="dimmed">Service</Text>
              </div>
              <div>
                <Text fw={800} size="xl">99.9%</Text>
                <Text size="sm" c="dimmed">Accuracy</Text>
              </div>
            </Group>
          </Stack>
          <div className={styles.visualPanel}>
            <Paper className={styles.glassCard}>
              <div className={styles.orb} />
              <div className={styles.logoWrap}>
                <img src={qatarLogo} alt="Qatar logo" className={styles.logo} />
              </div>
              <div className={styles.vehiclePanel}>
                <div className={styles.vehicleBadge}>
                  <Sparkles size={16} />
                  <Text fw={700} size="sm">Vehicle Status</Text>
                </div>
                <div className={styles.vehicleCard}>
                  <Text size="xs" c="dimmed">Active record</Text>
                  <Text fw={800} size="xl">R 4521</Text>
                  <CheckCircle2 size={20} color="#8a1538" />
                </div>
              </div>
            </Paper>
          </div>
        </div>
      </Container>
    </section>
  )
}
