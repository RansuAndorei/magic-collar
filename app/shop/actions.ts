import { FETCH_OPTION_LIMIT } from "@/utils/constants";
import { Database } from "@/utils/database";
import { CarShopType, OptionType } from "@/utils/types";
import { SupabaseClient } from "@supabase/supabase-js";

export const getAllMake = async (supabaseClient: SupabaseClient<Database>) => {
  const makeList: OptionType[] = [];
  let offset = 0;
  while (true) {
    const { data, error } = await supabaseClient
      .from("make_table")
      .select("value: make_id, label: make")
      .eq("make_is_disabled", false)
      .eq("make_is_available", true)
      .order("make", { ascending: true })
      .range(offset, offset + FETCH_OPTION_LIMIT - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;
    makeList.push(...data);
    if (data.length < FETCH_OPTION_LIMIT) break;
    offset += FETCH_OPTION_LIMIT;
  }
  return makeList;
};

export const getAllModel = async (supabaseClient: SupabaseClient<Database>) => {
  const modelList: (OptionType & { makeId: string })[] = [];
  let offset = 0;
  while (true) {
    const { data, error } = await supabaseClient
      .from("model_table")
      .select("value: model_id, label: model, makeId: model_make_id")
      .eq("model_is_disabled", false)
      .eq("model_is_available", true)
      .order("model", { ascending: true })
      .range(offset, offset + FETCH_OPTION_LIMIT - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;
    modelList.push(...data);
    if (data.length < FETCH_OPTION_LIMIT) break;
    offset += FETCH_OPTION_LIMIT;
  }
  return modelList;
};

export const getAllCar = async (supabaseClient: SupabaseClient<Database>) => {
  let index = 0;
  const carList: CarShopType[] = [];
  while (true) {
    const { data, error } = await supabaseClient.rpc("get_all_car", {
      input_data: {
        index,
        limit: FETCH_OPTION_LIMIT,
      },
    });
    if (error) throw error;
    const formattedData = data as CarShopType[];
    if (!data || formattedData.length === 0) break;
    carList.push(...formattedData);
    index += FETCH_OPTION_LIMIT;
  }
  return carList;
};

export const getCheckoutStatus = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    checkoutId: string;
  },
) => {
  const { checkoutId } = params;
  const { data, error } = await supabaseClient
    .from("checkout_table")
    .select("payment: payment_table!inner(payment_status)")
    .eq("checkout_id", checkoutId)
    .maybeSingle();
  if (error) throw error;
  return data?.payment[0].payment_status;
};
