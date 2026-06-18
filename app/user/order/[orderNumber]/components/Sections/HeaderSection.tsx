import { formatDate } from "@/utils/functions";
import { Button, Group, rem, Stack, Text, Title } from "@mantine/core";
import { IconArrowLeft } from "@tabler/icons-react";
import { useRouter } from "next/navigation";

type Props = {
  orderNumber: number;
  dateCreated: string;
};

const HeaderSection = ({ orderNumber, dateCreated }: Props) => {
  const router = useRouter();

  return (
    <Group justify="space-between" align="flex-start">
      <Stack gap={4}>
        <Text size="sm" c="red.5" fw={700} tt="uppercase">
          Order #{orderNumber}
        </Text>
        <Title order={1} style={{ fontSize: rem(34), fontWeight: 800 }}>
          Order Details
        </Title>
        <Text c="dimmed">{formatDate(new Date(dateCreated))}</Text>
      </Stack>
      <Button
        variant="subtle"
        color="gray"
        leftSection={<IconArrowLeft size={16} />}
        onClick={() => router.push("/user/order")}
      >
        Back to Orders
      </Button>
    </Group>
  );
};

export default HeaderSection;
