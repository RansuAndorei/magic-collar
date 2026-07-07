"use client";

import { insertError } from "@/app/actions";
import OAuth from "@/app/components/OAuth";
import { LOGO_PATH, TEXT_LIMITS } from "@/utils/constants";
import { isAppError } from "@/utils/functions";
import { supabaseClient } from "@/utils/supabase/client";
import {
  Box,
  Button,
  Card,
  Container,
  Divider,
  Group,
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
import { useForm } from "react-hook-form";
import { signInUser } from "../actions";

type FormValues = {
  email: string;
  password: string;
  remember: boolean;
};

const SignInPage = () => {
  const router = useRouter();
  const pathname = usePathname();

  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: { email: "", password: "", remember: false },
  });

  const onSubmit = async (data: FormValues) => {
    try {
      setIsLoading(true);
      const { error } = await signInUser(supabaseClient, {
        email: data.email,
        password: data.password,
      });
      if (error) {
        if (error.message.toLowerCase().includes("invalid login credentials")) {
          notifications.show({
            message: "Invalid sign in credentials.",
            color: "red",
          });
          setIsLoading(false);
          return;
        } else if (error.message.toLowerCase().includes("authapierror: email not confirmed")) {
          notifications.show({
            message:
              "You need to verify your email first before proceeding to formsly. If you don't received the verification email, you can try to sign up again",
            color: "orange",
            autoClose: false,
          });
          setIsLoading(false);
          return;
        } else throw error;
      }

      notifications.show({
        message: "Sign in successful.",
        color: "green",
      });

      router.push("/user/onboarding");
    } catch (e) {
      notifications.show({
        message: "Something went wrong. Please try again later.",
        color: "red",
      });
      setIsLoading(false);
      if (isAppError(e)) {
        await insertError(supabaseClient, {
          errorTableInsert: {
            error_message: e.message,
            error_url: pathname,
            error_function: "onSubmit",
          },
        });
      }
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
          {/* Logo */}
          <Stack gap="xs" align="center">
            <Link href="/" style={{ textDecoration: "none" }}>
              <Image alt="Magic Collar logo" src={LOGO_PATH} width={100} height={44} priority />
            </Link>
            <Stack gap={2} style={{ textAlign: "center" }}>
              <Title order={2} style={{ fontSize: rem(26), fontWeight: 800 }}>
                Welcome back
              </Title>
              <Text c="dimmed" size="sm">
                Sign in to your Magic Collar account
              </Text>
            </Stack>
          </Stack>

          <Card withBorder radius="md" p="xl">
            <Stack gap="lg">
              {/* Social sign in */}
              <OAuth />

              <Divider label="or sign in with email" labelPosition="center" />

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
                    placeholder="Your password"
                    required
                    leftSection={<IconLock size={16} />}
                    error={errors.password?.message}
                    {...register("password", {
                      required: "Password is required",
                      minLength: { value: 8, message: "Password must be at least 8 characters" },
                    })}
                    maxLength={TEXT_LIMITS.long}
                  />

                  <Group justify="flex-end">
                    <Text size="sm" c="red.5">
                      <Link
                        href="/forgot-password"
                        style={{ textDecoration: "none", color: "inherit" }}
                      >
                        Forgot password?
                      </Link>
                    </Text>
                  </Group>

                  <Button type="submit" color="red" size="md" fullWidth loading={isLoading} mt="xs">
                    Sign In
                  </Button>
                </Stack>
              </form>
            </Stack>
          </Card>

          <Text size="sm" c="dimmed" style={{ textAlign: "center" }}>
            Don&apos;t have an account?{" "}
            <Text component={Link} href="/sign-up" c="red.5" fw={500}>
              Create one
            </Text>
          </Text>
        </Stack>
      </Container>
    </Box>
  );
};

export default SignInPage;
