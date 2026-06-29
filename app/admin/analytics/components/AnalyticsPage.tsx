"use client";

import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Card,
  Group,
  Paper,
  Progress,
  ScrollArea,
  SimpleGrid,
  Stack,
  Table,
  Tabs,
  Text,
  ThemeIcon,
  Title,
  Tooltip,
  rem,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
  IconBuildingStore,
  IconCar,
  IconCheck,
  IconClipboardCheck,
  IconClock,
  IconCreditCard,
  IconDatabase,
  IconPhotoScan,
  IconPlus,
  IconX,
} from "@tabler/icons-react";

const summaryCards = [
  { label: "Pending Proofs", value: "6", detail: "Needs payment review", icon: IconPhotoScan },
  { label: "Monthly Sales", value: "₱428K", detail: "+18% from last month", icon: IconCreditCard },
  { label: "Top Collar", value: "Civic FC", detail: "184 orders this quarter", icon: IconCar },
  { label: "Avg Batch Fill", value: "4.8d", detail: "1.2d faster than target", icon: IconClock },
];

const mostOrderedRows = [
  ["Honda Civic FC", "MC-HON-CIV-FC", "184", "31%"],
  ["Toyota Vios XP150", "MC-TOY-VIO-150", "141", "24%"],
  ["Mitsubishi Montero", "MC-MIT-MON-19", "88", "15%"],
  ["Ford Everest", "MC-FOR-EVE-22", "63", "11%"],
];

const salesRows = [
  ["January", "₱318,400", 64],
  ["February", "₱346,900", 69],
  ["March", "₱392,200", 78],
  ["April", "₱371,500", 74],
  ["May", "₱428,000", 85],
  ["June", "₱286,700", 57],
] as const;

const batchRows = [
  ["Batch MC-0618-A", "72 collars", "3.2 days", 82],
  ["Batch MC-0615-B", "64 collars", "4.7 days", 69],
  ["Batch MC-0611-C", "90 collars", "6.1 days", 54],
] as const;

const proofRows = [
  ["MC-2026-0618-0042", "Ana Reyes", "GCash", "₱4,850", "Uploaded 18 min ago"],
  ["MC-2026-0618-0039", "Carlo Santos", "Maya", "₱7,200", "Uploaded 42 min ago"],
  ["MC-2026-0617-0127", "Mika Tan", "Bank transfer", "₱3,950", "Uploaded 2 hr ago"],
];

const workflowCards = [
  {
    label: "Catalog CRUD",
    description: "Cars, Magic Collars, makes, models, and stock quantities.",
    icon: IconDatabase,
  },
  {
    label: "Order Workflow",
    description: "Order item statuses, delivery setup, couriers, and pickup.",
    icon: IconClipboardCheck,
  },
  {
    label: "Business Details",
    description: "Pickup addresses, email, phone, and Messenger channels.",
    icon: IconBuildingStore,
  },
];

