import { Database } from "@/utils/database";
import { SupabaseClient } from "@supabase/supabase-js";

export const checkIfEmailExists = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    email: string;
  },
) => {
  const { email } = params;
  const { count, error } = await supabaseClient
    .from("user_table")
    .select("*", { count: "exact", head: true })
    .eq("user_email", email);
  if (error) throw error;
  return Boolean(count);
};

export const getEmailResendTimer = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    email: string;
  },
) => {
  const { data, error } = await supabaseClient.rpc("get_email_resend_timer", {
    input_data: params,
  });
  if (error) throw error;

  return data;
};

export const signUpUser = async (
  supabaseClient: SupabaseClient<Database>,
  params: { email: string; password: string },
) => {
  const { data, error } = await supabaseClient.auth.signUp({
    ...params,
    options: {
      emailRedirectTo: `${window.location.origin}/auth/callback`,
    },
  });
  if (error) throw error;

  if (data.user && data.user.identities && data.user.identities?.length > 0) {
    return { data };
  } else {
    return { data, customError: "Email already registered." };
  }
};
