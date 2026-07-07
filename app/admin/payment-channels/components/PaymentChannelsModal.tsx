"use client";

import { insertError, uploadFile } from "@/app/actions";
import { useUserData } from "@/stores/useUserStore";
import { MAX_FILE_SIZE, TEXT_LIMITS } from "@/utils/constants";
import { isAppError } from "@/utils/functions";
import { supabaseClient } from "@/utils/supabase/client";
import { AttachmentTableInsert, PaymentChannelFormType } from "@/utils/types";
import {
  Button,
  Center,
  FileButton,
  Group,
  Modal,
  SimpleGrid,
  Stack,
  Switch,
  Text,
  TextInput,
  ThemeIcon,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconPhoto, IconUpload, IconX } from "@tabler/icons-react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { createPaymentChannel, updatePaymentChannel } from "../actions";

type Props = {
  opened: boolean;
  setOpened: Dispatch<SetStateAction<boolean>>;
  defaultValues: PaymentChannelFormType;
  refreshTable: () => void;
};

const PaymentChannelsModal = ({ opened, setOpened, defaultValues, refreshTable }: Props) => {
  const userData = useUserData();
  const pathname = usePathname();
  const [isSaving, setIsSaving] = useState(false);
  const [qrPreviewUrl, setQrPreviewUrl] = useState<string | null>(
    defaultValues.existingAttachment?.path ?? null,
  );

  const {
    control,
    register,
    handleSubmit,
    watch,
    setValue,
    trigger,
    formState: { errors, isDirty },
  } = useForm<PaymentChannelFormType>({ defaultValues });

  const qrCode = watch("qrCode");
  const existingAttachment = watch("existingAttachment");

  useEffect(() => {
    if (opened) setQrPreviewUrl(defaultValues.existingAttachment?.path ?? null);
  }, [defaultValues, opened]);

  useEffect(() => {
    if (!qrCode) {
      setQrPreviewUrl(null);
      return;
    }
    const objectUrl = URL.createObjectURL(qrCode);
    setQrPreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [qrCode]);

  const onSubmit = async (values: PaymentChannelFormType) => {
    if (!userData) return;

    setIsSaving(true);
    try {
      let attachmentData: AttachmentTableInsert | null = null;

      if (values.qrCode) {
        const imageUrl = (
          await uploadFile(supabaseClient, {
            file: values.qrCode,
            bucket: "PAYMENT_CHANNEL_QR",
            fileName: userData.id,
          })
        ).publicUrl;

        attachmentData = {
          attachment_bucket: "PAYMENT_CHANNEL_QR",
          attachment_name: values.qrCode.name,
          attachment_path: imageUrl,
          attachment_mime_type: values.qrCode.type,
          attachment_size: values.qrCode.size,
        };
      }

      const paymentChannelPayload = {
        payment_channel_provider_name: values.providerName.trim(),
        payment_channel_account_name: values.accountName.trim(),
        payment_channel_account_identifier: values.accountIdentifier.trim(),
        payment_channel_is_available: values.isAvailable,
      };

      if (values.paymentChannelId && defaultValues.existingAttachment) {
        await updatePaymentChannel(supabaseClient, {
          paymentChannelId: values.paymentChannelId,
          attachmentId: defaultValues.existingAttachment.id,
          attachmentData,
          paymentChannelUpdate: {
            ...paymentChannelPayload,
            payment_channel_updated_by_admin_user_id: userData.id,
          },
        });
      } else {
        if (!attachmentData) {
          notifications.show({
            message: "Image is required.",
            color: "orange",
          });
          setIsSaving(false);
          return;
        }
        await createPaymentChannel(supabaseClient, {
          attachmentInsert: attachmentData,
          paymentChannelInsert: {
            ...paymentChannelPayload,
            payment_channel_created_by_admin_user_id: userData.id,
          },
        });
      }
      notifications.show({
        message: `Payment channel ${values.paymentChannelId ? "updated" : "created"} successfully.`,
        color: "green",
      });
      refreshTable();
      setOpened(false);
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
            error_function: "savePaymentChannel",
            error_user_email: userData.email,
            error_user_id: userData.id,
          },
        });
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={() => setOpened(false)}
      title={
        <Text fw={800}>
          {defaultValues.paymentChannelId ? "Edit Payment Channel" : "Add Payment Channel"}
        </Text>
      }
      size="lg"
      centered
      closeOnEscape={!isSaving}
      closeOnClickOutside={!isSaving}
    >
      <form onSubmit={handleSubmit(onSubmit)}>
        <Stack gap="md">
          <Stack gap="xs" align="center">
            <Text size="sm" fw={500}>
              QR Code{" "}
              <Text component="span" c="red">
                *
              </Text>
            </Text>
            <Controller
              name="qrCode"
              control={control}
              rules={{
                validate: (value) => {
                  if (value) return true;
                  if (existingAttachment) return true;
                  return "QR code is required";
                },
              }}
              render={({ field: { value, onChange } }) => (
                <>
                  <Center
                    style={{
                      height: 220,
                      maxWidth: 320,
                      borderRadius: "var(--mantine-radius-md)",
                      border: errors.qrCode
                        ? "1px dashed var(--mantine-color-red-5)"
                        : "1px dashed var(--mantine-color-gray-4)",
                      backgroundColor: "var(--mantine-color-gray-0)",
                      overflow: "hidden",
                      position: "relative",
                    }}
                  >
                    {qrPreviewUrl ? (
                      <>
                        <Image
                          src={qrPreviewUrl}
                          alt="Preview"
                          width={300}
                          height={300}
                          style={{
                            height: "100%",
                            width: "auto",
                            maxWidth: "100%",
                            objectFit: "contain",
                            display: "block",
                          }}
                        />
                        <ThemeIcon
                          variant="filled"
                          color="red"
                          radius="xl"
                          size="sm"
                          style={{ position: "absolute", top: 6, right: 6, cursor: "pointer" }}
                          onClick={(event) => {
                            event.stopPropagation();
                            setQrPreviewUrl((current) => {
                              if (current && current.startsWith("blob:"))
                                URL.revokeObjectURL(current);
                              return null;
                            });
                            onChange(null);
                            setValue("existingAttachment", null, { shouldDirty: true });
                            trigger("qrCode");
                          }}
                        >
                          <IconX size={14} />
                        </ThemeIcon>
                      </>
                    ) : (
                      <Stack align="center" gap={4} style={{ width: 220 }}>
                        <IconPhoto size={36} color="var(--mantine-color-gray-5)" />
                        <Text size="xs" c="dimmed">
                          No image selected
                        </Text>
                      </Stack>
                    )}
                  </Center>

                  <FileButton
                    onChange={(file) => {
                      if (file && file.size > MAX_FILE_SIZE) {
                        notifications.show({
                          message: "QR code image must be 5MB or smaller.",
                          color: "orange",
                        });
                        return;
                      }
                      setQrPreviewUrl((current) => {
                        if (current && current.startsWith("blob:")) URL.revokeObjectURL(current);
                        return file ? URL.createObjectURL(file) : null;
                      });
                      onChange(file);
                      trigger("qrCode");
                    }}
                    accept="image/png,image/jpeg,image/webp"
                  >
                    {(props) => (
                      <Button
                        {...props}
                        variant="light"
                        size="xs"
                        leftSection={<IconUpload size={14} />}
                      >
                        {value || existingAttachment ? "Replace image" : "Upload image"}
                      </Button>
                    )}
                  </FileButton>

                  {errors.qrCode?.message && (
                    <Text size="xs" c="red">
                      {errors.qrCode.message}
                    </Text>
                  )}
                </>
              )}
            />
          </Stack>
          <TextInput
            label="Provider Name"
            placeholder="e.g. GCash, BPI, BDO"
            required
            maxLength={TEXT_LIMITS.medium}
            error={errors.providerName?.message}
            {...register("providerName", { required: "Provider name is required" })}
          />

          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
            <TextInput
              label="Account Name"
              required
              maxLength={TEXT_LIMITS.medium}
              error={errors.accountName?.message}
              {...register("accountName", { required: "Account name is required" })}
            />
            <TextInput
              label="Account Number / Identifier"
              required
              maxLength={TEXT_LIMITS.medium}
              error={errors.accountIdentifier?.message}
              {...register("accountIdentifier", {
                required: "Account identifier is required",
              })}
            />
          </SimpleGrid>

          <Controller
            name="isAvailable"
            control={control}
            render={({ field: { value, onChange, ...field } }) => (
              <Switch
                label="Available"
                checked={value}
                onChange={(event) => onChange(event.currentTarget.checked)}
                {...field}
              />
            )}
          />

          <Group justify="flex-end">
            <Button
              variant="subtle"
              color="gray"
              onClick={() => setOpened(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button type="submit" loading={isSaving} disabled={!isDirty}>
              {defaultValues.paymentChannelId ? "Save changes" : "Create Payment Channel"}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
};

export default PaymentChannelsModal;
