import { Database } from "@/utils/database";
import {
  AdminOrder,
  AdminOrderSortAccessor,
  OrderFulfillmentEnum,
  OrderPaymentStatusEnum,
  OrderStatusEnum,
} from "@/utils/types";
import { SupabaseClient } from "@supabase/supabase-js";

export const getAdminOrdersPage = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    page: number;
    recordsPerPage: number;
    search: string;
    orderStatus: OrderStatusEnum | "ALL";
    paymentStatus: OrderPaymentStatusEnum | "ALL";
    fulfillment: OrderFulfillmentEnum | "ALL";
    sortColumnAccessor: AdminOrderSortAccessor;
    sortDirection: "asc" | "desc";
  },
) => {
  const { data, error } = await supabaseClient.rpc("get_admin_orders_page", {
    input_data: params,
  });
  if (error) throw error;
  return data as {
    records: AdminOrder[];
    totalRecords: number;
  };
};
