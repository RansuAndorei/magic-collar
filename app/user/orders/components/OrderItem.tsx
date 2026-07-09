import { ORDER_INITIAL_VISIBLE } from "@/utils/constants";
import {
  formatCurrency,
  formatDate,
  getBatchStatusColor,
  getBatchStatusDescription,
  getOrderItemStatusColor,
  getOrderItemStatusDescription,
  getOrderStatusColor,
  getOrderStatusDescription,
  getOrderTotal,
  getPaymentStatusColor,
  getPaymentStatusDescription,
  getProductSubtitle,
} from "@/utils/functions";
import { BatchStatusEnum, OrderItemStatusEnum, OrderWithOrderItemType } from "@/utils/types";
import {
  Badge,
  Box,
  Card,
  Divider,
  Group,
  Image,
  rem,
  Stack,
  Text,
  Title,
  UnstyledButton,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import {
  IconBox,
  IconCalendar,
  IconChevronDown,
  IconPackage,
  IconTruckDelivery,
} from "@tabler/icons-react";
import Link from "next/link";
import StatusBadge from "./StatusBadge";

const formatStatusLabel = (status: string) => status.replace(/_/g, " ");

type Props = {
  order: OrderWithOrderItemType;
};

const OrderItem = ({ order }: Props) => {
  const [itemsOpen, { toggle: toggleItems }] = useDisclosure(false);

  const visibleSidebarItems = itemsOpen
    ? order.order_item
    : order.order_item.slice(0, ORDER_INITIAL_VISIBLE);

  const hiddenSidebarCount = order.order_item.length - ORDER_INITIAL_VISIBLE;

  return (
    <Card
      component={Link}
      href={`/user/orders/${order.order_number}`}
      withBorder
      p="lg"
      radius="md"
      style={{
        display: "block",
        cursor: "pointer",
        textDecoration: "none",
        color: "inherit",
        transition: "border-color 150ms ease, box-shadow 150ms ease, transform 150ms ease",
      }}
      onMouseEnter={(event) => {
        event.currentTarget.style.borderColor = "var(--mantine-color-red-6)";
        event.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.10)";
        event.currentTarget.style.transform = "translateY(-2px)";
      }}
      onMouseLeave={(event) => {
        event.currentTarget.style.borderColor = "";
        event.currentTarget.style.boxShadow = "";
        event.currentTarget.style.transform = "";
      }}
    >
      <Stack gap="md">
        <Group justify="space-between" align="flex-start" wrap="wrap">
          <Stack gap={4} style={{ minWidth: 0 }}>
            <Group gap="xs" wrap="wrap" align="center">
              <Title fw={800} order={2}>
                Order #{order.order_number}
              </Title>
              <StatusBadge
                label={order.order_status}
                color={getOrderStatusColor(order.order_status)}
                description={getOrderStatusDescription(order.order_status)}
              />
            </Group>
            <Group gap={6} align="center">
              <IconCalendar size={14} color="var(--mantine-color-dimmed)" />
              <Text size="sm" c="dimmed">
                {formatDate(new Date(order.order_date_created))}
              </Text>
            </Group>
          </Stack>
          <Stack gap={4} align="flex-end" style={{ flexShrink: 0 }}>
            <StatusBadge
              label={formatStatusLabel(order.order_payment_status)}
              color={getPaymentStatusColor(order.order_payment_status)}
              description={getPaymentStatusDescription(order.order_payment_status)}
              variant="dot"
              prefix="Payment"
            />
            <Group gap="xs" align="center" justify="center">
              <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                Total:
              </Text>
              <Text fw={800} c="red.5" size="lg">
                {formatCurrency(getOrderTotal(order.order_item), { minimumFractionDigits: 0 })}
              </Text>
            </Group>
          </Stack>
        </Group>

        <Divider />

        <Stack gap="sm">
          <Group justify="space-between" align="center">
            <Group gap="xs">
              <IconBox size={16} color="var(--mantine-color-red-5)" />
              <Text fw={700} size="sm">
                Items
              </Text>
              <Badge variant="light" color="gray" size="xs">
                {order.order_item.length}
              </Badge>
            </Group>
            <Badge
              variant="light"
              color={order.order_fulfillment === "PICKUP" ? "blue" : "teal"}
              leftSection={
                order.order_fulfillment === "PICKUP" ? (
                  <IconPackage size={12} />
                ) : (
                  <IconTruckDelivery size={12} />
                )
              }
            >
              {order.order_fulfillment === "PICKUP" ? "Pickup" : "Delivery"}
            </Badge>
          </Group>

          {visibleSidebarItems.map((item) => {
            const isBatch = item.order_item_status === "PENDING" && item.order_item_batch;
            const status = (
              isBatch ? item.order_item_batch?.batch_status : item.order_item_status
            ) as BatchStatusEnum | OrderItemStatusEnum;
            const color = isBatch
              ? getBatchStatusColor(status as BatchStatusEnum)
              : getOrderItemStatusColor(status as OrderItemStatusEnum);
            const description = isBatch
              ? getBatchStatusDescription(status as BatchStatusEnum)
              : getOrderItemStatusDescription(status as OrderItemStatusEnum);

            return (
              <Group key={item.order_item_id} gap="sm" wrap="nowrap">
                <Box
                  w={52}
                  h={52}
                  style={{
                    borderRadius: rem(6),
                    overflow: "hidden",
                    background: "var(--mantine-color-default)",
                    flexShrink: 0,
                  }}
                >
                  {item.order_item_car_image_attachment?.attachment_path ? (
                    <Image
                      src={item.order_item_car_image_attachment.attachment_path}
                      alt={`${item.order_item_car_make} ${item.order_item_car_model}`}
                      w={52}
                      h={52}
                      fit="cover"
                    />
                  ) : null}
                </Box>
                <Stack gap={1} style={{ flex: 1, minWidth: 0 }}>
                  <Text size="sm" fw={700} lineClamp={1}>
                    {item.order_item_car_make} {item.order_item_car_model}
                  </Text>
                  <Text size="xs" c="dimmed" lineClamp={1}>
                    {getProductSubtitle(
                      item.order_item_car_model_code,
                      item.order_item_car_model_year_start,
                      item.order_item_car_model_year_end,
                    )}
                  </Text>
                  <Text size="sm" fw={700} lineClamp={1}>
                    x{item.order_item_quantity}
                  </Text>
                </Stack>
                <StatusBadge label={status} color={color} description={description} size="sm" />
                <Text size="sm" fw={700} style={{ flexShrink: 0 }}>
                  {formatCurrency(item.order_item_price * item.order_item_quantity, {
                    minimumFractionDigits: 0,
                  })}
                </Text>
              </Group>
            );
          })}

          {hiddenSidebarCount > 0 && (
            <UnstyledButton
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                toggleItems();
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: rem(4),
                color: "var(--mantine-color-dimmed)",
                fontSize: "var(--mantine-font-size-xs)",
              }}
            >
              <IconChevronDown
                size={13}
                style={{
                  transform: itemsOpen ? "rotate(180deg)" : "rotate(0deg)",
                  transition: "transform 200ms ease",
                }}
              />
              {itemsOpen
                ? "Show less"
                : `${hiddenSidebarCount} more item${hiddenSidebarCount > 1 ? "s" : ""}`}
            </UnstyledButton>
          )}
        </Stack>
      </Stack>
    </Card>
  );
};

export default OrderItem;
