import { Card, Stack, Text, ThemeIcon } from "@mantine/core";
import { IconShoppingBag } from "@tabler/icons-react";

const NoOrders = () => {
  return (
    <Card withBorder p="xl">
      <Stack align="center" gap="md" py="xl">
        <ThemeIcon size={64} radius="xl" color="red" variant="light">
          <IconShoppingBag size={32} />
        </ThemeIcon>
        <Stack gap={4} align="center">
          <Text fw={700} size="lg">
            No orders found
          </Text>
          <Text c="dimmed" ta="center">
            Try changing your filters or search term.
          </Text>
        </Stack>
      </Stack>
    </Card>
  );
};

export default NoOrders;
