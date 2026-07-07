import { insertError, uploadFile } from "@/app/actions";
import { useUserData } from "@/stores/useUserStore";
import { formatCurrency, isAppError } from "@/utils/functions";
import { supabaseClient } from "@/utils/supabase/client";
import { AttachmentTableInsert, CarFormType, MagicCollarTableRow } from "@/utils/types";
import {
  Autocomplete,
  Badge,
  Button,
  Center,
  FileButton,
  Group,
  Loader,
  Modal,
  NumberInput,
  Paper,
  SimpleGrid,
  Stack,
  Switch,
  Text,
  TextInput,
  ThemeIcon,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
  IconAlertTriangle,
  IconCarSuvFilled,
  IconId,
  IconUpload,
  IconX,
} from "@tabler/icons-react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Dispatch, SetStateAction, useEffect, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { createCar, getMagicCollarByReferenceNumber, updateCar } from "../../actions";
import ModelField from "./ModelField";

type Props = {
  opened: boolean;
  setOpened: Dispatch<SetStateAction<boolean>>;
  makeList: string[];
  modelList: Record<string, string[]>;
  defaultValues: CarFormType;
  refreshTables: () => void;
};

const CarModal = ({
  opened,
  setOpened,
  makeList,
  modelList,
  defaultValues,
  refreshTables,
}: Props) => {
  return (
    <Modal
      opened={opened}
      onClose={() => setOpened(false)}
      title={<Text fw={800}>{defaultValues.carId ? "Edit Car Fitment" : "Add Car Fitment"}</Text>}
      size="xl"
      centered
      withCloseButton={false}
      closeOnEscape={false}
      closeOnClickOutside={false}
      style={{ position: "relative" }}
    >
      <CarModalForm
        key={defaultValues.carId ?? "new"}
        setOpened={setOpened}
        makeList={makeList}
        modelList={modelList}
        defaultValues={defaultValues}
        refreshTables={refreshTables}
      />
    </Modal>
  );
};

type FormProps = Omit<Props, "opened">;

