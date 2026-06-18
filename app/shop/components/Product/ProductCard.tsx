import { formatCurrency, getProductSubtitle, getProductTitle } from "@/utils/functions";
import { CarShopType } from "@/utils/types";
import { Badge, Box, Card, Divider, Group, Stack, Text } from "@mantine/core";
import { IconEngine } from "@tabler/icons-react";
import Image from "next/image";
import { memo } from "react";
import SetContentsLabel from "../Helper/SetContentsLabel";

type Props = {
  product: CarShopType;
  onView: (product: CarShopType) => void;
};

const ProductCard = ({ product, onView }: Props) => {
  const {
    car_magic_collar,
    car_image_attachment,
    car_make,
    car_model,
    car_model_code,
    car_model_year_start,
    car_model_year_end,
  } = product;
  const isWithStock = product.car_magic_collar.magic_collar_stock_quantity > 0;

  return (
    <Card
      withBorder
      radius="md"
      padding={0}
      onClick={() => onView(product)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onView(product);
        }
      }}
      role="button"
      tabIndex={0}
      style={{
        cursor: "pointer",
        transition: "transform 0.2s, box-shadow 0.2s, border-color 0.2s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.12)";
        e.currentTarget.style.borderColor = "var(--mantine-color-red-6)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "";
        e.currentTarget.style.boxShadow = "";
        e.currentTarget.style.borderColor = "";
      }}
    >
      <Box style={{ position: "relative" }}>
        <Box
          h={180}
          style={{
            background: "var(--mantine-color-default)",
            borderBottom: "1px solid var(--mantine-color-default-border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
          }}
        >
          {car_image_attachment.attachment_path ? (
            <Box style={{ position: "relative", width: "100%", height: "180px" }}>
              <Image
                src={car_image_attachment.attachment_path}
                alt={getProductTitle(car_make, car_model)}
                fill
                sizes="(max-width: 768px) 100vw, 320px"
                style={{ objectFit: "cover" }}
                loading="eager"
                priority
              />
            </Box>
          ) : (
            <IconEngine size={72} stroke={0.6} color="var(--mantine-color-dimmed)" />
          )}
        </Box>
        <Badge
          color="dark"
          variant="filled"
          size="sm"
          style={{ position: "absolute", top: 10, left: 10 }}
        >
          {car_make}
        </Badge>
        <Badge
          color={isWithStock ? "green" : "yellow"}
          variant="filled"
          size="sm"
          style={{ position: "absolute", top: 10, right: 10 }}
        >
          {isWithStock ? `In Stock: ${car_magic_collar.magic_collar_stock_quantity}` : "Pre-Order"}
        </Badge>
      </Box>

      <Stack gap="xs" p="md">
        <Stack gap={2}>
          <Text fw={700} size="sm" lineClamp={1}>
            {car_make} {car_model}
          </Text>
          <Text size="xs" c="dimmed">
            {getProductSubtitle(car_model_code, car_model_year_start, car_model_year_end)}
          </Text>
        </Stack>
        <SetContentsLabel product={product} />
        <Divider />
        <Group justify="space-between" align="flex-end">
          <Stack gap={2}>
            <Text fw={800} size="lg" c="red.5">
              {formatCurrency(car_magic_collar.magic_collar_price, {
                currency: car_magic_collar.magic_collar_price_currency,
                minimumFractionDigits: 0,
              })}
            </Text>
            <Text size="xs" c="dimmed">
              DP:{" "}
              {formatCurrency(car_magic_collar.magic_collar_down_payment_price, {
                currency: car_magic_collar.magic_collar_price_currency,
                minimumFractionDigits: 0,
              })}
            </Text>
          </Stack>
        </Group>
      </Stack>
    </Card>
  );
};

export default memo(ProductCard);
