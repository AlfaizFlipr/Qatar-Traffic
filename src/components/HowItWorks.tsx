import { Card, Container, Group, Text } from '@mantine/core'
import { Check, Search, ShieldCheck } from 'lucide-react'
import { translations } from '../constants/translations'
import type { Language } from '../types'
import { SectionHeader } from './Shared/SectionHeader'
import styles from './HowItWorks.module.scss'

type Props = Readonly<{
  language: Language
  t: (typeof translations)[Language]
}>

export function HowItWorks({ language, t }: Props) {
  const isArabic = language === 'ar'

  const steps = [
    { icon: <Search size={18} /> },
    { icon: <ShieldCheck size={18} /> },
    { icon: <Check size={18} /> }
  ]

  return (
    <section className={styles.section} dir={isArabic ? 'rtl' : 'ltr'}>
      <Container size="lg">
        <SectionHeader title={t.process.title} />
        <div className={styles.steps}>
          {t.process.steps.map((step, idx) => (
            <Card key={step.title} className={styles.card}>
              <Group gap={10}>
                <div className={styles.number}>{idx + 1}</div>
                {steps[idx].icon}
              </Group>
              <Text fw={700} mt="sm">{step.title}</Text>
              <Text c="dimmed">{step.desc}</Text>
            </Card>
          ))}
        </div>
      </Container>
    </section>
  )
}
