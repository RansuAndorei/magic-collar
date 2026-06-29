import { insertError } from "@/app/actions";
import { isAppError } from "@/utils/functions";
import { createSupabaseServerClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { getBatchLimit } from "../actions";
import { getAdminBatchDetail } from "./actions";
import AdminBatchDetailPage from "./components/AdminBatchDetailPage";

type Props = {
  params: Promise<{
    batchNumber: string;
  }>;
};

const Page = async ({ params }: Props) => {
  const { batchNumber } = await params;
  const supabaseClient = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabaseClient.auth.getUser();
  if (!user) redirect("/sign-in");

  try {
    const [batch, batchLimit] = await Promise.all([
      getAdminBatchDetail(supabaseClient, { batchNumber: Number(batchNumber) }),
      getBatchLimit(supabaseClient),
    ]);
    if (!batch) redirect("/error/404");

    return <AdminBatchDetailPage batch={batch} batchLimit={batchLimit} />;
  } catch (e) {
    if (isAppError(e)) {
      await insertError(supabaseClient, {
        errorTableInsert: {
          error_message: e.message,
          error_url: `/admin/batch/${batchNumber}`,
          error_function: "renderAdminBatchDetailPage",
          error_user_email: user.email,
          error_user_id: user.id,
        },
      });
    }
    redirect("/error/500");
  }
};

export default Page;
