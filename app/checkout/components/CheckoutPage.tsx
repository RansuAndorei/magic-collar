"use client";

import { insertError } from "@/app/actions";

import { useUserData } from "@/stores/useUserStore";
import {
  CHECKOUT_ID_STORAGE_KEY,
  CHECKOUT_SUMMARY_STORAGE_KEY,
  PAYMONGO_PAYMENT_DATA,
  SHOP_CART_STORAGE_KEY,
} from "@/utils/constants";
import {
  feeCalculator,
  formatCurrency,
  formatPhilippineMobileNumber,
  getProductSubtitle,
  getProductTitle,
  isAppError,
  parseStoredCart,
} from "@/utils/functions";
import { supabaseClient } from "@/utils/supabase/client";
import {
  CarShopType,
  CheckoutAddressType,
  OrderFulfillmentEnum,
  PaymentMethodType,
} from "@/utils/types";
import {
  Alert,
  Badge,
  Box,
  Button,
  Card,
  Container,
  Divider,
  Group,
  Radio,
  rem,
  Select,
  SimpleGrid,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
  IconAlertCircle,
  IconArrowLeft,
  IconBuildingStore,
  IconCreditCard,
  IconMapPin,
  IconPackage,
  IconTruckDelivery,
} from "@tabler/icons-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type CheckoutCartItem = {
  product: CarShopType;
  quantity: number;
};

type CourierType = "LBC" | "LALAMOVE";

const formatAddress = (address: CheckoutAddressType) =>
  [
    address.delivery_detail_address.address_street,
    address.delivery_detail_address.address_barangay,
    address.delivery_detail_address.address_city,
    address.delivery_detail_address.address_province,
    address.delivery_detail_address.address_region,
    address.delivery_detail_address.address_postal_code,
  ]
    .filter(Boolean)
    .join(", ");

const formatAddressSummary = (address: CheckoutAddressType) =>
  [
    address.delivery_detail_address.address_city,
    address.delivery_detail_address.address_province,
    address.delivery_detail_address.address_postal_code,
  ]
    .filter(Boolean)
    .join(", ");

type Props = {
  carList: CarShopType[];
  addressList: CheckoutAddressType[];
};

