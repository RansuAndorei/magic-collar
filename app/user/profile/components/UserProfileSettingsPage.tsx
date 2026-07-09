"use client";

import { insertError, uploadFile } from "@/app/actions";
import { useUserActions, useUserData, useUserProfile } from "@/stores/useUserStore";
import { MAX_FILE_SIZE, TEXT_LIMITS } from "@/utils/constants";
import dayjs from "@/utils/dayjs";
import { generateAvatarColor, isAppError } from "@/utils/functions";
import { supabaseClient } from "@/utils/supabase/client";
import {
  Avatar,
  Badge,
  Box,
  Button,
  Card,
  Container,
  Divider,
  FileButton,
  Flex,
  Group,
  rem,
  Stack,
  Tabs,
  Text,
  TextInput,
  Title,
  useMantineTheme,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import {
  IconCamera,
  IconDeviceFloppy,
  IconLock,
  IconMail,
  IconMapPin,
  IconShieldCheck,
  IconUser,
} from "@tabler/icons-react";
import { isEqual } from "lodash";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { updateUser } from "../actions";
import PasswordModal from "./PasswordModal";
import ProfileAddressSection from "./ProfileAddressSection";
import ProfileSkeleton from "./ProfileSkeleton";

type Props = {
  regionList: {
    label: string;
    value: string;
  }[];
};

const UserProfileSettingsPage = ({ regionList }: Props) => {
  const theme = useMantineTheme();
  const pathname = usePathname();
  const userProfile = useUserProfile();
  const userData = useUserData();
  const { setUserProfile } = useUserActions();

  const [userProfileData, setUserProfileData] = useState(userProfile || null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [passwordModalOpened, { open: openPasswordModal, close: closePasswordModal }] =
    useDisclosure(false);

  const handleAvatarChange = (file: File | null) => {
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      notifications.show({
        color: "red",
        title: "File too large",
        message: "Please upload an image not exceeding 5 MB.",
      });
      return;
    }

    setAvatarFile(file);
    handleUpdateUserData("user_avatar", URL.createObjectURL(file));
  };

  const handleSave = async () => {
    if (!userProfileData || !userProfile) return;

    const { user_first_name, user_last_name, user_email, user_phone_number } = userProfileData;

    const trimmedFirstName = user_first_name.trim();
    const trimmedLastName = user_last_name.trim();
    const trimmedEmail = user_email.trim();

    const errors: string[] = [];
    if (!trimmedFirstName) errors.push("First Name");
    if (!trimmedLastName) errors.push("Last Name");
    if (!trimmedEmail) errors.push("Email");
    if (!user_phone_number) errors.push("Phone Number");

    if (errors.length > 0) {
      notifications.show({
        message: `${errors.join(", ")} ${errors.length === 1 ? "is" : "are"} required`,
        color: "orange",
      });
      return;
    }

    try {
      setIsLoading(true);

      let newAvatarUrl = "";
      if (avatarFile) {
        const { publicUrl } = await uploadFile(supabaseClient, {
          file: avatarFile,
          bucket: "USER_AVATARS",
          fileName: avatarFile.name,
        });
        newAvatarUrl = publicUrl;
      }

      await updateUser(supabaseClient, {
        userData: {
          user_avatar: newAvatarUrl || userProfile.user_avatar,
          user_first_name: trimmedFirstName,
          user_last_name: trimmedLastName,
          user_email: trimmedEmail,
          user_phone_number: userProfileData.user_phone_number,
        },
        userId: userProfile.user_id,
      });

      setUserProfile({
        ...userProfile,
        user_first_name: trimmedFirstName,
        user_last_name: trimmedLastName,
        user_email: trimmedEmail,
        user_phone_number: userProfileData.user_phone_number,
      });

      notifications.show({
        message: "Profile updated successfully.",
        color: "green",
      });
    } catch (e) {
      notifications.show({
        message: "Something went wrong. Please try again later.",
        color: "red",
      });
      if (isAppError(e)) {
        await insertError(supabaseClient, {
          errorTableInsert: {
            error_message: e.message,
            error_url: pathname,
            error_function: "handleSave",
            error_user_email: userProfile.user_email,
            error_user_id: userProfile.user_id,
          },
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateUserData = (key: string, value: string | null) => {
    setUserProfileData((prev) => {
      if (prev) {
        return {
          ...prev,
          [key]: value,
        };
      } else {
        return null;
      }
    });
  };

  if (!userProfileData || !userData || !userProfile) return <ProfileSkeleton />;

  return (
    <Box py={{ base: rem(32), md: rem(56) }}>
      <Container size="lg">
        <Stack gap="xl">
          <Stack gap={4}>
            <Text size="sm" c="red.5" fw={700} tt="uppercase">
              My Account
            </Text>
            <Title order={1} style={{ fontSize: rem(34), fontWeight: 800 }}>
              Profile Settings
            </Title>
            <Text c="dimmed">Manage your personal information, security, and saved addresses.</Text>
          </Stack>

          <Tabs defaultValue="profile" color="red" variant="outline" radius="md">
            <Tabs.List mb="md">
              <Tabs.Tab value="profile" leftSection={<IconUser size={16} />}>
                Profile
              </Tabs.Tab>
              <Tabs.Tab value="addresses" leftSection={<IconMapPin size={16} />}>
                Addresses
              </Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value="profile">
              <Stack gap="lg">
                <Card withBorder p={{ base: "lg", xs: "xl" }} radius="md">
                  <Group>
                    <Box style={{ position: "relative" }}>
                      <Avatar
                        src={userProfileData.user_avatar}
                        size={120}
                        radius={120}
                        style={{
                          border: `4px solid ${theme.colors.dark[5]}`,
                          backgroundColor: generateAvatarColor(userProfile?.user_id),
                        }}
                        color="white"
                      >
                        {userProfile.user_first_name.charAt(0)}
                        {userProfile.user_last_name.charAt(0)}
                      </Avatar>
                      <FileButton onChange={handleAvatarChange} accept="image/png,image/jpeg">
                        {(props) => (
                          <Box
                            {...props}
                            style={{
                              position: "absolute",
                              bottom: 0,
                              right: 0,
                              background: theme.colors.red[6],
                              borderRadius: "50%",
                              width: 36,
                              height: 36,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              cursor: "pointer",
                              border: `3px solid ${theme.white}`,
                            }}
                          >
                            <IconCamera size={18} color={theme.white} />
                          </Box>
                        )}
                      </FileButton>
                    </Box>
                    <Box>
                      <Text fw={700} size="xl">
                        {userProfile.user_first_name} {userProfile.user_last_name}
                      </Text>
                      <Text size="sm" c="dimmed">
                        {userProfile.user_email}
                      </Text>
                      <Badge mt="xs" variant="light" color="red">
                        Active Member
                      </Badge>
                    </Box>
                  </Group>
                </Card>

                <Card withBorder p={{ base: "lg", xs: "xl" }} radius="md">
                  <Group mb="lg">
                    <IconUser size={24} color={theme.colors.red[5]} />
                    <Box>
                      <Text fw={600} size="lg">
                        Personal Information
                      </Text>
                      <Text size="sm" c="dimmed">
                        Update your personal details
                      </Text>
                    </Box>
                  </Group>

                  <Stack gap="md">
                    <Group grow>
                      <TextInput
                        label="First Name"
                        placeholder="Enter first name"
                        value={userProfileData.user_first_name}
                        onChange={(e) => {
                          const value = e.currentTarget.value;
                          handleUpdateUserData("user_first_name", value);
                        }}
                        maxLength={50}
                      />
                      <TextInput
                        label="Last Name"
                        placeholder="Enter last name"
                        value={userProfileData.user_last_name}
                        onChange={(e) => {
                          const value = e.currentTarget.value;
                          handleUpdateUserData("user_last_name", value);
                        }}
                        maxLength={50}
                      />
                    </Group>

                    <TextInput
                      label="Email"
                      placeholder="your.email@example.com"
                      value={userProfileData.user_email}
                      onChange={(e) => {
                        const value = e.currentTarget.value;
                        handleUpdateUserData("user_email", value);
                      }}
                      leftSection={<IconMail size={14} />}
                      type="email"
                      readOnly
                      variant="filled"
                      maxLength={TEXT_LIMITS.medium}
                    />

                    <TextInput
                      label="Phone Number"
                      placeholder="09123456789"
                      value={userProfileData.user_phone_number}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        let value = e.currentTarget.value;
                        value = value.replace(/\D/g, "");
                        if (value.length > 10) {
                          value = value.slice(0, 10);
                        }
                        if (value && !value.startsWith("9")) {
                          return;
                        }
                        handleUpdateUserData("user_phone_number", value);
                      }}
                      leftSection={<Text size="sm">+63</Text>}
                    />
                  </Stack>
                </Card>

                <Card withBorder p={{ base: "lg", xs: "xl" }} radius="md">
                  <Group justify="space-between" mb="md">
                    <Group>
                      <IconShieldCheck size={24} color={theme.colors.red[5]} />
                      <Box>
                        <Text fw={600} size="lg">
                          Security
                        </Text>
                        <Text size="sm" c="dimmed">
                          Manage your password and security settings
                        </Text>
                      </Box>
                    </Group>
                    <Button
                      leftSection={<IconLock size={18} />}
                      onClick={openPasswordModal}
                      variant="light"
                      color="red"
                      radius="md"
                    >
                      Change Password
                    </Button>
                  </Group>

                  <Divider my="md" />

                  <Group gap="xs">
                    <IconLock size={16} color={theme.colors.red[5]} />
                    <Text size="sm" c="dimmed">
                      User data last changed: {dayjs(userData.updated_at).fromNow()}
                    </Text>
                  </Group>
                </Card>

                <Flex align="center" justify="flex-end">
                  <Button
                    size="md"
                    color="red"
                    leftSection={<IconDeviceFloppy size={18} />}
                    onClick={handleSave}
                    loading={isLoading}
                    disabled={isEqual(userProfile, userProfileData)}
                  >
                    Save
                  </Button>
                </Flex>
              </Stack>
            </Tabs.Panel>

            <Tabs.Panel value="addresses">
              <ProfileAddressSection regionList={regionList} />
            </Tabs.Panel>
          </Tabs>
        </Stack>
        <PasswordModal
          passwordModalOpened={passwordModalOpened}
          closePasswordModal={closePasswordModal}
        />
      </Container>
    </Box>
  );
};

export default UserProfileSettingsPage;
