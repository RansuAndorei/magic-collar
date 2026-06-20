"use client";

import AdminSidebar from "@/app/admin/components/AdminSidebar";
import { PAGINATION_OPTIONS } from "@/utils/constants";
import { formatCurrency, getSetContents } from "@/utils/functions";
import { supabaseClient } from "@/utils/supabase/client";
import { MagicCollarSortAccessor, MagicCollarTableRow } from "@/utils/types";
import {
  Badge,
  Box,
  Button,
  Card,
  Container,
  Group,
  Paper,
  SimpleGrid,
  Stack,
  Tabs,
  Text,
  TextInput,
  ThemeIcon,
  Title,
  rem,
} from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { IconCar, IconCurrencyPeso, IconPackage, IconPlus, IconSearch } from "@tabler/icons-react";
import { DataTable } from "mantine-datatable";
import { useCallback, useEffect, useState } from "react";
import { AdminCatalogFormValues, AdminSortStatus, getMagicCollarsPage } from "../actions";
import CarListTable from "./CarSection/CarList";

const currentYear = new Date().getFullYear();

const emptyFormValues: AdminCatalogFormValues = {
  makeId: "",
  modelId: "",
  modelCode: "",
  yearStart: currentYear,
  yearEnd: null,
  imageName: "",
  imageUrl: "",
  price: 0,
  downPaymentPrice: 0,
  frontQuantity: null,
  rearQuantity: null,
  allQuantity: null,
  stockQuantity: 0,
  isAvailable: true,
};

const formatDateTime = (dateValue: string) =>
  new Date(dateValue).toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

const getMagicCollarStatus = (collar: MagicCollarTableRow) => {
  if (collar.magic_collar_is_disabled) return { label: "Deleted", color: "red" };
  if (!collar.magic_collar_is_available) return { label: "Disabled", color: "yellow" };
  return { label: "Active", color: "green" };
};

type Props = {
  carTotal: number;
  magicCollarTotal: number;
  makeList: string[];
  modelList: Record<string, string[]>;
};

