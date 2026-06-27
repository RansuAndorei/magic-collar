import { insertError, uploadFile } from "@/app/actions";
import { useUserData } from "@/stores/useUserStore";
import { formatCurrency, getOrderTotal, isAppError } from "@/utils/functions";
import { supabaseClient } from "@/utils/supabase/client";
import { OrderWithOrderItemType, PaymentChannelType } from "@/utils/types";
import { Alert, Card, Divider, Group, Progress, SimpleGrid, Stack, Text } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { IconReceipt } from "@tabler/icons-react";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import { createOrderPayment } from "../../../actions";
import PaymentHistory from "./PaymentHistory";
import UploadPayment from "./UploadPayment";

type Props = {
  order: OrderWithOrderItemType;
  paymentChannelList: PaymentChannelType[];
  totals: {
    pendingPaymentTotal: number;
    approvedPaymentTotal: number;
  };
};

const PaymentBreakdownSection = ({
  order,
  paymentChannelList,
  totals: { pendingPaymentTotal, approvedPaymentTotal },
}: Props) => {
  const pathname = usePathname();
  const userData = useUserData();

  const [paymentChannelId, setPaymentChannelId] = useState<string | null>(
    paymentChannelList[0].payment_channel_id ?? null,
  );
  const [paymentProof, setPaymentProof] = useState<File | null>(null);
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);

  const [historyOpen, { toggle: toggleHistory }] = useDisclosure(false);

  const orderTotal = useMemo(() => getOrderTotal(order.order_item), [order]);
  const downPaymentPaid = order.order_down_payment_amount - order.order_down_payment_fee;
  const paidTotal = Math.min(orderTotal, downPaymentPaid + approvedPaymentTotal);
  const balance = Math.max(orderTotal - paidTotal, 0);
  const progressValue = orderTotal > 0 ? (paidTotal / orderTotal) * 100 : 0;

  const handleSubmitPaymentProof = async () => {
    if (!userData) return;

    if (!paymentChannelId) {
      notifications.show({ message: "Select a payment channel.", color: "orange" });
      return;
    }
    if (!paymentProof) {
      notifications.show({ message: "Upload your payment proof.", color: "orange" });
      return;
    }

    try {
      setIsSubmittingPayment(true);

      const { publicUrl } = await uploadFile(supabaseClient, {
        file: paymentProof,
        bucket: "PAYMENT_PROOFS",
        fileName: `order-${order.order_number}-${paymentProof.name}`,
      });

      await createOrderPayment(supabaseClient, {
        attachment_bucket: "PAYMENT_PROOFS",
        attachment_name: paymentProof.name,
        attachment_path: publicUrl,
        attachment_mime_type: paymentProof.type,
        attachment_size: paymentProof.size,
        payment_channel_id: paymentChannelId,
        order_id: order.order_id,
      });

      notifications.show({
        message: "Payment proof uploaded.",
        color: "green",
      });
      setPaymentProof(null);
      if (historyOpen) {
        toggleHistory();
      }
    } catch (e) {
      notifications.show({
        message: "Payment proof upload failed. Please try again.",
        color: "red",
      });
      if (isAppError(e)) {
        await insertError(supabaseClient, {
          errorTableInsert: {
            error_message: e.message,
            error_url: pathname,
            error_function: "handleSubmitPaymentProof",
            error_user_email: userData?.email,
            error_user_id: userData?.id,
          },
        });
      }
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  return (
    <Card withBorder p="lg">
      <Stack gap="lg">
        <Group justify="space-between" align="flex-start">
          <Stack gap={4}>
            <Group gap="xs">
              <IconReceipt size={20} />
              <Text fw={700}>Payment Breakdown</Text>
            </Group>
            <Text size="sm" c="dimmed">
              Upload proof for any installment amount until the order total is fully paid.
            </Text>
          </Stack>
        </Group>

        <Stack gap={8}>
          <Group justify="space-between">
            <Text size="sm" c="dimmed">
              Paid progress
            </Text>
            <Text size="sm" fw={700}>
              {formatCurrency(paidTotal, { minimumFractionDigits: 0 })} /{" "}
              {formatCurrency(orderTotal, { minimumFractionDigits: 0 })}
            </Text>
          </Group>
          <Progress value={progressValue} color={balance > 0 ? "red" : "green"} radius="xl" />
        </Stack>

        <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="md">
          <Card withBorder p="md">
            <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
              Order Total
            </Text>
            <Text fw={800}>{formatCurrency(orderTotal, { minimumFractionDigits: 0 })}</Text>
          </Card>
          <Card withBorder p="md">
            <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
              Down Payment Paid
            </Text>
            <Text fw={800} c="green">
              {formatCurrency(downPaymentPaid, { minimumFractionDigits: 0 })}
            </Text>
          </Card>
          <Card withBorder p="md">
            <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
              Approved Installments
            </Text>
            <Text fw={800} c="green">
              {formatCurrency(approvedPaymentTotal, { minimumFractionDigits: 0 })}
            </Text>
            {pendingPaymentTotal > 0 ? (
              <Text size="xs" c="dimmed">
                {formatCurrency(pendingPaymentTotal, { minimumFractionDigits: 0 })} pending
              </Text>
            ) : null}
          </Card>
          <Card withBorder p="md">
            <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
              Remaining Balance
            </Text>
            <Text fw={800} c={balance > 0 ? "red.5" : "green"}>
              {formatCurrency(balance, { minimumFractionDigits: 0 })}
            </Text>
          </Card>
        </SimpleGrid>

        <Divider />

        {balance > 0 ? (
          <UploadPayment
            isSubmittingPayment={isSubmittingPayment}
            paymentChanneList={paymentChannelList}
            paymentChannelId={paymentChannelId}
            setPaymentChannelId={setPaymentChannelId}
            paymentProof={paymentProof}
            setPaymentProof={setPaymentProof}
            handleSubmitPaymentProof={handleSubmitPaymentProof}
          />
        ) : (
          <Alert color="green" title="Payment complete">
            This order is fully paid. No further installment upload is needed.
          </Alert>
        )}

        <PaymentHistory
          orderId={order.order_id}
          historyOpen={historyOpen}
          toggleHistory={toggleHistory}
        />
      </Stack>
    </Card>
  );
};

export default PaymentBreakdownSection;
