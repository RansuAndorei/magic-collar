import { Database } from "@/utils/database";
import { AdminPaymentProof } from "@/utils/types";
import { SupabaseClient } from "@supabase/supabase-js";

export const getPendingPaymentProofs = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    page: number;
    recordsPerPage: number;
  },
) => {
  const { data, error } = await supabaseClient.rpc("get_pending_payment_proofs", {
    input_data: params,
  });
  if (error) throw error;
  return data as {
    records: AdminPaymentProof[];
    totalRecords: number;
  };
};

export const approvePaymentProof = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    orderPaymentId: string;
    transactionId: string;
    amount: number;
    processedByUserId: string;
  },
) => {
  const { error } = await supabaseClient.rpc("approve_payment_proof", {
    input_data: params,
  });
  if (error) throw error;
};

export const rejectPaymentProof = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    orderPaymentId: string;
    reason: string;
    processedByUserId: string;
  },
) => {
  const { error } = await supabaseClient.rpc("reject_payment_proof", {
    input_data: params,
  });
  if (error) throw error;
};

export const getOrderPaidTotal = async (
  supabaseClient: SupabaseClient<Database>,
  params: { orderId: string },
) => {
  const { data, error } = await supabaseClient.rpc("get_order_paid_total", {
    input_data: params,
  });
  if (error) throw error;
  return data;
};

export const checkTransactionIdDuplicate = async (
  supabaseClient: SupabaseClient<Database>,
  params: { transactionId: string },
) => {
  const { transactionId } = params;
  const { count, error } = await supabaseClient
    .from("order_payment_table")
    .select("*", { count: "exact", head: true })
    .eq("order_payment_transaction_id", transactionId)
    .eq("order_payment_request_status", "APPROVED");
  if (error) throw error;
  return !Boolean(count);
};
