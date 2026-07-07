import { isAppError } from "@/utils/functions";
import { createSupabaseServerClient } from "@/utils/supabase/server";
import { CarShopType, SettingsEnum } from "@/utils/types";
import { redirect } from "next/navigation";
import { fetchSocials, fetchTopItems, insertError } from "./actions";
import HomePage from "./components/HomePage/HomePage";

const Page = async () => {
  const supabaseClient = await createSupabaseServerClient();

  let topItems: CarShopType[];
  let socials: Record<SettingsEnum, string | null>;
  try {
    const [topItemsData, socialsData] = await Promise.all([
      fetchTopItems(supabaseClient, { numberOfItem: 5 }),
      fetchSocials(supabaseClient, { socials: ["EMAIL", "FACEBOOK", "MESSENGER", "PHONE_NUMBER"] }),
    ]);
    topItems = topItemsData;
    socials = socialsData;
  } catch (e) {
    if (isAppError(e)) {
      await insertError(supabaseClient, {
        errorTableInsert: {
          error_message: e.message,
          error_url: "/",
          error_function: "fetchHomeInitialData",
        },
      });
    }
    redirect("/error/500");
  }

  return <HomePage topItems={topItems} socials={socials} />;
};

export default Page;
