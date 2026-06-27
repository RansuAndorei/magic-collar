import {
  formatCurrency,
  getProductSubtitle,
  getProductTitle,
  getSetContents,
  getYearRange,
} from "@/utils/functions";
import { CarShopType } from "@/utils/types";
import {
  Badge,
  Box,
  Button,
  Divider,
  Group,
  Modal,
  rem,
  SimpleGrid,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { IconEngine, IconShoppingCart } from "@tabler/icons-react";
import Image from "next/image";

type Props = {
  product: CarShopType | null;
  opened: boolean;
  onClose: () => void;
  onAddToCart: (product: CarShopType) => void;
};

const ProductDetailModal = ({ product, opened, onClose, onAddToCart }: Props) => {
  if (!product) return null;

  const {
    car_image_attachment,
    car_magic_collar,
    car_make,
    car_model,
    car_model_code,
    car_model_year_start,
    car_model_year_end,
  } = product;
  const isWithStock = car_magic_collar.magic_collar_stock_quantity > 0;

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={<Text fw={700}>{getProductTitle(car_make, car_model)}</Text>}
      size="xl"
      centered
    >
      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
        <Stack gap="sm">
          <Box
            h={{ base: 260, md: 420 }}
            style={{
              background: "var(--mantine-color-default)",
              border: "1px solid var(--mantine-color-default-border)",
              borderRadius: rem(8),
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
            }}
          >
            {car_image_attachment.attachment_path ? (
              <Box style={{ position: "relative", width: "100%", height: "100%" }}>
                <Image
                  src={car_image_attachment.attachment_path}
                  alt={getProductTitle(car_make, car_model)}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  style={{ objectFit: "contain" }}
                  loading="eager"
                  priority
                />
              </Box>
            ) : (
              <IconEngine size={96} stroke={0.6} color="var(--mantine-color-dimmed)" />
            )}
          </Box>
        </Stack>

        <Stack gap="md">
          <Badge color={isWithStock ? "green" : "yellow"} variant="filled" size="sm" ml="auto">
            {isWithStock
              ? `In Stock: ${car_magic_collar.magic_collar_stock_quantity}`
              : "Pre-Order"}
          </Badge>
          <Stack gap={4}>
            <Title order={3}>
              {car_make} {car_model}
            </Title>
            <Text c="dimmed">
              {getProductSubtitle(car_model_code, car_model_year_start, car_model_year_end)}
            </Text>
          </Stack>

          <Divider />

          <Group gap="xs">
            <Badge color="red" variant="light">
              Set Contents
            </Badge>
            <Text size="sm">
              {getSetContents(
                car_magic_collar.magic_collar_front_quantity,
                car_magic_collar.magic_collar_rear_quantity,
                car_magic_collar.magic_collar_all_quantity,
              )}{" "}
              per set
            </Text>
          </Group>

          <SimpleGrid cols={2} spacing="sm">
            <Stack gap={2}>
              <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                Price
              </Text>
              <Text fw={800} size="xl" c="red.5">
                {formatCurrency(car_magic_collar.magic_collar_price, {
                  currency: car_magic_collar.magic_collar_price_currency,
                  minimumFractionDigits: 0,
                })}
              </Text>
            </Stack>
            <Stack gap={2}>
              <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                Down Payment
              </Text>
              <Text fw={700} size="lg">
                {formatCurrency(car_magic_collar.magic_collar_down_payment_price, {
                  currency: car_magic_collar.magic_collar_price_currency,
                  minimumFractionDigits: 0,
                })}
              </Text>
            </Stack>
          </SimpleGrid>

          <Stack gap={6}>
            <Text size="sm" fw={700}>
              Car Details
            </Text>
            <Text size="sm" c="dimmed">
              Make: {car_make}
            </Text>
            <Text size="sm" c="dimmed">
              Model: {car_model}
            </Text>
            <Text size="sm" c="dimmed">
              Model Code: {car_model_code || "Any"}
            </Text>
            <Text size="sm" c="dimmed">
              Model Year: {getYearRange(car_model_year_start, car_model_year_end)}
            </Text>
          </Stack>

          <Button
            color="red"
            leftSection={<IconShoppingCart size={16} />}
            onClick={() => onAddToCart(product)}
            mt="xs"
          >
            Add to Cart
          </Button>
        </Stack>
      </SimpleGrid>
    </Modal>
  );
};

export default ProductDetailModal;
