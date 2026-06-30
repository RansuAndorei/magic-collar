import { insertError } from "@/app/actions";
import { getAllCar } from "@/app/shop/actions";
import { isAppError } from "@/utils/functions";
import { createSupabaseServerClient } from "@/utils/supabase/server";
import { CarShopType, CheckoutAddressType, PickupAddressType } from "@/utils/types";
import { redirect } from "next/navigation";
import { getCheckoutAddressList, getCourierList, getPickupAddressList } from "./actions";
import CheckoutPage from "./components/CheckoutPage";

const Page = async () => {
  const supabaseClient = await createSupabaseServerClient();

  const carList: CarShopType[] = [];
  const checkoutAddressList: CheckoutAddressType[] = [];
  const pickupAddressList: PickupAddressType[] = [];
  const courierList: string[] = [];
  try {
    const {
      data: { user },
    } = await supabaseClient.auth.getUser();

    const [carData, userAddressData, pickupAddressData, courierData] = await Promise.all([
      getAllCar(supabaseClient),
      user ? getCheckoutAddressList(supabaseClient, { userId: user.id }) : Promise.resolve([]),
      getPickupAddressList(supabaseClient),
      getCourierList(supabaseClient),
    ]);

    carList.push(...carData);
    checkoutAddressList.push(...userAddressData);
    pickupAddressList.push(...pickupAddressData);
    courierList.push(...courierData);
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

  return (
    <CheckoutPage
      carList={carList}
      checkoutAddressList={checkoutAddressList}
      pickupAddressList={pickupAddressList}
      courierList={courierList}
    />
  );
};

export default Page;
