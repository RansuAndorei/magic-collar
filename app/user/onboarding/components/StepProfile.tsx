import { TEXT_LIMITS } from "@/utils/constants";
import { OnboardingFormValuesType } from "@/utils/types";
import {
  ActionIcon,
  Avatar,
  Box,
  FileButton,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  Tooltip,
} from "@mantine/core";
import { IconCamera, IconMail, IconUser, IconX } from "@tabler/icons-react";
import { Controller, useFormContext } from "react-hook-form";

type Props = {
  userData: any;
  avatarPreview: string | null;
  resetRef: any;
  onAvatarChange: (file: File | null) => void;
  onRemoveAvatar: () => void;
};

const StepProfile = ({
  userData,
  avatarPreview,
  resetRef,
  onAvatarChange,
  onRemoveAvatar,
}: Props) => {
  const {
    register,
    formState: { errors },
    control,
  } = useFormContext<OnboardingFormValuesType>();

  return (
    <Stack gap="lg">
      {/* Avatar */}
      <Stack align="center" gap="sm">
        <Box style={{ position: "relative", display: "inline-block" }}>
          <Avatar src={avatarPreview} size={96} radius="xl" color="red" variant="light">
            <IconUser size={40} />
          </Avatar>
          {avatarPreview && (
            <ActionIcon
              size={24}
              radius="xl"
              color="red"
              variant="filled"
              onClick={onRemoveAvatar}
              style={{ position: "absolute", top: 0, right: 0, zIndex: 1 }}
            >
              <IconX size={12} />
            </ActionIcon>
          )}
          <FileButton
            resetRef={resetRef}
            onChange={onAvatarChange}
            accept="image/png,image/jpeg,image/webp"
          >
            {(props) => (
              <Tooltip label="PNG, JPG, or WebP (max 5 MB)">
                <ActionIcon
                  {...props}
                  size={28}
                  radius="xl"
                  color="red"
                  variant="filled"
                  style={{ position: "absolute", bottom: 0, right: 0 }}
                >
                  <IconCamera size={14} />
                </ActionIcon>
              </Tooltip>
            )}
          </FileButton>
        </Box>
        <Stack gap={2} style={{ textAlign: "center" }}>
          <Text size="sm" fw={500}>
            Profile Photo
          </Text>
          <Text size="xs" c="dimmed">
            Optional · PNG, JPG, WebP
          </Text>
        </Stack>
      </Stack>

      {/* Email */}
      <TextInput
        label="Email"
        value={userData?.email ?? ""}
        readOnly
        leftSection={<IconMail size={16} />}
        variant="filled"
        styles={{ input: { cursor: "not-allowed", opacity: 0.6 } }}
        maxLength={TEXT_LIMITS.medium}
      />

      {/* Name */}
      <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
        <TextInput
          label="First Name"
          placeholder="John"
          required
          error={errors.firstName?.message}
          {...register("firstName", {
            required: "First name is required",
            minLength: { value: 2, message: "Too short" },
          })}
          maxLength={TEXT_LIMITS.short}
        />
        <TextInput
          label="Last Name"
          placeholder="Doe"
          required
          error={errors.lastName?.message}
          {...register("lastName", {
            required: "Last name is required",
            minLength: { value: 2, message: "Too short" },
          })}
          maxLength={TEXT_LIMITS.short}
        />
      </SimpleGrid>

      {/* Phone */}
      <Controller
        control={control}
        name="phone"
        rules={{
          validate: {
            checkNumberOfCharacter: (value) => {
              const stringifiedValue = value ? `${value}` : "";
              if (stringifiedValue.length !== 10) {
                return "Invalid Phone Number";
              }
              return true;
            },
            startsWith: (value) => {
              return `${value}`[0] === "9" ? true : "Phone number must start with 9";
            },
          },
        }}
        render={({ field: { onChange, value } }) => (
          <TextInput
            label="Phone Number"
            placeholder="9123456789"
            maxLength={10}
            required
            value={value ?? ""}
            onChange={(e) => {
              const value = e.currentTarget.value;
              const numberOnly = value.replace(/\D/g, "");
              if (numberOnly.length === 10) {
                onChange(numberOnly);
                return;
              } else {
                onChange(numberOnly);
                return;
              }
            }}
            error={errors.phone?.message}
            leftSection={<Text size="sm">+63</Text>}
          />
        )}
      />
    </Stack>
  );
};

export default StepProfile;
