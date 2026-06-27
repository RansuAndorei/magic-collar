import { isAppError } from "@/utils/functions";
import { createSupabaseServerClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { insertError } from "../../actions";
import {
  getAdminMakeOptions,
  getAdminModelOptions,
  getCarTotalCount,
  getMagicCollarTotalCount,
  getVisiblePageStock,
} from "./actions";
import CarsMagicCollarsPage from "./components/CarsMagicCollarsPage";

const Page = async () => {
  const supabaseClient = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabaseClient.auth.getUser();
  if (!user) redirect("/sign-in");

  const makeList: string[] = [];
  const modelList: Record<string, string[]> = {};
  let carTotal = 0;
  let magicCollarTotal = 0;
  let visibleStackCount = 0;
  try {
    const [fetchedCarTotal, fetchedMagicCollarTotal, makeData, modelData, visibleStockData] =
      await Promise.all([
        getCarTotalCount(supabaseClient),
        getMagicCollarTotalCount(supabaseClient),
        getAdminMakeOptions(supabaseClient),
        getAdminModelOptions(supabaseClient),
        getVisiblePageStock(supabaseClient),
      ]);
    carTotal = fetchedCarTotal;
    magicCollarTotal = fetchedMagicCollarTotal;
    visibleStackCount = visibleStockData;
    makeList.push(...makeData.map(({ label }) => label));
    const makeMap = new Map(makeData.map((make) => [make.value, make.label]));
    for (const model of modelData) {
      const makeLabel = makeMap.get(model.makeId);
      if (!makeLabel) continue;
      modelList[makeLabel] ??= [];
      modelList[makeLabel].push(model.label);
    }
  } catch (e) {
    if (isAppError(e)) {
      await insertError(supabaseClient, {
        errorTableInsert: {
          error_message: e.message,
          error_url: "/admin/cars-magic-collars",
          error_function: "fetchAdminCatalogInitialData",
          error_user_email: user.email,
          error_user_id: user.id,
        },
      });
    }
    redirect("/error/500");
  }

  return (
    <CarsMagicCollarsPage
      carTotal={carTotal}
      magicCollarTotal={magicCollarTotal}
      visibleStackCount={visibleStackCount}
      makeList={makeList}
      modelList={modelList}
    />
  );
};

export default Page;
