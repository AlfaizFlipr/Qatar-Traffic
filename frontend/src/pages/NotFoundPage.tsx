import { Button, Container, Stack, Text, Title } from "@mantine/core";
import { Link } from "react-router-dom";
import { useLang } from "../context/LanguageContext";

export function NotFoundPage() {
  const { t } = useLang();
  return (
    <Container
      size="sm"
      style={{ minHeight: "70vh", display: "grid", placeItems: "center" }}
    >
      <Stack align="center" gap="md">
        <Title order={1} style={{ fontSize: "5rem", color: "#16294e" }}>
          404
        </Title>
        <Text size="lg" c="dimmed">
          {t.common.notFound}
        </Text>
        <Button component={Link} to="/" radius="md">
          {t.common.backHome}
        </Button>
      </Stack>
    </Container>
  );
}
