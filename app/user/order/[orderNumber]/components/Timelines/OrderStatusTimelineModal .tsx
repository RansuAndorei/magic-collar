"use client";

import {
  formatDate,
  formatStatusLabel,
  getOrderStatusColor,
  getOrderStatusDescription,
} from "@/utils/functions";
import { supabaseClient } from "@/utils/supabase/client";
import { OrderStatusLogTableRow } from "@/utils/types";
import { Badge, Group, Loader, Modal, Text, Timeline } from "@mantine/core";
import { IconArrowRight, IconHistory } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { fetchOrderStatusLog } from "../../actions";
import StatusBadge from "../StatusBadge";

type Props = {
  orderId: string;
  opened: boolean;
  onClose: () => void;
};

const OrderStatusTimelineModal = ({ orderId, opened, onClose }: Props) => {
  const [logs, setLogs] = useState<OrderStatusLogTableRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!opened) return;

    const fetchLogs = async () => {
      try {
        const data = await fetchOrderStatusLog(supabaseClient, { orderId });
        setLogs(data);
      } catch {
        setError("Something went wrong. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchLogs();
  }, [opened, orderId]);

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap="xs">
          <IconHistory size={18} />
          <Text fw={700}>Order Status Timeline</Text>
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

      {!isLoading && !error && logs.length === 0 && (
        <Text c="dimmed" size="sm">
          No status changes recorded yet.
        </Text>
      )}

      {!isLoading && !error && logs.length > 0 && (
        <Timeline active={logs.length - 1} bulletSize={20} lineWidth={2}>
          {logs.map((log, index) => (
            <Timeline.Item
              key={log.order_status_log_id}
              bullet={
                <Text size="xs" fw={700}>
                  {index + 1}
                </Text>
              }
              title={
                <Group gap={6} align="center" wrap="nowrap">
                  {log.order_status_log_old_status && (
                    <>
                      <Badge
                        variant="light"
                        color={getOrderStatusColor(log.order_status_log_old_status)}
                        size="sm"
                      >
                        {formatStatusLabel(log.order_status_log_old_status)}
                      </Badge>
                      <IconArrowRight
                        size={12}
                        style={{ color: "var(--mantine-color-dimmed)", flexShrink: 0 }}
                      />
                    </>
                  )}
                  <StatusBadge
                    label={log.order_status_log_new_status}
                    color={getOrderStatusColor(log.order_status_log_new_status)}
                    description={getOrderStatusDescription(log.order_status_log_new_status)}
                  />
                </Group>
              }
            >
              <Text size="xs" c="dimmed" mt={4}>
                {formatDate(new Date(log.order_status_log_date_created))}
              </Text>
            </Timeline.Item>
          ))}
        </Timeline>
      )}
    </Modal>
  );
};

export default OrderStatusTimelineModal;
