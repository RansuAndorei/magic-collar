"use client";

import {
  Card,
  Group,
  Paper,
  SimpleGrid,
  Stack,
  Tabs,
  Text,
  ThemeIcon,
  Title,
  rem,
} from "@mantine/core";
import { IconCar, IconCurrencyPeso, IconPackage } from "@tabler/icons-react";
import { useState } from "react";
import CarList from "./CarSection/CarList";
import MagicCollarList from "./MagicCollarSection/MagicCollarList";

type Props = {
  carTotal: number;
  magicCollarTotal: number;
  visibleStackCount: number;
  makeList: string[];
  modelList: Record<string, string[]>;
};

const CarsMagicCollarsPage = ({
  carTotal,
  magicCollarTotal,
  visibleStackCount,
  makeList,
  modelList,
}: Props) => {
  const [activeTab, setActiveTab] = useState<string | null>("cars");

  return (
    <Stack flex={1} gap="xl" miw={0}>
      <Group justify="space-between" align="flex-end" gap="md">
        <Stack gap={4}>
          <Text size="sm" c="red.5" fw={800} tt="uppercase">
            Catalog
          </Text>
          <Title order={1} style={{ fontSize: rem(34), fontWeight: 800 }}>
            Cars & Magic Collars
          </Title>
          <Text c="dimmed">Manage fitments and collar records with paginated catalog views.</Text>
        </Stack>
      </Group>

      <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
        <Card withBorder p="md">
          <Group justify="space-between" wrap="nowrap">
            <Stack gap={2}>
              <Text size="sm" c="dimmed" fw={700}>
                Car Records
              </Text>
              <Title order={3}>{carTotal}</Title>
            </Stack>
            <ThemeIcon color="green" variant="light" size={42} radius="md">
              <IconCar size={22} />
            </ThemeIcon>
          </Group>
        </Card>
        <Card withBorder p="md">
          <Group justify="space-between" wrap="nowrap">
            <Stack gap={2}>
              <Text size="sm" c="dimmed" fw={700}>
                Magic Collars
              </Text>
              <Title order={3}>{magicCollarTotal}</Title>
            </Stack>
            <ThemeIcon color="red" variant="light" size={42} radius="md">
              <IconCurrencyPeso size={22} />
            </ThemeIcon>
          </Group>
        </Card>
        <Card withBorder p="md">
          <Group justify="space-between" wrap="nowrap">
            <Stack gap={2}>
              <Text size="sm" c="dimmed" fw={700}>
                Stock
              </Text>
              <Title order={3}>{visibleStackCount}</Title>
            </Stack>
            <ThemeIcon color="blue" variant="light" size={42} radius="md">
              <IconPackage size={22} />
            </ThemeIcon>
          </Group>
        </Card>
      </SimpleGrid>

      <Paper withBorder p="md" radius="md">
        <Tabs
          value={activeTab}
          onChange={setActiveTab}
          variant="outline"
          radius="md"
          keepMounted={false}
        >
          <Tabs.List mb="md">
            <Tabs.Tab value="cars" leftSection={<IconCar size={16} />}>
              Cars
            </Tabs.Tab>
            <Tabs.Tab value="magic-collars" leftSection={<IconPackage size={16} />}>
              Magic Collars
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="cars">
            <CarList makeList={makeList} modelList={modelList} />
          </Tabs.Panel>

          <Tabs.Panel value="magic-collars">
            <MagicCollarList />
          </Tabs.Panel>
        </Tabs>
      </Paper>
    </Stack>
  );
};

export default CarsMagicCollarsPage;
