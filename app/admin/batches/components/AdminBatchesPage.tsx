"use client";

import { insertError } from "@/app/actions";
import StatusBadge from "@/app/user/orders/components/StatusBadge";
import { useUserData } from "@/stores/useUserStore";
import {
  BATCH_NEXT_STATUS,
  BATCH_STATUS_METADATA,
  BATCH_STATUS_OPTIONS,
  PAGINATION_OPTIONS,
  TEXT_LIMITS,
} from "@/utils/constants";
import dayjs from "@/utils/dayjs";
import {
  formatCurrency,
  formatDate,
  getBatchStatusColor,
  getBatchStatusDescription,
  isAppError,
} from "@/utils/functions";
import { supabaseClient } from "@/utils/supabase/client";
import {
  AdminBatch,
  AdminBatchSortAccessor,
  AdminSortStatus,
  BatchStatusEnum,
} from "@/utils/types";
import {
  ActionIcon,
  Box,
  Group,
  Paper,
  Progress,
  Select,
  Stack,
  Text,
  TextInput,
  ThemeIcon,
  Title,
  Tooltip,
  rem,
} from "@mantine/core";
import { useDebouncedValue } from "@mantine/hooks";
import { modals } from "@mantine/modals";
import { notifications } from "@mantine/notifications";
import { IconClipboardList, IconMaximize, IconSearch } from "@tabler/icons-react";
import { DataTableColumn } from "mantine-datatable";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import TableColumnVisibility, {
  TableColumnVisibilityOption,
} from "../../components/TableColumnVisibility";
import { getAdminBatchesPage, transitionBatchStatus } from "../actions";
import AdminBatchTable from "./AdminBatchTable";

const sortableColumns = new Set<AdminBatchSortAccessor>([
  "batch_date_created",
  "batch_number",
  "batch_status",
]);

const orderColumnOptions: TableColumnVisibilityOption[] = [
  { value: "batch_number", label: "Batch" },
  { value: "batch_status", label: "Status" },
  { value: "quantity", label: "Quantity" },
  { value: "progress", label: "Progress" },
  { value: "value", label: "Batch Value" },
  { value: "action", label: "Action" },
];

type Props = {
  batchLimit: number;
};

