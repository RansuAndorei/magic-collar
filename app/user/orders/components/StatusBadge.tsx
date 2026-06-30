import { Badge, Popover, Stack, Text } from "@mantine/core";
import { IconInfoCircle } from "@tabler/icons-react";

type Props = {
  label: string;
  color: string;
  description: string;
  prefix?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  variant?: "light" | "dot";
};

const StatusBadge = ({ label, color, description, prefix, size, variant = "light" }: Props) => {
  const content = prefix ? `${prefix}: ${label}` : label;

  return (
    <Popover width={280} position="bottom-start" withArrow shadow="md">
      <Popover.Target>
        <Badge
          component="button"
          type="button"
          color={color}
          size={size}
          variant={variant}
          title={description}
          rightSection={<IconInfoCircle size={12} />}
          aria-label={`${content}. ${description}`}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
          }}
          onKeyDown={(event) => {
            event.preventDefault();
            event.stopPropagation();
          }}
          style={{ cursor: "help" }}
        >
          {content}
        </Badge>
      </Popover.Target>
      <Popover.Dropdown
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
        }}
      >
        <Stack gap={4}>
          <Text size="xs" fw={700}>
            {content}
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
