import { ActionIcon, Tooltip, useComputedColorScheme, useMantineColorScheme } from "@mantine/core";
import { IconMoon, IconSun } from "@tabler/icons-react";

const ColorModeToggle = () => {
  const { setColorScheme } = useMantineColorScheme();
  const computed = useComputedColorScheme("dark");
  const isDark = computed === "dark";

  return (
    <Tooltip label={isDark ? "Switch to light mode" : "Switch to dark mode"} position="bottom">
      <ActionIcon
        variant="light"
        color={isDark ? "yellow" : "gray"}
        size="lg"
        radius="md"
        onClick={() => setColorScheme(isDark ? "light" : "dark")}
        aria-label="Toggle color scheme"
      >
        {isDark ? <IconSun size={14} /> : <IconMoon size={14} />}
      </ActionIcon>
    </Tooltip>
  );
};

export default ColorModeToggle;