const AdminBatchesPage = ({ batchLimit }: Props) => {
  const userData = useUserData();
  const pathname = usePathname();
  const router = useRouter();

  const [records, setRecords] = useState<AdminBatch[]>([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [searchInput, setSearchInput] = useState("");
  const [search] = useDebouncedValue(searchInput, 400);
  const [batchStatus, setBatchStatus] = useState<BatchStatusEnum | "ALL">("ALL");
  const [page, setPage] = useState(1);
  const [recordsPerPage, setRecordsPerPage] = useState(PAGINATION_OPTIONS[0]);
  const [fetching, setFetching] = useState(false);
  const [sortStatus, setSortStatus] = useState<AdminSortStatus<AdminBatchSortAccessor>>({
    columnAccessor: "batch_number",
    direction: "desc",
  });
  const [loadingRow, setLoadingRow] = useState<string | null>(null);
  const [visibleColumns, setVisibleColumns] = useState(
    orderColumnOptions.map((column) => column.value),
  );
  const [prevFilters, setPrevFilters] = useState({ search, batchStatus });

  if (prevFilters.search !== search || prevFilters.batchStatus !== batchStatus) {
    setPrevFilters({ search, batchStatus });
    setPage(1);
  }

  const loadBatches = useCallback(async () => {
    if (!userData) return;

    setFetching(true);
    try {
      const result = await getAdminBatchesPage(supabaseClient, {
        page,
        recordsPerPage,
        search,
        batchStatus,
        sortColumnAccessor: sortStatus.columnAccessor,
        sortDirection: sortStatus.direction,
      });
      setRecords(result.records);
      setTotalRecords(result.totalRecords);
    } catch (e) {
      notifications.show({
        message: "Something went wrong. Please try again later.",
        color: "red",
      });
      if (isAppError(e)) {
        await insertError(supabaseClient, {
          errorTableInsert: {
            error_message: e.message,
            error_url: pathname,
            error_function: "loadAdminBatches",
            error_user_email: userData.email,
            error_user_id: userData.id,
          },
        });
      }
    } finally {
      setFetching(false);
    }
  }, [batchStatus, page, pathname, recordsPerPage, search, sortStatus, userData]);

  useEffect(() => {
    // eslint-disable-next-line
    loadBatches();
  }, [loadBatches]);

  const handleRecordsPerPageChange = useCallback((value: number) => {
    setRecordsPerPage(value);
    setPage(1);
  }, []);

  const handleStatusTransition = async (batchId: string, nextStatus: BatchStatusEnum) => {
    if (!userData) return;
    setLoadingRow(batchId);
    try {
      await transitionBatchStatus(supabaseClient, {
        batchId,
        nextStatus,
        userId: userData.id,
      });
      notifications.show({
        color: "green",
        message: `Batch moved to ${nextStatus}`,
      });
      loadBatches();
    } catch (e) {
      notifications.show({
        message: "Something went wrong. Please try again later.",
        color: "red",
      });
      if (isAppError(e)) {
        await insertError(supabaseClient, {
          errorTableInsert: {
            error_message: e.message,
            error_url: pathname,
            error_function: "handleStatusTransition",
            error_user_email: userData.email,
            error_user_id: userData.id,
          },
        });
      }
    } finally {
      setLoadingRow(null);
    }
  };

  const statusTransitionConfirmation = (batchId: string, currentStatus: BatchStatusEnum) => {
    const nextStatus = BATCH_NEXT_STATUS[currentStatus];

    if (!nextStatus) {
      notifications.show({
        message: `No next status defined for: ${currentStatus}`,
        color: "orange",
      });
      return;
    }

    const metadata = BATCH_STATUS_METADATA[nextStatus];
    const Icon = metadata.icon;
    const color = metadata.color ?? "blue";

    modals.openConfirmModal({
      title: "Confirm Status Update",
      children: (
        <Text size="sm">
          Move this batch from{" "}
          <Text span fw={600} tt="uppercase">
            {currentStatus}
          </Text>{" "}
          to{" "}
          <Text span fw={600} tt="uppercase" c={color}>
            {nextStatus}
          </Text>
          ?
        </Text>
      ),
      labels: { confirm: "Confirm", cancel: "Cancel" },
      confirmProps: {
        color,
        leftSection: Icon ? <Icon size={16} /> : undefined,
      },
      onConfirm: () => handleStatusTransition(batchId, nextStatus),
      centered: true,
    });
  };

  const handleSortStatusChange = useCallback(
    (nextSortStatus: { columnAccessor: string; direction: "asc" | "desc" }) => {
      if (!sortableColumns.has(nextSortStatus.columnAccessor as AdminBatchSortAccessor)) return;

      setSortStatus({
        columnAccessor: nextSortStatus.columnAccessor as AdminBatchSortAccessor,
        direction: nextSortStatus.direction,
      });
      setPage(1);
    },
    [],
  );

  const columns = useMemo<DataTableColumn<AdminBatch>[]>(
    () => [
      {
        accessor: "batch_number",
        title: "Batch",
        sortable: true,
        render: (batch) => (
          <Box>
            <Text fw={800}>Batch #{batch.batch_number}</Text>
            <Text size="xs" c="dimmed">
              {formatDate(new Date(batch.batch_date_created))}
            </Text>
          </Box>
        ),
      },
      {
        accessor: "batch_status",
        title: "Status",
        sortable: true,
        textAlign: "center",
        render: (batch) => (
          <StatusBadge
            label={batch.batch_status}
            color={getBatchStatusColor(batch.batch_status)}
            description={getBatchStatusDescription(batch.batch_status)}
            size="sm"
          />
        ),
      },
      {
        accessor: "quantity",
        title: "Quantity",
        textAlign: "center",
        render: ({ batch_order_quantity, batch_status }) => (
          <Text>
            {batch_status === "PENDING"
              ? `${batch_order_quantity} / ${batchLimit}`
              : batch_order_quantity}
          </Text>
        ),
      },
      {
        accessor: "progress",
        title: "Progress",
        textAlign: "center",
        render: ({ batch_order_quantity, batch_date_created, batch_status }) => (
          <>
            {batch_status === "PENDING" ? (
              <Stack gap={2}>
                <Progress value={(batch_order_quantity / batchLimit) * 100} striped animated />
                <Text size="xs" c="dimmed">
                  {dayjs(batch_date_created).fromNow()}
                </Text>
              </Stack>
            ) : (
              <Progress value={100} />
            )}
          </>
        ),
      },
      {
        accessor: "value",
        title: "Batch Value",
        textAlign: "right",
        render: ({ batch_order_total }) => (
          <Text fw={800} c="red.5">
            {formatCurrency(batch_order_total, { minimumFractionDigits: 0 })}
          </Text>
        ),
      },
      {
        accessor: "action",
        title: "Action",
        textAlign: "center",
        render: ({ batch_id, batch_status, batch_number }) => {
          const nextStatus = BATCH_NEXT_STATUS[batch_status];
          const { icon: StatusIcon, color = "gray" } = nextStatus
            ? BATCH_STATUS_METADATA[nextStatus as BatchStatusEnum]
            : {};

          return (
            <Group align="center" justify="center">
              {nextStatus && StatusIcon && (
                <Tooltip label={`Move to: ${nextStatus}`} withArrow>
                  <ActionIcon
                    variant="light"
                    color={color}
                    onClick={() => statusTransitionConfirmation(batch_id, batch_status)}
                    loading={loadingRow === batch_id}
                    disabled={loadingRow !== null && loadingRow !== batch_id}
                  >
                    <StatusIcon size={14} />
                  </ActionIcon>
                </Tooltip>
              )}
              <ActionIcon
                variant="light"
                onClick={() => router.push(`/admin/batches/${batch_number}`)}
              >
                <IconMaximize size={14} />
              </ActionIcon>
            </Group>
          );
        },
      },
    ],
    [],
  );

  const visibleTableColumns = useMemo(
    () => columns.filter((column) => visibleColumns.includes(String(column.accessor))),
    [columns, visibleColumns],
  );

  return (
    <Stack flex={1} gap="xl" miw={0}>
      <Stack gap={4}>
        <Text size="sm" c="red.5" fw={800} tt="uppercase">
          Fulfillment
        </Text>
        <Title order={1} style={{ fontSize: rem(34), fontWeight: 800 }}>
          Batches
        </Title>
        <Text c="dimmed">
          View every supplier batch, filter by batch status, and sort production queues.
        </Text>
      </Stack>

      <Paper withBorder p="md" radius="md">
        <Group justify="space-between" align="flex-end" mb="md">
          <Box>
            <Group gap="xs">
              <ThemeIcon color="red" variant="light" radius="sm">
                <IconClipboardList size={16} />
              </ThemeIcon>
              <Title order={2} size="h3">
                Batch List
              </Title>
            </Group>
            <Text size="sm" c="dimmed" mt={4}>
              {totalRecords} records found
            </Text>
          </Box>
        </Group>

        <Group mb="md" align="flex-end">
          <TextInput
            w={{ base: "100%", md: 300 }}
            leftSection={<IconSearch size={16} />}
            placeholder="Search batch number"
            label="Search"
            value={searchInput}
            onChange={(event) => setSearchInput(event.currentTarget.value)}
            maxLength={TEXT_LIMITS.medium}
          />
          <Select
            w={{ base: "100%", sm: 220 }}
            data={BATCH_STATUS_OPTIONS}
            value={batchStatus}
            label="Batch Status"
            allowDeselect={false}
            onChange={(value) => setBatchStatus((value as BatchStatusEnum | "ALL") ?? "ALL")}
          />
          <TableColumnVisibility
            columns={orderColumnOptions}
            visibleColumns={visibleColumns}
            onChange={setVisibleColumns}
          />
        </Group>

        <AdminBatchTable
          records={records}
          totalRecords={totalRecords}
          recordsPerPage={recordsPerPage}
          recordsPerPageOptions={PAGINATION_OPTIONS}
          page={page}
          fetching={fetching}
          sortStatus={sortStatus}
          columns={visibleTableColumns}
          onPageChange={setPage}
          onRecordsPerPageChange={handleRecordsPerPageChange}
          onSortStatusChange={handleSortStatusChange}
        />
      </Paper>
    </Stack>
  );
};

export default AdminBatchesPage;
