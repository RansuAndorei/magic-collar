import { Card, Loader, Stack, Text } from "@mantine/core";

const InitialLoading = () => {
  return (
    <Card withBorder p="xl">
      <Stack align="center" gap="md" py="xl">
        <Loader color="red" />
        <Text c="dimmed">Loading your orders...</Text>
      </Stack>
    </Card>
  );
};

export default InitialLoading;
