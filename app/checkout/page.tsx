import { insertError } from "@/app/actions";
import { getAllCar } from "@/app/shop/actions";
import { isAppError } from "@/utils/functions";
import { createSupabaseServerClient } from "@/utils/supabase/server";
import { CarShopType, CheckoutAddressType } from "@/utils/types";
import { redirect } from "next/navigation";
import { getCheckoutAddressList } from "./actions";
import CheckoutPage from "./components/CheckoutPage";

const Page = async () => {
  const supabaseClient = await createSupabaseServerClient();

  const carList: CarShopType[] = [];
  const addressList: CheckoutAddressType[] = [];

  try {
    const {
      data: { user },
    } = await supabaseClient.auth.getUser();

    const [carData, addressData] = await Promise.all([
      getAllCar(supabaseClient),
      user ? getCheckoutAddressList(supabaseClient, { userId: user.id }) : Promise.resolve([]),
    ]);

    carList.push(...carData);
    addressList.push(...addressData);
  } catch (e) {
    if (isAppError(e)) {
      await insertError(supabaseClient, {
        errorTableInsert: {
          error_message: e.message,
          error_url: "/checkout",
          error_function: "fetchCheckoutInitialData",
        },
      });
    }
    redirect("/checkout/error?reason=load-failed");
  }

  return <CheckoutPage carList={carList} addressList={addressList} />;
};

export default Page;
