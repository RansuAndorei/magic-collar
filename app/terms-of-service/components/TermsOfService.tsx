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
  IconCash,
  IconGavel,
  IconLock,
  IconPackage,
  IconRefresh,
  IconScale,
  IconShieldCheck,
  IconTruckDelivery,
  IconUser,
  IconX,
} from "@tabler/icons-react";

const KEY_POINTS = [
  {
    icon: IconUser,
    label: "Who Can Use This Site",
    description:
      "Our services are open to individuals aged 18 and above, and registered businesses. By using this site, you confirm you meet these requirements.",
  },
  {
    icon: IconCash,
    label: "Pricing & Payment",
    description:
      "All prices are in Philippine Peso (₱). We accept GCash, Maya, credit/debit cards, and bank transfers. Orders are confirmed only upon successful payment.",
  },
  {
    icon: IconTruckDelivery,
    label: "Shipping & Delivery",
    description:
      "Delivery timelines are estimates and not guaranteed. Magic Collar is not liable for delays caused by couriers, weather, or force majeure events.",
  },
  {
    icon: IconRefresh,
    label: "Returns & Refunds",
    description:
      "Returns are accepted within 7 days for defective or wrong items. Buyer-initiated returns for change of mind are accepted within 3 days, unused and in original packaging.",
  },
  {
    icon: IconShieldCheck,
    label: "Product Warranty",
    description:
      "Magic Collar products carry a limited warranty against manufacturing defects. Warranty does not cover damage from improper installation or misuse.",
  },
  {
    icon: IconLock,
    label: "Account Security",
    description:
      "You are responsible for maintaining the confidentiality of your account credentials. Magic Collar is not liable for unauthorized access resulting from your negligence.",
  },
];

const PROHIBITED = [
  "Placing fraudulent or false orders",
  "Using another person's payment method without authorization",
  "Reselling Magic Collar products without an accredited reseller agreement",
  "Scraping, copying, or reproducing our product listings, images, or content",
  "Submitting false or misleading product reviews",
  "Attempting to hack, disrupt, or gain unauthorized access to our systems",
  "Using our platform for any unlawful purpose under Philippine law",
  "Harassing, threatening, or abusing our staff or other customers",
];

const FAQS = [
  {
    question: "Can I cancel my order after placing it?",
    answer:
      "You may cancel your order within 24 hours of placement, provided it has not yet been processed or shipped. To cancel, contact us immediately via phone, email, or Messenger. Once an order has been handed to the courier, cancellation is no longer possible and you will need to follow the return process.",
  },
  {
    question: "What is your refund process?",
    answer:
      "Approved refunds are processed within 5–10 business days depending on your payment method. GCash and Maya refunds are typically faster (3–5 business days). Credit card refunds may take up to 10 business days depending on your bank. Refunds are issued to the original payment method only.",
  },
  {
    question: "What voids the product warranty?",
    answer:
      "The warranty is voided if the product shows signs of improper installation, physical damage caused by the buyer, modification or tampering, use outside the specified vehicle make and model, or damage from accidents, flooding, or negligence.",
  },
  {
    question: "Can I resell Magic Collar products?",
    answer:
      "Yes, but only under an accredited reseller agreement with Magic Collar. Unauthorized reselling — including listing our products on third-party platforms without approval — is a violation of these Terms and may result in account suspension and legal action.",
  },
  {
    question: "What happens if I receive the wrong item?",
    answer:
      "Contact us within 48 hours of receiving the wrong item. Include your order number and photos of what was received. We will arrange a free pickup of the wrong item and ship the correct one at no additional cost to you.",
  },
  {
    question: "Can Magic Collar change prices without notice?",
    answer:
      "Yes. Prices on our website may change without prior notice. However, the price charged for your order is the price displayed at the time of checkout. We will not retroactively charge you for price increases after your order is confirmed.",
  },
  {
    question: "What law governs these Terms?",
    answer:
      "These Terms of Service are governed by the laws of the Republic of the Philippines. Any disputes arising from these Terms shall be subject to the exclusive jurisdiction of the courts of Quezon City, Metro Manila.",
  },
  {
    question: "How will I be notified of changes to these Terms?",
    answer:
      "We will notify registered users of material changes via email at least 7 days before they take effect. For non-registered visitors, changes are effective upon posting to this page. Continued use of our services after the effective date constitutes acceptance.",
  },
];

