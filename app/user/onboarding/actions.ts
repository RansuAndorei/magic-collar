import { Database } from "@/utils/database";
import { OnboardingAddressType, UserTableInsert, UserTableRow } from "@/utils/types";
import { SupabaseClient } from "@supabase/supabase-js";

export const onboardUser = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    userData: UserTableInsert;
    addressData: OnboardingAddressType[];
  },
) => {
  const { data, error } = await supabaseClient.rpc("onboard_user", { input_data: params });
  if (error) throw error;
  return data as UserTableRow;
};

export const getRegionList = async (supabaseClient: SupabaseClient<Database>) => {
  const { data, error } = await supabaseClient
    .from("region_table")
    .select("value: region_id, label: region")
    .eq("region_is_disabled", false)
    .eq("region_is_available", true);
  if (error) throw error;
  return data;
};

export const getProvinceList = async (
  supabaseClient: SupabaseClient<Database>,
  params: { regionId: string },
) => {
  const { regionId } = params;
  const { data, error } = await supabaseClient
    .from("province_table")
    .select("value: province_id, label: province")
    .eq("province_is_disabled", false)
    .eq("province_is_available", true)
    .eq("province_region_id", regionId);
  if (error) throw error;
  return data;
};

export const getCityList = async (
  supabaseClient: SupabaseClient<Database>,
  params: { provinceId: string },
) => {
  const { provinceId } = params;
  const { data, error } = await supabaseClient
    .from("city_table")
    .select("value: city_id, label: city")
    .eq("city_is_disabled", false)
    .eq("city_is_available", true)
    .eq("city_province_id", provinceId);
  if (error) throw error;
  return data;
};

export const getBarangayList = async (
  supabaseClient: SupabaseClient<Database>,
  params: { cityId: string },
) => {
  const { cityId } = params;
  const { data, error } = await supabaseClient
    .from("barangay_table")
    .select("value: barangay_id, label: barangay, postalCode: barangay_postal_code")
    .eq("barangay_is_disabled", false)
    .eq("barangay_is_available", true)
    .eq("barangay_city_id", cityId);
  if (error) throw error;
  return data;
};