const CheckoutPage = ({ carList, addressList }: Props) => {
  const router = useRouter();
  const pathname = usePathname();
  const userData = useUserData();

  const [hasLoadedCart, setHasLoadedCart] = useState(false);
  const [cartItems, setCartItems] = useState<CheckoutCartItem[]>([]);
  const [fulfillmentType, setFulfillmentType] = useState<OrderFulfillmentEnum>("DELIVERY");
  const [courier, setCourier] = useState<CourierType>("LBC");
  const [selectedAddressId, setSelectedAddressId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>("qrph");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const savedCart = parseStoredCart(window.localStorage.getItem(SHOP_CART_STORAGE_KEY));

    setCartItems(
      savedCart.reduce<CheckoutCartItem[]>((items, storedItem) => {
        if (items.some((item) => item.product.car_id === storedItem.carId)) return items;

        const product = carList.find((car) => car.car_id === storedItem.carId);
        if (!product) return items;

        return [...items, { product, quantity: storedItem.quantity }];
      }, []),
    );

    const defaultAddress = addressList.find((address) => address.delivery_detail_is_default);
    setSelectedAddressId(
      defaultAddress?.delivery_detail_id ?? addressList[0]?.delivery_detail_id ?? "",
    );
    setHasLoadedCart(true);
  }, [addressList, carList]);

  const selectedAddress = addressList.find(
    (address) => address.delivery_detail_id === selectedAddressId,
  );

  const totals = useMemo(() => {
    return cartItems.reduce(
      (total, item) => ({
        quantity: total.quantity + item.quantity,
        price: total.price + item.product.car_magic_collar.magic_collar_price * item.quantity,
        downPayment:
          total.downPayment +
          item.product.car_magic_collar.magic_collar_down_payment_price * item.quantity,
        currency: item.product.car_magic_collar.magic_collar_price_currency,
      }),
      { quantity: 0, price: 0, downPayment: 0, currency: "PHP" },
    );
  }, [cartItems]);

  const handleSubmit = async () => {
    if (isLoading || !userData) return;

    setIsLoading(true);
    try {
      const res = await fetch("/api/payments/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentMethod,
          orderData: {
            fulfillmentType,
            selectedAddressId,
            items: cartItems.map((item) => ({ id: item.product.car_id, quantity: item.quantity })),
          },
          description: "DOWNPAYMENT",
          userId: userData.id,
          userEmail: userData.email,
        }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Request failed with status ${res.status}: ${errorText}`);
      }

      const data = await res.json();

      if (data.checkout_url) {
        window.sessionStorage.setItem(
          CHECKOUT_SUMMARY_STORAGE_KEY,
          JSON.stringify({
            itemCount: totals.quantity,
            downPayment: totals.downPayment,
            total: totals.price,
            fulfillmentType,
            courier: fulfillmentType === "DELIVERY" ? courier : null,
            paymentMethod,
            currency: totals.currency,
          }),
        );
        localStorage.setItem(CHECKOUT_ID_STORAGE_KEY, data.checkout_id);
        window.location.href = data.checkout_url;
      }
    } catch (e) {
      notifications.show({
        message: "Something went wrong. Please try again later.",
        color: "red",
      });

      if (isAppError(e)) {
        await insertError(supabaseClient, {
          errorTableInsert: {
            error_message: e.message,
            error_url: pathname,
            error_function: "handleSubmit",
            error_user_email: userData.email,
            error_user_id: userData.id,
          },
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!hasLoadedCart) {
    return (
      <Box py={{ base: rem(40), md: rem(64) }}>
        <Container size="lg">
          <Text c="dimmed">Loading checkout...</Text>
        </Container>
      </Box>
    );
  }

  return (
    <Box py={{ base: rem(32), md: rem(56) }}>
      <Container size="lg">
        <Stack gap="xl">
          <Group justify="space-between" align="flex-start">
            <Stack gap={4}>
              <Text size="sm" c="red.5" fw={700} tt="uppercase">
                Checkout
              </Text>
              <Title order={1} style={{ fontSize: rem(34), fontWeight: 800 }}>
                Review and place order
              </Title>
              <Text c="dimmed">
                Confirm your cart, fulfillment option, and down payment details.
              </Text>
            </Stack>
            <Button
              variant="subtle"
              color="gray"
              leftSection={<IconArrowLeft size={16} />}
              onClick={() => router.push("/shop")}
            >
              Back to Shop
            </Button>
          </Group>

          {cartItems.length === 0 ? (
            <Card withBorder p="xl">
              <Stack align="center" gap="md" py="xl">
                <ThemeIcon size={64} radius="xl" color="red" variant="light">
                  <IconPackage size={32} />
                </ThemeIcon>
                <Stack gap={4} align="center">
                  <Text fw={700} size="lg">
                    Your cart is empty
                  </Text>
                  <Text c="dimmed" ta="center">
                    Add a Magic Collar from the shop before checking out.
                  </Text>
                </Stack>
                <Button color="red" onClick={() => router.push("/shop")}>
                  Go to Shop
                </Button>
              </Stack>
            </Card>
          ) : (
            <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
              <Stack gap="lg">
                <Card withBorder p="lg">
                  <Stack gap="md">
                    <Group justify="space-between">
                      <Text fw={700}>Order Summary</Text>
                      <Badge color="red" variant="light">
                        {totals.quantity} item{totals.quantity === 1 ? "" : "s"}
                      </Badge>
                    </Group>
                    <Divider />
                    <Stack gap="md">
                      {cartItems.map(({ product, quantity }) => {
                        const {
                          car_id,
                          car_image_attachment,
                          car_magic_collar,
                          car_make,
                          car_model,
                          car_model_code,
                          car_model_year_start,
                          car_model_year_end,
                        } = product;
                        const isWithStock = Boolean(car_magic_collar.magic_collar_stock_quantity);

                        return (
                          <Group key={car_id} align="flex-start" gap="sm" wrap="nowrap">
                            <Box
                              w={64}
                              h={64}
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
                                  width={64}
                                  height={64}
                                  style={{ objectFit: "cover" }}
                                />
                              ) : null}
                            </Box>
                            <Stack gap={2} style={{ flex: 1 }}>
                              <Badge
                                color={isWithStock ? "green" : "yellow"}
                                variant="filled"
                                size="sm"
                              >
                                {isWithStock
                                  ? `In Stock: ${car_magic_collar.magic_collar_stock_quantity}`
                                  : "Pre-Order"}
                              </Badge>
                              <Text fw={700} size="sm" mt={4}>
                                {getProductTitle(car_make, car_model)}
                              </Text>
                              <Text size="xs" c="dimmed">
                                {getProductSubtitle(
                                  car_model_code,
                                  car_model_year_start,
                                  car_model_year_end,
                                )}{" "}
                                x {quantity}
                              </Text>
                              <Text size="xs" c="dimmed">
                                Down Payment:{" "}
                                {formatCurrency(
                                  car_magic_collar.magic_collar_down_payment_price * quantity,
                                  {
                                    currency: totals.currency,
                                    minimumFractionDigits: 0,
                                  },
                                )}
                              </Text>
                            </Stack>
                            <Text fw={700} size="sm">
                              {formatCurrency(car_magic_collar.magic_collar_price * quantity, {
                                currency: totals.currency,
                                minimumFractionDigits: 0,
                              })}
                            </Text>
                          </Group>
                        );
                      })}
                    </Stack>
                    <Divider />
                    <Group justify="space-between">
                      <Text c="dimmed">Total Price</Text>
                      <Text fw={700}>
                        {formatCurrency(totals.price, {
                          currency: totals.currency,
                          minimumFractionDigits: 0,
                        })}
                      </Text>
                    </Group>
                    <Group justify="space-between">
                      <Text fw={700}>Down Payment Due</Text>
                      <Text fw={800} size="lg" c="red.5">
                        {formatCurrency(totals.downPayment, {
                          currency: totals.currency,
                          minimumFractionDigits: 0,
                        })}
                      </Text>
                    </Group>
                  </Stack>
                </Card>
              </Stack>

              <Stack gap="lg">
                <Card withBorder p="lg">
                  <Stack gap="md">
                    <Group gap="xs">
                      <IconTruckDelivery size={18} color="var(--mantine-color-red-5)" />
                      <Text fw={700}>Fulfillment</Text>
                    </Group>
                    <Radio.Group
                      value={fulfillmentType}
                      onChange={(value) => setFulfillmentType(value as OrderFulfillmentEnum)}
                    >
                      <Stack gap="sm">
                        <Radio value="DELIVERY" label="Delivery" />
                        <Radio value="PICKUP" label="Pickup" />
                      </Stack>
                    </Radio.Group>

                    {fulfillmentType === "DELIVERY" ? (
                      <Stack gap="md">
                        <Divider />
                        <Select
                          label="Delivery Address"
                          placeholder={
                            addressList.length ? "Select delivery address" : "No saved addresses"
                          }
                          searchable
                          disabled={addressList.length === 0}
                          value={selectedAddressId || null}
                          onChange={(value) => setSelectedAddressId(value ?? "")}
                          data={addressList.map((address) => ({
                            value: address.delivery_detail_id,
                            label: `${address.delivery_detail_full_name} • ${address.delivery_detail_address.address_postal_code}`,
                          }))}
                          renderOption={({ option }) => {
                            const address = addressList.find(
                              (item) => item.delivery_detail_id === option.value,
                            );
                            if (!address) return option.label;

                            return (
                              <Stack gap={0}>
                                <Group gap={6}>
                                  <Text fw={500} size="sm">
                                    {address.delivery_detail_full_name}
                                  </Text>

                                  {address.delivery_detail_is_default && (
                                    <Badge size="xs">Default</Badge>
                                  )}
                                </Group>

                                <Text size="xs" c="dimmed">
                                  {formatAddressSummary(address)}
                                </Text>
                              </Stack>
                            );
                          }}
                        />
                        {selectedAddress ? (
                          <Alert color="blue" variant="light" icon={<IconMapPin size={16} />}>
                            <Group justify="space-between" mb={4}>
                              <Text fw={700}>{selectedAddress.delivery_detail_full_name}</Text>

                              {selectedAddress.delivery_detail_is_default && (
                                <Badge size="sm">Default</Badge>
                              )}
                            </Group>

                            <Text size="sm" c="dimmed">
                              {formatPhilippineMobileNumber(
                                selectedAddress.delivery_detail_phone_number,
                              )}
                            </Text>

                            <Text size="sm" mt={4}>
                              {formatAddress(selectedAddress)}
                            </Text>
                          </Alert>
                        ) : (
                          <Alert
                            color="yellow"
                            variant="light"
                            icon={<IconAlertCircle size={16} />}
                          >
                            <Text fw={500}>Delivery address required</Text>

                            <Text size="sm">
                              Please select a saved address or add a new one from your{" "}
                              <Link href="/user/profile">profile settings</Link>. If you'd rather
                              collect your order in person, choose the pickup option.
                            </Text>
                          </Alert>
                        )}
                        <Radio.Group
                          label="Courier"
                          value={courier}
                          onChange={(value) => setCourier(value as CourierType)}
                        >
                          <Group mt="xs">
                            <Radio value="LBC" label="LBC" />
                            <Radio value="Lalamove" label="Lalamove" />
                          </Group>
                        </Radio.Group>
                      </Stack>
                    ) : (
                      <Alert color="red" variant="light" icon={<IconBuildingStore size={16} />}>
                        Pick up your order at the Magic Collar store. We will confirm pickup details
                        after down payment verification.
                      </Alert>
                    )}
                  </Stack>
                </Card>

                <Card withBorder p="lg">
                  <Stack gap="md">
                    <Group gap="xs">
                      <IconCreditCard size={18} color="var(--mantine-color-red-5)" />
                      <Text fw={700}>Down Payment</Text>
                    </Group>

                    <Radio.Group
                      label="Select Payment Method"
                      value={paymentMethod}
                      onChange={(value) =>
                        setPaymentMethod(value as keyof typeof PAYMONGO_PAYMENT_DATA)
                      }
                    >
                      <Stack gap="xs" mt="xs">
                        {Object.entries(PAYMONGO_PAYMENT_DATA).map(([key, value]) => {
                          return <Radio key={key} value={key} label={value.label} />;
                        })}
                      </Stack>
                    </Radio.Group>

                    <Divider />

                    {(() => {
                      const { transferFee, totalAmount } = feeCalculator(
                        totals.downPayment,
                        paymentMethod,
                      );

                      return (
                        <Stack gap="md">
                          <Stack gap={4}>
                            <Group justify="space-between">
                              <Text size="sm">Down Payment</Text>
                              <Text fw={500}>
                                {formatCurrency(totals.downPayment, {
                                  currency: totals.currency,
                                })}
                              </Text>
                            </Group>
                            <Group justify="space-between">
                              <Text size="sm">Processing Fee</Text>
                              <Text fw={500}>
                                {formatCurrency(transferFee, {
                                  currency: totals.currency,
                                })}
                              </Text>
                            </Group>
                          </Stack>
                          <Divider />
                          <Group justify="space-between">
                            <Text fw={700}>Total to Pay</Text>
                            <Text fw={700} c="red">
                              {formatCurrency(totalAmount, {
                                currency: totals.currency,
                              })}
                            </Text>
                          </Group>
                        </Stack>
                      );
                    })()}

                    <Button
                      color="red"
                      size="md"
                      loading={isLoading}
                      onClick={handleSubmit}
                      mt="xs"
                    >
                      Proceed to Payment
                    </Button>
                  </Stack>
                </Card>
              </Stack>
            </SimpleGrid>
          )}
        </Stack>
      </Container>
    </Box>
  );
};

export default CheckoutPage;
