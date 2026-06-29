import { REASON_FOR_REJECTION_OPTION } from "@/utils/constants";
import { AdminPaymentProof } from "@/utils/types";
import {
  ActionIcon,
  Button,
  Group,
  Modal,
  Select,
  Stack,
  Textarea,
  Title,
  Tooltip,
} from "@mantine/core";
import { IconExternalLink } from "@tabler/icons-react";
import Link from "next/link";
import { useState } from "react";

type Props = {
  opened: boolean;
  onClose: () => void;
  selectedProof: AdminPaymentProof | null;
  onReject: (reason: string) => Promise<void>;
};

const RejectModal = ({ opened, onClose, selectedProof, onReject }: Props) => {
  const [rejectionReason, setRejectionReason] = useState<string | null>(null);
  const [customReason, setCustomReason] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleClose = () => {
    setRejectionReason(null);
    setCustomReason("");
    onClose();
  };

  const handleReject = async () => {
    const reason = rejectionReason === "Other" ? customReason.trim() : rejectionReason;
    if (!reason) return;

    setIsSaving(true);
    try {
      await onReject(reason);
      handleClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal opened={opened} onClose={handleClose} title="Reject payment proof" centered>
      <Stack>
        {selectedProof ? (
          <Group justify="space-between">
            <Title order={4} c="red">
              Order #{selectedProof.order_payment_order.order_number}
            </Title>
            <Tooltip label="Open Order">
              <ActionIcon
                component={Link}
                href={`/admin/orders/${selectedProof.order_payment_order.order_number}`}
                variant="subtle"
                color="gray"
                size="sm"
              >
                <IconExternalLink size={16} />
              </ActionIcon>
            </Tooltip>
          </Group>
        ) : null}
        <Select
          label="Reason for rejection"
          value={rejectionReason}
          data={REASON_FOR_REJECTION_OPTION}
          onChange={setRejectionReason}
          required
          searchable
        />
        {rejectionReason === "Other" && (
          <Textarea
            label="Other reason"
            value={customReason}
            onChange={(e) => setCustomReason(e.currentTarget.value)}
            minRows={4}
            autosize
            required
          />
        )}
        <Group justify="flex-end">
          <Button variant="default" onClick={handleClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button
            color="red"
            onClick={handleReject}
            loading={isSaving}
            disabled={!rejectionReason || (rejectionReason === "Other" && !customReason)}
          >
            Reject
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
};

export default RejectModal;
