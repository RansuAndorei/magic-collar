import { CAR_BRANDS } from "@/utils/constants";
import {
  Box,
  Button,
  Center,
  Container,
  Divider,
  Group,
  rem,
  Stack,
  Text,
  Title,
  UnstyledButton,
} from "@mantine/core";
import { IconArrowRight, IconCar } from "@tabler/icons-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const CarBrands = () => {
  const router = useRouter();

  const grouped = CAR_BRANDS.reduce<Record<string, typeof CAR_BRANDS>>((acc, brand) => {
    if (!acc[brand.country]) acc[brand.country] = [];
    acc[brand.country].push(brand);
    return acc;
  }, {});

  const countryOrder = ["Japan", "Germany", "Korea", "USA", "UK"];

  return (
    <Box id="brands" style={{ scrollMarginTop: 60 }} py={{ base: rem(60), md: rem(80) }}>
      <Container size="xl">
        <Stack gap="xl">
          <Stack gap={4} style={{ textAlign: "center" }}>
            <Text size="sm" c="red.5" fw={700} tt="uppercase" style={{ letterSpacing: "0.1em" }}>
              Fitment Guide
            </Text>
            <Title order={2} style={{ fontSize: rem(34), fontWeight: 700 }}>
              Magic Collar Fits Your Car
            </Title>
            <Text c="dimmed" size="md" maw={520} mx="auto">
              We carry Magic Collar variants for 18 car brands. Select your make to find the exact
              collar for your model.
            </Text>
          </Stack>

          <Stack gap="lg">
            {countryOrder.map((country) => (
              <Box key={country}>
                <Group gap="xs" mb="sm">
                  <Text
                    size="xs"
                    c="dimmed"
                    tt="uppercase"
                    fw={600}
                    style={{ letterSpacing: "0.08em" }}
                  >
                    {country}
                  </Text>
                  <Divider flex={1} />
                </Group>
                <Group gap="sm">
                  {grouped[country]?.map((brand) => (
                    <UnstyledButton key={brand.name}>
                      <Box
                        px="md"
                        py="sm"
                        style={{
                          background: "var(--mantine-color-default)",
                          borderRadius: rem(8),
                          border: "1px solid var(--mantine-color-default-border)",
                          cursor: "pointer",
                          transition: "border-color 0.15s, background 0.15s",
                          whiteSpace: "nowrap",
                        }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLElement).style.borderColor =
                            "var(--mantine-color-red-6)";
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLElement).style.borderColor =
                            "var(--mantine-color-default-border)";
                        }}
                        onClick={() => router.push(`/shop/?make=${brand.name}`)}
                      >
                        <Group gap="xs">
                          <IconCar size={14} color="var(--mantine-color-dimmed)" />
                          <Text size="sm" fw={500}>
                            {brand.name}
                          </Text>
                        </Group>
                      </Box>
                    </UnstyledButton>
                  ))}
                </Group>
              </Box>
            ))}
          </Stack>

          <Center>
            <Button
              variant="outline"
              color="gray"
              rightSection={<IconArrowRight size={16} />}
              component={Link}
              href="/shop"
            >
              Browse All Products by Brand
            </Button>
          </Center>
        </Stack>
      </Container>
    </Box>
  );
};

export default CarBrands;
