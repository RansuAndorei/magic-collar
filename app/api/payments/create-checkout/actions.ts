import { Database } from "@/utils/database";
import { CheckoutTableInsert } from "@/utils/types";
import { SupabaseClient } from "@supabase/supabase-js";

export const getOrderItems = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    orderItemIdList: string[];
  },
) => {
  const { orderItemIdList } = params;
  const { data, error } = await supabaseClient
    .from("car_table")
    .select(
      `
        car_id,
        car_magic_collar: car_magic_collar_id!inner(
          magic_collar_down_payment_price,
          magic_collar_price_currency
        ),
        car_make: car_make_id!inner(
          make
        ),
          car_model: car_model_id(
          model
        ),
        car_model_code,
        car_model_year_start,
        car_model_year_end,
        car_image_attachment: car_image_attachment_id(
          attachment_path
        )
      `,
    )
    .in("car_id", orderItemIdList);
  if (error) throw error;
  return data;
};

export const createCheckout = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    checkoutData: CheckoutTableInsert;
  },
) => {
  const { checkoutData } = params;
  const { error } = await supabaseClient.from("checkout_table").insert(checkoutData);
  if (error) throw error;
};
