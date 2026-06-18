"use client";

import { useAuthListener } from "@/hooks/useAuthListener";
import { useUserHasInitialized, useUserIsLoading } from "@/stores/useUserStore";
import { MantineProvider } from "@mantine/core";
import { ModalsProvider } from "@mantine/modals";
import { Notifications } from "@mantine/notifications";
import { ReactNode } from "react";
import CustomLoader from "./components/CustomLoader";
import ProgressBar from "./components/ProgressBar";

type Props = {
  children: ReactNode;
};

export function Providers({ children }: Props) {
  useAuthListener();
  const isLoading = useUserIsLoading();
  const hasInitialized = useUserHasInitialized();

  const showInitialLoader = isLoading && !hasInitialized;

  return (
    <MantineProvider
      defaultColorScheme="dark"
      theme={{
        primaryColor: "red",
        fontFamily: "var(--font-body), sans-serif",
        fontFamilyMonospace: "monospace",
        headings: {
          fontFamily: "var(--font-heading), sans-serif",
          fontWeight: "700",
        },
        colors: {
          dark: [
            "#C1C2C5",
            "#A6A7AB",
            "#909296",
            "#5C5F66",
            "#373A40",
            "#2C2E33",
            "#25262B",
            "#1A1B1E",
            "#141517",
            "#101113",
          ],
        },
        components: {
          Switch: {
            styles: {
              root: { cursor: "pointer" },
              label: { cursor: "pointer" },
              input: { cursor: "pointer" },
              track: { cursor: "pointer" },
              thumb: { cursor: "pointer" },
            },
          },
          Button: { defaultProps: { radius: "md" } },
          Card: { defaultProps: { radius: "md" } },
          Badge: { defaultProps: { radius: "sm" } },
          Checkbox: {
            styles: {
              input: { cursor: "pointer" },
            },
          },
          Radio: {
            styles: {
              radio: {
                cursor: "pointer",
              },
              label: {
                cursor: "pointer",
              },
            },
          },
        },
      }}
    >
      <ModalsProvider>
        <ProgressBar />
        <Notifications />
        {showInitialLoader ? <CustomLoader /> : children}
      </ModalsProvider>
    </MantineProvider>
  );
}
