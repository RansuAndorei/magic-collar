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
  formatAddress,
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
  PickupAddressType,
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
  IconCreditCard,
  IconExternalLink,
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
  checkoutAddressList: CheckoutAddressType[];
  pickupAddressList: PickupAddressType[];
  courierList: string[];
};

const CheckoutPage = ({ carList, checkoutAddressList, pickupAddressList, courierList }: Props) => {
  const router = useRouter();
  const pathname = usePathname();
  const userData = useUserData();

  const [hasLoadedCart, setHasLoadedCart] = useState(false);
  const [cartItems, setCartItems] = useState<CheckoutCartItem[]>([]);
  const [fulfillmentType, setFulfillmentType] = useState<OrderFulfillmentEnum>("DELIVERY");
  const [courier, setCourier] = useState(courierList[0]);
  const [selectedCheckoutAddressId, setSelectedCheckoutAddressId] = useState("");
  const [selectedPickupAddressId, setSelectedPickupAddressId] = useState("");

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>("qrph");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const savedCart = parseStoredCart(window.localStorage.getItem(SHOP_CART_STORAGE_KEY));

    // eslint-disable-next-line
    setCartItems(
      savedCart.reduce<CheckoutCartItem[]>((items, storedItem) => {
        if (items.some((item) => item.product.car_id === storedItem.carId)) return items;

        const product = carList.find((car) => car.car_id === storedItem.carId);
        if (!product) return items;

        return [...items, { product, quantity: storedItem.quantity }];
      }, []),
    );

    const defaultAddress = checkoutAddressList.find(
      (address) => address.delivery_detail_is_default,
    );
    setSelectedCheckoutAddressId(
      defaultAddress?.delivery_detail_id ?? checkoutAddressList[0]?.delivery_detail_id ?? "",
    );
    setHasLoadedCart(true);
  }, [checkoutAddressList, carList]);

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

  const selectedDeliveryAddress = checkoutAddressList.find(
    (address) => address.delivery_detail_id === selectedCheckoutAddressId,
  );
  const selectedPickupAddress = pickupAddressList.find(
    (address) => address.pickup_address_id === selectedPickupAddressId,
  );

  const handleSubmit = async () => {
    if (isLoading || !userData) return;

    if (fulfillmentType === "DELIVERY") {
      if (!selectedDeliveryAddress) {
        notifications.show({
          message: "Please select a delivery address.",
          color: "orange",
        });
        return;
      }
    }
    if (fulfillmentType === "PICKUP") {
      if (!selectedPickupAddress) {
        notifications.show({
          message: "Please select a pickup address.",
          color: "orange",
        });
        return;
      }
      if (!selectedPickupAddress.pickup_address_is_available) {
        notifications.show({
          message: "Please select an available pickup address.",
          color: "orange",
        });
        return;
      }
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/payments/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentMethod,
          orderData: {
            fulfillmentType,
            selectedAddressId:
              fulfillmentType === "DELIVERY" ? selectedCheckoutAddressId : selectedPickupAddressId,
            courier: fulfillmentType === "DELIVERY" ? courier : null,
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
                            checkoutAddressList.length
                              ? "Select delivery address"
                              : "No saved addresses"
                          }
                          searchable
                          disabled={checkoutAddressList.length === 0}
                          value={selectedCheckoutAddressId || null}
                          onChange={(value) => setSelectedCheckoutAddressId(value ?? "")}
                          data={checkoutAddressList.map((address) => ({
                            value: address.delivery_detail_id,
                            label: `${address.delivery_detail_full_name} • ${address.delivery_detail_address.address_postal_code}`,
                          }))}
                          renderOption={({ option }) => {
                            const address = checkoutAddressList.find(
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
                        {selectedDeliveryAddress ? (
                          <Alert color="blue" variant="light" icon={<IconMapPin size={16} />}>
                            <Group justify="space-between" mb={4}>
                              <Text fw={700}>
                                {selectedDeliveryAddress.delivery_detail_full_name}
                              </Text>
                              {selectedDeliveryAddress.delivery_detail_is_default && (
                                <Badge size="sm">Default</Badge>
                              )}
                            </Group>
                            <Text size="sm" c="dimmed">
                              {formatPhilippineMobileNumber(
                                selectedDeliveryAddress.delivery_detail_phone_number,
                              )}
                            </Text>
                            <Text size="sm" mt={4}>
                              {formatAddress(selectedDeliveryAddress.delivery_detail_address)}
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
                              <Link href="/user/profile">profile settings</Link>. If you&apos;d
                              rather collect your order in person, choose the pickup option.
                            </Text>
                          </Alert>
                        )}
                        <Radio.Group
                          label="Courier"
                          value={courier}
                          onChange={(value) => setCourier(value)}
                        >
                          <Group mt="xs">
                            {courierList.map((c) => (
                              <Radio key={c} value={c} label={c} />
                            ))}
                          </Group>
                        </Radio.Group>
                      </Stack>
                    ) : (
                      <Stack gap="md">
                        <Divider />
                        <Select
                          label="Pickup Address"
                          placeholder="Select pickup address"
                          searchable
                          disabled={pickupAddressList.length === 0}
                          value={selectedPickupAddressId || null}
                          onChange={(value) => setSelectedPickupAddressId(value ?? "")}
                          data={pickupAddressList.map((address) => ({
                            value: address.pickup_address_id,
                            label: `${address.pickup_address.address_street}, ${address.pickup_address.address_barangay}, ${address.pickup_address.address_city}`,
                          }))}
                          renderOption={({ option }) => {
                            const address = pickupAddressList.find(
                              (item) => item.pickup_address_id === option.value,
                            );
                            if (!address) return option.label;
                            const pickupAddress = address.pickup_address;
                            const isUnavailable = !address.pickup_address_is_available;

                            return (
                              <Stack gap={2} w="100%">
                                <Group justify="space-between" wrap="nowrap">
                                  <Text fw={500} size="sm">
                                    {pickupAddress.address_street}, {pickupAddress.address_barangay}
                                  </Text>
                                  {isUnavailable && (
                                    <Badge
                                      color="red"
                                      variant="light"
                                      size="xs"
                                      style={{ flexShrink: 0 }}
                                    >
                                      Unavailable
                                    </Badge>
                                  )}
                                </Group>
                                <Text size="xs" c="dimmed">
                                  {pickupAddress.address_city}, {pickupAddress.address_province},{" "}
                                  {pickupAddress.address_postal_code}
                                </Text>
                              </Stack>
                            );
                          }}
                        />
                        {selectedPickupAddress ? (
                          <Alert color="blue" variant="light" icon={<IconMapPin size={16} />}>
                            <Text fw={700} mb={4}>
                              {selectedPickupAddress.pickup_address.address_street},{" "}
                              {selectedPickupAddress.pickup_address.address_barangay}
                            </Text>
                            <Text size="sm">
                              {selectedPickupAddress.pickup_address.address_city},{" "}
                              {selectedPickupAddress.pickup_address.address_province},{" "}
                              {selectedPickupAddress.pickup_address.address_region}
                            </Text>
                            <Text size="sm" c="dimmed">
                              {selectedPickupAddress.pickup_address.address_postal_code}
                            </Text>
                            <Button
                              component="a"
                              href={`https://www.google.com/maps?q=${selectedPickupAddress.pickup_address_latitude},${selectedPickupAddress.pickup_address_longitude}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              variant="filled"
                              color="blue"
                              size="xs"
                              mt={8}
                              rightSection={<IconExternalLink size={11} />}
                            >
                              View on Google Maps
                            </Button>
                            {!selectedPickupAddress.pickup_address_is_available && (
                              <Alert
                                color="red"
                                variant="light"
                                icon={<IconAlertCircle size={14} />}
                                mt={8}
                                p="xs"
                              >
                                <Text size="xs" fw={500}>
                                  This pickup location is currently unavailable. Please select a
                                  different address.
                                </Text>
                              </Alert>
                            )}
                          </Alert>
                        ) : (
                          <Alert
                            color="yellow"
                            variant="light"
                            icon={<IconAlertCircle size={16} />}
                          >
                            <Text fw={500}>Pickup address required</Text>
                            <Text size="sm">Please select an available pickup address.</Text>
                          </Alert>
                        )}
                      </Stack>
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
