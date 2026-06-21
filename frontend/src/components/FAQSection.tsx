import { Accordion, Container, Text } from '@mantine/core'
import { faqContent } from '../constants/content'
import { translations } from '../constants/translations'
import type { Language } from '../types'
import { SectionHeader } from './Shared/SectionHeader'
import styles from './FAQSection.module.scss'

type Props = Readonly<{
  language: Language
  t: (typeof translations)[Language]
}>

export function FAQSection({ language, t }: Props) {
  const isArabic = language === 'ar'

  return (
    <section id="faq" className={styles.section} dir={isArabic ? 'rtl' : 'ltr'}>
      <Container size="lg">
        <SectionHeader title={t.faq.title} />
        <Accordion className={styles.accordion} variant="separated">
          {faqContent[language].map((item) => (
            <Accordion.Item key={item.question} value={item.question}>
              <Accordion.Control>{item.question}</Accordion.Control>
              <Accordion.Panel>
                <Text c="dimmed">{item.answer}</Text>
              </Accordion.Panel>
            </Accordion.Item>
          ))}
        </Accordion>
      </Container>
    </section>
  )
}
