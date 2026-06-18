"use client";

import { insertError } from "@/app/actions";
import { isAppError } from "@/utils/functions";
import { supabaseClient } from "@/utils/supabase/client";
import {
  Box,
  Button,
  Container,
  Group,
  Loader,
  Stack,
  Text,
  ThemeIcon,
  Title,
  useComputedColorScheme,
} from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { IconCheck, IconHome, IconX } from "@tabler/icons-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const AuthCallbackPage = () => {
  const pathname = usePathname();
  const router = useRouter();
  const isMobile = useMediaQuery("(max-width: 992px)");
  const computedColorScheme = useComputedColorScheme();
  const isDark = computedColorScheme === "dark";

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Processing your sign in...");

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabaseClient.auth.getSession();

        if (error || !session) {
          setStatus("error");
          setMessage("Sign in verification failed. Please try again.");
          return;
        }

        setStatus("success");
        setMessage("You have successfully logged in! Redirecting...");

        router.push("/user/onboarding");
      } catch (e) {
        setStatus("error");
        notifications.show({
          message: "Something went wrong. Please try again later.",
          color: "red",
        });
        if (isAppError(e)) {
          await insertError(supabaseClient, {
            errorTableInsert: {
              error_message: e.message,
              error_url: pathname,
              error_function: "handleAuthCallback",
            },
          });
        }
      }
    };

    handleAuthCallback();
  }, [router, pathname]);

  return (
    <Box
      style={({ colors }) => ({
        minHeight: "70vh",
        display: "flex",
        alignItems: "center",
        background: isDark ? colors.dark[6] : colors.gray[2],
      })}
    >
      <Container size="lg" py={isMobile ? "xl" : 80}>
        <Stack align="center" gap="xl">
          <ThemeIcon
            size={80}
            radius="xl"
            variant="filled"
            color={status === "success" ? "green" : status === "error" ? "red" : "blue"}
          >
            {status === "loading" && <Loader size={24} color="white" />}
            {status === "success" && <IconCheck size={36} />}
            {status === "error" && <IconX size={36} />}
          </ThemeIcon>

          <Title order={1} ta="center" style={{ fontSize: isMobile ? 32 : 40 }}>
            {status === "loading" ? "Processing..." : status === "success" ? "Welcome!" : "Oops!"}
          </Title>

          <Text size="lg" ta="center" maw={600} c={isDark ? "gray.4" : "gray.7"}>
            {message}
          </Text>

          {status === "error" && (
            <Group gap="md" mt="xl">
              <Button
                component={Link}
                href="/sign-in"
                size="md"
                radius="xl"
                leftSection={<IconHome size={18} />}
              >
                Back to Sign In
              </Button>
            </Group>
          )}
        </Stack>
      </Container>
    </Box>
  );
};

export default AuthCallbackPage;
