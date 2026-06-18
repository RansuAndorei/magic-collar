import { Box, rem, Stack, Text, Title } from "@mantine/core";
import { IconCheck } from "@tabler/icons-react";

type Props = {
  firstName: string;
};

const StepDone = ({ firstName }: Props) => {
  return (
    <Stack align="center" gap="lg" style={{ textAlign: "center" }} py="md">
      <Box
        w={72}
        h={72}
        style={{
          borderRadius: "50%",
          background: "var(--mantine-color-red-light)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <IconCheck size={36} color="var(--mantine-color-red-5)" stroke={2.5} />
      </Box>
      <Stack gap={6}>
        <Title order={3} style={{ fontSize: rem(20), fontWeight: 800 }}>
          You're all set, {firstName}!
        </Title>
        <Text c="dimmed" size="sm" maw={340}>
          Your profile and delivery address have been saved. You can now start shopping for your
          Magic Collar parts.
        </Text>
      </Stack>
    </Stack>
  );
};

export default StepDone;
