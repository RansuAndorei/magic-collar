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
        delivery_detail_address: address_table(*)
      `,
    )
    .eq("delivery_detail_user_id", params.userId)
    .eq("delivery_detail_is_disabled", false)
    .order("delivery_detail_is_default", { ascending: false })
    .order("delivery_detail_date_created", { ascending: false });
  if (error) throw error;
  return data;
};

export const getPickupAddressList = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    userId: string;
  },
) => {
  const { data, error } = await supabaseClient
    .from("pickup_address_table")
    .select(
      `
        *,
        delivery_detail_address: address_table(*)
      `,
    )
    .eq("pickup_address_id", params.userId)
    .eq("pickup_address_is_disabled", false)
    .order("pickup_address_is_default", { ascending: false })
    .order("pickup_address_date_created", { ascending: false });
  if (error) throw error;
  return data;
};
