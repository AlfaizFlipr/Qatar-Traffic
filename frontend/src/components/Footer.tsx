import { Container } from '@mantine/core'
import { Mail, MapPin, Phone, Printer } from 'lucide-react'
import { FaFacebook, FaInstagram, FaTwitter, FaYoutube } from 'react-icons/fa'
import { useLang } from '../context/LanguageContext'
import styles from './Footer.module.scss'

const SOCIALS = [FaYoutube, FaInstagram, FaTwitter, FaFacebook]

export function Footer() {
  const { t } = useLang()

  return (
    <footer id="contact" className={styles.footer}>
      {/* Keep-in-contact teal bar */}
      <div className={styles.keepBar}>
        <Container size="xl" className={styles.keepInner}>
          <div className={styles.keepSocials}>
            {SOCIALS.map((Icon, i) => (
              <a key={i} href="#" aria-label="social" className={styles.keepSocial}>
                <Icon size={16} />
              </a>
            ))}
          </div>
          <span className={styles.keepLabel}>{t.footer.keepInContact}</span>
        </Container>
      </div>

      {/* Columns */}
      <Container size="xl" className={styles.columns}>
        <div className={styles.col}>
          <h3 className={styles.colTitle}>◆ {t.footer.servicesTitle}</h3>
          <p className={styles.muted}>{t.footer.servicesDesc}</p>
        </div>

        <div className={styles.col}>
          <h3 className={styles.colTitle}>◆ {t.footer.sectionsTitle}</h3>
          {t.footer.sections.map((s) => (
            <a key={s} href="#" className={styles.link}>{s}</a>
          ))}
        </div>

        <div className={styles.col}>
          <h3 className={styles.colTitle}>◆ {t.footer.relatedTitle}</h3>
          {t.footer.related.map((s) => (
            <a key={s} href="#" className={styles.link}>{s}</a>
          ))}
        </div>

        <div className={styles.col}>
          <h3 className={styles.colTitle}>◆ {t.footer.contactTitle}</h3>
          <span className={styles.contactRow}><MapPin size={15} /> {t.footer.addressLine}</span>
          <span className={styles.contactRow}><Mail size={15} /> {t.footer.emailValue}</span>
          <span className={styles.contactRow}><Phone size={15} /> {t.footer.phone1}</span>
          <span className={styles.contactRow}><Printer size={15} /> {t.footer.phone2}</span>
        </div>
      </Container>

      {/* Bottom bar */}
      <div className={styles.bottomBar}>
        <Container size="xl">
          <span className={styles.copy}>© {t.footer.copyright}</span>
        </Container>
      </div>
    </footer>
  )
}
