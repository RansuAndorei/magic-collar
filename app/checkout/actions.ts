import { Database } from "@/utils/database";
import { SupabaseClient } from "@supabase/supabase-js";

export const getCheckoutAddressList = async (
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
  return data;
};

export const getPickupAddressList = async (supabaseClient: SupabaseClient<Database>) => {
  const { data, error } = await supabaseClient
    .from("pickup_address_table")
    .select(
      `
        *,
        pickup_address: pickup_address_address_id(*)
      `,
    )
    .eq("pickup_address_is_disabled", false)
    .order("pickup_address_is_available", { ascending: false })
    .order("pickup_address_date_created", { ascending: false });
  if (error) throw error;
  return data;
};

export const getCourierList = async (supabaseClient: SupabaseClient<Database>) => {
  const { data, error } = await supabaseClient
    .from("courier_table")
    .select("courier_name")
    .eq("courier_is_available", true)
    .eq("courier_is_disabled", false)
    .order("courier_name", { ascending: true });
  if (error) throw error;
  return data.map((value) => value.courier_name);
};
