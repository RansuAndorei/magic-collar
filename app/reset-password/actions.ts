import { Database } from "@/utils/database";
import { SupabaseClient } from "@supabase/supabase-js";

export const resetPassword = async (
  supabaseClient: SupabaseClient<Database>,
  params: { password: string },
) => {
  const { password } = params;
  const { error } = await supabaseClient.auth.updateUser({ password });
  return { error: error };
};
