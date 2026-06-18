import { PERKS } from "@/utils/constants";
import {
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

const WhyUs = () => {
  return (
    <Box py={{ base: rem(60), md: rem(80) }} id="why-us" style={{ scrollMarginTop: 60 }}>
      <Container size="xl">
        <Stack gap="xl">
          <Stack gap={4} style={{ textAlign: "center" }}>
            <Text size="sm" c="red.5" fw={700} tt="uppercase" style={{ letterSpacing: "0.1em" }}>
              Why Magic Collar
            </Text>
            <Title order={2} style={{ fontSize: rem(34), fontWeight: 700 }}>
              Built for Filipino Car Owners
            </Title>
            <Text c="dimmed" size="md" maw={480} mx="auto">
              We make it easy to find the right part, order with confidence, and get it delivered
              fast — wherever you are in the Philippines.
            </Text>
          </Stack>

          <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md">
            {PERKS.map(({ icon: Icon, label, description }) => (
              <Card key={label} withBorder radius="md" p="lg">
                <Group gap="md" align="flex-start">
                  <ThemeIcon
                    size={44}
                    radius="md"
                    color="red"
                    variant="light"
                    style={{ flexShrink: 0 }}
                  >
                    <Icon size={22} />
                  </ThemeIcon>
                  <Stack gap={4}>
                    <Text fw={600} size="sm">
                      {label}
                    </Text>
                    <Text size="sm" c="dimmed" style={{ lineHeight: 1.6 }}>
                      {description}
                    </Text>
                  </Stack>
                </Group>
              </Card>
            ))}
          </SimpleGrid>
        </Stack>
      </Container>
    </Box>
  );
};

export default WhyUs;
