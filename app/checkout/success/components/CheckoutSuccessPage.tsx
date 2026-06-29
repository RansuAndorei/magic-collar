"use client";

import { CHECKOUT_SUMMARY_STORAGE_KEY, SHOP_CART_STORAGE_KEY } from "@/utils/constants";
import { formatCurrency } from "@/utils/functions";
import {
  Box,
  Button,
  Card,
  Container,
  Group,
  rem,
  Skeleton,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from "@mantine/core";
import { IconCheck, IconReceipt, IconShoppingCart } from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type CheckoutSummary = {
  itemCount: number;
  downPayment: number;
  total: number;
  fulfillmentType: string;
  courier: string | null;
  paymentMethod: string;
  currency: string;
};

const CheckoutSuccessPage = () => {
  const router = useRouter();
  const [summary, setSummary] = useState<CheckoutSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const rawSummary = window.sessionStorage.getItem(CHECKOUT_SUMMARY_STORAGE_KEY);

    if (!rawSummary) {
      setIsLoading(false);
      return;
    }

    try {
      setSummary(JSON.parse(rawSummary) as CheckoutSummary);
      window.sessionStorage.removeItem(CHECKOUT_SUMMARY_STORAGE_KEY);
      localStorage.removeItem(SHOP_CART_STORAGE_KEY);
    } catch {
      setSummary(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isLoading && !summary) {
      router.replace("/shop");
    }
  }, [isLoading, summary, router]);

  return (
    <Box py={{ base: rem(48), md: rem(80) }}>
      <Container size={560}>
        <Card withBorder p="xl">
          <Stack gap="lg" align="center" ta="center">
            <ThemeIcon size={76} radius="xl" color="green" variant="light">
              <IconCheck size={40} />
            </ThemeIcon>

            <Stack gap={6}>
              <Title order={1} style={{ fontSize: rem(28), fontWeight: 800 }}>
                Payment Successful!
              </Title>

              <Text c="dimmed">
                Your down payment has been received successfully. Your order is now being processed
                for fulfillment. You can track updates anytime in your Order List.
              </Text>
            </Stack>

            {/* SUMMARY SECTION */}
            {isLoading ? (
              <Card withBorder p="md" w="100%">
                <Stack gap="sm">
                  <Group justify="space-between">
                    <Skeleton height={14} width={60} />
                    <Skeleton height={14} width={40} />
                  </Group>

                  <Group justify="space-between">
                    <Skeleton height={14} width={120} />
                    <Skeleton height={14} width={80} />
                  </Group>

                  <Group justify="space-between">
                    <Skeleton height={14} width={90} />
                    <Skeleton height={14} width={110} />
                  </Group>

                  <Group justify="space-between">
                    <Skeleton height={14} width={100} />
                    <Skeleton height={14} width={70} />
                  </Group>
                </Stack>
              </Card>
            ) : summary ? (
              <Card withBorder p="md" w="100%">
                <Stack gap="xs">
                  <Group justify="space-between">
                    <Text c="dimmed" size="sm">
                      Items
                    </Text>
                    <Text fw={700}>
                      {summary.itemCount} item{summary.itemCount === 1 ? "" : "s"}
                    </Text>
                  </Group>

                  <Group justify="space-between">
                    <Text c="dimmed" size="sm">
                      Down Payment Paid
                    </Text>
                    <Text fw={700}>
                      {formatCurrency(summary.downPayment, {
                        currency: summary.currency,
                        minimumFractionDigits: 0,
                      })}
                    </Text>
                  </Group>

                  <Group justify="space-between">
                    <Text c="dimmed" size="sm">
                      Fulfillment
                    </Text>
                    <Text fw={700}>
                      {summary.fulfillmentType === "DELIVERY"
                        ? `Delivery${summary.courier ? ` via ${summary.courier}` : ""}`
                        : "Pickup"}
                    </Text>
                  </Group>

                  <Group justify="space-between">
                    <Text c="dimmed" size="sm">
                      Payment method
                    </Text>
                    <Text fw={700} tt="uppercase">
                      {summary.paymentMethod}
                    </Text>
                  </Group>
                </Stack>
              </Card>
            ) : (
              <Text c="dimmed" size="sm">
                Your order is now being processed. You can track updates in your Order List.
              </Text>
            )}

            {/* ACTIONS */}
            <Group>
              <Button
                color="red"
                leftSection={<IconShoppingCart size={16} />}
                onClick={() => router.push("/shop")}
              >
                Continue Shopping
              </Button>

              <Button
                variant="filled"
                color="dark"
                onClick={() => router.push("/user/orders")}
                leftSection={<IconReceipt size={14} />}
              >
                View Order List
              </Button>
            </Group>
          </Stack>
        </Card>
      </Container>
    </Box>
  );
};

export default CheckoutSuccessPage;
