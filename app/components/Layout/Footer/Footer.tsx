"use client";

import { FOOTER_LINKS, LOGO_PATH, SOCIAL_LINKS } from "@/utils/constants";
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
import { IconChevronDown, IconChevronUp } from "@tabler/icons-react";
import Image from "next/image";
import FooterLink from "./FooterLink";

type Props = {
  section: string;
  links: { label: string; link: string }[];
};

const FooterSection = ({ section, links }: Props) => {
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
};

const Footer = () => {
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
              {SOCIAL_LINKS.map(({ icon: Icon, label }) => (
                <ActionIcon
                  key={label}
                  variant="subtle"
                  color="gray"
                  size="lg"
                  radius="md"
                  aria-label={label}
                >
                  <Icon size={20} />
                </ActionIcon>
              ))}
            </Group>
          </Box>

          <Divider />

          {/* Mobile: accordion */}
          <Box hiddenFrom="sm">
            {Object.entries(FOOTER_LINKS).map(([section, links]) => (
              <FooterSection key={section} section={section} links={links} />
            ))}
          </Box>

          {/* Desktop: 3-col grid */}
          <SimpleGrid cols={3} spacing="xl" visibleFrom="sm">
            {Object.entries(FOOTER_LINKS).map(([section, links]) => (
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
          © {new Date().getFullYear() + " "} Magic Collar | Fit &amp; Firm. All rights reserved.
        </Text>
      </Container>
    </Box>
  );
};

export default Footer;
