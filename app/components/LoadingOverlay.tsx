"use client";

import { useIsLoading } from "@/stores/useLoadingStore";
import { LoadingOverlay as MantineLoadingOverlay } from "@mantine/core";

const LoadingOverlay = () => {
  const isLoading = useIsLoading();

  return (
    <MantineLoadingOverlay
      visible={isLoading}
      overlayProps={{ blur: 2 }}
      style={{ position: "fixed" }}
    />
  );
};

export default LoadingOverlay;
