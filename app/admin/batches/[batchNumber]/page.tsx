import { insertError } from "@/app/actions";
import { isAppError } from "@/utils/functions";
import { createSupabaseServerClient } from "@/utils/supabase/server";
import { AdminBatchDetail } from "@/utils/types";
import { redirect } from "next/navigation";
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

  let batch: AdminBatchDetail;
  try {
    batch = await getAdminBatchDetail(supabaseClient, {
      batchNumber: Number(batchNumber),
    });
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
  if (!batch) {
    redirect("/error/404");
  }

  return <AdminBatchDetailPage batch={batch} />;
};

export default Page;
