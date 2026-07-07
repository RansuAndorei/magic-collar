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
  IconDatabase,
  IconDeviceDesktop,
  IconEye,
  IconLock,
  IconMail,
  IconRefresh,
  IconShield,
  IconUser,
  IconUserCheck,
  IconWorld,
} from "@tabler/icons-react";

const DATA_COLLECTED = [
  {
    icon: IconUser,
    label: "Personal Information",
    items: ["Full name", "Email address", "Phone number", "Shipping & billing address"],
  },
  {
    icon: IconDatabase,
    label: "Order Information",
    items: [
      "Products purchased",
      "Order history",
      "Payment method (not card details)",
      "Delivery status",
    ],
  },
  {
    icon: IconDeviceDesktop,
    label: "Technical Data",
    items: ["IP address", "Browser type & version", "Pages visited", "Time spent on site"],
  },
  {
    icon: IconWorld,
    label: "Communication Data",
    items: [
      "Messages sent via contact form",
      "Messenger conversations",
      "Email correspondence",
      "Support inquiries",
    ],
  },
];

const DATA_USAGE = [
  {
    icon: IconShield,
    label: "Process Your Orders",
    description:
      "To fulfill purchases, arrange shipping, send order confirmations, and provide delivery updates.",
  },
  {
    icon: IconUserCheck,
    label: "Manage Your Account",
    description:
      "To create and maintain your account, authenticate your identity, and manage your preferences.",
  },
  {
    icon: IconMail,
    label: "Customer Support",
    description:
      "To respond to your inquiries, resolve complaints, and provide after-sales assistance.",
  },
  {
    icon: IconEye,
    label: "Improve Our Services",
    description:
      "To analyze site usage, understand customer behavior, and improve our product listings and user experience.",
  },
  {
    icon: IconRefresh,
    label: "Marketing Communications",
    description:
      "To send you promotions, new product announcements, and reseller updates — only if you have opted in.",
  },
  {
    icon: IconLock,
    label: "Legal Compliance",
    description: "To comply with applicable Philippine laws, regulations, and legal obligations.",
  },
];

const YOUR_RIGHTS = [
  {
    right: "Right to Access",
    description: "You may request a copy of the personal data we hold about you at any time.",
  },
  {
    right: "Right to Correction",
    description: "You may ask us to correct inaccurate or incomplete personal information.",
  },
  {
    right: "Right to Erasure",
    description:
      "You may request deletion of your personal data, subject to our legal retention obligations.",
  },
  {
    right: "Right to Object",
    description:
      "You may object to the processing of your data for direct marketing purposes at any time.",
  },
  {
    right: "Right to Data Portability",
    description: "You may request your personal data in a structured, machine-readable format.",
  },
  {
    right: "Right to Withdraw Consent",
    description:
      "Where processing is based on consent, you may withdraw it at any time without affecting prior processing.",
  },
];

const FAQS = [
  {
    question: "Do you sell my personal data to third parties?",
    answer:
      "No. We do not sell, rent, or trade your personal information to any third party for their marketing purposes. We only share data with trusted service providers who help us operate our business (e.g., couriers, payment processors) and only to the extent necessary.",
  },
  {
    question: "How do you protect my payment information?",
    answer:
      "We do not store your credit card or debit card details on our servers. All payment transactions are processed through secure, PCI-DSS compliant payment gateways. We only retain your chosen payment method type (e.g., GCash, credit card) for reference.",
  },
  {
    question: "Do you use cookies?",
    answer:
      "Yes. We use essential cookies to keep your session active and remember your cart. We also use analytics cookies to understand how visitors use our site. You may disable non-essential cookies in your browser settings, though this may affect some features.",
  },
  {
    question: "How long do you keep my data?",
    answer:
      "We retain your personal data for as long as your account is active or as needed to provide services. Order records are kept for 7 years in compliance with Philippine tax and accounting regulations. You may request earlier deletion for data not subject to legal retention.",
  },
  {
    question: "What happens to my data if I delete my account?",
    answer:
      "Upon account deletion, we will remove your personal profile and preferences. Order history and transaction records may be retained for the legally required period. Anonymized, aggregated data (not linked to you) may be retained for analytics.",
  },
  {
    question: "Do you transfer data outside the Philippines?",
    answer:
      "Some of our third-party service providers (e.g., cloud hosting, analytics tools) may process data outside the Philippines. We ensure these providers maintain adequate data protection standards consistent with the Philippine Data Privacy Act of 2012.",
  },
  {
    question: "How can I opt out of marketing emails?",
    answer:
      "Every marketing email we send includes an unsubscribe link at the bottom. You may also contact us directly at hello@magiccollar.ph or through our contact form to opt out. Note that transactional emails (order confirmations, shipping updates) cannot be opted out of.",
  },
  {
    question: "Who can I contact about my data privacy concerns?",
    answer:
      "You may reach our Data Privacy Officer at privacy@magiccollar.ph. For formal complaints, you may also contact the National Privacy Commission of the Philippines at complaints@privacy.gov.ph.",
  },
];

