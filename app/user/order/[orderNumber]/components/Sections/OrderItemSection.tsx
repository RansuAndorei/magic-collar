import { ORDER_INITIAL_VISIBLE } from "@/utils/constants";
import {
  formatCurrency,
  getBatchStatusColor,
  getBatchStatusDescription,
  getOrderStatusColor,
  getOrderStatusDescription,
  getProductSubtitle,
  getSetContents,
} from "@/utils/functions";
import { OrderWithOrderItemType } from "@/utils/types";
import { Badge, Box, Card, Group, rem, Stack, Text, UnstyledButton } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconBox, IconChevronDown, IconHistory } from "@tabler/icons-react";
import Image from "next/image";
import { useState } from "react";
import StatusBadge from "../StatusBadge";
import OrderItemStatusTimelineModal from "../Timelines/OrderItemStatusTimelineModal";

type Props = {
  order: OrderWithOrderItemType;
};

const OrderItemSection = ({ order }: Props) => {
  const [showAll, setShowAll] = useState(false);

  const [timelineOpened, { open: openTimeline, close: closeTimeline }] = useDisclosure(false);

  const visibleItems = showAll
    ? order.order_item
    : order.order_item.slice(0, ORDER_INITIAL_VISIBLE);
  const hiddenCount = order.order_item.length - ORDER_INITIAL_VISIBLE;

  return (
    <Card withBorder p="lg">
      <Stack gap="md">
        <Group gap="sm">
          <IconBox size={18} />
          <Text fw={700}>Order Items</Text>
          <Badge variant="light" color="gray" size="sm">
            {order.order_item.length}
          </Badge>
        </Group>

        {visibleItems.map((item) => (
          <Card key={item.order_item_id} withBorder p="md">
            <Stack gap="sm">
              <Group align="flex-start" gap="md" wrap="nowrap">
                <Box
                  w={84}
                  h={84}
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
                      width={84}
                      height={84}
                      style={{ objectFit: "cover" }}
                    />
                  ) : null}
                </Box>

                <Stack gap={4} style={{ flex: 1, minWidth: 0 }}>
                  <Text fw={700} lineClamp={2}>
                    {item.order_item_car_make} {item.order_item_car_model}
                  </Text>
                  <Text size="sm" c="dimmed" lineClamp={1}>
                    {getProductSubtitle(
                      item.order_item_car_model_code,
                      item.order_item_car_model_year_start,
                      item.order_item_car_model_year_end,
                    )}
                  </Text>
                  <Text size="sm" c="dimmed">
                    Quantity: {item.order_item_quantity}
                  </Text>
                  <Text size="sm" c="dimmed">
                    Set:{" "}
                    {getSetContents(
                      item.order_item_magic_collar_front_quantity,
                      item.order_item_magic_collar_rear_quantity,
                      item.order_item_magic_collar_all_quantity,
                    )}
                  </Text>
                </Stack>
              </Group>

              <>
                <Group justify="space-between" align="center">
                  <Stack gap={0}>
                    <StatusBadge
                      label={item.order_item_batch?.batch_status ?? order.order_status}
                      color={
                        item.order_item_batch
                          ? getBatchStatusColor(item.order_item_batch.batch_status)
                          : getOrderStatusColor(order.order_status)
                      }
                      description={
                        item.order_item_batch
                          ? getBatchStatusDescription(item.order_item_batch.batch_status)
                          : getOrderStatusDescription(order.order_status)
                      }
                      size="sm"
                    />
                    {item.order_item_batch && (
                      <UnstyledButton
                        onClick={openTimeline}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                          marginTop: 4,
                        }}
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
                    )}
                  </Stack>
                  <Text fw={800}>
                    {formatCurrency(item.order_item_price * item.order_item_quantity, {
                      minimumFractionDigits: 0,
                    })}
                  </Text>
                </Group>

                <OrderItemStatusTimelineModal
                  orderItemId={item.order_item_id}
                  opened={timelineOpened}
                  onClose={closeTimeline}
                />
              </>
            </Stack>
          </Card>
        ))}

        {order.order_item.length > ORDER_INITIAL_VISIBLE && (
          <UnstyledButton
            onClick={() => setShowAll((v) => !v)}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: rem(6),
              padding: `${rem(8)} 0`,
              color: "var(--mantine-color-dimmed)",
              fontSize: "var(--mantine-font-size-sm)",
            }}
          >
            <IconChevronDown
              size={16}
              style={{
                transform: showAll ? "rotate(180deg)" : "rotate(0deg)",
                transition: "transform 200ms ease",
              }}
            />
            {showAll ? "Show less" : `Show ${hiddenCount} more item${hiddenCount > 1 ? "s" : ""}`}
          </UnstyledButton>
        )}
      </Stack>
    </Card>
  );
};

export default OrderItemSection;
