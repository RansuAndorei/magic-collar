import { Database } from "@/utils/database";
import { BatchStatusLogTableRow } from "@/utils/types";
import { SupabaseClient } from "@supabase/supabase-js";

export const getCustomerOrder = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    userId: string;
    orderNumber: number;
  },
) => {
  const { userId, orderNumber } = params;

  const { data, error } = await supabaseClient
    .from("order_table")
    .select(
      `
        *,
        order_item: order_item_table(
          *,
          order_item_car_image_attachment: order_item_car_image_attachment_id!inner(*),
          order_item_batch: order_item_batch_id(*)
        )
      `,
    )
    .eq("order_user_id", userId)
    .eq("order_number", orderNumber)
    .eq("order_is_disabled", false)
    .eq("order_item_table.order_item_is_disabled", false)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return data;
};

export const createOrderPayment = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    attachment_bucket: string;
    attachment_name: string;
    attachment_path: string;
    attachment_mime_type: string;
    attachment_size: number;
    payment_channel_id: string;
    order_id: string;
  },
) => {
  const { error } = await supabaseClient.rpc("create_order_payment", {
    input_data: params,
  });
  if (error) throw error;
};

export const getPaymentChannelList = async (supabaseClient: SupabaseClient<Database>) => {
  const { data, error } = await supabaseClient
    .from("payment_channel_table")
    .select(
      `
        *,
        payment_channel_qr_code_attachment: payment_channel_qr_code_attachment_id(*)
      `,
    )
    .eq("payment_channel_is_disabled", false)
    .eq("payment_channel_is_active", true)
    .order("payment_channel_provider_name", { ascending: true });
  if (error) throw error;
  return data;
};

export const getOrderPaymentTotals = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    orderNumber: number;
  },
) => {
  const { data, error } = await supabaseClient.rpc("get_order_payment_totals", {
    input_data: params,
  });
  if (error) throw error;
  return data;
};

export const getOrderPayment = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    orderId: string;
    page: number;
    limit: number;
  },
) => {
  const { orderId, page, limit } = params;
  const start = (page - 1) * limit;

  const { data, count, error } = await supabaseClient
    .from("order_payment_table")
    .select(
      `
        *,
        order_payment_proof_attachment: order_payment_proof_attachment_id!inner(*),
        order_payment_payment_channel: order_payment_payment_channel_id!inner(*)
      `,
      { count: "exact" },
    )
    .eq("order_payment_order_id", orderId)
    .order("order_payment_date_created", { ascending: false })
    .range(start, start + limit - 1);

  if (error) throw error;

  return { data, count };
};

export const fetchOrderStatusLog = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    orderId: string;
  },
) => {
  const { orderId } = params;
  const { data, error } = await supabaseClient
    .from("order_status_log_table")
    .select("*")
    .eq("order_status_log_order_id", orderId)
    .order("order_status_log_date_created", { ascending: true });
  if (error) throw error;
  return data;
};

export const fetchBatchStatusLog = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    batchId: string;
  },
) => {
  const { batchId } = params;
  const { data, error } = await supabaseClient
    .from("batch_status_log_table")
    .select("*")
    .eq("batch_status_log_batch_id", batchId)
    .order("batch_status_log_date_created", { ascending: true });
  if (error) throw error;
  return data;
};

export const fetchOrderItemTimeline = async (
  supabaseClient: SupabaseClient<Database>,
  params: { orderItemId: string },
) => {
  const { orderItemId } = params;

  // 1. Get the order item to find its batch_id (nullable)
  const { data: orderItem, error: orderItemError } = await supabaseClient
    .from("order_item_table")
    .select("order_item_batch_id")
    .eq("order_item_id", orderItemId)
    .single();

  if (orderItemError) throw orderItemError;

  // 2. Fetch item status logs
  const { data: itemLogs, error: itemLogsError } = await supabaseClient
    .from("order_item_status_log_table")
    .select("*")
    .eq("order_item_status_log_order_item_id", orderItemId)
    .order("order_item_status_log_date_created", { ascending: true });

  if (itemLogsError) throw itemLogsError;

  // 3. Fetch batch status logs only if item is linked to a batch
  let batchLogs: BatchStatusLogTableRow[] = [];
  if (orderItem.order_item_batch_id) {
    const { data, error: batchLogsError } = await supabaseClient
      .from("batch_status_log_table")
      .select("*")
      .eq("batch_status_log_batch_id", orderItem.order_item_batch_id)
      .order("batch_status_log_date_created", { ascending: true });

    if (batchLogsError) throw batchLogsError;
    batchLogs = data ?? [];
  }

  return {
    itemLogs: itemLogs ?? [],
    batchLogs,
  };
};
