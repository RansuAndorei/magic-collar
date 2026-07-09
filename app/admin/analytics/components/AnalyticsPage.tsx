"use client";

import { insertError } from "@/app/actions";
import StatusBadge from "@/app/user/orders/components/StatusBadge";
import { useUserData } from "@/stores/useUserStore";
import {
  formatCurrency,
  formatStatusLabel,
  getBatchStatusColor,
  getBatchStatusDescription,
  getOrderStatusColor,
  getOrderStatusDescription,
  getPaymentStatusColor,
  getPaymentStatusDescription,
  isAppError,
} from "@/utils/functions";
import { supabaseClient } from "@/utils/supabase/client";
import { AdminAnalyticsDashboard } from "@/utils/types";
import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Card,
  Center,
  Grid,
  Group,
  Paper,
  Progress,
  RingProgress,
  SimpleGrid,
  Skeleton,
  Stack,
  Table,
  Text,
  ThemeIcon,
  Title,
  Tooltip,
  rem,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
  IconAlertTriangle,
  IconArrowRight,
  IconChartBar,
  IconClipboardList,
  IconCreditCard,
  IconMapPin,
  IconPackage,
  IconPhotoScan,
  IconRefresh,
  IconShoppingBag,
  IconTrendingUp,
} from "@tabler/icons-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { getAdminAnalyticsDashboard } from "../actions";

const emptyDashboard: AdminAnalyticsDashboard = {
  generatedAt: new Date().toISOString(),
  summary: {
    pendingProofs: 0,
    todayOrders: 0,
    monthOrders: 0,
    orderedValueMonth: 0,
    collectedValueMonth: 0,
    outstandingValue: 0,
    activeBatches: 0,
    lowStockCount: 0,
  },
  salesTrend: [],
  orderStatus: [],
  paymentStatus: [],
  fulfillment: [],
  batchStatus: [],
  activeBatches: [],
  topCollars: [],
  lowStockCollars: [],
  paymentProofs: [],
  geography: [],
  actionItems: [],
};

const numberFormatter = new Intl.NumberFormat("en-PH");

const percent = (value: number, total: number) => {
  if (!total) return 0;
  return Math.round((value / total) * 100);
};

const SummaryCard = ({
  label,
  value,
  detail,
  icon: Icon,
  color = "red",
}: {
  label: string;
  value: string;
  detail: string;
  icon: typeof IconChartBar;
  color?: string;
}) => (
  <Card withBorder p="md">
    <Group justify="space-between" align="flex-start" wrap="nowrap">
      <Stack gap={4} miw={0}>
        <Text size="sm" c="dimmed" fw={700}>
          {label}
        </Text>
        <Title order={3} style={{ lineHeight: 1.1 }}>
          {value}
        </Title>
        <Text size="xs" c="dimmed">
          {detail}
        </Text>
      </Stack>
      <ThemeIcon color={color} variant="light" size={42} radius="md">
        <Icon size={22} />
      </ThemeIcon>
    </Group>
  </Card>
);

const LoadingState = () => (
  <Stack gap="xl">
    <SimpleGrid cols={{ base: 1, sm: 2, xl: 4 }} spacing="md">
      {Array.from({ length: 4 }).map((_, index) => (
        <Skeleton key={index} h={124} radius="md" />
      ))}
    </SimpleGrid>
    <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="md">
      <Skeleton h={340} radius="md" />
      <Skeleton h={340} radius="md" />
    </SimpleGrid>
  </Stack>
);

