"use client";

import { insertError } from "@/app/actions";
import TableColumnVisibility, {
  TableColumnVisibilityOption,
} from "@/app/admin/components/TableColumnVisibility";
import StatusBadge from "@/app/user/orders/components/StatusBadge";
import { useUserData } from "@/stores/useUserStore";
import {
  FULFILLMENT_OPTIONS,
  ORDER_STATUS_OPTIONS,
  PAGINATION_OPTIONS,
  PAYMENT_STATUS_OPTIONS,
  TEXT_LIMITS,
} from "@/utils/constants";
import {
  formatCurrency,
  formatDate,
  formatStatusLabel,
  getOrderStatusColor,
  getOrderStatusDescription,
  getPaymentStatusColor,
  getPaymentStatusDescription,
  isAppError,
} from "@/utils/functions";
import { supabaseClient } from "@/utils/supabase/client";
import {
  AdminOrder,
  AdminOrderSortAccessor,
  AdminSortStatus,
  OrderFulfillmentEnum,
  OrderPaymentStatusEnum,
  OrderStatusEnum,
} from "@/utils/types";
import {
  ActionIcon,
  Badge,
  Box,
  Group,
  Paper,
  Select,
  Stack,
  Text,
  TextInput,
  ThemeIcon,
  Title,
  rem,
} from "@mantine/core";
import { useDebouncedValue } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { IconMaximize, IconSearch, IconShoppingBag } from "@tabler/icons-react";
import { DataTableColumn } from "mantine-datatable";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { getAdminOrdersPage } from "../actions";
import AdminOrderTable from "./AdminOrderTable";

const sortableColumns = new Set<AdminOrderSortAccessor>([
  "order_date_created",
  "order_number",
  "order_status",
  "order_payment_status",
]);

const orderColumnOptions: TableColumnVisibilityOption[] = [
  { value: "order_number", label: "Order" },
  { value: "customer", label: "Customer" },
  { value: "items", label: "Items" },
  { value: "order_status", label: "Order Status" },
  { value: "order_payment_status", label: "Payment" },
  { value: "fulfillment", label: "Fulfillment" },
  { value: "total", label: "Total" },
  { value: "view", label: "View" },
];

