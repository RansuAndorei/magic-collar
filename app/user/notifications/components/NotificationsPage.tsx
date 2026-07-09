"use client";

import { insertError } from "@/app/actions";
import { useNotificationActions, useUnreadNotificationCount } from "@/stores/useNotificationStore";
import { useUserData } from "@/stores/useUserStore";
import { NOTIFICATION_CONFIG } from "@/utils/constants";
import { isAppError } from "@/utils/functions";
import { supabaseClient } from "@/utils/supabase/client";
import { NotificationTableRow } from "@/utils/types";
import {
  Badge,
  Box,
  Button,
  Container,
  Flex,
  Group,
  LoadingOverlay,
  Pagination,
  Paper,
  SegmentedControl,
  Stack,
  Text,
  ThemeIcon,
  Title,
  rem,
} from "@mantine/core";
import { notifications as toastNotifications } from "@mantine/notifications";
import { IconBell, IconBellRinging, IconCheck, IconExternalLink } from "@tabler/icons-react";
import dayjs from "dayjs";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

const NOTIFICATION_PAGE_SIZE = 10;

type FilterValue = "ALL" | "UNREAD";

const DEFAULT_NOTIFICATION_CONFIG = {
  title: "Notification",
  color: "gray",
  icon: IconBellRinging,
};

const getNotificationConfig = (notificationType: string) =>
  NOTIFICATION_CONFIG[notificationType as keyof typeof NOTIFICATION_CONFIG] ??
  DEFAULT_NOTIFICATION_CONFIG;

