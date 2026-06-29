"use client";

import {
  Button,
  Checkbox,
  Divider,
  Group,
  Menu,
  ScrollArea,
  Stack,
  Text,
  rem,
} from "@mantine/core";
import { IconColumns3, IconEyeCheck, IconRefresh } from "@tabler/icons-react";

export type TableColumnVisibilityOption<TColumnId extends string = string> = {
  value: TColumnId;
  label: string;
  disabled?: boolean;
};

type Props<TColumnId extends string = string> = {
  columns: TableColumnVisibilityOption<TColumnId>[];
  visibleColumns: TColumnId[];
  onChange: (visibleColumns: TColumnId[]) => void;
  minVisibleColumns?: number;
};

const TableColumnVisibility = <TColumnId extends string = string>({
  columns,
  visibleColumns,
  onChange,
  minVisibleColumns = 1,
}: Props<TColumnId>) => {
  const visibleColumnSet = new Set(visibleColumns);
  const visibleEditableColumnCount = columns.filter(
    (column) => !column.disabled && visibleColumnSet.has(column.value),
  ).length;

  const handleToggle = (columnValue: TColumnId) => {
    if (visibleColumnSet.has(columnValue)) {
      if (visibleEditableColumnCount <= minVisibleColumns) return;
      onChange(visibleColumns.filter((value) => value !== columnValue));
      return;
    }

    onChange([...visibleColumns, columnValue]);
  };

  const handleShowAll = () => {
    onChange(columns.map((column) => column.value));
  };

  return (
    <Menu shadow="md" width={260} closeOnItemClick={false} position="bottom-end">
      <Menu.Target>
        <Button leftSection={<IconColumns3 size={18} />} variant="light">
          Show/Hide
        </Button>
      </Menu.Target>

      <Menu.Dropdown>
        <Stack gap="xs" p="xs">
          <Group justify="space-between" wrap="nowrap">
            <Group gap={6} wrap="nowrap">
              <IconEyeCheck size={16} color="var(--mantine-color-red-6)" />
              <Text size="sm" fw={800}>
                Columns
              </Text>
            </Group>
            <Button
              size="compact-xs"
              variant="subtle"
              leftSection={<IconRefresh size={12} />}
              onClick={handleShowAll}
            >
              Show all
            </Button>
          </Group>

          <Divider />

          <ScrollArea.Autosize mah={rem(280)} type="auto">
            <Stack gap="xs">
              {columns.map((column) => {
                const checked = visibleColumnSet.has(column.value);
                const disabled =
                  column.disabled || (checked && visibleEditableColumnCount <= minVisibleColumns);

                return (
                  <Checkbox
                    key={column.value}
                    checked={checked}
                    disabled={disabled}
                    label={column.label}
                    onChange={() => handleToggle(column.value)}
                  />
                );
              })}
            </Stack>
          </ScrollArea.Autosize>
        </Stack>
      </Menu.Dropdown>
    </Menu>
  );
};

export default TableColumnVisibility;
