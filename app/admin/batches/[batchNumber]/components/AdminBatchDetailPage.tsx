"use client";

import { insertError } from "@/app/actions";
import StatusBadge from "@/app/user/orders/components/StatusBadge";
import { useUserData } from "@/stores/useUserStore";
import { BATCH_NEXT_STATUS, BATCH_STATUS_METADATA } from "@/utils/constants";
import {
  formatCurrency,
  formatDate,
  getBatchStatusColor,
  getBatchStatusDescription,
  getOrderItemStatusColor,
  getOrderItemStatusDescription,
  getOrderStatusColor,
  getProductSubtitle,
  getSetContents,
  isAppError,
} from "@/utils/functions";
import { supabaseClient } from "@/utils/supabase/client";
import { AdminBatchDetail, AdminBatchOrderItem, BatchStatusEnum } from "@/utils/types";
import {
  Accordion,
  ActionIcon,
  Badge,
  Box,
  Button,
  Group,
  Paper,
  Progress,
  SimpleGrid,
  Stack,
  Table,
  Text,
  ThemeIcon,
  Title,
  Tooltip,
  rem,
} from "@mantine/core";
import { modals } from "@mantine/modals";
import { notifications } from "@mantine/notifications";
import {
  IconArrowLeft,
  IconExternalLink,
  IconPackageExport,
  IconReceipt,
} from "@tabler/icons-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { transitionBatchStatus } from "../../actions";

type BatchOrder = AdminBatchOrderItem["order_item_order"] & {
  items: AdminBatchOrderItem[];
  batch_quantity: number;
  batch_total: number;
};

type Props = {
  batch: AdminBatchDetail;
  batchLimit: number;
};