const AnalyticsPage = () => {
  const handleProofDecision = (decision: "approved" | "rejected", orderNumber: string) => {
    notifications.show({
      message: `Payment proof for ${orderNumber} marked as ${decision}.`,
      color: decision === "approved" ? "green" : "red",
    });
  };

  return (
    <Stack flex={1} gap="xl" miw={0}>
      <Group justify="space-between" align="flex-end" gap="md">
        <Stack gap={4}>
          <Text size="sm" c="red.5" fw={800} tt="uppercase">
            Analytics
          </Text>
          <Title order={1} style={{ fontSize: rem(34), fontWeight: 800 }}>
            Operations Dashboard
          </Title>
          <Text c="dimmed">
            Track demand, monthly sales, batch fill speed, and payment proof decisions.
          </Text>
        </Stack>

        <Button visibleFrom="sm" leftSection={<IconPlus size={16} />}>
          New record
        </Button>
      </Group>

      <SimpleGrid cols={{ base: 1, sm: 2, xl: 4 }} spacing="md">
        {summaryCards.map(({ label, value, detail, icon: Icon }) => (
          <Card key={label} withBorder p="md">
            <Group justify="space-between" align="flex-start" wrap="nowrap">
              <Stack gap={4}>
                <Text size="sm" c="dimmed" fw={700}>
                  {label}
                </Text>
                <Title order={3}>{value}</Title>
                <Text size="xs" c="dimmed">
                  {detail}
                </Text>
              </Stack>
              <ThemeIcon color="red" variant="light" size={42} radius="md">
                <Icon size={22} />
              </ThemeIcon>
            </Group>
          </Card>
        ))}
      </SimpleGrid>

      <Tabs defaultValue="most-ordered" variant="outline" radius="md">
        <ScrollArea type="never">
          <Tabs.List style={{ minWidth: rem(680) }}>
            <Tabs.Tab value="most-ordered" leftSection={<IconCar size={16} />}>
              Most Ordered
            </Tabs.Tab>
            <Tabs.Tab value="sales" leftSection={<IconCreditCard size={16} />}>
              Sales Per Month
            </Tabs.Tab>
            <Tabs.Tab value="batch-fill" leftSection={<IconClock size={16} />}>
              Batch Fill Time
            </Tabs.Tab>
          </Tabs.List>
        </ScrollArea>

        <Tabs.Panel value="most-ordered" pt="md">
          <Paper withBorder p="md" radius="md">
            <Group justify="space-between" mb="md">
              <Box>
                <Title order={3} size="h4">
                  Most Ordered Car Magic Collar
                </Title>
                <Text size="sm" c="dimmed">
                  Highest-demand fitments for planning inventory and production batches.
                </Text>
              </Box>
              <Badge color="red" variant="light">
                Last 90 days
              </Badge>
            </Group>
            <Table.ScrollContainer minWidth={620}>
              <Table verticalSpacing="sm">
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Vehicle</Table.Th>
                    <Table.Th>SKU</Table.Th>
                    <Table.Th>Orders</Table.Th>
                    <Table.Th>Demand Share</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {mostOrderedRows.map(([vehicle, sku, orders, share]) => (
                    <Table.Tr key={sku}>
                      <Table.Td fw={700}>{vehicle}</Table.Td>
                      <Table.Td>{sku}</Table.Td>
                      <Table.Td>{orders}</Table.Td>
                      <Table.Td>
                        <Group gap="sm" wrap="nowrap">
                          <Progress value={Number.parseInt(share, 10)} w={120} />
                          <Text size="sm">{share}</Text>
                        </Group>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Table.ScrollContainer>
          </Paper>
        </Tabs.Panel>

        <Tabs.Panel value="sales" pt="md">
          <Paper withBorder p="md" radius="md">
            <Title order={3} size="h4">
              Sales Per Month
            </Title>
            <Text size="sm" c="dimmed" mb="md">
              Monthly paid order value for sales pacing and reseller demand checks.
            </Text>
            <Stack gap="md">
              {salesRows.map(([month, amount, value]) => (
                <Box key={month}>
                  <Group justify="space-between" mb={4}>
                    <Text size="sm" fw={700}>
                      {month}
                    </Text>
                    <Text size="sm">{amount}</Text>
                  </Group>
                  <Progress value={value} color="red" radius="xl" />
                </Box>
              ))}
            </Stack>
          </Paper>
        </Tabs.Panel>

        <Tabs.Panel value="batch-fill" pt="md">
          <SimpleGrid cols={{ base: 1, md: 3 }} spacing="md">
            {batchRows.map(([batch, size, time, fill]) => (
              <Paper key={batch} withBorder p="md" radius="md">
                <Stack gap="sm">
                  <Group justify="space-between" wrap="nowrap">
                    <Text fw={800}>{batch}</Text>
                    <Badge color="blue" variant="light">
                      {size}
                    </Badge>
                  </Group>
                  <Text size="sm" c="dimmed">
                    Time allotted before batch is full
                  </Text>
                  <Title order={3}>{time}</Title>
                  <Progress value={fill} color={fill > 75 ? "green" : "yellow"} radius="xl" />
                </Stack>
              </Paper>
            ))}
          </SimpleGrid>
        </Tabs.Panel>
      </Tabs>

      <Paper withBorder p="md" radius="md">
        <Group justify="space-between" mb="md" align="flex-start">
          <Box>
            <Group gap="xs">
              <ThemeIcon color="red" variant="light" radius="md">
                <IconPhotoScan size={18} />
              </ThemeIcon>
              <Title order={2} size="h3">
                Payment Proof Review
              </Title>
            </Group>
            <Text size="sm" c="dimmed" mt="xs">
              Approve valid customer uploads to continue fulfillment, or reject them for correction.
            </Text>
          </Box>
          <Badge color="yellow" variant="light" size="lg">
            {proofRows.length} pending
          </Badge>
        </Group>

        <Table.ScrollContainer minWidth={780}>
          <Table verticalSpacing="sm">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Order</Table.Th>
                <Table.Th>Customer</Table.Th>
                <Table.Th>Method</Table.Th>
                <Table.Th>Amount</Table.Th>
                <Table.Th>Uploaded</Table.Th>
                <Table.Th>Proof</Table.Th>
                <Table.Th>Decision</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {proofRows.map(([order, customer, method, amount, uploaded]) => (
                <Table.Tr key={order}>
                  <Table.Td fw={700}>{order}</Table.Td>
                  <Table.Td>{customer}</Table.Td>
                  <Table.Td>{method}</Table.Td>
                  <Table.Td>{amount}</Table.Td>
                  <Table.Td>{uploaded}</Table.Td>
                  <Table.Td>
                    <Button size="xs" variant="light" leftSection={<IconPhotoScan size={14} />}>
                      View
                    </Button>
                  </Table.Td>
                  <Table.Td>
                    <Group gap="xs" wrap="nowrap">
                      <Tooltip label="Approve proof">
                        <ActionIcon
                          color="green"
                          variant="light"
                          aria-label={`Approve payment proof for ${order}`}
                          onClick={() => handleProofDecision("approved", order)}
                        >
                          <IconCheck size={16} />
                        </ActionIcon>
                      </Tooltip>
                      <Tooltip label="Reject proof">
                        <ActionIcon
                          color="red"
                          variant="light"
                          aria-label={`Reject payment proof for ${order}`}
                          onClick={() => handleProofDecision("rejected", order)}
                        >
                          <IconX size={16} />
                        </ActionIcon>
                      </Tooltip>
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      </Paper>

      <SimpleGrid cols={{ base: 1, md: 3 }} spacing="md">
        {workflowCards.map(({ label, description, icon: Icon }) => (
          <Paper key={label} withBorder p="md" radius="md">
            <Group align="flex-start" wrap="nowrap">
              <ThemeIcon color="red" variant="light" radius="md">
                <Icon size={18} />
              </ThemeIcon>
              <Box>
                <Text fw={800}>{label}</Text>
                <Text size="sm" c="dimmed">
                  {description}
                </Text>
              </Box>
            </Group>
          </Paper>
        ))}
      </SimpleGrid>
    </Stack>
  );
};

export default AnalyticsPage;
