"use client";

import { FOOTER_LINKS, LOGO_PATH } from "@/utils/constants";
import { SettingsEnum } from "@/utils/types";
import {
  ActionIcon,
  Box,
  Collapse,
  Container,
  Divider,
  Group,
  rem,
  SimpleGrid,
  Stack,
  Text,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import {
  IconBrandFacebook,
  IconBrandInstagram,
  IconBrandTiktok,
  IconBrandYoutube,
  IconChevronDown,
  IconChevronUp,
} from "@tabler/icons-react";
import Image from "next/image";
import { memo } from "react";
import FooterLink from "./FooterLink";

type FooterSectionProps = {
  section: string;
  links: { label: string; link: string }[];
};

const FOOTER_ENTRIES = Object.entries(FOOTER_LINKS);

const SOCIAL_ICONS = [
  { key: "FACEBOOK", label: "Facebook", Icon: IconBrandFacebook },
  { key: "INSTAGRAM", label: "Instagram", Icon: IconBrandInstagram },
  { key: "YOUTUBE", label: "Youtube", Icon: IconBrandYoutube },
  { key: "TIKTOK", label: "Tiktok", Icon: IconBrandTiktok },
] as const;

const FooterSection = memo(({ section, links }: FooterSectionProps) => {
  const [opened, { toggle }] = useDisclosure(false);

  return (
    <Box>
      <Group
        justify="space-between"
        align="center"
        py="sm"
        onClick={toggle}
        style={{ cursor: "pointer" }}
      >
        <Text size="sm" fw={700} tt="uppercase" style={{ letterSpacing: "0.08em" }}>
          {section}
        </Text>
        {opened ? <IconChevronUp size={16} /> : <IconChevronDown size={16} />}
      </Group>
      <Collapse expanded={opened}>
        <Stack gap="sm" pb="md">
          {links.map(({ label, link }) => (
            <FooterLink key={link} label={label} link={link} />
          ))}
        </Stack>
      </Collapse>
      <Divider />
    </Box>
  );
});
FooterSection.displayName = "FooterSection";

type FooterProps = {
  socials: Record<SettingsEnum, string | null> | null;
};

const Footer = ({ socials }: FooterProps) => {
  return (
    <Box
      component="footer"
      pt={rem(60)}
      pb={rem(32)}
      style={{ borderTop: "1px solid var(--mantine-color-default-border)" }}
    >
      <Container size="xl">
        <Stack gap="xl" mb="xl">
          {/* Brand block */}
          <Box>
            <Group gap="xs" mb="sm">
              <Image alt="logo" width={80} height={35} src={LOGO_PATH} priority />
              <Stack gap={0}>
                <Text fw={700} size="sm" lh={1}>
                  MAGIC COLLAR
                </Text>
                <Text size="xs" c="dimmed" lh={1}>
                  Fit &amp; Firm
                </Text>
              </Stack>
            </Group>
            <Text size="sm" c="dimmed" maw={340} style={{ lineHeight: 1.7 }}>
              Genuine Magic Collar parts for 18+ car brands. Available to retail buyers and
              accredited resellers across the Philippines.
            </Text>
            <Group gap="xs" mt="sm">
              {SOCIAL_ICONS.map(({ key, label, Icon }) => {
                const href = socials?.[key as SettingsEnum];
                if (!href) return null;
                return (
                  <ActionIcon
                    key={key}
                    component="a"
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    variant="subtle"
                    color="gray"
                    size="lg"
                    radius="md"
                    aria-label={label}
                  >
                    <Icon size={20} />
                  </ActionIcon>
                );
              })}
            </Group>
          </Box>

          <Divider />

          {/* Mobile: accordion */}
          <Box hiddenFrom="sm">
            {FOOTER_ENTRIES.map(([section, links]) => (
              <FooterSection key={section} section={section} links={links} />
            ))}
          </Box>

          {/* Desktop: 3-col grid */}
          <SimpleGrid cols={3} spacing="xl" visibleFrom="sm">
            {FOOTER_ENTRIES.map(([section, links]) => (
              <Stack key={section} gap="sm">
                <Text size="sm" fw={700} tt="uppercase" style={{ letterSpacing: "0.08em" }}>
                  {section}
                </Text>
                {links.map(({ label, link }) => (
                  <FooterLink key={link} label={label} link={link} />
                ))}
              </Stack>
            ))}
          </SimpleGrid>
        </Stack>

        <Divider visibleFrom="sm" />

        <Text size="xs" c="dimmed" pt="lg" style={{ textAlign: "center" }}>
          © 2026 Magic Collar | Fit &amp; Firm. All rights reserved.
        </Text>
      </Container>
    </Box>
  );
};

Footer.displayName = "Footer";
export default memo(Footer);
