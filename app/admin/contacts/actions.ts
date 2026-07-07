import { Database } from "@/utils/database";
import { SettingsEnum, SystemSettingTableRow } from "@/utils/types";
import { SupabaseClient } from "@supabase/supabase-js";

export const CONTACT_SETTING_KEYS = [
  "EMAIL",
  "PHONE_NUMBER",
  "MESSENGER",
  "FACEBOOK",
  "TIKTOK",
  "YOUTUBE",
  "INSTAGRAM",
] as const satisfies readonly SettingsEnum[];

export type ContactSettingKey = (typeof CONTACT_SETTING_KEYS)[number];

export const getContactSettings = async (supabaseClient: SupabaseClient<Database>) => {
  const { data, error } = await supabaseClient
    .from("system_setting_table")
    .select("*")
    .in("system_setting_key", CONTACT_SETTING_KEYS)
    .order("system_setting_key", { ascending: true });
  if (error) throw error;
  return data as SystemSettingTableRow[];
};

export const updateSettings = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    updates: { key: SettingsEnum; value: string }[];
    adminUserId: string;
  },
) => {
  const { error } = await supabaseClient.rpc("update_settings", { input_data: params });
  if (error) throw error;
};
