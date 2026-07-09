import { insertError, uploadFile } from "@/app/actions";
import { useUserData } from "@/stores/useUserStore";
import { isAppError } from "@/utils/functions";
import { supabaseClient } from "@/utils/supabase/client";
import { Button, FileButton, Group, Image as MImage, Modal, Stack, Text } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconPhoto, IconTruckDelivery } from "@tabler/icons-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { createProofOfDelivery } from "../../../actions";

type Props = {
  opened: boolean;
  onClose: () => void;
  orderItemIds: string[];
  onSuccess: () => void;
  orderId: string;
};

const DeliveryProofUploadModal = ({ opened, onClose, orderItemIds, onSuccess, orderId }: Props) => {
  const userData = useUserData();
  const pathname = usePathname();
  const router = useRouter();

  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
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

  const handleFileChange = (selected: File | null) => {
    setFile(selected);
    setPreviewUrl(selected ? URL.createObjectURL(selected) : null);
  };

  const handleClose = () => {
    setFile(null);
    setPreviewUrl(null);
    onClose();
  };

  const handleSubmit = async () => {
    if (!file || !userData) return;
    setIsLoading(true);
    try {
      const imageUrl = (
        await uploadFile(supabaseClient, {
          file: file,
          bucket: "PROOF_OF_DELIVERY",
          fileName: file.name,
        })
      ).publicUrl;

      const attachmentData = {
        attachment_bucket: "PROOF_OF_DELIVERY",
        attachment_name: file.name,
        attachment_path: imageUrl,
        attachment_mime_type: file.type,
        attachment_size: file.size,
      };

      await createProofOfDelivery(supabaseClient, {
        attachmentData,
        userId: userData.id,
        orderItemIds,
        orderId,
      });

      await refreshAndWait();
      notifications.show({
        message: "Proof of delivery has been uploaded successfully.",
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
            error_function: "handleSubmit",
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
      onClose={handleClose}
      title={
        <Group gap="xs">
          <IconTruckDelivery size={18} />
          <Text fw={700}>Mark as Out for Delivery</Text>
        </Group>
      }
      centered
      closeOnClickOutside={false}
      closeOnEscape={false}
      withCloseButton={false}
    >
      <Stack gap="md">
        <Text size="sm" c="dimmed">
          Upload proof of dispatch to transition <b>{orderItemIds.length}</b> selected item
          {orderItemIds.length > 1 ? "s" : ""} to Out for Delivery. This proof will be linked to all
          selected items.
        </Text>

        {previewUrl ? (
          <MImage src={previewUrl} radius="sm" mah={220} fit="contain" />
        ) : (
          <FileButton
            onChange={handleFileChange}
            accept="image/png,image/jpeg,image/webp"
            disabled={loading}
          >
            {(props) => (
              <Button {...props} variant="light" leftSection={<IconPhoto size={16} />}>
                Choose proof photo
              </Button>
            )}
          </FileButton>
        )}

        {previewUrl && (
          <FileButton
            onChange={handleFileChange}
            accept="image/png,image/jpeg,image/webp"
            disabled={loading}
          >
            {(props) => (
              <Button {...props} variant="subtle" size="xs">
                Choose a different photo
              </Button>
            )}
          </FileButton>
        )}

        <Group justify="flex-end" mt="sm">
          <Button variant="default" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!file} loading={loading}>
            Confirm & Transition
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
};

export default DeliveryProofUploadModal;
