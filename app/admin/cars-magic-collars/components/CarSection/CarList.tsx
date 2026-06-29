import { insertError } from "@/app/actions";
import TableColumnVisibility, {
  TableColumnVisibilityOption,
} from "@/app/admin/components/TableColumnVisibility";
import { useUserData } from "@/stores/useUserStore";
import { PAGINATION_OPTIONS, STATUS_OPTIONS } from "@/utils/constants";
import {
  formatCurrency,
  formatDate,
  getAvailabilityProps,
  getSetContents,
  getYearRange,
  isAppError,
  parseStatus,
} from "@/utils/functions";
import { supabaseClient } from "@/utils/supabase/client";
import {
  AdminCarCatalogSortAccessor,
  AdminCatalogCar,
  AdminSortStatus,
  CarFormType,
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
  deleteCatalogCar,
  getAdminCatalogCarsPage,
  setCatalogCarAvailability,
} from "../../actions";
import CarModal from "./CarModal";
import CarTable from "./CarTable";

const emptyFormValues = {
  magicCollarReferenceNumber: null,
  make: "",
  model: "",
  modelCode: "",
  yearStart: undefined,
  yearEnd: null,
  image: null,
  isAvailable: true,
  existingAttachment: null,
};

const orderColumnOptions: TableColumnVisibilityOption[] = [
  { value: "car", label: "Car" },
  { value: "car_year", label: "Year" },
  { value: "car_date_created", label: "Date Created" },
  { value: "collar", label: "Magic Collar" },
  { value: "magic_collar_price", label: "Price" },
  { value: "magic_collar_stock_quantity", label: "Stock" },
  { value: "status", label: "Status" },
  { value: "actions", label: "Actions" },
];

type Props = { makeList: string[]; modelList: Record<string, string[]> };

