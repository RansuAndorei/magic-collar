import { Card, Divider, Group, Skeleton, Stack } from "@mantine/core";

const ProductSkeleton = () => {
  return (
    <Card withBorder radius="md" padding={0}>
      <Skeleton h={180} radius={0} />
      <Stack gap="sm" p="md">
        <Skeleton h={14} w="70%" />
        <Skeleton h={12} w="50%" />
        <Skeleton h={20} w="40%" />
        <Divider />
        <Group justify="space-between">
          <Skeleton h={24} w={80} />
          <Skeleton h={28} w={60} radius="md" />
        </Group>
      </Stack>
    </Card>
  );
};

export default ProductSkeleton;
