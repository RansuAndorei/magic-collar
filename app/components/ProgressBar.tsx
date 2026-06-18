"use client";

import { useLoadingActions, useLoadingStore } from "@/stores/useLoadingStore";
import { useMantineTheme } from "@mantine/core";
import { NavigationProgress, nprogress } from "@mantine/nprogress";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useTransition } from "react";

const ProgressBar = () => {
  const pathname = usePathname();
  const theme = useMantineTheme();
  const previousPathname = useRef(pathname);
  const isLoading = useLoadingStore();
  const { setIsLoading } = useLoadingActions();
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (previousPathname.current !== pathname) {
      if (isLoading) {
        setIsLoading(false);
      }

      startTransition(() => {});
      previousPathname.current = pathname;
    }
  }, [pathname, startTransition]);

  useEffect(() => {
    if (isPending) {
      nprogress.start();
    } else {
      setTimeout(
        () => {
          nprogress.complete();
        },
        Math.floor(Math.random() * (300 - 100 + 1)) + 100,
      );
    }
  }, [isPending]);

  return <NavigationProgress color={theme.primaryColor} />;
};

export default ProgressBar;
