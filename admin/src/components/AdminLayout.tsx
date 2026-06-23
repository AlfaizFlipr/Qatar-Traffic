import { NavLink as RouterNavLink, Outlet, useLocation } from 'react-router-dom'
import { AppShell, Avatar, Burger, Group, NavLink, ScrollArea, Stack, Text, Title, UnstyledButton } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { CreditCard, FileSearch, LogOut, ShieldCheck } from 'lucide-react'
import { useAdminAuth } from '../context/AdminAuthContext'

const NAV = [
  { label: 'Payments', to: '/payments', icon: CreditCard },
  { label: 'Searches', to: '/searches', icon: FileSearch },
]

export function AdminLayout() {
  const [opened, { toggle, close }] = useDisclosure()
  const { logout } = useAdminAuth()
  const location = useLocation()

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{ width: 260, breakpoint: 'sm', collapsed: { mobile: !opened } }}
      padding="lg"
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group gap="sm">
            <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
            <ShieldCheck size={24} color="var(--mantine-color-brand-6)" />
            <Title order={4} c="brand.7">
              Qatar Admin
            </Title>
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="md">
        <AppShell.Section grow component={ScrollArea}>
          <Text size="xs" fw={700} c="dimmed" tt="uppercase" mb="xs">
            Menu
          </Text>
          <Stack gap={4}>
            {NAV.map((item) => {
              const Icon = item.icon
              const active = location.pathname === item.to
              return (
                <NavLink
                  key={item.to}
                  component={RouterNavLink}
                  to={item.to}
                  label={item.label}
                  leftSection={<Icon size={18} />}
                  active={active}
                  variant="filled"
                  onClick={close}
                />
              )
            })}
          </Stack>
        </AppShell.Section>

        <AppShell.Section>
          <UnstyledButton
            onClick={logout}
            style={{
              display: 'block',
              width: '100%',
              borderRadius: 'var(--mantine-radius-md)',
              padding: 'var(--mantine-spacing-sm)',
            }}
          >
            <Group>
              <Avatar color="brand" radius="xl">
                <ShieldCheck size={18} />
              </Avatar>
              <div style={{ flex: 1 }}>
                <Text size="sm" fw={600}>
                  Administrator
                </Text>
                <Group gap={4} c="red">
                  <LogOut size={12} />
                  <Text size="xs">Logout</Text>
                </Group>
              </div>
            </Group>
          </UnstyledButton>
        </AppShell.Section>
      </AppShell.Navbar>

      <AppShell.Main style={{ background: '#f6f7f9' }}>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  )
}
