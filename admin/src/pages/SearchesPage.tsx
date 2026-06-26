import { Badge, Group, Stack, Table, Text, Title } from "@mantine/core";
import { DollarSign, FileSearch, ListChecks } from "lucide-react";
import { adminApi, type ViolationRecord } from "../api/admin";
import { usePagedData } from "../hooks/usePagedData";
import { StatCard } from "../components/StatCard";
import { TablePanel } from "../components/TablePanel";
import { formatDate, formatQar } from "../utils/format";

const PAGE_SIZE = 20;

const TYPE_COLOR: Record<string, string> = {
  vehicle: "blue",
  personal: "grape",
  establishment: "teal",
};

export function SearchesPage() {
  const { state, onSearch, onPage } = usePagedData<ViolationRecord>(
    adminApi.getViolations,
    PAGE_SIZE,
  );

  return (
    <Stack gap="lg">
      <div>
        <Title order={2}>Searches</Title>
        <Text c="dimmed" size="sm">
          Violation lookups performed by users
        </Text>
      </div>

      <Group gap="md" grow wrap="wrap">
        <StatCard
          label="Total searches"
          value={state.total}
          icon={FileSearch}
        />
        <StatCard
          label="Total violations"
          value={state.totalViolations}
          icon={ListChecks}
          color="orange"
        />
        <StatCard
          label="Total amount"
          value={formatQar(state.totalAmount)}
          icon={DollarSign}
          color="green"
        />
      </Group>

      <TablePanel
        search={state.search}
        loading={state.loading}
        error={state.error}
        empty={state.items.length === 0}
        page={state.page}
        total={state.total}
        pageSize={PAGE_SIZE}
        colSpan={7}
        onSearch={onSearch}
        onPage={onPage}
        head={
          <Table.Tr>
            <Table.Th>Reference</Table.Th>
            <Table.Th>Type</Table.Th>
            <Table.Th>Identifier</Table.Th>
            <Table.Th>Owner</Table.Th>
            <Table.Th>Violations</Table.Th>
            <Table.Th>Total</Table.Th>
            <Table.Th>Updated</Table.Th>
          </Table.Tr>
        }
        body={state.items.map((v) => (
          <Table.Tr key={v._id}>
            <Table.Td>
              <Text size="sm" fw={600} ff="monospace">
                {v.referenceId}
              </Text>
            </Table.Td>
            <Table.Td>
              <Badge
                color={TYPE_COLOR[v.searchType] ?? "gray"}
                variant="light"
                tt="capitalize"
              >
                {v.searchType}
              </Badge>
            </Table.Td>
            <Table.Td>{v.identifier}</Table.Td>
            <Table.Td>{v.ownerName || v.ownerNameAr || "—"}</Table.Td>
            <Table.Td>{v.totalCount}</Table.Td>
            <Table.Td>
              <Text fw={600}>{formatQar(v.totalAmount)}</Text>
            </Table.Td>
            <Table.Td>
              <Text size="sm" c="dimmed">
                {formatDate(v.updatedAt)}
              </Text>
            </Table.Td>
          </Table.Tr>
        ))}
      />
    </Stack>
  );
}
