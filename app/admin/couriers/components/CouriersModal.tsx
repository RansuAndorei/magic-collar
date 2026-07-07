"use client";

import { insertError } from "@/app/actions";
import { useUserData } from "@/stores/useUserStore";
import { TEXT_LIMITS } from "@/utils/constants";
import { isAppError } from "@/utils/functions";
import { supabaseClient } from "@/utils/supabase/client";
import { CourierFormType } from "@/utils/types";
import { Button, Group, Modal, Stack, Switch, Text, TextInput } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { usePathname } from "next/navigation";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { createCourier, updateCourier } from "../actions";

type Props = {
  opened: boolean;
  setOpened: Dispatch<SetStateAction<boolean>>;
  defaultValues: CourierFormType;
  refreshTable: () => void;
};

const CouriersModal = ({ opened, setOpened, defaultValues, refreshTable }: Props) => {
  const userData = useUserData();
  const pathname = usePathname();
  const [isSaving, setIsSaving] = useState(false);

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<CourierFormType>({ defaultValues });

  useEffect(() => {
    if (opened) reset(defaultValues);
  }, [defaultValues, opened, reset]);

  const onSubmit = async (values: CourierFormType) => {
    if (!userData) return;
    setIsSaving(true);
    try {
      if (values.courierId) {
        await updateCourier(supabaseClient, {
          courierId: values.courierId,
          courierUpdate: {
            courier_name: values.name.trim(),
            courier_is_available: values.isAvailable,
            courier_updated_by_admin_user_id: userData.id,
          },
        });
      } else {
        await createCourier(supabaseClient, {
          courierInsert: {
            courier_name: values.name.trim(),
            courier_is_available: values.isAvailable,
            courier_created_by_admin_user_id: userData.id,
          },
        });
      }

      notifications.show({
        message: `Courier ${values.courierId ? "updated" : "created"} successfully.`,
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
            error_function: "saveCourier",
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
      title={<Text fw={800}>{defaultValues.courierId ? "Edit Courier" : "Add Courier"}</Text>}
      size="md"
      centered
      closeOnEscape={!isSaving}
      closeOnClickOutside={!isSaving}
    >
      <form onSubmit={handleSubmit(onSubmit)}>
        <Stack gap="md">
          <TextInput
            label="Courier Name"
            placeholder="e.g. LBC, J&T Express"
            required
            maxLength={TEXT_LIMITS.medium}
            error={errors.name?.message}
            {...register("name", { required: "Courier name is required" })}
          />

          <Controller
            name="isAvailable"
            control={control}
            render={({ field: { value, onChange, ...field } }) => (
              <Switch
                label="Available for selection"
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
              {defaultValues.courierId ? "Save changes" : "Create Courier"}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
};

export default CouriersModal;
