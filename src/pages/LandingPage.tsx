import { useState } from 'react'
import { CTASection } from '../components/CTASection'
import { FAQSection } from '../components/FAQSection'
import { FeaturesSection } from '../components/FeaturesSection'
import { Footer } from '../components/Footer'
import { HeroSection } from '../components/HeroSection'
import { HowItWorks } from '../components/HowItWorks'
import { Navbar } from '../components/Navbar'
import { SearchTabs } from '../components/SearchTabs'
import { WhyChooseUs } from '../components/WhyChooseUs'
import { translations } from '../constants/translations'

export function LandingPage() {
  const [language, setLanguage] = useState<'ar' | 'en'>('ar')
  const t = translations[language]

  return (
    <>
      <Navbar language={language} t={t} onToggleLanguage={() => setLanguage((prev) => (prev === 'ar' ? 'en' : 'ar'))} />
      <HeroSection language={language} t={t} />
      <SearchTabs language={language} t={t} />
      <FeaturesSection language={language} t={t} />
      <HowItWorks language={language} t={t} />
      <WhyChooseUs language={language} t={t} />
      <FAQSection language={language} t={t} />
      <CTASection language={language} t={t} />
      <Footer language={language} t={t} />
    </>
  )
}