const CarModalForm = ({
  setOpened,
  makeList,
  modelList,
  defaultValues,
  refreshTables,
}: FormProps) => {
  const userData = useUserData();
  const pathname = usePathname();

  const [isSavingItem, setIsSavingItem] = useState(false);
  const [isFetchingCollar, setIsFetchingCollar] = useState(false);
  const [magicCollar, setMagicCollar] = useState<MagicCollarTableRow | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(
    defaultValues.existingAttachment?.path ?? null,
  );
  const [lastCheckedReferenceNumber, setLastCheckedReferenceNumber] = useState<number | null>(
    defaultValues.carId ? (defaultValues.magicCollarReferenceNumber ?? null) : null,
  );

  const collarFetchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const collarFetchSeq = useRef(0);

  const {
    control,
    handleSubmit,
    formState: { errors, isDirty },
    getValues,
  } = useForm<CarFormType>({
    defaultValues,
  });

  const handleMagicCollarReferenceNumberChange = (
    referenceNumber: number | undefined,
    onChange?: (value: number | null) => void,
    options?: { immediate?: boolean },
  ) => {
    if (!userData) return;

    if (onChange) {
      onChange(referenceNumber ?? null);
    }

    if (collarFetchTimeout.current) {
      clearTimeout(collarFetchTimeout.current);
      collarFetchTimeout.current = null;
    }

    if (!referenceNumber) {
      setMagicCollar(null);
      setIsFetchingCollar(false);
      setLastCheckedReferenceNumber(null);
      return;
    }

    const seq = ++collarFetchSeq.current;

    const fetchCollar = async () => {
      setIsFetchingCollar(true);
      try {
        const result = await getMagicCollarByReferenceNumber(supabaseClient, { referenceNumber });
        if (seq === collarFetchSeq.current) {
          setMagicCollar(result ?? null);
          setLastCheckedReferenceNumber(referenceNumber);
        }
      } catch (e) {
        notifications.show({
          message: "Something went wrong. Please try again later.",
          color: "red",
        });
        if (seq === collarFetchSeq.current) {
          setMagicCollar(null);
          setLastCheckedReferenceNumber(referenceNumber);
        }
        if (isAppError(e)) {
          await insertError(supabaseClient, {
            errorTableInsert: {
              error_message: e.message,
              error_url: pathname,
              error_function: "handleMagicCollarReferenceNumberChange",
              error_user_email: userData.email,
              error_user_id: userData.id,
            },
          });
        }
      } finally {
        if (seq === collarFetchSeq.current) {
          setIsFetchingCollar(false);
        }
      }
    };

    if (options?.immediate) {
      fetchCollar();
    } else {
      collarFetchTimeout.current = setTimeout(fetchCollar, 400);
    }
  };

  useEffect(() => {
    if (defaultValues.carId && defaultValues.magicCollarReferenceNumber) {
      // eslint-disable-next-line
      handleMagicCollarReferenceNumberChange(defaultValues.magicCollarReferenceNumber, undefined, {
        immediate: true,
      });
    }
  }, []);

  const onSubmit = async (values: CarFormType) => {
    if (!userData) return;
    if (!values.image && !values.existingAttachment) {
      notifications.show({
        message: "Image is required.",
        color: "orange",
      });
      return;
    }
    if (!magicCollar) {
      notifications.show({
        message: "Magic Collar Reference Number is required.",
        color: "orange",
      });
      return;
    }
    if (!values.yearStart) {
      notifications.show({
        message: "Year Start is required.",
        color: "orange",
      });
      return;
    }

    setIsSavingItem(true);
    try {
      let attachmentData: AttachmentTableInsert | undefined;

      if (values.image) {
        const imageUrl = (
          await uploadFile(supabaseClient, {
            file: values.image,
            bucket: "CARS",
            fileName: userData.id,
          })
        ).publicUrl;

        attachmentData = {
          attachment_bucket: "CARS",
          attachment_name: values.image.name,
          attachment_path: imageUrl,
          attachment_mime_type: values.image.type,
          attachment_size: values.image.size,
        };
      }

      const sharedFields = {
        make: values.make.trim(),
        model: values.model.trim(),
        modelCode: values.modelCode ? values.modelCode.trim() : null,
        yearStart: values.yearStart,
        yearEnd: values.yearEnd,
        magicCollarId: magicCollar.magic_collar_id,
        isAvailable: values.isAvailable,
      };

      if (!defaultValues.carId) {
        if (!attachmentData) {
          notifications.show({
            message: "Image is required.",
            color: "orange",
          });
          setIsSavingItem(false);
          return;
        }
        await createCar(supabaseClient, {
          ...sharedFields,
          userId: userData.id,
          attachmentData,
        });
      } else {
        await updateCar(supabaseClient, {
          ...sharedFields,
          userId: userData.id,
          carId: defaultValues.carId,
          attachmentData,
        });
      }

      refreshTables();
      notifications.show({
        message: `Car fitment ${defaultValues.carId ? "updated" : "created"} successfully.`,
        color: "green",
      });
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
            error_function: "onSubmit",
            error_user_email: userData.email,
            error_user_id: userData.id,
          },
        });
      }
    } finally {
      setIsSavingItem(false);
    }
  };
  const showNotFoundNote = !!lastCheckedReferenceNumber && !isFetchingCollar && !magicCollar;

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Stack gap="lg">
        <Stack gap="xs" align="center">
          <Controller
            name="image"
            control={control}
            rules={{
              validate: (value) => {
                if (value) return true;
                if (defaultValues.existingAttachment) return true;
                return "Image is required";
              },
            }}
            render={({ field: { value, onChange } }) => (
              <>
                <Center
                  style={{
                    height: 220,
                    maxWidth: 320,
                    borderRadius: "var(--mantine-radius-md)",
                    border: errors.image
                      ? "1px dashed var(--mantine-color-red-5)"
                      : "1px dashed var(--mantine-color-gray-4)",
                    backgroundColor: "var(--mantine-color-gray-0)",
                    overflow: "hidden",
                    position: "relative",
                  }}
                >
                  {imagePreviewUrl ? (
                    <>
                      <Image
                        src={imagePreviewUrl}
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
                          setImagePreviewUrl((current) => {
                            if (current) URL.revokeObjectURL(current);
                            return null;
                          });
                          onChange(null);
                        }}
                      >
                        <IconX size={14} />
                      </ThemeIcon>
                    </>
                  ) : (
                    <Stack align="center" gap={4} style={{ width: 220 }}>
                      <IconCarSuvFilled size={36} color="var(--mantine-color-gray-5)" />
                      <Text size="xs" c="dimmed">
                        No image selected
                      </Text>
                    </Stack>
                  )}
                </Center>

                <FileButton
                  onChange={(file) => {
                    setImagePreviewUrl((current) => {
                      if (current) URL.revokeObjectURL(current);
                      return file ? URL.createObjectURL(file) : null;
                    });
                    onChange(file);
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
                      {value || defaultValues.existingAttachment ? "Replace image" : "Upload image"}
                    </Button>
                  )}
                </FileButton>

                {errors.image && (
                  <Text size="xs" c="red">
                    {errors.image.message as string}
                  </Text>
                )}
              </>
            )}
          />
        </Stack>

        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
          <Controller
            name="make"
            control={control}
            rules={{ required: "Make is required" }}
            render={({ field }) => (
              <Autocomplete
                label="Make"
                data={makeList}
                required
                error={errors.make?.message}
                {...field}
              />
            )}
          />

          <ModelField control={control} modelList={modelList} error={errors.model?.message} />

          <Controller
            name="modelCode"
            control={control}
            render={({ field }) => (
              <TextInput label="Model Code" error={errors.modelCode?.message} {...field} />
            )}
          />

          <Group grow align="flex-start">
            <Controller
              name="yearStart"
              control={control}
              rules={{ required: "Year Start is required" }}
              render={({ field }) => (
                <NumberInput
                  {...field}
                  label="Year Start"
                  min={1900}
                  required
                  error={errors.yearStart?.message}
                  maxLength={4}
                  hideControls
                />
              )}
            />
            <Controller
              name="yearEnd"
              control={control}
              rules={{
                validate: (value) => {
                  if (value === null || value === undefined) return true;
                  const yearStart = getValues("yearStart");
                  if (yearStart && value && value <= yearStart) {
                    return "Year End must be greater than Year Start";
                  }
                  return true;
                },
              }}
              render={({ field }) => (
                <NumberInput
                  {...field}
                  label="Year End"
                  min={1886}
                  placeholder="Present"
                  error={errors.yearEnd?.message}
                  maxLength={4}
                  hideControls
                  value={field.value ?? undefined}
                  onChange={(value) => {
                    field.onChange(value || null);
                  }}
                />
              )}
            />
          </Group>
        </SimpleGrid>

        {/* Magic collar reference number */}
        <Stack gap="xs">
          <Controller
            name="magicCollarReferenceNumber"
            control={control}
            rules={{
              required: "Magic Collar Reference Number is required",
              validate: () => {
                if (!magicCollar) return "";
              },
            }}
            render={({ field: { value, onChange, ...rest } }) => (
              <NumberInput
                {...rest}
                value={value ?? ""}
                onChange={(val) =>
                  handleMagicCollarReferenceNumberChange(
                    typeof val === "number" ? val : undefined,
                    onChange,
                  )
                }
                label="Magic Collar Reference Number"
                required
                hideControls
                rightSection={isFetchingCollar ? <Loader size="xs" /> : null}
                error={errors.magicCollarReferenceNumber?.message}
                leftSection={
                  <Text size="sm" c="dimmed" fw={500}>
                    MC-
                  </Text>
                }
                leftSectionWidth={50}
                styles={{
                  input: { paddingLeft: 45 },
                }}
                maxLength={4}
              />
            )}
          />

          {magicCollar ? (
            <Paper withBorder radius="md" p="md">
              <Group justify="space-between" mb="xs">
                <Group gap={6}>
                  <IconId size={16} color="var(--mantine-color-blue-6)" />
                  <Text fw={700} size="sm">
                    Magic Collar #{magicCollar.magic_collar_reference_number}
                  </Text>
                </Group>
                <Group gap={6}>
                  <Badge color={magicCollar.magic_collar_is_available ? "green" : "gray"}>
                    {magicCollar.magic_collar_is_available ? "Available" : "Unavailable"}
                  </Badge>
                  {magicCollar.magic_collar_is_disabled && <Badge color="red">Disabled</Badge>}
                </Group>
              </Group>

              <SimpleGrid cols={{ base: 2, sm: 3 }} spacing="xs">
                <Text size="sm" c="dimmed">
                  Price:{" "}
                  <Text span fw={600}>
                    {formatCurrency(magicCollar.magic_collar_price, {
                      currency: magicCollar.magic_collar_price_currency,
                      minimumFractionDigits: 0,
                    })}
                  </Text>
                </Text>
                <Text size="sm" c="dimmed">
                  Down Payment:{" "}
                  <Text span fw={600}>
                    {formatCurrency(magicCollar.magic_collar_down_payment_price, {
                      currency: magicCollar.magic_collar_price_currency,
                      minimumFractionDigits: 0,
                    })}
                  </Text>
                </Text>
                <Text size="sm" c="dimmed">
                  Stock:{" "}
                  <Text span fw={600}>
                    {magicCollar.magic_collar_stock_quantity}
                  </Text>
                </Text>
                {magicCollar.magic_collar_front_quantity !== null && (
                  <Text size="sm" c="dimmed">
                    Front Quantity:{" "}
                    <Text span fw={600}>
                      {magicCollar.magic_collar_front_quantity}
                    </Text>
                  </Text>
                )}
                {magicCollar.magic_collar_rear_quantity !== null && (
                  <Text size="sm" c="dimmed">
                    Rear Quantity:{" "}
                    <Text span fw={600}>
                      {magicCollar.magic_collar_rear_quantity}
                    </Text>
                  </Text>
                )}
                {magicCollar.magic_collar_all_quantity !== null && (
                  <Text size="sm" c="dimmed">
                    All Quantity:{" "}
                    <Text span fw={600}>
                      {magicCollar.magic_collar_all_quantity}
                    </Text>
                  </Text>
                )}
              </SimpleGrid>
            </Paper>
          ) : (
            <Paper withBorder radius="md" p="md" style={{ borderStyle: "dashed" }}>
              <Center>
                <Stack align="center" gap={4}>
                  <IconId size={24} color="var(--mantine-color-gray-5)" />
                  {showNotFoundNote ? (
                    <Group gap={6} wrap="nowrap">
                      <IconAlertTriangle size={14} color="var(--mantine-color-yellow-7)" />
                      <Text size="sm" c="yellow.7">
                        No magic collar found with reference number MC-
                        {lastCheckedReferenceNumber}. Double-check the number.
                      </Text>
                    </Group>
                  ) : (
                    <Text size="sm" c="dimmed" ta="center">
                      Enter a reference number above to preview the magic collar
                    </Text>
                  )}
                </Stack>
              </Center>
            </Paper>
          )}
        </Stack>

        <Controller
          name="isAvailable"
          control={control}
          render={({ field: { value, onChange, ...rest } }) => (
            <Switch
              label="Available in shop"
              checked={value}
              onChange={(event) => onChange(event.currentTarget.checked)}
              {...rest}
            />
          )}
        />

        <Group justify="flex-end">
          <Button
            variant="subtle"
            color="gray"
            onClick={() => setOpened(false)}
            disabled={isSavingItem}
          >
            Cancel
          </Button>
          <Button type="submit" loading={isSavingItem} disabled={!isDirty}>
            {defaultValues.carId ? "Save changes" : "Create Item"}
          </Button>
        </Group>
      </Stack>
    </form>
  );
};

export default CarModal;
