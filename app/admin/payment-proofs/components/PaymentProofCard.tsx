import { formatCurrency, formatDate } from "@/utils/functions";
import { AdminPaymentProof } from "@/utils/types";
import {
  Anchor,
  Badge,
  Box,
  Button,
  Divider,
  Group,
  Paper,
  SimpleGrid,
  Stack,
  Text,
} from "@mantine/core";
import { IconCheck, IconExternalLink, IconFileSearch, IconX } from "@tabler/icons-react";

type Props = {
  records: AdminPaymentProof[];
  openApproveModal: (proof: AdminPaymentProof) => void;
  openRejectModal: (proof: AdminPaymentProof) => void;
};

const PaymentProofCard = ({ records, openApproveModal, openRejectModal }: Props) => {
  return (
    <SimpleGrid cols={{ base: 1, xl: 2 }} spacing="md">
      {records.map((proof) => {
        const order = proof.order_payment_order;
        const customer = order.order_user;

        return (
          <Paper key={proof.order_payment_id} withBorder radius="md" p="md">
            <Stack gap="md">
              <Group justify="space-between" align="flex-start">
                <Box>
                  <Group gap="xs">
                    <Text fw={900}>#{order.order_number}</Text>
                    <Badge color="yellow" variant="light">
                      Pending
                    </Badge>
                  </Group>
                  <Text size="xs" c="dimmed">
                    Uploaded {formatDate(new Date(proof.order_payment_date_created))}
                  </Text>
                </Box>
                <Text fw={900} c="red.5">
                  {formatCurrency(order.order_total, { minimumFractionDigits: 0 })}
                </Text>
              </Group>

              <Divider />

              <Group justify="space-between" align="flex-start">
                <Box>
                  <Text size="xs" c="dimmed" fw={700} tt="uppercase">
                    Customer
                  </Text>
                  <Text fw={700}>
                    {customer.user_first_name} {customer.user_last_name}
                  </Text>
                  <Text size="sm" c="dimmed">
                    {customer.user_email}
                  </Text>
                </Box>
                <Box ta="right">
                  <Text size="xs" c="dimmed" fw={700} tt="uppercase">
                    Channel
                  </Text>
                  <Text fw={700}>
                    {proof.order_payment_payment_channel.payment_channel_provider_name}
                  </Text>
                  <Text size="sm" c="dimmed">
                    {proof.order_payment_payment_channel.payment_channel_account_name}
                  </Text>
                </Box>
              </Group>

              <Group justify="space-between">
                <Anchor
                  href={proof.order_payment_proof_attachment.attachment_path}
                  target="_blank"
                  rel="noreferrer"
                >
                  <Button
                    variant="light"
                    color="blue"
                    leftSection={<IconFileSearch size={16} />}
                    rightSection={<IconExternalLink size={14} />}
                  >
                    View proof
                  </Button>
                </Anchor>
                <Group gap="xs">
                  <Button
                    color="green"
                    leftSection={<IconCheck size={16} />}
                    onClick={() => openApproveModal(proof)}
                  >
                    Approve
                  </Button>
                  <Button
                    color="red"
                    variant="light"
                    leftSection={<IconX size={16} />}
                    onClick={() => openRejectModal(proof)}
                  >
                    Reject
                  </Button>
                </Group>
              </Group>
            </Stack>
          </Paper>
        );
      })}
    </SimpleGrid>
  );
};

export default PaymentProofCard;
