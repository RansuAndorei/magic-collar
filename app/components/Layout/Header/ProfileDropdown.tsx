import { insertError } from "@/app/actions";
import { useIsLoading, useLoadingActions } from "@/stores/useLoadingStore";
import { useUserData, useUserProfile } from "@/stores/useUserStore";
import { isAppError } from "@/utils/functions";
import { supabaseClient } from "@/utils/supabase/client";
import {
  Avatar,
  Box,
  Button,
  Group,
  Menu,
  Stack,
  Text,
  UnstyledButton,
  useComputedColorScheme,
  useMantineTheme,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconChevronDown, IconLogout, IconReceipt, IconUser } from "@tabler/icons-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const ProfileDropdown = () => {
  const pathname = usePathname();
  const router = useRouter();
  const isLoading = useIsLoading();
  const userData = useUserData();
  const userProfile = useUserProfile();
  const { setIsLoading } = useLoadingActions();
  const theme = useMantineTheme();
  const computedColorScheme = useComputedColorScheme();

  const isDark = computedColorScheme === "dark";

  const handleLogout = async () => {
    if (!userData) return;
    try {
      setIsLoading(true);
      await supabaseClient.auth.signOut();
      router.push("/");
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
            error_function: "handleLogout",
            error_user_email: userData.email,
            error_user_id: userData.id,
          },
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (pathname === "/user/onboarding") {
    return (
      <Button onClick={handleLogout} loading={isLoading}>
        Logout
      </Button>
    );
  } else if (userProfile && !pathname.includes("admin")) {
    return (
      <Menu shadow="md" width={200}>
        <Menu.Target>
          <UnstyledButton
            style={{
              padding: "6px 8px",
              borderRadius: "4px",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = isDark
                ? theme.colors.dark[6]
                : theme.colors.gray[1];
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
            }}
          >
            <Group gap="sm">
              <Avatar color="red" radius="xl" src={userProfile?.user_avatar}>
                {userProfile?.user_first_name[0].toUpperCase()}
                {userProfile?.user_last_name[0].toUpperCase()}
              </Avatar>

              <IconChevronDown size={14} />
            </Group>
          </UnstyledButton>
        </Menu.Target>

        <Menu.Dropdown>
          <Menu.Label>
            <Stack gap={4}>
              <Text size="sm" fw={500}>
                {userProfile?.user_first_name} {userProfile?.user_last_name}
              </Text>
              <Text size="xs" c="dimmed">
                {userProfile?.user_email}
              </Text>
            </Stack>
          </Menu.Label>

          <Menu.Divider />

          <Menu.Label>Menu</Menu.Label>
          <Menu.Item leftSection={<IconUser size={14} />} component={Link} href="/user/profile">
            Profile
          </Menu.Item>
          <Menu.Item leftSection={<IconReceipt size={14} />} component={Link} href="/user/order">
            Orders
          </Menu.Item>

          <Menu.Divider />

          <Menu.Item color="red" leftSection={<IconLogout size={14} />} onClick={handleLogout}>
            Logout
          </Menu.Item>
        </Menu.Dropdown>
      </Menu>
    );
  } else if (pathname.includes("admin") && userProfile) {
    return (
      <Menu shadow="md" width={200}>
        <Menu.Target>
          <UnstyledButton
            style={{
              padding: "6px 8px",
              borderRadius: "4px",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = isDark
                ? theme.colors.dark[6]
                : theme.colors.gray[1];
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
            }}
          >
            <Group gap="sm">
              <Avatar color="blue" radius="xl" src={userProfile?.user_avatar}>
                {userProfile?.user_first_name[0].toUpperCase()}
                {userProfile?.user_last_name[0].toUpperCase()}
              </Avatar>
              <Box visibleFrom="md">
                <Text size="sm" fw={500}>
                  {userProfile?.user_first_name} {userProfile?.user_last_name}
                </Text>
                <Text size="xs" c="dimmed">
                  {userProfile?.user_email}
                </Text>
              </Box>
              <IconChevronDown size={14} />
            </Group>
          </UnstyledButton>
        </Menu.Target>

        <Menu.Dropdown>
          <Menu.Item color="red" leftSection={<IconLogout size={14} />} onClick={handleLogout}>
            Logout
          </Menu.Item>
        </Menu.Dropdown>
      </Menu>
    );
  } else {
    return null;
  }
};

export default ProfileDropdown;
