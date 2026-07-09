import { ORDER_INITIAL_VISIBLE } from "@/utils/constants";
import {
  formatCurrency,
  getBatchStatusColor,
  getBatchStatusDescription,
  getOrderItemStatusColor,
  getOrderItemStatusDescription,
  getProductSubtitle,
  getSetContents,
} from "@/utils/functions";
import { BatchStatusEnum, OrderItemStatusEnum, OrderWithOrderItemType } from "@/utils/types";
import {
  Alert,
  Badge,
  Box,
  Button,
  Card,
  Checkbox,
  Group,
  rem,
  Stack,
  Text,
  UnstyledButton,
} from "@mantine/core";
import {
  IconAlertTriangle,
  IconBox,
  IconChevronDown,
  IconCircleCheck,
  IconHistory,
  IconPackage,
  IconReceipt,
  IconTruckDelivery,
} from "@tabler/icons-react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";

import StatusBadge from "@/app/user/orders/components/StatusBadge";
import OrderItemStatusTimelineModal from "../../Timelines/OrderItemStatusTimelineModal";
import DeliveryProofUploadModal from "./DeliveryProofUploadModal";
import MarkDeliveredModal from "./MarkDeliveredModal";
import MarkReadyForPickupModal from "./MarkReadyForPickupModal";

type Props = {
  order: OrderWithOrderItemType;
};

type OrderItem = OrderWithOrderItemType["order_item"][number];

type BulkAction = "FULFILL" | "DELIVER";

