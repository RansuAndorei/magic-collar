import { formatPhilippineMobileNumber } from "@/utils/functions";
import { Card, Group, SimpleGrid, Stack, Text } from "@mantine/core";
import { IconTruckDelivery } from "@tabler/icons-react";

type Props = {
  fullName: string;
  phoneNumber: string;
  street: string;
  barangay: string;
  city: string;
  province: string;
  region: string;
  postalCode: string;
};

const FulfillmentSection = ({
  fullName,
  phoneNumber,
  street,
  barangay,
  city,
  province,
  region,
  postalCode,
}: Props) => {
  return (
    <Card withBorder p="lg">
      <Stack gap="md">
        <Group gap="sm">
          <IconTruckDelivery size={18} />
          <Text fw={700}>Delivery Details</Text>
        </Group>

        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
          <Stack gap={4}>
            <Text size="sm">{fullName}</Text>
            <Text size="sm" c="dimmed">
              {formatPhilippineMobileNumber(phoneNumber)}
            </Text>
          </Stack>
          <Text size="sm" c="dimmed">
            {street}, {barangay}, {city}, {province}, {region} {postalCode}
          </Text>
        </SimpleGrid>
      </Stack>
    </Card>
  );
};

export default FulfillmentSection;
