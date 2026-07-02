"use client";

import { insertError } from "@/app/actions";
import TableColumnVisibility, {
  TableColumnVisibilityOption,
} from "@/app/admin/components/TableColumnVisibility";
import { useUserData } from "@/stores/useUserStore";
import { PAGINATION_OPTIONS, STATUS_OPTIONS, TEXT_LIMITS } from "@/utils/constants";
import {
  formatAddress,
  formatDate,
  getAvailabilityProps,
  isAppError,
  parseStatus,
} from "@/utils/functions";
import { supabaseClient } from "@/utils/supabase/client";
import {
  AdminPickupAddressSortAccessor,
  AdminSortStatus,
  PickupAddressFormType,
  PickupAddressType,
} from "@/utils/types";
import {
  ActionIcon,
  Anchor,
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
  IconExternalLink,
  IconMapPin,
  IconPencil,
  IconPlayerPause,
  IconPlayerPlay,
  IconPlus,
  IconSearch,
  IconTrash,
} from "@tabler/icons-react";
import { DataTable, DataTableColumn } from "mantine-datatable";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  checkPickupAddressCount,
  deletePickupAddress,
  getAdminPickupAddressesPage,
  setPickupAddressAvailability,
} from "../actions";
import PickupAddressModal from "./PickupAddressModal";

const emptyFormValues: PickupAddressFormType = {
  street: "",
  barangay: "",
  barangayOptions: [],
  city: "",
  cityOptions: [],
  province: "",
  provinceOptions: [],
  region: "",
  regionOptions: [],
  postalCode: "",
  latitude: null,
  longitude: null,
  isAvailable: true,
};

const pickupAddressColumnOptions: TableColumnVisibilityOption[] = [
  { value: "address", label: "Address" },
  { value: "map", label: "Google Map Link" },
  { value: "pickup_address_date_created", label: "Date Created" },
  { value: "status", label: "Status" },
  { value: "actions", label: "Actions" },
];

const getMapLink = (record: PickupAddressType) =>
  `https://www.google.com/maps?q=${record.pickup_address_latitude},${record.pickup_address_longitude}`;