const PrivacyPolicyPage = () => {
  return (
    <Box py={{ base: rem(60), md: rem(80) }}>
      <Container size="md">
        <Stack gap={rem(48)}>
          {/* Header */}
          <Stack gap="sm" style={{ textAlign: "center" }}>
            <Badge color="red" variant="light" size="lg" radius="sm" mx="auto">
              Privacy Policy
            </Badge>
            <Title
              order={1}
              style={{ fontSize: rem(40), fontWeight: 800, letterSpacing: "-0.02em" }}
            >
              Your Privacy Matters to Us
            </Title>
            <Text c="dimmed" size="lg" maw={520} mx="auto">
              Magic Collar is committed to protecting your personal information in accordance with
              the Philippine Data Privacy Act of 2012 (Republic Act No. 10173).
            </Text>
            <Text size="xs" c="dimmed" mt="xs">
              Last updated: June 2026
            </Text>
          </Stack>

          <Divider />

          {/* Scope */}
          <Stack gap="md">
            <Title order={2} style={{ fontSize: rem(22), fontWeight: 700 }}>
              Scope of This Policy
            </Title>
            <Text size="sm" c="dimmed" style={{ lineHeight: 1.8 }}>
              This Privacy Policy applies to all personal data collected by Magic Collar Car Parts
              through our website, mobile app, social media pages, and any other interaction you
              have with us — whether as a retail buyer, reseller, or visitor. By using our services,
              you acknowledge that you have read and understood this policy.
            </Text>
          </Stack>

          <Divider />

          {/* Data We Collect */}
          <Stack gap="md">
            <Stack gap={4}>
              <Title order={2} style={{ fontSize: rem(22), fontWeight: 700 }}>
                Data We Collect
              </Title>
              <Text size="sm" c="dimmed">
                We only collect data that is necessary to provide and improve our services.
              </Text>
            </Stack>
            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
              {DATA_COLLECTED.map(({ icon: Icon, label, items }) => (
                <Card key={label} withBorder radius="md" p="lg">
                  <Group gap="md" mb="sm" align="center">
                    <ThemeIcon
                      size={40}
                      radius="md"
                      color="red"
                      variant="light"
                      style={{ flexShrink: 0 }}
                    >
                      <Icon size={20} />
                    </ThemeIcon>
                    <Text fw={600} size="sm">
                      {label}
                    </Text>
                  </Group>
                  <Stack gap={6}>
                    {items.map((item) => (
                      <Group key={item} gap="xs" align="center">
                        <Box
                          w={5}
                          h={5}
                          style={{
                            borderRadius: "50%",
                            background: "var(--mantine-color-red-5)",
                            flexShrink: 0,
                          }}
                        />
                        <Text size="sm" c="dimmed">
                          {item}
                        </Text>
                      </Group>
                    ))}
                  </Stack>
                </Card>
              ))}
            </SimpleGrid>
          </Stack>

          <Divider />

          {/* How We Use Your Data */}
          <Stack gap="md">
            <Stack gap={4}>
              <Title order={2} style={{ fontSize: rem(22), fontWeight: 700 }}>
                How We Use Your Data
              </Title>
              <Text size="sm" c="dimmed">
                Your data is used only for legitimate business purposes.
              </Text>
            </Stack>
            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
              {DATA_USAGE.map(({ icon: Icon, label, description }) => (
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

          {/* Data Sharing */}
          <Stack gap="md">
            <Title order={2} style={{ fontSize: rem(22), fontWeight: 700 }}>
              Data Sharing
            </Title>
            <Text size="sm" c="dimmed" style={{ lineHeight: 1.8 }}>
              We do not sell your personal data. We may share it only with the following trusted
              parties, strictly for the purpose of operating our business:
            </Text>
            <Stack gap="sm">
              {[
                {
                  label: "Courier Partners",
                  detail: "J&T Express, Ninja Van, LBC, Lalamove — for delivery purposes only.",
                },
                {
                  label: "Payment Processors",
                  detail: "GCash, PayMaya, credit card processors — for secure payment handling.",
                },
                {
                  label: "Cloud & Hosting Providers",
                  detail: "For secure storage and operation of our platform.",
                },
                {
                  label: "Analytics Services",
                  detail: "Aggregated, anonymized data to improve site performance.",
                },
                {
                  label: "Legal Authorities",
                  detail: "When required by law, court order, or government regulation.",
                },
              ].map(({ label, detail }) => (
                <Card key={label} withBorder radius="md" p="md">
                  <Group gap="sm" align="flex-start">
                    <Box
                      w={6}
                      h={6}
                      mt={6}
                      style={{
                        borderRadius: "50%",
                        background: "var(--mantine-color-red-5)",
                        flexShrink: 0,
                      }}
                    />
                    <Text size="sm" style={{ lineHeight: 1.6 }}>
                      <Text component="span" fw={600}>
                        {label}:{" "}
                      </Text>
                      <Text component="span" c="dimmed">
                        {detail}
                      </Text>
                    </Text>
                  </Group>
                </Card>
              ))}
            </Stack>
          </Stack>

          <Divider />

          {/* Your Rights */}
          <Stack gap="md">
            <Stack gap={4}>
              <Title order={2} style={{ fontSize: rem(22), fontWeight: 700 }}>
                Your Rights Under the Data Privacy Act
              </Title>
              <Text size="sm" c="dimmed">
                As a data subject under Philippine law, you have the following rights.
              </Text>
            </Stack>
            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
              {YOUR_RIGHTS.map(({ right, description }) => (
                <Card key={right} withBorder radius="md" p="lg">
                  <Stack gap={4}>
                    <Group gap="xs">
                      <ThemeIcon size={20} radius="xl" color="red" variant="light">
                        <IconUserCheck size={12} />
                      </ThemeIcon>
                      <Text fw={600} size="sm">
                        {right}
                      </Text>
                    </Group>
                    <Text size="sm" c="dimmed" style={{ lineHeight: 1.6 }}>
                      {description}
                    </Text>
                  </Stack>
                </Card>
              ))}
            </SimpleGrid>
            <Text size="sm" c="dimmed">
              To exercise any of these rights, contact our Data Privacy Officer at{" "}
              <Text component="a" href="mailto:privacy@magiccollar.ph" c="red.5" size="sm">
                privacy@magiccollar.ph
              </Text>
              . We will respond within 15 business days.
            </Text>
          </Stack>

          <Divider />

          {/* Data Security */}
          <Stack gap="md">
            <Title order={2} style={{ fontSize: rem(22), fontWeight: 700 }}>
              Data Security
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
                  <IconLock size={20} />
                </ThemeIcon>
                <Text size="sm" c="dimmed" style={{ lineHeight: 1.8 }}>
                  We implement appropriate technical and organizational security measures to protect
                  your personal data against unauthorized access, alteration, disclosure, or
                  destruction. These include SSL/TLS encryption for data in transit, hashed
                  passwords, access controls, and regular security reviews. However, no method of
                  transmission over the internet is 100% secure, and we encourage you to use a
                  strong, unique password for your account.
                </Text>
              </Group>
            </Card>
          </Stack>

          <Divider />

          {/* Children's Privacy */}
          <Stack gap="md">
            <Title order={2} style={{ fontSize: rem(22), fontWeight: 700 }}>
              Children&apos;s Privacy
            </Title>
            <Text size="sm" c="dimmed" style={{ lineHeight: 1.8 }}>
              Our services are not directed to individuals under the age of 18. We do not knowingly
              collect personal data from minors. If you believe a minor has provided us with
              personal information, please contact us immediately and we will delete it promptly.
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

          {/* Contact DPO */}
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
                  Questions or Concerns?
                </Text>
                <Text size="sm" c="dimmed" style={{ lineHeight: 1.6 }}>
                  If you have any questions about this Privacy Policy or how we handle your data,
                  contact our Data Privacy Officer at{" "}
                  <Text component="a" href="mailto:privacy@magiccollar.ph" c="red.5" size="sm">
                    privacy@magiccollar.ph
                  </Text>
                  . You may also file a complaint with the{" "}
                  <Text
                    component="a"
                    href="https://www.privacy.gov.ph"
                    target="_blank"
                    rel="noopener noreferrer"
                    c="red.5"
                    size="sm"
                  >
                    National Privacy Commission
                  </Text>{" "}
                  if you believe your rights have been violated.
                </Text>
                <Text size="xs" c="dimmed" mt="xs">
                  Magic Collar reserves the right to update this policy. Changes will be posted on
                  this page with a revised date. Continued use of our services after changes
                  constitutes acceptance of the updated policy.
                </Text>
              </Stack>
            </Group>
          </Card>
        </Stack>
      </Container>
    </Box>
  );
};

export default PrivacyPolicyPage;
