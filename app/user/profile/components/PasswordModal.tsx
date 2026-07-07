import { insertError } from "@/app/actions";
import { useUserData, useUserProfile } from "@/stores/useUserStore";
import { isAppError } from "@/utils/functions";
import { supabaseClient } from "@/utils/supabase/client";
import { Button, Divider, Group, Modal, PasswordInput, Stack } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconLock } from "@tabler/icons-react";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { resetPassword } from "../actions";

type FormType = {
  oldPassword: string;
  password: string;
  confirmPassword: string;
};

type Props = {
  passwordModalOpened: boolean;
  closePasswordModal: () => void;
};

const PasswordModal = ({ passwordModalOpened, closePasswordModal }: Props) => {
  const userData = useUserData();
  const userProfile = useUserProfile();
  const pathname = usePathname();

  const [isLoading, setIsLoading] = useState(false);

  const userMetadata = userData?.app_metadata;
  const isUserEmailProviderOnly = Boolean(
    userMetadata?.provider === "email" &&
    userMetadata?.providers?.includes("email") &&
    userMetadata?.providers?.length === 1,
  );

  const formMethods = useForm<FormType>({
    defaultValues: {
      oldPassword: "",
      password: "",
      confirmPassword: "",
    },
  });

  const {
    handleSubmit,
    register,
    getValues,
    formState: { errors },
    reset,
  } = formMethods;

  const handleChangePassword = async (data: FormType) => {
    if (!userProfile) return;

    setIsLoading(true);
    try {
      if (isUserEmailProviderOnly) {
        const { error } = await supabaseClient.auth.signInWithPassword({
          email: userProfile.user_email,
          password: data.oldPassword,
        });
        if (error) throw error.message;
      }
      const { error } = await resetPassword(supabaseClient, {
        password: data.password,
      });
      if (error) throw error.message;
      notifications.show({
        message: "Password updated.",
        color: "green",
      });
      reset();
      closePasswordModal();
    } catch (e) {
      let errorMessage = "";
      errorMessage = e as unknown as string;
      if (errorMessage === "Invalid login credentials") {
        errorMessage = "Wrong old password.";
        notifications.show({
          message: errorMessage,
          color: "red",
        });
        return;
      }
      if (isAppError(e)) {
        await insertError(supabaseClient, {
          errorTableInsert: {
            error_message: e.message,
            error_url: pathname,
            error_function: "handleChangePassword",
            error_user_email: userProfile.user_email,
            error_user_id: userProfile.user_id,
          },
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      opened={passwordModalOpened}
      onClose={closePasswordModal}
      title="Change Password"
      centered
      radius="md"
      styles={{
        title: {
          fontSize: 20,
          fontWeight: 600,
        },
      }}
      withCloseButton={false}
      closeOnClickOutside={false}
      closeOnEscape={false}
    >
      <form onSubmit={handleSubmit(handleChangePassword)}>
        <Stack gap="md">
          {isUserEmailProviderOnly ? (
            <PasswordInput
              label="Old Password"
              placeholder="Old password"
              leftSection={<IconLock size={16} />}
              error={errors.oldPassword?.message}
              {...register("oldPassword", {
                required: "Old password field cannot be empty",
              })}
            />
          ) : null}
          <PasswordInput
            label="New Password"
            placeholder="At least 8 characters"
            leftSection={<IconLock size={16} />}
            error={errors.password?.message}
            {...register("password", {
              required: "New password field cannot be empty",
              minLength: { value: 8, message: "Password must be at least 8 characters" },
              validate: (value) =>
                !isUserEmailProviderOnly ||
                value !== getValues("oldPassword") ||
                "New password must be different from your old password",
            })}
          />
          <PasswordInput
            label="Confirm Password"
            placeholder="Repeat your password"
            leftSection={<IconLock size={16} />}
            error={errors.confirmPassword?.message}
            {...register("confirmPassword", {
              required: "Confirm password field cannot be empty",
              validate: (value, formValues) =>
                value === formValues.password || "Your password does not match.",
            })}
          />
          <Divider />

          <Group justify="flex-end">
            <Button variant="light" onClick={closePasswordModal} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" radius="md" loading={isLoading}>
              Change Password
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
};

export default PasswordModal;
