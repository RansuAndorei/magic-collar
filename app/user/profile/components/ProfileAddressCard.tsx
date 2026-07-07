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
import { memo, useRef, useState } from "react";
import { Controller, useFormContext, useWatch } from "react-hook-form";

type Props = {
  index: number;
  onRemove: (index: number) => void;
  onSetDefault: (index: number) => void;
  isOnly: boolean;
  regionList: OptionType[];
};

const ProfileAddressCard = ({ index, onRemove, onSetDefault, isOnly, regionList }: Props) => {
  const userData = useUserData();
  const pathname = usePathname();

  const [loadingFieldList, setLoadingFieldList] = useState<string[]>([]);
  const requestIdRef = useRef(0);

  const {
    formState: { errors },
    control,
    register,
    setValue,
    getValues,
  } = useFormContext<ProfileAddressFormValuesType>();

  const isDefault = useWatch({ control, name: `addresses.${index}.isDefault` });
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

  // requestId guards against out-of-order responses when the user changes
  // a select rapidly before the previous fetch resolves.
  const handleRegionChange = async (value: string) => {
    if (!userData) return;
    const requestId = ++requestIdRef.current;
    try {
      const provinceData = await getProvinceList(supabaseClient, { regionId: value });
      if (requestId !== requestIdRef.current) return;
      setValue(`addresses.${index}.provinceOptions`, provinceData, { shouldDirty: true });
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
            error_function: "handleRegionChange",
            error_user_email: userData.email,
            error_user_id: userData.id,
          },
        });
      }
    } finally {
      if (requestId === requestIdRef.current) setLoadingFieldList([]);
    }
  };

  const handleProvinceChange = async (value: string) => {
    if (!userData) return;
    const requestId = ++requestIdRef.current;
    try {
      const cityData = await getCityList(supabaseClient, { provinceId: value });
      if (requestId !== requestIdRef.current) return;
      setValue(`addresses.${index}.cityOptions`, cityData, { shouldDirty: true });
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
            error_function: "handleProvinceChange",
            error_user_email: userData.email,
            error_user_id: userData.id,
          },
        });
      }
    } finally {
      if (requestId === requestIdRef.current) setLoadingFieldList([]);
    }
  };

  const handleCityChange = async (value: string) => {
    if (!userData) return;
    const requestId = ++requestIdRef.current;
    try {
      const barangayData = await getBarangayList(supabaseClient, { cityId: value });
      if (requestId !== requestIdRef.current) return;
      setValue(`addresses.${index}.barangayOptions`, barangayData, { shouldDirty: true });
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
            error_function: "handleCityChange",
            error_user_email: userData.email,
            error_user_id: userData.id,
          },
        });
      }
    } finally {
      if (requestId === requestIdRef.current) setLoadingFieldList([]);
    }
  };

  const handleBarangayChange = async (value: string) => {
    if (!userData) return;
    try {
      const barangays = getValues(`addresses.${index}.barangayOptions`);
      const postalCode = barangays.find((barangay) => barangay.value === value)?.postalCode;
      if (!postalCode) throw new Error(`Missing postal code ${value}`);
      setValue(`addresses.${index}.postalCode`, postalCode, { shouldDirty: true });
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
            error_function: "handleBarangayChange",
            error_user_email: userData.email,
            error_user_id: userData.id,
          },
        });
      }
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
            <ActionIcon variant="subtle" color="red" size="sm" onClick={() => onRemove(index)}>
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
                checkNumberOfCharacter: (value) =>
                  `${value ?? ""}`.length === 10 ? true : "Invalid Phone Number",
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
                onChange={(e) => onChange(e.currentTarget.value.replace(/\D/g, ""))}
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
            onChange={() => onSetDefault(index)}
          />
        )}
      </Stack>
    </Card>
  );
};

export default memo(ProfileAddressCard);
