"use client";

import {
  Accordion,
  Badge,
  Box,
  Button,
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
  IconCar,
  IconCash,
  IconHeadset,
  IconPackage,
  IconRefresh,
  IconShieldCheck,
  IconShoppingBag,
  IconTruckDelivery,
} from "@tabler/icons-react";
import Link from "next/link";

const FAQ_GROUPS = [
  {
    icon: IconCar,
    title: "Fitment & Products",
    description: "Choosing the correct Magic Collar for your vehicle.",
    items: [
      {
        question: "How do I know which Magic Collar fits my car?",
        answer:
          "Check your vehicle make, model, year, and variant before ordering. Product listings show supported fitment details, and our team can confirm compatibility if you send your car details before checkout.",
      },
      {
        question: "What if I order the wrong fitment?",
        answer:
          "Contact us before installation. If the item is unused, complete, and in its original packaging, we can help arrange an exchange subject to stock availability and return shipping fees.",
      },
      {
        question: "Are your Magic Collar parts genuine?",
        answer:
          "Yes. We supply genuine Magic Collar parts and verify each item before release. Orders are packed securely so the part arrives ready for installation.",
      },
    ],
  },
  {
    icon: IconShoppingBag,
    title: "Orders",
    description: "Placing orders and checking order status.",
    items: [
      {
        question: "Do I need an account to order?",
        answer:
          "You can browse products anytime, but creating an account helps you track orders, save delivery details, and view your order history.",
      },
      {
        question: "Can I change or cancel my order?",
        answer:
          "Changes and cancellations can only be handled before the order is processed, reserved, or handed over for delivery. Message us as soon as possible with your order number.",
      },
      {
        question: "Where can I track my order?",
        answer:
          "Sign in and open your orders page to view status updates. Once a courier is assigned, tracking details will be shared through your order updates or our support channels.",
      },
    ],
  },
  {
    icon: IconCash,
    title: "Payments",
    description: "Payment options, confirmations, and proof uploads.",
    items: [
      {
        question: "What payment methods do you accept?",
        answer:
          "Available payment options may include GCash, Maya, QRPh, bank transfer, and supported online checkout channels. The exact options are shown during checkout.",
      },
      {
        question: "How do I know if my payment was received?",
        answer:
          "Online checkout payments are confirmed automatically when successful. For manual payments, upload a clear proof of payment so our team can review and update your order.",
      },
      {
        question: "Can I make a partial payment?",
        answer:
          "Some orders may support partial payment depending on the item and fulfillment process. Any remaining balance must be settled before delivery or pickup completion.",
      },
    ],
  },
  {
    icon: IconTruckDelivery,
    title: "Shipping & Pickup",
    description: "Delivery timelines, couriers, and store pickup.",
    items: [
      {
        question: "Do you deliver nationwide?",
        answer:
          "Yes. We ship across the Philippines using courier partners based on your location, order size, and service availability.",
      },
      {
        question: "How long does delivery take?",
        answer:
          "Metro Manila deliveries are usually faster, while provincial shipments may take several business days depending on the destination and courier. Delivery estimates are shown in the shipping policy.",
      },
      {
        question: "Can I pick up my order instead?",
        answer:
          "Yes, pickup may be available from supported pickup addresses. Choose pickup during checkout when available and wait for confirmation before visiting.",
      },
    ],
  },
  {
    icon: IconRefresh,
    title: "Returns & Support",
    description: "After-sales help, exchanges, and damaged items.",
    items: [
      {
        question: "What should I do if my item arrives damaged?",
        answer:
          "Take clear photos of the item and packaging immediately, then contact us within 48 hours. We will review the issue and help arrange the next step.",
      },
      {
        question: "Can I return an installed item?",
        answer:
          "Installed, used, or modified items generally cannot be returned unless the issue is confirmed to be a product defect covered by our support process.",
      },
      {
        question: "How do I contact support?",
        answer:
          "Use the contact section on the website, message our official social channels, or email hello@magiccollar.ph with your order number and concern.",
      },
    ],
  },
  {
    icon: IconShieldCheck,
    title: "Resellers",
    description: "Questions for shops and repeat buyers.",
    items: [
      {
        question: "Do you accept reseller inquiries?",
        answer:
          "Yes. Reseller inquiries are welcome. Send your business details, location, and target brands so our team can review availability and terms.",
      },
      {
        question: "Do resellers get different pricing?",
        answer:
          "Qualified resellers may receive reseller pricing or order terms depending on volume, account status, and product availability.",
      },
      {
        question: "Can you help with bulk orders?",
        answer:
          "Yes. For bulk orders, contact us before checkout so we can confirm stock, lead times, shipping arrangements, and payment requirements.",
      },
    ],
  },
];

