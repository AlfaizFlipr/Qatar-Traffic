import { FAQSection } from '../components/FAQSection'
import { PageHero } from '../components/PageHero'
import { useLang } from '../context/LanguageContext'

export function FaqPage() {
  const { language, t } = useLang()
  return (
    <>
      <PageHero title={t.faq.title} subtitle={t.faq.subtitle} />
      <FAQSection language={language} t={t} />
    </>
  )
}
