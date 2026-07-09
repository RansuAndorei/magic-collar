import { insertError } from "@/app/actions";
import { useUserData } from "@/stores/useUserStore";
import { isAppError } from "@/utils/functions";
import { supabaseClient } from "@/utils/supabase/client";
import { Button, Group, Modal, Stack, Text } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { transitionToDelivered } from "../../../actions";

type Props = {
  opened: boolean;
  onClose: () => void;
  orderItemIds: string[];
  onSuccess: () => void;
  orderId: string;
};

const MarkDeliveredModal = ({ opened, onClose, orderItemIds, onSuccess, orderId }: Props) => {
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
      await transitionToDelivered(supabaseClient, {
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
    <Modal opened={opened} onClose={onClose} title="Mark as Delivered" centered>
      <Stack gap="md">
        <Text size="sm">
          Mark {orderItemIds.length} item{orderItemIds.length > 1 ? "s" : ""} as{" "}
          <Text span fw={700}>
            DELIVERED
          </Text>
          ? This confirms the customer has received the item(s).
        </Text>

        <Group justify="flex-end">
          <Button variant="default" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button color="teal" onClick={handleConfirm} loading={loading}>
            Confirm Delivered
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
};

export default MarkDeliveredModal;
