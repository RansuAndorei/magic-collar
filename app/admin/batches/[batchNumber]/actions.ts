import { Database } from "@/utils/database";
import { AdminBatchDetail, BatchStatusEnum } from "@/utils/types";
import { SupabaseClient } from "@supabase/supabase-js";

export const getAdminBatchDetail = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    batchNumber: number;
  },
) => {
  const { batchNumber } = params;

  const { data, error } = await supabaseClient
    .from("batch_table")
    .select(
      `
        *,
        batch_order_item: order_item_table(
          *,
          order_item_order: order_item_order_id!inner(
            *,
            order_user: order_user_id!inner(*)
          )
        )
      `,
    )
    .eq("batch_number", batchNumber)
    .eq("batch_is_disabled", false)
    .maybeSingle();
  if (error) throw error;

  return {
    ...data,
    batch_order_quantity: data?.batch_order_item.reduce(
      (total, item) => total + item.order_item_quantity,
      0,
    ),
    batch_order_total: data?.batch_order_item.reduce(
      (total, item) => total + item.order_item_price * item.order_item_quantity,
      0,
    ),
  } as AdminBatchDetail;
};
