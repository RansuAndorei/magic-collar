"use client";

import { insertError } from "@/app/actions";
import { useUserData } from "@/stores/useUserStore";
import {
  ORDER_PAGE_SIZE,
  ORDER_PREFERENCES_STORAGE_KEY,
  ORDER_STATUS_OPTIONS,
  PAYMENT_STATUS_OPTIONS,
} from "@/utils/constants";
import { isAppError } from "@/utils/functions";
import { supabaseClient } from "@/utils/supabase/client";
import { OrderPaymentStatusEnum, OrderStatusEnum, OrderWithOrderItemType } from "@/utils/types";
import {
  Box,
  Container,
  Flex,
  LoadingOverlay,
  Pagination,
  rem,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { useDebouncedValue } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { getCustomerOrderList } from "../actions";

import Filters from "./Filters";
import InitialLoading from "./InitialLoading";
import NoOrders from "./NoOrders";
import OrderItem from "./OrderItem";

type OrderPreferences = {
  search: string;
  orderStatus: OrderStatusEnum | "ALL";
  paymentStatus: OrderPaymentStatusEnum | "ALL";
};

const DEFAULT_PREFERENCES: OrderPreferences = {
  search: "",
  orderStatus: "ALL",
  paymentStatus: "ALL",
};

const ORDER_STATUS_VALUES = new Set(ORDER_STATUS_OPTIONS.map(({ value }) => value));
const PAYMENT_STATUS_VALUES = new Set(PAYMENT_STATUS_OPTIONS.map(({ value }) => value));

const parseStoredPreferences = (value: string | null): OrderPreferences => {
  if (!value) return DEFAULT_PREFERENCES;

  try {
    const parsed = JSON.parse(value) as Partial<OrderPreferences>;
    return {
      search: typeof parsed.search === "string" ? parsed.search : DEFAULT_PREFERENCES.search,
      orderStatus:
        typeof parsed.orderStatus === "string" && ORDER_STATUS_VALUES.has(parsed.orderStatus)
          ? (parsed.orderStatus as OrderStatusEnum | "ALL")
          : DEFAULT_PREFERENCES.orderStatus,
      paymentStatus:
        typeof parsed.paymentStatus === "string" && PAYMENT_STATUS_VALUES.has(parsed.paymentStatus)
          ? (parsed.paymentStatus as OrderPaymentStatusEnum | "ALL")
          : DEFAULT_PREFERENCES.paymentStatus,
    };
  } catch {
    return DEFAULT_PREFERENCES;
  }
};

const OrderListPage = () => {
  const pathname = usePathname();
  const userData = useUserData();
  const pageTopRef = useRef<HTMLDivElement>(null);
  const hasHandledInitialPageScrollRef = useRef(false);

  const [orderList, setOrderList] = useState<OrderWithOrderItemType[]>([]);
  const [search, setSearch] = useState("");
  const [debouncedSearch] = useDebouncedValue(search, 300);
  const [orderStatus, setOrderStatus] = useState<OrderStatusEnum | "ALL">("ALL");
  const [paymentStatus, setPaymentStatus] = useState<OrderPaymentStatusEnum | "ALL">("ALL");
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [hasLoadedPreferences, setHasLoadedPreferences] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  const totalPages = Math.ceil(totalCount / ORDER_PAGE_SIZE);
  const isInitialLoading = !hasLoadedPreferences || (isFetching && orderList.length === 0);

  useEffect(() => {
    const preferences = parseStoredPreferences(
      window.localStorage.getItem(ORDER_PREFERENCES_STORAGE_KEY),
    );

    setSearch(preferences.search);
    setOrderStatus(preferences.orderStatus);
    setPaymentStatus(preferences.paymentStatus);
    setHasLoadedPreferences(true);
  }, []);

  useEffect(() => {
    if (!hasLoadedPreferences) return;

    window.localStorage.setItem(
      ORDER_PREFERENCES_STORAGE_KEY,
      JSON.stringify({ search, orderStatus, paymentStatus }),
    );
  }, [hasLoadedPreferences, orderStatus, paymentStatus, search]);

  const fetchOrderList = useCallback(async () => {
    if (!hasLoadedPreferences || !userData) return;

    setIsFetching(true);
    try {
      const from = (page - 1) * ORDER_PAGE_SIZE;
      const response = await getCustomerOrderList(supabaseClient, {
        userId: userData.id,
        index: from,
        limit: ORDER_PAGE_SIZE,
        search: debouncedSearch.trim(),
        orderStatus,
        paymentStatus,
      });

      setOrderList(response?.orders ?? []);
      setTotalCount(response?.totalCount ?? 0);
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
            error_function: "handleAuthCallback",
            error_user_email: userData.email,
            error_user_id: userData.id,
          },
        });
      }
    } finally {
      setIsFetching(false);
    }
  }, [debouncedSearch, hasLoadedPreferences, orderStatus, page, paymentStatus, userData]);

  useEffect(() => {
    fetchOrderList();
  }, [fetchOrderList]);

  useEffect(() => {
    if (totalPages > 0 && page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const scrollToTop = useCallback(() => {
    window.requestAnimationFrame(() => {
      pageTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      document.documentElement.scrollTo({ top: 0, behavior: "smooth" });
      document.body.scrollTo({ top: 0, behavior: "smooth" });
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }, []);

  useEffect(() => {
    if (!hasLoadedPreferences) return;

    if (!hasHandledInitialPageScrollRef.current) {
      hasHandledInitialPageScrollRef.current = true;
      return;
    }

    scrollToTop();
  }, [hasLoadedPreferences, page, scrollToTop]);

  const handlePageChange = (nextPage: number) => {
    if (nextPage === page) return;
    setPage(nextPage);
    setIsFetching(true);
  };

  return (
    <Box ref={pageTopRef} py={{ base: rem(32), md: rem(56) }}>
      <Container size="lg">
        <Stack gap="xl">
          <Stack gap={4}>
            <Text size="sm" c="red.5" fw={700} tt="uppercase">
              My Orders
            </Text>
            <Title order={1} style={{ fontSize: rem(34), fontWeight: 800 }}>
              Order History
            </Title>
            <Text c="dimmed">Track your Magic Collar orders and fitment details.</Text>
          </Stack>

          <Filters
            search={search}
            setSearch={setSearch}
            setPage={setPage}
            orderStatus={orderStatus}
            setOrderStatus={setOrderStatus}
            paymentStatus={paymentStatus}
            setPaymentStatus={setPaymentStatus}
          />

          <Text size="sm" c="dimmed">
            {isInitialLoading
              ? "Loading orders..."
              : totalCount === 0
                ? "No orders found"
                : `Showing ${(page - 1) * ORDER_PAGE_SIZE + 1}-${Math.min(
                    page * ORDER_PAGE_SIZE,
                    totalCount,
                  )} of ${totalCount} orders`}
          </Text>
          {isInitialLoading ? (
            <InitialLoading />
          ) : totalCount === 0 ? (
            <NoOrders />
          ) : (
            <Box pos="relative">
              <LoadingOverlay
                visible={isFetching}
                overlayProps={{ radius: "sm", blur: 2 }}
                loaderProps={{ color: "red" }}
              />
              <Stack gap="md" style={{ opacity: isFetching ? 0.55 : 1 }}>
                {orderList.map((order) => (
                  <OrderItem order={order} key={order.order_id} />
                ))}
                {totalPages > 1 && (
                  <Flex justify="center">
                    <Pagination
                      total={totalPages}
                      value={page}
                      onChange={handlePageChange}
                      color="red"
                      radius="md"
                      disabled={isFetching}
                    />
                  </Flex>
                )}
              </Stack>
            </Box>
          )}
        </Stack>
      </Container>
    </Box>
  );
};

export default OrderListPage;