const CarsMagicCollarsPage = ({ carTotal, magicCollarTotal, makeList, modelList }: Props) => {
  const isMobile = useMediaQuery("(max-width: 48em)");

  const [activeTab, setActiveTab] = useState<string | null>("cars");

  const [magicCollarTotalRecords, setMagicCollarTotalRecords] = useState(magicCollarTotal);
  const [magicCollarRecords, setMagicCollarRecords] = useState<MagicCollarTableRow[]>([]);
  const [magicCollarSearch, setMagicCollarSearch] = useState("");
  const [magicCollarPage, setMagicCollarPage] = useState(1);
  const [magicCollarRecordsPerPage, setMagicCollarRecordsPerPage] = useState(PAGINATION_OPTIONS[0]);
  const [isFetchingMagicCollars, setIsFetchingMagicCollars] = useState(false);
  const [magicCollarSortStatus, setMagicCollarSortStatus] = useState<
    AdminSortStatus<MagicCollarSortAccessor>
  >({
    columnAccessor: "magic_collar_date_created",
    direction: "desc",
  });

  const loadMagicCollars = useCallback(async () => {
    setIsFetchingMagicCollars(true);

    try {
      const result = await getMagicCollarsPage(supabaseClient, {
        page: magicCollarPage,
        recordsPerPage: magicCollarRecordsPerPage,
        search: magicCollarSearch,
        sortStatus: magicCollarSortStatus,
      });
      setMagicCollarRecords(result.records);
      setMagicCollarTotalRecords(result.totalRecords);
    } catch {
      notifications.show({
        message: "Unable to load Magic Collar records.",
        color: "red",
      });
    } finally {
      setIsFetchingMagicCollars(false);
    }
  }, [magicCollarPage, magicCollarRecordsPerPage, magicCollarSearch, magicCollarSortStatus]);

  useEffect(() => {
    loadMagicCollars();
  }, [loadMagicCollars]);

  return (
    <Box mih="100vh" bg="var(--mantine-color-body)">
      <Container size="xl" py={{ base: "md", lg: "xl" }}>
        <Group align="flex-start" gap="xl" wrap="nowrap">
          <Paper
            visibleFrom="lg"
            w={300}
            p="md"
            radius="md"
            withBorder
            style={{ position: "sticky", top: rem(88), flexShrink: 0 }}
          >
            <AdminSidebar />
          </Paper>

          <Stack flex={1} gap="xl" miw={0}>
            <Group justify="space-between" align="flex-end" gap="md">
              <Stack gap={4}>
                <Text size="sm" c="red.5" fw={800} tt="uppercase">
                  Catalog
                </Text>
                <Title order={1} style={{ fontSize: rem(34), fontWeight: 800 }}>
                  Cars & Magic Collars
                </Title>
                <Text c="dimmed">
                  Manage fitments and collar records with paginated catalog views.
                </Text>
              </Stack>
            </Group>

            <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
              <Card withBorder p="md">
                <Group justify="space-between" wrap="nowrap">
                  <Stack gap={2}>
                    <Text size="sm" c="dimmed" fw={700}>
                      Car records
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
                      Visible page stock
                    </Text>
                    <Title order={3}>TEMP</Title>
                  </Stack>
                  <ThemeIcon color="blue" variant="light" size={42} radius="md">
                    <IconPackage size={22} />
                  </ThemeIcon>
                </Group>
              </Card>
            </SimpleGrid>

            <Paper withBorder p="md" radius="md">
              <Tabs value={activeTab} onChange={setActiveTab} variant="outline" radius="md">
                <Tabs.List mb="md">
                  <Tabs.Tab value="cars" leftSection={<IconCar size={16} />}>
                    Cars
                  </Tabs.Tab>
                  <Tabs.Tab value="magic-collars" leftSection={<IconPackage size={16} />}>
                    Magic Collars
                  </Tabs.Tab>
                </Tabs.List>

                <Tabs.Panel value="cars">
                  <CarListTable makeList={makeList} modelList={modelList} />
                </Tabs.Panel>

                <Tabs.Panel value="magic-collars">
                  <Group justify="space-between" mb="md" align="flex-end">
                    <Group>
                      <Box>
                        <Title order={2} size="h3">
                          Magic Collar Records
                        </Title>
                        <Text size="sm" c="dimmed">
                          {magicCollarTotalRecords} records found
                        </Text>
                      </Box>
                      <TextInput
                        w={{ base: "100%", sm: 300 }}
                        leftSection={<IconSearch size={16} />}
                        placeholder="Search reference number"
                        value={magicCollarSearch}
                        onChange={(event) => {
                          setMagicCollarSearch(event.currentTarget.value);
                          setMagicCollarPage(1);
                        }}
                      />
                    </Group>
                    <Button rightSection={<IconPlus size={14} />}>Add</Button>
                  </Group>

                  <DataTable
                    idAccessor="magic_collar_id"
                    withTableBorder
                    borderRadius="md"
                    minHeight={360}
                    highlightOnHover
                    fetching={isFetchingMagicCollars}
                    records={magicCollarRecords}
                    totalRecords={magicCollarTotalRecords}
                    recordsPerPage={magicCollarRecordsPerPage}
                    recordsPerPageOptions={PAGINATION_OPTIONS}
                    page={magicCollarPage}
                    onPageChange={setMagicCollarPage}
                    onRecordsPerPageChange={(value) => {
                      setMagicCollarRecordsPerPage(value);
                      setMagicCollarPage(1);
                    }}
                    sortStatus={magicCollarSortStatus}
                    onSortStatusChange={(sortStatus) => {
                      if (
                        sortStatus.columnAccessor === "magic_collar_date_created" ||
                        sortStatus.columnAccessor === "magic_collar_stock_quantity"
                      ) {
                        const columnAccessor = sortStatus.columnAccessor as MagicCollarSortAccessor;
                        setMagicCollarSortStatus({
                          columnAccessor,
                          direction: sortStatus.direction,
                        });
                        setMagicCollarPage(1);
                      }
                    }}
                    noRecordsText="No Magic Collar records found"
                    scrollAreaProps={{ type: "auto" }}
                    columns={[
                      {
                        accessor: "magic_collar_reference_number",
                        title: "Reference",
                        render: (collar) => (
                          <Box>
                            <Text fw={800}>MC-{collar.magic_collar_reference_number}</Text>
                            {isMobile ? (
                              <Text size="xs" c="dimmed">
                                Created {formatDateTime(collar.magic_collar_date_created)}
                              </Text>
                            ) : null}
                          </Box>
                        ),
                      },
                      ...(isMobile
                        ? []
                        : [
                            {
                              accessor: "magic_collar_date_created",
                              title: "Date Created",
                              sortable: true,
                              render: (collar: MagicCollarTableRow) =>
                                formatDateTime(collar.magic_collar_date_created),
                            },
                          ]),
                      {
                        accessor: "set_contents",
                        title: "Set",
                        render: (collar) =>
                          getSetContents(
                            collar.magic_collar_front_quantity,
                            collar.magic_collar_rear_quantity,
                            collar.magic_collar_all_quantity,
                          ),
                      },
                      ...(isMobile
                        ? []
                        : [
                            {
                              accessor: "price",
                              title: "Price",
                              render: (collar: MagicCollarTableRow) => (
                                <Box>
                                  <Text size="sm">
                                    {formatCurrency(collar.magic_collar_price, {
                                      currency: collar.magic_collar_price_currency,
                                      minimumFractionDigits: 0,
                                    })}
                                  </Text>
                                  <Text size="xs" c="dimmed">
                                    DP{" "}
                                    {formatCurrency(collar.magic_collar_down_payment_price, {
                                      currency: collar.magic_collar_price_currency,
                                      minimumFractionDigits: 0,
                                    })}
                                  </Text>
                                </Box>
                              ),
                            },
                          ]),
                      {
                        accessor: "magic_collar_stock_quantity",
                        title: "Stock",
                        sortable: true,
                      },
                      {
                        accessor: "status",
                        title: "Status",
                        textAlign: "center",
                        render: (collar) => {
                          const status = getMagicCollarStatus(collar);
                          return (
                            <Badge color={status.color} variant="light">
                              {status.label}
                            </Badge>
                          );
                        },
                      },
                    ]}
                  />
                </Tabs.Panel>
              </Tabs>
            </Paper>
          </Stack>
        </Group>
      </Container>
    </Box>
  );
};

export default CarsMagicCollarsPage;
