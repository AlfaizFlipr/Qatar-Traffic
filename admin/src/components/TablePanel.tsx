import { useState, type FormEvent, type ReactNode } from "react";
import {
  Button,
  Center,
  Group,
  Loader,
  Pagination,
  Paper,
  ScrollArea,
  Stack,
  Table,
  Text,
  TextInput,
} from "@mantine/core";
import { Search, X } from "lucide-react";

interface TablePanelProps {
  search: string;
  loading: boolean;
  error: string | null;
  empty: boolean;
  page: number;
  total: number;
  pageSize: number;
  colSpan: number;
  head: ReactNode;
  body: ReactNode;
  onSearch: (q: string) => void;
  onPage: (p: number) => void;
}

export function TablePanel({
  search,
  loading,
  error,
  empty,
  page,
  total,
  pageSize,
  colSpan,
  head,
  body,
  onSearch,
  onPage,
}: TablePanelProps) {
  const [text, setText] = useState(search);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  function submit(e: FormEvent) {
    e.preventDefault();
    onSearch(text.trim());
  }

  return (
    <Paper withBorder radius="md" p={0} style={{ overflow: "hidden" }}>
      <Group
        justify="space-between"
        p="md"
        style={{ borderBottom: "1px solid var(--mantine-color-gray-2)" }}
      >
        <form onSubmit={submit} style={{ flex: 1, maxWidth: 420 }}>
          <Group gap="xs" wrap="nowrap">
            <TextInput
              placeholder="Search by name, reference, mobile…"
              value={text}
              onChange={(e) => setText(e.currentTarget.value)}
              leftSection={<Search size={16} />}
              rightSection={
                text ? (
                  <X
                    size={16}
                    style={{ cursor: "pointer" }}
                    onClick={() => {
                      setText("");
                      onSearch("");
                    }}
                  />
                ) : null
              }
              style={{ flex: 1 }}
            />
            <Button type="submit">Search</Button>
          </Group>
        </form>
        <Text size="sm" c="dimmed">
          {total} record{total === 1 ? "" : "s"}
        </Text>
      </Group>

      <ScrollArea>
        <Table
          striped
          highlightOnHover
          verticalSpacing="sm"
          horizontalSpacing="md"
          miw={760}
        >
          <Table.Thead style={{ background: "var(--mantine-color-gray-0)" }}>
            {head}
          </Table.Thead>
          <Table.Tbody>
            {body}
            {!loading && empty && (
              <Table.Tr>
                <Table.Td colSpan={colSpan}>
                  <Center py={48}>
                    <Stack align="center" gap={4}>
                      <Text fw={600}>
                        {error ? "Something went wrong" : "No records found"}
                      </Text>
                      <Text size="sm" c="dimmed">
                        {error ?? "Try adjusting your search."}
                      </Text>
                    </Stack>
                  </Center>
                </Table.Td>
              </Table.Tr>
            )}
          </Table.Tbody>
        </Table>
      </ScrollArea>

      {loading && (
        <Center py="xl">
          <Loader />
        </Center>
      )}

      {totalPages > 1 && (
        <Group
          justify="center"
          p="md"
          style={{ borderTop: "1px solid var(--mantine-color-gray-2)" }}
        >
          <Pagination total={totalPages} value={page} onChange={onPage} />
        </Group>
      )}
    </Paper>
  );
}
