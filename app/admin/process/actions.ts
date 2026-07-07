import { Database } from "@/utils/database";
import { SupabaseClient } from "@supabase/supabase-js";

export const PROCESS_SETTING_KEYS = ["BATCH_LIMIT", "ORDER_EXPIRATION_IN_DAYS"] as const;
export type ProcessSettingKey = (typeof PROCESS_SETTING_KEYS)[number];

export const getProcessSettings = async (supabaseClient: SupabaseClient<Database>) => {
  const { data, error } = await supabaseClient
    .from("system_setting_table")
    .select("*")
    .in("system_setting_key", PROCESS_SETTING_KEYS);
  if (error) throw error;
  return data;
};
