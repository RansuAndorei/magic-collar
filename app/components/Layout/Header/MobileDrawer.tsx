"use client";

import { useUserProfile } from "@/stores/useUserStore";
import { LOGO_PATH, NAV_LINKS } from "@/utils/constants";
import { Box, Button, Container, Divider, Drawer, Flex, Group, Stack, Text } from "@mantine/core";
import { IconArrowRight, IconLogout, IconReceipt, IconUser, IconX } from "@tabler/icons-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

type Props = {
  opened: boolean;
  onClose: () => void;
  isOnboarding: boolean;
  isAdmin: boolean;
  handleLogout: () => void;
};

const MobileDrawer = ({ opened, onClose, isOnboarding, isAdmin, handleLogout }: Props) => {
  const userProfile = useUserProfile();
  const pathname = usePathname();

  const isAdminPath = pathname.startsWith("/admin");

  return (
    <Drawer
      opened={opened}
      onClose={onClose}
      position="right"
      withCloseButton={false}
      styles={{
        body: { padding: 0, height: "100%", display: "flex", flexDirection: "column" },
        content: {
          background: "var(--mantine-color-body)",
          display: "flex",
          flexDirection: "column",
        },
      }}
    >
      <Flex direction="column" h="100%">
        {/* Top bar */}
        <Flex
          h={64}
          px="lg"
          align="center"
          justify="space-between"
          style={{
            borderBottom: "1px solid var(--mantine-color-default-border)",
            flexShrink: 0,
          }}
        >
          <Group gap="xs">
            <Image alt="logo" width={72} height={32} src={LOGO_PATH} priority />
            <Stack gap={0}>
              <Text fw={700} size="sm" lh={1}>
                MAGIC COLLAR
              </Text>
              <Text size="xs" c="dimmed" lh={1}>
                Fit &amp; Firm
              </Text>
            </Stack>
          </Group>

          <Box
            component="button"
            onClick={onClose}
            aria-label="Close menu"
            style={{
              background: "none",
              border: "1px solid var(--mantine-color-default-border)",
              cursor: "pointer",
              color: "inherit",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 6,
              borderRadius: 8,
            }}
          >
            <IconX size={18} />
          </Box>
        </Flex>

        {/* Scrollable body */}
        <Box style={{ flex: 1, overflowY: "auto" }}>
          <Container size="xs" py="xl">
            <Stack gap="lg">
              {/* Nav links */}
              {!isAdminPath ? (
                <>
                  <Stack gap={0}>
                    <Text
                      size="xs"
                      c="dimmed"
                      fw={700}
                      tt="uppercase"
                      style={{ letterSpacing: "0.1em" }}
                      mb="sm"
                    >
                      Navigation
                    </Text>
                    {NAV_LINKS.map((link, i) => (
                      <Box key={link.label}>
                        <Link
                          href={link.href}
                          onClick={onClose}
                          style={{
                            textDecoration: "none",
                            color: "inherit",
                            fontWeight: 600,
                            fontSize: "var(--mantine-font-size-md)",
                            paddingTop: "var(--mantine-spacing-sm)",
                            paddingBottom: "var(--mantine-spacing-sm)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            transition: "color 0.15s",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.color = "var(--mantine-color-red-5)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.color = "";
                          }}
                        >
                          {link.label}
                          <IconArrowRight size={16} style={{ opacity: 0.4 }} />
                        </Link>
                        {i < NAV_LINKS.length - 1 && <Divider />}
                      </Box>
                    ))}
                  </Stack>

                  <Divider />
                </>
              ) : null}

              {!isOnboarding && !isAdmin && !isAdminPath ? (
                <Group justify="center" grow>
                  <Button component={Link} href="/shop">
                    Shop Now
                  </Button>
                </Group>
              ) : null}

              {/* CTA buttons */}
              <Stack gap="sm">
                {!isOnboarding && !userProfile ? (
                  <Button variant="outline" color="gray" size="sm" component={Link} href="/sign-in">
                    Sign In
                  </Button>
                ) : null}

                {!isOnboarding && userProfile ? (
                  <Stack gap="xs">
                    <Divider
                      label={
                        <Stack gap={0} align="center" justify="center">
                          <Text size="sm" fw={500}>
                            {[userProfile.user_first_name, userProfile.user_last_name].join(" ")}
                          </Text>
                          <Text size="xs" c="dimmed">
                            {userProfile.user_email}
                          </Text>
                        </Stack>
                      }
                    />

                    {!isAdminPath ? (
                      <>
                        <Button
                          leftSection={<IconUser size={14} />}
                          variant="light"
                          component={Link}
                          href="/user/profile"
                          color="gray"
                        >
                          Profile
                        </Button>
                        <Button
                          leftSection={<IconReceipt size={14} />}
                          component={Link}
                          href="/user/orders"
                          variant="light"
                          color="gray"
                        >
                          Orders
                        </Button>
                      </>
                    ) : null}

                    {!isAdminPath ? (
                      <Button
                        color="red"
                        leftSection={<IconLogout size={14} />}
                        onClick={handleLogout}
                      >
                        Logout
                      </Button>
                    ) : null}
                  </Stack>
                ) : null}

                {isOnboarding ? (
                  <Stack px="md" gap="xs">
                    <Button
                      color="red"
                      leftSection={<IconLogout size={14} />}
                      onClick={handleLogout}
                    >
                      Logout
                    </Button>
                  </Stack>
                ) : null}

                {pathname.includes("admin") ? (
                  <Stack px="md" gap="xs">
                    <Button
                      color="red"
                      leftSection={<IconLogout size={14} />}
                      onClick={handleLogout}
                    >
                      Logout
                    </Button>
                  </Stack>
                ) : null}
              </Stack>
            </Stack>
          </Container>
        </Box>

        {/* Footer */}
        <Box
          px="lg"
          py="md"
          style={{
            borderTop: "1px solid var(--mantine-color-default-border)",
            flexShrink: 0,
          }}
        >
          <Text size="xs" c="dimmed" style={{ textAlign: "center" }}>
            © 2026 Magic Collar | Fit &amp; Firm. All rights reserved.
          </Text>
        </Box>
      </Flex>
    </Drawer>
  );
};

export default MobileDrawer;
