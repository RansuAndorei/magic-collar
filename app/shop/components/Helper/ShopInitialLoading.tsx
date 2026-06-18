import { SHOP_PAGE_SIZE } from "@/utils/constants";
import {
  Box,
  Container,
  Group,
  rem,
  SimpleGrid,
  Skeleton,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import ProductSkeleton from "../Product/ProductSkeleton";

const ShopInitialLoading = () => {
  return (
    <Box py={{ base: rem(40), md: rem(60) }}>
      <Container size="xl">
        <Stack gap="xl">
          <Stack gap={4}>
            <Text size="sm" c="red.5" fw={700} tt="uppercase" style={{ letterSpacing: "0.1em" }}>
              Magic Collar Shop
            </Text>
            <Title order={1} style={{ fontSize: rem(34), fontWeight: 800 }}>
              Find Your Collar
            </Title>
            <Text c="dimmed" size="md">
              Search by make, model, or model code to find the exact Magic Collar for your vehicle.
            </Text>
          </Stack>

          <Stack gap="sm" visibleFrom="md">
            <Group gap="sm" align="flex-end">
              <Skeleton h={36} style={{ flex: 1 }} />
              <Skeleton h={36} w={200} />
            </Group>
            <Group gap="sm" align="flex-end">
              <Skeleton h={36} style={{ flex: 1.5 }} />
              <Skeleton h={36} style={{ flex: 1.5 }} />
              <Skeleton h={36} style={{ flex: 1 }} />
              <Skeleton h={36} style={{ flex: 1 }} />
            </Group>
          </Stack>

          <Stack gap="sm" hiddenFrom="md">
            <Group gap="sm">
              <Skeleton h={36} style={{ flex: 1 }} />
              <Skeleton h={36} w={104} />
            </Group>
          </Stack>

          <Skeleton h={18} w={220} />
          <SimpleGrid cols={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing="md">
            {Array.from({ length: SHOP_PAGE_SIZE }).map((_, index) => (
              <ProductSkeleton key={index} />
            ))}
          </SimpleGrid>
        </Stack>
      </Container>
    </Box>
  );
};

export default ShopInitialLoading;
