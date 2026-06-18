"use client";

import {
  Accordion,
  Badge,
  Box,
  Card,
  Container,
  Divider,
  Group,
  rem,
  SimpleGrid,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from "@mantine/core";
import {
  IconAlertCircle,
  IconBuildingStore,
  IconClock,
  IconMapPin,
  IconPackage,
  IconRefresh,
  IconShieldCheck,
  IconTruckDelivery,
} from "@tabler/icons-react";

const SHIPPING_HIGHLIGHTS = [
  {
    icon: IconTruckDelivery,
    label: "Nationwide Delivery",
    description: "We ship to all provinces and cities across the Philippines.",
  },
  {
    icon: IconClock,
    label: "Processing Time",
    description: "Orders are processed within 1–2 business days after payment confirmation.",
  },
  {
    icon: IconShieldCheck,
    label: "Insured Shipments",
    description: "All orders are insured against loss or damage during transit.",
  },
  {
    icon: IconPackage,
    label: "Secure Packaging",
    description: "Parts are bubble-wrapped and boxed to ensure they arrive in perfect condition.",
  },
];

const DELIVERY_TABLE = [
  {
    zone: "Metro Manila",
    standard: "1–2 business days",
    express: "Same day / Next day",
    courier: "J&T, Ninja Van, Lalamove",
  },
  {
    zone: "Luzon (Provincial)",
    standard: "3–5 business days",
    express: "2–3 business days",
    courier: "J&T, Ninja Van, LBC",
  },
  {
    zone: "Visayas",
    standard: "5–7 business days",
    express: "3–5 business days",
    courier: "J&T, LBC",
  },
  {
    zone: "Mindanao",
    standard: "5–8 business days",
    express: "3–6 business days",
    courier: "J&T, LBC",
  },
  {
    zone: "Island Municipalities",
    standard: "7–14 business days",
    express: "Not available",
    courier: "LBC",
  },
];

const FAQS = [
  {
    question: "How do I track my order?",
    answer:
      "Once your order has been shipped, you will receive a tracking number via email or SMS. You can use this number on the courier's website to monitor your delivery status. You can also contact us directly on Messenger and we'll check it for you.",
  },
  {
    question: "What if my item arrives damaged?",
    answer:
      "All shipments are insured. If your item arrives damaged, take photos of the packaging and the damaged part immediately upon receipt, then contact us within 48 hours. We will arrange a replacement or refund depending on availability.",
  },
  {
    question: "Can I change my shipping address after placing an order?",
    answer:
      "Address changes can only be accommodated before the order has been handed over to the courier. Contact us as soon as possible via phone, email, or Messenger. Once the package is in transit, we cannot guarantee an address change.",
  },
  {
    question: "Do you offer pick-up?",
    answer:
      "Yes, you may pick up your order at our store in Quezon City, Metro Manila. Select the 'Store Pick-up' option at checkout. Pick-up orders are ready within 1 business day after payment confirmation.",
  },
  {
    question: "What couriers do you use?",
    answer:
      "We primarily use J&T Express, Ninja Van, and LBC depending on your location. For same-day Metro Manila deliveries, we also use Lalamove. The courier assigned to your order will be noted in your shipping confirmation.",
  },
  {
    question: "Are shipping fees refundable?",
    answer:
      "Shipping fees are non-refundable unless the return is due to our error (wrong item sent, defective product). For buyer-initiated returns, the customer shoulders the return shipping cost.",
  },
  {
    question: "Do you ship internationally?",
    answer:
      "At the moment, we only ship within the Philippines. International shipping is not yet available. Follow our social media pages for updates on this.",
  },
  {
    question: "What happens if no one is home during delivery?",
    answer:
      "The courier will attempt delivery up to 3 times. If all attempts fail, the package will be held at the courier's nearest branch for 5 days before being returned to us. Re-delivery will incur an additional shipping fee.",
  },
];

const ShippingPolicyPage = () => {
  return (
    <Box py={{ base: rem(60), md: rem(80) }}>
      <Container size="md">
        <Stack gap={rem(48)}>
          {/* Header */}
          <Stack gap="sm" style={{ textAlign: "center" }}>
            <Badge color="red" variant="light" size="lg" radius="sm" mx="auto">
              Shipping Policy
            </Badge>
            <Title
              order={1}
              style={{ fontSize: rem(40), fontWeight: 800, letterSpacing: "-0.02em" }}
            >
              How We Deliver Your Parts
            </Title>
            <Text c="dimmed" size="lg" maw={520} mx="auto">
              We want your Magic Collar to arrive fast, safe, and exactly as ordered. Here's
              everything you need to know about our shipping process.
            </Text>
            <Text size="xs" c="dimmed" mt="xs">
              Last updated: June 2026
            </Text>
          </Stack>

          <Divider />

          {/* Highlights */}
          <Stack gap="md">
            <Title order={2} style={{ fontSize: rem(22), fontWeight: 700 }}>
              Shipping at a Glance
            </Title>
            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
              {SHIPPING_HIGHLIGHTS.map(({ icon: Icon, label, description }) => (
                <Card key={label} withBorder radius="md" p="lg">
                  <Group gap="md" align="flex-start">
                    <ThemeIcon
                      size={40}
                      radius="md"
                      color="red"
                      variant="light"
                      style={{ flexShrink: 0 }}
                    >
                      <Icon size={20} />
                    </ThemeIcon>
                    <Stack gap={4}>
                      <Text fw={600} size="sm">
                        {label}
                      </Text>
                      <Text size="sm" c="dimmed" style={{ lineHeight: 1.6 }}>
                        {description}
                      </Text>
                    </Stack>
                  </Group>
                </Card>
              ))}
            </SimpleGrid>
          </Stack>

          <Divider />

          {/* Delivery Timeframes */}
          <Stack gap="md">
            <Stack gap={4}>
              <Title order={2} style={{ fontSize: rem(22), fontWeight: 700 }}>
                Delivery Timeframes
              </Title>
              <Text size="sm" c="dimmed">
                Estimated delivery times are from the date of shipment, not the date of order.
                Business days exclude weekends and Philippine public holidays.
              </Text>
            </Stack>

            <Card withBorder radius="md" p={0} style={{ overflow: "hidden" }}>
              {/* Table header */}
              <Box px="lg" py="sm" style={{ background: "var(--mantine-color-default)" }}>
                <SimpleGrid cols={4}>
                  {["Zone", "Standard", "Express", "Couriers"].map((h) => (
                    <Text
                      key={h}
                      size="xs"
                      fw={700}
                      tt="uppercase"
                      c="dimmed"
                      style={{ letterSpacing: "0.06em" }}
                    >
                      {h}
                    </Text>
                  ))}
                </SimpleGrid>
              </Box>
              <Divider />
              {DELIVERY_TABLE.map((row, i) => (
                <Box key={row.zone}>
                  <Box px="lg" py="md">
                    <SimpleGrid cols={4}>
                      <Text size="sm" fw={600}>
                        {row.zone}
                      </Text>
                      <Group gap="xs">
                        <IconTruckDelivery size={14} color="var(--mantine-color-red-5)" />
                        <Text size="sm">{row.standard}</Text>
                      </Group>
                      <Group gap="xs">
                        <IconClock size={14} color="var(--mantine-color-red-5)" />
                        <Text size="sm">{row.express}</Text>
                      </Group>
                      <Text size="sm" c="dimmed">
                        {row.courier}
                      </Text>
                    </SimpleGrid>
                  </Box>
                  {i < DELIVERY_TABLE.length - 1 && <Divider />}
                </Box>
              ))}
            </Card>

            <Group gap="xs">
              <IconAlertCircle size={14} color="var(--mantine-color-dimmed)" />
              <Text size="xs" c="dimmed">
                Delivery times are estimates and may vary due to courier delays, weather, or peak
                seasons.
              </Text>
            </Group>
          </Stack>

          <Divider />

          {/* Shipping Fees */}
          <Stack gap="md">
            <Stack gap={4}>
              <Title order={2} style={{ fontSize: rem(22), fontWeight: 700 }}>
                Shipping Fees
              </Title>
              <Text size="sm" c="dimmed">
                Shipping fees are calculated at checkout based on your location and order weight.
              </Text>
            </Stack>
            <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
              {[
                { label: "Metro Manila", fee: "₱80 – ₱150", note: "Standard delivery" },
                { label: "Provincial (Luzon)", fee: "₱150 – ₱250", note: "Standard delivery" },
                { label: "Visayas & Mindanao", fee: "₱200 – ₱350", note: "Standard delivery" },
              ].map(({ label, fee, note }) => (
                <Card key={label} withBorder radius="md" p="lg" style={{ textAlign: "center" }}>
                  <Stack gap={4}>
                    <Text
                      size="xs"
                      c="dimmed"
                      tt="uppercase"
                      fw={600}
                      style={{ letterSpacing: "0.06em" }}
                    >
                      {label}
                    </Text>
                    <Text fw={800} size="xl" c="red.5">
                      {fee}
                    </Text>
                    <Text size="xs" c="dimmed">
                      {note}
                    </Text>
                  </Stack>
                </Card>
              ))}
            </SimpleGrid>
            <Card
              withBorder
              radius="md"
              p="lg"
              style={{ background: "var(--mantine-color-default)" }}
            >
              <Group gap="md">
                <ThemeIcon
                  size={36}
                  radius="md"
                  color="red"
                  variant="light"
                  style={{ flexShrink: 0 }}
                >
                  <IconBuildingStore size={18} />
                </ThemeIcon>
                <Stack gap={2}>
                  <Text fw={600} size="sm">
                    Free Store Pick-up — Quezon City
                  </Text>
                  <Text size="sm" c="dimmed">
                    Pick up your order at our Quezon City store at no extra cost. Ready within 1
                    business day after payment.
                  </Text>
                </Stack>
              </Group>
            </Card>
          </Stack>

          <Divider />

          {/* Returns & Damaged Items */}
          <Stack gap="md">
            <Stack gap={4}>
              <Title order={2} style={{ fontSize: rem(22), fontWeight: 700 }}>
                Returns &amp; Damaged Items
              </Title>
              <Text size="sm" c="dimmed">
                We stand behind every Magic Collar we ship.
              </Text>
            </Stack>
            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
              {[
                {
                  icon: IconRefresh,
                  label: "Wrong or Defective Item",
                  description:
                    "If we sent the wrong part or the item is defective, we will replace it or issue a full refund at no cost to you. Contact us within 7 days of receipt.",
                },
                {
                  icon: IconShieldCheck,
                  label: "Damaged in Transit",
                  description:
                    "Take photos immediately and contact us within 48 hours. All orders are insured — we will file the claim and arrange a replacement.",
                },
                {
                  icon: IconMapPin,
                  label: "Return Shipping",
                  description:
                    "For buyer-initiated returns (wrong order, change of mind), the customer shoulders return shipping. Items must be unused and in original packaging.",
                },
                {
                  icon: IconAlertCircle,
                  label: "Non-Returnable Items",
                  description:
                    "Electrical components and special-order items are non-returnable once installed or used. Please double-check your car's make, model, and year before ordering.",
                },
              ].map(({ icon: Icon, label, description }) => (
                <Card key={label} withBorder radius="md" p="lg">
                  <Group gap="md" align="flex-start">
                    <ThemeIcon
                      size={40}
                      radius="md"
                      color="red"
                      variant="light"
                      style={{ flexShrink: 0 }}
                    >
                      <Icon size={20} />
                    </ThemeIcon>
                    <Stack gap={4}>
                      <Text fw={600} size="sm">
                        {label}
                      </Text>
                      <Text size="sm" c="dimmed" style={{ lineHeight: 1.6 }}>
                        {description}
                      </Text>
                    </Stack>
                  </Group>
                </Card>
              ))}
            </SimpleGrid>
          </Stack>

          <Divider />

          {/* FAQs */}
          <Stack gap="md">
            <Title order={2} style={{ fontSize: rem(22), fontWeight: 700 }}>
              Frequently Asked Questions
            </Title>
            <Accordion variant="separated" radius="md">
              {FAQS.map(({ question, answer }) => (
                <Accordion.Item key={question} value={question}>
                  <Accordion.Control>
                    <Text fw={500} size="sm">
                      {question}
                    </Text>
                  </Accordion.Control>
                  <Accordion.Panel>
                    <Text size="sm" c="dimmed" style={{ lineHeight: 1.7 }}>
                      {answer}
                    </Text>
                  </Accordion.Panel>
                </Accordion.Item>
              ))}
            </Accordion>
          </Stack>

          <Divider />

          {/* Footer note */}
          <Card
            withBorder
            radius="md"
            p="lg"
            style={{ background: "var(--mantine-color-default)" }}
          >
            <Group gap="md" align="flex-start">
              <ThemeIcon
                size={36}
                radius="md"
                color="red"
                variant="light"
                style={{ flexShrink: 0 }}
              >
                <IconAlertCircle size={18} />
              </ThemeIcon>
              <Stack gap={4}>
                <Text fw={600} size="sm">
                  Policy Updates
                </Text>
                <Text size="sm" c="dimmed" style={{ lineHeight: 1.6 }}>
                  Magic Collar reserves the right to update this shipping policy at any time.
                  Changes will be reflected on this page with an updated date. For questions not
                  covered here, contact us at{" "}
                  <Text component="a" href="mailto:hello@magiccollar.ph" c="red.5" size="sm">
                    hello@magiccollar.ph
                  </Text>{" "}
                  or message us on Messenger.
                </Text>
              </Stack>
            </Group>
          </Card>
        </Stack>
      </Container>
    </Box>
  );
};

export default ShippingPolicyPage;
