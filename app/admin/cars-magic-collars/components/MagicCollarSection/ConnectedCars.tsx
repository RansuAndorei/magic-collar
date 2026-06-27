import { insertError } from "@/app/actions";
import { useUserData } from "@/stores/useUserStore";
import { getYearRange, isAppError } from "@/utils/functions";
import { supabaseClient } from "@/utils/supabase/client";
import { ConnectedCarType } from "@/utils/types";
import {
  Badge,
  Button,
  Group,
  Loader,
  ScrollArea,
  Stack,
  Table,
  Text,
  Title,
  Tooltip,
} from "@mantine/core";
import { modals } from "@mantine/modals";
import { notifications } from "@mantine/notifications";
import { IconPlayerPause, IconPlayerPlay, IconTrash } from "@tabler/icons-react";
import { usePathname } from "next/navigation";
import { useCallback, useState } from "react";
import { deleteCatalogCar, setCatalogCarAvailability } from "../../actions";

type Props = {
  magicCollarId: string;
  isFetchingCars: boolean;
  connectedCars: ConnectedCarType[];
  handleFetchConnectedCars: (magicCollarId: string) => void;
};

const ConnectedCars = ({
  magicCollarId,
  isFetchingCars,
  connectedCars,
  handleFetchConnectedCars,
}: Props) => {
  const pathname = usePathname();
  const userData = useUserData();

  const [loadingRow, setLoadingRow] = useState<{
    id: string;
    action: "disable" | "delete";
  } | null>(null);

  const handleAvailabilityChange = useCallback(
    async (car: ConnectedCarType) => {
      if (!userData) return;
      setLoadingRow({
        id: car.car_id,
        action: "disable",
      });
      try {
        await setCatalogCarAvailability(supabaseClient, {
          carId: car.car_id,
          isAvailable: !car.car_is_available,
        });
        notifications.show({
          message: `Car availability updated successfully.`,
          color: "green",
        });
        handleFetchConnectedCars(magicCollarId);
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
    (car: ConnectedCarType) => {
      modals.openConfirmModal({
        title: `Are you sure you want to ${
          car.car_is_available ? "hide" : "show"
        } this car in the catalog?`,
        centered: true,
        children: (
          <Text size="sm">
            {car.car_is_available
              ? `This will hide ${car.car_make} ${car.car_model} from the shop catalog. Customers will no longer be able to view or purchase this vehicle until it is made available again.`
              : `This will make ${car.car_make} ${car.car_model} visible in the shop catalog and available for customers to view and purchase.`}
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
        });
        notifications.show({
          message: "Car deleted successfully.",
          color: "green",
        });
        handleFetchConnectedCars(magicCollarId);
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
    (car: ConnectedCarType) => {
      modals.openConfirmModal({
        title: "Delete catalog item?",
        centered: true,
        children: (
          <Text size="sm">
            This removes {car.car_make} {car.car_model} from the admin and shop catalog. Existing
            order records remain intact.
          </Text>
        ),
        labels: { confirm: "Delete", cancel: "Keep item" },
        confirmProps: { color: "red" },
        onConfirm: () => handleDelete(car.car_id),
      });
    },
    [handleDelete],
  );

  return (
    <Stack gap="sm">
      <Title order={4}>Connected Cars</Title>

      <ScrollArea.Autosize mah={300} type="auto" offsetScrollbars>
        <Table striped highlightOnHover withTableBorder stickyHeader>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Make</Table.Th>
              <Table.Th>Model</Table.Th>
              <Table.Th>Model Code</Table.Th>
              <Table.Th>Year</Table.Th>
              <Table.Th>Date Created</Table.Th>
              <Table.Th>Status</Table.Th>
              <Table.Th ta="right">Actions</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {isFetchingCars ? (
              <Table.Tr>
                <Table.Td colSpan={7}>
                  <Group justify="center" py="md">
                    <Loader size="sm" />
                  </Group>
                </Table.Td>
              </Table.Tr>
            ) : connectedCars.length === 0 ? (
              <Table.Tr>
                <Table.Td colSpan={7}>
                  <Text c="dimmed" ta="center" py="md">
                    No connected cars
                  </Text>
                </Table.Td>
              </Table.Tr>
            ) : (
              connectedCars.map((car) => (
                <Table.Tr key={car.car_id}>
                  <Table.Td>{car.car_make}</Table.Td>
                  <Table.Td>{car.car_model}</Table.Td>
                  <Table.Td>{car.car_model_code}</Table.Td>
                  <Table.Td>
                    {getYearRange(car.car_model_year_start, car.car_model_year_end)}
                  </Table.Td>
                  <Table.Td>{new Date(car.car_date_created).toLocaleDateString()}</Table.Td>
                  <Table.Td>
                    <Badge color={car.car_is_available ? "green" : "yellow"} variant="light">
                      {car.car_is_available ? "Available" : "Disabled"}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Group gap={4} justify="flex-end" wrap="nowrap">
                      <Tooltip label={car.car_is_available ? "Temporarily Disable" : "Enable"}>
                        <Button
                          variant="subtle"
                          color={car.car_is_available ? "yellow" : "green"}
                          size="xs"
                          px={8}
                          loading={
                            loadingRow?.id === car.car_model_code && loadingRow.action === "disable"
                          }
                          disabled={
                            loadingRow !== null &&
                            loadingRow.id !== car.car_model_code &&
                            loadingRow.action === "disable"
                          }
                          aria-label={
                            car.car_is_available
                              ? `Temporarily Disable ${car.car_make} ${car.car_model}`
                              : `Enable ${car.car_make} ${car.car_model}`
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
                          loading={
                            loadingRow?.id === car.car_model_code && loadingRow.action === "delete"
                          }
                          disabled={
                            loadingRow !== null &&
                            loadingRow.id !== car.car_model_code &&
                            loadingRow.action === "delete"
                          }
                          aria-label={`Delete ${car.car_make} ${car.car_model}`}
                          onClick={() => confirmDelete(car)}
                        >
                          <IconTrash size={16} />
                        </Button>
                      </Tooltip>
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))
            )}
          </Table.Tbody>
        </Table>
      </ScrollArea.Autosize>
    </Stack>
  );
};

export default ConnectedCars;
