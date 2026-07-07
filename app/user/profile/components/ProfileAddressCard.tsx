"use client";

import { insertError } from "@/app/actions";
import { getBarangayList, getCityList, getProvinceList } from "@/app/user/onboarding/actions";
import { useUserData } from "@/stores/useUserStore";
import { TEXT_LIMITS } from "@/utils/constants";
import { isAppError } from "@/utils/functions";
import { supabaseClient } from "@/utils/supabase/client";
import { OptionType, ProfileAddressFormValuesType } from "@/utils/types";
import {
  ActionIcon,
  Badge,
  Card,
  Checkbox,
  Group,
  Select,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconMapPin, IconStar, IconTrash, IconUser } from "@tabler/icons-react";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Controller, useFormContext, useWatch } from "react-hook-form";

type Props = {
  index: number;
  onRemove: () => void;
  onSetDefault: () => void;
  isDefault: boolean;
  isOnly: boolean;
  regionList: OptionType[];
};

const ProfileAddressCard = ({
  index,
  onRemove,
  onSetDefault,
  isDefault,
  isOnly,
  regionList,
}: Props) => {
  const userData = useUserData();
  const pathname = usePathname();
  const [loadingFieldList, setLoadingFieldList] = useState<string[]>([]);

  const {
    formState: { errors },
    control,
    register,
    setValue,
    getValues,
  } = useFormContext<ProfileAddressFormValuesType>();

  const provinceList = useWatch({ control, name: `addresses.${index}.provinceOptions` }) ?? [];
  const cityList = useWatch({ control, name: `addresses.${index}.cityOptions` }) ?? [];
  const barangayList = useWatch({ control, name: `addresses.${index}.barangayOptions` }) ?? [];

  const resetOptions = (level: number, value: string | null) => {
    const loadingList: string[] = [];
    if (level < 2) {
      loadingList.push("province");
      setValue(`addresses.${index}.provinceOptions`, []);
      setValue(`addresses.${index}.province`, null);
    }
    if (level < 3) {
      if (!loadingList.length) loadingList.push("city");
      setValue(`addresses.${index}.cityOptions`, []);
      setValue(`addresses.${index}.city`, null);
    }
    if (level < 4) {
      if (!loadingList.length) loadingList.push("barangay");
      setValue(`addresses.${index}.barangayOptions`, []);
      setValue(`addresses.${index}.barangay`, null);
    }
    setValue(`addresses.${index}.postalCode`, "");
    if (value) setLoadingFieldList(loadingList);
  };

  const logAddressError = async (e: unknown, errorFunction: string) => {
    notifications.show({
      message: "Something went wrong. Please try again later.",
      color: "red",
    });
    if (userData && isAppError(e)) {
      await insertError(supabaseClient, {
        errorTableInsert: {
          error_message: e.message,
          error_url: pathname,
          error_function: errorFunction,
          error_user_email: userData.email,
          error_user_id: userData.id,
        },
      });
    }
  };

  const handleRegionChange = async (value: string) => {
    if (!userData) return;
    try {
      const provinceData = await getProvinceList(supabaseClient, { regionId: value });
      setValue(`addresses.${index}.provinceOptions`, provinceData, { shouldDirty: true });
    } catch (e) {
      await logAddressError(e, "handleProfileRegionChange");
    } finally {
      setLoadingFieldList([]);
    }
  };

  const handleProvinceChange = async (value: string) => {
    if (!userData) return;
    try {
      const cityData = await getCityList(supabaseClient, { provinceId: value });
      setValue(`addresses.${index}.cityOptions`, cityData, { shouldDirty: true });
    } catch (e) {
      await logAddressError(e, "handleProfileProvinceChange");
    } finally {
      setLoadingFieldList([]);
    }
  };

  const handleCityChange = async (value: string) => {
    if (!userData) return;
    try {
      const barangayData = await getBarangayList(supabaseClient, { cityId: value });
      setValue(`addresses.${index}.barangayOptions`, barangayData, { shouldDirty: true });
    } catch (e) {
      await logAddressError(e, "handleProfileCityChange");
    } finally {
      setLoadingFieldList([]);
    }
  };

  const handleBarangayChange = async (value: string) => {
    try {
      const barangays = getValues(`addresses.${index}.barangayOptions`);
      const postalCode = barangays.find((barangay) => barangay.value === value)?.postalCode;
      if (!postalCode) throw new Error(`Missing postal code ${value}`);

      setValue(`addresses.${index}.postalCode`, postalCode, { shouldDirty: true });
    } catch (e) {
      await logAddressError(e, "handleProfileBarangayChange");
    } finally {
      setLoadingFieldList([]);
    }
  };

  return (
    <Card withBorder radius="md" p="lg">
      <Stack gap="md">
        <Group justify="space-between" align="center">
          <Group gap="xs">
            <IconMapPin size={16} color="var(--mantine-color-red-5)" />
            <Text fw={600} size="sm">
              Address {index + 1}
            </Text>
            {isDefault && (
              <Badge color="red" variant="light" size="xs" leftSection={<IconStar size={10} />}>
                Default
              </Badge>
            )}
          </Group>
          {!isOnly && (
            <ActionIcon variant="subtle" color="red" size="sm" onClick={onRemove}>
              <IconTrash size={14} />
            </ActionIcon>
          )}
        </Group>

        <TextInput
          label="Full Name"
          placeholder="John Doe"
          required
          leftSection={<IconUser size={16} />}
          error={errors?.addresses?.[index]?.fullName?.message}
          {...register(`addresses.${index}.fullName`, { required: "Full name is required" })}
          maxLength={TEXT_LIMITS.medium}
        />

        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
          <Controller
            name={`addresses.${index}.region`}
            control={control}
            rules={{ required: "Region is required" }}
            render={({ field }) => (
              <Select
                label="Region"
                data={regionList}
                required
                searchable
                error={errors?.addresses?.[index]?.region?.message}
                {...field}
                value={field.value}
                onChange={(value) => {
                  field.onChange(value);
                  resetOptions(1, value);
                  if (value) handleRegionChange(value);
                }}
              />
            )}
          />
          <Controller
            name={`addresses.${index}.province`}
            control={control}
            rules={{ required: "Province is required" }}
            render={({ field }) => (
              <Select
                label="Province"
                data={provinceList}
                required
                searchable
                error={errors?.addresses?.[index]?.province?.message}
                {...field}
                value={field.value}
                onChange={(value) => {
                  field.onChange(value);
                  resetOptions(2, value);
                  if (value) handleProvinceChange(value);
                }}
                loading={loadingFieldList.includes("province")}
                variant={provinceList.length ? "default" : "filled"}
              />
            )}
          />
        </SimpleGrid>

        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
          <Controller
            name={`addresses.${index}.city`}
            control={control}
            rules={{ required: "City / Municipality is required" }}
            render={({ field }) => (
              <Select
                label="City / Municipality"
                data={cityList}
                required
                searchable
                error={errors?.addresses?.[index]?.city?.message}
                {...field}
                value={field.value}
                onChange={(value) => {
                  field.onChange(value);
                  resetOptions(3, value);
                  if (value) handleCityChange(value);
                }}
                loading={loadingFieldList.includes("city")}
                variant={cityList.length ? "default" : "filled"}
              />
            )}
          />
          <Controller
            name={`addresses.${index}.barangay`}
            control={control}
            rules={{ required: "Barangay is required" }}
            render={({ field }) => (
              <Select
                label="Barangay"
                data={barangayList}
                required
                searchable
                error={errors?.addresses?.[index]?.barangay?.message}
                {...field}
                value={field.value}
                onChange={(value) => {
                  field.onChange(value);
                  resetOptions(4, value);
                  if (value) handleBarangayChange(value);
                }}
                loading={loadingFieldList.includes("barangay")}
                variant={barangayList.length ? "default" : "filled"}
              />
            )}
          />
        </SimpleGrid>

        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
          <Controller
            name={`addresses.${index}.postalCode`}
            control={control}
            rules={{ required: "Postal code is required" }}
            render={({ field }) => (
              <TextInput
                label="Postal Code"
                readOnly
                variant="filled"
                styles={{ input: { cursor: "not-allowed", opacity: 0.6 } }}
                error={errors?.addresses?.[index]?.postalCode?.message}
                {...field}
                value={field.value}
                required
              />
            )}
          />

          <Controller
            control={control}
            name={`addresses.${index}.phone`}
            rules={{
              validate: {
                checkNumberOfCharacter: (value) => {
                  const stringifiedValue = value ? `${value}` : "";
                  if (stringifiedValue.length !== 10) return "Invalid Phone Number";
                  return true;
                },
                startsWith: (value) =>
                  `${value}`[0] === "9" ? true : "Phone number must start with 9",
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
                  const numberOnly = e.currentTarget.value.replace(/\D/g, "");
                  onChange(numberOnly);
                }}
                error={errors?.addresses?.[index]?.phone?.message}
                leftSection={<Text size="sm">+63</Text>}
              />
            )}
          />
        </SimpleGrid>

        <TextInput
          label="Street"
          placeholder="House no., street name"
          required
          leftSection={<IconMapPin size={16} />}
          error={errors?.addresses?.[index]?.street?.message}
          {...register(`addresses.${index}.street`, { required: "Street is required" })}
          maxLength={TEXT_LIMITS.long}
        />

        {!isDefault && (
          <Checkbox
            label="Set as default address"
            size="sm"
            checked={false}
            onChange={onSetDefault}
          />
        )}
      </Stack>
    </Card>
  );
};

export default ProfileAddressCard;