const QUICK_LINKS = [
  { label: "Shop Products", href: "/shop", icon: IconShoppingBag },
  { label: "Shipping Policy", href: "/shipping-policy", icon: IconPackage },
  { label: "Contact Us", href: "/#contact", icon: IconHeadset },
];

const FAQPage = () => {
  return (
    <Box py={{ base: rem(60), md: rem(80) }}>
      <Container size="md">
        <Stack gap={rem(48)}>
          <Stack gap="sm" style={{ textAlign: "center" }}>
            <Badge color="red" variant="light" size="lg" radius="sm" mx="auto">
              FAQs
            </Badge>
            <Title order={1} style={{ fontSize: rem(40), fontWeight: 800 }}>
              Frequently Asked Questions
            </Title>
            <Text c="dimmed" size="lg" maw={560} mx="auto">
              Answers to the questions customers ask most about Magic Collar fitment, orders,
              payments, shipping, pickup, returns, and reseller support.
            </Text>
          </Stack>

          <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
            {QUICK_LINKS.map(({ label, href, icon: Icon }) => (
              <Button
                key={label}
                component={Link}
                href={href}
                variant="light"
                color="red"
                radius="md"
                size="md"
                leftSection={<Icon size={18} />}
              >
                {label}
              </Button>
            ))}
          </SimpleGrid>

          <Divider />

          {FAQ_GROUPS.map(({ icon: Icon, title, description, items }) => (
            <Stack key={title} gap="md">
              <Group gap="md" align="flex-start">
                <ThemeIcon
                  size={42}
                  radius="md"
                  color="red"
                  variant="light"
                  style={{ flexShrink: 0 }}
                >
                  <Icon size={22} />
                </ThemeIcon>
                <Stack gap={2}>
                  <Title order={2} style={{ fontSize: rem(22), fontWeight: 700 }}>
                    {title}
                  </Title>
                  <Text size="sm" c="dimmed">
                    {description}
                  </Text>
                </Stack>
              </Group>

              <Accordion variant="separated" radius="md">
                {items.map(({ question, answer }) => (
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
          ))}

          <Divider />

          <Card
            withBorder
            radius="md"
            p="lg"
            style={{ background: "var(--mantine-color-default)" }}
          >
            <Group gap="md" align="flex-start">
              <ThemeIcon
                size={40}
                radius="md"
                color="red"
                variant="light"
                style={{ flexShrink: 0 }}
              >
                <IconHeadset size={20} />
              </ThemeIcon>
              <Stack gap={6}>
                <Text fw={600} size="sm">
                  Still need help?
                </Text>
                <Text size="sm" c="dimmed" style={{ lineHeight: 1.6 }}>
                  Send us your car details, order number, or reseller inquiry through the contact
                  section and our team will help you with the next step.
                </Text>
                <Group gap="sm" mt="xs">
                  <Button component={Link} href="/#contact" color="red" size="sm">
                    Contact Us
                  </Button>
                  <Button component={Link} href="/shop" variant="subtle" color="gray" size="sm">
                    Browse Products
                  </Button>
                </Group>
              </Stack>
            </Group>
          </Card>
        </Stack>
      </Container>
    </Box>
  );
};

export default FAQPage;
