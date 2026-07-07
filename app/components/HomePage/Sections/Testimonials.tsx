import { TESTIMONIALS } from "@/utils/constants";
import {
  Badge,
  Box,
  Card,
  Container,
  Group,
  rem,
  SimpleGrid,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from "@mantine/core";
import { IconStar } from "@tabler/icons-react";

const Testimonials = () => {
  return (
    <Box py={{ base: rem(60), md: rem(80) }} className="section-alt">
      <Container size="xl">
        <Stack gap="xl">
          <Stack gap={4} style={{ textAlign: "center" }}>
            <Text size="sm" c="red.5" fw={700} tt="uppercase" style={{ letterSpacing: "0.1em" }}>
              What Customers Say
            </Text>
            <Title order={2} style={{ fontSize: rem(34), fontWeight: 700 }}>
              Trusted by Drivers &amp; Dealers
            </Title>
          </Stack>
          <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
            {TESTIMONIALS.map((t) => (
              <Card key={t.name} radius="md" p="xl" withBorder>
                <Stack gap="md">
                  <Group justify="space-between">
                    <Group gap={2}>
                      {Array.from({ length: t.rating }).map((_, i) => (
                        <IconStar
                          key={i}
                          size={14}
                          fill="var(--mantine-color-yellow-5)"
                          color="var(--mantine-color-yellow-5)"
                        />
                      ))}
                    </Group>
                    <Badge color={t.type === "Reseller" ? "red" : "gray"} variant="light" size="xs">
                      {t.type}
                    </Badge>
                  </Group>
                  <Text c="dimmed" size="sm" style={{ lineHeight: 1.7 }}>
                    &ldquo;{t.text}&ldquo;
                  </Text>
                  <Group gap="sm">
                    <ThemeIcon size={36} radius="xl" variant="light" color="red">
                      <Text size="xs" fw={700}>
                        {t.name[0]}
                      </Text>
                    </ThemeIcon>
                    <Stack gap={0}>
                      <Text size="sm" fw={600}>
                        {t.name}
                      </Text>
                      <Text size="xs" c="dimmed">
                        {t.location}
                      </Text>
                    </Stack>
                  </Group>
                </Stack>
              </Card>
            ))}
          </SimpleGrid>
        </Stack>
      </Container>
    </Box>
  );
};

export default Testimonials;
