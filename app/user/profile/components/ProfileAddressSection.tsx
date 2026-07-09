"use client";

import { insertError } from "@/app/actions";
import { getBarangayList, getCityList, getProvinceList } from "@/app/user/onboarding/actions";
import { useUserData } from "@/stores/useUserStore";
import { isAppError } from "@/utils/functions";
import { supabaseClient } from "@/utils/supabase/client";
import {
  CheckoutAddressType,
  OptionType,
  ProfileAddressFormType,
  ProfileAddressFormValuesType,
} from "@/utils/types";
import { Button, Card, Group, LoadingOverlay, Stack, Text } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconDeviceFloppy, IconMapPin, IconPlus } from "@tabler/icons-react";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { FormProvider, useFieldArray, useForm } from "react-hook-form";
import {
  createDeliveryAddress,
  deleteDeliveryAddress,
  getAddressIdBasedOnLabel,
  getUserDeliveryAddressList,
  updateDeliveryAddress,
} from "../actions";
import ProfileAddressCard from "./ProfileAddressCard";

const DEFAULT_ADDRESS: ProfileAddressFormType = {
  fullName: "",
  phone: "",
  region: null,
  regionOptions: [],
  province: null,
  provinceOptions: [],
  city: null,
  cityOptions: [],
  barangay: null,
  barangayOptions: [],
  street: "",
  postalCode: "",
  isDefault: false,
};

const MAX_ADDRESS_COUNT = 5;

type DeletedAddress = { deliveryDetailId: string; wasDefault: boolean };
type Props = { regionList: OptionType[] };

