import { FEATURED_PRODUCTS } from "@/utils/constants";
import {
  Badge,
  Box,
  Button,
  Card,
  Center,
  Container,
  Flex,
  Group,
  rem,
  SimpleGrid,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { IconArrowRight, IconEngine, IconStar } from "@tabler/icons-react";

const FeaturedProducts = () => {
  return (
    <Box
      className="section-alt"
      id="products"
      style={{ scrollMarginTop: 60 }}
      py={{ base: rem(60), md: rem(80) }}
    >
      <Container size="xl">
        <Stack gap="xl">
          <Flex justify="space-between" align="flex-end">
            <Stack gap={4}>
              <Text size="sm" c="red.5" fw={700} tt="uppercase" style={{ letterSpacing: "0.1em" }}>
                Popular Picks
              </Text>
              <Title order={2} style={{ fontSize: rem(34), fontWeight: 700 }}>
                Featured Magic Collars
              </Title>
            </Stack>
            <Button
              variant="subtle"
              color="gray"
              rightSection={<IconArrowRight size={16} />}
              visibleFrom="sm"
            >
              View All
            </Button>
          </Flex>

          <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="md">
            {FEATURED_PRODUCTS.map((product) => (
              <Card
                key={product.sku}
                radius="md"
                padding="lg"
                withBorder
                style={{ transition: "transform 0.2s, box-shadow 0.2s" }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "";
                }}
              >
                <Card.Section>
                  <Center
                    h={160}
                    style={{
                      background: "var(--mantine-color-default)",
                      borderBottom: "1px solid var(--mantine-color-default-border)",
                      position: "relative",
                    }}
                  >
                    <IconEngine size={72} stroke={0.7} color="var(--mantine-color-dimmed)" />
                    <Badge
                      color={product.badgeColor}
                      variant="filled"
                      size="sm"
                      style={{ position: "absolute", top: 10, left: 10 }}
                    >
                      {product.badge}
                    </Badge>
                  </Center>
                </Card.Section>

                <Stack gap="xs" mt="md">
                  <Text size="xs" c="dimmed">
                    {product.sku}
                  </Text>
                  <Text fw={600} size="sm" lineClamp={1}>
                    {product.name}
                  </Text>
                  <Text size="xs" c="dimmed" lineClamp={1}>
                    {product.model}
                  </Text>

                  <Group gap={4} mt={2}>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <IconStar
                        key={i}
                        size={12}
                        fill={
                          i < Math.floor(product.rating) ? "var(--mantine-color-yellow-5)" : "none"
                        }
                        color="var(--mantine-color-yellow-5)"
                      />
                    ))}
                    <Text size="xs" c="dimmed">
                      ({product.reviews})
                    </Text>
                  </Group>

                  <Group justify="space-between" align="center" mt="xs">
                    <Stack gap={0}>
                      <Text fw={700} size="lg">
                        {product.price}
                      </Text>
                      {product.oldPrice && (
                        <Text size="xs" c="dimmed" td="line-through">
                          {product.oldPrice}
                        </Text>
                      )}
                    </Stack>
                    <Button size="xs" color="red" radius="md">
                      Add to Cart
                    </Button>
                  </Group>
                </Stack>
              </Card>
            ))}
          </SimpleGrid>
        </Stack>
      </Container>
    </Box>
  );
};

export default FeaturedProducts;
