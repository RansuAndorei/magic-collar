import { Database } from "@/utils/database";
import { UserTableUpdate } from "@/utils/types";
import { SupabaseClient } from "@supabase/supabase-js";

export const updateUser = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    userData: UserTableUpdate;
    userId: string;
  },
) => {
  const { userData, userId } = params;
  const { error } = await supabaseClient.from("user_table").update(userData).eq("user_id", userId);
  if (error) throw error;
};

export const resetPassword = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    password: string;
  },
) => {
  const { password } = params;
  const { error } = await supabaseClient.auth.updateUser({ password });
  return { error: error };
};
