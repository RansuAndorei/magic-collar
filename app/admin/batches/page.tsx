import { isAppError } from "@/utils/functions";
import { createSupabaseServerClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { insertError } from "../../actions";
import { getBatchLimit } from "./actions";
import AdminBatchesPage from "./components/AdminBatchesPage";

const Page = async () => {
  const supabaseClient = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabaseClient.auth.getUser();
  if (!user) redirect("/sign-in");

  let batchLimit;
  try {
    batchLimit = await getBatchLimit(supabaseClient);
  } catch (e) {
    if (isAppError(e)) {
      await insertError(supabaseClient, {
        errorTableInsert: {
          error_message: e.message,
          error_url: "/admin/batches",
          error_function: "renderAdminBatchesPage",
          error_user_email: user.email,
          error_user_id: user.id,
        },
      });
    }

    redirect("/error/500");
  }

  return <AdminBatchesPage batchLimit={batchLimit} />;
};

export default Page;
