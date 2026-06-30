import { formatPhilippineMobileNumber } from "@/utils/functions";
import { Button, Card, Group, SimpleGrid, Stack, Text } from "@mantine/core";
import { IconExternalLink, IconMapPin, IconPackage, IconTruckDelivery } from "@tabler/icons-react";

type Props = {
  fulfillmentType: "DELIVERY" | "PICKUP";
  fullName: string | null;
  phoneNumber: string | null;
  street: string;
  barangay: string;
  city: string;
  province: string;
  region: string;
  postalCode: string;
  longitude: number | null;
  latitude: number | null;
  isAvailable?: boolean;
};

const FulfillmentSection = ({
  fulfillmentType,
  fullName,
  phoneNumber,
  street,
  barangay,
  city,
  province,
  region,
  postalCode,
  longitude,
  latitude,
}: Props) => {
  const isPickup = fulfillmentType === "PICKUP";

  return (
    <Card withBorder p="lg">
      <Stack gap="md">
        <Group gap="sm" justify="space-between">
          <Group gap="sm">
            {isPickup ? <IconPackage size={18} /> : <IconTruckDelivery size={18} />}
            <Text fw={700}>{isPickup ? "Pickup Details" : "Delivery Details"}</Text>
          </Group>
        </Group>

        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
          <Stack gap={4}>
            {!isPickup && fullName ? <Text size="sm">{fullName}</Text> : null}
            {!isPickup && phoneNumber ? (
              <Text size="sm" c="dimmed">
                {formatPhilippineMobileNumber(phoneNumber)}
              </Text>
            ) : null}
            {isPickup && (
              <Text size="sm" c="dimmed">
                Collect your order in person at this address.
              </Text>
            )}
          </Stack>

          <Stack gap={6}>
            <Text size="sm" c="dimmed">
              {street}, {barangay}, {city}, {province}, {region} {postalCode}
            </Text>
            {isPickup && longitude !== null && latitude !== null && (
              <Button
                component="a"
                href={`https://www.google.com/maps?q=${latitude},${longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                variant="light"
                color="blue"
                size="xs"
                leftSection={<IconMapPin size={13} />}
                rightSection={<IconExternalLink size={11} />}
                style={{ alignSelf: "flex-start" }}
                mt="xs"
              >
                View on Google Maps
              </Button>
            )}
          </Stack>
        </SimpleGrid>
      </Stack>
    </Card>
  );
};

export default FulfillmentSection;
