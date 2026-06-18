import { OnboardingFormValuesType, OptionType } from "@/utils/types";
import { Button, Group, Stack, Text } from "@mantine/core";
import { IconPlus } from "@tabler/icons-react";
import { FieldArrayWithId } from "react-hook-form";
import AddressCard from "./AddressCard";

type Props = {
  fields: FieldArrayWithId<OnboardingFormValuesType, "addresses", "id">[];
  onAdd: () => void;
  onRemove: (i: number) => void;
  onSetDefault: (i: number) => void;
  regionList: OptionType[];
};

const StepAddress = ({ fields, onAdd, onRemove, onSetDefault, regionList }: Props) => {
  return (
    <Stack gap="md">
      <Group justify="space-between" align="center">
        <Text c="dimmed" size="sm">
          Add at least one delivery address. You can add more later.
        </Text>
      </Group>

      {fields.map((field, index) => (
        <AddressCard
          key={field.id}
          index={index}
          isDefault={fields[index]?.isDefault ?? false}
          isOnly={fields.length === 1}
          onRemove={() => onRemove(index)}
          onSetDefault={() => onSetDefault(index)}
          regionList={regionList}
        />
      ))}
      <Button
        variant="light"
        color="red"
        size="xs"
        leftSection={<IconPlus size={14} />}
        onClick={onAdd}
      >
        Add Address
      </Button>
    </Stack>
  );
};

export default StepAddress;
