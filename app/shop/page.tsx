import { isAppError } from "@/utils/functions";
import { createSupabaseServerClient } from "@/utils/supabase/server";
import { CarShopType, OptionType } from "@/utils/types";

import { redirect } from "next/navigation";
import { insertError } from "../actions";
import { getAllCar, getAllMake, getAllModel } from "./actions";
import ShopPage from "./components/ShopPage";

const Page = async () => {
  const supabaseClient = await createSupabaseServerClient();

  const makeList: OptionType[] = [];
  const modelList: (OptionType & { makeId: string })[] = [];
  const carList: CarShopType[] = [];
  try {
    const [makeData, modelData, carData] = await Promise.all([
      getAllMake(supabaseClient),
      getAllModel(supabaseClient),
      getAllCar(supabaseClient),
    ]);
    makeList.push(...makeData);
    modelList.push(...modelData);
    carList.push(...carData);
  } catch (e) {
    if (isAppError(e)) {
      await insertError(supabaseClient, {
        errorTableInsert: {
          error_message: e.message,
          error_url: "/",
          error_function: "fetchShopInitialData",
        },
      });
    }
    redirect("/error/500");
  }

  return <ShopPage makeList={makeList} modelList={modelList} carList={carList} />;
};

export default Page;
