import { insertError } from "@/app/actions";
import { useUserData } from "@/stores/useUserStore";
import { PAGINATION_OPTIONS, STATUS_OPTIONS } from "@/utils/constants";
import {
  formatCurrency,
  formatDate,
  getAvailabilityProps,
  getSetContents,
  isAppError,
  parseStatus,
} from "@/utils/functions";
import { supabaseClient } from "@/utils/supabase/client";
import {
  AdminMagicCollarCatalogSortAccessor,
  AdminSortStatus,
  MagicCollarFormType,
  MagicCollarTableRow,
} from "@/utils/types";
import { Badge, Box, Button, Group, Select, Text, TextInput, Title, Tooltip } from "@mantine/core";
import { useDebouncedValue, useMediaQuery } from "@mantine/hooks";
import { modals } from "@mantine/modals";
import { notifications } from "@mantine/notifications";
import {
  IconPencil,
  IconPlayerPause,
  IconPlayerPlay,
  IconPlus,
  IconSearch,
  IconTrash,
} from "@tabler/icons-react";
import { DataTableColumn } from "mantine-datatable";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  checkConnectedCarToMagicCollar,
  deleteCatalogMagicCollar,
  getAdminCatalogMagicCollarPage,
  setCatalogMagicCollarAvailability,
} from "../../actions";
import MagicCollarModal from "./MagicCollarModal";
import MagicCollarTable from "./MagicCollarTable";

const emptyFormValues = {
  price: 0,
  currency: "PHP",
  isAvailable: true,
  downPaymentPrice: 0,
  frontQuantity: null,
  rearQuantity: null,
  allQuantity: null,
  stockQuantity: 0,
};

