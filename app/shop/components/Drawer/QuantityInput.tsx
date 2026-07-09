import { MAX_QUANTITY } from "@/utils/constants";
import { ActionIcon, Group, NumberInput } from "@mantine/core";
import { IconMinus, IconPlus } from "@tabler/icons-react";
import { useEffect, useRef, useState } from "react";

type Props = {
  quantity: number;
  onQuantityChange: (quantity: number) => void;
};

const QuantityInput = ({ quantity, onQuantityChange }: Props) => {
  const [localValue, setLocalValue] = useState(quantity);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // eslint-disable-next-line
    setLocalValue(quantity);
  }, [quantity]);

  const commit = (value: number) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      onQuantityChange(value);
    }, 300);
  };

  const setValue = (value: number) => {
    setLocalValue(value);
    commit(value);
  };

  return (
    <Group gap={4}>
      <ActionIcon
        variant="light"
        color="gray"
        size="sm"
        onClick={() => setValue(Math.max(1, localValue - 1))}
        aria-label="Decrease quantity"
      >
        <IconMinus size={14} />
      </ActionIcon>
      <NumberInput
        value={localValue}
        onChange={(value) => {
          if (value === "") return;
          const num = Number(value);
          if (!Number.isNaN(num)) setValue(num);
        }}
        min={1}
        max={MAX_QUANTITY}
        maxLength={`${MAX_QUANTITY}`.length}
        w={64}
        hideControls
      />
      <ActionIcon
        variant="light"
        color="gray"
        size="sm"
        onClick={() => setValue(Math.min(MAX_QUANTITY, localValue + 1))}
        aria-label="Increase quantity"
      >
        <IconPlus size={14} />
      </ActionIcon>
    </Group>
  );
};

export default QuantityInput;
