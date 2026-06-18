import { Database } from "@/utils/database";
import { Provider, SupabaseClient } from "@supabase/supabase-js";

export const signInUser = async (
  supabaseClient: SupabaseClient<Database>,
  params: { email: string; password: string },
) => {
  const { data, error } = await supabaseClient.auth.signInWithPassword({
    ...params,
  });

  return { data, error };
};

export const signInWithOAuth = async (
  supabaseClient: SupabaseClient<Database>,
  params: { provider: Provider },
) => {
  const { provider } = params;
  const { error } = await supabaseClient.auth.signInWithOAuth({
    provider: provider,
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  });
  if (error) throw error;
};
