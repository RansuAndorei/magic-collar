"use client";

import { insertError } from "@/app/actions";
import { useUserData } from "@/stores/useUserStore";
import { TEXT_LIMITS } from "@/utils/constants";
import { formatDate, isAppError } from "@/utils/functions";
import { supabaseClient } from "@/utils/supabase/client";
import { SettingsEnum } from "@/utils/types";
import {
  Alert,
  Button,
  Group,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  ThemeIcon,
  Title,
  rem,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
  IconAlertCircle,
  IconAt,
  IconBrandFacebook,
  IconBrandInstagram,
  IconBrandMessenger,
  IconBrandTiktok,
  IconBrandYoutube,
  IconDeviceFloppy,
  IconPhone,
} from "@tabler/icons-react";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  CONTACT_SETTING_KEYS,
  ContactSettingKey,
  getContactSettings,
  updateSettings,
} from "../actions";

type ValidationType = "email" | "phone" | "link";

type ContactSettingConfig = {
  key: ContactSettingKey;
  label: string;
  placeholder: string;
  icon: typeof IconAt;
  inputType?: string;
  required?: boolean;
  validationType?: ValidationType;
};

const CONTACT_SETTING_CONFIG: ContactSettingConfig[] = [
  {
    key: "EMAIL",
    label: "Email",
    placeholder: "support@magiccollar.com",
    icon: IconAt,
    inputType: "email",
    required: true,
    validationType: "email",
  },
  {
    key: "PHONE_NUMBER",
    label: "Phone Number",
    placeholder: "9123456789",
    icon: IconAt, // unused for phone, see custom render below
    inputType: "tel",
    required: true,
    validationType: "phone",
  },
  {
    key: "MESSENGER",
    label: "Messenger",
    placeholder: "https://m.me/MagicCollarPH",
    icon: IconBrandMessenger,
    inputType: "url",
    validationType: "link",
  },
  {
    key: "FACEBOOK",
    label: "Facebook",
    placeholder: "https://facebook.com/MagicCollarPH",
    icon: IconBrandFacebook,
    inputType: "url",
    validationType: "link",
  },
  {
    key: "TIKTOK",
    label: "TikTok",
    placeholder: "https://tiktok.com/@magiccollar",
    icon: IconBrandTiktok,
    inputType: "url",
    validationType: "link",
  },
  {
    key: "YOUTUBE",
    label: "YouTube",
    placeholder: "https://youtube.com/@magiccollar",
    icon: IconBrandYoutube,
    inputType: "url",
    validationType: "link",
  },
  {
    key: "INSTAGRAM",
    label: "Instagram",
    placeholder: "https://instagram.com/magiccollar",
    icon: IconBrandInstagram,
    inputType: "url",
    validationType: "link",
  },
];

const CONFIG_BY_KEY = CONTACT_SETTING_CONFIG.reduce(
  (accumulator, config) => ({ ...accumulator, [config.key]: config }),
  {} as Record<ContactSettingKey, ContactSettingConfig>,
);

const emptyValues = CONTACT_SETTING_KEYS.reduce(
  (accumulator, key) => ({ ...accumulator, [key]: "" }),
  {} as Record<ContactSettingKey, string>,
);

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const LINK_REGEX = /^https?:\/\/[^\s]+\.[^\s]+$/i;

const validateField = (key: ContactSettingKey, value: string): string | null => {
  const config = CONFIG_BY_KEY[key];
  const trimmed = value.trim();

  if (config.required && !trimmed) {
    return `${config.label} is required.`;
  }

  if (!trimmed) return null;

  switch (config.validationType) {
    case "email":
      return EMAIL_REGEX.test(trimmed) ? null : "Enter a valid email address.";
    case "phone":
      return value.length === 10 ? null : "Enter a valid 10-digit phone number.";
    case "link":
      return LINK_REGEX.test(trimmed)
        ? null
        : "Enter a valid URL (starting with http:// or https://).";
    default:
      return null;
  }
};

