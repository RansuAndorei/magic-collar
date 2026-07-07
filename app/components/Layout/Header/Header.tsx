"use client";

import { insertError } from "@/app/actions";
import { useLoadingActions } from "@/stores/useLoadingStore";
import { useUserData, useUserProfile } from "@/stores/useUserStore";
import { LOGO_PATH, NAV_LINKS } from "@/utils/constants";
import { isAppError } from "@/utils/functions";
import { supabaseClient } from "@/utils/supabase/client";
import { Box, Burger, Button, Container, Flex, Group, Stack, Text } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { memo, useEffect } from "react";
import AdminNavigationDrawer from "./AdminNavigationDrawer";
import ColorModeToggle from "./ColorModeToggle";
import MobileDrawer from "./MobileDrawer";
import ProfileDropdown from "./ProfileDropdown";

const Header = () => {
  const router = useRouter();
  const pathname = usePathname();
  const userData = useUserData();
  const userProfile = useUserProfile();
  const { setIsLoading } = useLoadingActions();

  const [opened, { open, close }] = useDisclosure(false);
  const [mobileNavOpened, { open: openMobileNav, close: closeMobileNav }] = useDisclosure(false);

  const isAdmin = userProfile?.user_role === "ADMIN";
  const isOnboarding = pathname === "/user/onboarding";
  const isAdminPath = pathname.startsWith("/admin");
  const isShopRoute = pathname.includes("/shop");

  const handleLogoClick = (e: React.MouseEvent) => {
    if (pathname === "/") {
      e.preventDefault();
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
  };

  useEffect(() => {
    close();
  }, [pathname]);

  const handleLogout = async () => {
    if (!userData) return;
    try {
      setIsLoading(true);
      await supabaseClient.auth.signOut();
      close();
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

  return (
    <Box
      component="header"
      style={{
        background: "var(--mantine-color-body)",
        borderBottom: "1px solid var(--mantine-color-default-border)",
        position: "sticky",
        top: 0,
        zIndex: 100,
      }}
    >
      <Container size="xl">
        <Flex h={64} align="center" justify="space-between">
          <Group>
            {isAdminPath ? (
              <Burger hiddenFrom="lg" opened={mobileNavOpened} onClick={openMobileNav} size={16} />
            ) : null}
            {/* Logo */}
            <Link
              href="/"
              onClick={handleLogoClick}
              style={{ textDecoration: "none", color: "inherit" }}
            >
              <Group gap="xs" style={{ cursor: "pointer" }}>
                <Image alt="logo" width={80} height={35} src={LOGO_PATH} priority />
                <Stack gap={0}>
                  <Text fw={700} size="sm" lh={1}>
                    {isAdminPath ? "Admin" : "MAGIC COLLAR"}
                  </Text>
                  <Text size="xs" c="dimmed" lh={1}>
                    {isAdminPath ? "Analytics & Operations" : "  Fit & Firm"}
                  </Text>
                </Stack>
              </Group>
            </Link>
          </Group>

          {/* Desktop nav */}
          {!isAdminPath ? (
            <Group gap="xl" visibleFrom="md">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  style={{
                    fontWeight: 500,
                    fontSize: "var(--mantine-font-size-sm)",
                    textDecoration: "none",
                    color: "var(--mantine-color-dimmed)",
                  }}
                >
                  {link.label}
                </Link>
              ))}
            </Group>
          ) : null}

          {/* Desktop actions */}
          <Group gap="sm" visibleFrom="md">
            <ColorModeToggle />
            {!isOnboarding && !userProfile ? (
              <Button variant="subtle" color="gray" size="sm" component={Link} href="/sign-in">
                Sign In
              </Button>
            ) : null}

            {!isOnboarding && isAdmin && !isAdminPath ? (
              <Button component={Link} href="/admin/analytics">
                Admin Dashboard
              </Button>
            ) : null}
            {!isOnboarding && !isAdmin && !isShopRoute && !isAdminPath ? (
              <Button component={Link} href="/shop">
                Shop Now
              </Button>
            ) : null}

            <ProfileDropdown />
          </Group>

          {/* Mobile: color toggle + burger */}
          <Group gap="xs" hiddenFrom="md">
            <ColorModeToggle />
            <Burger opened={opened} onClick={open} size={16} />
          </Group>
        </Flex>
      </Container>
      <MobileDrawer
        opened={opened}
        onClose={close}
        isOnboarding={isOnboarding}
        isAdmin={isAdmin}
        handleLogout={handleLogout}
      />
      <AdminNavigationDrawer opened={mobileNavOpened} onClose={closeMobileNav} />
    </Box>
  );
};

export default memo(Header);
