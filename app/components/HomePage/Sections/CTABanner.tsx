import { Badge, Box, Button, Container, rem, Stack, Text, Title } from "@mantine/core";
import { IconArrowRight } from "@tabler/icons-react";
import Link from "next/link";

const CTABanner = () => {
  return (
    <Box
      py={{ base: rem(60), md: rem(72) }}
      style={{
        background: "var(--mantine-color-default)",
        borderTop: "1px solid var(--mantine-color-default-border)",
        borderBottom: "1px solid var(--mantine-color-default-border)",
      }}
    >
      <Container size="xl">
        <Stack align="center" gap="lg" style={{ textAlign: "center" }}>
          <Badge color="red" variant="light" size="lg" radius="sm">
            Retail &amp; Wholesale Welcome
          </Badge>
          <Title order={2} style={{ fontSize: rem(36), fontWeight: 800 }}>
            Ready to Order for Your Car?
          </Title>
          <Text c="dimmed" size="lg" maw={500}>
            Find the exact Magic Collar for your make and model. Retail and wholesale orders
            welcome.
          </Text>

          <Button
            size="md"
            color="red"
            variant="filled"
            radius="md"
            rightSection={<IconArrowRight size={18} />}
            component={Link}
            href="/shop"
          >
            Find My Collar
          </Button>
        </Stack>
      </Container>
    </Box>
  );
};

export default CTABanner;
