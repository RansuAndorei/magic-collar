"use client";

import { insertError } from "@/app/actions";
import { useUserData } from "@/stores/useUserStore";
import { PAGINATION_OPTIONS } from "@/utils/constants";
import { isAppError } from "@/utils/functions";
import { supabaseClient } from "@/utils/supabase/client";
import { AdminPaymentProof } from "@/utils/types";
import {
  ActionIcon,
  Box,
  Button,
  Group,
  Paper,
  Select,
  Stack,
  Text,
  ThemeIcon,
  Title,
  rem,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { IconPhotoScan, IconReceipt, IconRefresh } from "@tabler/icons-react";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { approvePaymentProof, getPendingPaymentProofs, rejectPaymentProof } from "../actions";
import ApproveModal from "./ApproveModal";
import PaymentProofCard from "./PaymentProofCard";
import RejectModal from "./RejectModal";

const AdminPaymentProofsPage = () => {
  const pathname = usePathname();
  const userData = useUserData();

  const [records, setRecords] = useState<AdminPaymentProof[]>([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [page, setPage] = useState(1);
  const [recordsPerPage, setRecordsPerPage] = useState(PAGINATION_OPTIONS[0]);
  const [fetching, setFetching] = useState(false);
  const [selectedProof, setSelectedProof] = useState<AdminPaymentProof | null>(null);

  const [approveOpened, { open: openApprove, close: closeApprove }] = useDisclosure(false);
  const [rejectOpened, { open: openReject, close: closeReject }] = useDisclosure(false);

  const totalPages = Math.max(1, Math.ceil(totalRecords / recordsPerPage));

  const loadPaymentProofs = useCallback(async () => {
    if (!userData) return;
    setFetching(true);
    try {
      const { records, totalRecords } = await getPendingPaymentProofs(supabaseClient, {
        page,
        recordsPerPage,
      });
      setRecords(records);
      setTotalRecords(totalRecords);
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
            error_function: "loadPaymentProofs",
            error_user_email: userData.email,
            error_user_id: userData.id,
          },
        });
      }
    } finally {
      setFetching(false);
    }
  }, [page, pathname, recordsPerPage, userData]);

  useEffect(() => {
    loadPaymentProofs();
  }, [loadPaymentProofs]);

  const handleApprove = async (transactionId: string, amount: number) => {
    if (!selectedProof || !userData) return;
    try {
      await approvePaymentProof(supabaseClient, {
        orderPaymentId: selectedProof.order_payment_id,
        transactionId,
        amount,
        processedByUserId: userData.id,
      });
      notifications.show({ message: "Payment proof approved.", color: "green" });
      await loadPaymentProofs();
      closeApprove();
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
            error_function: "handleApprove",
            error_user_email: userData.email,
            error_user_id: userData.id,
          },
        });
      }
    }
  };

  const handleReject = async (reason: string) => {
    if (!selectedProof || !userData) return;
    try {
      await rejectPaymentProof(supabaseClient, {
        orderPaymentId: selectedProof.order_payment_id,
        reason,
        processedByUserId: userData.id,
      });
      notifications.show({ message: "Payment proof rejected.", color: "green" });
      await loadPaymentProofs();
      closeReject();
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
            error_function: "handleReject",
            error_user_email: userData.email,
            error_user_id: userData.id,
          },
        });
      }
    }
  };

  const handleRecordsPerPageChange = (value: string | null) => {
    setRecordsPerPage(Number(value ?? PAGINATION_OPTIONS[0]));
    setPage(1);
  };

  return (
    <Stack flex={1} gap="xl" miw={0}>
      <Stack gap={4}>
        <Text size="sm" c="red.5" fw={800} tt="uppercase">
          Fulfillment
        </Text>
        <Title order={1} style={{ fontSize: rem(34), fontWeight: 800 }}>
          Payment Proofs
        </Title>
        <Text c="dimmed">
          Review customer-uploaded payment proofs waiting for admin verification.
        </Text>
      </Stack>

      <Paper withBorder p="md" radius="md">
        <Group justify="space-between" align="flex-end" mb="md">
          <Box>
            <Group gap="xs">
              <ThemeIcon color="red" variant="light" radius="md">
                <IconPhotoScan size={18} />
              </ThemeIcon>
              <Title order={2} size="h3">
                Pending Uploads
              </Title>
            </Group>
            <Text size="sm" c="dimmed" mt={4}>
              {totalRecords} proof{totalRecords === 1 ? "" : "s"} waiting for review
            </Text>
          </Box>
          <Group gap="xs" align="flex-end">
            <Select
              label="Rows"
              data={PAGINATION_OPTIONS.map((o) => ({ value: String(o), label: String(o) }))}
              value={String(recordsPerPage)}
              allowDeselect={false}
              onChange={handleRecordsPerPageChange}
              w={96}
            />
            <ActionIcon
              variant="light"
              color="red"
              size="lg"
              aria-label="Refresh payment proofs"
              loading={fetching}
              onClick={loadPaymentProofs}
            >
              <IconRefresh size={18} />
            </ActionIcon>
          </Group>
        </Group>

        {records.length === 0 && !fetching ? (
          <Paper withBorder p="xl" radius="md" ta="center">
            <ThemeIcon color="gray" variant="light" size={48} radius="xl" mx="auto">
              <IconReceipt size={24} />
            </ThemeIcon>
            <Text fw={800} mt="md">
              No pending payment proofs
            </Text>
            <Text size="sm" c="dimmed" mt={4}>
              New customer uploads will appear here when they need a decision.
            </Text>
          </Paper>
        ) : (
          <PaymentProofCard
            records={records}
            openApproveModal={(proof) => {
              setSelectedProof(proof);
              openApprove();
            }}
            openRejectModal={(proof) => {
              setSelectedProof(proof);
              openReject();
            }}
          />
        )}

        {totalRecords > recordsPerPage && (
          <Group justify="space-between" mt="md">
            <Text size="sm" c="dimmed">
              Page {page} of {totalPages}
            </Text>
            <Group gap="xs">
              <Button variant="default" disabled={page === 1} onClick={() => setPage(page - 1)}>
                Previous
              </Button>
              <Button
                variant="default"
                disabled={page === totalPages}
                onClick={() => setPage(page + 1)}
              >
                Next
              </Button>
            </Group>
          </Group>
        )}
      </Paper>

      <ApproveModal
        opened={approveOpened}
        onClose={closeApprove}
        selectedProof={selectedProof}
        onApprove={handleApprove}
      />
      <RejectModal
        opened={rejectOpened}
        onClose={closeReject}
        selectedProof={selectedProof}
        onReject={handleReject}
      />
    </Stack>
  );
};

export default AdminPaymentProofsPage;
