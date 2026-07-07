import { SHOP_SORT_OPTIONS, YEAR_OPTIONS } from "@/utils/constants";
import { OptionType, ShopFiltersType } from "@/utils/types";
import { Badge, Button, Divider, Drawer, Group, Select, Stack, Text } from "@mantine/core";

type Props = {
  opened: boolean;
  onClose: () => void;
  filters: ShopFiltersType;
  makes: OptionType[];
  models: (OptionType & { makeId: string })[];
  onFilterChange: (key: keyof ShopFiltersType, value: string) => void;
  onReset: () => void;
  activeCount: number;
};

const MobileFilterDrawer = ({
  opened,
  onClose,
  filters,
  makes,
  models,
  onFilterChange,
  onReset,
  activeCount,
}: Props) => {
  const filteredModels = filters.makeId
    ? models.filter(({ makeId }) => makeId === filters.makeId)
    : models;

  return (
    <Drawer
      opened={opened}
      onClose={onClose}
      title={
        <Group gap="xs">
          <Text fw={700}>Filter</Text>
          {activeCount > 0 && (
            <Badge color="red" size="sm" circle>
              {activeCount}
            </Badge>
          )}
        </Group>
      }
      position="right"
      size="sm"
      styles={{ body: { padding: "var(--mantine-spacing-lg)" } }}
    >
      <Stack gap="lg" h="100%">
        <Stack gap="md" style={{ flex: 1 }}>
          <Select
            label="Car Make"
            placeholder="All makes"
            data={makes.map(({ value, label }) => ({ value, label }))}
            value={filters.makeId || null}
            onChange={(v) => {
              onFilterChange("makeId", v ?? "");
              onFilterChange("modelId", "");
            }}
            clearable
            searchable
          />
          <Select
            label="Car Model"
            placeholder={filters.makeId ? "Select model" : "Select a make first"}
            data={filteredModels.map(({ value, label }) => ({ value, label }))}
            value={filters.modelId || null}
            onChange={(v) => onFilterChange("modelId", v ?? "")}
            disabled={!filters.makeId}
            clearable
            searchable
          />
          <Divider label="Year Range" labelPosition="left" />
          <Group grow>
            <Select
              label="From"
              placeholder="Any"
              data={YEAR_OPTIONS}
              value={filters.yearStart || null}
              onChange={(v) => onFilterChange("yearStart", v ?? "")}
              clearable
            />
            <Select
              label="To"
              placeholder="Any"
              data={YEAR_OPTIONS}
              value={filters.yearEnd || null}
              onChange={(v) => onFilterChange("yearEnd", v ?? "")}
              clearable
            />
          </Group>
          <Divider label="Sort" labelPosition="left" />
          <Select
            label="Sort By"
            data={SHOP_SORT_OPTIONS}
            value={filters.sortBy}
            onChange={(v) => onFilterChange("sortBy", v ?? "newest")}
          />
        </Stack>
        <Stack gap="sm">
          <Button color="red" fullWidth onClick={onClose}>
            Apply
          </Button>
          {activeCount > 0 && (
            <Button variant="subtle" color="gray" fullWidth onClick={onReset}>
              Clear All
            </Button>
          )}
        </Stack>
      </Stack>
    </Drawer>
  );
};

export default MobileFilterDrawer;
