import { Database } from "@/utils/database";
import { OrderPaymentStatusEnum, OrderStatusEnum, OrderWithOrderItemType } from "@/utils/types";
import { SupabaseClient } from "@supabase/supabase-js";

export const getCustomerOrderList = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    userId: string;
    index: number;
    limit: number;
    search: string;
    orderStatus: OrderStatusEnum | "ALL";
    paymentStatus: OrderPaymentStatusEnum | "ALL";
  },
) => {
  const { data, error } = await supabaseClient.rpc("get_customer_order_list", {
    input_data: params,
  });
  if (error) throw error;
  return data as {
    orders: OrderWithOrderItemType[];
    totalCount: number;
  } | null;
};