const OrderItemSection = ({ order }: Props) => {
  const pathname = usePathname();

  const [showAll, setShowAll] = useState(false);
  const [activeTimelineItemId, setActiveTimelineItemId] = useState<string | null>(null);
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());
  const [proofModalOpened, setProofModalOpened] = useState(false);
  const [pickupModalOpened, setPickupModalOpened] = useState(false);
  const [deliveredModalOpened, setDeliveredModalOpened] = useState(false);

  const visibleItems = showAll
    ? order.order_item
    : order.order_item.slice(0, ORDER_INITIAL_VISIBLE);
  const hiddenCount = order.order_item.length - ORDER_INITIAL_VISIBLE;

  const isAdmin = pathname.startsWith("/admin");
  const isDeliveryOrder = order.order_fulfillment === "DELIVERY";
  const isFullyPaid = order.order_payment_status === "PAID";

  const isEligibleForFulfillment = (item: OrderItem) => {
    const isInStock = item.order_item_status === "IN STOCK";
    const isPendingButBatchReady =
      item.order_item_status === "PENDING" &&
      item.order_item_batch?.batch_status === "READY FOR SHIPPING";
    return isInStock || isPendingButBatchReady;
  };

  // DELIVERED: item is currently out for delivery or ready for pickup.
  const isEligibleForDelivered = (item: OrderItem) =>
    item.order_item_status === "OUT FOR DELIVERY" || item.order_item_status === "READY FOR PICKUP";

  // Returns which bulk action (if any) this item currently qualifies for.
  const getItemAction = (item: OrderItem): BulkAction | null => {
    if (isEligibleForFulfillment(item)) return "FULFILL";
    if (isEligibleForDelivered(item)) return "DELIVER";
    return null;
  };

  // The action currently "locked in" by the selection, derived from whatever's selected.
  const activeAction: BulkAction | null = useMemo(() => {
    if (selectedItemIds.size === 0) return null;
    const firstSelected = order.order_item.find((i) => selectedItemIds.has(i.order_item_id));
    return firstSelected ? getItemAction(firstSelected) : null;
  }, [selectedItemIds, order.order_item]);

  const eligibleItemIdsForAction = (action: BulkAction) =>
    order.order_item.filter((i) => getItemAction(i) === action).map((i) => i.order_item_id);

  const fulfillEligibleIds = useMemo(() => eligibleItemIdsForAction("FULFILL"), [order.order_item]);
  const deliverEligibleIds = useMemo(() => eligibleItemIdsForAction("DELIVER"), [order.order_item]);

  const toggleItem = (item: OrderItem) => {
    const itemAction = getItemAction(item);
    if (!itemAction) return;

    setSelectedItemIds((prev) => {
      // Selecting an item from a different action group starts a fresh selection.
      if (prev.size > 0 && activeAction && itemAction !== activeAction) {
        return new Set([item.order_item_id]);
      }
      const next = new Set(prev);
      if (next.has(item.order_item_id)) next.delete(item.order_item_id);
      else next.add(item.order_item_id);
      return next;
    });
  };

  const toggleSelectAllEligible = () => {
    // "Select all" toggles within whichever action group is currently active,
    // defaulting to FULFILL when nothing is selected yet.
    const targetAction = activeAction ?? "FULFILL";
    const idsForAction = targetAction === "FULFILL" ? fulfillEligibleIds : deliverEligibleIds;

    setSelectedItemIds((prev) =>
      prev.size === idsForAction.length ? new Set() : new Set(idsForAction),
    );
  };

  const handleTransitionSuccess = () => {
    setSelectedItemIds(new Set());
    setProofModalOpened(false);
    setPickupModalOpened(false);
    setDeliveredModalOpened(false);
  };

  return (
    <Card withBorder p="lg">
      <Stack gap="md">
        <Group justify="space-between" wrap="nowrap">
          <Group gap="sm">
            <IconBox size={18} />
            <Text fw={700}>Order Items</Text>
            <Badge variant="light" color="gray" size="sm">
              {order.order_item.length}
            </Badge>
          </Group>

          {isAdmin &&
            activeAction &&
            (activeAction === "FULFILL"
              ? fulfillEligibleIds.length > 0
              : deliverEligibleIds.length > 0) && (
              <UnstyledButton onClick={toggleSelectAllEligible}>
                <Text size="xs" c="dimmed" td="underline">
                  {selectedItemIds.size ===
                  (activeAction === "FULFILL"
                    ? fulfillEligibleIds.length
                    : deliverEligibleIds.length)
                    ? "Deselect all"
                    : `Select all (${
                        activeAction === "FULFILL"
                          ? fulfillEligibleIds.length
                          : deliverEligibleIds.length
                      })`}
                </Text>
              </UnstyledButton>
            )}
        </Group>

        {visibleItems.map((item) => {
          const itemAction = getItemAction(item);
          const eligible =
            isAdmin && itemAction !== null && (!activeAction || itemAction === activeAction);
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
          const deliveryProof = item.order_item_delivery_proof;

          return (
            <Card key={item.order_item_id} withBorder p="md">
              <Stack gap="sm">
                <Group align="flex-start" gap="md" wrap="nowrap">
                  {eligible && (
                    <Checkbox
                      mt={4}
                      checked={selectedItemIds.has(item.order_item_id)}
                      onChange={() => toggleItem(item)}
                    />
                  )}

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
                        label={status}
                        color={color}
                        description={description}
                        size="sm"
                      />

                      <UnstyledButton
                        onClick={() => setActiveTimelineItemId(item.order_item_id)}
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

                      {deliveryProof?.delivery_proof_attachment?.attachment_path && (
                        <UnstyledButton
                          component="a"
                          href={deliveryProof.delivery_proof_attachment.attachment_path}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                            marginTop: 4,
                          }}
                        >
                          <IconReceipt size={13} style={{ color: "var(--mantine-color-dimmed)" }} />
                          <Text
                            size="xs"
                            c="dimmed"
                            style={{ textDecoration: "underline", textUnderlineOffset: 2 }}
                          >
                            View proof of delivery
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
                    opened={activeTimelineItemId === item.order_item_id}
                    onClose={() => setActiveTimelineItemId(null)}
                  />
                </>
              </Stack>
            </Card>
          );
        })}

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

        {isAdmin && selectedItemIds.size > 0 && (
          <Stack>
            <Group
              justify="space-between"
              align="center"
              p="sm"
              style={{
                position: "sticky",
                bottom: rem(8),
                borderRadius: rem(8),
                background: "var(--mantine-color-body)",
                border: "1px solid var(--mantine-color-default-border)",
                boxShadow: "var(--mantine-shadow-md)",
              }}
            >
              <Text size="sm" fw={600}>
                {selectedItemIds.size} item{selectedItemIds.size > 1 ? "s" : ""} selected
              </Text>

              {activeAction === "DELIVER" ? (
                <Button
                  size="sm"
                  color="teal"
                  leftSection={<IconCircleCheck size={16} />}
                  onClick={() => setDeliveredModalOpened(true)}
                  disabled={!isFullyPaid}
                >
                  Mark as Delivered
                </Button>
              ) : isDeliveryOrder ? (
                <Button
                  size="sm"
                  leftSection={<IconTruckDelivery size={16} />}
                  onClick={() => setProofModalOpened(true)}
                  disabled={!isFullyPaid}
                >
                  Mark Out for Delivery
                </Button>
              ) : (
                <Button
                  size="sm"
                  leftSection={<IconPackage size={16} />}
                  onClick={() => setPickupModalOpened(true)}
                  disabled={!isFullyPaid}
                >
                  Mark Ready for Pickup
                </Button>
              )}
            </Group>
            {!isFullyPaid && (
              <Alert
                color="yellow"
                variant="light"
                icon={<IconAlertTriangle size={18} />}
                radius="md"
              >
                This order has not been fully paid yet. The customer must complete the payment
                before the order can be released.
              </Alert>
            )}
          </Stack>
        )}

        <DeliveryProofUploadModal
          opened={proofModalOpened}
          onClose={() => setProofModalOpened(false)}
          orderItemIds={Array.from(selectedItemIds)}
          onSuccess={handleTransitionSuccess}
          orderId={order.order_id}
        />

        <MarkReadyForPickupModal
          opened={pickupModalOpened}
          onClose={() => setPickupModalOpened(false)}
          orderItemIds={Array.from(selectedItemIds)}
          onSuccess={handleTransitionSuccess}
          orderId={order.order_id}
        />

        <MarkDeliveredModal
          opened={deliveredModalOpened}
          onClose={() => setDeliveredModalOpened(false)}
          orderItemIds={Array.from(selectedItemIds)}
          onSuccess={handleTransitionSuccess}
          orderId={order.order_id}
        />
      </Stack>
    </Card>
  );
};

export default OrderItemSection;
