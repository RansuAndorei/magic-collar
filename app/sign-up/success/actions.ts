import { Database } from "@/utils/database";
import { SupabaseClient } from "@supabase/supabase-js";

export const resendEmail = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    email: string;
  },
) => {
  const { email } = params;
  const { error } = await supabaseClient.auth.resend({
    type: "signup",
    email,
  });
  if (error) throw error;
};

export const insertResendEmail = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    email: string;
  },
) => {
  const { email } = params;
  const { error } = await supabaseClient.from("email_resend_table").insert({
    email_resend_email: email,
  });
  if (error) throw error;
};
