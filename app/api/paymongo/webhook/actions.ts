import { Database } from "@/utils/database";
import { CreateCheckoutReqType, PaymentTableUpdate } from "@/utils/types";
import { SupabaseClient } from "@supabase/supabase-js";

export const createOrder = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    orderData: CreateCheckoutReqType["orderData"];
    totalQuantity: number;
    userId: string;
    paymentFeePercentage: number;
    paymentData: PaymentTableUpdate;
  },
) => {
  const { data, error } = await supabaseClient.rpc("create_order", {
    input_data: params,
  });
  if (error) throw error;
  return data;
};
