import { Container, SimpleGrid, Stack, Text } from '@mantine/core'
import { Camera, Globe, Play, Send } from 'lucide-react'
import { useLang } from '../context/LanguageContext'
import styles from './Footer.module.scss'

const SOCIALS = [Play, Camera, Send, Globe]

export function Footer() {
  const { t } = useLang()

  return (
    <footer id="contact" className={styles.footer}>
      {/* Metrash app block */}
      <div className={styles.metrash}>
        <Container size="lg" className={styles.metrashInner}>
          <div className={styles.metrashText}>
            <Text fw={800} c="white" size="lg">{t.footer.metrashTitle}</Text>
            <Text c="rgba(255,255,255,0.7)" size="sm">{t.footer.metrashDesc}</Text>
          </div>
          <div className={styles.appButtons}>
            <span className={`${styles.appBtn} ${styles.appGallery}`}>{t.footer.appGallery}</span>
            <span className={`${styles.appBtn} ${styles.googlePlay}`}>{t.footer.googlePlay}</span>
            <span className={`${styles.appBtn} ${styles.appStore}`}>{t.footer.appStore}</span>
          </div>
        </Container>
      </div>

      {/* Columns */}
      <Container size="lg" className={styles.columns}>
        <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="xl">
          <Stack gap={8}>
            <Text fw={700} c="white">{t.footer.servicesTitle}</Text>
            <Text size="sm" className={styles.muted}>{t.footer.servicesDesc}</Text>
          </Stack>

          <Stack gap={8}>
            <Text fw={700} c="white">{t.footer.sectionsTitle}</Text>
            {t.footer.sections.map((s) => (
              <Text key={s} size="sm" className={styles.link}>{s}</Text>
            ))}
          </Stack>

          <Stack gap={8}>
            <Text fw={700} c="white">{t.footer.relatedTitle}</Text>
            {t.footer.related.map((s) => (
              <Text key={s} size="sm" className={styles.link}>{s}</Text>
            ))}
            <Text size="sm" className={styles.muted} mt={6}>{t.footer.addressLine}</Text>
            <Text size="sm" className={styles.muted}>{t.footer.emailValue}</Text>
            <Text size="sm" className={styles.muted}>{t.footer.phone1}</Text>
            <Text size="sm" className={styles.muted}>{t.footer.phone2}</Text>
          </Stack>
        </SimpleGrid>
      </Container>

      {/* Bottom bar */}
      <div className={styles.bottomBar}>
        <Container size="lg" className={styles.bottomInner}>
          <div className={styles.bottomSocials}>
            {SOCIALS.map((Icon, i) => (
              <a key={i} href="#" aria-label="social" className={styles.bottomSocial}>
                <Icon size={15} />
              </a>
            ))}
          </div>
          <Text size="sm" className={styles.muted}>© {t.footer.copyright}</Text>
        </Container>
      </div>
    </footer>
  )
}
