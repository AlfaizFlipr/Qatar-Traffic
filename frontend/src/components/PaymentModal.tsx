import { useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Group,
  Modal,
  NumberFormatter,
  Stack,
  Text,
  Textarea,
  TextInput,
} from '@mantine/core'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import { CheckCircle2, CreditCard, Send } from 'lucide-react'
import { paymentsApi } from '../api/payments'
import { ApiError } from '../api/client'
import { useLang } from '../context/LanguageContext'

interface Props {
  opened: boolean
  onClose: () => void
  amount: number
  referenceId?: string
  identifier?: string
  violationRefs?: string[]
}

export function PaymentModal({ opened, onClose, amount, referenceId, identifier, violationRefs }: Props) {
  const { t, language } = useLang()
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  const form = useForm({
    initialValues: { fullName: '', mobile: '', email: '', identifier: identifier ?? '', notes: '' },
    validate: {
      fullName: (v) => (v.trim().length < 2 ? t.payment.required : null),
      mobile: (v) => (/^[+\d][\d\s-]{5,}$/.test(v.trim()) ? null : t.payment.invalidMobile),
      email: (v) => (!v || /^\S+@\S+\.\S+$/.test(v) ? null : t.payment.invalidEmail),
    },
  })

  const handleClose = () => {
    setDone(false)
    form.reset()
    onClose()
  }

  const handleSubmit = form.onSubmit(async (values) => {
    setSubmitting(true)
    try {
      await paymentsApi.create({
        referenceId,
        fullName: values.fullName,
        mobile: values.mobile,
        email: values.email || undefined,
        identifier: values.identifier || identifier,
        amount,
        violationRefs,
        notes: values.notes || undefined,
        language,
      })
      setDone(true)
      notifications.show({ color: 'green', title: t.payment.successTitle, message: t.payment.successMsg })
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Network error'
      notifications.show({ color: 'red', title: t.payment.errorTitle, message: msg })
    } finally {
      setSubmitting(false)
    }
  })

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={
        <Group gap={8}>
          <CreditCard size={20} color="#16294e" />
          <Text fw={800}>{t.payment.title}</Text>
        </Group>
      }
      centered
      radius="lg"
      size="md"
    >
      {done ? (
        <Stack align="center" gap="md" py="md">
          <CheckCircle2 size={56} color="#16a34a" />
          <Text fw={800} size="lg">{t.payment.successTitle}</Text>
          <Text c="dimmed" ta="center">{t.payment.successMsg}</Text>
          <Button fullWidth radius="md" onClick={handleClose}>{t.common.backHome}</Button>
        </Stack>
      ) : (
        <form onSubmit={handleSubmit}>
          <Stack gap="sm">
            <Text c="dimmed" size="sm">{t.payment.subtitle}</Text>

            <Box
              p="md"
              style={{ background: 'rgba(22,41,78,0.06)', borderRadius: 12, border: '1px solid rgba(22,41,78,0.12)' }}
            >
              <Group justify="space-between">
                <Text size="sm" c="dimmed">{t.payment.amount}</Text>
                <Text fw={800} size="lg" c="#16294e">
                  {t.common.currency}{' '}
                  <NumberFormatter value={amount} thousandSeparator />
                </Text>
              </Group>
            </Box>

            <TextInput label={t.payment.fullName} withAsterisk {...form.getInputProps('fullName')} />
            <TextInput label={t.payment.mobile} withAsterisk placeholder="+974 ..." {...form.getInputProps('mobile')} />
            <TextInput label={t.payment.email} {...form.getInputProps('email')} />
            <TextInput label={t.payment.identifier} {...form.getInputProps('identifier')} />
            <Textarea label={t.payment.notes} autosize minRows={2} {...form.getInputProps('notes')} />

            <Alert color="qatar" variant="light" radius="md">
              {t.payment.subtitle}
            </Alert>

            <Group justify="flex-end" mt="xs">
              <Button variant="default" radius="md" onClick={handleClose}>{t.payment.cancel}</Button>
              <Button type="submit" radius="md" loading={submitting} leftSection={<Send size={16} />}>
                {submitting ? t.payment.submitting : t.payment.submit}
              </Button>
            </Group>
          </Stack>
        </form>
      )}
    </Modal>
  )
}
