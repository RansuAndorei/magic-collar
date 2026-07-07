"use client";

import { insertError } from "@/app/actions";
import {
  getBarangayList,
  getCityList,
  getProvinceList,
  getRegionList,
} from "@/app/user/onboarding/actions";
import { useUserData } from "@/stores/useUserStore";
import { TEXT_LIMITS } from "@/utils/constants";
import { isAppError } from "@/utils/functions";
import { supabaseClient } from "@/utils/supabase/client";
import { OptionType, PickupAddressFormType } from "@/utils/types";
import {
  Button,
  Group,
  Modal,
  NumberInput,
  Select,
  SimpleGrid,
  Stack,
  Switch,
  Text,
  TextInput,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { usePathname } from "next/navigation";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { createPickupAddress, getAddressIdBasedOnLabel, updatePickupAddress } from "../actions";

type Props = {
  opened: boolean;
  setOpened: Dispatch<SetStateAction<boolean>>;
  defaultValues: PickupAddressFormType;
  refreshTable: () => void;
};

const PickupAddressModal = ({ opened, setOpened, defaultValues, refreshTable }: Props) => {
  return (
    <Modal
      opened={opened}
      onClose={() => setOpened(false)}
      title={
        <Text fw={800}>
          {defaultValues.pickupAddressId ? "Edit Pickup Address" : "Add Pickup Address"}
        </Text>
      }
      size="lg"
      centered
      closeOnEscape
      closeOnClickOutside
    >
      <PickupAddressModalForm
        key={defaultValues.pickupAddressId ?? "new"}
        setOpened={setOpened}
        defaultValues={defaultValues}
        refreshTable={refreshTable}
      />
    </Modal>
  );
};

type FormProps = Omit<Props, "opened">;

const PickupAddressModalForm = ({ setOpened, defaultValues, refreshTable }: FormProps) => {
  const userData = useUserData();
  const pathname = usePathname();
  const [isSaving, setIsSaving] = useState(false);
  const [regionList, setRegionList] = useState<OptionType[]>([]);
  const [loadingFieldList, setLoadingFieldList] = useState<string[]>([]);

  const {
    control,
    register,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors, isDirty },
  } = useForm<PickupAddressFormType>({ defaultValues });

  const provinceList = useWatch({ control, name: "provinceOptions" }) ?? [];
  const cityList = useWatch({ control, name: "cityOptions" }) ?? [];
  const barangayList = useWatch({ control, name: "barangayOptions" }) ?? [];

  useEffect(() => {
    if (regionList.length) return;

    const loadRegionList = async () => {
      if (!userData) return;
      try {
        const regionData = await getRegionList(supabaseClient);
        setRegionList(regionData);
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
              error_function: "loadRegionList",
              error_user_email: userData.email,
              error_user_id: userData.id,
            },
          });
        }
      }
    };
    loadRegionList();
  }, []);

  useEffect(() => {
    if (!defaultValues.pickupAddressId) return;

    const hydrateExistingChain = async () => {
      if (!userData) return;
      const currentRegion = getValues("region");
      const currentProvince = getValues("province");
      const currentCity = getValues("city");
      const currentBarangay = getValues("barangay");

      if (!currentRegion || !currentProvince || !currentCity || !currentBarangay) return;
      try {
        const { regionId, provinceId, cityId, barangayId } = await getAddressIdBasedOnLabel(
          supabaseClient,
          {
            region: currentRegion,
            province: currentProvince,
            city: currentCity,
            barangay: currentBarangay,
          },
        );

        const promises = [];
        if (regionId) {
          setValue("region", regionId);
          promises.push(
            getProvinceList(supabaseClient, {
              regionId,
            }),
          );
        }
        if (provinceId) {
          setValue("province", provinceId);
          promises.push(
            getCityList(supabaseClient, {
              provinceId,
            }),
          );
        }
        if (cityId) {
          setValue("city", cityId);
          promises.push(
            getBarangayList(supabaseClient, {
              cityId,
            }),
          );
        }
        if (barangayId) {
          setValue("barangay", barangayId);
        }
        const [provinceData, cityData, barangayData] = await Promise.all(promises);
        setValue("provinceOptions", provinceData);
        setValue("cityOptions", cityData);
        setValue("barangayOptions", barangayData as (OptionType & { postalCode: string })[]);
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
              error_function: "hydrateExistingChain",
              error_user_email: userData.email,
              error_user_id: userData.id,
            },
          });
        }
      }
    };
    hydrateExistingChain();
  }, [defaultValues.pickupAddressId]);

  const resetOptions = (level: number, value: string | null) => {
    const loadingList: string[] = [];
    if (level < 2) {
      loadingList.push("province");
      setValue("provinceOptions", []);
      setValue("province", null);
    }
    if (level < 3) {
      if (!loadingList.length) {
        loadingList.push("city");
      }
      setValue("cityOptions", []);
      setValue("city", null);
    }
    if (level < 4) {
      if (!loadingList.length) {
        loadingList.push("barangay");
      }
      setValue("barangayOptions", []);
      setValue("barangay", null);
    }
    setValue("postalCode", "");
    if (value) setLoadingFieldList(loadingList);
  };

  const handleRegionChange = async (value: string) => {
    if (!userData) return;
    try {
      const provinceData = await getProvinceList(supabaseClient, { regionId: value });
      setValue("provinceOptions", provinceData);
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
      setLoadingFieldList([]);
    }
  };

  const handleProvinceChange = async (value: string) => {
    if (!userData) return;
    try {
      const cityData = await getCityList(supabaseClient, { provinceId: value });
      setValue("cityOptions", cityData);
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
      setLoadingFieldList([]);
    }
  };

  const handleCityChange = async (value: string) => {
    if (!userData) return;
    try {
      const barangayData = await getBarangayList(supabaseClient, { cityId: value });
      setValue("barangayOptions", barangayData);
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
      setLoadingFieldList([]);
    }
  };

  const handleBarangayChange = async (value: string) => {
    if (!userData) return;
    try {
      const barangays = getValues("barangayOptions") ?? [];
      const postalCode = barangays.find((barangay) => barangay.value === value)?.postalCode;
      if (!postalCode) throw new Error(`Missing postal code ${value}`);

      setValue("postalCode", postalCode);
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

  const onSubmit = async (values: PickupAddressFormType) => {
    if (!userData) return;
    if (values.latitude === null || values.longitude === null) {
      notifications.show({ message: "Latitude and longitude are required.", color: "orange" });
      return;
    }

    setIsSaving(true);
    try {
      const regionLabel = regionList.find((r) => r.value === values.region)?.label ?? "";
      const provinceLabel =
        (values.provinceOptions ?? []).find((p) => p.value === values.province)?.label ?? "";
      const cityLabel =
        (values.cityOptions ?? []).find((c) => c.value === values.city)?.label ?? "";
      const barangayLabel =
        (values.barangayOptions ?? []).find((b) => b.value === values.barangay)?.label ?? "";

      const addressPayload = {
        address_street: values.street.trim(),
        address_barangay: barangayLabel,
        address_city: cityLabel,
        address_province: provinceLabel,
        address_region: regionLabel,
        address_postal_code: values.postalCode.trim(),
      };

      const pickupAddressPayload = {
        pickup_address_latitude: values.latitude,
        pickup_address_longitude: values.longitude,
        pickup_address_is_available: values.isAvailable,
        pickup_address_updated_by_admin_user_id: userData.id,
        pickup_address_date_updated: new Date().toISOString(),
      };

      if (values.pickupAddressId && values.addressId) {
        await updatePickupAddress(supabaseClient, {
          pickupAddressId: values.pickupAddressId,
          addressId: values.addressId,
          addressUpdate: addressPayload,
          pickupAddressUpdate: pickupAddressPayload,
        });
      } else {
        await createPickupAddress(supabaseClient, {
          addressInsert: addressPayload,
          pickupAddressInsert: {
            ...pickupAddressPayload,
            pickup_address_created_by_admin_user_id: userData.id,
          },
        });
      }

      notifications.show({
        message: `Pickup address ${values.pickupAddressId ? "updated" : "created"} successfully.`,
        color: "green",
      });
      refreshTable();
      setOpened(false);
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
            error_function: "savePickupAddress",
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
    <form onSubmit={handleSubmit(onSubmit)}>
      <Stack gap="md">
        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
          <Controller
            name="region"
            control={control}
            rules={{ required: "Region is required" }}
            render={({ field }) => (
              <Select
                label="Region"
                data={regionList}
                required
                searchable
                error={errors.region?.message}
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
            name="province"
            control={control}
            rules={{ required: "Province is required" }}
            render={({ field }) => (
              <Select
                label="Province"
                data={provinceList}
                required
                searchable
                error={errors.province?.message}
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

        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
          <Controller
            name="city"
            control={control}
            rules={{ required: "City / Municipality is required" }}
            render={({ field }) => (
              <Select
                label="City / Municipality"
                data={cityList}
                required
                searchable
                error={errors.city?.message}
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
            name="barangay"
            control={control}
            rules={{ required: "Barangay is required" }}
            render={({ field }) => (
              <Select
                label="Barangay"
                data={barangayList}
                required
                searchable
                error={errors.barangay?.message}
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

        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
          <Controller
            name="postalCode"
            control={control}
            rules={{ required: "Postal code is required" }}
            render={({ field }) => (
              <TextInput
                label="Postal Code"
                readOnly
                variant="filled"
                styles={{ input: { cursor: "not-allowed", opacity: 0.6 } }}
                error={errors.postalCode?.message}
                {...field}
                value={field.value ?? ""}
                required
              />
            )}
          />
          <Controller
            name="isAvailable"
            control={control}
            render={({ field: { value, onChange, ...field } }) => (
              <Switch
                mt="xl"
                label="Available for pickup"
                checked={value}
                onChange={(event) => onChange(event.currentTarget.checked)}
                {...field}
              />
            )}
          />
        </SimpleGrid>

        <TextInput
          label="Street"
          placeholder="House no., street name"
          required
          maxLength={TEXT_LIMITS.long}
          error={errors.street?.message}
          {...register("street", { required: "Street is required" })}
        />

        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
          <Controller
            name="latitude"
            control={control}
            rules={{
              required: "Latitude is required",
              min: {
                value: -90,
                message: "Latitude must be between -90 and 90",
              },
              max: {
                value: 90,
                message: "Latitude must be between -90 and 90",
              },
            }}
            render={({ field }) => (
              <NumberInput
                label="Latitude"
                required
                hideControls
                decimalScale={6}
                min={-90}
                max={90}
                error={errors.latitude?.message}
                value={field.value ?? ""}
                onChange={field.onChange}
                onBlur={() => {
                  field.onBlur();
                  if (typeof field.value === "number") {
                    field.onChange(Number(field.value.toFixed(6)));
                  }
                }}
              />
            )}
          />
          <Controller
            name="longitude"
            control={control}
            rules={{
              required: "Longitude is required",
              min: {
                value: -180,
                message: "Longitude must be between -180 and 180",
              },
              max: {
                value: 180,
                message: "Longitude must be between -180 and 180",
              },
            }}
            render={({ field }) => (
              <NumberInput
                label="Longitude"
                required
                hideControls
                decimalScale={6}
                min={-180}
                max={180}
                error={errors.longitude?.message}
                value={field.value ?? ""}
                onChange={field.onChange}
                onBlur={() => {
                  field.onBlur();
                  if (typeof field.value === "number") {
                    field.onChange(Number(field.value.toFixed(6)));
                  }
                }}
              />
            )}
          />
        </SimpleGrid>

        <Group justify="flex-end">
          <Button
            variant="subtle"
            color="gray"
            onClick={() => setOpened(false)}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button type="submit" loading={isSaving} disabled={!isDirty}>
            {defaultValues.pickupAddressId ? "Save changes" : "Create Address"}
          </Button>
        </Group>
      </Stack>
    </form>
  );
};

export default PickupAddressModal;
