import { Button, rem, Stack, Text, ThemeIcon } from "@mantine/core";
import { IconCar } from "@tabler/icons-react";

type Props = { onReset: () => void; hasFilters: boolean };

const EmptyState = ({ onReset, hasFilters }: Props) => {
  return (
    <Stack align="center" gap="md" py={rem(60)} style={{ textAlign: "center" }}>
      <ThemeIcon size={64} radius="xl" color="red" variant="light">
        <IconCar size={32} />
      </ThemeIcon>
      <Stack gap={4}>
        <Text fw={700} size="lg">
          No collars found
        </Text>
        <Text c="dimmed" size="sm" maw={360}>
          {hasFilters
            ? "No Magic Collar matches your current search or filters. Try adjusting or clearing them."
            : "No products are available at the moment. Check back soon."}
        </Text>
      </Stack>
      {hasFilters && (
        <Button variant="light" color="red" onClick={onReset}>
          Clear Filters
        </Button>
      )}
    </Stack>
  );
};

export default EmptyState;
