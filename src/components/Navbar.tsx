import { useEffect, useState } from 'react'
import { Button, Container, UnstyledButton } from '@mantine/core'
import { ArrowRight, Menu } from 'lucide-react'
import qatarLogo from '../assets/images/Qatar-logo.png'
import { translations } from '../constants/translations'
import type { Language } from '../types'
import { LanguageToggle } from './LanguageToggle'
import styles from './Navbar.module.scss'

type Props = Readonly<{
  language: Language
  t: (typeof translations)[Language]
  onToggleLanguage: () => void
}>

export function Navbar({ language, t, onToggleLanguage }: Props) {
  const isArabic = language === 'ar'
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const links = [
    { key: t.nav.home, href: '#home' },
    { key: t.nav.services, href: '#search' },
    { key: t.nav.faq, href: '#faq' },
    { key: t.nav.contact, href: '#contact' }
  ]

  return (
    <header className={`${styles.header} ${scrolled ? styles.scrolled : ''}`} dir={isArabic ? 'rtl' : 'ltr'}>
      <Container size="lg">
        <div className={styles.bar}>
          <a href="#home" className={styles.brand}>
            <div className={styles.logoBox}>
              <img src={qatarLogo} alt="Qatar logo" className={styles.logo} />
            </div>
            <div className={styles.brandText}>
              <span className={styles.brandTitle}>{isArabic ? 'مخالفتي' : 'Qatar Traffic'}</span>
              <span className={styles.brandSub}>{isArabic ? 'خدمات الوزارة' : 'Ministry Services'}</span>
            </div>
          </a>

          <nav className={styles.links}>
            {links.map((item) => (
              <a key={item.href} href={item.href} className={styles.link}>
                {item.key}
              </a>
            ))}
          </nav>

          <div className={styles.actions}>
            <LanguageToggle language={language} onToggle={onToggleLanguage} />

            <Button
              className={styles.cta}
              rightSection={<ArrowRight size={16} style={{ transform: isArabic ? 'scaleX(-1)' : 'none' }} />}
              style={{ background: 'linear-gradient(90deg, #8a1538, #a32a4e)' }}
              radius="xl"
            >
              {isArabic ? 'ابدأ الآن' : 'Get Started'}
            </Button>

            <UnstyledButton className={styles.menuBtn} aria-label="Open menu">
              <Menu size={18} />
            </UnstyledButton>
          </div>
        </div>
      </Container>
    </header>
  )
}