const NotificationsPage = () => {
  const router = useRouter();
  const pathname = usePathname();
  const userData = useUserData();
  const pageTopRef = useRef<HTMLDivElement>(null);
  const unreadNotificationCount = useUnreadNotificationCount();
  const { readNotification, readAllNotifications, setUnreadNotification } =
    useNotificationActions();

  const [notificationList, setNotificationList] = useState<NotificationTableRow[]>([]);
  const [filter, setFilter] = useState<FilterValue>("ALL");
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isFetching, setIsFetching] = useState(true);
  const [isMarkingAllRead, setIsMarkingAllRead] = useState(false);

  const totalPages = Math.ceil(totalCount / NOTIFICATION_PAGE_SIZE);
  const isInitialLoading = isFetching && notificationList.length === 0;

  if (totalPages > 0 && page > totalPages) {
    setPage(totalPages);
  }

  const fetchNotifications = useCallback(async () => {
    if (!userData) return;

    setIsFetching(true);
    try {
      const from = (page - 1) * NOTIFICATION_PAGE_SIZE;
      let query = supabaseClient
        .from("notification_table")
        .select("*", { count: "exact" })
        .eq("notification_user_id", userData.id)
        .order("notification_date_created", { ascending: false });

      if (filter === "UNREAD") {
        query = query.eq("notification_is_read", false);
      }

      const { data, error, count } = await query.range(from, from + NOTIFICATION_PAGE_SIZE - 1);
      if (error) throw error;

      setNotificationList(data ?? []);
      setTotalCount(count ?? 0);
    } catch (e) {
      toastNotifications.show({
        message: "Unable to load notifications right now.",
        color: "red",
      });

      if (isAppError(e)) {
        await insertError(supabaseClient, {
          errorTableInsert: {
            error_message: e.message,
            error_url: pathname,
            error_function: "fetchNotifications",
            error_user_email: userData.email,
            error_user_id: userData.id,
          },
        });
      }
    } finally {
      setIsFetching(false);
    }
  }, [filter, page, pathname, userData]);

  useEffect(() => {
    // eslint-disable-next-line
    fetchNotifications();
  }, [fetchNotifications]);

  const handleFilterChange = (value: string) => {
    setFilter(value as FilterValue);
    setPage(1);
    setIsFetching(true);
  };

  const handlePageChange = (nextPage: number) => {
    if (nextPage === page) return;
    setPage(nextPage);
    setIsFetching(true);
    window.requestAnimationFrame(() => {
      pageTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  const handleNotificationClick = async (notification: NotificationTableRow) => {
    if (!userData) return;

    if (!notification.notification_is_read) {
      readNotification([notification.notification_id]);
      setNotificationList((currentNotifications) =>
        currentNotifications.map((currentNotification) =>
          currentNotification.notification_id === notification.notification_id
            ? { ...currentNotification, notification_is_read: true }
            : currentNotification,
        ),
      );

      const { error } = await supabaseClient
        .from("notification_table")
        .update({ notification_is_read: true })
        .eq("notification_id", notification.notification_id)
        .eq("notification_user_id", userData.id);

      if (error) {
        toastNotifications.show({
          message: "Unable to update notification right now.",
          color: "red",
        });
      }
    }

    if (notification.notification_redirect_url) {
      router.push(notification.notification_redirect_url);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!userData || unreadNotificationCount === 0) return;

    setIsMarkingAllRead(true);
    readAllNotifications();
    setNotificationList((currentNotifications) =>
      currentNotifications.map((notification) => ({
        ...notification,
        notification_is_read: true,
      })),
    );

    const { error } = await supabaseClient
      .from("notification_table")
      .update({ notification_is_read: true })
      .eq("notification_user_id", userData.id)
      .eq("notification_is_read", false);

    if (error) {
      toastNotifications.show({
        message: "Unable to mark notifications as read right now.",
        color: "red",
      });
    } else {
      setUnreadNotification(0);
      if (filter === "UNREAD") {
        setNotificationList([]);
        setTotalCount(0);
      }
    }

    setIsMarkingAllRead(false);
  };

  return (
    <Box ref={pageTopRef} py={{ base: rem(32), md: rem(56) }}>
      <Container size="md">
        <Stack gap="xl">
          <Group justify="space-between" align="flex-end">
            <Stack gap={4}>
              <Text size="sm" c="red.5" fw={700} tt="uppercase">
                Account
              </Text>
              <Title order={1} style={{ fontSize: rem(34), fontWeight: 800 }}>
                Notifications
              </Title>
              <Text c="dimmed">Review order updates, account alerts, and payment reminders.</Text>
            </Stack>

            <Button
              leftSection={<IconCheck size={16} />}
              variant="light"
              color="gray"
              loading={isMarkingAllRead}
              disabled={unreadNotificationCount === 0}
              onClick={handleMarkAllAsRead}
            >
              Mark all as read
            </Button>
          </Group>

          <Group justify="space-between">
            <SegmentedControl
              value={filter}
              onChange={handleFilterChange}
              data={[
                { value: "ALL", label: "All" },
                { value: "UNREAD", label: "Unread" },
              ]}
            />

            <Text size="sm" c="dimmed">
              {isInitialLoading
                ? "Loading notifications..."
                : totalCount === 0
                  ? "No notifications found"
                  : `Showing ${(page - 1) * NOTIFICATION_PAGE_SIZE + 1}-${Math.min(
                      page * NOTIFICATION_PAGE_SIZE,
                      totalCount,
                    )} of ${totalCount} notifications`}
            </Text>
          </Group>

          <Box pos="relative">
            <LoadingOverlay
              visible={isFetching}
              overlayProps={{ radius: "sm", blur: 2 }}
              loaderProps={{ color: "red" }}
            />

            {isInitialLoading ? (
              <Stack gap="sm">
                {Array.from({ length: 4 }).map((_, index) => (
                  <Paper key={index} withBorder p="lg">
                    <Stack gap="xs">
                      <Box h={12} w="28%" bg="var(--mantine-color-default-hover)" />
                      <Box h={16} w="70%" bg="var(--mantine-color-default-hover)" />
                      <Box h={12} w="42%" bg="var(--mantine-color-default-hover)" />
                    </Stack>
                  </Paper>
                ))}
              </Stack>
            ) : totalCount === 0 ? (
              <Paper withBorder p="xl">
                <Stack align="center" gap="sm">
                  <IconBell size={32} color="var(--mantine-color-dimmed)" />
                  <Text fw={700}>You are all caught up.</Text>
                  <Text size="sm" c="dimmed" ta="center">
                    New account and order updates will appear here.
                  </Text>
                </Stack>
              </Paper>
            ) : (
              <Stack gap="sm" style={{ opacity: isFetching ? 0.55 : 1 }}>
                {notificationList.map((notification) => {
                  const isRead = notification.notification_is_read;
                  const config = getNotificationConfig(notification.notification_type);
                  const Icon = config.icon;

                  return (
                    <Paper
                      key={notification.notification_id}
                      withBorder
                      p="lg"
                      component="button"
                      onClick={() => handleNotificationClick(notification)}
                      style={{
                        textAlign: "left",
                        cursor: "pointer",
                        borderLeft: isRead ? undefined : "3px solid var(--mantine-color-red-6)",
                        background: isRead ? undefined : "var(--mantine-color-default-hover)",
                      }}
                    >
                      <Group gap="sm" wrap="nowrap" align="flex-start">
                        <ThemeIcon
                          variant="light"
                          color={config.color}
                          size="lg"
                          radius="xl"
                          style={{ flexShrink: 0 }}
                        >
                          <Icon size={18} />
                        </ThemeIcon>

                        <Stack gap="xs" style={{ flex: 1, minWidth: 0 }}>
                          <Group gap="xs" justify="space-between">
                            <Group gap="xs">
                              <Badge variant="light" color={config.color} size="sm">
                                {config.title}
                              </Badge>
                              {!isRead ? (
                                <Badge variant="filled" color="red" size="sm">
                                  New
                                </Badge>
                              ) : null}
                            </Group>
                            <Text size="xs" c="dimmed">
                              {dayjs(notification.notification_date_created).format(
                                "MMM D, YYYY h:mm A",
                              )}
                            </Text>
                          </Group>

                          <Text fw={isRead ? 500 : 700}>{notification.notification_content}</Text>

                          {notification.notification_redirect_url ? (
                            <Group gap={6}>
                              <IconExternalLink size={14} color="var(--mantine-color-dimmed)" />
                              <Text size="sm" c="dimmed">
                                Open related page
                              </Text>
                            </Group>
                          ) : null}
                        </Stack>
                      </Group>
                    </Paper>
                  );
                })}

                {totalPages > 1 ? (
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
                ) : null}
              </Stack>
            )}
          </Box>
        </Stack>
      </Container>
    </Box>
  );
};

export default NotificationsPage;
