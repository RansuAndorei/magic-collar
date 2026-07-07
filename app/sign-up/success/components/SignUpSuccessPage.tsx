"use client";

import { LOGO_PATH } from "@/utils/constants";
import {
  Anchor,
  Box,
  Button,
  Card,
  Container,
  rem,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconArrowLeft, IconMail } from "@tabler/icons-react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

const RESEND_COOLDOWN = 60;

const SignUpSuccessPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email");

  const [isResending, setIsResending] = useState(false);
  const [timer, setTimer] = useState(0);

  useEffect(() => {
    if (timer <= 0) return;
    const interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
    return () => clearInterval(interval);
  }, [timer]);

  useEffect(() => {
    if (!email) router.replace("/sign-up");
  }, [email, router]);

  const handleResend = async () => {
    if (!email || isResending || timer > 0) return;

    try {
      setIsResending(true);

      // TODO: replace with your actual Supabase client
      const { createClient } = await import("@supabase/supabase-js");
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      );

      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
      });

      if (error) throw error;

      setTimer(RESEND_COOLDOWN);
      notifications.show({
        message: "Confirmation email sent. Please check your inbox.",
        color: "green",
      });
    } catch {
      notifications.show({
        message: "Something went wrong. Please try again later.",
        color: "red",
      });
    } finally {
      setIsResending(false);
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
          <Stack align="center">
            <Image alt="Magic Collar logo" src={LOGO_PATH} width={100} height={44} priority />
          </Stack>

          <Card withBorder radius="md" p="xl">
            <Stack gap="lg" align="center" style={{ textAlign: "center" }}>
              {/* Icon */}
              <ThemeIcon size={72} radius="xl" color="red" variant="light">
                <IconMail size={36} />
              </ThemeIcon>

              <Stack gap={6}>
                <Title order={2} style={{ fontSize: rem(22), fontWeight: 800 }}>
                  Check your inbox
                </Title>
                <Text c="dimmed" size="sm" maw={360} style={{ lineHeight: 1.7 }}>
                  We sent a confirmation link to{" "}
                  <Text component="span" fw={600} c="inherit">
                    {email}
                  </Text>
                  . Click the link in the email to verify your account and get started.
                </Text>
              </Stack>

              <Stack gap="sm" w="100%">
                <Button
                  variant="light"
                  color="red"
                  size="md"
                  fullWidth
                  loading={isResending}
                  disabled={timer > 0}
                  onClick={handleResend}
                >
                  {timer > 0 ? `Resend Email (${timer}s)` : "Resend Confirmation Email"}
                </Button>
                <Button
                  variant="subtle"
                  color="gray"
                  size="md"
                  fullWidth
                  onClick={() => router.replace("/")}
                >
                  Return to Home
                </Button>
              </Stack>

              <Text c="dimmed" size="xs" mt={4}>
                Can&apos;t find it? Check your spam or junk folder.
              </Text>
            </Stack>
          </Card>

          <Anchor
            href="/sign-in"
            c="dimmed"
            underline="never"
            size="sm"
            style={{
              display: "flex",
              alignItems: "center",
              gap: rem(6),
              justifyContent: "center",
            }}
          >
            <IconArrowLeft size={14} />
            Back to Sign In
          </Anchor>
        </Stack>
      </Container>
    </Box>
  );
};

export default SignUpSuccessPage;
