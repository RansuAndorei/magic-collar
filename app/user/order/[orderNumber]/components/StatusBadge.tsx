import { Badge, Popover, Stack, Text } from "@mantine/core";
import { IconInfoCircle } from "@tabler/icons-react";

type Props = {
  label: string;
  color: string;
  description: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
};

const StatusBadge = ({ label, color, description, size }: Props) => {
  return (
    <Popover width={280} position="bottom-start" withArrow shadow="md">
      <Popover.Target>
        <Badge
          component="button"
          type="button"
          color={color}
          size={size}
          variant="light"
          title={description}
          rightSection={<IconInfoCircle size={12} />}
          aria-label={`${label}. ${description}`}
          style={{ cursor: "help" }}
        >
          {label}
        </Badge>
      </Popover.Target>
      <Popover.Dropdown>
        <Stack gap={4}>
          <Text size="xs" fw={700}>
            {label}
          </Text>
          <Text size="xs" c="dimmed">
            {description}
          </Text>
        </Stack>
      </Popover.Dropdown>
    </Popover>
  );
};

export default StatusBadge;