const AdminOrdersPage = () => {
  const userData = useUserData();
  const pathname = usePathname();
  const router = useRouter();

  const [records, setRecords] = useState<AdminOrder[]>([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [searchInput, setSearchInput] = useState("");
  const [search] = useDebouncedValue(searchInput, 400);
  const [orderStatus, setOrderStatus] = useState<OrderStatusEnum | "ALL">("ALL");
  const [paymentStatus, setPaymentStatus] = useState<OrderPaymentStatusEnum | "ALL">("ALL");
  const [fulfillment, setFulfillment] = useState<OrderFulfillmentEnum | "ALL">("ALL");
  const [page, setPage] = useState(1);
  const [recordsPerPage, setRecordsPerPage] = useState(PAGINATION_OPTIONS[0]);
  const [fetching, setFetching] = useState(false);
  const [sortStatus, setSortStatus] = useState<AdminSortStatus<AdminOrderSortAccessor>>({
    columnAccessor: "order_number",
    direction: "desc",
  });
  const [visibleColumns, setVisibleColumns] = useState(
    orderColumnOptions.map((column) => column.value),
  );

  useEffect(() => {
    setPage(1);
  }, [fulfillment, orderStatus, paymentStatus, search]);

  const loadOrders = useCallback(async () => {
    if (!userData) return;

    setFetching(true);
    try {
      const result = await getAdminOrdersPage(supabaseClient, {
        page,
        recordsPerPage,
        search,
        orderStatus,
        paymentStatus,
        fulfillment,
        sortColumnAccessor: sortStatus.columnAccessor,
        sortDirection: sortStatus.direction,
      });
      setRecords(result.records);
      setTotalRecords(result.totalRecords);
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
            error_function: "loadAdminOrders",
            error_user_email: userData.email,
            error_user_id: userData.id,
          },
        });
      }
    } finally {
      setFetching(false);
    }
  }, [
    fulfillment,
    orderStatus,
    page,
    pathname,
    paymentStatus,
    recordsPerPage,
    search,
    sortStatus,
    userData,
  ]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const handleRecordsPerPageChange = useCallback((value: number) => {
    setRecordsPerPage(value);
    setPage(1);
  }, []);

  const handleSortStatusChange = useCallback(
    (nextSortStatus: { columnAccessor: string; direction: "asc" | "desc" }) => {
      if (!sortableColumns.has(nextSortStatus.columnAccessor as AdminOrderSortAccessor)) return;

      setSortStatus({
        columnAccessor: nextSortStatus.columnAccessor as AdminOrderSortAccessor,
        direction: nextSortStatus.direction,
      });
      setPage(1);
    },
    [],
  );

  const columns = useMemo<DataTableColumn<AdminOrder>[]>(
    () => [
      {
        accessor: "order_number",
        title: "Order",
        sortable: true,
        render: (order) => (
          <Box>
            <Text fw={800}>#{order.order_number}</Text>
            <Text size="xs" c="dimmed">
              {formatDate(new Date(order.order_date_created))}
            </Text>
          </Box>
        ),
      },
      {
        accessor: "customer",
        title: "Customer",
        render: (order) => (
          <Box>
            <Text fw={700}>
              {order.order_user.user_first_name} {order.order_user.user_last_name}
            </Text>
            <Text size="xs" c="dimmed">
              {order.order_user.user_email}
            </Text>
          </Box>
        ),
      },
      {
        accessor: "items",
        title: "Items",
        render: (order) => {
          return <Text fw={700}>{order.order_item_count}</Text>;
        },
      },
      {
        accessor: "order_status",
        title: "Order Status",
        sortable: true,
        render: (order) => (
          <StatusBadge
            label={order.order_status}
            color={getOrderStatusColor(order.order_status)}
            description={getOrderStatusDescription(order.order_status)}
            size="sm"
          />
        ),
      },
      {
        accessor: "order_payment_status",
        title: "Payment",
        sortable: true,
        render: (order) => (
          <StatusBadge
            label={formatStatusLabel(order.order_payment_status)}
            color={getPaymentStatusColor(order.order_payment_status)}
            description={getPaymentStatusDescription(order.order_payment_status)}
            size="sm"
            variant="dot"
          />
        ),
      },
      {
        accessor: "fulfillment",
        title: "Fulfillment",
        render: (order) => (
          <Badge color={order.order_fulfillment === "DELIVERY" ? "blue" : "grape"} variant="light">
            {formatStatusLabel(order.order_fulfillment)}
          </Badge>
        ),
      },
      {
        accessor: "total",
        title: "Total",
        textAlign: "right",
        render: (order) => (
          <Text fw={800} c="red.5">
            {formatCurrency(order.order_total, { minimumFractionDigits: 0 })}
          </Text>
        ),
      },
      {
        accessor: "view",
        title: "View",
        textAlign: "right",
        render: (order) => (
          <ActionIcon
            variant="light"
            onClick={() => router.push(`/admin/orders/${order.order_number}`)}
          >
            <IconMaximize size={14} />
          </ActionIcon>
        ),
      },
    ],
    [],
  );

  const visibleTableColumns = useMemo(
    () => columns.filter((column) => visibleColumns.includes(String(column.accessor))),
    [columns, visibleColumns],
  );

  return (
    <Stack flex={1} gap="xl" miw={0}>
      <Stack gap={4}>
        <Text size="sm" c="red.5" fw={800} tt="uppercase">
          Fulfillment
        </Text>
        <Title order={1} style={{ fontSize: rem(34), fontWeight: 800 }}>
          Orders
        </Title>
        <Text c="dimmed">
          View all customer orders, filter by workflow state, and sort the order list.
        </Text>
      </Stack>

      <Paper withBorder p="md" radius="md">
        <Group justify="space-between" align="flex-end" mb="md">
          <Box>
            <Group gap="xs">
              <ThemeIcon color="red" variant="light" radius="md">
                <IconShoppingBag size={18} />
              </ThemeIcon>
              <Title order={2} size="h3">
                Order List
              </Title>
            </Group>
            <Text size="sm" c="dimmed" mt={4}>
              {totalRecords} records found
            </Text>
          </Box>
        </Group>

        <Group mb="md" align="flex-end">
          <TextInput
            w={{ base: "100%", md: 340 }}
            leftSection={<IconSearch size={16} />}
            placeholder="Search order number, name, or email"
            label="Search"
            value={searchInput}
            onChange={(event) => setSearchInput(event.currentTarget.value)}
            maxLength={TEXT_LIMITS.medium}
          />
          <Select
            w={{ base: "100%", sm: 180 }}
            data={ORDER_STATUS_OPTIONS}
            value={orderStatus}
            label="Order Status"
            allowDeselect={false}
            onChange={(value) => setOrderStatus((value as OrderStatusEnum | "ALL") ?? "ALL")}
          />
          <Select
            w={{ base: "100%", sm: 180 }}
            data={PAYMENT_STATUS_OPTIONS}
            value={paymentStatus}
            label="Payment Status"
            allowDeselect={false}
            onChange={(value) =>
              setPaymentStatus((value as OrderPaymentStatusEnum | "ALL") ?? "ALL")
            }
          />
          <Select
            w={{ base: "100%", sm: 180 }}
            data={FULFILLMENT_OPTIONS}
            value={fulfillment}
            label="Fulfillment"
            allowDeselect={false}
            onChange={(value) => setFulfillment((value as OrderFulfillmentEnum | "ALL") ?? "ALL")}
          />
          <TableColumnVisibility
            columns={orderColumnOptions}
            visibleColumns={visibleColumns}
            onChange={setVisibleColumns}
          />
        </Group>

        <AdminOrderTable
          records={records}
          totalRecords={totalRecords}
          recordsPerPage={recordsPerPage}
          recordsPerPageOptions={PAGINATION_OPTIONS}
          page={page}
          fetching={fetching}
          sortStatus={sortStatus}
          columns={visibleTableColumns}
          onPageChange={setPage}
          onRecordsPerPageChange={handleRecordsPerPageChange}
          onSortStatusChange={handleSortStatusChange}
        />
      </Paper>
    </Stack>
  );
};

export default AdminOrdersPage;
