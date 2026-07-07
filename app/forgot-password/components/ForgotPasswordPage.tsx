"use client";

import { LOGO_PATH, TEXT_LIMITS } from "@/utils/constants";
import {
  Anchor,
  Box,
  Button,
  Card,
  Container,
  rem,
  Stack,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { IconArrowLeft, IconMail, IconSend } from "@tabler/icons-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";

type FormValues = {
  email: string;
};

const ForgotPasswordPage = () => {
  const [submitted, setSubmitted] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    defaultValues: { email: "" },
  });

  const onSubmit = async (values: FormValues) => {
    // TODO: wire up to Supabase auth.resetPasswordForEmail()
    console.log(values);
    setSubmittedEmail(values.email);
    setSubmitted(true);
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
          </Stack>

          <Card withBorder radius="md" p="xl">
            {!submitted ? (
              <Stack gap="lg">
                <Stack gap={4}>
                  <Title order={2} style={{ fontSize: rem(24), fontWeight: 800 }}>
                    Forgot your password?
                  </Title>
                  <Text c="dimmed" size="sm" style={{ lineHeight: 1.6 }}>
                    No worries. Enter your email and we&apos;ll send you a link to reset your
                    password.
                  </Text>
                </Stack>

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

                    <Button
                      type="submit"
                      color="red"
                      size="md"
                      fullWidth
                      loading={isSubmitting}
                      rightSection={<IconSend size={16} />}
                    >
                      Send Reset Link
                    </Button>
                  </Stack>
                </form>
              </Stack>
            ) : (
              // Success state
              <Stack gap="lg" align="center" style={{ textAlign: "center" }}>
                <Box
                  w={64}
                  h={64}
                  style={{
                    borderRadius: "50%",
                    background: "var(--mantine-color-red-light)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <IconMail size={28} color="var(--mantine-color-red-5)" />
                </Box>
                <Stack gap={4}>
                  <Title order={2} style={{ fontSize: rem(22), fontWeight: 800 }}>
                    Check your email
                  </Title>
                  <Text c="dimmed" size="sm" style={{ lineHeight: 1.6 }}>
                    We sent a password reset link to{" "}
                    <Text component="span" fw={600} c="inherit">
                      {submittedEmail}
                    </Text>
                    . It may take a few minutes to arrive.
                  </Text>
                </Stack>
                <Text size="xs" c="dimmed">
                  Didn&apos;t receive it?{" "}
                  <Anchor
                    c="red.5"
                    underline="hover"
                    size="xs"
                    onClick={() => setSubmitted(false)}
                    style={{ cursor: "pointer" }}
                  >
                    Try again
                  </Anchor>
                </Text>
              </Stack>
            )}
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

export default ForgotPasswordPage;