const PickupAddressesPage = () => {
  const userData = useUserData();
  const pathname = usePathname();
  const router = useRouter();

  const [records, setRecords] = useState<PickupAddressType[]>([]);
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
  const [sortStatus, setSortStatus] = useState<AdminSortStatus<AdminPickupAddressSortAccessor>>({
    columnAccessor: "pickup_address_date_created",
    direction: "desc",
  });
  const [opened, setOpened] = useState(false);
  const [values, setValues] = useState<PickupAddressFormType>(emptyFormValues);
  const [visibleColumns, setVisibleColumns] = useState(
    pickupAddressColumnOptions.map((column) => column.value),
  );

  useEffect(() => {
    setPage(1);
  }, [search, status]);

  const loadPickupAddresses = useCallback(async () => {
    if (!userData) return;
    setFetching(true);
    try {
      const result = await getAdminPickupAddressesPage(supabaseClient, {
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
            error_function: "loadPickupAddresses",
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
    loadPickupAddresses();
  }, [loadPickupAddresses]);

  const refreshTable = useCallback(() => {
    loadPickupAddresses();
    router.refresh();
  }, [loadPickupAddresses, router]);

  const handleRecordsPerPageChange = useCallback((value: number) => {
    setRecordsPerPage(value);
    setPage(1);
  }, []);

  const handleSortStatusChange = useCallback(
    (nextSortStatus: { columnAccessor: string; direction: "asc" | "desc" }) => {
      if (nextSortStatus.columnAccessor !== "pickup_address_date_created") return;
      setSortStatus({
        columnAccessor: "pickup_address_date_created",
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

  const openEditModal = useCallback((record: PickupAddressType) => {
    setValues({
      pickupAddressId: record.pickup_address_id,
      addressId: record.pickup_address.address_id,
      street: record.pickup_address.address_street,
      barangay: record.pickup_address.address_barangay,
      barangayOptions: [],
      city: record.pickup_address.address_city,
      cityOptions: [],
      province: record.pickup_address.address_province,
      provinceOptions: [],
      region: record.pickup_address.address_region,
      regionOptions: [],
      postalCode: record.pickup_address.address_postal_code,
      latitude: record.pickup_address_latitude,
      longitude: record.pickup_address_longitude,
      isAvailable: record.pickup_address_is_available,
    });
    setOpened(true);
  }, []);

  const handleAvailabilityChange = useCallback(
    async (record: PickupAddressType) => {
      if (!userData) return;
      setLoadingRow({ id: record.pickup_address_id, action: "disable" });

      if (record.pickup_address_is_available) {
        const isSafe = await checkPickupAddressCount(supabaseClient, {
          pickupAddressId: record.pickup_address_id,
        });
        if (!isSafe) {
          notifications.show({
            color: "orange",
            message:
              "At least one pickup address is required. Please add an available pickup address before proceeding.",
          });
          setLoadingRow(null);
          return;
        }
      }
      try {
        await setPickupAddressAvailability(supabaseClient, {
          pickupAddressId: record.pickup_address_id,
          isAvailable: !record.pickup_address_is_available,
          adminUserId: userData.id,
        });
        notifications.show({
          message: "Pickup address availability updated successfully.",
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
              error_function: "handlePickupAddressAvailabilityChange",
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
    (record: PickupAddressType) => {
      modals.openConfirmModal({
        title: `${record.pickup_address_is_available ? "Disable" : "Enable"} pickup address?`,
        centered: true,
        children: (
          <Text size="sm">
            {record.pickup_address_is_available
              ? "Customers will no longer be able to choose this pickup address during checkout."
              : "Customers will be able to choose this pickup address during checkout."}
          </Text>
        ),
        labels: {
          confirm: record.pickup_address_is_available ? "Disable" : "Enable",
          cancel: "Cancel",
        },
        confirmProps: { color: record.pickup_address_is_available ? "yellow" : "green" },
        onConfirm: () => handleAvailabilityChange(record),
      });
    },
    [handleAvailabilityChange],
  );

  const handleDelete = useCallback(
    async (record: PickupAddressType) => {
      if (!userData) return;
      setLoadingRow({ id: record.pickup_address_id, action: "delete" });
      try {
        const isSafe = await checkPickupAddressCount(supabaseClient, {
          pickupAddressId: record.pickup_address_id,
        });
        if (!isSafe) {
          notifications.show({
            color: "orange",
            message:
              "At least one pickup address is required. Please add an available pickup address before proceeding.",
          });
          setLoadingRow(null);
          return;
        }

        await deletePickupAddress(supabaseClient, {
          pickupAddressId: record.pickup_address_id,
          adminUserId: userData.id,
        });
        notifications.show({ message: "Pickup address deleted successfully.", color: "green" });
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
              error_function: "deletePickupAddress",
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
    (record: PickupAddressType) => {
      modals.openConfirmModal({
        title: "Delete pickup address?",
        centered: true,
        children: (
          <Text size="sm">
            This removes {formatAddress(record.pickup_address)} from checkout pickup options and the
            admin list.
          </Text>
        ),
        labels: { confirm: "Delete", cancel: "Keep address" },
        confirmProps: { color: "red" },
        onConfirm: () => handleDelete(record),
      });
    },
    [handleDelete],
  );

  const columns = useMemo<DataTableColumn<PickupAddressType>[]>(
    () => [
      {
        accessor: "address",
        title: "Address",
        render: (record) => (
          <Box>
            <Text fw={800}>{record.pickup_address.address_street}</Text>
            <Text size="xs" c="dimmed">
              {[
                record.pickup_address.address_barangay,
                record.pickup_address.address_city,
                record.pickup_address.address_province,
                record.pickup_address.address_region,
                record.pickup_address.address_postal_code,
              ]
                .filter(Boolean)
                .join(", ")}
            </Text>
          </Box>
        ),
      },
      {
        accessor: "map",
        title: "Google Map Link",
        render: (record) => (
          <Anchor href={getMapLink(record)} target="_blank" rel="noopener noreferrer" size="sm">
            <Group gap={4} wrap="nowrap">
              <IconExternalLink size={14} /> Open map
            </Group>
          </Anchor>
        ),
      },
      {
        accessor: "pickup_address_date_created",
        title: "Date Created",
        sortable: true,
        render: (record) => formatDate(new Date(record.pickup_address_date_created)),
      },
      {
        accessor: "status",
        title: "Status",
        textAlign: "center",
        render: (record) => {
          const { label, color } = getAvailabilityProps(record.pickup_address_is_available);
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
                aria-label={`Edit ${formatAddress(record.pickup_address)}`}
                onClick={() => openEditModal(record)}
              >
                <IconPencil size={16} />
              </ActionIcon>
            </Tooltip>
            <Tooltip label={record.pickup_address_is_available ? "Disable" : "Enable"}>
              <ActionIcon
                variant="subtle"
                color={record.pickup_address_is_available ? "yellow" : "green"}
                loading={
                  loadingRow?.id === record.pickup_address_id && loadingRow.action === "disable"
                }
                disabled={loadingRow !== null && loadingRow.id !== record.pickup_address_id}
                aria-label={
                  record.pickup_address_is_available
                    ? `Disable ${formatAddress(record.pickup_address)}`
                    : `Enable ${formatAddress(record.pickup_address)}`
                }
                onClick={() => confirmAvailabilityChange(record)}
              >
                {record.pickup_address_is_available ? (
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
                  loadingRow?.id === record.pickup_address_id && loadingRow.action === "delete"
                }
                disabled={loadingRow !== null && loadingRow.id !== record.pickup_address_id}
                aria-label={`Delete ${formatAddress(record.pickup_address)}`}
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
            Pickup Addresses
          </Title>
          <Text c="dimmed">
            Manage customer pickup locations, map pins, and checkout availability.
          </Text>
        </Stack>

        <Paper withBorder p="md" radius="md">
          <Group justify="space-between" align="flex-end" mb="md">
            <Box>
              <Group gap="xs">
                <ThemeIcon color="red" variant="light" radius="md">
                  <IconMapPin size={18} />
                </ThemeIcon>
                <Title order={2} size="h3">
                  Address List
                </Title>
              </Group>
              <Text size="sm" c="dimmed" mt={4}>
                {totalRecords} records found
              </Text>
            </Box>
            <Button leftSection={<IconPlus size={16} />} onClick={openCreateModal}>
              Add Address
            </Button>
          </Group>

          <Group mb="md" align="flex-end">
            <TextInput
              w={{ base: "100%", md: 340 }}
              leftSection={<IconSearch size={16} />}
              placeholder="Search address"
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
              columns={pickupAddressColumnOptions}
              visibleColumns={visibleColumns}
              onChange={setVisibleColumns}
            />
          </Group>

          <DataTable
            idAccessor="pickup_address_id"
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
            noRecordsText="No pickup addresses found"
            scrollAreaProps={{ type: "auto" }}
            columns={visibleTableColumns}
          />
        </Paper>
      </Stack>

      <PickupAddressModal
        opened={opened}
        setOpened={setOpened}
        defaultValues={values}
        refreshTable={refreshTable}
      />
    </>
  );
};

export default PickupAddressesPage;
