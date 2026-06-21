import { Stack, Text, Title } from '@mantine/core'

type Props = Readonly<{
  title: string
  subtitle?: string
  align?: 'left' | 'center'
}>

export function SectionHeader({ title, subtitle, align = 'center' }: Props) {
  return (
    <Stack gap={10} align={align === 'center' ? 'center' : 'flex-start'}>
      <Title order={2} size="h1" style={{ textAlign: align }}>
        {title}
      </Title>
      {subtitle && (
        <Text c="dimmed" size="md" style={{ textAlign: align, maxWidth: 700 }}>
          {subtitle}
        </Text>
      )}
    </Stack>
  )
}
