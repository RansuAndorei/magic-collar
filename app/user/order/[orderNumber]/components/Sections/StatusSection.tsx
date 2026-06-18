import {
  formatCurrency,
  formatStatusLabel,
  getOrderStatusColor,
  getOrderStatusDescription,
  getOrderTotal,
  getPaymentStatusColor,
  getPaymentStatusDescription,
} from "@/utils/functions";
import { OrderWithOrderItemType } from "@/utils/types";
import { Card, SimpleGrid, Stack, Text, UnstyledButton } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconHistory } from "@tabler/icons-react";
import StatusBadge from "../StatusBadge";
import OrderStatusTimelineModal from "../Timelines/OrderStatusTimelineModal ";

type Props = {
  order: OrderWithOrderItemType;
};

const StatusSection = ({ order }: Props) => {
  const [timelineOpen, { open: openTimeline, close: closeTimeline }] = useDisclosure(false);

  return (
    <>
      <SimpleGrid cols={{ base: 1, md: 4 }} spacing="md">
        <Card withBorder p="lg">
          <Stack gap={4}>
            <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
              Order Status
            </Text>
            <StatusBadge
              label={order.order_status}
              color={getOrderStatusColor(order.order_status)}
              description={getOrderStatusDescription(order.order_status)}
            />
            <UnstyledButton
              onClick={openTimeline}
              style={{ display: "inline-flex", alignItems: "center", gap: 4, marginTop: 4 }}
            >
              <IconHistory size={13} style={{ color: "var(--mantine-color-dimmed)" }} />
              <Text
                size="xs"
                c="dimmed"
                style={{ textDecoration: "underline", textUnderlineOffset: 2 }}
              >
                View timeline
              </Text>
            </UnstyledButton>
          </Stack>
        </Card>

        <Card withBorder p="lg">
          <Stack gap={4}>
            <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
              Payment Status
            </Text>
            <StatusBadge
              label={formatStatusLabel(order.order_payment_status)}
              color={getPaymentStatusColor(order.order_payment_status)}
              description={getPaymentStatusDescription(order.order_payment_status)}
            />
          </Stack>
        </Card>

        <Card withBorder p="lg">
          <Stack gap={4}>
            <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
              Fulfillment
            </Text>
            <Text fw={700}>{order.order_fulfillment}</Text>
            <Text size="sm" c="dimmed">
              {order.order_delivery_detail_full_name}
            </Text>
          </Stack>
        </Card>

        <Card withBorder p="lg">
          <Stack gap={4}>
            <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
              Total
            </Text>
            <Text fw={800} c="red.5">
              {formatCurrency(getOrderTotal(order.order_item), { minimumFractionDigits: 0 })}
            </Text>
          </Stack>
        </Card>
      </SimpleGrid>

      <OrderStatusTimelineModal
        orderId={order.order_id}
        opened={timelineOpen}
        onClose={closeTimeline}
      />
    </>
  );
};

export default StatusSection;
