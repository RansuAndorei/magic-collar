"use client";

import { formatDate, getBatchStatusColor, getBatchStatusDescription } from "@/utils/functions";

import { BatchStatusLogTableRow } from "@/utils/types";
import { Text, Timeline } from "@mantine/core";
import StatusBadge from "../StatusBadge";

const BatchSubTimeline = ({ logs }: { logs: BatchStatusLogTableRow[] }) => {
  if (logs.length === 0) {
    return (
      <Text size="xs" c="dimmed" mt={6} ml={4}>
        No batch updates yet.
      </Text>
    );
  }

  return (
    <Timeline active={logs.length - 1} bulletSize={16} lineWidth={2} mt={8} ml={4}>
      {logs.map((log, index) => (
        <Timeline.Item
          key={log.batch_status_log_id}
          bullet={
            <Text size="xs" fw={700}>
              {index + 1}
            </Text>
          }
          title={
            <StatusBadge
              label={log.batch_status_log_new_status}
              color={getBatchStatusColor(log.batch_status_log_new_status)}
              description={getBatchStatusDescription(log.batch_status_log_new_status)}
            />
          }
        >
          <Text size="xs" c="dimmed" mt={4}>
            {formatDate(new Date(log.batch_status_log_date_created))}
          </Text>
        </Timeline.Item>
      ))}
    </Timeline>
  );
};

export default BatchSubTimeline;
