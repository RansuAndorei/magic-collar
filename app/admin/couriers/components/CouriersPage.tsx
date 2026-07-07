"use client";

import { insertError } from "@/app/actions";
import TableColumnVisibility, {
  TableColumnVisibilityOption,
} from "@/app/admin/components/TableColumnVisibility";
import { useUserData } from "@/stores/useUserStore";
import { PAGINATION_OPTIONS, STATUS_OPTIONS, TEXT_LIMITS } from "@/utils/constants";
import { formatDate, getAvailabilityProps, isAppError, parseStatus } from "@/utils/functions";
import { supabaseClient } from "@/utils/supabase/client";
import {
  AdminCourierSortAccessor,
  AdminSortStatus,
  CourierFormType,
  CourierTableRow,
} from "@/utils/types";
import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Group,
  Paper,
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
import {
  IconPencil,
  IconPlayerPause,
  IconPlayerPlay,
  IconPlus,
  IconSearch,
  IconTrash,
  IconTruckDelivery,
} from "@tabler/icons-react";
import { DataTable, DataTableColumn } from "mantine-datatable";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  checkCourierCount,
  deleteCourier,
  getAdminCouriersPage,
  setCourierAvailability,
} from "../actions";
import CouriersModal from "./CouriersModal";

const emptyFormValues: CourierFormType = {
  name: "",
  isAvailable: true,
};

const courierColumnOptions: TableColumnVisibilityOption[] = [
  { value: "courier_name", label: "Courier" },
  { value: "courier_date_created", label: "Date Created" },
  { value: "status", label: "Status" },
  { value: "actions", label: "Actions" },
];

