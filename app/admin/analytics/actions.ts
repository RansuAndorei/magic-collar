import { Database } from "@/utils/database";
import { AdminAnalyticsDashboard } from "@/utils/types";
import { SupabaseClient } from "@supabase/supabase-js";

export const getAdminAnalyticsDashboard = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    months?: number;
    topLimit?: number;
    lowStockThreshold?: number;
  } = {},
) => {
  const { data, error } = await (supabaseClient as unknown as SupabaseClient).rpc(
    "get_admin_analytics_dashboard",
    {
      input_data: {
        months: params.months ?? 6,
        topLimit: params.topLimit ?? 5,
        lowStockThreshold: params.lowStockThreshold ?? 5,
      },
    },
  );
  if (error) throw error;
  return data as unknown as AdminAnalyticsDashboard;
};