const ContactsPage = () => {
  const userData = useUserData();
  const pathname = usePathname();
  const router = useRouter();

  const [values, setValues] = useState<Record<ContactSettingKey, string>>(emptyValues);
  const [initialValues, setInitialValues] =
    useState<Record<ContactSettingKey, string>>(emptyValues);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string | null>(null);
  const [isFetching, setIsFetching] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const changedKeys = useMemo(
    () => CONTACT_SETTING_KEYS.filter((key) => values[key].trim() !== initialValues[key].trim()),
    [initialValues, values],
  );

  const hasChanges = changedKeys.length > 0;

  const errors = useMemo(() => {
    const result = {} as Record<ContactSettingKey, string | null>;
    CONTACT_SETTING_KEYS.forEach((key) => {
      result[key] = validateField(key, values[key]);
    });
    return result;
  }, [values]);

  const hasErrors = useMemo(
    () => CONTACT_SETTING_KEYS.some((key) => Boolean(errors[key])),
    [errors],
  );

  const loadContactSettings = useCallback(async () => {
    if (!userData) return;
    setIsFetching(true);

    try {
      const settings = await getContactSettings(supabaseClient);
      const nextValues = { ...emptyValues };

      settings.forEach((setting) => {
        const key = setting.system_setting_key as SettingsEnum;
        if (CONTACT_SETTING_KEYS.includes(key as ContactSettingKey)) {
          nextValues[key as ContactSettingKey] = setting.system_setting_value;
        }
      });

      const latestUpdatedAt = settings
        .map(
          (setting) => setting.system_setting_date_updated ?? setting.system_setting_date_created,
        )
        .sort()
        .at(-1);

      setValues(nextValues);
      setInitialValues(nextValues);
      setLastUpdatedAt(latestUpdatedAt ?? null);
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
            error_function: "loadContactSettings",
            error_user_email: userData.email,
            error_user_id: userData.id,
          },
        });
      }
    } finally {
      setIsFetching(false);
    }
  }, [userData]);

  useEffect(() => {
    loadContactSettings();
  }, [loadContactSettings]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!userData || !hasChanges) return;

    if (hasErrors) {
      notifications.show({
        message: "Please fix the highlighted fields before saving.",
        color: "red",
      });
      return;
    }

    setIsSaving(true);
    try {
      await updateSettings(supabaseClient, {
        updates: changedKeys.map((key) => ({
          key,
          value: values[key].trim(),
        })),
        adminUserId: userData.id,
      });

      notifications.show({
        message: "Contact details updated successfully.",
        color: "green",
      });
      await loadContactSettings();
      router.refresh();
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
            error_function: "handleSubmit",
            error_user_email: userData.email,
            error_user_id: userData.id,
          },
        });
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Stack flex={1} gap="xl" miw={0}>
      <Stack gap={4}>
        <Text size="sm" c="red.5" fw={800} tt="uppercase">
          Admin
        </Text>
        <Title order={1} style={{ fontSize: rem(34), fontWeight: 800 }}>
          Contacts
        </Title>
        <Text c="dimmed">Update public contact details and social media links.</Text>
      </Stack>

      <Paper withBorder p="md" radius="md">
        <form onSubmit={handleSubmit}>
          <Stack gap="lg">
            <Group justify="space-between" align="flex-start">
              <Stack gap={2}>
                <Group gap="xs">
                  <ThemeIcon color="red" variant="light" radius="sm">
                    <IconPhone size={16} />
                  </ThemeIcon>
                  <Title order={2} size="h3">
                    Contact Settings
                  </Title>
                </Group>
                <Text size="sm" c="dimmed">
                  {lastUpdatedAt
                    ? `Last updated ${formatDate(new Date(lastUpdatedAt))}`
                    : "No updates yet"}
                </Text>
              </Stack>

              <Button
                type="submit"
                leftSection={<IconDeviceFloppy size={16} />}
                loading={isSaving}
                disabled={isFetching || !hasChanges || hasErrors}
              >
                Save Changes
              </Button>
            </Group>

            <Alert color="yellow" variant="light" icon={<IconAlertCircle size={18} />}>
              Empty values are allowed for optional fields, but customers may see missing links
              wherever these settings are displayed.
            </Alert>

            <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
              {CONTACT_SETTING_CONFIG.map(
                ({ key, label, placeholder, icon: Icon, inputType, required }) => {
                  if (key === "PHONE_NUMBER") {
                    return (
                      <TextInput
                        key={key}
                        label={label}
                        placeholder={placeholder}
                        maxLength={10}
                        required={required}
                        value={values[key]}
                        disabled={isFetching || isSaving}
                        onChange={(event) => {
                          const numberOnly = event.currentTarget.value
                            .replace(/\D/g, "")
                            .slice(0, 10);
                          setValues((currentValues) => ({
                            ...currentValues,
                            [key]: numberOnly,
                          }));
                        }}
                        error={errors[key]}
                        leftSection={<Text size="sm">+63</Text>}
                      />
                    );
                  }

                  return (
                    <TextInput
                      key={key}
                      type={inputType}
                      label={label}
                      placeholder={placeholder}
                      leftSection={<Icon size={16} />}
                      value={values[key]}
                      required={required}
                      disabled={isFetching || isSaving}
                      maxLength={TEXT_LIMITS.long}
                      onChange={(event) => {
                        const value = event.currentTarget.value;
                        setValues((currentValues) => ({
                          ...currentValues,
                          [key]: value,
                        }));
                      }}
                      error={errors[key]}
                    />
                  );
                },
              )}
            </SimpleGrid>
          </Stack>
        </form>
      </Paper>
    </Stack>
  );
};

export default ContactsPage;
