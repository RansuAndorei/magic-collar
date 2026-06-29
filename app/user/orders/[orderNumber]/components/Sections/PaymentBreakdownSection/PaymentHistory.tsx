"use client";

import { insertError } from "@/app/actions";
import { useUserData } from "@/stores/useUserStore";
import { ORDER_PAGE_SIZE } from "@/utils/constants";
import { formatCurrency, formatDate, getStatusConfig, isAppError } from "@/utils/functions";
import { supabaseClient } from "@/utils/supabase/client";
import { OrderPaymentType } from "@/utils/types";
import {
  Alert,
  Anchor,
  Badge,
  Box,
  Button,
  Card,
  Collapse,
  Group,
  Loader,
  Stack,
  Text,
  UnstyledButton,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
  IconAlertCircle,
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconFileSearch,
  IconReceipt,
} from "@tabler/icons-react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { getOrderPayment } from "../../../actions";

type Props = {
  orderId: string;
  historyOpen: boolean;
  toggleHistory: () => void;
};

const PaymentHistory = ({ orderId, historyOpen, toggleHistory }: Props) => {
  const pathname = usePathname();
  const userData = useUserData();

  const [payments, setPayments] = useState<OrderPaymentType[]>([]);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const totalPages = Math.ceil(totalCount / ORDER_PAGE_SIZE);

  const fetchPayments = async (pageNumber: number) => {
    if (!userData) return;
    try {
      setIsLoading(true);
      const { data, count } = await getOrderPayment(supabaseClient, {
        orderId,
        page: pageNumber,
        limit: ORDER_PAGE_SIZE,
      });
      setPayments(data);
      setTotalCount(count ?? 0);
    } catch (e) {
      notifications.show({
        message: "Something went wrong. Please try again later.",
        color: "red",
      });
      if (isAppError(e)) {
        await insertError(supabaseClient, {
          errorTableInsert: {
            error_message: e.message,
            error_url: pathname,
            error_function: "handleAuthCallback",
            error_user_email: userData.email,
            error_user_id: userData.id,
          },
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (historyOpen) {
      fetchPayments(page);
    }
  }, [historyOpen, page]);

  const handlePrev = () => setPage((p) => Math.max(1, p - 1));
  const handleNext = () => setPage((p) => Math.min(totalPages, p + 1));

  return (
    <Stack gap={0}>
      <UnstyledButton
        onClick={() => {
          !isLoading && toggleHistory();
        }}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 0",
          borderBottom: historyOpen ? undefined : "1px solid var(--mantine-color-default-border)",
        }}
      >
        <Group gap="sm">
          <IconReceipt size={18} />
          <Text fw={700}>Payment History</Text>
        </Group>
        <IconChevronDown
          size={18}
          style={{
            transform: historyOpen ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 200ms ease",
            color: "var(--mantine-color-dimmed)",
          }}
        />
      </UnstyledButton>

      <Collapse expanded={historyOpen}>
        <Stack gap="md" pt="md">
          {/* Loading */}
          {isLoading && (
            <Group justify="center" py="xl">
              <Loader size="sm" />
            </Group>
          )}

          {/* Empty */}
          {!isLoading && payments.length === 0 && (
            <Alert color="gray" title="No payments yet">
              Uploaded installment proofs will appear here after submission.
            </Alert>
          )}

          {/* Payment cards */}
          {!isLoading &&
            payments.map((payment) => {
              const status = payment.order_payment_request_status;
              const { accentColor, badgeStyle, statusIcon: Icon } = getStatusConfig(status);

              return (
                <Card
                  key={payment.order_payment_id}
                  p={0}
                  style={{
                    border: "0.5px solid var(--mantine-color-default-border)",
                    borderRadius: "var(--mantine-radius-md)",
                    overflow: "hidden",
                    display: "flex",
                    flexDirection: "row",
                  }}
                >
                  <Box
                    style={{
                      width: 4,
                      flexShrink: 0,
                      alignSelf: "stretch",
                      background: accentColor,
                    }}
                  />

                  <Box
                    p="md"
                    style={{
                      flex: 1,
                      display: "flex",
                      gap: 12,
                      alignItems: "flex-start",
                      minWidth: 0,
                    }}
                  >
                    <Stack gap={6} style={{ flex: 1, minWidth: 0 }}>
                      <Group gap="xs" align="center">
                        <Badge
                          variant="light"
                          size="sm"
                          radius="xl"
                          leftSection={<Icon size={12} />}
                          style={{ background: badgeStyle.bg, color: badgeStyle.color }}
                        >
                          {status}
                        </Badge>
                        <Text size="xs" c="dimmed">
                          {formatDate(new Date(payment.order_payment_date_created))}
                        </Text>
                      </Group>

                      {payment.order_payment_amount ? (
                        <Text size="xl" fw={500} lh={1.2}>
                          {formatCurrency(Number(payment.order_payment_amount), {
                            minimumFractionDigits: 0,
                          })}
                        </Text>
                      ) : (
                        <Text size="sm" c="dimmed" fs="italic">
                          Awaiting verification
                        </Text>
                      )}

                      <Group gap={6} align="center">
                        <Text size="xs" c="dimmed">
                          {payment.order_payment_payment_channel?.payment_channel_provider_name ??
                            "Payment channel"}
                        </Text>
                        {payment.order_payment_transaction_id ? (
                          <>
                            <Box
                              style={{
                                width: 3,
                                height: 3,
                                borderRadius: "50%",
                                background: "var(--mantine-color-dimmed)",
                              }}
                            />
                            <Text size="xs" c="dimmed" ff="mono">
                              Ref: {payment.order_payment_transaction_id}
                            </Text>
                          </>
                        ) : (
                          <Text size="xs" c="dimmed" fs="italic">
                            · No reference yet
                          </Text>
                        )}
                      </Group>

                      {payment.order_payment_rejection_reason && (
                        <Group
                          gap={6}
                          align="flex-start"
                          p="xs"
                          style={{
                            background: "#FCEBEB",
                            borderRadius: "var(--mantine-radius-sm)",
                          }}
                        >
                          <IconAlertCircle
                            size={14}
                            color="#A32D2D"
                            style={{ flexShrink: 0, marginTop: 1 }}
                          />
                          <Text size="xs" style={{ color: "#791F1F", lineHeight: 1.5 }}>
                            {payment.order_payment_rejection_reason}
                          </Text>
                        </Group>
                      )}
                    </Stack>

                    {payment.order_payment_proof_attachment?.attachment_path && (
                      <Anchor
                        href={payment.order_payment_proof_attachment.attachment_path}
                        target="_blank"
                        rel="noreferrer"
                        style={{ flexShrink: 0 }}
                      >
                        <Button
                          variant="outline"
                          size="xs"
                          leftSection={<IconFileSearch size={14} />}
                          color="blue"
                        >
                          View proof
                        </Button>
                      </Anchor>
                    )}
                  </Box>
                </Card>
              );
            })}

          {/* Pagination */}
          {!isLoading && totalPages > 1 && (
            <Group justify="space-between" align="center" pt="xs">
              <Text size="xs" c="dimmed">
                Page {page} of {totalPages}
              </Text>
              <Group gap="xs">
                <Button
                  variant="default"
                  size="xs"
                  leftSection={<IconChevronLeft size={14} />}
                  onClick={handlePrev}
                  disabled={page === 1}
                >
                  Prev
                </Button>
                <Button
                  variant="default"
                  size="xs"
                  rightSection={<IconChevronRight size={14} />}
                  onClick={handleNext}
                  disabled={page === totalPages}
                >
                  Next
                </Button>
              </Group>
            </Group>
          )}
        </Stack>
      </Collapse>
    </Stack>
  );
};

export default PaymentHistory;