const AdminBatchDetailPage = ({ batch, batchLimit }: Props) => {
  const router = useRouter();
  const userData = useUserData();
  const pathname = usePathname();

  const nextStatus = BATCH_NEXT_STATUS[batch.batch_status];
  const Icon = BATCH_STATUS_METADATA[batch.batch_status].icon;

  const [isLoading, setIsLoading] = useState(false);

  const orders = useMemo(() => {
    const orderMap = new Map<string, BatchOrder>();

    batch.batch_order_item.forEach((item) => {
      const existingOrder = orderMap.get(item.order_item_order.order_id);

      if (existingOrder) {
        existingOrder.items.push(item);
        existingOrder.batch_quantity += item.order_item_quantity;
        existingOrder.batch_total += item.order_item_price * item.order_item_quantity;
        return;
      }

      orderMap.set(item.order_item_order.order_id, {
        ...item.order_item_order,
        items: [item],
        batch_quantity: item.order_item_quantity,
        batch_total: item.order_item_price * item.order_item_quantity,
      });
    });

    return Array.from(orderMap.values()).sort((a, b) => b.order_number - a.order_number);
  }, [batch.batch_order_item]);

  const progressValue =
    batchLimit > 0 ? Math.min((batch.batch_order_quantity / batchLimit) * 100, 100) : 0;

  const handleStatusTransition = async (batchId: string, nextStatus: BatchStatusEnum) => {
    if (!userData) return;
    setIsLoading(true);
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
      router.refresh();
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
      setIsLoading(false);
      null;
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

  return (
    <Stack flex={1} gap="xl" miw={0}>
      <Group justify="space-between" align="flex-start">
        <Stack gap={4}>
          <Text size="sm" c="red.5" fw={700} tt="uppercase">
            Batch #{batch.batch_number}
          </Text>
          <Title order={1} style={{ fontSize: rem(34), fontWeight: 800 }}>
            Batch Details
          </Title>
          <Group gap="sm">
            <StatusBadge
              label={batch.batch_status}
              color={getBatchStatusColor(batch.batch_status)}
              description={getBatchStatusDescription(batch.batch_status)}
              size="sm"
            />
            <Text size="sm" c="dimmed">
              Created {formatDate(new Date(batch.batch_date_created))}
            </Text>
          </Group>
        </Stack>

        <Stack gap="sm">
          <Button
            variant="subtle"
            color="gray"
            leftSection={<IconArrowLeft size={16} />}
            onClick={() => router.push("/admin/batches")}
          >
            Back to Batches
          </Button>
          {nextStatus && (
            <Button
              variant="light"
              color={BATCH_STATUS_METADATA[nextStatus].color}
              leftSection={Icon && <Icon size={14} />}
              onClick={() => statusTransitionConfirmation(batch.batch_id, batch.batch_status)}
              loading={isLoading}
            >
              Move to {nextStatus}
            </Button>
          )}
        </Stack>
      </Group>

      <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
        <Paper withBorder p="md" radius="md">
          <Text size="xs" c="dimmed" fw={700} tt="uppercase">
            Orders
          </Text>
          <Text fw={800} fz={28}>
            {orders.length}
          </Text>
        </Paper>
        <Paper withBorder p="md" radius="md">
          <Text size="xs" c="dimmed" fw={700} tt="uppercase">
            Items
          </Text>
          <Text fw={800} fz={28}>
            {batch.batch_order_quantity}
            {batch.batch_status === "PENDING" && batchLimit > 0 ? (
              <Text span c="dimmed" fz="md" fw={600}>
                {" "}
                / {batchLimit}
              </Text>
            ) : null}
          </Text>
          {batch.batch_status === "PENDING" && batchLimit > 0 ? (
            <Progress value={progressValue} mt="xs" striped animated />
          ) : null}
        </Paper>
        <Paper withBorder p="md" radius="md">
          <Text size="xs" c="dimmed" fw={700} tt="uppercase">
            Batch Value
          </Text>
          <Text fw={800} fz={28} c="red.5">
            {formatCurrency(batch.batch_order_total, { minimumFractionDigits: 0 })}
          </Text>
        </Paper>
      </SimpleGrid>

      <Paper withBorder p="md" radius="md">
        <Group justify="space-between" align="flex-start" mb="md">
          <Box>
            <Group gap="xs">
              <ThemeIcon color="red" variant="light" radius="md">
                <IconPackageExport size={18} />
              </ThemeIcon>
              <Title order={2} size="h3">
                Orders in this batch
              </Title>
            </Group>
            <Text size="sm" c="dimmed" mt={4}>
              Each order shows only the items assigned to this batch.
            </Text>
          </Box>
        </Group>

        <Stack gap="md">
          {orders.length === 0 ? (
            <Paper withBorder p="xl" radius="md">
              <Text ta="center" c="dimmed">
                No orders found for this batch.
              </Text>
            </Paper>
          ) : (
            <Accordion variant="separated" radius="md">
              {orders.map((order) => (
                <Accordion.Item key={order.order_id} value={order.order_id}>
                  <Accordion.Control>
                    <Group justify="space-between" align="center" pr="md">
                      <Group gap="xs">
                        <ThemeIcon color="gray" variant="light" radius="md">
                          <IconReceipt size={18} />
                        </ThemeIcon>
                        <Stack gap={2}>
                          <Text fw={700}>Order #{order.order_number}</Text>
                          <Text size="xs" c="dimmed">
                            {order.order_user.user_first_name} {order.order_user.user_last_name} ·{" "}
                            {formatDate(new Date(order.order_date_created))}
                          </Text>
                        </Stack>
                      </Group>
                      <Group gap="sm">
                        <Badge color={getOrderStatusColor(order.order_status)} variant="light">
                          {order.order_status}
                        </Badge>
                        <Text fw={800} c="red.5" size="sm">
                          {formatCurrency(order.batch_total, { minimumFractionDigits: 0 })}
                        </Text>
                      </Group>
                    </Group>
                  </Accordion.Control>

                  <Accordion.Panel>
                    <Stack gap="md">
                      <Group justify="space-between" align="center">
                        <Text size="xs" c="dimmed">
                          {order.order_user.user_email}
                        </Text>
                        <Tooltip label="Open Order">
                          <ActionIcon
                            component={Link}
                            href={`/admin/orders/${order.order_number}`}
                            variant="subtle"
                            color="gray"
                            size="sm"
                          >
                            <IconExternalLink size={16} />
                          </ActionIcon>
                        </Tooltip>
                      </Group>
                      <Table.ScrollContainer minWidth={760}>
                        <Table verticalSpacing="sm">
                          <Table.Thead>
                            <Table.Tr>
                              <Table.Th>Item</Table.Th>
                              <Table.Th>Status</Table.Th>
                              <Table.Th>Set</Table.Th>
                              <Table.Th ta="center">Quantity</Table.Th>
                              <Table.Th ta="right">Total</Table.Th>
                            </Table.Tr>
                          </Table.Thead>
                          <Table.Tbody>
                            {order.items.map((item) => (
                              <Table.Tr key={item.order_item_id}>
                                <Table.Td>
                                  <Stack gap={2}>
                                    <Text fw={700}>
                                      {item.order_item_car_make} {item.order_item_car_model}
                                    </Text>
                                    <Text size="xs" c="dimmed">
                                      {getProductSubtitle(
                                        item.order_item_car_model_code,
                                        item.order_item_car_model_year_start,
                                        item.order_item_car_model_year_end,
                                      )}
                                    </Text>
                                  </Stack>
                                </Table.Td>
                                <Table.Td>
                                  <StatusBadge
                                    label={item.order_item_status}
                                    color={getOrderItemStatusColor(item.order_item_status)}
                                    description={getOrderItemStatusDescription(
                                      item.order_item_status,
                                    )}
                                    size="sm"
                                  />
                                </Table.Td>
                                <Table.Td>
                                  <Text size="sm">
                                    {getSetContents(
                                      item.order_item_magic_collar_front_quantity,
                                      item.order_item_magic_collar_rear_quantity,
                                      item.order_item_magic_collar_all_quantity,
                                    )}
                                  </Text>
                                </Table.Td>
                                <Table.Td ta="center">
                                  <Text fw={700}>{item.order_item_quantity}</Text>
                                </Table.Td>
                                <Table.Td ta="right">
                                  <Text fw={800}>
                                    {formatCurrency(
                                      item.order_item_price * item.order_item_quantity,
                                      {
                                        minimumFractionDigits: 0,
                                      },
                                    )}
                                  </Text>
                                </Table.Td>
                              </Table.Tr>
                            ))}
                          </Table.Tbody>
                        </Table>
                      </Table.ScrollContainer>
                    </Stack>
                  </Accordion.Panel>
                </Accordion.Item>
              ))}
            </Accordion>
          )}
        </Stack>
      </Paper>
    </Stack>
  );
};

export default AdminBatchDetailPage;
