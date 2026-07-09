"use client";

import { insertError } from "@/app/actions";
import { useUserData } from "@/stores/useUserStore";
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
import { IconAlertCircle, IconClock, IconDeviceFloppy, IconStack2 } from "@tabler/icons-react";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { updateSettings } from "../../contacts/actions";
import { PROCESS_SETTING_KEYS, ProcessSettingKey, getProcessSettings } from "../actions";

type ProcessSettingConfig = {
  key: ProcessSettingKey;
  label: string;
  placeholder: string;
  icon: typeof IconClock;
  description: string;
  min: number;
  max?: number;
};

const PROCESS_SETTING_CONFIG: ProcessSettingConfig[] = [
  {
    key: "BATCH_LIMIT",
    label: "Batch Limit",
    placeholder: "50",
    icon: IconStack2,
    description: "Maximum number of orders processed per batch.",
    min: 1,
  },
  {
    key: "ORDER_EXPIRATION_IN_DAYS",
    label: "Order Expiration (Days)",
    placeholder: "30",
    icon: IconClock,
    description: "Number of days before an unpaid order expires.",
    min: 1,
  },
];

const CONFIG_BY_KEY = PROCESS_SETTING_CONFIG.reduce(
  (accumulator, config) => ({ ...accumulator, [config.key]: config }),
  {} as Record<ProcessSettingKey, ProcessSettingConfig>,
);

const emptyValues = PROCESS_SETTING_KEYS.reduce(
  (accumulator, key) => ({ ...accumulator, [key]: "" }),
  {} as Record<ProcessSettingKey, string>,
);

const validateField = (key: ProcessSettingKey, value: string): string | null => {
  const config = CONFIG_BY_KEY[key];
  const trimmed = value.trim();

  if (!trimmed) {
    return `${config.label} is required.`;
  }

  if (!/^\d+$/.test(trimmed)) {
    return "Enter a whole number.";
  }

  const numeric = Number(trimmed);

  if (numeric < config.min) {
    return `Must be at least ${config.min}.`;
  }

  if (config.max !== undefined && numeric > config.max) {
    return `Must be at most ${config.max}.`;
  }

  return null;
};

const ProcessPage = () => {
  const userData = useUserData();
  const pathname = usePathname();
  const router = useRouter();

  const [values, setValues] = useState<Record<ProcessSettingKey, string>>(emptyValues);
  const [initialValues, setInitialValues] =
    useState<Record<ProcessSettingKey, string>>(emptyValues);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string | null>(null);
  const [isFetching, setIsFetching] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const changedKeys = useMemo(
    () => PROCESS_SETTING_KEYS.filter((key) => values[key].trim() !== initialValues[key].trim()),
    [initialValues, values],
  );

  const hasChanges = changedKeys.length > 0;

  const errors = useMemo(() => {
    const result = {} as Record<ProcessSettingKey, string | null>;
    PROCESS_SETTING_KEYS.forEach((key) => {
      result[key] = validateField(key, values[key]);
    });
    return result;
  }, [values]);

  const hasErrors = useMemo(
    () => PROCESS_SETTING_KEYS.some((key) => Boolean(errors[key])),
    [errors],
  );

  const loadProcessSettings = useCallback(async () => {
    if (!userData) return;
    setIsFetching(true);

    try {
      const settings = await getProcessSettings(supabaseClient);
      const nextValues = { ...emptyValues };

      settings.forEach((setting) => {
        const key = setting.system_setting_key as SettingsEnum;
        if (PROCESS_SETTING_KEYS.includes(key as ProcessSettingKey)) {
          nextValues[key as ProcessSettingKey] = setting.system_setting_value;
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
            error_function: "loadProcessSettings",
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
    // eslint-disable-next-line
    loadProcessSettings();
  }, [loadProcessSettings]);

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
        message: "Process settings updated successfully.",
        color: "green",
      });
      await loadProcessSettings();
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
          Process Settings
        </Title>
        <Text c="dimmed">Configure order batching and expiration behavior.</Text>
      </Stack>

      <Paper withBorder p="md" radius="md">
        <form onSubmit={handleSubmit}>
          <Stack gap="lg">
            <Group justify="space-between" align="flex-start">
              <Stack gap={2}>
                <Group gap="xs">
                  <ThemeIcon color="red" variant="light" radius="sm">
                    <IconStack2 size={16} />
                  </ThemeIcon>
                  <Title order={2} size="h3">
                    Process Settings
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
              These values affect live order processing. Double-check before saving.
            </Alert>

            <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
              {PROCESS_SETTING_CONFIG.map(
                ({ key, label, placeholder, icon: Icon, description }) => (
                  <TextInput
                    key={key}
                    label={label}
                    placeholder={placeholder}
                    description={description}
                    leftSection={<Icon size={16} />}
                    value={values[key]}
                    required
                    disabled={isFetching || isSaving}
                    onChange={(event) => {
                      const numberOnly = event.currentTarget.value.replace(/\D/g, "");
                      setValues((currentValues) => ({
                        ...currentValues,
                        [key]: numberOnly,
                      }));
                    }}
                    error={errors[key]}
                    maxLength={5}
                  />
                ),
              )}
            </SimpleGrid>
          </Stack>
        </form>
      </Paper>
    </Stack>
  );
};

export default ProcessPage;
