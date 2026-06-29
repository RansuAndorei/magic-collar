import { Database } from "@/utils/database";
import { AdminBatch, AdminBatchSortAccessor, BatchStatusEnum } from "@/utils/types";
import { SupabaseClient } from "@supabase/supabase-js";

export const getAdminBatchesPage = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    page: number;
    recordsPerPage: number;
    search: string;
    batchStatus: BatchStatusEnum | "ALL";
    sortColumnAccessor: AdminBatchSortAccessor;
    sortDirection: "asc" | "desc";
  },
) => {
  const { data, error } = await supabaseClient.rpc("get_admin_batches_page", {
    input_data: params,
  });
  if (error) throw error;

  return data as {
    records: AdminBatch[];
    totalRecords: number;
  };
};

export const getBatchLimit = async (supabaseClient: SupabaseClient<Database>) => {
  const { data, error } = await supabaseClient
    .from("system_setting_table")
    .select("system_setting_value")
    .eq("system_setting_key", "BATCH_LIMIT")
    .single();
  if (error) throw error;
  return Number(data.system_setting_value) ?? 0;
};

export const transitionBatchStatus = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    batchId: string;
    nextStatus: BatchStatusEnum;
    userId: string;
  },
) => {
  const { error } = await supabaseClient.rpc("transition_batch_status", { input_data: params });
  if (error) throw error;
};
