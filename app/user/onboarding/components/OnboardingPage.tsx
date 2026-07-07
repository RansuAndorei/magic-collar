"use client";

import { insertError, uploadFile } from "@/app/actions";
import { useUserActions, useUserData } from "@/stores/useUserStore";
import { LOGO_PATH, MAX_ADDRESSES, MAX_FILE_SIZE } from "@/utils/constants";
import { isAppError } from "@/utils/functions";
import { supabaseClient } from "@/utils/supabase/client";
import { OnboardingAddressType, OnboardingFormValuesType, OptionType } from "@/utils/types";
import {
  Box,
  Button,
  Card,
  Container,
  Group,
  rem,
  Stack,
  Stepper,
  Text,
  Title,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { FormProvider, useFieldArray, useForm } from "react-hook-form";
import { onboardUser } from "../actions";
import StepAddress from "./StepAddress";
import StepDone from "./StepDone";
import StepProfile from "./StepProfile";

const DEFAULT_ADDRESS: OnboardingAddressType = {
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

const STEPS = [
  { label: "Profile", description: "Your basic info" },
  { label: "Address", description: "Delivery address" },
  { label: "Done", description: "All set!" },
];

type Props = {
  regionList: OptionType[];
};

const OnboardingPage = ({ regionList }: Props) => {
  const userData = useUserData();
  const router = useRouter();
  const resetRef = useRef<() => void>(null);
  const pathname = usePathname();
  const { setUserProfile } = useUserActions();

  const [active, setActive] = useState(0);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const onboardingFormMethods = useForm<OnboardingFormValuesType>({
    defaultValues: {
      firstName: "",
      lastName: "",
      phone: "",
      addresses: [{ ...DEFAULT_ADDRESS, isDefault: true }],
    },
  });
  const { handleSubmit, control, setValue, trigger, getValues } = onboardingFormMethods;

  const { fields, append, remove } = useFieldArray({ control, name: "addresses" });

  const handleSetDefault = (index: number) => {
    const current = getValues("addresses");
    const updated = current.map((addr, i) => ({
      ...addr,
      isDefault: i === index,
    }));

    setValue("addresses", updated, {
      shouldDirty: true,
      shouldTouch: true,
    });
  };

  const handleAvatarChange = (file: File | null) => {
    if (!file) return;
    if (file.size > MAX_FILE_SIZE) {
      notifications.show({
        color: "red",
        title: "File too large",
        message: "Please upload an image smaller than 5 MB.",
      });
      return;
    }
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleRemoveAvatar = () => {
    setAvatarFile(null);
    setAvatarPreview(null);
    resetRef.current?.();
  };

  const handleAddAddress = () => {
    if (fields.length >= MAX_ADDRESSES) {
      notifications.show({
        message: "You can only add up to 5 addresses.",
        color: "yellow",
      });
      return;
    }

    append({
      ...DEFAULT_ADDRESS,
      isDefault: false,
    });
  };

  const handleRemoveAddress = (index: number) => {
    const wasDefault = getValues(`addresses.${index}.isDefault`);
    remove(index);
    if (wasDefault && fields.length > 1) {
      setTimeout(() => setValue("addresses.0.isDefault", true), 0);
    }
  };

  // Validate step 1 fields before advancing
  const handleNext = async () => {
    if (active === 0) {
      const valid = await trigger(["firstName", "lastName", "phone"]);
      if (!valid) return;
    }
    if (active === 1) {
      const valid = await trigger("addresses");
      if (!valid) return;
    }
    setActive((s) => s + 1);
  };

  const handleBack = () => setActive((s) => s - 1);

  const onSubmit = async (data: OnboardingFormValuesType) => {
    if (!userData || !userData.email) return;
    try {
      setIsLoading(true);
      let imageUrl = "";
      if (avatarFile) {
        const result = await uploadFile(supabaseClient, {
          file: avatarFile,
          bucket: "USER_AVATARS",
          fileName: userData.id,
        });
        imageUrl = result.publicUrl;
      }
      const addressData = data.addresses.map((address) => {
        const region = regionList.find(({ value }) => value === address.region)?.label;
        if (!region) throw new Error("Missing Region");
        const province = address.provinceOptions.find(
          ({ value }) => value === address.province,
        )?.label;
        if (!province) throw new Error("Missing Province");
        const city = address.cityOptions.find(({ value }) => value === address.city)?.label;
        if (!city) throw new Error("Missing City");
        const barangay = address.barangayOptions.find(
          ({ value }) => value === address.barangay,
        )?.label;
        if (!barangay) throw new Error("Missing Barangay");

        return {
          ...address,
          region,
          province,
          city,
          barangay,
          street: address.street.trim(),
          fullName: address.fullName.trim(),
        };
      });

      const newUserData = await onboardUser(supabaseClient, {
        userData: {
          user_email: userData.email,
          user_id: userData.id,
          user_avatar: imageUrl,
          user_first_name: data.firstName.trim(),
          user_last_name: data.lastName.trim(),
          user_phone_number: data.phone,
        },
        addressData,
      });

      setUserProfile(newUserData);
      setActive(2);
    } catch (e) {
      setIsLoading(false);
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
    }
  };

  return (
    <Box
      style={{ minHeight: "100vh", display: "flex", alignItems: "center" }}
      py={{ base: rem(40), md: rem(80) }}
      className="section-alt"
    >
      <Container size={560} w="100%">
        <Stack gap="xl">
          {/* Logo + heading */}
          <Stack align="center" gap="xs">
            <Image alt="Magic Collar logo" src={LOGO_PATH} width={100} height={44} priority />
            <Stack gap={4} style={{ textAlign: "center" }}>
              <Title order={2} style={{ fontSize: rem(24), fontWeight: 800 }}>
                Set up your profile
              </Title>
              <Text c="dimmed" size="sm">
                Step {active + 1} of {STEPS.length} — {STEPS[active].description}
              </Text>
            </Stack>
          </Stack>

          {/* Stepper */}
          <Stepper
            active={active}
            color="red"
            size="sm"
            styles={{
              stepLabel: { fontSize: rem(12) },
              stepDescription: { fontSize: rem(11) },
            }}
          >
            {STEPS.map((step) => (
              <Stepper.Step key={step.label} label={step.label} description={step.description} />
            ))}
          </Stepper>

          {/* Card */}
          <Card withBorder radius="md" p="xl">
            <FormProvider {...onboardingFormMethods}>
              <form onSubmit={handleSubmit(onSubmit)}>
                <Stack gap="lg">
                  {active === 0 && (
                    <StepProfile
                      userData={userData}
                      avatarPreview={avatarPreview}
                      resetRef={resetRef}
                      onAvatarChange={handleAvatarChange}
                      onRemoveAvatar={handleRemoveAvatar}
                    />
                  )}

                  {active === 1 && (
                    <StepAddress
                      fields={fields}
                      onAdd={handleAddAddress}
                      onRemove={handleRemoveAddress}
                      onSetDefault={handleSetDefault}
                      regionList={regionList}
                    />
                  )}

                  {active === 2 && <StepDone firstName={getValues("firstName")} />}

                  {/* Navigation */}
                  <Group justify={active > 0 ? "space-between" : "flex-end"} mt="xs">
                    {active > 0 && active < 2 && (
                      <Button variant="subtle" color="gray" onClick={handleBack}>
                        Back
                      </Button>
                    )}

                    {active === 0 && (
                      <Button color="red" onClick={handleNext}>
                        Next: Add Address
                      </Button>
                    )}

                    {active === 1 && (
                      <Button color="red" type="submit" loading={isLoading}>
                        Save &amp; Continue
                      </Button>
                    )}

                    {active === 2 && (
                      <Button color="red" fullWidth onClick={() => router.push("/shop")}>
                        Start Shopping
                      </Button>
                    )}
                  </Group>
                </Stack>
              </form>
            </FormProvider>
          </Card>

          {active < 2 && (
            <Text size="xs" c="dimmed" style={{ textAlign: "center" }}>
              You can update your profile anytime from your account settings.
            </Text>
          )}
        </Stack>
      </Container>
    </Box>
  );
};

export default OnboardingPage;