const CarList = ({ makeList, modelList }: Props) => {
  const userData = useUserData();
  const pathname = usePathname();
  const router = useRouter();
  const isMobile = useMediaQuery("(max-width: 48em)");

  const [loadingRow, setLoadingRow] = useState<{
    id: string;
    action: "edit" | "disable" | "delete";
  } | null>(null);
  const [carRecords, setCarRecords] = useState<AdminCatalogCar[]>([]);
  const [carTotalRecords, setCarTotalRecords] = useState(0);
  const [carSearchInput, setCarSearchInput] = useState("");
  const [carSearch] = useDebouncedValue(carSearchInput, 400);
  const [carStatus, setCarStatus] = useState("null");
  const [carPage, setCarPage] = useState(1);
  const [carRecordsPerPage, setCarRecordsPerPage] = useState(PAGINATION_OPTIONS[0]);
  const [isFetchingCars, setIsFetchingCars] = useState(false);
  const [carSortStatus, setCarSortStatus] = useState<AdminSortStatus<AdminCarCatalogSortAccessor>>({
    columnAccessor: "car_date_created",
    direction: "desc",
  });
  const [opened, setOpened] = useState(false);
  const [values, setValues] = useState<CarFormType>(emptyFormValues);
  const [visibleColumns, setVisibleColumns] = useState(
    orderColumnOptions.map((column) => column.value),
  );

  useEffect(() => {
    setCarPage(1);
  }, [carSearch, carStatus]);

  const loadCars = useCallback(async () => {
    if (!userData) return;
    setIsFetchingCars(true);
    try {
      const result = await getAdminCatalogCarsPage(supabaseClient, {
        page: carPage,
        recordsPerPage: carRecordsPerPage,
        search: carSearch,
        status: parseStatus(carStatus),
        sortColumnAccessor: carSortStatus.columnAccessor,
        sortDirection: carSortStatus.direction,
      });

      setCarRecords(result.records);
      setCarTotalRecords(result.totalRecords);
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
            error_function: "loadCars",
            error_user_email: userData.email,
            error_user_id: userData.id,
          },
        });
      }
    } finally {
      setIsFetchingCars(false);
    }
  }, [carPage, carRecordsPerPage, carSearch, carStatus, carSortStatus, pathname, userData]);

  const handleAvailabilityChange = useCallback(
    async (car: AdminCatalogCar) => {
      if (!userData) return;
      setLoadingRow({
        id: car.car_id,
        action: "disable",
      });
      try {
        await setCatalogCarAvailability(supabaseClient, {
          carId: car.car_id,
          isAvailable: !car.car_is_available,
          adminUserId: userData.id,
        });
        notifications.show({
          message: `Car availability updated successfully.`,
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
    (car: AdminCatalogCar) => {
      modals.openConfirmModal({
        title: `Are you sure you want to ${
          car.car_is_available ? "hide" : "show"
        } this car in the catalog?`,
        centered: true,
        children: (
          <Text size="sm">
            {car.car_is_available
              ? `This will hide ${car.car_make.make} ${car.car_model.model} from the shop catalog. Customers will no longer be able to view or purchase this vehicle until it is made available again.`
              : `This will make ${car.car_make.make} ${car.car_model.model} visible in the shop catalog and available for customers to view and purchase.`}
          </Text>
        ),
        labels: {
          confirm: car.car_is_available ? "Make Unavailable" : "Make Available",
          cancel: "Cancel",
        },
        confirmProps: {
          color: car.car_is_available ? "red" : "green",
        },
        onConfirm: () => handleAvailabilityChange(car),
      });
    },
    [handleAvailabilityChange],
  );

  const handleDelete = useCallback(
    async (carId: string) => {
      if (!userData) return;
      setLoadingRow({
        id: carId,
        action: "delete",
      });
      try {
        await deleteCatalogCar(supabaseClient, {
          carId,
          adminUserId: userData.id,
        });
        refreshTables();
        notifications.show({
          message: "Car deleted successfully.",
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
    (car: AdminCatalogCar) => {
      modals.openConfirmModal({
        title: "Delete catalog item?",
        centered: true,
        children: (
          <Text size="sm">
            This removes {car.car_make.make} {car.car_model.model} from the admin and shop catalog.
            Existing order records remain intact.
          </Text>
        ),
        labels: { confirm: "Delete", cancel: "Keep item" },
        confirmProps: { color: "red" },
        onConfirm: () => handleDelete(car.car_id),
      });
    },
    [handleDelete],
  );

  const refreshTables = useCallback(() => {
    loadCars();
    router.refresh();
  }, [loadCars, router]);

  const openCreateModal = useCallback(() => {
    setValues(emptyFormValues);
    setOpened(true);
  }, []);

  const openEditModal = useCallback((car: AdminCatalogCar) => {
    setValues({
      carId: car.car_id,
      magicCollarReferenceNumber: car.car_magic_collar.magic_collar_reference_number,
      make: car.car_make.make,
      model: car.car_model.model,
      modelCode: car.car_model_code ?? "",
      yearStart: car.car_model_year_start,
      yearEnd: car.car_model_year_end,
      image: null,
      existingAttachment: {
        path: car.car_image_attachment.attachment_path,
        name: car.car_image_attachment.attachment_name,
      },
      isAvailable: car.car_is_available,
    });
    setOpened(true);
  }, []);

  useEffect(() => {
    loadCars();
  }, [loadCars]);

  const handlePageChange = useCallback((nextPage: number) => {
    setCarPage(nextPage);
  }, []);

  const handleRecordsPerPageChange = useCallback((value: number) => {
    setCarRecordsPerPage(value);
    setCarPage(1);
  }, []);

  const handleSortStatusChange = useCallback(
    (sortStatus: { columnAccessor: string; direction: "asc" | "desc" }) => {
      if (
        sortStatus.columnAccessor === "car_date_created" ||
        sortStatus.columnAccessor === "magic_collar_stock_quantity" ||
        sortStatus.columnAccessor === "magic_collar_price"
      ) {
        const columnAccessor = sortStatus.columnAccessor as AdminCarCatalogSortAccessor;
        setCarSortStatus({
          columnAccessor,
          direction: sortStatus.direction,
        });
        setCarPage(1);
      }
    },
    [],
  );

  const columns = useMemo<DataTableColumn<AdminCatalogCar>[]>(
    () => [
      {
        accessor: "car",
        title: "Car",
        render: (car) => (
          <Box>
            <Text fw={800}>
              {car.car_make.make} {car.car_model.model}
            </Text>
            <Text size="xs" c="dimmed">
              {car.car_model_code}
            </Text>
          </Box>
        ),
      },
      {
        accessor: "car_year",
        title: "Year",
        sortable: true,
        render: (car) => getYearRange(car.car_model_year_start, car.car_model_year_end),
      },
      {
        accessor: "car_date_created",
        title: "Date Created",
        sortable: true,
        render: (car) => formatDate(new Date(car.car_date_created)),
      },
      {
        accessor: "collar",
        title: "Magic Collar",
        render: (car) => (
          <Box>
            <Text size="sm" fw={700}>
              MC-{car.car_magic_collar.magic_collar_reference_number}
            </Text>
            <Text size="xs" c="dimmed">
              {getSetContents(
                car.car_magic_collar.magic_collar_front_quantity,
                car.car_magic_collar.magic_collar_rear_quantity,
                car.car_magic_collar.magic_collar_all_quantity,
              )}
            </Text>
          </Box>
        ),
      },
      {
        accessor: "magic_collar_price",
        title: "Price",
        sortable: true,
        render: (car) => (
          <Box>
            <Text size="sm">
              {formatCurrency(car.car_magic_collar.magic_collar_price, {
                currency: car.car_magic_collar.magic_collar_price_currency,
                minimumFractionDigits: 0,
              })}
            </Text>
            {!isMobile && (
              <Text size="xs" c="dimmed">
                DP{" "}
                {formatCurrency(car.car_magic_collar.magic_collar_down_payment_price, {
                  currency: car.car_magic_collar.magic_collar_price_currency,
                  minimumFractionDigits: 0,
                })}
              </Text>
            )}
          </Box>
        ),
      },
      {
        accessor: "magic_collar_stock_quantity",
        title: "Stock",
        sortable: true,
        render: (car) => car.car_magic_collar.magic_collar_stock_quantity,
      },
      {
        accessor: "status",
        title: "Status",
        textAlign: "center",
        render: (car) => {
          const { label, color } = getAvailabilityProps(car.car_is_available);
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
        render: (car) => {
          return (
            <Group gap={4} wrap="nowrap" align="center" justify="center">
              <Tooltip label="Edit">
                <Button
                  variant="subtle"
                  size="xs"
                  px={8}
                  aria-label={`Edit ${car.car_make.make} ${car.car_model.model}`}
                  onClick={() => openEditModal(car)}
                >
                  <IconPencil size={16} />
                </Button>
              </Tooltip>
              <Tooltip label={car.car_is_available ? "Temporarily Disable" : "Enable"}>
                <Button
                  variant="subtle"
                  color={car.car_is_available ? "yellow" : "green"}
                  size="xs"
                  px={8}
                  loading={loadingRow?.id === car.car_id && loadingRow.action === "disable"}
                  disabled={
                    loadingRow !== null &&
                    loadingRow.id !== car.car_id &&
                    loadingRow.action === "disable"
                  }
                  aria-label={
                    car.car_is_available
                      ? `Temporarily Disable ${car.car_make.make} ${car.car_model.model}`
                      : `Enable ${car.car_make.make} ${car.car_model.model}`
                  }
                  onClick={() => confirmAvailabilityChange(car)}
                >
                  {car.car_is_available ? (
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
                  loading={loadingRow?.id === car.car_id && loadingRow.action === "delete"}
                  disabled={
                    loadingRow !== null &&
                    loadingRow.id !== car.car_id &&
                    loadingRow.action === "delete"
                  }
                  aria-label={`Delete ${car.car_make.make} ${car.car_model.model}`}
                  onClick={() => confirmDelete(car)}
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

  const visibleTableColumns = useMemo(
    () => columns.filter((column) => visibleColumns.includes(String(column.accessor))),
    [columns, visibleColumns],
  );

  return (
    <>
      <Group justify="space-between" mb="md">
        <Group>
          <Box>
            <Title order={2} size="h3">
              Car Fitments
            </Title>
            <Text size="sm" c="dimmed">
              {carTotalRecords} records found
            </Text>
          </Box>
          <TextInput
            w={{ base: "100%", sm: 340 }}
            leftSection={<IconSearch size={16} />}
            placeholder="Search make, model, code, or magic collar"
            value={carSearchInput}
            onChange={(event) => setCarSearchInput(event.currentTarget.value)}
          />
          <Select
            w={{ base: "100%", sm: 180 }}
            data={STATUS_OPTIONS}
            value={carStatus}
            onChange={(value) => setCarStatus(value ?? "null")}
            allowDeselect={false}
          />
          <TableColumnVisibility
            columns={orderColumnOptions}
            visibleColumns={visibleColumns}
            onChange={setVisibleColumns}
          />
        </Group>
        <Button rightSection={<IconPlus size={14} />} onClick={openCreateModal}>
          Add
        </Button>
      </Group>
      <CarTable
        records={carRecords}
        totalRecords={carTotalRecords}
        recordsPerPage={carRecordsPerPage}
        recordsPerPageOptions={PAGINATION_OPTIONS}
        page={carPage}
        fetching={isFetchingCars}
        sortStatus={carSortStatus}
        columns={visibleTableColumns}
        onPageChange={handlePageChange}
        onRecordsPerPageChange={handleRecordsPerPageChange}
        onSortStatusChange={handleSortStatusChange}
      />
      <CarModal
        opened={opened}
        setOpened={setOpened}
        makeList={makeList}
        modelList={modelList}
        defaultValues={values}
        refreshTables={refreshTables}
      />
    </>
  );
};

export default CarList;
