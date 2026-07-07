import SetContentsLabel from "@/app/shop/components/Helper/SetContentsLabel";
import { formatCurrency, getProductSubtitle } from "@/utils/functions";
import { CarShopType } from "@/utils/types";
import {
  Box,
  Button,
  Card,
  Center,
  Container,
  Divider,
  Flex,
  Group,
  rem,
  SimpleGrid,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { IconArrowRight } from "@tabler/icons-react";
import Image from "next/image";

type Props = {
  topItems: CarShopType[];
};

const FeaturedProducts = ({ topItems }: Props) => {
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
            {topItems.map((product) => (
              <Card
                key={product.car_id}
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
                    <Image
                      src={product.car_image_attachment.attachment_path}
                      alt={product.car_image_attachment.attachment_name}
                      fill
                      sizes="160px"
                      style={{
                        objectFit: "cover",
                      }}
                      loading="eager"
                    />
                  </Center>
                </Card.Section>

                <Stack gap="xs" mt="md">
                  <Stack gap={2}>
                    <Text fw={700} size="sm" lineClamp={1}>
                      {product.car_make} {product.car_model}
                    </Text>
                    <Text size="xs" c="dimmed">
                      {getProductSubtitle(
                        product.car_model_code,
                        product.car_model_year_start,
                        product.car_model_year_end,
                      )}
                    </Text>
                  </Stack>
                  <SetContentsLabel product={product} />
                  <Divider />
                  <Group justify="space-between" align="flex-end">
                    <Stack gap={2}>
                      <Text fw={800} size="lg" c="red.5">
                        {formatCurrency(product.car_magic_collar.magic_collar_price, {
                          currency: product.car_magic_collar.magic_collar_price_currency,
                          minimumFractionDigits: 0,
                        })}
                      </Text>
                      <Text size="xs" c="dimmed">
                        DP:{" "}
                        {formatCurrency(product.car_magic_collar.magic_collar_down_payment_price, {
                          currency: product.car_magic_collar.magic_collar_price_currency,
                          minimumFractionDigits: 0,
                        })}
                      </Text>
                    </Stack>
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
