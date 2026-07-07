import { Database } from "@/utils/database";
import { SupabaseClient } from "@supabase/supabase-js";

export const sendResetPasswordEmail = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    email: string;
  },
) => {
  const { email } = params;
  await supabaseClient.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });
};
