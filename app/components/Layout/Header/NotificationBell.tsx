"use client";

import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Group,
  Indicator,
  Loader,
  Menu,
  ScrollArea,
  Stack,
  Text,
  ThemeIcon,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconBell, IconBellRinging, IconCheck, IconExternalLink } from "@tabler/icons-react";
import dayjs from "dayjs";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import {
  fetchHeaderNotifications,
  insertError,
  readAllUnreadNotifications,
  readSingleNotification,
} from "@/app/actions";
import {
  useNotificationActions,
  useNotificationList,
  useUnreadNotificationCount,
} from "@/stores/useNotificationStore";
import { useUserData } from "@/stores/useUserStore";
import { NOTIFICATION_CONFIG, NOTIFICATION_LIMIT } from "@/utils/constants";
import { isAppError } from "@/utils/functions";
import { supabaseClient } from "@/utils/supabase/client";

const DEFAULT_NOTIFICATION_CONFIG = {
  title: "Notification",
  color: "gray",
  icon: IconBellRinging,
};

const getNotificationConfig = (notificationType: string) =>
  NOTIFICATION_CONFIG[notificationType as keyof typeof NOTIFICATION_CONFIG] ??
  DEFAULT_NOTIFICATION_CONFIG;

const NotificationBell = () => {
  const router = useRouter();
  const pathname = usePathname();
  const userData = useUserData();
  const notificationList = useNotificationList();
  const unreadNotificationCount = useUnreadNotificationCount();
  const {
    setNotificationList,
    setUnreadNotification,
    readNotification,
    readAllNotifications,
    reset,
  } = useNotificationActions();
  const [isLoading, setIsLoading] = useState(false);
  const [isMarkingAllRead, setIsMarkingAllRead] = useState(false);

  useEffect(() => {
    if (!userData) {
      reset();
      return;
    }
    let isMounted = true;
    const fetchNotifications = async () => {
      setIsLoading(true);
      try {
        const { data, count } = await fetchHeaderNotifications(supabaseClient, {
          userId: userData.id,
          limit: NOTIFICATION_LIMIT,
        });
        if (!isMounted) return;

        setNotificationList(data);
        setUnreadNotification(count);
      } catch (e) {
        notifications.show({
          message: "Something went wrong. Please try again later",
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
        setIsLoading(false);
      }
    };
    fetchNotifications();
    return () => {
      isMounted = false;
    };
  }, [reset, setNotificationList, setUnreadNotification, userData]);

  const handleNotificationClick = async (notificationId: string, redirectUrl: string | null) => {
    if (!userData) return;

    readNotification([notificationId]);
    if (redirectUrl && redirectUrl !== pathname) {
      router.push(redirectUrl);
    }

    try {
      await readSingleNotification(supabaseClient, { notificationId });
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
            error_function: "handleNotificationClick",
            error_user_email: userData.email,
            error_user_id: userData.id,
          },
        });
      }
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!userData || unreadNotificationCount === 0) return;

    try {
      setIsMarkingAllRead(true);
      readAllNotifications();
      await readAllUnreadNotifications(supabaseClient, { userId: userData.id });
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
            error_function: "handleMarkAllAsRead",
            error_user_email: userData.email,
            error_user_id: userData.id,
          },
        });
      }
    } finally {
      setIsMarkingAllRead(false);
    }
  };

  return (
    <Menu width={360} position="bottom-end" shadow="md" withinPortal>
      <Menu.Target>
        <Indicator
          disabled={unreadNotificationCount === 0}
          label={unreadNotificationCount > 99 ? "99+" : unreadNotificationCount}
          size={18}
        >
          <ActionIcon size="lg" variant="light" aria-label="Open notifications">
            <IconBell size={16} />
          </ActionIcon>
        </Indicator>
      </Menu.Target>

      <Menu.Dropdown>
        <Group justify="space-between" px="sm" py="xs">
          <Text fw={700} size="sm">
            Notifications
          </Text>
          <Group gap="xs">
            {isLoading ? <Loader size="xs" /> : null}
            <Button
              size="compact-xs"
              variant="subtle"
              color="gray"
              leftSection={<IconCheck size={12} />}
              loading={isMarkingAllRead}
              disabled={unreadNotificationCount === 0}
              onClick={handleMarkAllAsRead}
            >
              Mark all read
            </Button>
          </Group>
        </Group>
        <Menu.Divider />

        {notificationList.length === 0 ? (
          <Box px="sm" py="lg">
            <Text size="sm" c="dimmed" ta="center">
              No notifications yet.
            </Text>
          </Box>
        ) : (
          <ScrollArea.Autosize mah={420} type="auto">
            {notificationList.map((notification) => {
              const isRead = notification.notification_is_read;
              const config = getNotificationConfig(notification.notification_type);
              const Icon = config.icon;

              const content = (
                <Group gap="sm" wrap="nowrap" align="flex-start">
                  <ThemeIcon
                    variant="light"
                    color={config.color}
                    size="md"
                    radius="xl"
                    style={{ flexShrink: 0 }}
                  >
                    <Icon size={14} />
                  </ThemeIcon>
                  <Stack gap="xs" style={{ flex: 1, minWidth: 0 }}>
                    <Group gap="xs" justify="space-between" wrap="nowrap">
                      <Badge variant="light" color={config.color} size="xs">
                        {config.title}
                      </Badge>
                      <Text size="xs" c="dimmed" style={{ whiteSpace: "nowrap" }}>
                        {dayjs(notification.notification_date_created).format("MMM D, h:mm A")}
                      </Text>
                    </Group>
                    <Text size="sm" fw={isRead ? 400 : 700} lineClamp={2}>
                      {notification.notification_content}
                    </Text>
                  </Stack>
                </Group>
              );

              return (
                <Menu.Item
                  key={notification.notification_id}
                  onClick={(event) => {
                    event.preventDefault();
                    handleNotificationClick(
                      notification.notification_id,
                      notification.notification_redirect_url,
                    );
                  }}
                  style={{
                    borderLeft: isRead ? undefined : "3px solid var(--mantine-color-red-6)",
                    borderRadius: 0,
                  }}
                >
                  {content}
                </Menu.Item>
              );
            })}
          </ScrollArea.Autosize>
        )}
        <Menu.Divider />
        <Menu.Item component={Link} href="/user/notifications">
          <Group align="center" justify="center" gap="xs">
            <IconExternalLink size={14} />
            <Text size="sm" c="dimmed">
              View all notifications
            </Text>
          </Group>
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
};

export default NotificationBell;
