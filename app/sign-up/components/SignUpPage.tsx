"use client";

import { insertError } from "@/app/actions";
import OAuth from "@/app/components/OAuth";
import { LOGO_PATH, TEXT_LIMITS } from "@/utils/constants";
import { isAppError } from "@/utils/functions";
import { supabaseClient } from "@/utils/supabase/client";
import {
  Anchor,
  Box,
  Button,
  Card,
  Checkbox,
  Container,
  Divider,
  PasswordInput,
  rem,
  Stack,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconLock, IconMail } from "@tabler/icons-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { checkIfEmailExists, signUpUser } from "../actions";

type FormValues = {
  email: string;
  password: string;
  confirmPassword: string;
  agreeToTerms: boolean;
};

const SignUpPage = () => {
  const router = useRouter();
  const pathname = usePathname();

  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    getValues,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
      agreeToTerms: false,
    },
  });

  const onSubmit = async (data: FormValues) => {
    try {
      setIsLoading(true);
      const isEmailExists = await checkIfEmailExists(supabaseClient, {
        email: data.email,
      });

      if (isEmailExists) {
        notifications.show({
          message: "Email already registered and onboarded.",
          color: "orange",
          autoClose: false,
        });
        setIsLoading(false);
        return;
      }

      const { data: newUserData, customError } = await signUpUser(supabaseClient, {
        email: data.email,
        password: data.password,
      });
      if (customError && customError === "Email already registered.") {
        notifications.show({
          message: "This email is already registered. Please go to the Sign In page.",
          color: "orange",
          autoClose: false,
        });
        setIsLoading(false);
        return;
      }

      notifications.show({
        message: "Confirmation email sent. Please check your email inbox to proceed.",
        color: "green",
        autoClose: false,
      });
      router.push(`/sign-up/success?confirmationId=${newUserData.user?.id}&email=${data.email}`);
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
            error_function: "handleSignUp",
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
      <Container size={520} w="100%">
        <Stack gap="xl">
          {/* Logo */}
          <Stack gap="xs" align="center">
            <Link href="/" style={{ textDecoration: "none" }}>
              <Image alt="Magic Collar logo" src={LOGO_PATH} width={100} height={44} priority />
            </Link>
            <Stack gap={2} style={{ textAlign: "center" }}>
              <Title order={2} style={{ fontSize: rem(26), fontWeight: 800 }}>
                Create your account
              </Title>
              <Text c="dimmed" size="sm">
                Join Magic Collar — retail buyers and resellers welcome
              </Text>
            </Stack>
          </Stack>

          <Card withBorder radius="md" p="xl">
            <Stack gap="lg">
              {/* Social sign up */}
              <OAuth />

              <Divider label="or sign up with email" labelPosition="center" />

              {/* Form */}
              <form onSubmit={handleSubmit(onSubmit)}>
                <Stack gap="md">
                  <TextInput
                    label="Email"
                    placeholder="johndoe@email.com"
                    required
                    leftSection={<IconMail size={16} />}
                    error={errors.email?.message}
                    {...register("email", {
                      required: "Email is required",
                      pattern: {
                        value: /^\S+@\S+\.\S+$/,
                        message: "Enter a valid email",
                      },
                    })}
                    maxLength={TEXT_LIMITS.medium}
                  />

                  <PasswordInput
                    label="Password"
                    placeholder="At least 8 characters"
                    required
                    leftSection={<IconLock size={16} />}
                    error={errors.password?.message}
                    {...register("password", {
                      required: "Password is required",
                      minLength: { value: 8, message: "Password must be at least 8 characters" },
                    })}
                    maxLength={TEXT_LIMITS.long}
                  />

                  <PasswordInput
                    label="Confirm Password"
                    placeholder="Repeat your password"
                    required
                    leftSection={<IconLock size={16} />}
                    error={errors.confirmPassword?.message}
                    {...register("confirmPassword", {
                      required: "Please confirm your password",
                      validate: (value) =>
                        value === getValues("password") || "Passwords do not match",
                    })}
                    maxLength={TEXT_LIMITS.long}
                  />

                  {/* Terms */}
                  <Controller
                    name="agreeToTerms"
                    control={control}
                    rules={{ required: "You must agree to the terms to continue" }}
                    render={({ field }) => (
                      <Checkbox
                        checked={field.value}
                        onChange={field.onChange}
                        error={errors.agreeToTerms?.message}
                        size="sm"
                        mt="xs"
                        label={
                          <Text size="sm">
                            I agree to the{" "}
                            <Anchor
                              href="/terms-of-service"
                              c="red.5"
                              underline="hover"
                              size="sm"
                              target="_blank"
                            >
                              Terms of Service
                            </Anchor>{" "}
                            and{" "}
                            <Anchor
                              href="/privacy-policy"
                              c="red.5"
                              underline="hover"
                              size="sm"
                              target="_blank"
                            >
                              Privacy Policy
                            </Anchor>
                          </Text>
                        }
                      />
                    )}
                  />

                  <Button type="submit" color="red" size="md" fullWidth loading={isLoading} mt="xs">
                    Create Account
                  </Button>
                </Stack>
              </form>
            </Stack>
          </Card>

          <Text size="sm" c="dimmed" style={{ textAlign: "center" }}>
            Already have an account?{" "}
            <Text component={Link} href="/sign-in" c="red.5" fw={500}>
              Sign in
            </Text>
          </Text>
        </Stack>
      </Container>
    </Box>
  );
};

export default SignUpPage;