const CouriersPage = () => {
  const userData = useUserData();
  const pathname = usePathname();
  const router = useRouter();

  const [records, setRecords] = useState<CourierTableRow[]>([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [searchInput, setSearchInput] = useState("");
  const [search] = useDebouncedValue(searchInput, 400);
  const [status, setStatus] = useState("null");
  const [page, setPage] = useState(1);
  const [recordsPerPage, setRecordsPerPage] = useState(PAGINATION_OPTIONS[0]);
  const [fetching, setFetching] = useState(false);
  const [loadingRow, setLoadingRow] = useState<{ id: string; action: "disable" | "delete" } | null>(
    null,
  );
  const [sortStatus, setSortStatus] = useState<AdminSortStatus<AdminCourierSortAccessor>>({
    columnAccessor: "courier_date_created",
    direction: "desc",
  });
  const [opened, setOpened] = useState(false);
  const [values, setValues] = useState<CourierFormType>(emptyFormValues);
  const [visibleColumns, setVisibleColumns] = useState(
    courierColumnOptions.map((column) => column.value),
  );

  useEffect(() => {
    setPage(1);
  }, [search, status]);

  const loadCouriers = useCallback(async () => {
    if (!userData) return;
    setFetching(true);
    try {
      const result = await getAdminCouriersPage(supabaseClient, {
        page,
        recordsPerPage,
        search: search.toLocaleLowerCase(),
        status: parseStatus(status),
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
            error_function: "loadCouriers",
            error_user_email: userData.email,
            error_user_id: userData.id,
          },
        });
      }
    } finally {
      setFetching(false);
    }
  }, [page, pathname, recordsPerPage, search, sortStatus, status, userData]);

  useEffect(() => {
    loadCouriers();
  }, [loadCouriers]);

  const refreshTable = useCallback(() => {
    loadCouriers();
    router.refresh();
  }, [loadCouriers, router]);

  const handleRecordsPerPageChange = useCallback((value: number) => {
    setRecordsPerPage(value);
    setPage(1);
  }, []);

  const handleSortStatusChange = useCallback(
    (nextSortStatus: { columnAccessor: string; direction: "asc" | "desc" }) => {
      if (
        nextSortStatus.columnAccessor !== "courier_date_created" &&
        nextSortStatus.columnAccessor !== "courier_name"
      )
        return;
      setSortStatus({
        columnAccessor: nextSortStatus.columnAccessor as AdminCourierSortAccessor,
        direction: nextSortStatus.direction,
      });
      setPage(1);
    },
    [],
  );

  const openCreateModal = useCallback(() => {
    setValues(emptyFormValues);
    setOpened(true);
  }, []);

  const openEditModal = useCallback((record: CourierTableRow) => {
    setValues({
      courierId: record.courier_id,
      name: record.courier_name,
      isAvailable: record.courier_is_available,
    });
    setOpened(true);
  }, []);

  const handleAvailabilityChange = useCallback(
    async (record: CourierTableRow) => {
      if (!userData) return;
      setLoadingRow({ id: record.courier_id, action: "disable" });
      try {
        if (record.courier_is_available) {
          const isSafe = await checkCourierCount(supabaseClient, {
            courierId: record.courier_id,
          });
          if (!isSafe) {
            notifications.show({
              color: "orange",
              message:
                "At least one courier is required. Please add an available courier before proceeding.",
            });
            setLoadingRow(null);
            return;
          }
        }
        await setCourierAvailability(supabaseClient, {
          courierId: record.courier_id,
          isAvailable: !record.courier_is_available,
          adminUserId: userData.id,
        });
        notifications.show({
          message: "Courier availability updated successfully.",
          color: "green",
        });
        refreshTable();
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
              error_function: "handleAvailabilityChange",
              error_user_email: userData.email,
              error_user_id: userData.id,
            },
          });
        }
      } finally {
        setLoadingRow(null);
      }
    },
    [pathname, refreshTable, userData],
  );

  const confirmAvailabilityChange = useCallback(
    (record: CourierTableRow) => {
      modals.openConfirmModal({
        title: `${record.courier_is_available ? "Disable" : "Enable"} courier?`,
        centered: true,
        children: (
          <Text size="sm">
            {record.courier_is_available
              ? "This courier will no longer be available for selection."
              : "This courier will become available for selection."}
          </Text>
        ),
        labels: { confirm: record.courier_is_available ? "Disable" : "Enable", cancel: "Cancel" },
        confirmProps: { color: record.courier_is_available ? "yellow" : "green" },
        onConfirm: () => handleAvailabilityChange(record),
      });
    },
    [handleAvailabilityChange],
  );

  const handleDelete = useCallback(
    async (record: CourierTableRow) => {
      if (!userData) return;
      setLoadingRow({ id: record.courier_id, action: "delete" });
      try {
        const isSafe = await checkCourierCount(supabaseClient, {
          courierId: record.courier_id,
        });
        if (!isSafe) {
          notifications.show({
            color: "orange",
            message:
              "At least one courier is required. Please add an available courier before proceeding.",
          });
          setLoadingRow(null);
          return;
        }

        await deleteCourier(supabaseClient, {
          courierId: record.courier_id,
          adminUserId: userData.id,
        });
        notifications.show({ message: "Courier deleted successfully.", color: "green" });
        refreshTable();
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
              error_function: "deleteCourier",
              error_user_email: userData.email,
              error_user_id: userData.id,
            },
          });
        }
      } finally {
        setLoadingRow(null);
      }
    },
    [pathname, refreshTable, userData],
  );

  const confirmDelete = useCallback(
    (record: CourierTableRow) => {
      modals.openConfirmModal({
        title: "Delete courier?",
        centered: true,
        children: <Text size="sm">This removes {record.courier_name} from the courier list.</Text>,
        labels: { confirm: "Delete", cancel: "Keep courier" },
        confirmProps: { color: "red" },
        onConfirm: () => handleDelete(record),
      });
    },
    [handleDelete],
  );

  const columns = useMemo<DataTableColumn<CourierTableRow>[]>(
    () => [
      {
        accessor: "courier_name",
        title: "Courier",
        sortable: true,
        render: (record) => <Text fw={800}>{record.courier_name}</Text>,
      },
      {
        accessor: "courier_date_created",
        title: "Date Created",
        sortable: true,
        render: (record) => formatDate(new Date(record.courier_date_created)),
      },
      {
        accessor: "status",
        title: "Status",
        textAlign: "center",
        render: (record) => {
          const { label, color } = getAvailabilityProps(record.courier_is_available);
          return (
            <Badge color={color} variant="light">
              {label}
            </Badge>
          );
        },
      },
      {
        accessor: "actions",
        title: "Actions",
        textAlign: "center",
        render: (record) => (
          <Group gap={4} wrap="nowrap" justify="center">
            <Tooltip label="Edit">
              <ActionIcon
                variant="subtle"
                aria-label={`Edit ${record.courier_name}`}
                onClick={() => openEditModal(record)}
              >
                <IconPencil size={16} />
              </ActionIcon>
            </Tooltip>
            <Tooltip label={record.courier_is_available ? "Disable" : "Enable"}>
              <ActionIcon
                variant="subtle"
                color={record.courier_is_available ? "yellow" : "green"}
                loading={loadingRow?.id === record.courier_id && loadingRow.action === "disable"}
                disabled={loadingRow !== null && loadingRow.id !== record.courier_id}
                aria-label={
                  record.courier_is_available
                    ? `Disable ${record.courier_name}`
                    : `Enable ${record.courier_name}`
                }
                onClick={() => confirmAvailabilityChange(record)}
              >
                {record.courier_is_available ? (
                  <IconPlayerPause size={16} />
                ) : (
                  <IconPlayerPlay size={16} />
                )}
              </ActionIcon>
            </Tooltip>
            <Tooltip label="Delete">
              <ActionIcon
                variant="subtle"
                color="red"
                loading={loadingRow?.id === record.courier_id && loadingRow.action === "delete"}
                disabled={loadingRow !== null && loadingRow.id !== record.courier_id}
                aria-label={`Delete ${record.courier_name}`}
                onClick={() => confirmDelete(record)}
              >
                <IconTrash size={16} />
              </ActionIcon>
            </Tooltip>
          </Group>
        ),
      },
    ],
    [confirmAvailabilityChange, confirmDelete, loadingRow, openEditModal],
  );

  const visibleTableColumns = useMemo(
    () => columns.filter((column) => visibleColumns.includes(String(column.accessor))),
    [columns, visibleColumns],
  );

  return (
    <>
      <Stack flex={1} gap="xl" miw={0}>
        <Stack gap={4}>
          <Text size="sm" c="red.5" fw={800} tt="uppercase">
            Settings
          </Text>
          <Title order={1} style={{ fontSize: rem(34), fontWeight: 800 }}>
            Couriers
          </Title>
          <Text c="dimmed">
            Manage courier partners and their availability for order fulfillment.
          </Text>
        </Stack>

        <Paper withBorder p="md" radius="md">
          <Group justify="space-between" align="flex-end" mb="md">
            <Box>
              <Group gap="xs">
                <ThemeIcon color="red" variant="light" radius="sm">
                  <IconTruckDelivery size={16} />
                </ThemeIcon>
                <Title order={2} size="h3">
                  Courier List
                </Title>
              </Group>
              <Text size="sm" c="dimmed" mt={4}>
                {totalRecords} records found
              </Text>
            </Box>
            <Button leftSection={<IconPlus size={16} />} onClick={openCreateModal}>
              Add Courier
            </Button>
          </Group>

          <Group mb="md" align="flex-end">
            <TextInput
              w={{ base: "100%", md: 340 }}
              leftSection={<IconSearch size={16} />}
              placeholder="Search courier"
              label="Search"
              value={searchInput}
              onChange={(event) => setSearchInput(event.currentTarget.value)}
              maxLength={TEXT_LIMITS.medium}
            />
            <Select
              w={{ base: "100%", sm: 180 }}
              data={STATUS_OPTIONS}
              value={status}
              label="Status"
              allowDeselect={false}
              onChange={(value) => setStatus(value ?? "null")}
            />
            <TableColumnVisibility
              columns={courierColumnOptions}
              visibleColumns={visibleColumns}
              onChange={setVisibleColumns}
            />
          </Group>

          <DataTable
            idAccessor="courier_id"
            withTableBorder
            borderRadius="md"
            minHeight={420}
            highlightOnHover
            fetching={fetching}
            records={records}
            totalRecords={totalRecords}
            recordsPerPage={recordsPerPage}
            recordsPerPageOptions={PAGINATION_OPTIONS}
            page={page}
            onPageChange={setPage}
            onRecordsPerPageChange={handleRecordsPerPageChange}
            sortStatus={sortStatus}
            onSortStatusChange={handleSortStatusChange}
            noRecordsText="No couriers found"
            scrollAreaProps={{ type: "auto" }}
            columns={visibleTableColumns}
          />
        </Paper>
      </Stack>

      <CouriersModal
        opened={opened}
        setOpened={setOpened}
        defaultValues={values}
        refreshTable={refreshTable}
      />
    </>
  );
};

export default CouriersPage;
