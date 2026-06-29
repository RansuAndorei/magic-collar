import { Box, Container, Group, Paper, rem } from "@mantine/core";
import { ReactNode } from "react";
import AdminSidebar from "./AdminSidebar";

type Props = {
  children: ReactNode;
};

const AdminLayout = ({ children }: Props) => {
  return (
    <Box mih="100vh" bg="var(--mantine-color-body)">
      <Container size="xl" py={{ base: "md", lg: "xl" }}>
        <Group align="flex-start" gap="xl" wrap="nowrap">
          <Paper
            visibleFrom="lg"
            w={300}
            p="md"
            radius="md"
            withBorder
            style={{ position: "sticky", top: rem(88), flexShrink: 0 }}
          >
            <AdminSidebar />
          </Paper>
          {children}
        </Group>
      </Container>
    </Box>
  );
};

export default AdminLayout;