const MagicCollarList = () => {
  const userData = useUserData();
  const pathname = usePathname();
  const router = useRouter();
  const isMobile = useMediaQuery("(max-width: 48em)");

  const [loadingRow, setLoadingRow] = useState<{
    id: string;
    action: "edit" | "disable" | "delete";
  } | null>(null);
  const [magicCollarRecords, setMagicCollarRecords] = useState<MagicCollarTableRow[]>([]);
  const [magicCollarTotalRecords, setMagicCollarTotalRecords] = useState(0);
  const [magicCollarSearchInput, setMagicCollarSearchInput] = useState("");
  const [magicCollarSearch] = useDebouncedValue(magicCollarSearchInput, 400);
  const [magicCollarStatus, setMagicCollarStatus] = useState("null");
  const [magicCollarPage, setMagicCollarPage] = useState(1);
  const [magicCollarRecordsPerPage, setMagicCollarRecordsPerPage] = useState(PAGINATION_OPTIONS[0]);
  const [isFetchingMagicCollars, setIsFetchingMagicCollars] = useState(false);
  const [magicCollarSortStatus, setMagicCollarSortStatus] = useState<
    AdminSortStatus<AdminMagicCollarCatalogSortAccessor>
  >({
    columnAccessor: "magic_collar_date_created",
    direction: "desc",
  });
  const [opened, setOpened] = useState(false);
  const [values, setValues] = useState<MagicCollarFormType>(emptyFormValues);

  useEffect(() => {
    setMagicCollarPage(1);
  }, [magicCollarSearch, magicCollarStatus]);

  const loadMagicCollars = useCallback(async () => {
    if (!userData) return;
    setIsFetchingMagicCollars(true);
    try {
      const result = await getAdminCatalogMagicCollarPage(supabaseClient, {
        page: magicCollarPage,
        recordsPerPage: magicCollarRecordsPerPage,
        search: magicCollarSearch,
        status: parseStatus(magicCollarStatus),
        sortColumnAccessor: magicCollarSortStatus.columnAccessor,
        sortDirection: magicCollarSortStatus.direction,
      });

      setMagicCollarRecords(result.records);
      setMagicCollarTotalRecords(result.totalRecords);
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
            error_function: "loadMagicCollars",
            error_user_email: userData.email,
            error_user_id: userData.id,
          },
        });
      }
    } finally {
      setIsFetchingMagicCollars(false);
    }
  }, [
    magicCollarPage,
    magicCollarRecordsPerPage,
    magicCollarSearch,
    magicCollarStatus,
    magicCollarSortStatus,
    pathname,
    userData,
  ]);

  const handleAvailabilityChange = useCallback(
    async (magicCollar: MagicCollarTableRow) => {
      if (!userData) return;
      setLoadingRow({
        id: magicCollar.magic_collar_id,
        action: "disable",
      });
      try {
        await setCatalogMagicCollarAvailability(supabaseClient, {
          magicCollarId: magicCollar.magic_collar_id,
          isAvailable: !magicCollar.magic_collar_is_available,
        });
        notifications.show({
          message: `Magic Collar availability updated successfully.`,
          color: "green",
        });
        refreshTables();
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [userData, pathname],
  );

  const confirmAvailabilityChange = useCallback(
    (magicCollar: MagicCollarTableRow) => {
      modals.openConfirmModal({
        title: `Are you sure you want to ${
          magicCollar.magic_collar_is_available ? "hide" : "show"
        } this magic collar in the catalog?`,
        centered: true,
        children: (
          <Text size="sm">
            {magicCollar.magic_collar_is_available
              ? `This will hide MC-${magicCollar.magic_collar_reference_number} and all of the connected cars from the shop catalog. Customers will no longer be able to view or purchase this magic collar until it is made available again.`
              : `This will make MC-${magicCollar.magic_collar_reference_number} and all of the connected cars visible in the shop catalog and available for customers to view and purchase.`}
          </Text>
        ),
        labels: {
          confirm: magicCollar.magic_collar_is_available ? "Make Unavailable" : "Make Available",
          cancel: "Cancel",
        },
        confirmProps: {
          color: magicCollar.magic_collar_is_available ? "red" : "green",
        },
        onConfirm: () => handleAvailabilityChange(magicCollar),
      });
    },
    [handleAvailabilityChange],
  );

  const handleDelete = useCallback(
    async (magicCollarId: string, magicCollarReferenceNumber: number) => {
      if (!userData) return;
      setLoadingRow({
        id: magicCollarId,
        action: "delete",
      });
      try {
        const isWithConnectedCar = await checkConnectedCarToMagicCollar(supabaseClient, {
          magicCollarId,
        });
        if (isWithConnectedCar) {
          notifications.show({
            message: `This Magic Collar is still linked to one or more cars. To delete it, please update or remove the associated cars first. You can either edit this magic collar and remove all connected cars or go to the Cars tab and search for MC-${magicCollarReferenceNumber}.`,
            color: "orange",
            autoClose: false,
          });
          return;
        }

        await deleteCatalogMagicCollar(supabaseClient, {
          magicCollarId,
        });
        refreshTables();
        notifications.show({
          message: "Magic Collar deleted successfully.",
          color: "green",
        });
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
              error_function: "handleDelete",
              error_user_email: userData.email,
              error_user_id: userData.id,
            },
          });
        }
      } finally {
        setLoadingRow(null);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [userData, pathname],
  );

  const confirmDelete = useCallback(
    (magicCollar: MagicCollarTableRow) => {
      modals.openConfirmModal({
        title: "Delete catalog item?",
        centered: true,
        children: (
          <Text size="sm">
            This removes MC-{magicCollar.magic_collar_reference_number} from the admin and shop
            catalog. Existing order records remain intact.
          </Text>
        ),
        labels: { confirm: "Delete", cancel: "Keep item" },
        confirmProps: { color: "red" },
        onConfirm: () =>
          handleDelete(magicCollar.magic_collar_id, magicCollar.magic_collar_reference_number),
      });
    },
    [handleDelete],
  );

  const refreshTables = useCallback(() => {
    loadMagicCollars();
    router.refresh();
  }, [loadMagicCollars, router]);

  const openCreateModal = useCallback(() => {
    setValues(emptyFormValues);
    setOpened(true);
  }, []);

  const openEditModal = useCallback((magicCollar: MagicCollarTableRow) => {
    setValues({
      magicCollarId: magicCollar.magic_collar_id,
      price: magicCollar.magic_collar_price,
      currency: magicCollar.magic_collar_price_currency,
      isAvailable: magicCollar.magic_collar_is_available,
      downPaymentPrice: magicCollar.magic_collar_down_payment_price,
      frontQuantity: magicCollar.magic_collar_front_quantity,
      rearQuantity: magicCollar.magic_collar_rear_quantity,
      allQuantity: magicCollar.magic_collar_all_quantity,
      stockQuantity: magicCollar.magic_collar_stock_quantity,
      referenceNumber: magicCollar.magic_collar_reference_number,
    });
    setOpened(true);
  }, []);

  useEffect(() => {
    loadMagicCollars();
  }, [loadMagicCollars]);

  const handlePageChange = useCallback((nextPage: number) => {
    setMagicCollarPage(nextPage);
  }, []);

  const handleRecordsPerPageChange = useCallback((value: number) => {
    setMagicCollarRecordsPerPage(value);
    setMagicCollarPage(1);
  }, []);

  const handleSortStatusChange = useCallback(
    (sortStatus: { columnAccessor: string; direction: "asc" | "desc" }) => {
      if (
        sortStatus.columnAccessor === "magic_collar_date_created" ||
        sortStatus.columnAccessor === "magic_collar_stock_quantity" ||
        sortStatus.columnAccessor === "magic_collar_price"
      ) {
        const columnAccessor = sortStatus.columnAccessor as AdminMagicCollarCatalogSortAccessor;
        setMagicCollarSortStatus({
          columnAccessor,
          direction: sortStatus.direction,
        });
        setMagicCollarPage(1);
      }
    },
    [],
  );

  const columns = useMemo<DataTableColumn<MagicCollarTableRow>[]>(
    () => [
      {
        accessor: "magic_collar_reference_number",
        title: "Reference",
        render: (collar) => <Text fw={800}>MC-{collar.magic_collar_reference_number}</Text>,
      },
      {
        accessor: "magic_collar_date_created",
        title: "Date Created",
        sortable: true,
        render: (collar: MagicCollarTableRow) =>
          formatDate(new Date(collar.magic_collar_date_created)),
      },
      {
        accessor: "set_contents",
        title: "Set",
        render: (collar) =>
          getSetContents(
            collar.magic_collar_front_quantity,
            collar.magic_collar_rear_quantity,
            collar.magic_collar_all_quantity,
          ),
      },
      {
        accessor: "magic_collar_price",
        title: "Price",
        sortable: true,
        render: (collar: MagicCollarTableRow) => (
          <Box>
            <Text size="sm">
              {formatCurrency(collar.magic_collar_price, {
                currency: collar.magic_collar_price_currency,
                minimumFractionDigits: 0,
              })}
            </Text>
            <Text size="xs" c="dimmed">
              DP{" "}
              {formatCurrency(collar.magic_collar_down_payment_price, {
                currency: collar.magic_collar_price_currency,
                minimumFractionDigits: 0,
              })}
            </Text>
          </Box>
        ),
      },
      {
        accessor: "magic_collar_stock_quantity",
        title: "Stock",
        sortable: true,
      },
      {
        accessor: "status",
        title: "Status",
        textAlign: "center",
        render: (collar) => {
          const { label, color } = getAvailabilityProps(collar.magic_collar_is_available);
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
        render: (collar) => {
          return (
            <Group gap={4} wrap="nowrap" align="center" justify="center">
              <Tooltip label="Edit">
                <Button
                  variant="subtle"
                  size="xs"
                  px={8}
                  aria-label={`Edit MC-${collar.magic_collar_reference_number}`}
                  onClick={() => openEditModal(collar)}
                >
                  <IconPencil size={16} />
                </Button>
              </Tooltip>
              <Tooltip label={collar.magic_collar_is_available ? "Temporarily Disable" : "Enable"}>
                <Button
                  variant="subtle"
                  color={collar.magic_collar_is_available ? "yellow" : "green"}
                  size="xs"
                  px={8}
                  loading={
                    loadingRow?.id === collar.magic_collar_id && loadingRow.action === "disable"
                  }
                  disabled={
                    loadingRow !== null &&
                    loadingRow.id !== collar.magic_collar_id &&
                    loadingRow.action === "disable"
                  }
                  aria-label={
                    collar.magic_collar_is_available
                      ? `Temporarily Disable MC-${collar.magic_collar_reference_number}`
                      : `Enable MC-${collar.magic_collar_reference_number}`
                  }
                  onClick={() => confirmAvailabilityChange(collar)}
                >
                  {collar.magic_collar_is_available ? (
                    <IconPlayerPause size={16} />
                  ) : (
                    <IconPlayerPlay size={16} />
                  )}
                </Button>
              </Tooltip>
              <Tooltip label="Delete">
                <Button
                  variant="subtle"
                  color="red"
                  size="xs"
                  px={8}
                  loading={
                    loadingRow?.id === collar.magic_collar_id && loadingRow.action === "delete"
                  }
                  disabled={
                    loadingRow !== null &&
                    loadingRow.id !== collar.magic_collar_id &&
                    loadingRow.action === "delete"
                  }
                  aria-label={`Delete MC-${collar.magic_collar_reference_number}`}
                  onClick={() => confirmDelete(collar)}
                >
                  <IconTrash size={16} />
                </Button>
              </Tooltip>
            </Group>
          );
        },
      },
    ],
    [isMobile, loadingRow, openEditModal, confirmAvailabilityChange, confirmDelete],
  );

  return (
    <>
      <Group justify="space-between" mb="md" align="flex-end">
        <Group>
          <Box>
            <Title order={2} size="h3">
              Magic Collar
            </Title>
            <Text size="sm" c="dimmed">
              {magicCollarTotalRecords} records found
            </Text>
          </Box>
          <TextInput
            w={{ base: "100%", sm: 340 }}
            leftSection={<IconSearch size={16} />}
            placeholder="Search make, model, code, or magic collar"
            value={magicCollarSearchInput}
            onChange={(event) => setMagicCollarSearchInput(event.currentTarget.value)}
          />
          <Select
            w={{ base: "100%", sm: 180 }}
            data={STATUS_OPTIONS}
            value={magicCollarStatus}
            onChange={(value) => setMagicCollarStatus(value ?? "null")}
            allowDeselect={false}
          />
        </Group>
        <Button rightSection={<IconPlus size={14} />} onClick={openCreateModal}>
          Add
        </Button>
      </Group>
      <MagicCollarTable
        records={magicCollarRecords}
        totalRecords={magicCollarTotalRecords}
        recordsPerPage={magicCollarRecordsPerPage}
        recordsPerPageOptions={PAGINATION_OPTIONS}
        page={magicCollarPage}
        fetching={isFetchingMagicCollars}
        sortStatus={magicCollarSortStatus}
        columns={columns}
        onPageChange={handlePageChange}
        onRecordsPerPageChange={handleRecordsPerPageChange}
        onSortStatusChange={handleSortStatusChange}
      />
      <MagicCollarModal
        opened={opened}
        setOpened={setOpened}
        defaultValues={values}
        refreshTables={refreshTables}
      />
    </>
  );
};

export default MagicCollarList;
