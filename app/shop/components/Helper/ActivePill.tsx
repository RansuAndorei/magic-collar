import { Badge, Box } from "@mantine/core";
import { IconX } from "@tabler/icons-react";

type Props = { label: string; onRemove: () => void };

const ActivePill = ({ label, onRemove }: Props) => {
  return (
    <Badge
      color="red"
      variant="light"
      size="sm"
      rightSection={
        <Box
          component="button"
          onClick={onRemove}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "inherit",
            display: "flex",
            alignItems: "center",
            padding: 0,
          }}
        >
          <IconX size={10} />
        </Box>
      }
    >
      {label}
    </Badge>
  );
};

export default ActivePill;
