import { Database } from "@/utils/database";
import {
  AddressTableInsert,
  AddressTableUpdate,
  AdminPickupAddressSortAccessor,
  PickupAddressTableInsert,
  PickupAddressTableUpdate,
  PickupAddressType,
} from "@/utils/types";
import { SupabaseClient } from "@supabase/supabase-js";

export const getAdminPickupAddressesPage = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    page: number;
    recordsPerPage: number;
    search: string;
    status: boolean | null;
    sortColumnAccessor: AdminPickupAddressSortAccessor;
    sortDirection: "asc" | "desc";
  },
) => {
  const { data, error } = await supabaseClient.rpc("get_admin_pickup_addresses_page", {
    input_data: params,
  });
  if (error) throw error;
  return data as {
    records: PickupAddressType[];
    totalRecords: number;
  };
};

export const checkPickupAddressCount = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    pickupAddressId: string;
  },
) => {
  const { pickupAddressId } = params;
  const { count, error } = await supabaseClient
    .from("pickup_address_table")
    .select("*", { count: "exact", head: true })
    .neq("pickup_address_id", pickupAddressId)
    .eq("pickup_address_is_available", true)
    .eq("pickup_address_is_disabled", false);
  if (error) throw error;
  return Boolean(count);
};

export const createPickupAddress = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    addressInsert: AddressTableInsert;
    pickupAddressInsert: Omit<PickupAddressTableInsert, "pickup_address_address_id">;
  },
) => {
  const { error } = await supabaseClient.rpc("create_pickup_address", {
    input_data: params,
  });
  if (error) throw error;
};

export const updatePickupAddress = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    pickupAddressId: string;
    addressId: string;
    addressUpdate: AddressTableUpdate;
    pickupAddressUpdate: PickupAddressTableUpdate;
  },
) => {
  const { error } = await supabaseClient.rpc("update_pickup_address", {
    input_data: params,
  });
  if (error) throw error;
};

export const getAddressIdBasedOnLabel = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    region: string;
    province: string;
    city: string;
    barangay: string;
  },
) => {
  const { data, error } = await supabaseClient.rpc("get_address_id_based_on_label", {
    input_data: params,
  });
  if (error) throw error;
  return data as {
    regionId: string;
    provinceId: string;
    cityId: string;
    barangayId: string;
  };
};

export const setPickupAddressAvailability = async (
  supabaseClient: SupabaseClient<Database>,
  params: { pickupAddressId: string; isAvailable: boolean; adminUserId: string },
) => {
  const { error } = await supabaseClient.rpc("set_pickup_address_availability", {
    input_data: params,
  });
  if (error) throw error;
};

export const deletePickupAddress = async (
  supabaseClient: SupabaseClient<Database>,
  params: { pickupAddressId: string; adminUserId: string },
) => {
  const { error } = await supabaseClient.rpc("delete_pickup_address", {
    input_data: params,
  });
  if (error) throw error;
};
