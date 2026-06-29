import {
  formatDate,
  getOrderItemStatusColor,
  getOrderItemStatusDescription,
} from "@/utils/functions";
import { supabaseClient } from "@/utils/supabase/client";
import { BatchStatusLogTableRow, OrderItemStatusLogTableRow } from "@/utils/types";
import { Box, Collapse, Group, Loader, Modal, Text, Timeline, UnstyledButton } from "@mantine/core";
import { IconChevronDown, IconChevronRight, IconHistory } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { fetchOrderItemTimeline } from "../../actions";
import StatusBadge from "../StatusBadge";
import BatchSubTimeline from "./BatchSubTimeline";

type Props = {
  orderItemId?: string;
  opened: boolean;
  onClose: () => void;
};

const OrderItemStatusTimelineModal = ({ orderItemId, opened, onClose }: Props) => {
  const [batchLogs, setBatchLogs] = useState<BatchStatusLogTableRow[]>([]);
  const [itemLogs, setItemLogs] = useState<OrderItemStatusLogTableRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [batchExpanded, setBatchExpanded] = useState(false);

  useEffect(() => {
    if (!opened || !orderItemId) return;

    const fetchLogs = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const { batchLogs, itemLogs } = await fetchOrderItemTimeline(supabaseClient, {
          orderItemId,
        });
        setBatchLogs(batchLogs);
        setItemLogs(itemLogs);
      } catch {
        setError("Something went wrong. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchLogs();
  }, [opened, orderItemId]);

  const hasBatch = batchLogs.length > 0;

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap="xs">
          <IconHistory size={18} />
          <Text fw={700}>Order Item Timeline</Text>
        </Group>
      }
      size="sm"
      centered
    >
      {isLoading && (
        <Group justify="center" py="xl">
          <Loader size="sm" />
        </Group>
      )}

      {!isLoading && error && (
        <Text c="red" size="sm">
          {error}
        </Text>
      )}

      {!isLoading && !error && (
        <>
          {itemLogs.length === 0 ? (
            <Text c="dimmed" size="sm">
              No status changes recorded yet.
            </Text>
          ) : (
            <Timeline active={itemLogs.length - 1} bulletSize={20} lineWidth={2}>
              {itemLogs.map((log, index) => {
                const isPendingEntry =
                  log.order_item_status_log_new_status === "PENDING" && hasBatch;

                return (
                  <Timeline.Item
                    key={log.order_item_status_log_id}
                    bullet={
                      <Text size="xs" fw={700}>
                        {index + 1}
                      </Text>
                    }
                    title={
                      <StatusBadge
                        label={log.order_item_status_log_new_status}
                        color={getOrderItemStatusColor(log.order_item_status_log_new_status)}
                        description={getOrderItemStatusDescription(
                          log.order_item_status_log_new_status,
                        )}
                      />
                    }
                  >
                    <Text size="xs" c="dimmed" mt={4}>
                      {formatDate(new Date(log.order_item_status_log_date_created))}
                    </Text>

                    {/* Collapsible batch sub-timeline under PENDING */}
                    {isPendingEntry && (
                      <Box style={{ marginTop: 8 }}>
                        <UnstyledButton onClick={() => setBatchExpanded((v) => !v)}>
                          <Group gap={4} align="center">
                            {batchExpanded ? (
                              <IconChevronDown size={13} />
                            ) : (
                              <IconChevronRight size={13} />
                            )}
                            <Text size="xs" c="dimmed">
                              Supplier Batch Updates
                            </Text>
                          </Group>
                        </UnstyledButton>

                        <Collapse expanded={batchExpanded}>
                          <BatchSubTimeline logs={batchLogs} />
                        </Collapse>
                      </Box>
                    )}
                  </Timeline.Item>
                );
              })}
            </Timeline>
          )}
        </>
      )}
    </Modal>
  );
};

export default OrderItemStatusTimelineModal;
