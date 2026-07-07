"use client";

import { insertError } from "@/app/actions";
import { useUserData } from "@/stores/useUserStore";
import { LOGO_PATH, TEXT_LIMITS } from "@/utils/constants";
import { isAppError } from "@/utils/functions";
import { supabaseClient } from "@/utils/supabase/client";
import {
  Alert,
  Box,
  Button,
  Card,
  Container,
  PasswordInput,
  rem,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconAlertCircle, IconArrowLeft, IconCheck, IconLock } from "@tabler/icons-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { resetPassword } from "../actions";

type FormValues = {
  password: string;
  confirmPassword: string;
};

const ResetPasswordPage = () => {
  const pathname = usePathname();
  const router = useRouter();
  const userData = useUserData();

  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [hasRecoverySession, setHasRecoverySession] = useState(false);

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: { password: "", confirmPassword: "" },
  });

  useEffect(() => {
    const checkRecoverySession = async () => {
      const { data } = await supabaseClient.auth.getSession();
      setHasRecoverySession(Boolean(data.session));
      setIsCheckingSession(false);
    };

    checkRecoverySession();
  }, []);

  const onSubmit = async ({ password }: FormValues) => {
    if (!userData) {
      notifications.show({
        message: "Unauthorized submission.",
        color: "red",
      });
      router.push("/sign-in");
      return;
    }

    try {
      setIsLoading(true);

      const { error } = await resetPassword(supabaseClient, { password });
      if (error) {
        notifications.show({
          message: error.message || "Unable to reset password. Please request a new reset link.",
          color: "red",
        });
        setIsLoading(false);
        return;
      }

      notifications.show({
        message: "Password reset successful. Please sign in with your new password.",
        color: "green",
      });
      router.push("/sign-in");
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
            error_function: "handleResetPassword",
          },
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box
      style={{ minHeight: "100vh", display: "flex", alignItems: "center" }}
      py={{ base: rem(40), md: rem(80) }}
      className="section-alt"
    >
      <Container size={480} w="100%">
        <Stack gap="xl">
          <Stack gap="xs" align="center">
            <Link href="/" style={{ textDecoration: "none" }}>
              <Image alt="Magic Collar logo" src={LOGO_PATH} width={100} height={44} priority />
            </Link>
            <Stack gap={2} style={{ textAlign: "center" }}>
              <Title order={2} style={{ fontSize: rem(26), fontWeight: 800 }}>
                Reset password
              </Title>
              <Text c="dimmed" size="sm">
                Choose a new password for your Magic Collar account
              </Text>
            </Stack>
          </Stack>

          <Card withBorder radius="md" p="xl">
            <Stack gap="lg">
              {!isCheckingSession && !hasRecoverySession ? (
                <Alert color="red" icon={<IconAlertCircle size={18} />} title="Reset link expired">
                  This password reset link is invalid or has expired. Please request a new one to
                  continue.
                </Alert>
              ) : null}

              <form onSubmit={handleSubmit(onSubmit)}>
                <Stack gap="md">
                  <PasswordInput
                    label="New Password"
                    placeholder="At least 8 characters"
                    required
                    leftSection={<IconLock size={16} />}
                    error={errors.password?.message}
                    disabled={!isCheckingSession && !hasRecoverySession}
                    {...register("password", {
                      required: "Password is required",
                      minLength: { value: 8, message: "Password must be at least 8 characters" },
                    })}
                    maxLength={TEXT_LIMITS.long}
                  />

                  <PasswordInput
                    label="Confirm New Password"
                    placeholder="Repeat your new password"
                    required
                    leftSection={<IconLock size={16} />}
                    error={errors.confirmPassword?.message}
                    disabled={!isCheckingSession && !hasRecoverySession}
                    {...register("confirmPassword", {
                      required: "Please confirm your password",
                      validate: (value) =>
                        value === getValues("password") || "Passwords do not match",
                    })}
                    maxLength={TEXT_LIMITS.long}
                  />

                  <Button
                    type="submit"
                    color="red"
                    size="md"
                    fullWidth
                    loading={isLoading || isCheckingSession}
                    disabled={!isCheckingSession && !hasRecoverySession}
                    mt="xs"
                    rightSection={<IconCheck size={16} />}
                  >
                    Update Password
                  </Button>
                </Stack>
              </form>
            </Stack>
          </Card>

          <Link
            href="/sign-in"
            style={{
              color: "var(--mantine-color-dimmed)",
              fontSize: "var(--mantine-font-size-sm)",
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              gap: rem(6),
              justifyContent: "center",
            }}
          >
            <IconArrowLeft size={14} />
            Back to Sign In
          </Link>
        </Stack>
      </Container>
    </Box>
  );
};

export default ResetPasswordPage;
