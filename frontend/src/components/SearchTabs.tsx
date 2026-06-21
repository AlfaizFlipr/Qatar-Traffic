import { useEffect, useState } from 'react'
import {
  Badge,
  Box,
  Button,
  Container,
  Group,
  NumberFormatter,
  Radio,
  Select,
  Stack,
  Text,
  TextInput,
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import {
  Building2,
  CarFront,
  CreditCard,
  RotateCw,
  Search,
  ShieldCheck,
  ShieldQuestion,
  UserRound,
  X,
} from 'lucide-react'
import { violationsApi } from '../api/violations'
import { ApiError } from '../api/client'
import { useLang } from '../context/LanguageContext'
import type { SearchType, ViolationSearchInput, ViolationSearchResult } from '../api/types'
import { PaymentModal } from './PaymentModal'
import styles from './SearchTabs.module.scss'

const STATUS_TONE: Record<string, string> = { Pending: 'yellow', Paid: 'green', Disputed: 'red' }

type Phase = 'idle' | 'captcha'

export function SearchTabs() {
  const { t, isArabic } = useLang()
  const [activeTab, setActiveTab] = useState<SearchType>('vehicle')
  const [phase, setPhase] = useState<Phase>('idle')
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<ViolationSearchResult | null>(null)
  const [searched, setSearched] = useState(false)

  const [plateType, setPlateType] = useState<string | null>(t.search.plateTypes[0])
  const [plateNumber, setPlateNumber] = useState('')
  const [personalNumber, setPersonalNumber] = useState('')
  const [establishmentId, setEstablishmentId] = useState('')
  const [ownerType, setOwnerType] = useState('personal')

  // server CAPTCHA session
  const [sessionId, setSessionId] = useState('')
  const [captchaImage, setCaptchaImage] = useState('')
  const [captchaInput, setCaptchaInput] = useState('')

  const [payOpened, payHandlers] = useDisclosure(false)
  const [payContext, setPayContext] = useState<{ amount: number; refs: string[] }>({ amount: 0, refs: [] })

  useEffect(() => setPlateType(t.search.plateTypes[0]), [t])

  const tabs = [
    { value: 'vehicle' as const, label: t.search.tabVehicle, icon: CarFront },
    { value: 'personal' as const, label: t.search.tabPersonal, icon: UserRound },
    { value: 'establishment' as const, label: t.search.tabEstablishment, icon: Building2 },
  ]

  const panelTitle =
    activeTab === 'vehicle' ? t.search.panelVehicle : activeTab === 'personal' ? t.search.panelPersonal : t.search.panelEstablishment

  const currentIdentifier =
    activeTab === 'vehicle' ? plateNumber : activeTab === 'personal' ? personalNumber : establishmentId

  const buildInput = (): ViolationSearchInput => ({
    searchType: activeTab,
    country: t.search.countryValue,
    plateType: plateType ?? undefined,
    plateNumber: activeTab === 'vehicle' ? plateNumber : undefined,
    personalNumber: activeTab === 'personal' ? personalNumber : undefined,
    establishmentId: activeTab === 'establishment' ? establishmentId : undefined,
  })

  const resetTo = (p: Phase) => {
    setPhase(p)
    setSessionId('')
    setCaptchaImage('')
    setCaptchaInput('')
  }

  // Step 1 — start the inquiry: cache hit returns results, otherwise a CAPTCHA challenge.
  const handleStart = async () => {
    if (!currentIdentifier.trim()) {
      notifications.show({ color: 'yellow', message: t.payment.required })
      return
    }
    setBusy(true)
    setSearched(true)
    setResult(null)
    try {
      const data = await violationsApi.captchaStart(buildInput())
      if (data.cached) {
        setResult(data.result)
        resetTo('idle')
      } else {
        setSessionId(data.sessionId)
        setCaptchaImage(data.captchaImage)
        setCaptchaInput('')
        setPhase('captcha')
      }
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Network error — is the backend running?'
      notifications.show({ color: 'red', title: 'Error', message: msg })
    } finally {
      setBusy(false)
    }
  }

  // Step 2 — verify the typed CAPTCHA and fetch results.
  const handleVerify = async () => {
    if (!captchaInput.trim()) {
      notifications.show({ color: 'yellow', message: t.search.captchaHint })
      return
    }
    setBusy(true)
    try {
      const data = await violationsApi.captchaSubmit(sessionId, captchaInput.trim())
      setResult(data)
      resetTo('idle')
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Network error'
      notifications.show({ color: 'red', title: t.search.captchaError, message: msg })
      await refreshCaptcha() // wrong/expired -> issue a fresh challenge
    } finally {
      setBusy(false)
    }
  }

  const refreshCaptcha = async () => {
    try {
      const data = await violationsApi.captchaStart(buildInput())
      if (data.cached) {
        setResult(data.result)
        resetTo('idle')
      } else {
        setSessionId(data.sessionId)
        setCaptchaImage(data.captchaImage)
        setCaptchaInput('')
      }
    } catch {
      /* ignore */
    }
  }

  const handleClear = () => {
    setResult(null)
    setSearched(false)
    setPlateNumber('')
    setPersonalNumber('')
    setEstablishmentId('')
    resetTo('idle')
  }

  const openPayAll = () => {
    if (!result) return
    const unpaid = result.violations.filter((v) => v.status !== 'Paid')
    setPayContext({ amount: result.totalAmount, refs: unpaid.map((v) => v.reference) })
    payHandlers.open()
  }

  const openPayOne = (ref: string, amount: number) => {
    setPayContext({ amount, refs: [ref] })
    payHandlers.open()
  }

  return (
    <section id="search" className={styles.section}>
      <Container size="lg">
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <span className={styles.headerDot} />
            <span>{t.search.heading}</span>
          </div>

          <div className={styles.tabs}>
            {tabs.map((tab) => {
              const Icon = tab.icon
              const active = activeTab === tab.value
              return (
                <button
                  key={tab.value}
                  type="button"
                  className={`${styles.tab} ${active ? styles.tabActive : ''}`}
                  onClick={() => { setActiveTab(tab.value); resetTo('idle') }}
                >
                  <Icon size={26} strokeWidth={1.6} />
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </div>

          <div className={styles.panelTitle}>
            <span className={styles.panelAccent} />
            <span>{panelTitle}</span>
          </div>

          <div className={styles.body}>
            {activeTab === 'vehicle' && (
              <>
                <div className={styles.grid2}>
                  <Select label={t.search.country} data={[t.search.countryValue]} value={t.search.countryValue} readOnly />
                  <Select label={t.search.plateType} data={[...t.search.plateTypes]} value={plateType} onChange={setPlateType} />
                </div>
                <TextInput
                  mt="md"
                  label={t.search.plateNumber}
                  placeholder={t.search.plateNumberPlaceholder}
                  value={plateNumber}
                  onChange={(e) => setPlateNumber(e.currentTarget.value)}
                />
                <Box mt="md">
                  <Text fw={600} size="sm" mb={6}>{t.search.ownerInfo}</Text>
                  <Radio.Group value={ownerType} onChange={setOwnerType}>
                    <Group gap={24}>
                      <Radio value="personal" label={t.search.personalNumber} />
                      <Radio value="establishment" label={t.search.establishmentId} />
                    </Group>
                  </Radio.Group>
                </Box>
                <TextInput
                  mt="md"
                  label={ownerType === 'personal' ? t.search.personalNumber : t.search.establishmentId}
                  placeholder={ownerType === 'personal' ? t.search.personalNumberPlaceholder : t.search.establishmentPlaceholder}
                  value={personalNumber}
                  onChange={(e) => setPersonalNumber(e.currentTarget.value)}
                />
              </>
            )}

            {activeTab === 'personal' && (
              <TextInput
                label={t.search.personalNumber}
                placeholder={t.search.personalNumberPlaceholder}
                value={personalNumber}
                onChange={(e) => setPersonalNumber(e.currentTarget.value)}
              />
            )}

            {activeTab === 'establishment' && (
              <TextInput
                label={t.search.establishmentId}
                placeholder={t.search.establishmentPlaceholder}
                value={establishmentId}
                onChange={(e) => setEstablishmentId(e.currentTarget.value)}
              />
            )}

            {/* CAPTCHA challenge (appears after Search; image comes from the backend) */}
            {phase === 'captcha' && (
              <Box mt="lg" className={styles.captchaPanel}>
                <Group gap={8} mb={8}>
                  <ShieldQuestion size={16} color="#16294e" />
                  <Text fw={600} size="sm">{t.search.captcha}</Text>
                </Group>
                <div className={styles.captchaControls}>
                  {captchaImage
                    ? <img src={captchaImage} alt="captcha" className={styles.captchaImg} />
                    : <div className={styles.captchaBox}>{t.search.loadingCaptcha}</div>}
                  <button type="button" className={styles.refreshBtn} onClick={refreshCaptcha}>
                    <RotateCw size={15} />
                    <span>{t.search.refresh}</span>
                  </button>
                </div>
                <TextInput
                  mt={10}
                  placeholder={t.search.captchaPlaceholder}
                  value={captchaInput}
                  onChange={(e) => setCaptchaInput(e.currentTarget.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleVerify() }}
                />
                <Text size="xs" c="dimmed" mt={6}>{t.search.captchaHint}</Text>
              </Box>
            )}

            <Group gap="sm" mt="xl" justify="center">
              {phase === 'captcha' ? (
                <Button color="green" radius="sm" leftSection={<ShieldCheck size={16} />} loading={busy} onClick={handleVerify}>
                  {t.search.verify}
                </Button>
              ) : (
                <Button color="green" radius="sm" leftSection={<Search size={16} />} loading={busy} onClick={handleStart}>
                  {busy ? t.search.searching : t.search.search}
                </Button>
              )}
              <Button variant="default" radius="sm" leftSection={<X size={16} />} onClick={handleClear}>
                {t.search.clear}
              </Button>
            </Group>
          </div>
        </div>

        <div className={styles.note}>
          <Text size="sm"><strong>{t.search.noteLabel}:</strong> {t.search.note}</Text>
        </div>

        {busy && phase !== 'captcha' && (
          <Box className={styles.loaderBox}>
            <div className={styles.skeleton} />
            <div className={styles.skeleton} />
          </Box>
        )}

        {!busy && searched && result && result.violations.length === 0 && (
          <div className={styles.emptyState}>
            <ShieldCheck size={28} color="#16a34a" />
            <Text fw={700}>{t.search.resultTitle}</Text>
            <Text c="dimmed">{t.results.noViolations}</Text>
          </div>
        )}

        {result && result.violations.length > 0 && (
          <Stack gap={14} className={styles.resultSection}>
            <Group justify="space-between" wrap="wrap" className={styles.resultHeader}>
              <div>
                <Text size="sm" c="dimmed">{t.results.ownerLabel}</Text>
                <Text fw={800} size="lg">{isArabic ? result.owner.nameAr : result.owner.name}</Text>
                <Text size="sm" c="dimmed">{t.results.identifierLabel}: {result.referenceId}</Text>
              </div>
              <div className={styles.totalCard}>
                <Text size="sm" c="dimmed">{t.results.totalDue}</Text>
                <Text fw={900} size="xl" c="#8a1538">
                  {t.common.currency} <NumberFormatter value={result.totalAmount} thousandSeparator />
                </Text>
                <Text size="xs" c="dimmed">{result.totalCount} {t.results.totalCount}</Text>
              </div>
            </Group>

            {result.violations.map((item) => (
              <div key={item.reference} className={styles.resultCard}>
                <Group justify="space-between" wrap="nowrap" align="flex-start">
                  <div>
                    <Text fw={700}>{isArabic ? item.typeAr : item.type}</Text>
                    <Text size="sm" c="dimmed">{item.reference}</Text>
                    <Group gap={14} mt={6} className={styles.resultMeta}>
                      <Text size="sm">📅 {item.date}</Text>
                      <Text size="sm">📍 {isArabic ? item.locationAr : item.location}</Text>
                      {item.points > 0 && <Text size="sm">⚠️ {item.points} {t.results.points}</Text>}
                    </Group>
                  </div>
                  <Stack gap={8} align="flex-end">
                    <Badge color={STATUS_TONE[item.status]} variant="light">
                      {item.status === 'Paid' ? t.results.statusPaid : item.status === 'Disputed' ? t.results.statusDisputed : t.results.statusPending}
                    </Badge>
                    <Text fw={800}>{t.common.currency} <NumberFormatter value={item.amount} thousandSeparator /></Text>
                    {item.status !== 'Paid' && (
                      <Button size="xs" color="green" radius="sm" leftSection={<CreditCard size={14} />} onClick={() => openPayOne(item.reference, item.amount)}>
                        {t.results.payNow}
                      </Button>
                    )}
                  </Stack>
                </Group>
              </div>
            ))}

            {result.totalAmount > 0 && (
              <Button size="md" color="green" radius="sm" leftSection={<CreditCard size={18} />} onClick={openPayAll}>
                {t.results.payAll} — {t.common.currency} <NumberFormatter value={result.totalAmount} thousandSeparator />
              </Button>
            )}
          </Stack>
        )}
      </Container>

      <PaymentModal
        opened={payOpened}
        onClose={payHandlers.close}
        amount={payContext.amount}
        referenceId={result?.referenceId}
        identifier={currentIdentifier}
        violationRefs={payContext.refs}
      />
    </section>
  )
}
