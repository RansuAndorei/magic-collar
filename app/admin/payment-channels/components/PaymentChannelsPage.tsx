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
  AdminPaymentChannelSortAccessor,
  AdminSortStatus,
  PaymentChannelFormType,
  PaymentChannelType,
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
  IconQrcode,
  IconReceipt,
  IconSearch,
  IconTrash,
} from "@tabler/icons-react";
import { DataTable, DataTableColumn } from "mantine-datatable";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  checkPaymentChannelCount,
  deletePaymentChannel,
  getAdminPaymentChannelPage,
  setPaymentChannelAvailability,
} from "../actions";
import PaymentChannelsModal from "./PaymentChannelsModal";

const emptyFormValues: PaymentChannelFormType = {
  paymentChannelId: "",
  providerName: "",
  accountName: "",
  accountIdentifier: "",
  qrCode: null,
  existingAttachment: null,
  isAvailable: true,
};

const paymentChannelColumnOptions: TableColumnVisibilityOption[] = [
  { value: "payment_channel_account_identifier", label: "Account Identifier" },
  { value: "payment_channel_date_created", label: "Date Created" },
  { value: "payment_channel_provider_name", label: "Provider" },
  { value: "payment_channel_account_name", label: "Account Name" },
  { value: "payment_channel_qr_code_attachment", label: "QR Code" },
  { value: "payment_channel_is_available", label: "Status" },
  { value: "actions", label: "Actions" },
];

