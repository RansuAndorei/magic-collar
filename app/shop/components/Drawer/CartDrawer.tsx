import { MAX_QUANTITY } from "@/utils/constants";
import {
  formatCurrency,
  getProductSubtitle,
  getProductTitle,
  getSetContents,
} from "@/utils/functions";
import { CartItemType } from "@/utils/types";
import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Card,
  Drawer,
  Flex,
  Group,
  NumberInput,
  rem,
  ScrollArea,
  Stack,
  Text,
  ThemeIcon,
  useComputedColorScheme,
  useMantineTheme,
} from "@mantine/core";
import {
  IconEngine,
  IconMinus,
  IconPlus,
  IconShoppingCart,
  IconShoppingCartX,
  IconTrash,
} from "@tabler/icons-react";
import Image from "next/image";

type Props = {
  opened: boolean;
  items: CartItemType[];
  onClose: () => void;
  onQuantityChange: (carId: string, quantity: number) => void;
  onRemove: (carId: string) => void;
  onClear: () => void;
  onCheckout: () => void;
};

const CartDrawer = ({
  opened,
  items,
  onClose,
  onQuantityChange,
  onRemove,
  onClear,
  onCheckout,
}: Props) => {
  const { colors } = useMantineTheme();
  const isDark = useComputedColorScheme() === "dark";
  const totalItems = items.reduce((total, item) => total + item.quantity, 0);
  const totalPrice = items.reduce(
    (total, item) => total + item.product.car_magic_collar.magic_collar_price * item.quantity,
    0,
  );
  const totalDownPayment = items.reduce(
    (total, item) =>
      total + item.product.car_magic_collar.magic_collar_down_payment_price * item.quantity,
    0,
  );

  return (
    <Drawer
      opened={opened}
      onClose={onClose}
      title={
        <Group gap="xs">
          <IconShoppingCart size={18} />
          <Text fw={700}>Cart</Text>
          {totalItems > 0 && (
            <Badge color="red" size="sm">
              {totalItems}
            </Badge>
          )}
        </Group>
      }
      position="right"
      size="md"
      styles={{
        content: {
          background: isDark ? colors.dark[8] : colors.gray[0],
        },
        body: {
          display: "flex",
          flexDirection: "column",
          height: "calc(100% - 64px)",
          padding: 0,
        },
        header: {
          height: 64,
          borderBottom: `2px solid ${colors.red[isDark ? 9 : 6]}`,
        },
      }}
      removeScrollProps={{
        allowPinchZoom: true,
      }}
    >
      {items.length === 0 ? (
        <Stack align="center" justify="center" gap="sm" py={rem(64)}>
          <ThemeIcon size={56} radius="xl" color="red" variant="light">
            <IconShoppingCart size={28} />
          </ThemeIcon>
          <Text fw={700}>Your cart is empty</Text>
          <Text c="dimmed" size="sm" ta="center">
            View a Magic Collar and add it to your cart.
          </Text>
        </Stack>
      ) : (
        <>
          <ScrollArea style={{ flex: 1 }} type="auto" px="md">
            <Stack gap="sm" py="md">
              {items.map(({ product, quantity }) => {
                const {
                  car_id,
                  car_image_attachment,
                  car_make,
                  car_model,
                  car_model_code,
                  car_model_year_start,
                  car_model_year_end,
                  car_magic_collar,
                } = product;

                return (
                  <Card key={car_id} withBorder padding="sm">
                    <Group align="flex-start" gap="sm" wrap="nowrap">
                      <Box
                        w={72}
                        h={72}
                        style={{
                          borderRadius: rem(6),
                          overflow: "hidden",
                          background: "var(--mantine-color-default)",
                          flexShrink: 0,
                        }}
                      >
                        {car_image_attachment.attachment_path ? (
                          <Image
                            src={car_image_attachment.attachment_path}
                            alt={getProductTitle(car_make, car_model)}
                            width={72}
                            height={72}
                            style={{ objectFit: "cover" }}
                          />
                        ) : (
                          <Flex h="100%" align="center" justify="center">
                            <IconEngine size={28} stroke={0.8} />
                          </Flex>
                        )}
                      </Box>
                      <Stack gap={6} style={{ flex: 1, minWidth: 0 }}>
                        <Group justify="space-between" align="flex-start" gap="xs" wrap="nowrap">
                          <Stack gap={2} style={{ minWidth: 0 }}>
                            <Text fw={700} size="sm" lineClamp={1}>
                              {car_make} {car_model}
                            </Text>
                            <Text size="xs" c="dimmed" lineClamp={1}>
                              {getProductSubtitle(
                                car_model_code,
                                car_model_year_start,
                                car_model_year_end,
                              )}
                            </Text>
                            <Text size="xs" c="dimmed" lineClamp={1}>
                              {getSetContents(
                                car_magic_collar.magic_collar_front_quantity,
                                car_magic_collar.magic_collar_rear_quantity,
                                car_magic_collar.magic_collar_all_quantity,
                              )}{" "}
                              per set
                            </Text>
                          </Stack>
                          <ActionIcon
                            variant="subtle"
                            color="red"
                            onClick={() => onRemove(car_id)}
                            aria-label="Remove from cart"
                          >
                            <IconTrash size={16} />
                          </ActionIcon>
                        </Group>
                        <Group justify="space-between" align="center">
                          <Group gap={4}>
                            <ActionIcon
                              variant="light"
                              color="gray"
                              size="sm"
                              onClick={() => onQuantityChange(car_id, quantity - 1)}
                              aria-label="Decrease quantity"
                            >
                              <IconMinus size={14} />
                            </ActionIcon>
                            <NumberInput
                              value={quantity}
                              onChange={(value) => onQuantityChange(car_id, Number(value) || 1)}
                              min={1}
                              max={MAX_QUANTITY}
                              maxLength={`${MAX_QUANTITY}`.length}
                              w={64}
                              hideControls
                            />
                            <ActionIcon
                              variant="light"
                              color="gray"
                              size="sm"
                              onClick={() => onQuantityChange(car_id, quantity + 1)}
                              aria-label="Increase quantity"
                            >
                              <IconPlus size={14} />
                            </ActionIcon>
                          </Group>
                          <Text fw={700} size="sm">
                            {formatCurrency(car_magic_collar.magic_collar_price * quantity, {
                              currency: car_magic_collar.magic_collar_price_currency,
                              minimumFractionDigits: 0,
                            })}
                          </Text>
                        </Group>
                      </Stack>
                    </Group>
                  </Card>
                );
              })}
            </Stack>
          </ScrollArea>

          <Box
            style={{
              borderTop: `2px solid ${colors.red[isDark ? 9 : 6]}`,
              padding: 16,
              backgroundColor: isDark ? colors.dark[7] : "white",
            }}
          >
            <Stack gap="xs">
              <Group justify="space-between">
                <Text c="dimmed">Down Payment Total</Text>
                <Text fw={700}>
                  {formatCurrency(totalDownPayment, {
                    currency: items[0].product.car_magic_collar.magic_collar_price_currency,
                    minimumFractionDigits: 0,
                  })}
                </Text>
              </Group>
              <Group justify="space-between">
                <Text fw={700}>Total</Text>
                <Text fw={800} size="lg" c="red.5">
                  {formatCurrency(totalPrice, {
                    currency: items[0].product.car_magic_collar.magic_collar_price_currency,
                    minimumFractionDigits: 0,
                  })}
                </Text>
              </Group>
              <Button
                color="red"
                fullWidth
                onClick={onCheckout}
                leftSection={<IconShoppingCart size={16} />}
              >
                Proceed to Checkout
              </Button>
              <Button
                variant="light"
                color="gray"
                fullWidth
                onClick={onClear}
                leftSection={<IconShoppingCartX size={16} />}
              >
                Clear Cart
              </Button>
            </Stack>
          </Box>
        </>
      )}
    </Drawer>
  );
};

export default CartDrawer;
