import { isAppError } from "@/utils/functions";
import { createSupabaseServerClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { insertError } from "../../actions";
import AdminBatchesPage from "./components/AdminBatchesPage";
import { getBatchLimit } from "./actions";

const Page = async () => {
  const supabaseClient = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabaseClient.auth.getUser();
  if (!user) redirect("/sign-in");

  try {
    const batchLimit = await getBatchLimit(supabaseClient);

    return <AdminBatchesPage batchLimit={batchLimit}/>;
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
};

export default Page;
