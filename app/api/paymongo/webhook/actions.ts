import { Database } from "@/utils/database";
import { PaymentTableUpdate } from "@/utils/types";
import { SupabaseClient } from "@supabase/supabase-js";

export const createOrder = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    orderData: {
      fulfillmentType: string;
      selectedAddressId: string;
      items: {
        id: string;
        quantity: number;
      }[];
    };
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
