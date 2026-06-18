import {
  Badge,
  Box,
  Button,
  Center,
  Container,
  Group,
  rem,
  SimpleGrid,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { IconEngine, IconSearch } from "@tabler/icons-react";
import Link from "next/link";

const Hero = () => {
  return (
    <Box
      py={{ base: rem(72), md: rem(100) }}
      style={{ borderBottom: "1px solid var(--mantine-color-default-border)" }}
    >
      <Container size="xl">
        <SimpleGrid cols={{ base: 1, md: 2 }} spacing={60} style={{ alignItems: "center" }}>
          <Stack gap="xl">
            <Badge color="red" variant="light" size="lg" radius="sm" w="fit-content">
              🔥 Philippines' #1 Magic Collar Supplier
            </Badge>
            <Title
              order={1}
              style={{
                fontSize: rem(52),
                fontWeight: 800,
                lineHeight: 1.1,
                letterSpacing: "-0.02em",
              }}
            >
              One Collar.{" "}
              <Text component="span" c="red.5" inherit>
                Every Make.
              </Text>{" "}
              Every Model.
            </Title>
            <Text c="dimmed" size="lg" maw={480}>
              Magic Collar performance parts engineered for 18+ car brands — from your daily Honda
              to your weekend BMW. Available for retail buyers and accredited resellers nationwide.
            </Text>

            <Button
              size="md"
              color="red"
              radius="md"
              rightSection={<IconSearch size={18} />}
              component={Link}
              href="/shop"
            >
              Find My Car
            </Button>

            <Group gap="xl" mt="xs">
              {[
                ["18+", "Car Brands"],
                ["4.9★", "Avg. Rating"],
                ["Retail &", "Wholesale"],
              ].map(([val, label]) => (
                <Stack key={label} gap={0}>
                  <Text fw={700} size="xl">
                    {val}
                  </Text>
                  <Text size="xs" c="dimmed">
                    {label}
                  </Text>
                </Stack>
              ))}
            </Group>
          </Stack>

          <Center>
            <Box
              w={380}
              h={380}
              style={{
                background: "var(--mantine-color-default)",
                borderRadius: rem(24),
                border: "1px solid var(--mantine-color-default-border)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
                overflow: "hidden",
              }}
            >
              <IconEngine size={200} stroke={0.5} color="var(--mantine-color-dimmed)" />
              {["Honda", "BMW", "Toyota", "Ford"].map((brand, i) => (
                <Badge
                  key={brand}
                  variant="default"
                  size="sm"
                  style={{
                    position: "absolute",
                    ...[
                      { top: 24, left: 24 },
                      { top: 24, right: 24 },
                      { bottom: 60, left: 24 },
                      { bottom: 60, right: 24 },
                    ][i],
                  }}
                >
                  {brand}
                </Badge>
              ))}
              <Box
                style={{
                  position: "absolute",
                  bottom: 20,
                  left: 20,
                  right: 20,
                  background: "rgba(0,0,0,0.6)",
                  backdropFilter: "blur(8px)",
                  borderRadius: rem(12),
                  padding: rem(14),
                  border: "1px solid rgba(255,255,255,0.1)",
                }}
              >
                <Group justify="space-between">
                  <Stack gap={2}>
                    <Text size="xs" c="dimmed">
                      Most Popular
                    </Text>
                    <Text size="sm" fw={600} c="white">
                      MC — Honda Civic
                    </Text>
                  </Stack>
                  <Badge color="red" variant="filled">
                    ₱3,499
                  </Badge>
                </Group>
              </Box>
            </Box>
          </Center>
        </SimpleGrid>
      </Container>
    </Box>
  );
};

export default Hero;
