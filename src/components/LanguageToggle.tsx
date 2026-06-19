import { Group, Text, UnstyledButton } from '@mantine/core'
import { Languages } from 'lucide-react'

type Props = Readonly<{
  language: 'ar' | 'en'
  onToggle: () => void
}>

export function LanguageToggle({ language, onToggle }: Props) {
  return (
    <UnstyledButton
      onClick={onToggle}
      aria-label="Toggle language"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        background: 'rgba(255, 255, 255, 0.78)',
        border: '1px solid rgba(138, 21, 56, 0.12)',
        borderRadius: 999,
        padding: '8px 14px',
        transition: 'background 0.15s ease'
      }}
    >
      <Group gap={6} wrap="nowrap">
        <Languages size={16} color="#8a1538" />
        <Text size="sm" fw={700} c="#1c1410">
          {language === 'ar' ? 'EN' : 'ع'}
        </Text>
      </Group>
    </UnstyledButton>
  )
}