import { ADMIN_NAV_GROUP, LOGO_PATH } from "@/utils/constants";
import {
  Box,
  Container,
  Drawer,
  Flex,
  Group,
  rem,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from "@mantine/core";
import { IconChevronRight, IconX } from "@tabler/icons-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

type Props = {
  opened: boolean;
  onClose: () => void;
};

const AdminNavigationDrawer = ({ opened, onClose }: Props) => {
  const pathname = usePathname();

  return (
    <Drawer
      opened={opened}
      onClose={onClose}
      position="left"
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
                Admin
              </Text>
              <Text size="xs" c="dimmed" lh={1}>
                Analytics & Operations
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

        <Box style={{ flex: 1, overflowY: "auto" }}>
          <Container size="xs" py="xl">
            <Stack gap="lg">
              {" "}
              <Stack gap={2}>
                <Text size="xs" fw={800} c="red.5" tt="uppercase">
                  Magic Collar
                </Text>
                <Title order={2} size="h3">
                  Admin
                </Title>
              </Stack>
              <Stack gap="md">
                {ADMIN_NAV_GROUP.map((group) => (
                  <Stack key={group.label} gap={6}>
                    <Text size="xs" c="dimmed" fw={700} tt="uppercase">
                      {group.label}
                    </Text>
                    {group.links.map(({ label, meta, icon: Icon, href }) => {
                      const isActive = href ? pathname === href : false;
                      const content = (
                        <Group
                          gap="sm"
                          wrap="nowrap"
                          p="xs"
                          bg={isActive ? "var(--mantine-color-red-light)" : undefined}
                          style={{ borderRadius: rem(8) }}
                        >
                          <ThemeIcon variant="light" color="red" size={34} radius="md">
                            <Icon size={18} />
                          </ThemeIcon>
                          <Box flex={1}>
                            <Text size="sm" fw={700} lh={1.2}>
                              {label}
                            </Text>
                            <Text size="xs" c="dimmed" lh={1.3}>
                              {meta}
                            </Text>
                          </Box>
                          <IconChevronRight size={16} color="var(--mantine-color-dimmed)" />
                        </Group>
                      );

                      return href ? (
                        <Link
                          key={label}
                          href={href}
                          onClick={onClose}
                          style={{ color: "inherit", textDecoration: "none" }}
                        >
                          {content}
                        </Link>
                      ) : (
                        <Box key={label}>{content}</Box>
                      );
                    })}
                  </Stack>
                ))}
              </Stack>
            </Stack>
          </Container>
        </Box>

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

export default AdminNavigationDrawer;
