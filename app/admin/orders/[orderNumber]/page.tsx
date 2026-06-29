import { insertError } from "@/app/actions";
import {
  getCustomerOrder,
  getOrderPaymentTotals,
  getPaymentChannelList,
} from "@/app/user/orders/[orderNumber]/actions";
import OrderDetailPage from "@/app/user/orders/[orderNumber]/components/OrderDetailPage";
import { isAppError } from "@/utils/functions";
import { createSupabaseServerClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

type Props = {
  params: Promise<{
    orderNumber: number;
  }>;
};

const Page = async ({ params }: Props) => {
  const { orderNumber } = await params;
  const supabaseClient = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabaseClient.auth.getUser();
  if (!user) redirect("/sign-in");

  try {
    const [order, paymentChannelList, approvedPaymentTotal] = await Promise.all([
      getCustomerOrder(supabaseClient, {
        userId: user.id,
        orderNumber,
      }),
      getPaymentChannelList(supabaseClient),
      getOrderPaymentTotals(supabaseClient, { orderNumber }),
    ]);
    if (!order) redirect("/error/404");

    return (
      <OrderDetailPage
        order={order}
        paymentChannelList={paymentChannelList}
       approvedPaymentTotal={approvedPaymentTotal}
      />
    );
  } catch (e) {
    if (isAppError(e)) {
      await insertError(supabaseClient, {
        errorTableInsert: {
          error_message: e.message,
          error_url: `/user/orders/${orderNumber}`,
          error_function: "fetchAdminOrdersPageInitialData",
          error_user_email: user.email,
          error_user_id: user.id,
        },
      });
    }
    redirect("/error/500");
  }
};

export default Page;
