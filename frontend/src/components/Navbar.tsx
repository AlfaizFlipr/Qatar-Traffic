import { Burger, Button, Container, Drawer, Stack } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { Camera, Globe, Languages, Play, Send } from 'lucide-react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import qatarLogo from '../assets/images/Qatar-logo.png'
import { useLang } from '../context/LanguageContext'
import styles from './Navbar.module.scss'

const SOCIALS = [Play, Camera, Send, Globe]

export function Navbar() {
  const { t, language, isArabic, toggleLanguage } = useLang()
  const [opened, { open, close }] = useDisclosure(false)
  const navigate = useNavigate()

  const links = [
    { label: t.nav.home, to: '/' },
    { label: t.nav.search, to: '/search' },
    { label: t.nav.about, to: '/about' },
    { label: t.nav.faq, to: '/faq' },
    { label: t.nav.contact, to: '/contact' },
  ]

  return (
    <header className={styles.header}>
      {/* Teal social strip */}
      <div className={styles.topbar}>
        <Container size="lg" className={styles.topbarInner}>
          <div className={styles.socials}>
            {SOCIALS.map((Icon, i) => (
              <a key={i} href="#" className={styles.socialLink} aria-label="social">
                <Icon size={17} />
              </a>
            ))}
          </div>
        </Container>
      </div>

      {/* Main header row: logo + actions */}
      <Container size="lg" className={styles.mainRow}>
        <Link to="/" className={styles.brand} aria-label="home">
          <img src={qatarLogo} alt="وزارة الداخلية - Ministry of Interior" className={styles.logo} />
        </Link>

        <div className={styles.actions}>
          <button type="button" className={styles.langBtn} onClick={toggleLanguage}>
            <Languages size={18} />
            <span>{language === 'ar' ? 'English' : 'العربية'}</span>
          </button>
          <Burger opened={opened} onClick={open} aria-label="menu" size="sm" />
        </div>
      </Container>

      <Drawer
        opened={opened}
        onClose={close}
        position={isArabic ? 'right' : 'left'}
        size="80%"
        title={t.nav.services}
        classNames={{ title: styles.drawerTitle }}
      >
        <Stack gap={6}>
          {links.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              onClick={close}
              className={({ isActive }) => `${styles.drawerLink} ${isActive ? styles.active : ''}`}
            >
              {item.label}
            </NavLink>
          ))}
          <Button mt="md" radius="md" color="green" onClick={() => { close(); navigate('/search') }}>
            {t.nav.getStarted}
          </Button>
        </Stack>
      </Drawer>
    </header>
  )
}
