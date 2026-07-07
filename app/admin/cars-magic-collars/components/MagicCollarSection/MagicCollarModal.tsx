import { insertError } from "@/app/actions";
import { useUserData } from "@/stores/useUserStore";
import { isAppError } from "@/utils/functions";
import { supabaseClient } from "@/utils/supabase/client";
import { ConnectedCarType, MagicCollarFormType } from "@/utils/types";
import {
  Button,
  Group,
  Modal,
  NumberInput,
  Select,
  SimpleGrid,
  Stack,
  Switch,
  Text,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { usePathname } from "next/navigation";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { createMagicCollar, getConnectedCars, updateMagicCollar } from "../../actions";
import ConnectedCars from "./ConnectedCars";

type Props = {
  opened: boolean;
  setOpened: Dispatch<SetStateAction<boolean>>;
  defaultValues: MagicCollarFormType;
  refreshTables: () => void;
};

const MagicCollarModal = ({ opened, setOpened, defaultValues, refreshTables }: Props) => {
  return (
    <Modal
      opened={opened}
      onClose={() => setOpened(false)}
      title={
        <Text fw={800}>
          {defaultValues.magicCollarId
            ? `Edit MC-${defaultValues.referenceNumber}`
            : "Add Magic Collar"}
        </Text>
      }
      size="xl"
      centered
      withCloseButton={false}
      closeOnEscape={false}
      closeOnClickOutside={false}
      style={{ position: "relative" }}
    >
      <MagicCollarModalForm
        key={defaultValues.magicCollarId ?? "new"}
        setOpened={setOpened}
        defaultValues={defaultValues}
        refreshTables={refreshTables}
      />
    </Modal>
  );
};

type FormProps = Omit<Props, "opened">;

const MagicCollarModalForm = ({ setOpened, defaultValues, refreshTables }: FormProps) => {
  const userData = useUserData();
  const pathname = usePathname();

  const [isSavingItem, setIsSavingItem] = useState(false);
  const [connectedCars, setConnectedCars] = useState<ConnectedCarType[]>([]);
  const [isFetchingCars, setIsFetchingCars] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors, isDirty },
    getValues,
  } = useForm<MagicCollarFormType>({
    defaultValues,
  });

  const handleFetchConnectedCars = async (magicCollarId: string) => {
    if (!userData) return;
    setIsFetchingCars(true);
    try {
      const data = await getConnectedCars(supabaseClient, {
        magicCollarId,
      });
      setConnectedCars(data);
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
            error_function: "handleFetchConnectedCars",
            error_user_email: userData.email,
            error_user_id: userData.id,
          },
        });
      }
    } finally {
      setIsFetchingCars(false);
    }
  };

  useEffect(() => {
    if (defaultValues.magicCollarId) {
      // eslint-disable-next-line
      handleFetchConnectedCars(defaultValues.magicCollarId);
    }
  }, []);

  const onSubmit = async (values: MagicCollarFormType) => {
    if (!userData) return;

    setIsSavingItem(true);
    try {
      const sharedFields = {
        magic_collar_price: values.price,
        magic_collar_price_currency: values.currency,
        magic_collar_is_available: values.isAvailable,
        magic_collar_down_payment_price: values.downPaymentPrice,
        magic_collar_front_quantity: values.frontQuantity,
        magic_collar_rear_quantity: values.rearQuantity,
        magic_collar_all_quantity: values.allQuantity,
        magic_collar_stock_quantity: values.stockQuantity,
      };

      if (!defaultValues.magicCollarId) {
        await createMagicCollar(supabaseClient, {
          magicCollarInsert: {
            ...sharedFields,
            magic_collar_created_by_admin_user_id: userData.id,
          },
        });
      } else {
        await updateMagicCollar(supabaseClient, {
          magicCollarUpdate: {
            ...sharedFields,
            magic_collar_updated_by_admin_user_id: userData.id,
          },
          magicCollarId: defaultValues.magicCollarId,
        });
      }

      refreshTables();
      notifications.show({
        message: `MagicCollar fitment ${defaultValues.magicCollarId ? "updated" : "created"} successfully.`,
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

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Stack gap="lg">
        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
          <Controller
            name="price"
            control={control}
            rules={{
              required: "Price is required",
              min: {
                value: 1,
                message: "Price must be greater than 0",
              },
              max: { value: 1000000, message: "Invalid price" },
            }}
            render={({ field }) => (
              <NumberInput
                {...field}
                label="Price"
                required
                min={0}
                maxLength={8}
                hideControls
                thousandSeparator=","
                error={errors.price?.message}
              />
            )}
          />

          <Controller
            name="currency"
            control={control}
            rules={{
              required: "Currency is required",
            }}
            render={({ field }) => (
              <Select
                {...field}
                label="Currency"
                data={["PHP"]}
                required
                error={errors.currency?.message}
              />
            )}
          />

          <Controller
            name="downPaymentPrice"
            control={control}
            rules={{
              required: "Down Payment is required",
              validate: (value) => {
                const price = getValues("price");
                if (value !== null && value !== undefined && price && value > price) {
                  return "Down Payment cannot exceed price";
                }
                return true;
              },
              min: {
                value: 1,
                message: "Down Payment must be greater than 0",
              },
              max: { value: 1000000, message: "Invalid down payment price" },
            }}
            render={({ field }) => (
              <NumberInput
                {...field}
                label="Down Payment"
                min={0}
                maxLength={8}
                hideControls
                thousandSeparator=","
                error={errors.downPaymentPrice?.message}
                required
              />
            )}
          />

          <Controller
            name="stockQuantity"
            control={control}
            rules={{
              required: "Stock quantity is required",
              min: { value: 0, message: "Stock cannot be negative" },
              max: { value: 1000000, message: "Invalid stock quantity" },
            }}
            render={({ field }) => (
              <NumberInput
                {...field}
                label="Stock Quantity"
                required
                min={0}
                maxLength={8}
                hideControls
                thousandSeparator=","
                error={errors.stockQuantity?.message}
              />
            )}
          />
        </SimpleGrid>

        <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
          <Controller
            name="frontQuantity"
            control={control}
            rules={{
              validate: () => {
                const front = getValues("frontQuantity");
                const rear = getValues("rearQuantity");
                const all = getValues("allQuantity");
                if (!front && !rear && !all) {
                  return "At least one quantity is required";
                }
                return true;
              },
              max: { value: 1000000, message: "Invalid stock quantity" },
            }}
            render={({ field: { value, onChange, ...rest } }) => (
              <NumberInput
                {...rest}
                value={value ?? ""}
                onChange={(val) => onChange(val === "" ? null : val)}
                label="Front Quantity"
                min={0}
                maxLength={8}
                hideControls
                thousandSeparator=","
                placeholder="N/A"
                error={errors.frontQuantity?.message}
              />
            )}
          />

          <Controller
            name="rearQuantity"
            control={control}
            rules={{
              validate: () => {
                const front = getValues("frontQuantity");
                const rear = getValues("rearQuantity");
                const all = getValues("allQuantity");
                if (!front && !rear && !all) {
                  return "At least one quantity is required";
                }
                return true;
              },
              max: { value: 1000000, message: "Invalid stock quantity" },
            }}
            render={({ field: { value, onChange, ...rest } }) => (
              <NumberInput
                {...rest}
                value={value ?? ""}
                onChange={(val) => onChange(val === "" ? null : val)}
                label="Rear Quantity"
                min={0}
                maxLength={8}
                thousandSeparator=","
                hideControls
                placeholder="N/A"
                error={errors.rearQuantity?.message}
              />
            )}
          />

          <Controller
            name="allQuantity"
            control={control}
            rules={{
              validate: () => {
                const front = getValues("frontQuantity");
                const rear = getValues("rearQuantity");
                const all = getValues("allQuantity");
                if (!front && !rear && !all) {
                  return "At least one quantity is required";
                }
                return true;
              },
              max: { value: 1000000, message: "Invalid stock quantity" },
            }}
            render={({ field: { value, onChange, ...rest } }) => (
              <NumberInput
                {...rest}
                value={value ?? ""}
                onChange={(val) => onChange(val === "" ? null : val)}
                label="All Quantity"
                min={0}
                maxLength={8}
                thousandSeparator=","
                hideControls
                placeholder="N/A"
                error={errors.allQuantity?.message}
              />
            )}
          />
        </SimpleGrid>

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
            {defaultValues.magicCollarId ? "Save changes" : "Create Item"}
          </Button>
        </Group>

        {defaultValues.magicCollarId ? (
          <ConnectedCars
            magicCollarId={defaultValues.magicCollarId}
            isFetchingCars={isFetchingCars}
            connectedCars={connectedCars}
            handleFetchConnectedCars={handleFetchConnectedCars}
          />
        ) : null}
      </Stack>
    </form>
  );
};

export default MagicCollarModal;