const ProfileAddressSection = ({ regionList }: Props) => {
  const userData = useUserData();
  const pathname = usePathname();

  const [isFetching, setIsFetching] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [deletedAddressList, setDeletedAddressList] = useState<DeletedAddress[]>([]);

  const formMethods = useForm<ProfileAddressFormValuesType>({
    defaultValues: { addresses: [{ ...DEFAULT_ADDRESS, isDefault: true }] },
  });

  const {
    control,
    getValues,
    handleSubmit,
    reset,
    setValue,
    formState: { isDirty },
  } = formMethods;

  const { fields, append, remove } = useFieldArray({ control, name: "addresses" });

  const hydrateAddress = useCallback(
    async (address: CheckoutAddressType): Promise<ProfileAddressFormType> => {
      const addressRow = address.delivery_detail_address;
      const ids = await getAddressIdBasedOnLabel(supabaseClient, {
        region: addressRow.address_region,
        province: addressRow.address_province,
        city: addressRow.address_city,
        barangay: addressRow.address_barangay,
      });

      const [provinceOptions, cityOptions, barangayOptions] = await Promise.all([
        ids.regionId ? getProvinceList(supabaseClient, { regionId: ids.regionId }) : [],
        ids.provinceId ? getCityList(supabaseClient, { provinceId: ids.provinceId }) : [],
        ids.cityId ? getBarangayList(supabaseClient, { cityId: ids.cityId }) : [],
      ]);

      return {
        deliveryDetailId: address.delivery_detail_id,
        addressId: addressRow.address_id,
        fullName: address.delivery_detail_full_name,
        phone: address.delivery_detail_phone_number,
        region: ids.regionId,
        regionOptions: regionList,
        province: ids.provinceId,
        provinceOptions,
        city: ids.cityId,
        cityOptions,
        barangay: ids.barangayId,
        barangayOptions,
        street: addressRow.address_street,
        postalCode: addressRow.address_postal_code,
        isDefault: address.delivery_detail_is_default,
      };
    },
    [regionList],
  );

  const fetchAddressList = useCallback(async () => {
    if (!userData) return;
    setIsFetching(true);
    try {
      const addressList = await getUserDeliveryAddressList(supabaseClient, { userId: userData.id });
      const hydratedList = await Promise.all(addressList.map(hydrateAddress));
      reset({
        addresses: hydratedList.length ? hydratedList : [{ ...DEFAULT_ADDRESS, isDefault: true }],
      });
      setDeletedAddressList([]);
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
            error_function: "fetchAddressList",
            error_user_email: userData.email,
            error_user_id: userData.id,
          },
        });
      }
    } finally {
      setIsFetching(false);
    }
  }, [hydrateAddress, reset, userData]);

  useEffect(() => {
    // eslint-disable-next-line
    fetchAddressList();
  }, [fetchAddressList]);

  const handleSetDefault = useCallback(
    (index: number) => {
      const current = getValues("addresses");
      setValue(
        "addresses",
        current.map((address, i) => ({ ...address, isDefault: i === index })),
        { shouldDirty: true, shouldTouch: true },
      );
    },
    [getValues, setValue],
  );

  const handleAddAddress = useCallback(() => {
    if (fields.length >= MAX_ADDRESS_COUNT) {
      notifications.show({
        message: `You can save up to ${MAX_ADDRESS_COUNT} delivery addresses.`,
        color: "orange",
      });
      return;
    }
    append({ ...DEFAULT_ADDRESS, isDefault: fields.length === 0 });
  }, [append, fields.length]);

  const handleRemoveAddress = useCallback(
    (index: number) => {
      const currentAddress = getValues(`addresses.${index}`);
      if (currentAddress.deliveryDetailId) {
        setDeletedAddressList((prev) => [
          ...prev,
          {
            deliveryDetailId: currentAddress.deliveryDetailId as string,
            wasDefault: currentAddress.isDefault,
          },
        ]);
      }
      remove(index);

      // If we removed the default and others remain, promote the first remaining one synchronously.
      if (currentAddress.isDefault) {
        const remaining = getValues("addresses").filter((_, i) => i !== index);
        if (remaining.length) {
          setValue("addresses.0.isDefault", true, { shouldDirty: true });
        }
      }
    },
    [getValues, remove, setValue],
  );

  const toPersistableAddress = useCallback(
    (address: ProfileAddressFormType) => {
      const region = regionList.find(({ value }) => value === address.region)?.label;
      const province = address.provinceOptions.find(
        ({ value }) => value === address.province,
      )?.label;
      const city = address.cityOptions.find(({ value }) => value === address.city)?.label;
      const barangay = address.barangayOptions.find(
        ({ value }) => value === address.barangay,
      )?.label;

      const missing = [
        !region && "Region",
        !province && "Province",
        !city && "City",
        !barangay && "Barangay",
      ].filter(Boolean);
      if (missing.length) throw new Error(`Missing ${missing.join(", ")}`);

      return {
        addressUpdate: {
          address_street: address.street.trim(),
          address_barangay: barangay!,
          address_city: city!,
          address_province: province!,
          address_region: region!,
          address_postal_code: address.postalCode.trim(),
        },
        deliveryDetailUpdate: {
          delivery_detail_full_name: address.fullName.trim(),
          delivery_detail_phone_number: address.phone,
          delivery_detail_is_default: address.isDefault,
        },
      };
    },
    [regionList],
  );

  const onSubmit = useCallback(
    async (data: ProfileAddressFormValuesType) => {
      if (!userData) return;
      if (data.addresses.length > MAX_ADDRESS_COUNT) {
        notifications.show({
          message: `You can save up to ${MAX_ADDRESS_COUNT} delivery addresses.`,
          color: "orange",
        });
        return;
      }

      try {
        setIsSaving(true);

        await Promise.all(
          deletedAddressList.map((deletedAddress) =>
            deleteDeliveryAddress(supabaseClient, {
              userId: userData.id,
              deliveryDetailId: deletedAddress.deliveryDetailId,
              wasDefault: deletedAddress.wasDefault,
            }),
          ),
        );

        await Promise.all(
          data.addresses.map((address) => {
            const payload = toPersistableAddress(address);
            return address.deliveryDetailId && address.addressId
              ? updateDeliveryAddress(supabaseClient, {
                  userId: userData.id,
                  deliveryDetailId: address.deliveryDetailId,
                  addressId: address.addressId,
                  addressUpdate: payload.addressUpdate,
                  deliveryDetailUpdate: payload.deliveryDetailUpdate,
                })
              : createDeliveryAddress(supabaseClient, {
                  userId: userData.id,
                  addressInsert: payload.addressUpdate,
                  deliveryDetailInsert: {
                    ...payload.deliveryDetailUpdate,
                    delivery_detail_user_id: userData.id,
                  },
                });
          }),
        );

        notifications.show({ message: "Delivery addresses updated successfully.", color: "green" });
        await fetchAddressList();
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
              error_function: "onSubmit",
              error_user_email: userData.email,
              error_user_id: userData.id,
            },
          });
        }
      } finally {
        setIsSaving(false);
      }
    },
    [deletedAddressList, fetchAddressList, toPersistableAddress, userData],
  );

  return (
    <Card withBorder radius="md" p={{ base: "lg", xs: "xl" }} pos="relative">
      <LoadingOverlay visible={isFetching} overlayProps={{ radius: "md", blur: 2 }} />
      <FormProvider {...formMethods}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <Stack gap="md">
            <Group justify="space-between" align="flex-start">
              <Group gap="sm">
                <IconMapPin size={22} color="var(--mantine-color-red-5)" />
                <Stack gap={2}>
                  <Text fw={700} size="lg">
                    Delivery Addresses
                  </Text>
                  <Text size="sm" c="dimmed">
                    Manage up to {MAX_ADDRESS_COUNT} saved addresses used during checkout.
                  </Text>
                </Stack>
              </Group>
            </Group>

            {fields.map((field, index) => (
              <ProfileAddressCard
                key={field.id}
                index={index}
                isOnly={fields.length === 1}
                onRemove={handleRemoveAddress}
                onSetDefault={handleSetDefault}
                regionList={regionList}
              />
            ))}

            <Group justify="space-between" align="center">
              <Button
                variant="light"
                color="red"
                size="xs"
                leftSection={<IconPlus size={14} />}
                onClick={handleAddAddress}
                disabled={fields.length >= MAX_ADDRESS_COUNT}
              >
                Add Address
              </Button>
              <Text size="xs" c="dimmed">
                {fields.length}/{MAX_ADDRESS_COUNT} saved
              </Text>
              <Button
                type="submit"
                color="red"
                leftSection={<IconDeviceFloppy size={16} />}
                loading={isSaving}
                disabled={isFetching || (!isDirty && deletedAddressList.length === 0)}
              >
                Save Addresses
              </Button>
            </Group>
          </Stack>
        </form>
      </FormProvider>
    </Card>
  );
};

export default ProfileAddressSection;
