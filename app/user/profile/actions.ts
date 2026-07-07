import { Database } from "@/utils/database";
import {
  AddressTableInsert,
  AddressTableUpdate,
  CheckoutAddressType,
  DeliveryDetailTableRow,
  UserTableUpdate,
} from "@/utils/types";
import { SupabaseClient } from "@supabase/supabase-js";

export const updateUser = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    userData: UserTableUpdate;
    userId: string;
  },
) => {
  const { userData, userId } = params;
  const { error } = await supabaseClient.from("user_table").update(userData).eq("user_id", userId);
  if (error) throw error;
};

export const resetPassword = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    password: string;
  },
) => {
  const { password } = params;
  const { error } = await supabaseClient.auth.updateUser({ password });
  return { error: error };
};

export const getUserDeliveryAddressList = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    userId: string;
  },
) => {
  const { data, error } = await supabaseClient
    .from("delivery_detail_table")
    .select(
      `
        *,
        delivery_detail_address: delivery_detail_address_id(*)
      `,
    )
    .eq("delivery_detail_user_id", params.userId)
    .eq("delivery_detail_is_disabled", false)
    .order("delivery_detail_is_default", { ascending: false })
    .order("delivery_detail_date_created", { ascending: false });
  if (error) throw error;
  return data as CheckoutAddressType[];
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
    regionId: string | null;
    provinceId: string | null;
    cityId: string | null;
    barangayId: string | null;
  };
};

export const createDeliveryAddress = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    userId: string;
    addressInsert: AddressTableInsert;
    deliveryDetailInsert: Omit<
      DeliveryDetailTableRow,
      | "delivery_detail_id"
      | "delivery_detail_date_created"
      | "delivery_detail_address_id"
      | "delivery_detail_is_disabled"
    >;
  },
) => {
  const { userId, addressInsert, deliveryDetailInsert } = params;

  const { data: addressData, error: addressError } = await supabaseClient
    .from("address_table")
    .insert(addressInsert)
    .select("address_id")
    .single();
  if (addressError) throw addressError;

  if (deliveryDetailInsert.delivery_detail_is_default) {
    const { error: defaultError } = await supabaseClient
      .from("delivery_detail_table")
      .update({ delivery_detail_is_default: false })
      .eq("delivery_detail_user_id", userId)
      .eq("delivery_detail_is_disabled", false);
    if (defaultError) throw defaultError;
  }

  const { error } = await supabaseClient.from("delivery_detail_table").insert({
    ...deliveryDetailInsert,
    delivery_detail_address_id: addressData.address_id,
  });
  if (error) throw error;
};

export const updateDeliveryAddress = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    userId: string;
    deliveryDetailId: string;
    addressId: string;
    addressUpdate: AddressTableUpdate;
    deliveryDetailUpdate: Pick<
      DeliveryDetailTableRow,
      "delivery_detail_full_name" | "delivery_detail_phone_number" | "delivery_detail_is_default"
    >;
  },
) => {
  const { userId, deliveryDetailId, addressId, addressUpdate, deliveryDetailUpdate } = params;

  const { error: addressError } = await supabaseClient
    .from("address_table")
    .update(addressUpdate)
    .eq("address_id", addressId);
  if (addressError) throw addressError;

  if (deliveryDetailUpdate.delivery_detail_is_default) {
    const { error: defaultError } = await supabaseClient
      .from("delivery_detail_table")
      .update({ delivery_detail_is_default: false })
      .eq("delivery_detail_user_id", userId)
      .eq("delivery_detail_is_disabled", false)
      .neq("delivery_detail_id", deliveryDetailId);
    if (defaultError) throw defaultError;
  }

  const { error } = await supabaseClient
    .from("delivery_detail_table")
    .update(deliveryDetailUpdate)
    .eq("delivery_detail_id", deliveryDetailId)
    .eq("delivery_detail_user_id", userId);
  if (error) throw error;
};

export const deleteDeliveryAddress = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    userId: string;
    deliveryDetailId: string;
    wasDefault: boolean;
  },
) => {
  const { userId, deliveryDetailId, wasDefault } = params;

  const { error } = await supabaseClient
    .from("delivery_detail_table")
    .update({ delivery_detail_is_disabled: true, delivery_detail_is_default: false })
    .eq("delivery_detail_id", deliveryDetailId)
    .eq("delivery_detail_user_id", userId);
  if (error) throw error;

  if (!wasDefault) return;

  const { data, error: fetchError } = await supabaseClient
    .from("delivery_detail_table")
    .select("delivery_detail_id")
    .eq("delivery_detail_user_id", userId)
    .eq("delivery_detail_is_disabled", false)
    .order("delivery_detail_date_created", { ascending: false })
    .limit(1);
  if (fetchError) throw fetchError;

  const nextDefaultId = data?.[0]?.delivery_detail_id;
  if (!nextDefaultId) return;

  const { error: defaultError } = await supabaseClient
    .from("delivery_detail_table")
    .update({ delivery_detail_is_default: true })
    .eq("delivery_detail_id", nextDefaultId)
    .eq("delivery_detail_user_id", userId);
  if (defaultError) throw defaultError;
};
