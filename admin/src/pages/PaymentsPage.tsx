import { Badge, Group, Stack, Table, Text, Title } from '@mantine/core'
import { CreditCard, DollarSign, Wallet } from 'lucide-react'
import { adminApi, type PaymentRecord } from '../api/admin'
import { usePagedData } from '../hooks/usePagedData'
import { StatCard } from '../components/StatCard'
import { TablePanel } from '../components/TablePanel'
import { formatDate, formatQar } from '../utils/format'

const PAGE_SIZE = 20

function statusColor(status: string) {
  return status === 'forwarded' ? 'green' : status === 'failed' ? 'red' : status === 'submitted' ? 'blue' : 'gray'
}

export function PaymentsPage() {
  const { state, onSearch, onPage } = usePagedData<PaymentRecord>(adminApi.getPayments, PAGE_SIZE)

  return (
    <Stack gap="lg">
      <div>
        <Title order={2}>Payments</Title>
        <Text c="dimmed" size="sm">
          All payment submissions received from customers
        </Text>
      </div>

      <Group gap="md" grow wrap="wrap">
        <StatCard label="Total payments" value={state.total} icon={CreditCard} />
        <StatCard label="Total amount" value={formatQar(state.totalAmount)} icon={DollarSign} color="green" />
        <StatCard label="On this page" value={state.items.length} icon={Wallet} color="blue" />
      </Group>

      <TablePanel
        search={state.search}
        loading={state.loading}
        error={state.error}
        empty={state.items.length === 0}
        page={state.page}
        total={state.total}
        pageSize={PAGE_SIZE}
        colSpan={8}
        onSearch={onSearch}
        onPage={onPage}
        head={
          <Table.Tr>
            <Table.Th>Reference</Table.Th>
            <Table.Th>Customer</Table.Th>
            <Table.Th>Mobile</Table.Th>
            <Table.Th>Email</Table.Th>
            <Table.Th>Amount</Table.Th>
            <Table.Th>Status</Table.Th>
            <Table.Th>Violations</Table.Th>
            <Table.Th>Created</Table.Th>
          </Table.Tr>
        }
        body={state.items.map((p) => (
          <Table.Tr key={p._id}>
            <Table.Td>
              <Text size="sm" fw={600} ff="monospace">
                {p.reference}
              </Text>
            </Table.Td>
            <Table.Td>{p.fullName}</Table.Td>
            <Table.Td>{p.mobile}</Table.Td>
            <Table.Td>{p.email ?? '—'}</Table.Td>
            <Table.Td>
              <Text fw={600}>{formatQar(p.amount)}</Text>
            </Table.Td>
            <Table.Td>
              <Badge color={statusColor(p.status)} variant="light">
                {p.status}
              </Badge>
            </Table.Td>
            <Table.Td>{p.violationRefs?.length ?? 0}</Table.Td>
            <Table.Td>
              <Text size="sm" c="dimmed">
                {formatDate(p.createdAt)}
              </Text>
            </Table.Td>
          </Table.Tr>
        ))}
      />
    </Stack>
  )
}
