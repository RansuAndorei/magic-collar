"use client";

import { ADMIN_NAV_GROUP } from "@/utils/constants";
import { Box, Group, rem, Stack, Text, ThemeIcon, Title } from "@mantine/core";
import { IconChevronRight } from "@tabler/icons-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const AdminSidebar = () => {
  const pathname = usePathname();

  return (
    <Stack gap="lg">
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
              const isActive = href ? pathname.startsWith(href) : false;
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
                <Link key={label} href={href} style={{ color: "inherit", textDecoration: "none" }}>
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
  );
};

export default AdminSidebar;
