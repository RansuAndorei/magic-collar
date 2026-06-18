import { Box, Container, Group, SimpleGrid, Text, ThemeIcon } from "@mantine/core";
import { IconHeadset, IconShieldCheck, IconTruckDelivery, IconUsers } from "@tabler/icons-react";

const TrustBar = () => {
  const items = [
    { icon: IconTruckDelivery, label: "Fast Nationwide Delivery" },
    { icon: IconShieldCheck, label: "Guaranteed Fit or Refund" },
    { icon: IconUsers, label: "Open to Retail & Resellers" },
    { icon: IconHeadset, label: "24/7 Customer Support" },
  ];

  return (
    <Box
      className="section-alt"
      py="lg"
      style={{
        borderBottom: "1px solid var(--mantine-color-default-border)",
      }}
    >
      <Container size="xl">
        <SimpleGrid cols={{ base: 2, sm: 4 }}>
          {items.map(({ icon: Icon, label }) => (
            <Group key={label} gap="sm" justify="center">
              <ThemeIcon size={32} variant="light" color="red" radius="md">
                <Icon size={18} />
              </ThemeIcon>
              <Text size="sm" fw={500}>
                {label}
              </Text>
            </Group>
          ))}
        </SimpleGrid>
      </Container>
    </Box>
  );
};

export default TrustBar;
