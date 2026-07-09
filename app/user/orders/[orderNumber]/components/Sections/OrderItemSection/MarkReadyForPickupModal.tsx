import { insertError } from "@/app/actions";
import { useUserData } from "@/stores/useUserStore";
import { isAppError } from "@/utils/functions";
import { supabaseClient } from "@/utils/supabase/client";
import { Button, Group, Modal, Stack, Text } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconPackage } from "@tabler/icons-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { transitionToReadyForPickup } from "../../../actions";

type Props = {
  opened: boolean;
  onClose: () => void;
  orderItemIds: string[];
  onSuccess: () => void;
  orderId: string;
};

const MarkReadyForPickupModal = ({ opened, onClose, orderItemIds, onSuccess, orderId }: Props) => {
  const userData = useUserData();
  const pathname = usePathname();
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const refreshResolveRef = useRef<(() => void) | null>(null);

  const loading = isLoading || isPending;

  useEffect(() => {
    if (!isPending && refreshResolveRef.current) {
      refreshResolveRef.current();
      refreshResolveRef.current = null;
    }
  }, [isPending]);

  const refreshAndWait = () =>
    new Promise<void>((resolve) => {
      refreshResolveRef.current = resolve;
      startTransition(() => {
        router.refresh();
      });
    });

  const handleConfirm = async () => {
    if (!userData) return;
    setIsLoading(true);
    try {
      await transitionToReadyForPickup(supabaseClient, {
        userId: userData.id,
        orderItemIds,
        orderId,
      });

      await refreshAndWait();
      notifications.show({
        message: "Selected item(s) have been marked as ready for pickup.",
        color: "green",
      });
      onSuccess();
    } catch (e) {
      console.log(e);
      notifications.show({
        message: "Something went wrong. Please try again later.",
        color: "red",
      });
      if (isAppError(e)) {
        await insertError(supabaseClient, {
          errorTableInsert: {
            error_message: e.message,
            error_url: pathname,
            error_function: "handleConfirm",
            error_user_email: userData.email,
            error_user_id: userData.id,
          },
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap="xs">
          <IconPackage size={18} />
          <Text fw={700}>Mark as Ready for Pickup</Text>
        </Group>
      }
      centered
    >
      <Stack gap="md">
        <Text size="sm" c="dimmed">
          This will transition <b>{orderItemIds.length}</b> selected item
          {orderItemIds.length > 1 ? "s" : ""} to Ready for Pickup. No proof is required for this
          transition.
        </Text>

        <Group justify="flex-end" mt="sm">
          <Button variant="default" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} loading={loading}>
            Confirm
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
};

export default MarkReadyForPickupModal;
