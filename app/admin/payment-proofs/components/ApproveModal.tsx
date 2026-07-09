import { TEXT_LIMITS } from "@/utils/constants";
import { formatCurrency } from "@/utils/functions";
import { supabaseClient } from "@/utils/supabase/client";
import { AdminPaymentProof } from "@/utils/types";
import {
  ActionIcon,
  Button,
  Group,
  Modal,
  NumberInput,
  Skeleton,
  Stack,
  Text,
  TextInput,
  Title,
  Tooltip,
} from "@mantine/core";
import { IconExternalLink } from "@tabler/icons-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { checkTransactionIdDuplicate, getOrderPaidTotal } from "../actions";

type FormValues = {
  transactionId: string;
  amount: number | string;
};

type Props = {
  opened: boolean;
  onClose: () => void;
  selectedProof: AdminPaymentProof | null;
  onApprove: (transactionId: string, amount: number) => Promise<void>;
};

const ApproveModal = ({ opened, onClose, selectedProof, onApprove }: Props) => {
  const [isSaving, setIsSaving] = useState(false);
  const [paidTotal, setPaidTotal] = useState<number | null>(null);
  const [isFetchingPaidTotal, setIsFetchingPaidTotal] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      transactionId: "",
      amount: "",
    },
  });

  const orderTotal = selectedProof?.order_payment_order.order_total ?? 0;
  const remaining = paidTotal !== null ? orderTotal - paidTotal : null;

  useEffect(() => {
    if (!opened || !selectedProof) return;

    const fetchPaidTotal = async () => {
      setIsFetchingPaidTotal(true);
      try {
        const total = await getOrderPaidTotal(supabaseClient, {
          orderId: selectedProof.order_payment_order.order_id,
        });
        setPaidTotal(total);
      } finally {
        setIsFetchingPaidTotal(false);
      }
    };

    fetchPaidTotal();
  }, [opened, selectedProof]);

  const handleClose = () => {
    reset();
    setPaidTotal(null);
    onClose();
  };

  const onSubmit = async (data: FormValues) => {
    const transactionId = data.transactionId.trim().toUpperCase();
    const amount = Number(data.amount);
    setIsSaving(true);
    try {
      await onApprove(transactionId, amount);
      handleClose();
    } finally {
      setIsSaving(false);
    }
  };
  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title="Approve payment proof"
      centered
      closeOnClickOutside={false}
      closeOnEscape={false}
      withCloseButton={false}
    >
      <form onSubmit={handleSubmit(onSubmit)}>
        <Stack>
          {selectedProof && (
            <Stack gap={4}>
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
                    target="_blank"
                  >
                    <IconExternalLink size={16} />
                  </ActionIcon>
                </Tooltip>
              </Group>
              <Group justify="space-between" mt="xs">
                <Text size="sm" c="dimmed">
                  Order Total:
                </Text>
                <Text size="sm" fw={600}>
                  {formatCurrency(orderTotal, { minimumFractionDigits: 0 })}
                </Text>
              </Group>
              <Group justify="space-between">
                <Text size="sm" c="dimmed">
                  Already Paid:
                </Text>
                {isFetchingPaidTotal ? (
                  <Skeleton height={16} width={80} />
                ) : (
                  <Text size="sm" fw={600} c="green">
                    {formatCurrency(paidTotal ?? 0, { minimumFractionDigits: 0 })}
                  </Text>
                )}
              </Group>
              <Group justify="space-between">
                <Text size="sm" c="dimmed">
                  Remaining:
                </Text>
                {isFetchingPaidTotal ? (
                  <Skeleton height={16} width={80} />
                ) : (
                  <Text size="sm" fw={600} c={remaining === 0 ? "green" : "red"}>
                    {formatCurrency(remaining ?? 0, { minimumFractionDigits: 0 })}
                  </Text>
                )}
              </Group>
            </Stack>
          )}

          <Controller
            name="transactionId"
            control={control}
            rules={{
              required: "Transaction ID is required",
              validate: {
                checkEmpty: (v) => !!v.trim() || "Transaction ID cannot be empty",
                checkDuplicate: async (value) => {
                  const normalizedValue = value.trim().toUpperCase();
                  const isValid = await checkTransactionIdDuplicate(supabaseClient, {
                    transactionId: normalizedValue,
                  });
                  return isValid ? true : "Transaction ID already exists.";
                },
              },
            }}
            render={({ field }) => (
              <TextInput
                {...field}
                label="Transaction ID"
                required
                maxLength={TEXT_LIMITS.short}
                error={errors.transactionId?.message}
                styles={{
                  input: {
                    textTransform: "uppercase",
                  },
                }}
              />
            )}
          />

          <Controller
            name="amount"
            control={control}
            rules={{
              required: "Amount is required",
              validate: (v) => Number(v) > 0 || "Amount must be greater than 0",
            }}
            render={({ field: { onChange, value } }) => (
              <NumberInput
                label="Amount"
                value={value}
                onChange={onChange}
                min={0}
                max={remaining}
                maxLength={11}
                fixedDecimalScale
                hideControls
                thousandSeparator=","
                required
                error={errors.amount?.message}
              />
            )}
          />

          <Group justify="flex-end">
            <Button variant="default" onClick={handleClose} disabled={isSaving}>
              Cancel
            </Button>
            <Button type="submit" color="green" loading={isSaving} disabled={isFetchingPaidTotal}>
              Approve
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
};

export default ApproveModal;
