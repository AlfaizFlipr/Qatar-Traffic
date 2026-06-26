import { Group, Paper, Text, ThemeIcon } from "@mantine/core";
import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  color?: string;
}

export function StatCard({
  label,
  value,
  icon: Icon,
  color = "brand",
}: StatCardProps) {
  return (
    <Paper withBorder radius="md" p="md" style={{ flex: 1, minWidth: 180 }}>
      <Group justify="space-between" wrap="nowrap">
        <div>
          <Text size="xs" c="dimmed" fw={600} tt="uppercase">
            {label}
          </Text>
          <Text size="xl" fw={700} mt={4}>
            {value}
          </Text>
        </div>
        <ThemeIcon size={44} radius="md" variant="light" color={color}>
          <Icon size={22} />
        </ThemeIcon>
      </Group>
    </Paper>
  );
}
