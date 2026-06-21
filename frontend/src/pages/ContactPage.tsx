import { Container, Group, SimpleGrid, Stack, Text, ThemeIcon } from '@mantine/core'
import { Mail, MapPin, Phone } from 'lucide-react'
import { PageHero } from '../components/PageHero'
import { useLang } from '../context/LanguageContext'

export function ContactPage() {
  const { t } = useLang()

  const items = [
    { icon: Mail, label: t.contact.email, value: 'info@qatartraffic.gov' },
    { icon: Phone, label: t.contact.phone, value: '+974 4000 1111' },
    { icon: MapPin, label: t.contact.address, value: t.contact.addressValue },
  ]

  return (
    <>
      <PageHero title={t.contact.title} subtitle={t.contact.subtitle} />
      <Container size="md" py={48}>
        <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="lg">
          {items.map((it) => (
            <Stack key={it.label} align="center" gap={10} p="xl" style={{ background: '#fff', border: '1px solid #f0e9ed', borderRadius: 18 }}>
              <ThemeIcon size={52} radius="xl" color="qatar" variant="light">
                <it.icon size={24} />
              </ThemeIcon>
              <Text fw={700}>{it.label}</Text>
              <Group gap={6}><Text c="dimmed">{it.value}</Text></Group>
            </Stack>
          ))}
        </SimpleGrid>
      </Container>
    </>
  )
}