const AnalyticsPage = () => {
  const userData = useUserData();
  const pathname = usePathname();

  const [dashboard, setDashboard] = useState<AdminAnalyticsDashboard>(emptyDashboard);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadDashboard = useCallback(
    async (mode: "initial" | "refresh" = "initial") => {
      if (!userData) return;

      if (mode === "initial") setLoading(true);
      if (mode === "refresh") setRefreshing(true);

      try {
        const result = await getAdminAnalyticsDashboard(supabaseClient, {
          months: 6,
          topLimit: 5,
          lowStockThreshold: 5,
        });
        setDashboard(result);
      } catch (e) {
        notifications.show({
          message: "Something went wrong while loading analytics.",
          color: "red",
        });
        if (isAppError(e)) {
          await insertError(supabaseClient, {
            errorTableInsert: {
              error_message: e.message,
              error_url: pathname,
              error_function: "loadAdminAnalyticsDashboard",
              error_user_email: userData.email,
              error_user_id: userData.id,
            },
          });
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [pathname, userData],
  );

  useEffect(() => {
    // eslint-disable-next-line
    loadDashboard();
  }, [loadDashboard]);

  const orderStatusTotal = useMemo(
    () => dashboard.orderStatus.reduce((total, item) => total + item.count, 0),
    [dashboard.orderStatus],
  );

  const paymentStatusTotal = useMemo(
    () => dashboard.paymentStatus.reduce((total, item) => total + item.count, 0),
    [dashboard.paymentStatus],
  );

  const maxSalesValue = useMemo(
    () =>
      Math.max(
        1,
        ...dashboard.salesTrend.map((item) =>
          Math.max(Number(item.orderedValue), Number(item.collectedValue)),
        ),
      ),
    [dashboard.salesTrend],
  );

  const collectionRate = percent(
    dashboard.summary.collectedValueMonth,
    dashboard.summary.orderedValueMonth,
  );

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
            Live sales, fulfillment, batch, payment, and inventory signals from your workflow.
          </Text>
        </Stack>

        <Tooltip label="Refresh analytics" withArrow>
          <ActionIcon
            visibleFrom="sm"
            size="lg"
            variant="light"
            onClick={() => loadDashboard("refresh")}
            loading={refreshing}
          >
            <IconRefresh size={18} />
          </ActionIcon>
        </Tooltip>
      </Group>

      {loading ? (
        <LoadingState />
      ) : (
        <>
          <SimpleGrid cols={{ base: 1, sm: 2, xl: 4 }} spacing="md">
            <SummaryCard
              label="Pending Proofs"
              value={numberFormatter.format(dashboard.summary.pendingProofs)}
              detail="Need payment review"
              icon={IconPhotoScan}
              color="orange"
            />
            <SummaryCard
              label="Collected This Month"
              value={formatCurrency(dashboard.summary.collectedValueMonth, {
                minimumFractionDigits: 0,
              })}
              detail={`${collectionRate}% of ordered value`}
              icon={IconCreditCard}
              color="green"
            />
            <SummaryCard
              label="Month Orders"
              value={numberFormatter.format(dashboard.summary.monthOrders)}
              detail={`${numberFormatter.format(dashboard.summary.todayOrders)} created today`}
              icon={IconShoppingBag}
              color="red"
            />
            <SummaryCard
              label="Active Batches"
              value={numberFormatter.format(dashboard.summary.activeBatches)}
              detail={`${numberFormatter.format(dashboard.summary.lowStockCount)} stock alerts`}
              icon={IconClipboardList}
              color="blue"
            />
          </SimpleGrid>

          <Grid gap="md">
            <Grid.Col span={{ base: 12, lg: 3 }}>
              <Paper withBorder radius="md" p="md" h="100%">
                <Stack gap="md">
                  <Group gap="xs">
                    <ThemeIcon color="orange" variant="light" radius="sm">
                      <IconAlertTriangle size={16} />
                    </ThemeIcon>
                    <Title order={2} size="h4">
                      Action Queue
                    </Title>
                  </Group>
                  <Stack gap="sm">
                    {dashboard.actionItems.map((item) => (
                      <Button
                        key={item.label}
                        component={Link}
                        href={item.href}
                        variant="light"
                        color={item.tone}
                        justify="space-between"
                        rightSection={<IconArrowRight size={16} />}
                        fullWidth
                      >
                        <Group justify="space-between" w="100%" wrap="nowrap">
                          <Text size="sm" fw={700} truncate="end">
                            {item.label}
                          </Text>
                          <Badge color={item.tone} variant="filled">
                            {numberFormatter.format(item.value)}
                          </Badge>
                        </Group>
                      </Button>
                    ))}
                  </Stack>
                </Stack>
              </Paper>
            </Grid.Col>

            <Grid.Col span={{ base: 12, lg: 9 }}>
              <Paper withBorder radius="md" p="md" h="100%">
                <Group justify="space-between" mb="md">
                  <Box>
                    <Group gap="xs">
                      <ThemeIcon color="green" variant="light" radius="sm">
                        <IconTrendingUp size={16} />
                      </ThemeIcon>
                      <Title order={2} size="h4">
                        Sales and Collection Trend
                      </Title>
                    </Group>
                    <Text size="sm" c="dimmed" mt={4}>
                      Ordered value compared with verified cash collected.
                    </Text>
                  </Box>
                  <Badge color="green" variant="light">
                    6 months
                  </Badge>
                </Group>

                <Stack gap="md">
                  {dashboard.salesTrend.map((item) => (
                    <Box key={item.month}>
                      <Group justify="space-between" mb={6} gap="xs">
                        <Text size="sm" fw={800}>
                          {item.month}
                        </Text>
                        <Text size="xs" c="dimmed">
                          {numberFormatter.format(item.orderCount)} orders
                        </Text>
                      </Group>
                      <Stack gap={5}>
                        <Progress
                          value={(Number(item.orderedValue) / maxSalesValue) * 100}
                          color="red"
                          radius="xl"
                        />
                        <Progress
                          value={(Number(item.collectedValue) / maxSalesValue) * 100}
                          color="green"
                          radius="xl"
                        />
                      </Stack>
                      <Group justify="space-between" mt={4}>
                        <Text size="xs" c="red.5">
                          Ordered {formatCurrency(item.orderedValue, { minimumFractionDigits: 0 })}
                        </Text>
                        <Text size="xs" c="green.5">
                          Collected{" "}
                          {formatCurrency(item.collectedValue, { minimumFractionDigits: 0 })}
                        </Text>
                      </Group>
                    </Box>
                  ))}
                </Stack>
              </Paper>
            </Grid.Col>
          </Grid>

          <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="md">
            <Paper withBorder radius="md" p="md">
              <Group justify="space-between" mb="md">
                <Title order={2} size="h4">
                  Order Pipeline
                </Title>
                <Badge color="red" variant="light">
                  {numberFormatter.format(orderStatusTotal)} orders
                </Badge>
              </Group>
              <Stack gap="sm">
                {dashboard.orderStatus.map((item) => (
                  <Box key={item.status}>
                    <Group justify="space-between" mb={4}>
                      <StatusBadge
                        label={item.status}
                        color={getOrderStatusColor(item.status)}
                        description={getOrderStatusDescription(item.status)}
                        size="sm"
                      />
                      <Text size="sm" fw={800}>
                        {numberFormatter.format(item.count)}
                      </Text>
                    </Group>
                    <Progress
                      value={percent(item.count, orderStatusTotal)}
                      color={getOrderStatusColor(item.status)}
                      radius="xl"
                    />
                  </Box>
                ))}
              </Stack>
            </Paper>

            <Paper withBorder radius="md" p="md">
              <Group justify="space-between" mb="md">
                <Title order={2} size="h4">
                  Payment Pipeline
                </Title>
                <Badge color="green" variant="light">
                  {formatCurrency(dashboard.summary.outstandingValue, {
                    minimumFractionDigits: 0,
                  })}{" "}
                  outstanding
                </Badge>
              </Group>
              <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                <Center>
                  <RingProgress
                    size={168}
                    thickness={18}
                    roundCaps
                    sections={dashboard.paymentStatus.map((item) => ({
                      value: percent(item.count, paymentStatusTotal),
                      color: getPaymentStatusColor(item.status),
                    }))}
                    label={
                      <Text ta="center" fw={800}>
                        {numberFormatter.format(paymentStatusTotal)}
                        <Text size="xs" c="dimmed">
                          orders
                        </Text>
                      </Text>
                    }
                  />
                </Center>
                <Stack gap="sm" justify="center">
                  {dashboard.paymentStatus.map((item) => (
                    <Group key={item.status} justify="space-between" wrap="nowrap">
                      <StatusBadge
                        label={formatStatusLabel(item.status)}
                        color={getPaymentStatusColor(item.status)}
                        description={getPaymentStatusDescription(item.status)}
                        size="sm"
                        variant="dot"
                      />
                      <Text size="sm" fw={800}>
                        {numberFormatter.format(item.count)}
                      </Text>
                    </Group>
                  ))}
                </Stack>
              </SimpleGrid>
            </Paper>
          </SimpleGrid>

          <SimpleGrid cols={{ base: 1, xl: 2 }} spacing="md">
            <Paper withBorder radius="md" p="md">
              <Group justify="space-between" mb="md">
                <Group gap="xs">
                  <ThemeIcon color="blue" variant="light" radius="sm">
                    <IconClipboardList size={16} />
                  </ThemeIcon>
                  <Title order={2} size="h4">
                    Active Batches
                  </Title>
                </Group>
                <Button
                  component={Link}
                  href="/admin/batches"
                  variant="subtle"
                  size="xs"
                  rightSection={<IconArrowRight size={14} />}
                >
                  View batches
                </Button>
              </Group>
              <Table.ScrollContainer minWidth={560}>
                <Table verticalSpacing="sm">
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Batch</Table.Th>
                      <Table.Th>Status</Table.Th>
                      <Table.Th>Fill</Table.Th>
                      <Table.Th>Age</Table.Th>
                      <Table.Th ta="right">Value</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {dashboard.activeBatches.map((batch) => (
                      <Table.Tr key={batch.batchId}>
                        <Table.Td fw={800}>#{batch.batchNumber}</Table.Td>
                        <Table.Td>
                          <StatusBadge
                            label={batch.status}
                            color={getBatchStatusColor(batch.status)}
                            description={getBatchStatusDescription(batch.status)}
                            size="sm"
                          />
                        </Table.Td>
                        <Table.Td>
                          <Stack gap={2}>
                            <Progress value={batch.fillPercent} radius="xl" />
                            <Text size="xs" c="dimmed">
                              {numberFormatter.format(batch.quantity)} items
                            </Text>
                          </Stack>
                        </Table.Td>
                        <Table.Td>{numberFormatter.format(batch.ageDays)}d</Table.Td>
                        <Table.Td ta="right" fw={800}>
                          {formatCurrency(batch.value, { minimumFractionDigits: 0 })}
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </Table.ScrollContainer>
            </Paper>

            <Paper withBorder radius="md" p="md">
              <Group justify="space-between" mb="md">
                <Group gap="xs">
                  <ThemeIcon color="red" variant="light" radius="sm">
                    <IconPackage size={16} />
                  </ThemeIcon>
                  <Title order={2} size="h4">
                    Demand and Stock
                  </Title>
                </Group>
                <Button
                  component={Link}
                  href="/admin/cars-magic-collars"
                  variant="subtle"
                  size="xs"
                  rightSection={<IconArrowRight size={14} />}
                >
                  View catalog
                </Button>
              </Group>
              <Table.ScrollContainer minWidth={560}>
                <Table verticalSpacing="sm">
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Top Collar</Table.Th>
                      <Table.Th>Sold</Table.Th>
                      <Table.Th>Stock</Table.Th>
                      <Table.Th ta="right">Revenue</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {dashboard.topCollars.map((collar) => (
                      <Table.Tr key={collar.carId}>
                        <Table.Td>
                          <Text fw={800}>{collar.vehicle}</Text>
                          <Text size="xs" c="dimmed">
                            MC-{collar.collarReferenceNumber ?? "N/A"}
                          </Text>
                        </Table.Td>
                        <Table.Td>{numberFormatter.format(collar.quantity)}</Table.Td>
                        <Table.Td>
                          <Badge color={collar.stock <= 5 ? "orange" : "green"} variant="light">
                            {numberFormatter.format(collar.stock)}
                          </Badge>
                        </Table.Td>
                        <Table.Td ta="right" fw={800}>
                          {formatCurrency(collar.revenue, { minimumFractionDigits: 0 })}
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </Table.ScrollContainer>
            </Paper>
          </SimpleGrid>

          <SimpleGrid cols={{ base: 1, lg: 3 }} spacing="md">
            <Paper withBorder radius="md" p="md">
              <Title order={2} size="h4" mb="md">
                Low Stock Alerts
              </Title>
              <Stack gap="sm">
                {dashboard.lowStockCollars.length === 0 ? (
                  <Text size="sm" c="dimmed">
                    No low stock collars right now.
                  </Text>
                ) : (
                  dashboard.lowStockCollars.map((collar) => (
                    <Group key={collar.carId} justify="space-between" wrap="nowrap">
                      <Box miw={0}>
                        <Text size="sm" fw={800} truncate="end">
                          {collar.vehicle}
                        </Text>
                        <Text size="xs" c="dimmed">
                          Demand 30d: {numberFormatter.format(collar.demand30Days)}
                        </Text>
                      </Box>
                      <Badge color="orange" variant="light">
                        Stock {numberFormatter.format(collar.stock)}
                      </Badge>
                    </Group>
                  ))
                )}
              </Stack>
            </Paper>

            <Paper withBorder radius="md" p="md">
              <Title order={2} size="h4" mb="md">
                Payment Proofs
              </Title>
              <Stack gap="sm">
                {dashboard.paymentProofs.map((proof) => (
                  <Group key={proof.status} justify="space-between" wrap="nowrap">
                    <Box>
                      <Badge
                        color={
                          proof.status === "APPROVED"
                            ? "green"
                            : proof.status === "REJECTED"
                              ? "red"
                              : "yellow"
                        }
                        variant="light"
                      >
                        {formatStatusLabel(proof.status)}
                      </Badge>
                      <Text size="xs" c="dimmed" mt={4}>
                        {numberFormatter.format(proof.count)} uploads
                      </Text>
                    </Box>
                    <Text size="sm" fw={800}>
                      {formatCurrency(proof.amount, { minimumFractionDigits: 0 })}
                    </Text>
                  </Group>
                ))}
              </Stack>
            </Paper>

            <Paper withBorder radius="md" p="md">
              <Group gap="xs" mb="md">
                <ThemeIcon color="grape" variant="light" radius="sm">
                  <IconMapPin size={16} />
                </ThemeIcon>
                <Title order={2} size="h4">
                  Top Locations
                </Title>
              </Group>
              <Stack gap="sm">
                {dashboard.geography.map((place) => (
                  <Group
                    key={`${place.city}-${place.province}`}
                    justify="space-between"
                    wrap="nowrap"
                  >
                    <Box miw={0}>
                      <Text size="sm" fw={800} truncate="end">
                        {place.city}
                      </Text>
                      <Text size="xs" c="dimmed" truncate="end">
                        {place.province}
                      </Text>
                    </Box>
                    <Badge color="grape" variant="light">
                      {numberFormatter.format(place.orderCount)}
                    </Badge>
                  </Group>
                ))}
              </Stack>
            </Paper>
          </SimpleGrid>
        </>
      )}
    </Stack>
  );
};

export default AnalyticsPage;