const PaymentChannelsPage = () => {
  const userData = useUserData();
  const pathname = usePathname();
  const router = useRouter();

  const [records, setRecords] = useState<PaymentChannelType[]>([]);
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
  const [sortStatus, setSortStatus] = useState<AdminSortStatus<AdminPaymentChannelSortAccessor>>({
    columnAccessor: "payment_channel_date_created",
    direction: "desc",
  });
  const [opened, setOpened] = useState(false);
  const [values, setValues] = useState<PaymentChannelFormType>(emptyFormValues);
  const [visibleColumns, setVisibleColumns] = useState(
    paymentChannelColumnOptions.map((column) => column.value),
  );

  useEffect(() => {
    setPage(1);
  }, [search, status]);

  const loadPaymentChannel = useCallback(async () => {
    if (!userData) return;
    setFetching(true);
    try {
      const result = await getAdminPaymentChannelPage(supabaseClient, {
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
            error_function: "loadPaymentChannel",
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
    loadPaymentChannel();
  }, [loadPaymentChannel]);

  const refreshTable = useCallback(() => {
    loadPaymentChannel();
    router.refresh();
  }, [loadPaymentChannel, router]);

  const handleRecordsPerPageChange = useCallback((value: number) => {
    setRecordsPerPage(value);
    setPage(1);
  }, []);

  const handleSortStatusChange = useCallback(
    (nextSortStatus: { columnAccessor: string; direction: "asc" | "desc" }) => {
      if (nextSortStatus.columnAccessor !== "payment_channel_date_created") return;
      setSortStatus({
        columnAccessor: "payment_channel_date_created",
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

  const openEditModal = useCallback((record: PaymentChannelType) => {
    setValues({
      providerName: record.payment_channel_provider_name,
      accountName: record.payment_channel_account_name,
      accountIdentifier: record.payment_channel_account_identifier,
      qrCode: null,
      existingAttachment: {
        id: record.payment_channel_qr_code_attachment_id,
        path: record.payment_channel_qr_code_attachment.attachment_path,
        name: record.payment_channel_qr_code_attachment.attachment_name,
      },
      isAvailable: record.payment_channel_is_available,
    });
    setOpened(true);
  }, []);

  const handleAvailabilityChange = useCallback(
    async (record: PaymentChannelType) => {
      if (!userData) return;
      setLoadingRow({ id: record.payment_channel_id, action: "disable" });

      try {
        if (record.payment_channel_is_available) {
          const isSafe = await checkPaymentChannelCount(supabaseClient, {
            paymentChannelId: record.payment_channel_id,
          });
          if (!isSafe) {
            notifications.show({
              color: "orange",
              message:
                "At least one payment channel is required. Please add an available payment channel before proceeding.",
            });
            setLoadingRow(null);
            return;
          }
        }
        await setPaymentChannelAvailability(supabaseClient, {
          paymentChannelId: record.payment_channel_id,
          isAvailable: !record.payment_channel_is_available,
          adminUserId: userData.id,
        });
        notifications.show({
          message: "Payment channel availability updated successfully.",
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
    (record: PaymentChannelType) => {
      modals.openConfirmModal({
        title: `${record.payment_channel_is_available ? "Disable" : "Enable"} payment channel?`,
        centered: true,
        children: (
          <Text size="sm">
            {record.payment_channel_is_available
              ? "Customers will no longer be able to choose this payment channel during payment."
              : "Customers will be able to choose this payment channel during payment."}
          </Text>
        ),
        labels: {
          confirm: record.payment_channel_is_available ? "Disable" : "Enable",
          cancel: "Cancel",
        },
        confirmProps: { color: record.payment_channel_is_available ? "yellow" : "green" },
        onConfirm: () => handleAvailabilityChange(record),
      });
    },
    [handleAvailabilityChange],
  );

  const handleDelete = useCallback(
    async (record: PaymentChannelType) => {
      if (!userData) return;
      setLoadingRow({ id: record.payment_channel_id, action: "delete" });
      try {
        const isSafe = await checkPaymentChannelCount(supabaseClient, {
          paymentChannelId: record.payment_channel_id,
        });
        if (!isSafe) {
          notifications.show({
            color: "orange",
            message:
              "At least payment channel is required. Please add an available payment channel before proceeding.",
          });
          setLoadingRow(null);
          return;
        }

        await deletePaymentChannel(supabaseClient, {
          paymentChannelId: record.payment_channel_id,
          adminUserId: userData.id,
        });
        notifications.show({ message: "Payment channel deleted successfully.", color: "green" });
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
              error_function: "deletePaymentChannel",
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
    (record: PaymentChannelType) => {
      modals.openConfirmModal({
        title: "Delete payment channel?",
        centered: true,
        children: (
          <Text size="sm">
            This removes {record.payment_channel_provider_name} from payment options and the admin
            list.
          </Text>
        ),
        labels: { confirm: "Delete", cancel: "Keep Channel" },
        confirmProps: { color: "red" },
        onConfirm: () => handleDelete(record),
      });
    },
    [handleDelete],
  );

  const columns = useMemo<DataTableColumn<PaymentChannelType>[]>(
    () => [
      {
        accessor: "payment_channel_account_identifier",
        title: "Account Identifier",
        render: ({ payment_channel_account_identifier }) => (
          <Text fw={800}>{payment_channel_account_identifier}</Text>
        ),
      },
      {
        accessor: "payment_channel_date_created",
        title: "Date Created",
        sortable: true,
        render: ({ payment_channel_date_created }) =>
          formatDate(new Date(payment_channel_date_created)),
      },
      {
        accessor: "payment_channel_provider_name",
        title: "Provider",
        render: ({ payment_channel_provider_name }) => (
          <Text fw={800}>{payment_channel_provider_name}</Text>
        ),
      },
      {
        accessor: "payment_channel_account_name",
        title: "Account Name",
        render: ({ payment_channel_account_name }) => (
          <Text fw={800}>{payment_channel_account_name}</Text>
        ),
      },
      {
        accessor: "payment_channel_qr_code_attachment",
        title: "QR Code",
        textAlign: "center",
        render: ({ payment_channel_qr_code_attachment }) => (
          <Button
            component="a"
            href={payment_channel_qr_code_attachment.attachment_path}
            target="_blank"
            rel="noopener noreferrer"
            variant="light"
            size="xs"
            leftSection={<IconQrcode size={16} />}
          >
            View QR
          </Button>
        ),
      },
      {
        accessor: "payment_channel_is_available",
        title: "Status",
        textAlign: "center",
        render: ({ payment_channel_is_available }) => {
          const { label, color } = getAvailabilityProps(payment_channel_is_available);
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
                aria-label={`Edit ${record.payment_channel_provider_name}`}
                onClick={() => openEditModal(record)}
              >
                <IconPencil size={16} />
              </ActionIcon>
            </Tooltip>
            <Tooltip label={record.payment_channel_is_available ? "Disable" : "Enable"}>
              <ActionIcon
                variant="subtle"
                color={record.payment_channel_is_available ? "yellow" : "green"}
                loading={
                  loadingRow?.id === record.payment_channel_id && loadingRow.action === "disable"
                }
                disabled={loadingRow !== null && loadingRow.id !== record.payment_channel_id}
                aria-label={
                  record.payment_channel_is_available
                    ? `Disable ${record.payment_channel_provider_name}`
                    : `Enable ${record.payment_channel_provider_name}`
                }
                onClick={() => confirmAvailabilityChange(record)}
              >
                {record.payment_channel_is_available ? (
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
                loading={
                  loadingRow?.id === record.payment_channel_id && loadingRow.action === "delete"
                }
                disabled={loadingRow !== null && loadingRow.id !== record.payment_channel_id}
                aria-label={`Delete ${record.payment_channel_id}`}
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
            Payment Channels
          </Title>
          <Text c="dimmed">Manage payment channel, accounts, and payment availability.</Text>
        </Stack>

        <Paper withBorder p="md" radius="md">
          <Group justify="space-between" align="flex-end" mb="md">
            <Box>
              <Group gap="xs">
                <ThemeIcon color="red" variant="light" radius="sm">
                  <IconReceipt size={16} />
                </ThemeIcon>
                <Title order={2} size="h3">
                  Channel List
                </Title>
              </Group>
              <Text size="sm" c="dimmed" mt={4}>
                {totalRecords} records found
              </Text>
            </Box>
            <Button leftSection={<IconPlus size={16} />} onClick={openCreateModal}>
              Add Channel
            </Button>
          </Group>

          <Group mb="md" align="flex-end">
            <TextInput
              w={{ base: "100%", md: 340 }}
              leftSection={<IconSearch size={16} />}
              placeholder="Search payment channel"
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
              columns={paymentChannelColumnOptions}
              visibleColumns={visibleColumns}
              onChange={setVisibleColumns}
            />
          </Group>

          <DataTable
            idAccessor="payment_channel_id"
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
            noRecordsText="No payment channel found"
            scrollAreaProps={{ type: "auto" }}
            columns={visibleTableColumns}
          />
        </Paper>
      </Stack>

      <PaymentChannelsModal
        opened={opened}
        setOpened={setOpened}
        defaultValues={values}
        refreshTable={refreshTable}
      />
    </>
  );
};

export default PaymentChannelsPage;
