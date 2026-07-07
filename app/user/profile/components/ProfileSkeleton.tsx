import { Box, Container, Divider, Group, Paper, Skeleton, Stack } from "@mantine/core";

const ProfileSkeleton = () => {
  return (
    <Box
      style={{
        minHeight: "100vh",
        padding: "48px 0",
      }}
    >
      <Container size="md">
        {/* Header */}
        <Box>
          <Skeleton height={36} mb="xs" width="40%" radius="sm" />
          <Skeleton height={24} width="60%" />
        </Box>

        <Stack gap="lg" mt="xl">
          {/* Avatar Section */}
          <Paper p="xl" radius="lg" shadow="sm">
            <Group>
              <Skeleton circle height={120} width={120} />
              <Stack gap="sm" style={{ flex: 1 }}>
                <Skeleton height={24} width="60%" />
                <Skeleton height={20} width="40%" />
                <Skeleton height={20} width="30%" />
              </Stack>
            </Group>
          </Paper>

          {/* Personal Information */}
          <Paper p="xl" radius="lg" shadow="sm">
            <Group mb="lg">
              <Skeleton circle height={24} width={24} />
              <Stack gap="xs">
                <Skeleton height={24} width="40%" />
                <Skeleton height={20} width="60%" />
              </Stack>
            </Group>

            <Stack gap="md">
              <Group grow>
                <Skeleton height={40} width="100%" />
                <Skeleton height={40} width="100%" />
              </Group>
              <Skeleton height={40} width="100%" />
              <Skeleton height={40} width="100%" />
              <Group grow>
                <Skeleton height={40} width="100%" />
                <Skeleton height={40} width="100%" />
              </Group>
            </Stack>
          </Paper>

          {/* Security Section */}
          <Paper p="xl" radius="lg" shadow="sm">
            <Group justify="space-between" mb="md">
              <Group>
                <Skeleton circle height={24} width={24} />
                <Stack gap="xs">
                  <Skeleton height={24} width="60%" />
                  <Skeleton height={20} width="40%" />
                </Stack>
              </Group>
              <Skeleton height={36} width={140} radius="md" />
            </Group>
            <Divider my="md" />
            <Group gap="xs">
              <Skeleton circle height={16} width={16} />
              <Skeleton height={16} width="40%" />
            </Group>
          </Paper>

          {/* Save Button */}
          <Group justify="flex-end">
            <Skeleton height={40} width={160} radius="md" />
          </Group>
        </Stack>
      </Container>
    </Box>
  );
};

export default ProfileSkeleton;
