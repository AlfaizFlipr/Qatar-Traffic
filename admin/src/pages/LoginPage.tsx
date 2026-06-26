import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";

import {
  Alert,
  Box,
  Button,
  Divider,
  Group,
  Paper,
  PasswordInput,
  Stack,
  Text,
  TextInput,
  ThemeIcon,
  Title,
} from "@mantine/core";

import {
  AlertCircle,
  BadgeCheck,
  Building2,
  KeyRound,
  Shield,
  ShieldCheck,
  User,
} from "lucide-react";

import { useAdminAuth } from "../context/AdminAuthContext";
import { ApiError } from "../api/client";

export function LoginPage() {
  const { login } = useAdminAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(username, password);
      navigate("/", { replace: true });
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Unable to sign in. Please verify your credentials and try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Box
      style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
        background: `
          radial-gradient(circle at top left, #b41d4b 0%, transparent 35%),
          radial-gradient(circle at bottom right, #7b1433 0%, transparent 35%),
          linear-gradient(135deg, #8d1b3d 0%, #520d23 100%)
        `,
        overflowY: "auto",
      }}
    >
      <Paper
        radius={16}
        shadow="xl"
        withBorder
        w={400}
        maw="100%"
        p={28}
        style={{
          background: "rgba(255,255,255,0.97)",
          backdropFilter: "blur(16px)",
          margin: "auto",
        }}
      >
        <Stack gap="md">
          {/* Header */}
          <Stack gap={4} align="center">
            <ThemeIcon
              size={56}
              radius="xl"
              variant="gradient"
              gradient={{ from: "#8d1b3d", to: "#d73d69", deg: 45 }}
            >
              <ShieldCheck size={28} strokeWidth={2.2} />
            </ThemeIcon>

            <Title order={3} ta="center" mt={4}>
              Qatar Traffic Violation Portal
            </Title>

            <Text fw={500} ta="center" size="sm">
              Welcome Back
            </Text>

            <Text ta="center" size="xs" c="dimmed" maw={320}>
              Secure administrator access for managing traffic violations,
              payments, and customer requests.
            </Text>
          </Stack>

          {/* Error */}
          {error && (
            <Alert
              color="red"
              variant="light"
              radius="md"
              p="xs"
              icon={<AlertCircle size={15} />}
              styles={{ message: { fontSize: 13 } }}
            >
              {error}
            </Alert>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <Stack gap="sm">
              <TextInput
                label="Username"
                placeholder="Enter your username"
                leftSection={<User size={15} />}
                value={username}
                onChange={(e) => setUsername(e.currentTarget.value)}
                required
                autoFocus
                size="sm"
                radius="md"
              />

              <PasswordInput
                label="Password"
                placeholder="Enter your password"
                leftSection={<KeyRound size={15} />}
                value={password}
                onChange={(e) => setPassword(e.currentTarget.value)}
                required
                size="sm"
                radius="md"
              />

              <Button
                type="submit"
                size="sm"
                radius="md"
                fullWidth
                mt={4}
                loading={loading}
                leftSection={<Shield size={15} />}
              >
                Secure Login In
              </Button>
            </Stack>
          </form>

          <Divider />

          {/* Footer */}
          <Stack gap={4}>
            <Group justify="center" gap={6}>
              <BadgeCheck size={13} color="var(--mantine-color-green-6)" />
              <Text size="xs" c="dimmed">
                Protected by Secure Authentication
              </Text>
            </Group>

            <Group justify="center" gap={6}>
              <Building2 size={13} color="var(--mantine-color-brand-6)" />
              <Text size="xs" c="dimmed">
                Authorized Personnel Only • Qatar Traffic Portal
              </Text>
            </Group>
          </Stack>
        </Stack>
      </Paper>
    </Box>
  );
}