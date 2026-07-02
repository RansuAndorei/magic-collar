import { Database } from "@/utils/database";
import {
  AdminPaymentChannelSortAccessor,
  AttachmentTableInsert,
  PaymentChannelTableInsert,
  PaymentChannelTableUpdate,
  PaymentChannelType,
} from "@/utils/types";
import { SupabaseClient } from "@supabase/supabase-js";

export const getAdminPaymentChannelPage = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    page: number;
    recordsPerPage: number;
    search: string;
    status: boolean | null;
    sortColumnAccessor: AdminPaymentChannelSortAccessor;
    sortDirection: "asc" | "desc";
  },
) => {
  const { data, error } = await supabaseClient.rpc("get_admin_payment_channel_page", {
    input_data: params,
  });
  if (error) throw error;
  return data as {
    records: PaymentChannelType[];
    totalRecords: number;
  };
};

export const checkPaymentChannelCount = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    paymentChannelId: string;
  },
) => {
  const { paymentChannelId } = params;
  const { count, error } = await supabaseClient
    .from("payment_channel_table")
    .select("*", { count: "exact", head: true })
    .neq("payment_channel_id", paymentChannelId)
    .eq("payment_channel_is_available", true)
    .eq("payment_channel_is_disabled", false);
  if (error) throw error;
  return Boolean(count);
};

export const setPaymentChannelAvailability = async (
  supabaseClient: SupabaseClient<Database>,
  params: { paymentChannelId: string; isAvailable: boolean; adminUserId: string },
) => {
  const { error } = await supabaseClient.rpc("set_payment_channel_availability", {
    input_data: params,
  });
  if (error) throw error;
};

export const deletePaymentChannel = async (
  supabaseClient: SupabaseClient<Database>,
  params: { paymentChannelId: string; adminUserId: string },
) => {
  const { error } = await supabaseClient.rpc("delete_payment_channel", {
    input_data: params,
  });
  if (error) throw error;
};

export const createPaymentChannel = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    attachmentInsert: AttachmentTableInsert;
    paymentChannelInsert: Omit<PaymentChannelTableInsert, "payment_channel_qr_code_attachment_id">;
  },
) => {
  const { error } = await supabaseClient.rpc("create_payment_channel", {
    input_data: params,
  });
  if (error) throw error;
};

export const updatePaymentChannel = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    paymentChannelId: string;
    attachmentId: string;
    attachmentData: AttachmentTableInsert | null;
    paymentChannelUpdate: PaymentChannelTableUpdate;
  },
) => {
  const { error } = await supabaseClient.rpc("update_payment_channel", {
    input_data: params,
  });
  if (error) throw error;
};
