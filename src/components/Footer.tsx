import { Container, Group, SimpleGrid, Stack, Text } from '@mantine/core'
import { Globe, Mail, MapPin, Phone } from 'lucide-react'
import { translations } from '../constants/translations'
import type { Language } from '../types'
import styles from './Footer.module.scss'

type Props = Readonly<{
  language: Language
  t: (typeof translations)[Language]
}>

export function Footer({ language, t }: Props) {
  const isArabic = language === 'ar'

  return (
    <footer id="contact" className={styles.footer} dir={isArabic ? 'rtl' : 'ltr'}>
      <Container size="lg">
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="xl">
          <Stack gap={10}>
            <Text fw={800}>Qatar Traffic</Text>
            <Text c="dimmed">A trusted digital service for inquiry and compliance support.</Text>
          </Stack>
          <Stack gap={10}>
            <Text fw={700}>{t.footer.quickLinks}</Text>
            <Text size="sm">Home</Text>
            <Text size="sm">Services</Text>
            <Text size="sm">FAQ</Text>
            <Text size="sm">Contact</Text>
          </Stack>
          <Stack gap={10}>
            <Text fw={700}>{t.footer.services}</Text>
            <Text size="sm">Traffic Inquiries</Text>
            <Text size="sm">Visa inquiry</Text>
            <Text size="sm">Exit-Entry Services</Text>
            <Text size="sm">Residency Permits</Text>
          </Stack>
          <Stack gap={10}>
            <Text fw={700}>{t.footer.contact}</Text>
            <Group gap={8}>
              <Mail size={16} />
              <Text size="sm">info@qatartraffic.gov</Text>
            </Group>
            <Group gap={8}>
              <Phone size={16} />
              <Text size="sm">+974 4000 1111</Text>
            </Group>
            <Group gap={8}>
              <MapPin size={16} />
              <Text size="sm">Doha, Qatar</Text>
            </Group>
            <Group gap={8}>
              <Globe size={16} />
              <Text size="sm">qatartraffic.gov</Text>
            </Group>
          </Stack>
        </SimpleGrid>
        <div className={styles.bottomBar}>
          <Text size="sm" c="dimmed">© 2026 Qatar Traffic Services</Text>
          <Group gap={12}>
            <Text size="sm">Privacy Policy</Text>
            <Text size="sm">Terms of Use</Text>
          </Group>
        </div>
      </Container>
    </footer>
  )
}
