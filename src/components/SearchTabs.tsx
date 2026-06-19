import { Badge, Box, Button, Container, Group, Paper, Radio, Select, Stack, Text, TextInput, Title } from '@mantine/core'
import { Building2, CarFront, ChevronLeft, CircleCheckBig, RefreshCw, Search, ShieldCheck, UserRound } from 'lucide-react'
import { useMemo, useState } from 'react'
import { mockViolationsContent } from '../constants/content'
import { translations } from '../constants/translations'
import type { Language, SearchTab, Violation } from '../types'
import styles from './SearchTabs.module.scss'

type Props = Readonly<{
  language: Language
  t: (typeof translations)[Language]
}>

export function SearchTabs({ language, t }: Props) {
  const isArabic = language === 'ar'
  const [activeTab, setActiveTab] = useState<SearchTab>('vehicle')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<Violation[]>([])
  const [searching, setSearching] = useState(false)

  const handleSearch = () => {
    setLoading(true)
    setSearching(true)
    setTimeout(() => {
      setResults(mockViolationsContent[language])
      setLoading(false)
    }, 1200)
  }

  const handleClear = () => {
    setResults([])
    setSearching(false)
  }

  const statusTone = useMemo(() => ({
    Pending: 'yellow',
    Paid: 'green',
    Disputed: 'red'
  }), [])

  const tabItems = [
    {
      value: 'vehicle' as const,
      label: t.search.tabVehicle,
      icon: <CarFront size={18} />
    },
    {
      value: 'personal' as const,
      label: t.search.tabPersonal,
      icon: <UserRound size={18} />
    },
    {
      value: 'establishment' as const,
      label: t.search.tabEstablishment,
      icon: <Building2 size={18} />
    }
  ]

  return (
    <section id="search" className={styles.section} dir={isArabic ? 'rtl' : 'ltr'}>
      <Container size="lg">
        <Paper className={styles.panel}>
          <div className={styles.topBar}>
            <div>
              <Text c="dimmed" size="sm">{isArabic ? 'خدمات الاستعلام' : 'Inquiry Services'}</Text>
              <Title order={2}>{t.search.tabVehicle}</Title>
            </div>
            <Badge color="red" variant="light" size="lg">{t.search.countryValue}</Badge>
          </div>

          <div className={styles.tabsRoot}>
            <nav className={styles.sidebar} aria-label={isArabic ? 'نوع الاستعلام' : 'Search type'}>
              {tabItems.map((tab) => {
                const isActive = activeTab === tab.value
                return (
                  <button
                    key={tab.value}
                    type="button"
                    className={styles.sidebarTab}
                    data-active={isActive || undefined}
                    aria-current={isActive}
                    onClick={() => setActiveTab(tab.value)}
                  >
                    <span className={styles.sidebarIcon}>{tab.icon}</span>
                    <span className={styles.sidebarLabel}>{tab.label}</span>
                    <ChevronLeft size={16} className={styles.sidebarChevron} />
                  </button>
                )
              })}
            </nav>

            <div className={styles.tabsPanel}>
              {activeTab === 'vehicle' && (
                <>
                  <div className={styles.formGrid}>
                    <Select label={t.search.country} data={[t.search.countryValue]} value={t.search.countryValue} />
                    <Select label={t.search.plateType} data={['خصوصي', 'نقل خاص', 'تجاري', 'دبلوماسي']} defaultValue="خصوصي" />
                    <TextInput label={t.search.plateNumber} placeholder={t.search.plateNumberPlaceholder} />
                    <div className={styles.ownerField}>
                      <Text fw={600} size="sm">{t.search.ownerInfo}</Text>
                      <Radio.Group defaultValue="personal" mt={10}>
                        <Group gap={16}>
                          <Radio value="personal" label={t.search.personalNumber} />
                          <Radio value="establishment" label={t.search.establishmentId} />
                        </Group>
                      </Radio.Group>
                    </div>
                    <TextInput label={t.search.personalNumber} />
                    <TextInput label={t.search.captcha} />
                  </div>
                  <Group justify="space-between" mt="lg" className={styles.formActions}>
                    <Group gap="xs">
                      <Button variant="light" size="sm" className={styles.secondaryButton} leftSection={<RefreshCw size={16} />}>
                        {t.search.refresh}
                      </Button>
                      <Button size="sm" leftSection={<Search size={16} />} onClick={handleSearch} className={styles.primaryButton}>
                        {t.search.search}
                      </Button>
                    </Group>
                    <Button variant="subtle" size="sm" color="gray" className={styles.clearButton} leftSection={<CircleCheckBig size={16} />} onClick={handleClear}>
                      {t.search.clear}
                    </Button>
                  </Group>
                </>
              )}

              {activeTab === 'personal' && (
                <>
                  <div className={styles.formGridSingle}>
                    <TextInput label={t.search.personalNumber} placeholder={isArabic ? 'أدخل الرقم الشخصي' : 'Enter personal number'} />
                    <TextInput label={t.search.captcha} />
                  </div>
                  <Group justify="space-between" mt="lg" className={styles.formActions}>
                    <Group gap="xs">
                      <Button variant="light" size="sm" className={styles.secondaryButton}>{t.search.refresh}</Button>
                      <Button size="sm" onClick={handleSearch} className={styles.primaryButton}>{t.search.search}</Button>
                    </Group>
                  </Group>
                </>
              )}

              {activeTab === 'establishment' && (
                <>
                  <div className={styles.formGridSingle}>
                    <TextInput label={t.search.establishmentId} placeholder="XX-XXX-XX" />
                    <TextInput label={t.search.captcha} />
                  </div>
                  <Group justify="space-between" mt="lg" className={styles.formActions}>
                    <Group gap="xs">
                      <Button variant="light" size="sm" className={styles.secondaryButton}>{t.search.refresh}</Button>
                      <Button size="sm" onClick={handleSearch} className={styles.primaryButton}>{t.search.search}</Button>
                    </Group>
                  </Group>
                </>
              )}
            </div>
          </div>

          {loading && (
            <Box className={styles.loaderBox}>
              <div className={styles.skeleton} />
              <div className={styles.skeleton} />
              <div className={styles.skeleton} />
            </Box>
          )}

          {!loading && searching && results.length === 0 && (
            <Paper className={styles.emptyState}>
              <ShieldCheck size={28} color="#8a1538" />
              <Text fw={700}>{t.search.resultTitle}</Text>
              <Text c="dimmed">No violations found</Text>
            </Paper>
          )}

          {!loading && results.length > 0 && (
            <Stack gap={12} className={styles.resultSection}>
              <Title order={3}>{t.search.resultTitle}</Title>
              {results.map((item) => (
                <Paper key={item.id} className={styles.resultCard}>
                  <Group justify="space-between">
                    <div>
                      <Text fw={700}>{item.title}</Text>
                      <Text size="sm" c="dimmed">{item.id}</Text>
                    </div>
                    <Badge color={statusTone[item.status]}>{item.status}</Badge>
                  </Group>
                  <Group className={styles.resultMeta}>
                    <Text size="sm">{item.date}</Text>
                    <Text size="sm">{item.location}</Text>
                    <Text size="sm" fw={700}>QAR {item.amount}</Text>
                  </Group>
                  <Button variant="light" color="red">Pay Now</Button>
                </Paper>
              ))}
            </Stack>
          )}
        </Paper>
      </Container>
    </section>
  )
}