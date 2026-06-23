import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Alert,
  Box,
  Button,
  Center,
  Paper,
  PasswordInput,
  Stack,
  Text,
  TextInput,
  ThemeIcon,
  Title,
} from '@mantine/core'
import { AlertCircle, Lock, ShieldCheck, User } from 'lucide-react'
import { useAdminAuth } from '../context/AdminAuthContext'
import { ApiError } from '../api/client'

export function LoginPage() {
  const { login } = useAdminAuth()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await login(username, password)
      navigate('/', { replace: true })
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #8d1b3d 0%, #520d23 100%)',
      }}
    >
      <Center mih="100vh" p="md">
        <Paper shadow="xl" radius="lg" p="xl" w={420} maw="100%">
          <Stack gap="lg">
            <Stack gap={6} align="center">
              <ThemeIcon size={64} radius="xl" variant="light" color="brand">
                <ShieldCheck size={34} />
              </ThemeIcon>
              <Title order={2} ta="center">
                Admin Panel
              </Title>
              <Text c="dimmed" size="sm" ta="center">
                Sign in to manage payments and searches
              </Text>
            </Stack>

            {error && (
              <Alert color="red" variant="light" icon={<AlertCircle size={16} />}>
                {error}
              </Alert>
            )}

            <form onSubmit={handleSubmit}>
              <Stack gap="md">
                <TextInput
                  label="Username"
                  placeholder="admin"
                  size="md"
                  leftSection={<User size={16} />}
                  value={username}
                  onChange={(e) => setUsername(e.currentTarget.value)}
                  required
                  autoFocus
                />
                <PasswordInput
                  label="Password"
                  placeholder="Your password"
                  size="md"
                  leftSection={<Lock size={16} />}
                  value={password}
                  onChange={(e) => setPassword(e.currentTarget.value)}
                  required
                />
                <Button type="submit" size="md" loading={loading} fullWidth mt="xs">
                  Sign in
                </Button>
              </Stack>
            </form>
          </Stack>
        </Paper>
      </Center>
    </Box>
  )
}
