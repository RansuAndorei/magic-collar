"use client";

import {
  Box,
  Button,
  Card,
  Container,
  Group,
  rem,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from "@mantine/core";
import { IconAlertTriangle, IconArrowLeft, IconShoppingCart } from "@tabler/icons-react";
import { useRouter, useSearchParams } from "next/navigation";

const ERROR_MESSAGES: Record<string, string> = {
  "empty-cart": "Your cart is empty. Add at least one Magic Collar before checking out.",
  "missing-address": "Please choose a delivery address or switch to pickup.",
  "missing-courier": "Please choose LBC or Lalamove for delivery.",
  "missing-payment": "Please provide your down payment payment method and reference number.",
  "load-failed": "We could not load the checkout data. Please try again.",
  "submission-failed": "We could not submit your checkout details. Please try again.",
};

const CheckoutErrorPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reason = searchParams.get("reason") ?? "submission-failed";

  return (
    <Box py={{ base: rem(48), md: rem(80) }}>
      <Container size={560}>
        <Card withBorder p="xl">
          <Stack gap="lg" align="center" ta="center">
            <ThemeIcon size={76} radius="xl" color="red" variant="light">
              <IconAlertTriangle size={40} />
            </ThemeIcon>
            <Stack gap={6}>
              <Title order={1} style={{ fontSize: rem(28), fontWeight: 800 }}>
                Checkout needs attention
              </Title>
              <Text c="dimmed">
                {ERROR_MESSAGES[reason] ?? ERROR_MESSAGES["submission-failed"]}
              </Text>
            </Stack>

            <Group>
              <Button
                color="red"
                leftSection={<IconArrowLeft size={16} />}
                onClick={() => router.push("/checkout")}
              >
                Back to Checkout
              </Button>
              <Button
                variant="subtle"
                color="gray"
                leftSection={<IconShoppingCart size={16} />}
                onClick={() => router.push("/shop")}
              >
                Shop
              </Button>
            </Group>
          </Stack>
        </Card>
      </Container>
    </Box>
  );
};

export default CheckoutErrorPage;