const TermsOfServicePage = () => {
  return (
    <Box py={{ base: rem(60), md: rem(80) }}>
      <Container size="md">
        <Stack gap={rem(48)}>
          {/* Header */}
          <Stack gap="sm" style={{ textAlign: "center" }}>
            <Badge color="red" variant="light" size="lg" radius="sm" mx="auto">
              Terms of Service
            </Badge>
            <Title
              order={1}
              style={{ fontSize: rem(40), fontWeight: 800, letterSpacing: "-0.02em" }}
            >
              Our Terms of Service
            </Title>
            <Text c="dimmed" size="lg" maw={520} mx="auto">
              Please read these terms carefully before using the Magic Collar website or placing an
              order. By accessing our site or purchasing from us, you agree to be bound by these
              terms.
            </Text>
            <Text size="xs" c="dimmed" mt="xs">
              Last updated: June 2026
            </Text>
          </Stack>

          <Divider />

          {/* Agreement notice */}
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
                <IconGavel size={18} />
              </ThemeIcon>
              <Stack gap={4}>
                <Text fw={600} size="sm">
                  Legal Agreement
                </Text>
                <Text size="sm" c="dimmed" style={{ lineHeight: 1.7 }}>
                  These Terms of Service (&ldquo;Terms&ldquo;) constitute a legally binding
                  agreement between you (&ldquo;Customer&ldquo;, &ldquo;Reseller&ldquo;, or
                  &ldquo;Visitor&ldquo;) and Magic Collar Car Parts (&ldquo;Magic Collar&ldquo;,
                  &ldquo;we&ldquo;, &ldquo;us&ldquo;, or &ldquo;our&ldquo;), a business registered
                  in the Philippines. These Terms govern your use of our website, products, and
                  services.
                </Text>
              </Stack>
            </Group>
          </Card>

          <Divider />

          {/* Key Points */}
          <Stack gap="md">
            <Stack gap={4}>
              <Title order={2} style={{ fontSize: rem(22), fontWeight: 700 }}>
                Key Terms at a Glance
              </Title>
              <Text size="sm" c="dimmed">
                A summary of the most important points. Full details are in the sections below.
              </Text>
            </Stack>
            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
              {KEY_POINTS.map(({ icon: Icon, label, description }) => (
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

          {/* Orders & Payments */}
          <Stack gap="md">
            <Title order={2} style={{ fontSize: rem(22), fontWeight: 700 }}>
              Orders &amp; Payments
            </Title>
            <Stack gap="sm">
              {[
                {
                  icon: IconPackage,
                  title: "Order Confirmation",
                  body: "An order is only confirmed once payment has been successfully received and verified. We reserve the right to cancel any order due to stock unavailability, pricing errors, or suspected fraud. You will be notified and fully refunded in such cases.",
                },
                {
                  icon: IconCash,
                  title: "Accepted Payment Methods",
                  body: "We accept GCash, Maya, credit cards (Visa, Mastercard), debit cards, and bank transfers (BDO, BPI, UnionBank). All transactions are processed in Philippine Peso (₱). We do not accept COD (Cash on Delivery) at this time.",
                },
                {
                  icon: IconAlertCircle,
                  title: "Pricing Errors",
                  body: "In the event of a pricing error on our website, we reserve the right to cancel the affected orders and issue a full refund. We will notify you of the correct price and give you the option to reorder at the correct amount.",
                },
              ].map(({ icon: Icon, title, body }) => (
                <Card key={title} withBorder radius="md" p="lg">
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
                        {title}
                      </Text>
                      <Text size="sm" c="dimmed" style={{ lineHeight: 1.6 }}>
                        {body}
                      </Text>
                    </Stack>
                  </Group>
                </Card>
              ))}
            </Stack>
          </Stack>

          <Divider />

          {/* Returns & Warranty */}
          <Stack gap="md">
            <Title order={2} style={{ fontSize: rem(22), fontWeight: 700 }}>
              Returns, Refunds &amp; Warranty
            </Title>
            <Stack gap="sm">
              {[
                {
                  icon: IconRefresh,
                  title: "Return Eligibility",
                  body: "Items may be returned within 7 days of receipt if they are defective, damaged in transit, or incorrect. For change-of-mind returns, items must be returned within 3 days, unused, and in original packaging. Electrical components and special-order parts are non-returnable once installed.",
                },
                {
                  icon: IconCash,
                  title: "Refund Processing",
                  body: "Approved refunds are issued to the original payment method within 5–10 business days. Shipping fees are non-refundable unless the return is due to our error. We do not issue cash refunds for online transactions.",
                },
                {
                  icon: IconShieldCheck,
                  title: "Limited Warranty",
                  body: "Magic Collar products are warranted against manufacturing defects for 30 days from the date of purchase. This warranty does not cover damage from improper installation, misuse, accidents, or use on a vehicle other than the specified make and model.",
                },
              ].map(({ icon: Icon, title, body }) => (
                <Card key={title} withBorder radius="md" p="lg">
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
                        {title}
                      </Text>
                      <Text size="sm" c="dimmed" style={{ lineHeight: 1.6 }}>
                        {body}
                      </Text>
                    </Stack>
                  </Group>
                </Card>
              ))}
            </Stack>
          </Stack>

          <Divider />

          {/* Reseller Terms */}
          <Stack gap="md">
            <Title order={2} style={{ fontSize: rem(22), fontWeight: 700 }}>
              Reseller Terms
            </Title>
            <Card withBorder radius="md" p="lg">
              <Group gap="md" align="flex-start">
                <ThemeIcon
                  size={40}
                  radius="md"
                  color="red"
                  variant="light"
                  style={{ flexShrink: 0 }}
                >
                  <IconBuildingStore size={20} />
                </ThemeIcon>
                <Stack gap="sm" style={{ flex: 1 }}>
                  <Text fw={600} size="sm">
                    Accredited Resellers
                  </Text>
                  <Text size="sm" c="dimmed" style={{ lineHeight: 1.7 }}>
                    Reseller pricing and privileges are available only to businesses or individuals
                    who have been formally accredited by Magic Collar. Accreditation is subject to
                    approval and may be revoked at any time for violation of these Terms.
                  </Text>
                  <Stack gap={6}>
                    {[
                      "Resellers must not sell below the Minimum Advertised Price (MAP) set by Magic Collar.",
                      "Resellers may not list Magic Collar products on third-party marketplaces without written approval.",
                      "Wholesale orders are final sale — returns and refunds follow separate reseller guidelines.",
                      "Reseller accounts found to be reselling to other resellers will be suspended.",
                    ].map((point) => (
                      <Group key={point} gap="xs" align="flex-start">
                        <Box
                          w={5}
                          h={5}
                          mt={7}
                          style={{
                            borderRadius: "50%",
                            background: "var(--mantine-color-red-5)",
                            flexShrink: 0,
                          }}
                        />
                        <Text size="sm" c="dimmed" style={{ lineHeight: 1.6 }}>
                          {point}
                        </Text>
                      </Group>
                    ))}
                  </Stack>
                </Stack>
              </Group>
            </Card>
          </Stack>

          <Divider />

          {/* Prohibited Activities */}
          <Stack gap="md">
            <Stack gap={4}>
              <Title order={2} style={{ fontSize: rem(22), fontWeight: 700 }}>
                Prohibited Activities
              </Title>
              <Text size="sm" c="dimmed">
                The following actions are strictly prohibited and may result in immediate account
                suspension and legal action.
              </Text>
            </Stack>
            <Card withBorder radius="md" p="xl">
              <Stack gap="sm">
                {PROHIBITED.map((item) => (
                  <Group key={item} gap="sm" align="flex-start">
                    <ThemeIcon
                      size={20}
                      radius="xl"
                      color="red"
                      variant="light"
                      style={{ flexShrink: 0, marginTop: 1 }}
                    >
                      <IconX size={11} />
                    </ThemeIcon>
                    <Text size="sm" c="dimmed" style={{ lineHeight: 1.6 }}>
                      {item}
                    </Text>
                  </Group>
                ))}
              </Stack>
            </Card>
          </Stack>

          <Divider />

          {/* Intellectual Property */}
          <Stack gap="md">
            <Title order={2} style={{ fontSize: rem(22), fontWeight: 700 }}>
              Intellectual Property
            </Title>
            <Text size="sm" c="dimmed" style={{ lineHeight: 1.8 }}>
              All content on this website — including the Magic Collar name, logo, product images,
              descriptions, and design — is the intellectual property of Magic Collar Car Parts and
              is protected under Philippine intellectual property laws. You may not reproduce, copy,
              redistribute, or use any of our content for commercial purposes without our prior
              written consent.
            </Text>
          </Stack>

          <Divider />

          {/* Limitation of Liability */}
          <Stack gap="md">
            <Title order={2} style={{ fontSize: rem(22), fontWeight: 700 }}>
              Limitation of Liability
            </Title>
            <Card withBorder radius="md" p="lg">
              <Group gap="md" align="flex-start">
                <ThemeIcon
                  size={40}
                  radius="md"
                  color="red"
                  variant="light"
                  style={{ flexShrink: 0 }}
                >
                  <IconScale size={20} />
                </ThemeIcon>
                <Text size="sm" c="dimmed" style={{ lineHeight: 1.8 }}>
                  To the maximum extent permitted by Philippine law, Magic Collar shall not be
                  liable for any indirect, incidental, special, or consequential damages arising
                  from the use or inability to use our products or services. Our total liability to
                  you for any claim shall not exceed the amount you paid for the specific order
                  giving rise to the claim. Magic Collar is not responsible for vehicle damage
                  resulting from improper installation of our products.
                </Text>
              </Group>
            </Card>
          </Stack>

          <Divider />

          {/* Governing Law */}
          <Stack gap="md">
            <Title order={2} style={{ fontSize: rem(22), fontWeight: 700 }}>
              Governing Law &amp; Disputes
            </Title>
            <Text size="sm" c="dimmed" style={{ lineHeight: 1.8 }}>
              These Terms are governed by the laws of the Republic of the Philippines, including but
              not limited to the Consumer Act (RA 7394), the Electronic Commerce Act (RA 8792), and
              the Data Privacy Act (RA 10173). Any disputes shall be resolved first through
              good-faith negotiation. If unresolved, disputes shall be submitted to the exclusive
              jurisdiction of the appropriate courts of Quezon City, Metro Manila.
            </Text>
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

          {/* Footer notice */}
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
                  Questions About These Terms?
                </Text>
                <Text size="sm" c="dimmed" style={{ lineHeight: 1.6 }}>
                  If you have questions or concerns about these Terms of Service, contact us at{" "}
                  <Text component="a" href="mailto:hello@magiccollar.ph" c="red.5" size="sm">
                    hello@magiccollar.ph
                  </Text>{" "}
                  or message us on Messenger. Magic Collar reserves the right to modify these Terms
                  at any time. Registered users will be notified of material changes via email.
                  Continued use of our services after the effective date of changes constitutes your
                  acceptance of the revised Terms.
                </Text>
              </Stack>
            </Group>
          </Card>
        </Stack>
      </Container>
    </Box>
  );
};

export default TermsOfServicePage;
